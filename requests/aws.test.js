const AWS = require("aws-sdk");
const AWSMock = require("aws-sdk-mock");

const { listS3BucketFiles, downloadFileFromS3, encryptData } = require("./aws");

beforeAll(() => {
  AWSMock.setSDKInstance(AWS);
});

describe("AWS Request Test Suite", () => {
  describe("Test listS3BucketFiles function", () => {
    it("Given a bucketname, it returns a list of filenames of the bucket.", (done) => {
      const files = [
        "aws/dummy/file1",
        "aws/bin/file2",
        "aws/tmp/file3",
        "aws/local/file4",
        "aws/usr/file5",
      ];
      const Contents = files.map((file) => ({ Key: file }));
      AWSMock.mock("S3", "listObjectsV2", { Contents });
      const s3 = new AWS.S3();
      listS3BucketFiles(s3, "dummyBucketName").then((keys) => {
        expect(keys).toEqual(files);
        done();
      });
      AWSMock.restore("S3");
    });
  });

  describe("Test downloadFileFromS3 function", () => {
    it("Given a bucketname and a file key, it downloads and returns the data of the file", (done) => {
      const fileKey = "aws/dummy/file1";
      const file = {
        meta: "dummy",
        data: "ajdlkasjldjaslkxhuhsdfhdsf",
        date: "2000-01-01",
      };
      AWSMock.mock("S3", "getObject", file);
      const s3 = new AWS.S3();
      downloadFileFromS3(s3, "dummyBucketName", fileKey).then((data) => {
        expect(data).toEqual({ key: fileKey, ...file });
        done();
      });
      AWSMock.restore("S3");
    });
  });

  describe("Test encryptData function", () => {
    it("Given a cmk and data, it encrypts the data and returns the encrypted data", (done) => {
      const cmk = "dummyCMK";
      const data = "I have a key.";
      const dummyEncryptedData = "qiwrjjcvfdsofmteiuopdadkasld,";
      AWSMock.mock("KMS", "encrypt", { CiphertextBlob: dummyEncryptedData });
      const kms = new AWS.KMS();
      encryptData(kms, cmk, data).then((encryptedData) => {
        expect(encryptedData).toEqual(dummyEncryptedData);
        done();
      });
      AWSMock.restore("KMS");
    });
  });
});
