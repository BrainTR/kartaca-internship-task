const fs = require('fs');
const mongoose = require('mongoose');
const config = require('../../config/config.js');
const Log = require('../models/logModel.js');

const MAX_DELAY = 3000; // milliseconds
const MAX_CHART_RANGE = 60 * 60; // seconds

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

const apiController = {
    randResponse: async (req, res, next) => {
        let method = req.method;
        let delay = getRandomInt(MAX_DELAY);
        let timestamp = Math.floor(Date.now() / 1000);

        setTimeout(() => {
            let log = [method, delay, timestamp].join(',');
            fs.appendFile(config.LOG.PATH, log + "\n", (err) => {
                if (err) {
                    next(err);
                } else {
                    res.json({status: true});
                }
            });
        }, delay);
    },
    getLogs: async (req, res) => {
        res.set('Access-Control-Allow-Origin', '*');

        const startTimestamp = Date.now() - (MAX_CHART_RANGE * 1000);

        let where = {
            timestamp: {
                $gte: startTimestamp
            }
        }

        if ('afterId' in req.query && mongoose.Types.ObjectId.isValid(req.query.afterId)) {
            where._id = {
                $gt: mongoose.Types.ObjectId(req.query.afterId)
            };
        }

        let result = {
            lastLogId: null,
            logs: []
        }

        for await (const log of Log.find(where).sort('_id').lean().batchSize(1000000)) {
            result.lastLogId = log._id;
            result.logs.push({
                method: log.method,
                delay: log.delay,
                timestamp: log.timestamp
            });
        }

        res.json(result);
    }
};

module.exports = apiController;