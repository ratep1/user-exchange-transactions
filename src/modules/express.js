const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const logger = require('./logger');
const config = require('../../config/config');
const routes = require('../controllers/routes');

let app = null;

const initialize = () => {
    if(!app) {
        const { server } = config;

        const port = server && server.port ? server.port : 5001;

        app = express();
        app.use(express.json());
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(cors());

        routes(app);

        app.listen(port, () => {
            logger.info(`server is listening on port ${port}`);
        });
    }

    return app;
}

module.exports = initialize