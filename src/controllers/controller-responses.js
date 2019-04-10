const entitiesResponse = entities => {
    const data = {
        code: 200,
        data: entities
    }

    return data;
}

const entityResponse = entity => {
    const data = {
        code: 200,
        data: entity
    }

    return data;
}

const errorResponse = (code, message) => {
    const data = {
        code: code,
        data: message
    }

    return data;
}

module.exports = {
    entitiesResponse,
    entityResponse,
    errorResponse
}