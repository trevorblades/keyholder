import {gql} from 'apollo-server-express';

export const typeDefs = gql`
  type Key {
    id: ID
    email: String
  }

  type Project {
    id: ID
    name: String
    accessKey: String
    createdAt: String
    keys: [Key]
  }

  type Query {
    project(id: ID!): Project
    projects: [Project]
  }
`;

export const resolvers = {
  Project: {
    keys: parent => parent.getKeys()
  },
  Query: {
    project: (parent, args, {Project}) => Project.findByPk(args.id),
    projects: (parent, args, {Project}) => Project.findAll()
  }
};
