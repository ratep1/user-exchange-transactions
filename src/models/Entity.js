class Entity {
    toPrimitive() {
        return JSON.stringify(JSON.parse(this));
    }
}

module.exports = Entity;