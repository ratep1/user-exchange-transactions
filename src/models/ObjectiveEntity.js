const Entity = require('../models/Entity');
const TaskEntity = require('./TaskEntity');

class ObjectiveEntity extends Entity{
    constructor(userId, tasks) {
        super();

        tasks = tasks && Array.isArray(tasks) ? tasks.filter(t => t) : [];

        this.userId = userId;
        this.tasks =  tasks.map(task => new TaskEntity(task.id, task.value, task.name, task.timestamp));
    }

    static parseString(userId, stringData) {
        try {
            const data = JSON.parse(stringData);

            return new ObjectiveEntity(userId, data);
        }
        catch(error) { }

        return new ObjectiveEntity();
    }
}

module.exports = ObjectiveEntity;