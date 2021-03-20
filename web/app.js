const express = require('express');
const mongoose = require('mongoose');
const compression = require('compression');
const config = require('../config/config.js');

const run = async () => {

    await mongoose.connect(config.MONGODB.URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
    }).then(() => {
        console.log('MongoDB: Connected')
    }).catch(err => {
        console.error(err)
    });

    const app = express();

    app.use(compression())

    app.use(express.static(__dirname + '/public', {
        'index': ['dashboard.html']
    }));
    
    app.use('/api', require('./routes/api.js'));

    app.listen(config.HTTP.PORT, () =>
        console.log('HTTP: Server started on port ' + config.HTTP.PORT),
    );

};

run().catch(console.error);