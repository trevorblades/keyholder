import Sequelize from 'sequelize';
import basicAuth from 'basic-auth';
import express from 'express';
import {ApolloServer} from 'apollo-server-express';
import {resolvers, typeDefs} from './schema';

const app = express();
const sequelize = new Sequelize(process.env.DATABASE_URL);

const User = sequelize.define('user');

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
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  email: Sequelize.STRING
});

Project.hasMany(Key);
Key.belongsTo(Project);

app.get('/', (req, res) => res.sendStatus(200));

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
          id: req.params.apiKey
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
  context: {
    Project
  }
});

// TODO: add auth
server.applyMiddleware({
  app,
  cors: {
    origin: 'https://keyholder.dev'
  }
});

sequelize.sync().then(() => {
  // const user = await User.create();
  // const project = await Project.create({
  //   name: 'HLTV'
  // });

  // const key = await Key.create({
  //   email: 'tdblades@gmail.com'
  // });
  //
  // await project.setUser(user);
  // await key.setProject(project);

  app.listen(process.env.PORT, () => {
    console.log(
      `🚀 Server ready at http://localhost:${process.env.PORT +
        server.graphqlPath}`
    );
  });
});
