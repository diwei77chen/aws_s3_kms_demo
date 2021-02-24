# Run the server
## 1. Setup 
  1. Please have Node installed in your environment:
  * Node - v12.x. Check https://nodejs.org/en/download/ for install information.
  2. Fill out AWS keys in `./settings/AWS.json` 
## 2. Start the server
Open a new terminal window, change to the project directory:
  1. Install the dependencies. Run: 
    `npm install` 
  1. Start the server. Run: 
    `node index.js`
Note: When the server gets started, it automatically downloads the files in a given AWS S3 bucket.

# Run the tests:
Run the unit tests and the integration test by:

    `npm test`