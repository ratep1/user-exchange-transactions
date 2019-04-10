const redis = require('redis');
const redisConnectionPool = require('redis-connection-pool');

const config = require('../../../config/config');

let client = null;

const initialize = () => {
    if(!client) {
        const { redis } = config;

        const name = redis && redis.name ? redis.name : 'stormxPool';
        const host = redis && redis.host ? redis.host : 'localhost';
        const port = redis && redis.port ? redis.port : '6379';
        const maxClients = redis && redis.maxClients ? redis.maxClients : '100';

        client = redisConnectionPool(name, {
            host: host,
            port: port,
            maxClients: maxClients
        });
    }

    return client;
}

module.exports = initialize;