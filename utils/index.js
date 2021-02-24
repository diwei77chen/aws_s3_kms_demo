/**
 * write data to file
 * @param {object} fs NodeJS file system
 * @param {string} path Path to save the data
 * @param {*} body The data
 * return a promise 
 */
const writeToFile = (fs, path, body) => fs.outputFile(path, body);

/**
 * download files concurrently.
 * @param {object} bPromise Bluebird Promise 
 * @param {array} keys Array of file paths 
 * @param {number} concurrency Number of concurrent dowloads
 * @param {function} downloadRequest The download request
 * return the final download result for the given file paths 
 */
const openConcurrentDownloads = (bPromise, keys = [], concurrency, downloadRequest) => bPromise.map(keys, key => downloadRequest(key), { concurrency })

module.exports = {
    writeToFile,
    openConcurrentDownloads
}