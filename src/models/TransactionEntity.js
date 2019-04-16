const Entity = require('./Entity');

const TransactionParticipantEntity = require('./TransactionParticipantEntity');

const { transactionValueDefault, statuses, checkStatus } = require('../system-constants');

class TransactionEntity extends Entity {
    constructor(id, value, from, to, expire, state, approved, requireAdmin, adminApproval, approvers) {
        super();

        this.id = id;
        this.value = value ? value : transactionValueDefault;
        this.from = from;
        this.to = to;
        this.expire = expire;
        this.state = checkStatus(state) ? state : statuses.PENDING;
        this.approved = !!approved;
        this.requireAdmin = !!requireAdmin && typeof adminApproval === 'object';
        this.adminApproval = adminApproval ? new TransactionParticipantEntity(adminApproval) : null;
        this.approvers = approvers ? new TransactionParticipantEntity(approvers) : null;
    }

    static parseString(stringData) {
        try {
            const data = JSON.parse(stringData);

            const { id, value, from, to, expire, state, approved, requireAdmin, adminApproval, approvers } = data;

            return new TransactionEntity(id, value, from, to, expire, state, approved, requireAdmin, adminApproval, approvers);
        }
        catch(error) { }

        return new TransactionEntity();
    }
}

module.exports = TransactionEntity;