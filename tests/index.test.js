const BPromise = require("bluebird");
const S3 = require("aws-sdk/clients/s3");
const KMS = require("aws-sdk/clients/kms");
const fs = require("fs-extra");
var rimraf = require("rimraf");
const { writeToFile, openConcurrentDownloads } = require("../utils");
const AWS_Settings = require("../settings/AWS.json");
const {
    listS3BucketFiles,
    downloadFileFromS3,
    encryptData,
} = require("../requests/aws");
const AWS_USER_CONFIGS = {
    accessKeyId: AWS_Settings.ACCESS_KEY_ID,
    secretAccessKey: AWS_Settings.SECRET_ACCESS_KEY,
    region: AWS_Settings.ACCOUNT_REGION
};

beforeAll(() => {
    rimraf(process.cwd() + "/tests/tmp", () => {});
})

// afterAll(() => {
//     rimraf(process.cwd() + "/tests/tmp", () => {});
// })

describe("Integration Test Suite", () => {
    it("Testing full functionality of the code", done => {
        const CMK = AWS_Settings.CMK;
        const s3 = new S3(AWS_USER_CONFIGS);
        const kms = new KMS(AWS_USER_CONFIGS);
        const NUMBER_OF_CONCURRENCY_S3_DOWNLOAD = 4;
        const test_bucket = "s3-kms-test-data";
        const pathToSave = process.cwd() + '/tests/tmp/';
        const outputFilename = 'filenames';
        const s3File1 = "db.json";
        const s3File2 = "local/testing.txt";
        const s3File3 = "random.jpg";
        const filenames = [s3File1, s3File2, s3File3];
        listS3BucketFiles(s3, test_bucket)
        .then(keys => {
            expect(keys).toEqual(filenames);
            return openConcurrentDownloads(BPromise, keys, NUMBER_OF_CONCURRENCY_S3_DOWNLOAD, key => downloadFileFromS3(s3, test_bucket, key));
        })
        .then(results => {
            results.forEach(result => {
                expect(result).toHaveProperty("key");
                expect(result).toHaveProperty("Body");
            })
            return Promise.allSettled(results.map(({ key, Body }) => writeToFile(fs, pathToSave, key, Body)));
        })
        .then(fileSettledResult => {
            const filenamesStr = fileSettledResult.map(({ value }) => value).toString();
            expect(filenamesStr).toEqual(filenames.toString());
            return encryptData(kms, CMK, filenamesStr);
        })
        .then(encryptedData => {
            // return kms.decrypt({ KeyId: CMK, CiphertextBlob: Buffer.from(encryptedData, 'base64') })
            //     .promise()
            //     .then(({ Plaintext }) => {
            //         console.log("Plaintext", Plaintext.toString("base64"));
            //         expect(Plaintext?.toString("base64")).toEqual(filenames.toString())
            //     })
            //     .then(() => writeToFile(fs, pathToSave, outputFilename, encryptedData))
            return writeToFile(fs, pathToSave, outputFilename, encryptedData);
        })
        .then(() => {
            const localFile1 = pathToSave + s3File1;
            const localFile2 = pathToSave + s3File2;
            const localFile3 = pathToSave + s3File3;
            const outputFile = pathToSave + outputFilename;
            return fs.pathExists(localFile1)
                    .then(exists => {
                        expect(exists).toBeTruthy();
                        return fs.pathExists(localFile2);
                    })
                    .then(exists => {
                        expect(exists).toBeTruthy();
                        return fs.pathExists(localFile3);
                    })
                    .then(exists => {
                        expect(exists).toBeTruthy();
                        return fs.pathExists(outputFile)
                    })
                    .then(exists => {
                        expect(exists).toBeTruthy();
                        done();
                    })
        })
        .catch(err => {
            console.log("Integration Test Error: ", err);
        })
    })
})

