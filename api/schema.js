import hat from 'hat';
import {gql} from 'apollo-server-express';

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
    createProject(name: String!): Project
  }
`;

export const resolvers = {
  Key: {
    project: parent => parent.getProject(),
    user: parent => parent.getUser()
  },
  Project: {
    keys: parent => parent.getKeys(),
    user: parent => parent.getUser()
  },
  Query: {
    keys: (parent, args, {user}) => user.getKeys(),
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
      const [key] = await user.getKeys({
        where: {
          id
        }
      });

      return key.update({
        value: hat()
      });
    },
    createProject: async (parent, {name}, {Key, Project, user}) => {
      const project = await Project.create({name});
      await project.setUser(user);

      const key = await Key.create();
      await key.setProject(project);
      await key.setUser(user);

      return project;
    }
  }
};
