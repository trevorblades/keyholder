import Sequelize from 'sequelize';
import axios from 'axios';
import basicAuth from 'basic-auth';
import cors from 'cors';
import express from 'express';
import hat from 'hat';
import jwt from 'jsonwebtoken';
import querystring from 'querystring';
import {ApolloServer, AuthenticationError} from 'apollo-server-express';
import {resolvers, typeDefs} from './schema';

const app = express();
const sequelize = new Sequelize(process.env.DATABASE_URL);

const User = sequelize.define('user', {
  name: Sequelize.STRING,
  email: Sequelize.STRING
});

const Project = sequelize.define('project', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  name: Sequelize.STRING,
  accessKey: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4
  }
});

User.hasMany(Project);
Project.belongsTo(User);

const Key = sequelize.define('key', {
  value: {
    type: Sequelize.STRING,
    defaultValue: hat
  }
});

User.hasMany(Key);
Key.belongsTo(User);

Project.hasMany(Key);
Key.belongsTo(Project);

app.get('/', (req, res) => res.sendStatus(200));

const GITHUB_API_URL = 'https://api.github.com';
app.get('/auth', cors(), async (req, res) => {
  const accessToken = await axios
    .post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: req.query.code
    })
    .then(({data}) => querystring.parse(data).access_token);

  const instance = axios.create({
    headers: {
      authorization: `token ${accessToken}`
    }
  });

  const {id, name} = await instance
    .get(`${GITHUB_API_URL}/user`)
    .then(response => response.data);

  let user = await User.findByPk(id);
  if (!user) {
    const [{email}] = await instance
      .get(`${GITHUB_API_URL}/user/emails`, {
        headers: {
          authorization: `token ${accessToken}`
        }
      })
      .then(({data}) => data.filter(({primary}) => primary));

    user = await User.create({
      id,
      name,
      email
    });
  }

  res.send(jwt.sign(user.get(), process.env.TOKEN_SECRET));
});

app.get('/test/:apiKey', async (req, res) => {
  const auth = basicAuth(req);
  if (auth) {
    const project = await Project.findOne({
      where: {
        id: auth.name,
        accessKey: auth.pass
      }
    });

    if (project) {
      const [key] = await project.getKeys({
        where: {
          value: req.params.apiKey
        }
      });

      if (key) {
        res.sendStatus(200);
        return;
      }
    }
  }

  res.sendStatus(401);
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  async context({req}) {
    try {
      const matches = req.headers.authorization.match(/bearer (\S+)/i);
      const token = matches[1];
      const {id} = jwt.verify(token, process.env.TOKEN_SECRET);
      const user = await User.findByPk(id);
      return {
        Key,
        Project,
        user
      };
    } catch (error) {
      throw new AuthenticationError(error);
    }
  }
});

// TODO: add auth
server.applyMiddleware({
  app,
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? 'https://keyholder.dev'
        : /localhost:\d{4}$/
  }
});

sequelize.sync().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(
      `🚀 Server ready at http://localhost:${process.env.PORT +
        server.graphqlPath}`
    );
  });
});
