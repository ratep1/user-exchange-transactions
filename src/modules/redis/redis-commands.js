const redis = require('./redis')();

const hgetall = (key) => {
    return new Promise((resolve, reject) => {
        redis.hgetall(key, (error, result) => {
            if(error) {
                reject(error);
            }
            else {
                resolve(result);
            }
        })
    });
}

const hget = (key, field) => {
    return new Promise((resolve, reject) => {
        redis.hget(key, field, (error, result) => {
            if(error) {
                reject(error);
            }
            else {
                resolve(result);
            }
        });
    });
}

const hset = (key, field, value) => {
    return new Promise((resolve, reject) => {
        redis.hset(key, field, JSON.stringify(value), (error, result) => {
            if(error) {
                reject(error);
            }
            else {
                resolve(result);
            }
        });
    });
}

module.exports = {
    hgetall,
    hget,
    hset
}