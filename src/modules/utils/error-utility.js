const parseError = (error) => {
    let { code, message } = error;

    code = code ? code : 500;
    message = message ? message : JSON.stringify(error);

    return { code, message };
}

module.exports = {
    parseError
}