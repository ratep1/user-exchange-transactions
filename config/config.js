
let config = null;

const getConfig = () => {
    if(!config) {
        const env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
        config = require(`./env/${env}.json`);
    }
    
    return config;
}

module.exports = getConfig();