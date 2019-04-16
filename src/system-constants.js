const userValueDefault = 0;
const taskValueDefault = 10;
const transactionValueDefault = 1;

const statuses = {
    NEW: "new",
    PENDING: "pending",
    DENIED: "denied",
    APPROVED: "approved",
    DONE: "done"
}

const roles = {
    USER: 'user',
    ADMIN: 'admin'
}

const checkStatus = status => {
    return Object.values(statuses).includes(status);
}

module.exports = {
    userValueDefault,
    taskValueDefault,
    transactionValueDefault,

    statuses,
    checkStatus,

    roles
}