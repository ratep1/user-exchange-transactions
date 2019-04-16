const transactionClusterService = require('./transaction-cluster-service');

const redisCommands = require('../modules/redis/redis-commands');
const transactionUtility = require('../modules/utils/transaction-utility');

const { transactions: transactionKey } = require('../modules/redis/redis-constants').keys;

const { statuses } = require('../system-constants');

const initialize = () => {
    return transactionClusterService.fetchAll()
    .then(entities => {
        const outdatedTransactions = transactionUtility.filterOutdated(entities);
        const validDateTransactions = transactionUtility.filterValidDate(entities);
        
        outdatedTransactions.forEach(transaction => {
                transaction.state = statuses.DENIED;
                redisCommands.hset(transactionKey, transaction.id, transaction);
        });

        validDateTransactions.forEach(transaction => {
            const timeout = new Date(transaction.expire).getTime() - (new Date()).getTime();
            setTimeout(() => transactionClusterService.checkExpiryDate(id), timeout);
        });
    })
    .catch(error => {
        throw error;
    })
}

module.exports = initialize;