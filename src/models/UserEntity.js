/**
 * 
 * Entity model of User
 * 
 */

const Entity = require('./Entity');

const { roles, userValueDefault } = require('../system-constants');

class UserEntity extends Entity {
    constructor(id, value, role) {
        super();

        this.id = id;
        this.value = value ? value : userValueDefault;
        this.role = role ? role : roles.USER;
    }

    static parseString(stringData) {
        let data = null;

        try {
            data = JSON.parse(stringData);
            data.value = parseFloat(data.value);

            const { id, value, role } = data;

            return new UserEntity(id, value, role);
        }
        catch(error) { }

        return new UserEntity();
    }

    incrementValue(amount) {
        amount = parseFloat(amount);

        if(!amount || typeof amount !== "number") {
            return;
        }

        this.value += amount;
    }

    decrementValue(amount) {
        amount = parseFloat(amount);

        if(!amount || typeof amount !== "number") {
            return;
        }

        this.value -= amount;
    }
}

module.exports = UserEntity;