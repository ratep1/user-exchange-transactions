const router = require('express').Router();

const logger = require('../modules/logger');
const { parseError } = require('../modules/utils/error-utility');

const transactionClusterService = require('../cluster/transaction-cluster-service');

const controllerResponses = require('./controller-responses');

router.get('/', (req, res) => {
    transactionClusterService.fetchAll()
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
            worker = () => transactionClusterService.approveUser(id, userId);
        }
        else {
            worker = () => transactionClusterService.denyUser(id, userId);
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
        transactionClusterService.fetchById(id)
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
 * 
 * *NB* changes is POST req body
 * admins: array[ids] instead of adminApproval as Map
 * approvers: array[ids] instead of adminApproval as Map
 * 
 * response is same as Request in READ_ME file
 * 
 */
router.post('/', (req, res) => {
    const { id, value, from, to, expire, admins, approvers } = req.body;

    transactionClusterService.create(id, value, from, to, expire, admins, approvers)
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
            worker = () => transactionClusterService.approveUser(id, userId);
        }
        else {
            worker = () => transactionClusterService.denyUser(id, userId);
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
        transactionClusterService.fetchById(id)
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
            worker = () => transactionClusterService.approveUser(id, userId);
        }
        else {
            worker = () => transactionClusterService.denyUser(id, userId);
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
        transactionClusterService.fetchById(id)
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

    transactionClusterService.approveUser(payloadId, userId)
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

    transactionClusterService.denyUser(payloadId, userId)
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

    transactionClusterService.adminApprove(payloadId, userId)
    .then(entity => {
        res.status(200).json(controllerResponses.entityResponse(entity));
    })
    .catch(error => {
        const { code, message } = parseError(error);

        res.status(200).json(controllerResponses.errorResponse(code, message));
    });
});

module.exports = router;