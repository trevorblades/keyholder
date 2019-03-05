const axios = require('axios');
const basicAuth = require('basic-auth');
const http = require('axios/lib/adapters/http');

module.exports = class Keyholder {
  constructor({projectId, projectAccessKey}) {
    this.projectId = projectId;
    this.projectAccessKey = projectAccessKey;
  }

  async test(apiKey) {
    try {
      const {status} = await axios.get(
        `https://api.keyholder.dev/test/${apiKey}`,
        {
          adapter: http,
          auth: {
            username: this.projectId,
            password: this.projectAccessKey
          }
        }
      );

      return status === 200;
    } catch (error) {
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
