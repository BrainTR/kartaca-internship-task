const config = {
    HTTP: {
        PORT: 80,
    },
    LOG: {
        PATH: 'logs/access.log',
    },
    KAFKA: {
        BROKERS: ['kafka:9092'],
        TOPIC: 'logs'
    },
    MONGODB: {
        URI: 'mongodb://mongodb:27017/logdb'
    },
};

module.exports = config