import Sequelize from 'sequelize';
import basicAuth from 'basic-auth';
import express from 'express';

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
  }
});

Project.hasMany(Key);
Key.belongsTo(Project);

app.get('/', (req, res) => res.sendStatus(200));

app.use(async (req, res, next) => {
  const auth = basicAuth(req);
  if (auth) {
    const project = await Project.findOne({
      where: {
        id: auth.name,
        accessKey: auth.pass
      }
    });

    if (project) {
      res.locals.project = project;
      next();
      return;
    }
  }

  res.sendStatus(403);
});

app.get('/test/:apiKey', async (req, res) => {
  try {
    const [key] = await res.locals.project.getKeys({
      where: {
        id: req.params.apiKey
      }
    });

    if (!key) {
      throw new Error('Key not found');
    }

    res.sendStatus(200);
  } catch (error) {
    res.status(403).send(error);
  }
});

sequelize.sync().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${process.env.PORT}`);
  });
});
