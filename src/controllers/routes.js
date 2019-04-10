const userController = require('./user-controller');
const taskController = require('./task-controller');
const objectiveController = require('./objective-controller');
const transactionController = require('./transaction-controller');

const routeConstants = require('./route-constants');

const { main: apiRoute, business } = routeConstants;

const getRoutes = app => {
    app.use(`${apiRoute}${business.users}`, userController);
    app.use(`${apiRoute}${business.tasks}`, taskController);
    app.use(`${apiRoute}${business.objectives}`, objectiveController);
    app.use(`${apiRoute}${business.transactions}`, transactionController);
}

module.exports = getRoutes;