const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const { downloadAndSaveFiles } = require("./requests/aws");
const AWS_Settings = require("../settings/AWS.json");

const app = express();
const server = http.createServer(app);

// Load configuration files
dotenv.config({ path: "./config.env" });

// Body parser middleware
app.use(express.json());

// Port configuration
const PORT = process.env.PORT || 6000;

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}.`);
  downloadAndSaveFiles(AWS_Settings.BUCKET_NAME)
    .then(() =>
      console.log(
        "The files have been downloaded and saved to the project directory."
      )
    )
    .catch((err) => console.error("Download And Save Files error: ", err));
});
