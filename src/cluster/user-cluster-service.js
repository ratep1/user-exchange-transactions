const redisCommands = require('../modules/redis/redis-commands');

const UserEntity = require('../models/UserEntity');

const errorUtility = require('../modules/utils/error-utility');

const { users: usersKey } = require('../modules/redis/redis-constants').keys;
const { userValueDefault } = require('../system-constants');

class UserClusterService {
    static fetchAll() {
        return redisCommands.hgetall(usersKey)
        .then(result => {
            return Object.keys(result).map(key => UserEntity.parseString(result[key]));
        })
        .catch(error => {
            throw error;
        });
    }
    
    static fetchById(id) {
        if(!id || typeof id !== "string") {
            return Promise.reject(new Error("Invalid id"));
        }
    
        return redisCommands.hget(usersKey, id)
        .then(result => {
            return result ? UserEntity.parseString(result) : null;
        })
        .catch(error => {
            throw error;
        });
    }
    
    static create(id, role) {
        if(!id || typeof id !== "string") {
            return Promise.reject(new Error("Invalid id"));
        }

        if(!role || (role !== 'user' && role !== 'admin')) {
            role = 'user';
        }
    
        return this.fetchById(id)
        .then(entity => {
            if(entity) {
                throw errorUtility.createError(409, `User already exists`);
            }

            const user = { id, role, value: userValueDefault };
    
            return redisCommands.hset(usersKey, id, user);
        })
        .then(result => {
            return this.fetchById(id);
        })
        .catch(error => {
            throw error;
        });
    }
    
    static incrementValue(id, addAmount) {
        if(!id || typeof id !== "string") {
            return Promise.reject(new Error("Invalid id"));
        }
    
        addAmount = parseFloat(addAmount);
    
        if(!addAmount || typeof addAmount !== "number") {
            return Promise.reject(new Error("Invalid value"));
        }
    
        return this.fetchById(id)
        .then(entity => {
            if(!entity) {
                throw errorUtility.createError(404, `User does not exists`);
            }
    
            entity.incrementValue(addAmount);
    
            return redisCommands.hset(usersKey, id, entity);
        })
        .then(result => {
            return this.fetchById(id);
        })
        .catch(error => {
            throw error;
        });
    }

    static decrementValue(id, decreseAmount) {
        if(!id || typeof id !== "string") {
            return Promise.reject(new Error("Invalid id"));
        }
    
        decreseAmount = parseFloat(decreseAmount);
    
        if(!decreseAmount || typeof decreseAmount !== "number") {
            return Promise.reject(new Error("Invalid value"));
        }
    
        return this.fetchById(id)
        .then(entity => {
            if(!entity) {
                throw errorUtility.createError(404, `User does not exists`);
            }
    
            entity.decrementValue(decreseAmount);
    
            return redisCommands.hset(usersKey, id, entity);
        })
        .then(result => {
            return this.fetchById(id);
        })
        .catch(error => {
            throw error;
        });
    }
}

module.exports = UserClusterService