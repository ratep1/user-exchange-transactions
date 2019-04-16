const Entity = require('./Entity');
const TransactionUserEntity = require('./TransactionUserEntity');

const { statuses, checkStatus } = require('../system-constants');

class TransactionParticipantEntity extends Entity {
    constructor(data) {
        super();

        if(typeof data === 'object') {
            const userIds = Object.keys(data);

            userIds.forEach(userId => {
                const { approval, approved } = data[userId];
                this[userId] = new TransactionUserEntity(approval, approved);
            });
        }
    }
}

module.exports = TransactionParticipantEntity;