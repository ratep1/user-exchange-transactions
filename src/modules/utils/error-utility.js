class ErrorUtility {
    static createError(code, errorMessage) {
        code = code ? code : 500;
        
        return {
            code: code,
            message: errorMessage
        };
    }

    static parseError(error) {
        let { code, message } = error;
    
        code = code ? code : 500;
        message = message ? message : JSON.stringify(error);
    
        return { code, message };
    }
}

module.exports = ErrorUtility;