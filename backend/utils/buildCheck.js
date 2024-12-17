const fs = require('fs');
const path = require('path');

module.exports = {
    checkBuildExists: () => {
        const buildPath = path.join(__dirname, '../../frontend/dist');
        return fs.existsSync(buildPath);
    }
};