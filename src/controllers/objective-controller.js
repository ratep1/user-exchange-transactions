const router = require('express').Router();

const logger = require('../modules/logger');
const { parseError } = require('../modules/utils/error-utility');

const objectiveClusterService = require('../cluster/objective-cluster-service');

const controllerResponses = require('./controller-responses');

/**
 * fetch list of all users from redis
 */
router.get('/', (req, res) => {
    objectiveClusterService.fetchAll()
    .then(entities => {
        res.status(200).json(controllerResponses.entitiesResponse(entities));
    })
    .catch(error => {
        const { code, message } = parseError(error);

        res.status(200).json(controllerResponses.errorResponse(code, message));
    });
});

/**
 * simulate that user finished task
 */
router.post('/', (req, res) => {
    const { userId, taskId } = req.body;
    const timestamp = +new Date();

    objectiveClusterService.create(userId, taskId, timestamp)
    .then(entity => {
        res.status(200).json(controllerResponses.entityResponse(entity));
    })
    .catch(error => {
        const { code, message } = parseError(error);

        res.status(200).json(controllerResponses.errorResponse(code, message));
    });
});

module.exports = router;