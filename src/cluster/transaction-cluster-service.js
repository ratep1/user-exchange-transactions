const redisCommands = require('../modules/redis/redis-commands');
const transactionUtility = require('../modules/utils/transaction-utility');
const errorUtility = require('../modules/utils/error-utility');

const userClusterService = require('./user-cluster-service');

const TransactionEntity = require('../models/TransactionEntity');

const { transactions: transactionKey } = require('../modules/redis/redis-constants').keys;
const { statuses } = require('../system-constants');

class TransactionClusterService {
    static fetchAll() {
        return redisCommands.hgetall(transactionKey)
        .then(result => {
            if(!result) {
                return null;
            }

            return Object.keys(result).map(key => TransactionEntity.parseString(result[key]));
        })
        .catch(error => {
            throw error;
        });
    }

    static fetchById(id) {
        if(!id || typeof id !== "string") {
            return Promise.reject(new Error("Invalid id"));
        }
    
        return redisCommands.hget(transactionKey, id)
        .then(result => {
            return result ? TransactionEntity.parseString(result) : null;
        })
        .catch(error => {
            throw error;
        });
    }

    static fetchByUserId(userId) {
        if(!userId || typeof userId !== "string") {
            return Promise.reject(new Error("Invalid userId"));
        }

        return this.fetchAll()
        .then(entities => {
            let data = [];
            if(entities && Array.isArray(entities) && entities.length > 0) {
                data = entities.filter(e => e.from === userId || e.to === userId);
            }

            return data;
        })
        .catch(error => {
            throw error;
        })
    }
    
    static create(id, value, from, to, expire, admin, approvers) {
        if(!id || typeof id !== "string") {
            id = +new Date();
        }
        
        value = parseFloat(value);

        if(!value || typeof value !== "number" || value <= 0) {
            return Promise.reject(new Error("Invalid value"));
        }

        if(!from || typeof from !== "string") {
            return Promise.reject(new Error("Invalid from"));
        }

        if(!to || typeof to !== "string") {
            return Promise.reject(new Error("Invalid to"));
        }

        if(!approvers || !Array.isArray(approvers)) {
            return Promise.reject(new Error("Invalid approvers"));
        }

        if(!transactionUtility.isDateValid(expire)) {
            return Promise.reject(new Error("Invalid expireDate"));
        }

        let expireDate = null;
        if(expire) {
            expireDate = new Date(expire);
        }

        const approved = false;
        const requireAdmin = !!admin;
        const state = statuses.NEW;
        
        let userList = [];
        let adminList = [];
        let fromUser = null;
        let fromTransactions = [];
        let transactions = [];
    
        return this.fetchById(id)
        .then(entity => {
            if(entity) {
                throw errorUtility.createError(409, `Transaction already exists`);
            }

            const userPromises = approvers.map(aid => userClusterService.fetchById(aid));

            return Promise.all(userPromises);
        })
        .then(entities => {
            userList = entities.filter(e => e);
            if(userList.length < approvers.length) {
                throw errorUtility.createError(404, `Approvers are not valid`);
            }

            return userClusterService.fetchById(from);
        })
        .then(entity => {
            if(!entity) {
                throw errorUtility.createError(404, `From does not exists`);
            }

            fromUser = entity;

            return userClusterService.fetchById(to);
        })
        .then(entity => {
            if(!entity) {
                throw errorUtility.createError(404, `To does not exists`);
            }

            if(requireAdmin) {
                return userClusterService.fetchById(admin);
            }
            else {
                return;
            }
        })
        .then(entity => {
            if(requireAdmin) {
                if(!entity) {
                    throw errorUtility.createError(404, `Admin is not valid`);
                }

                if(entity.role !== 'admin') {
                    throw errorUtility.createError(404, `Admin role is not valid`);
                }
            }
            
            return this.fetchByUserId(from);
        })
        .then(entities => {
            const currentFromValue = transactionUtility.calculateValue(from, fromUser.value, value, entities);

            if(currentFromValue <= 0) {
                throw errorUtility.createError(500, `From user does not have enough value for this transaction`);
            }

            let adminApproval = null;
            let approverMap = {}

            if(requireAdmin) {
                adminApproval = {};
                adminApproval[admin] = { approval: statuses.PENDING, approved: approved };
            }

            if(!approvers.includes(to)) {
                approvers.push(to);
            }

            approvers.forEach(approver => {
                approverMap[approver] = { approval: statuses.PENDING, approved: approved };
            });

            const newTransaction = 
                new TransactionEntity(id, value, from, to, expire, state, approved, requireAdmin, adminApproval, approverMap);

            return redisCommands.hset(transactionKey, id, newTransaction);
        })
        .then(result => {
            return this.fetchById(id);
        })
        .then(entity => {
            this.setTimeout(entity);
            return entity;
        })
        .catch(error => {
            throw error;
        });
    }

