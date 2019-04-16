const Entity = require('./Entity');

const { statuses, checkStatus } = require('../system-constants');

class TransactionUserEntity extends Entity {
    constructor(approval, approved) {
        super();

        this.approval = checkStatus(approval) ? approval : statuses.PENDING;
        this.approved = !!approved;
    }
}

module.exports = TransactionUserEntity;