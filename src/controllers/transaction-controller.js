const router = require('express').Router();

const logger = require('../modules/logger');
const { parseError } = require('../modules/utils/error-utility');

const transactionClusterController = require('../cluster/transaction-cluster-controller');

const controllerResponses = require('./controller-responses');

router.get('/', (req, res) => {
    transactionClusterController.fetchAll()
    .then(entities => {
        res.status(200).json(controllerResponses.entitiesResponse(entities));
    })
    .catch(error => {
        const { code, message } = parseError(error);

        res.status(200).json(controllerResponses.errorResponse(code, message));
    });
});

/**
 * fetch transaction from redis by id
 */
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;
    let { approve } = req.query;

    if(approve && userId) {
        approve = approve && approve === 'true' ? true : false;
        let worker = null;
        if(approve) {
            worker = () => transactionClusterController.approveUser(id, userId);
        }
        else {
            worker = () => transactionClusterController.denyUser(id, userId);
        }

        worker()
        .then(entity => {
            res.status(200).json(controllerResponses.entityResponse(entity));
        })
        .catch(error => {
            const { code, message } = parseError(error);

            res.status(200).json(controllerResponses.errorResponse(code, message));
        });
    }
    else {
        transactionClusterController.fetchById(id)
        .then(entity => {
            res.status(200).json(controllerResponses.entityResponse(entity));
        })
        .catch(error => {
            const { code, message } = parseError(error);

            res.status(200).json(controllerResponses.errorResponse(code, message));
        });
    }
});

/**
 * create new transaction between two users
 */
router.post('/', (req, res) => {
    const { id, value, from, to, expire, admins, approvers } = req.body;

    transactionClusterController.create(id, value, from, to, expire, admins, approvers)
    .then(entity => {
        res.status(200).json(controllerResponses.entityResponse(entity));
    })
    .catch(error => {
        const { code, message } = parseError(error);

        res.status(200).json(controllerResponses.errorResponse(code, message));
    });
});

router.get('/:id', (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;
    let { approve } = req.query;

    if(approve && userId) {
        approve = approve && approve === 'true' ? true : false;
        let worker = null;
        if(approve) {
            worker = () => transactionClusterController.approveUser(id, userId);
        }
        else {
            worker = () => transactionClusterController.denyUser(id, userId);
        }

        worker()
        .then(entity => {
            res.status(200).json(controllerResponses.entityResponse(entity));
        })
        .catch(error => {
            const { code, message } = parseError(error);

            res.status(200).json(controllerResponses.errorResponse(code, message));
        });
    }
    else {
        transactionClusterController.fetchById(id)
        .then(entity => {
            res.status(200).json(controllerResponses.entityResponse(entity));
        })
        .catch(error => {
            const { code, message } = parseError(error);

            res.status(200).json(controllerResponses.errorResponse(code, message));
        });
    }
});

router.get('/:id', (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;
    let { approve } = req.query;

    if(approve && userId) {
        approve = approve && approve === 'true' ? true : false;
        let worker = null;
        if(approve) {
            worker = () => transactionClusterController.approveUser(id, userId);
        }
        else {
            worker = () => transactionClusterController.denyUser(id, userId);
        }

        worker()
        .then(entity => {
            res.status(200).json(controllerResponses.entityResponse(entity));
        })
        .catch(error => {
            const { code, message } = parseError(error);

            res.status(200).json(controllerResponses.errorResponse(code, message));
        });
    }
    else {
        transactionClusterController.fetchById(id)
        .then(entity => {
            res.status(200).json(controllerResponses.entityResponse(entity));
        })
        .catch(error => {
            const { code, message } = parseError(error);

            res.status(200).json(controllerResponses.errorResponse(code, message));
        });
    }
});

router.patch('/:id/approve', (req, res) => {
    const { id: payloadId, userId } = req.body;
    const { id: paramId } = req.params;

    if(payloadId !== paramId) {
        return res.status(200).json(controllerResponses.errorResponse(400, 'Invalid data'));
    }

    transactionClusterController.approveUser(payloadId, userId)
    .then(entity => {
        res.status(200).json(controllerResponses.entityResponse(entity));
    })
    .catch(error => {
        const { code, message } = parseError(error);

        res.status(200).json(controllerResponses.errorResponse(code, message));
    });
});

router.patch('/:id/deny', (req, res) => {
    const { id: payloadId, userId } = req.body;
    const { id: paramId } = req.params;

    if(payloadId !== paramId) {
        return res.status(200).json(controllerResponses.errorResponse(400, 'Invalid data'));
    }

    transactionClusterController.denyUser(payloadId, userId)
    .then(entity => {
        res.status(200).json(controllerResponses.entityResponse(entity));
    })
    .catch(error => {
        const { code, message } = parseError(error);

        res.status(200).json(controllerResponses.errorResponse(code, message));
    });
});

router.patch('/:id/admin', (req, res) => {
    const { id: payloadId, userId } = req.body;
    const { id: paramId } = req.params;

    if(payloadId !== paramId) {
        return res.status(200).json(controllerResponses.errorResponse(400, 'Invalid data'));
    }

    transactionClusterController.adminApprove(payloadId, userId)
    .then(entity => {
        res.status(200).json(controllerResponses.entityResponse(entity));
    })
    .catch(error => {
        const { code, message } = parseError(error);

        res.status(200).json(controllerResponses.errorResponse(code, message));
    });
});

module.exports = router;