    static approveUser(id, userId) {
        if(!id || typeof id !== "string") {
            return Promise.reject(new Error("Invalid id"));
        }

        if(!userId || typeof userId !== "string") {
            return Promise.reject(new Error("Invalid userId"));
        }

        let transaction, user = null;

        return this.fetchById(id)
        .then(async entity => {
            if(!entity) {
                throw errorUtility.createError(404, `Transaction does not exists`);
            }

            transaction = entity;

            if(transaction.state === statuses.DENIED || transaction.state === statuses.APPROVED) {
                throw errorUtility.createError(403, `Transaction cannot be changed`);
            }

            if(!transactionUtility.isDateValid(transaction.expire)) {
                transaction.state = statuses.DENIED;

                await redisCommands.hset(transactionKey, id, transaction)
                    
                throw errorUtility.createError(498, `Time for this transaction has been expired`);
            }

            return userClusterService.fetchById(userId);
        })
        .then(entity => {
            if(!entity) {
                throw errorUtility.createError(404, `User does not exists`);
            }
            user = entity;

            const { approvers } = transaction;
            if(!(userId in approvers)) {
                throw errorUtility.createError(404, `User is not part of transaction`);
            }

            if(approvers[userId].approval === statuses.PENDING) {
                approvers[userId].approval = statuses.DONE;
                approvers[userId].approved = true;
            }
            transaction.approvers = approvers;

            const pendingList = Object.keys(approvers).map(key => approvers[key]).filter(approver => approver.approval === statuses.PENDING);

            if(pendingList.length === 0 && !transaction.requireAdmin) {
                transaction.approved = true;
                transaction.state = statuses.APPROVED;
            }
            else {
                transaction.state = statuses.PENDING;
            }

            return redisCommands.hset(transactionKey, id, transaction);
        })
        .then(result => {
            if(transaction.approved) {
                return userClusterService.incrementValue(transaction.to, transaction.value);
            }

            return;
        })
        .then(result => {
            if(transaction.approved) {
                return userClusterService.decrementValue(transaction.from, transaction.value);
            }

            return;
        })
        .then(result => {
            return this.fetchById(id);
        })
        .catch(error => {
            throw error;
        });
    }

    static denyUser(id, userId) {
        if(!id || typeof id !== "string") {
            return Promise.reject(new Error("Invalid id"));
        }

        if(!userId || typeof userId !== "string") {
            return Promise.reject(new Error("Invalid userId"));
        }

        let transaction, user = null;

        return this.fetchById(id)
        .then(async entity => {
            if(!entity) {
                throw errorUtility.createError(404, `Transaction does not exists`);
            }

            transaction = entity;

            if(transaction.state === statuses.DENIED || transaction.state === statuses.APPROVED) {
                throw errorUtility.createError(403, `Transaction cannot be changed`);
            }

            if(!transactionUtility.isDateValid(transaction.expire)) {
                transaction.state = statuses.DENIED;

                await redisCommands.hset(transactionKey, id, transaction)
                    
                throw errorUtility.createError(498, `Time for this transaction has been expired`);
            }

            return userClusterService.fetchById(userId);
        })
        .then(entity => {
            if(!entity) {
                throw errorUtility.createError(404, `User does not exists`);
            }

            user = entity;

            const { approvers } = transaction;
            if(!(userId in approvers)) {
                throw errorUtility.createError(404, `User is not part of transaction`);
            }

            if(approvers[userId].approval === statuses.PENDING) {
                approvers[userId].approval = statuses.DONE;
                approvers[userId].approved = false;
            }
            transaction.approvers = approvers;
            transaction.state = statuses.DENIED;

            return redisCommands.hset(transactionKey, id, transaction);
        })
        .then(entity => {
            return this.fetchById(id);
        })
        .catch(error => {
            throw error;
        });
    }

