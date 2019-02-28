const https = require('https');

module.exports = class Keyholder {
  constructor({id, apiKey}) {
    this.id = id;
    this.apiKey = apiKey;
  }

  test(apiKey) {
    const authorization = `Basic ${Buffer.from(
      `${this.id}:${this.apiKey}`
    ).toString('base64')}`;
    return new Promise((resolve, reject) => {
      https
        .get(
          `https://keyholder.herokuapp.com/test/${apiKey}`,
          {
            headers: {
              authorization
            }
          },
          ({statusCode}) => {
            resolve(statusCode === 200 ? true : false);
          }
        )
        .on('error', error => {
          reject(error);
        });
    });
  }
};
