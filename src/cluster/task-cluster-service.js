const redisCommands = require('../modules/redis/redis-commands');

const errorUtility = require('../modules/utils/error-utility');

const TaskEntity = require('../models/TaskEntity');

const { tasks: taskKey } = require('../modules/redis/redis-constants').keys;

class TaskClusterService {
    static fetchAll() {
        return redisCommands.hgetall(taskKey)
        .then(result => {
            return Object.keys(result).map(key => TaskEntity.parseString(result[key]));
        })
        .catch(error => {
            throw error;
        });
    }
    
    static fetchById(id) {
        if(!id || typeof id !== "string") {
            return Promise.reject(new Error("Invalid id"));
        }
    
        return redisCommands.hget(taskKey, id)
        .then(result => {
            return result ? TaskEntity.parseString(result) : null;
        })
        .catch(error => {
            throw error;
        });
    }
    
    static create(id, name, value) {
        if(!id || typeof id !== "string") {
            id = +new Date();
        }

        if(!name || typeof name !== "string") {
            return Promise.reject(new Error("Invalid name"));
        }

        value = parseFloat(value);

        if(!value || typeof value !== "number") {
            return Promise.reject(new Error("Invalid value"));
        }
    
        return this.fetchById(id)
        .then(entity => {
            if(entity) {
                throw errorUtility.createError(409, `User already exists`);
            }

            const data = {
                id: id,
                name: name,
                value: value
            }
    
            return redisCommands.hset(taskKey, id, data);
        })
        .then(result => {
            return this.fetchById(id);
        })
        .catch(error => {
            throw error;
        });
    }
    
    static updateValue(id, newValue) {
        if(!id || typeof id !== "string") {
            return Promise.reject(new Error("Invalid id"));
        }
    
        newValue = parseFloat(newValue);
    
        if(!newValue || typeof newValue !== "number") {
            return Promise.reject(new Error("Invalid value"));
        }
    
        return this.fetchById(id)
        .then(entity => {
            if(!entity) {
                throw errorUtility.createError(404, `User does not exists`);
            }
    
            entity.value = newValue;
    
            return redisCommands.hset(taskKey, id, entity);
        })
        .then(result => {
            return this.fetchById(id);
        })
        .catch(error => {
            throw error;
        });
    }
}

const createObject = (stringObject) => {
    let data = null;

    try {
        data = JSON.parse(stringObject);
        data.value = parseFloat(data.value);
    }
    catch(error) { }

    return data;
}

module.exports = TaskClusterService;