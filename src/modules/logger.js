let logger = null;

class Logger {
    constructor() {
        this.prefix = "";
    }

    debug(data) {
        console.debug(`${this.prefix}${data}`);
    }
    
    info(data) {
        console.log(`${this.prefix}${data}`);
    }

    warn(data) {
        console.warn(`${this.prefix}${data}`);
    }

    error(data) {
        console.error(`${this.prefix}${data}`);
    }
}

const getLogger = () => {
    if(!logger) {
        logger = new Logger();
    }

    return logger;
}

module.exports = getLogger();