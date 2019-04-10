const router = require('express').Router();

const logger = require('../modules/logger');
const { parseError } = require('../modules/utils/error-utility');

const userClusterController = require('../cluster/user-cluster-controller');
const transactionClusterController = require('../cluster/transaction-cluster-controller');

const controllerResponses = require('./controller-responses');

const { statuses } = require('../system-constants');

/**
 * fetch list of all users from redis
 */
router.get('/', (req, res) => {
    userClusterController.fetchAll()
    .then(entities => {
        res.status(200).json(controllerResponses.entitiesResponse(entities));
    })
    .catch(error => {
        const { code, message } = parseError(error);

        res.status(200).json(controllerResponses.errorResponse(code, message));
    });
});

/**
 * fetch user from redis by id
 */
router.get('/:id', (req, res) => {
    const { id } = req.params;

    userClusterController.fetchById(id)
    .then(entity => {
        res.status(200).json(controllerResponses.entityResponse(entity));
    })
    .catch(error => {
        const { code, message } = parseError(error);

        res.status(200).json(controllerResponses.errorResponse(code, message));
    });
});

router.get('/:id/transactions/opened', (req, res) => {
    const { id } = req.params;

    transactionClusterController.fetchByUserId(id)
    .then(entities => {
        const list = entities.filter(e => e.state === statuses.NEW || e.state === statuses.PENDING);
        res.status(200).json(controllerResponses.entityResponse(list));
    })
    .catch(error => {
        const { code, message } = parseError(error);

        res.status(200).json(controllerResponses.errorResponse(code, message));
    });
});

router.get('/:id/transactions/opened/number', (req, res) => {
    const { id } = req.params;

    transactionClusterController.fetchByUserId(id)
    .then(entities => {
        const number = entities.filter(e => e.state === statuses.NEW || e.state === statuses.PENDING).length;
        res.status(200).json(controllerResponses.entityResponse(number));
    })
    .catch(error => {
        const { code, message } = parseError(error);

        res.status(200).json(controllerResponses.errorResponse(code, message));
    });
});

router.post('/', (req, res) => {
    const { id } = req.body;

    userClusterController.create(id)
    .then(entity => {
        res.status(200).json(controllerResponses.entityResponse(entity));
    })
    .catch(error => {
        const { code, message } = parseError(error);

        res.status(200).json(controllerResponses.errorResponse(code, message));
    });
});

router.put('/:id', (req, res) => {
    const { id: payloadId, value } = req.body;
    const { id: paramId } = req.params;

    if(payloadId !== paramId) {
        return res.status(200).json(controllerResponses.errorResponse(400, 'Invalid data'));
    }

    userClusterController.updateValue(payloadId, value)
    .then(entity => {
        res.status(200).json(controllerResponses.entityResponse(entity));
    })
    .catch(error => {
        const { code, message } = parseError(error);

        res.status(200).json(controllerResponses.errorResponse(code, message));
    });
});

module.exports = router;