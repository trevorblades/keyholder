import hat from 'hat';
import {UserInputError, gql} from 'apollo-server-express';

export const typeDefs = gql`
  type User {
    id: ID
    name: String
    email: String
  }

  type Key {
    id: ID
    value: String
    updatedAt: String
    projectId: ID
    user: User
    project: Project
  }

  type Project {
    id: ID
    name: String
    accessKey: String
    createdAt: String
    userId: ID
    key: Key
    keys: [Key]
    user: User
  }

  type Query {
    keys: [Key]
    project(id: ID!): Project
    projects: [Project]
  }

  type Mutation {
    createKey(projectId: ID!): Key
    updateKey(id: ID!): Key
    deleteKey(id: ID!): Key
    createProject(name: String!): Project
    deleteProject(id: ID!): Project
  }
`;

export const resolvers = {
  Key: {
    project: parent => parent.getProject(),
    user: parent => parent.getUser()
  },
  Project: {
    key: async (parent, args, {user}) => {
      const [key] = await user.getKeys({
        where: {
          projectId: parent.id
        }
      });

      return key;
    },
    keys: parent => parent.getKeys(),
    user: parent => parent.getUser()
  },
  Query: {
    keys: (parent, args, {user}) =>
      user.getKeys({
        order: [['id', 'desc']]
      }),
    project: (parent, args, {Project}) => Project.findByPk(args.id),
    projects: (parent, args, {user}) => user.getProjects()
  },
  Mutation: {
    createKey: (parent, {projectId}, {Key, user}) =>
      Key.create({
        userId: user.id,
        projectId
      }),
    updateKey: async (parent, {id}, {user}) => {
      const key = await user.getKey(id);
      return key.update({
        value: hat()
      });
    },
    deleteKey: async (parent, {id}, {user}) => {
      const key = await user.getKey(id);
      await key.destroy();
      return key;
    },
    createProject: async (parent, {name}, {Key, Project, user}) => {
      const project = await Project.create({
        name,
        userId: user.id
      });

      // create an API key for the project owner
      await Key.create({
        userId: user.id,
        projectId: project.id
      });

      return project;
    },
    deleteProject: async (parent, {id}, {user}) => {
      const [project] = await user.getProjects({
        where: {
          id
        }
      });

      if (!project) {
        throw new UserInputError('Project not found');
      }

      await project.destroy();
      return project;
    }
  }
};
