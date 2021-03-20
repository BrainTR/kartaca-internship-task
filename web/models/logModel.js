const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    method: String,
    delay: Number,
    timestamp: {
        type: Date,
        index: true
    }
}, {
    versionKey: false
});

module.exports = mongoose.model('Log', LogSchema);