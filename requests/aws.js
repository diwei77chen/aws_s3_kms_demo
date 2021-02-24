const BPromise = require("bluebird");
const S3 = require("aws-sdk/clients/s3");
const KMS = require("aws-sdk/clients/kms");
const fs = require("fs-extra");
const { writeToFile, openConcurrentDownloads } = require("../utils");
const AWS_Settings = require("../settings/AWS.json");

const AWS_USER_CONFIGS = {
    accessKeyId: AWS_Settings.ACCESS_KEY_ID,
    secretAccessKey: AWS_Settings.SECRET_ACCESS_KEY,
    region: AWS_Settings.ACCOUNT_REGION
};
const CMK = AWS_Settings.CMK;
const s3 = new S3(AWS_USER_CONFIGS);
const kms = new KMS(AWS_USER_CONFIGS);
const NUMBER_OF_CONCURRENCY_S3_DOWNLOAD = 4;

/**
 * list up to 1,000 files in a s3 bucket
 * @param {object} s3 S3 caller
 * @param {string} bucketName The bucket name
 * return an array of file paths
 */
const listS3BucketFiles = (s3, bucketName) => s3.listObjectsV2({ Bucket: bucketName }).promise()
    .then(({ Contents } = {}) => Contents.map(({ Key } = {}) => Key))

/**
 * download a file from a given s3 bucket. File data is saved in memeory in the interim.
 * @param {object} s3 S3 caller
 * @param {string} bucketName The bucket name
 * @param {string} key a file path in the bucket
 * return an array of downloaded files
 */
const downloadFileFromS3 = (s3, bucketName, key) => s3.getObject({ Bucket: bucketName, Key: key }).promise()
    .then(data => ({ key, ...data }))

/**
 * encrypt data by AWS KMS and CMK
 * @param {object} kms AWS KMS caller 
 * @param {string} cmk AWS CMK
 * @param {string} data Data to encrypt
 * return the encrypted data
 */
const encryptData = (kms, cmk, data) => kms.encrypt({ KeyId: cmk, Plaintext: data }).promise()
    .then(({ CiphertextBlob }) => CiphertextBlob.toString('base64'))

/**
 * download the files from a given AWS bucket, save the files to the project directory, 
 * encrypt and output the names of the files to a file by AWS KMS and a given CMK
 * @param {*} bucketName 
 * @param {*} pathToSave 
 * @param {*} filenameEncrypt 
 * return a promise
 */
const downloadAndSaveFiles = (bucketName = "s3-kms-sample-data", pathToSave = process.cwd() + '/tmp/', outputFilename = 'filenames') => {
    console.log("Start downloading the files from the default S3 bucket...");
    // Assumption 1: We have access to download all the files in the given bucket
    // Assumption 2: We download all the files or no file
    // Assumption 3: The files in the bucket are small size files (e.g., < 10MB)
    return listS3BucketFiles(s3, bucketName)
    .then(keys => openConcurrentDownloads(BPromise, keys, NUMBER_OF_CONCURRENCY_S3_DOWNLOAD, key => downloadFileFromS3(s3, bucketName, key)))
    .then((result = []) => Promise.allSettled(result.map(({ key, Body }) => writeToFile(fs, pathToSave + key, Body))))
    .then(fileSettledResult => fileSettledResult.map(({ value }) => value).toString())
    .then(filenames => encryptData(kms, CMK, filenames))
    .then((encryptedData = "") => writeToFile(fs, pathToSave + outputFilename, encryptedData))
}

module.exports = {
    listS3BucketFiles,
    downloadFileFromS3,
    encryptData,
    downloadAndSaveFiles
}