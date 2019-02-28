import Keyholder from '../lib';
import Sequelize from 'sequelize';
import basicAuth from 'basic-auth';
import express from 'express';

const app = express();
const sequelize = new Sequelize(process.env.DATABASE_URL);

const keyholder = new Keyholder({
  id: 1,
  apiKey: 'b1e1810b-de12-47fb-a462-c5577cf8d5e2'
});

const User = sequelize.define('user', {
  apiKey: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4
  }
});

const Key = sequelize.define('key', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  }
});

Key.belongsTo(User);
User.hasMany(Key);

app.get('/', (req, res) => res.sendStatus(200));

app.use(async (req, res, next) => {
  const auth = basicAuth(req);
  if (auth) {
    const user = await User.findOne({
      where: {
        id: auth.name,
        apiKey: auth.pass
      }
    });

    if (user) {
      res.locals.user = user;
      next();
      return;
    }
  }

  res.sendStatus(403);
});

app.get('/test/:apiKey', async (req, res) => {
  try {
    const [key] = await res.locals.user.getKeys({
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

sequelize.sync().then(async () => {
  // const isValid = await keyholder.test('7a85eb93-13e3-4825-9a9e-ab6d15d4b12f');
  // console.log('valid', isValid);
  app.listen(process.env.PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${process.env.PORT}`);
  });
});
