import axios from 'axios';
import basicAuth from 'basic-auth';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import querystring from 'querystring';
import {ApolloServer, AuthenticationError} from 'apollo-server-express';
import {Project, User, sequelize} from './db';
import {resolvers, typeDefs} from './schema';

const app = express();

app.get('/', (req, res) => res.sendStatus(200));

app.get('/auth', cors(), async (req, res) => {
  const accessToken = await axios
    .post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: req.query.code
    })
    .then(({data}) => querystring.parse(data).access_token);

  const githubApi = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
      authorization: `token ${accessToken}`
    }
  });

  const {id, name} = await githubApi
    .get('/user')
    .then(response => response.data);

  let user = await User.findByPk(id);
  if (!user) {
    const [{email}] = await githubApi
      .get('/user/emails', {
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
  try {
    const {name, pass} = basicAuth(req);
    const project = await Project.findOne({
      where: {
        id: name,
        accessKey: pass
      }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const [key] = await project.getKeys({
      where: {
        value: req.params.apiKey
      }
    });

    if (!key) {
      throw new Error('Invalid API key');
    }

    res.sendStatus(200);
  } catch (error) {
    res.status(401).send(error);
  }
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
      return {user};
    } catch (error) {
      throw new AuthenticationError(error);
    }
  }
});

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
