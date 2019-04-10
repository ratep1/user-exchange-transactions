const logger = require('./modules/logger');
const config = require('../config/config');

const express = require('./modules/express');
const redis = require('./modules/redis/redis');

const clusterInitialSetup = require('./cluster/cluster-initial-setup');

let app = null;
let redisClient = null;

const initialize = () => {
    if(!app) {
        app = express();
        redisClient = redis();

        clusterInitialSetup();
    }
}

module.exports = initialize;