    static adminApprove(id, userId) {
        if(!id || typeof id !== "string") {
            return Promise.reject(new Error("Invalid id"));
        }

        if(!userId || typeof userId !== "string") {
            return Promise.reject(new Error("Invalid id"));
        }

        let transaction, user = null;

        return this.fetchById(id)
        .then(async entity => {
            if(!entity) {
                throw errorUtility.createError(404, `Transaction does not exists`);
            }

            transaction = entity;

            if(transaction.state === statuses.DENIED || transaction.state === statuses.APPROVED) {
                throw errorUtility.createError(403, `Transaction cannot be changed`);
            }

            if(!transactionUtility.isDateValid(transaction.expire)) {
                transaction.state = statuses.DENIED;

                await redisCommands.hset(transactionKey, id, transaction)
                    
                throw errorUtility.createError(498, `Time for this transaction has been expired`);
            }

            return userClusterService.fetchById(userId);
        })
        .then(entity => {
            if(!entity) {
                throw errorUtility.createError(404, `User does not exists`);
            }
            user = entity;
            if(user.role !== 'admin') {
                throw errorUtility.createError(403, `User is not admin`);
            }

            const { adminApproval, approvers } = transaction;
            if(!(userId in adminApproval)) {
                throw errorUtility.createError(404, `User is not part of transaction`);
            }

            const approversPending = Object.keys(approvers).map(key => approvers[key])
                .filter(approver => approver.state === statuses.NEW || approver.state === statuses.PENDING || approver.state === statuses.DENIED);

            if(approversPending.length > 0) {
                throw errorUtility.createError(403, `Transaction is not approved by other users`); 
            }

            if(adminApproval[userId].approval === statuses.PENDING) {
                adminApproval[userId].approval = statuses.DONE;
                adminApproval[userId].approved = true;
            }
            transaction.adminApproval = adminApproval;

            transaction.approved = true;
            transaction.state = statuses.APPROVED;

            return redisCommands.hset(transactionKey, id, transaction);
        })
        .then(result => {
            if(transaction.approved) {
                return userClusterService.incrementValue(transaction.to, transaction.value);
            }

            return;
        })
        .then(result => {
            if(transaction.approved) {
                return userClusterService.decrementValue(transaction.from, transaction.value);
            }

            return;
        })
        .then(result => {
            return this.fetchById(id);
        })
        .catch(error => {
            throw error;
        });
    }

    static setTimeout(transaction) {
        const { id, expire } = transaction;

        if(expire) {
            const expireDate = new Date(expire);
            const timeout = expireDate.getTime() - (new Date()).getTime();
            setTimeout(() => this.checkExpiryDate(id), timeout);
        }
    }

    static checkExpiryDate(id) {
        if(!id || typeof id !== "string") {
            return Promise.reject(new Error("Invalid id"));
        }

        let transaction = null;

        return this.fetchById(id)
        .then(async entity => {
            if(!entity) {
                throw errorUtility.createError(404, `Transaction does not exists`);
            }

            transaction = entity;

            if(transaction.state === statuses.DENIED || transaction.state === statuses.APPROVED) {
                throw errorUtility.createError(403, `Transaction cannot be changed`);
            }

            if(!transactionUtility.isDateValid(transaction.expire)) {
                transaction.state = statuses.DENIED;

                await redisCommands.hset(transactionKey, id, transaction)
                    
                throw errorUtility.createError(498, `Time for this transaction has been expired`);
            }
        })
        .catch(error => {
            throw error;
        });
    }
}

module.exports = TransactionClusterService;