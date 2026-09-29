import { GraphQLError } from 'graphql';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildProductQuery(filter = {}) {
  const query = {};

  if (filter.name?.trim()) {
    query.name = { $regex: escapeRegex(filter.name.trim()), $options: 'i' };
  }

  if (filter.category?.trim()) {
    query.category = { $regex: `^${escapeRegex(filter.category.trim())}$`, $options: 'i' };
  }

  if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
    query.price = {};
    if (filter.minPrice !== undefined) query.price.$gte = filter.minPrice;
    if (filter.maxPrice !== undefined) query.price.$lte = filter.maxPrice;

    if (filter.minPrice !== undefined && filter.maxPrice !== undefined && filter.minPrice > filter.maxPrice) {
      throw new GraphQLError('minPrice no puede ser mayor que maxPrice.', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
  }

  if (filter.inStock === true) query.stock = { $gt: 0 };
  if (filter.inStock === false) query.stock = 0;

  return query;
}

function validateObjectId(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new GraphQLError('El id del producto no es válido.', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
}

export const resolvers = {
  Product: {
    id: (product) => product._id.toString(),
  },
  Query: {
    products: (_parent, { filter }) => Product.find(buildProductQuery(filter)).sort({ name: 1 }),
    product: (_parent, { id }) => {
      validateObjectId(id);
      return Product.findById(id);
    },
  },
  Mutation: {
    updateProduct: async (_parent, { id, input }) => {
      validateObjectId(id);

      const updates = Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined),
      );
      if (Object.keys(updates).length === 0) {
        throw new GraphQLError('Indica al menos un campo para actualizar.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (Object.values(updates).some((value) => value === null)) {
        throw new GraphQLError('Los campos de actualización no pueden ser null.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      return Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    },
  },
};
