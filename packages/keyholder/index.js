const axios = require('axios');
const basicAuth = require('basic-auth');
const http = require('axios/lib/adapters/http');

module.exports = class Keyholder {
  constructor({id, apiKey}) {
    this.id = id;
    this.apiKey = apiKey;
  }

  async test(apiKey) {
    try {
      const {status} = await axios.get(
        `https://keyholder.herokuapp.com/test/${apiKey}`,
        {
          adapter: http,
          auth: {
            username: this.id,
            password: this.apiKey
          }
        }
      );

      return status === 200;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  basicAuth(req) {
    const auth = basicAuth(req);
    if (!auth) {
      return false;
    }

    return this.test(auth.name);
  }
};
