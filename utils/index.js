const fs = require("fs-extra");

const writeToFile = (path, body) => fs.outputFile(path, body);

module.exports = {
    writeToFile
}