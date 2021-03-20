const { Kafka } = require('kafkajs');
const { Tail } = require('tail');
const fs = require('fs');
const config = require('../config/config.js');

const run = async () => {

    const kafka = new Kafka({
        clientId: 'logger',
        brokers: config.KAFKA.BROKERS,
        retry: {
            retries: 10
        }
    });

    const admin = kafka.admin();
    const producer = kafka.producer();

    fs.appendFileSync(config.LOG.PATH, '');
    const logTail = new Tail(config.LOG.PATH);

    await admin.connect();
    await producer.connect();

    let topics = await admin.listTopics();
    if (topics.includes(config.KAFKA.TOPIC) == false) {
        await admin.createTopics({
            topics: [{
                topic: config.KAFKA.TOPIC
            }]
        });
    }

    logTail.on('line', async (data) => {
        console.log('New data detected, sending to kafka. [' + data + ']');
        await producer.send({
            topic: config.KAFKA.TOPIC,
            messages: [{
                value: data
            }]
        });
    });

};

run().catch(console.error);