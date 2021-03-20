const { Kafka, logLevel } = require('kafkajs');
const mongoose = require('mongoose');
const config = require('../config/config.js');
const Log = require('../web/models/logModel.js');

const run = async () => {

    const kafka = new Kafka({
        clientId: 'logger',
        brokers: config.KAFKA.BROKERS,
        logLevel: logLevel.ERROR,
        retry: {
            retries: 10
        }
    });
    
    const consumer = kafka.consumer({ groupId: 'log-consumer' });

    await mongoose.connect(config.MONGODB.URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
    }).then(() => {
        console.log('MongoDB: Connected')
    }).catch(err => {
        console.error(err)
    });

    await consumer.connect();
    await consumer.subscribe({ topic: config.KAFKA.TOPIC, fromBeginning: false });
    
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log('New data received from kafka, inserting to db. [' + message.value + ']');
            
            const data = message.value.toString().split(',');
            const newLog = new Log({ method: data[0], delay: parseInt(data[1]), timestamp: parseInt(data[2]) * 1000 });
            
            newLog.save((err) => {
                if (err) {
                    console.log(err);
                }
            });
        },
    });
    
};

run().catch(console.error);

process.on('SIGINT', async () => {
    try {
        await consumer.disconnect();
    } finally {
        process.kill(process.pid, 'SIGINT');
    }
});