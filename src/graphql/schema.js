import { GraphQLError } from "graphql";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";

export const typeDefs = `#graphql
  type Product {
    id: ID!
    name: String!
    price: Float!
    stock: Int!
    category: String!
    description: String!
  }

  input ProductFilter {
    category: String
    search: String
    minPrice: Float
    maxPrice: Float
    inStock: Boolean
  }

  input UpdateProductInput {
    name: String
    price: Float
    stock: Int
    category: String
    description: String
  }

  type Query {
    products(filter: ProductFilter): [Product!]!
    product(id: ID!): Product
  }

  type Mutation {
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
  }
`;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const resolvers = {
  Product: {
    id: (product) => product._id.toString()
  },
  Query: {
    products: async (_, { filter = {} }) => {
      const { category, search, minPrice, maxPrice, inStock } = filter;
      const query = {};

      if (category) query.category = new RegExp(`^${escapeRegex(category)}$`, "i");
      if (search) {
        const expression = new RegExp(escapeRegex(search), "i");
        query.$or = [
          { name: expression },
          { category: expression },
          { description: expression }
        ];
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined) query.price.$gte = minPrice;
        if (maxPrice !== undefined) query.price.$lte = maxPrice;
      }

      if (inStock !== undefined) query.stock = inStock ? { $gt: 0 } : 0;

      return Product.find(query).sort({ name: 1 });
    },
    product: async (_, { id }) => {
      if (!mongoose.isValidObjectId(id)) return null;
      return Product.findById(id);
    }
  },
  Mutation: {
    updateProduct: async (_, { id, input }) => {
      if (!mongoose.isValidObjectId(id)) {
        throw new GraphQLError("El ID del producto no es válido.", {
          extensions: { code: "BAD_USER_INPUT" }
        });
      }

      if (Object.keys(input).length === 0) {
        throw new GraphQLError("Debes indicar al menos un campo para actualizar.", {
          extensions: { code: "BAD_USER_INPUT" }
        });
      }

      const product = await Product.findByIdAndUpdate(id, input, {
        new: true,
        runValidators: true
      });

      if (!product) {
        throw new GraphQLError("No se encontró el producto.", {
          extensions: { code: "NOT_FOUND" }
        });
      }

      return product;
    }
  }
};