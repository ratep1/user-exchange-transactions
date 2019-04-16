const { statuses } = require('../../system-constants');

class TransactionUtility {
    static filterOutdated(entities) {
        let response = [];

        if(entities && Array.isArray(entities)) {
            response = entities.filter(e => e.state === statuses.NEW || e.state === statuses.PENDING)
            .filter(e => e.expire)
            .filter(transaction => !this.isDateValid(transaction.expire));
        }

        return response;
    }

    static filterValidDate(entities) {
        let response = [];

        if(entities && Array.isArray(entities)) {
            response = entities.filter(e => e.state === statuses.NEW || e.state === statuses.PENDING)
            .filter(transaction => !transaction.expire || this.isDateValid(transaction.expire));
        }

        return response;
    }

    static isDateValid(expire) {
        let isValid = true;

        if(expire) {
            return new Date(expire) > +new Date()
        }

        return isValid;
    }

    static calculateValue(userId, userValue, newTransactionValue, transactions) {
        let currentValue = 0;
        if(transactions && Array.isArray(transactions)) {
            transactions = transactions.filter(transaction => transaction.from === userId);
            if(transactions.length > 0) {
                currentValue = -transactions.map(e => e.value).reduce((a, b) => a + b);
            }
        }

        currentValue -= newTransactionValue;
        currentValue += userValue;
    }
}

module.exports = TransactionUtility;