const transactionClusterController = require('./transaction-cluster-controller');

const redisCommands = require('../modules/redis/redis-commands');

const { transactions: transactionKey } = require('../modules/redis/redis-constants').keys;

const { statuses } = require('../system-constants');

const initialize = () => {
    return transactionClusterController.fetchAll()
    .then(entities => {
        if(entities && Array.isArray(entities)) {
            entities.filter(e => e.state === statuses.NEW || e.state === statuses.PENDING)
                .filter(e => e.expire)
                .forEach(transaction => {
                    const expireDate = new Date(transaction.expire);

                    if(expireDate <= +new Date()) {
                        transaction.state = statuses.DENIED;

                        redisCommands.hset(transactionKey, transaction.id, transaction);
                    }
                    else {
                        const timeout = expireDate.getTime() - (new Date()).getTime();
                        setTimeout(() => transactionClusterController.checkExpiryDate(id), timeout);
                    }
                });
        }
    })
    .catch(error => {
        throw error;
    })
}

module.exports = initialize;