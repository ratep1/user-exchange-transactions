const redisCommands = require('../src/modules/redis/redis-commands');
const redisConstants = require('../src/modules/redis/redis-constants');

const users = require('./users');
const tasks = require('./tasks');

const usersMap = redisConstants.keys.users;
const tasksMap = redisConstants.keys.tasks;

const initialize = () => {
    let userPromises = [];
    let taskPromises = [];

    if(users && Array.isArray(users)) {
        userPromises = users.map(user => {
            const { id } = user;
            return redisCommands.hset(usersMap, id, user);
        });
    }

    return Promise.all(userPromises)
    .then(results => {
        console.log(results);

        if(tasks && Array.isArray(tasks)) {
            taskPromises = tasks.map(task => {
                const { id } = task;
                return redisCommands.hset(tasksMap, id, task);
            });
        }

        return Promise.all(taskPromises)
    })
    .then(results => {
        console.log(results);
    })
    .catch(error => {
        throw error;
    });
}

initialize();