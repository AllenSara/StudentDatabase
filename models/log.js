const mongoose = require('mongoose');

// schema for log
const log_schema = new mongoose.Schema({
    method: {
        type: String,
        required: true
    },
    when: {
        type: Date,
        default: Date.now,
        required: true,
    },
    runmode: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true,
    }
}, { collection: 'log' });

const log = global.uri_academylog.model('', log_schema);
module.exports = log;