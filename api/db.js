import Sequelize from 'sequelize';
import hat from 'hat';
import {UserInputError} from 'apollo-server-express';

export const sequelize = new Sequelize(process.env.DATABASE_URL);

export const User = sequelize.define('user', {
  name: Sequelize.STRING,
  email: Sequelize.STRING
});

User.prototype.getKey = async function(id) {
  const [key] = await this.getKeys({
    where: {
      id
    }
  });

  if (!key) {
    throw new UserInputError('Key not found');
  }

  return key;
};

export const Project = sequelize.define('project', {
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

export const Key = sequelize.define('key', {
  value: {
    type: Sequelize.STRING,
    defaultValue: hat
  }
});

User.hasMany(Key);
Key.belongsTo(User);

Key.belongsTo(Project);
Project.hasMany(Key, {
  onDelete: 'cascade',
  hooks: true
});
