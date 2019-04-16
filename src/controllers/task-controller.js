const router = require('express').Router();

const logger = require('../modules/logger');
const { parseError } = require('../modules/utils/error-utility');

const taskClusterService = require('../cluster/task-cluster-service');

const controllerResponses = require('./controller-responses');

/**
 * fetch list of all users from redis
 */
router.get('/', (req, res) => {
    taskClusterService.fetchAll()
    .then(entities => {
        res.status(200).json(controllerResponses.entitiesResponse(entities));
    })
    .catch(error => {
        const { code, message } = parseError(error);

        res.status(200).json(controllerResponses.errorResponse(code, message));
    });
});

/**
 * create new task on redis
 */
router.post('/', (req, res) => {
    const { id, name, value } = req.body;

    taskClusterService.create(id, name, value)
    .then(entity => {
        res.status(200).json(controllerResponses.entityResponse(entity));
    })
    .catch(error => {
        const { code, message } = parseError(error);

        res.status(200).json(controllerResponses.errorResponse(code, message));
    });
});

/**
 * patch (update) only value for id on redis
 */
router.patch('/:id', (req, res) => {
    const { id: payloadId, value } = req.body;
    const { id: paramId } = req.params;

    if(payloadId !== paramId) {
        return res.status(200).json(controllerResponses.errorResponse(400, 'Invalid data'));
    }

    taskClusterService.updateValue(payloadId, value)
    .then(entity => {
        res.status(200).json(controllerResponses.entityResponse(entity));
    })
    .catch(error => {
        const { code, message } = parseError(error);

        res.status(200).json(controllerResponses.errorResponse(code, message));
    });
});

module.exports = router;