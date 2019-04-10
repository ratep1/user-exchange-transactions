const redisCommands = require('../modules/redis/redis-commands');

const userClusterController = require('./user-cluster-controller');
const taskClusterController = require('./task-cluster-controller');

const { objectives: objectiveKey } = require('../modules/redis/redis-constants').keys;

class TaskClusterController {
    static fetchAll() {
        return redisCommands.hgetall(objectiveKey)
        .then(result => {
            return Object.keys(result).map(key => createObject(result[key]));
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
            return result ? createObject(result) : null;
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
    
        return userClusterController.fetchById(userId)
        .then(entity => {
            if(!entity) {
                throw { code: 404, message: `User does not exists` };
            }

            user = entity;
    
            return taskClusterController.fetchById(taskId);
        })
        .then(entity => {
            if(!entity) {
                throw { code: 404, message: `Task does not exists` };
            }

            task = { ...entity, timestamp };

            return this.fetchById(userId);
        })
        .then(entities => {
            if(entities && Array.isArray(entities)) {
                objectives = objectives.concat(entities);
            }

            objectives.push(task);

            return redisCommands.hset(objectiveKey, userId, task);
        })
        .then(result => {
            return userClusterController.incrementValue(userId, task.value);
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
                throw { code: 404, message: `User does not exists` };
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

const createObject = (stringObject) => {
    let data = null;

    try {
        data = JSON.parse(stringObject);
    }
    catch(error) { }

    return data;
}

module.exports = TaskClusterController;