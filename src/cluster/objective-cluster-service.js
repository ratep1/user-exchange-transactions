/**
 * 
 * Communication service between server and Redis.
 * 
 * map: objectives
 * data: userId: array(tasks)
 * 
 */

const redisCommands = require('../modules/redis/redis-commands');

const userClusterService = require('./user-cluster-service');
const taskClusterService = require('./task-cluster-service');

const ObjectiveEntity = require('../models/ObjectiveEntity');

const errorUtility = require('../modules/utils/error-utility');

const { objectives: objectiveKey } = require('../modules/redis/redis-constants').keys;

class ObjectiveClusterService {
    static fetchAll() {
        return redisCommands.hgetall(objectiveKey)
        .then(result => {
            return Object.keys(result).map(key => ObjectiveEntity.parseString(key, result[key]));
        })
        .catch(error => {
            throw error;
        });
    }
    
    static fetchById(id) {
        if(!id || typeof id !== "string") {
            return Promise.reject(new Error("Invalid id"));
        }
    
        return redisCommands.hget(objectiveKey, id)
        .then(result => {
            return result ? ObjectiveEntity.parseString(id, result) : null;
        })
        .catch(error => {
            throw error;
        });
    }
    
    static create(userId, taskId, timestamp) {
        if(!userId || typeof userId !== "string") {
            return Promise.reject(new Error("Invalid userId"));
        }

        if(!taskId || typeof taskId !== "string") {
            return Promise.reject(new Error("Invalid userId"));
        }

        if(!timestamp) {
            timestamp = +new Date();
        }

        let user, task = null;
        let objectives = [];
    
        return userClusterService.fetchById(userId)
        .then(entity => {
            if(!entity) {
                throw errorUtility.createError(404, `User does not exists`);
            }

            user = entity;
    
            return taskClusterService.fetchById(taskId);
        })
        .then(entity => {
            if(!entity) {
                throw errorUtility.createError(404, `Task does not exists`);
            }

            task = entity;
            task.setTimestamp(timestamp);

            return this.fetchById(userId);
        })
        .then(entities => {
            if(entities && entities.tasks && Array.isArray(entities.tasks)) {
                objectives = objectives.concat(entities.tasks);
            }

            objectives.push(task);

            return redisCommands.hset(objectiveKey, userId, objectives);
        })
        .then(result => {
            return userClusterService.incrementValue(userId, task.value);
        })
        .then(result => {
            return this.fetchById(userId);
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
    
            return redisCommands.hset(objectiveKey, id, entity);
        })
        .then(result => {
            return this.fetchById(id);
        })
        .catch(error => {
            throw error;
        });
    }
}

module.exports = ObjectiveClusterService;