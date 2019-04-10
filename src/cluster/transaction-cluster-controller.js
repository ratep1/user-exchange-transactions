const redisCommands = require('../modules/redis/redis-commands');

const userClusterController = require('./user-cluster-controller');
const taskClusterController = require('./task-cluster-controller');

const { transactions: transactionKey } = require('../modules/redis/redis-constants').keys;

const { statuses } = require('../system-constants');

class TransactionClusterController {
    static fetchAll() {
        return redisCommands.hgetall(transactionKey)
        .then(result => {
            if(!result) {
                return null;
            }

            return Object.keys(result).map(key => createObject(result[key]));
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
            return result ? createObject(result) : null;
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

        //check expire
        let expireDate = null;
        if(expire) {
            expireDate = new Date(expire);

            if(expireDate <= +new Date()) {
                return Promise.reject(new Error("Invalid expireDate")); 
            }
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
                throw { code: 409, message: `Transaction already exists` };
            }

            const userPromises = approvers.map(aid => userClusterController.fetchById(aid));

            return Promise.all(userPromises);
        })
        .then(entities => {
            userList = entities.filter(e => e);
            if(userList.length < approvers.length) {
                throw { code: 404, message: `Approvers are not valid` };
            }

            return userClusterController.fetchById(from);
        })
        .then(entity => {
            if(!entity) {
                throw { code: 404, message: `From does not exists` };
            }

            fromUser = entity;

            return userClusterController.fetchById(to);
        })
        .then(entity => {
            if(!entity) {
                throw { code: 404, message: `To does not exists` };
            }

            if(requireAdmin) {
                return userClusterController.fetchById(admin);
            }
            else {
                return;
            }
        })
        .then(entity => {
            if(requireAdmin) {
                if(!entity) {
                    throw { code: 404, message: `Admin is not valid` };
                }

                if(entity.role !== 'admin') {
                    throw { code: 404, message: `Admin role is not valid` };
                }
            }
            
            return this.fetchByUserId(from);
        })
        .then(entities => {
            let currentFromValue = 0;
            if(entities && Array.isArray(entities)) {
                entities = entities.filter(e => e.from === from);
                if(entities.length > 0) {
                    currentFromValue = -entities.map(e => e.value).reduce((a, b) => a + b);
                }
            }

            currentFromValue -= value;
            currentFromValue += fromUser.value;

            if(currentFromValue <= 0) {
                throw { code: 500, message: `From user does not have enough value for this transaction` };
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

            const newTransaction = {
                id: id,
                value: value,
                from: from,
                to: to,
                expire: expire,
                state: state,
                requireAdmin: requireAdmin,
                adminApproval: adminApproval,
                approved: approved,
                approvers: approverMap
            }

            if(expire) {
                const timeout = expireDate.getTime() - (new Date()).getTime();
                setTimeout(() => this.checkExpiryDate(id), timeout);
            }

            return redisCommands.hset(transactionKey, id, newTransaction);
        })
        .then(result => {
            return this.fetchById(id);
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
        .then(entity => {
            if(!entity) {
                throw { code: 404, message: `Transaction does not exists` };
            }

            transaction = entity;

            if(transaction.state === statuses.DENIED || transaction.state === statuses.APPROVED) {
                throw { code: 403, message: `Transaction cannot be changed` };
            }

            if(transaction.expire) {
                const expireDate = new Date(transaction.expire);

                if(expireDate <= +new Date()) {
                    transaction.state = statuses.DENIED;

                    redisCommands.hset(transactionKey, id, transaction)
                    .then(() => {
                        throw { code: 498, message: `Time for this transaction has been expired` };
                    })
                    .catch(error => {
                        throw error;
                    })
                }
            }

            return userClusterController.fetchById(userId);
        })
        .then(entity => {
            if(!entity) {
                throw { code: 404, message: `User does not exists` };
            }
            user = entity;

            const { approvers } = transaction;
            if(!(userId in approvers)) {
                throw { code: 404, message: `User is not part of transaction` };
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
                return userClusterController.incrementValue(transaction.to, transaction.value);
            }

            return;
        })
        .then(result => {
            if(transaction.approved) {
                return userClusterController.decrementValue(transaction.from, transaction.value);
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
        .then(entity => {
            if(!entity) {
                throw { code: 404, message: `Transaction does not exists` };
            }

            transaction = entity;

            if(transaction.state === statuses.DENIED || transaction.state === statuses.APPROVED) {
                throw { code: 403, message: `Transaction cannot be changed` };
            }

            if(transaction.expire) {
                const expireDate = new Date(transaction.expire);

                if(expireDate <= +new Date()) {
                    transaction.state = statuses.DENIED;

                    redisCommands.hset(transactionKey, id, transaction)
                    .then(() => {
                        throw { code: 498, message: `Time for this transaction has been expired` };
                    })
                    .catch(error => {
                        throw error;
                    })
                }
            }

            return userClusterController.fetchById(userId);
        })
        .then(entity => {
            if(!entity) {
                throw { code: 404, message: `User does not exists` };
            }

            user = entity;

            const { approvers } = transaction;
            if(!(userId in approvers)) {
                throw { code: 404, message: `User is not part of transaction` };
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
        .then(entity => {
            if(!entity) {
                throw { code: 404, message: `Transaction does not exists` };
            }

            transaction = entity;

            if(transaction.state === statuses.DENIED || transaction.state === statuses.APPROVED) {
                throw { code: 403, message: `Transaction cannot be changed` };
            }

            if(transaction.expire) {
                const expireDate = new Date(transaction.expire);

                if(expireDate <= +new Date()) {
                    transaction.state = statuses.DENIED;

                    redisCommands.hset(transactionKey, id, transaction)
                    .then(() => {
                        throw { code: 498, message: `Time for this transaction has been expired` };
                    })
                    .catch(error => {
                        throw error;
                    })
                }
            }

            return userClusterController.fetchById(userId);
        })
        .then(entity => {
            if(!entity) {
                throw { code: 404, message: `User does not exists` };
            }
            user = entity;
            if(user.role !== 'admin') {
                throw { code: 403, message: `User is not admin` };
            }

            const { adminApproval, approvers } = transaction;
            if(!(userId in adminApproval)) {
                throw { code: 404, message: `User is not part of transaction` };
            }

            const approversPending = Object.keys(approvers).map(key => approvers[key])
                .filter(approver => approver.state === statuses.NEW || approver.state === statuses.PENDING || approver.state === statuses.DENIED);

            if(approversPending.length > 0) {
                throw { code: 403, message: `Transaction is not approved by other users` }; 
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
                return userClusterController.incrementValue(transaction.to, transaction.value);
            }

            return;
        })
        .then(result => {
            if(transaction.approved) {
                return userClusterController.decrementValue(transaction.from, transaction.value);
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

    static checkExpiryDate(id) {
        if(!id || typeof id !== "string") {
            return Promise.reject(new Error("Invalid id"));
        }

        let transaction = null;

        return this.fetchById(id)
        .then(entity => {
            if(!entity) {
                throw { code: 404, message: `Transaction does not exists` };
            }

            transaction = entity;

            if(transaction.state === statuses.DENIED || transaction.state === statuses.APPROVED) {
                throw { code: 403, message: `Transaction cannot be changed` };
            }

            if(transaction.expire) {
                const expireDate = new Date(transaction.expire);

                if(expireDate <= +new Date()) {
                    transaction.state = statuses.DENIED;

                    redisCommands.hset(transactionKey, id, transaction)
                    .then(() => {
                        throw { code: 498, message: `Time for this transaction has been expired` };
                    })
                    .catch(error => {
                        throw error;
                    })
                }
            }
        })
        .catch(error => {
            throw error;
        });
    }
}

const createObject = (stringObject) => {
    let data = null;

    try {
        data = JSON.parse(stringObject);
    }
    catch(error) { }

    return data;
}

module.exports = TransactionClusterController;