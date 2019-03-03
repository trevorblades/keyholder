const axios = require('axios');
const basicAuth = require('basic-auth');

module.exports = class Keyholder {
  constructor({id, apiKey}) {
    this.id = id;
    this.apiKey = apiKey;
  }

  async test(apiKey) {
    const {status} = await axios.get(
      `https://keyholder.herokuapp.com/test/${apiKey}`,
      {
        auth: {
          username: this.id,
          password: this.apiKey
        }
      }
    );

    return status === 200;
  }

  basicAuth(req) {
    const auth = basicAuth(req);
    if (!auth) {
      return false;
    }

    return this.test(auth.name);
  }
};
