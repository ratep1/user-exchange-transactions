/**
 * 
 * Entity model of Task
 * 
 */

const Entity = require('./Entity');

const { taskValueDefault } = require('../system-constants');

class TaskEntity extends Entity {
    constructor(id, value, name, timestamp) {
        super();

        this.id = id;
        this.value = value ? value : taskValueDefault;
        this.name = name ? name : 'Task';
        this.timestamp = timestamp;
    }

    static parseString(stringData) {
        let data = null;

        try {
            data = JSON.parse(stringData);
            data.value = parseFloat(data.value);

            const { id, value, name } = data;

            return new TaskEntity(id, value, name);
        }
        catch(error) { }

        return new TaskEntity();
    }

    setTimestamp(timestamp) {
        this.timestamp = timestamp;
    }
}

module.exports = TaskEntity;