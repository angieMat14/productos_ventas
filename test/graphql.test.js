import assert from 'node:assert/strict';
import test from 'node:test';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { resolvers } from '../src/graphql/resolvers.js';
import { typeDefs } from '../src/graphql/schema.js';

test('Apollo valida el esquema y permite introspección', async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
  });

  await server.start();
  try {
    const result = await server.executeOperation({
      query: '{ __schema { queryType { name } } }',
    });
    assert.equal(result.body.kind, 'single');
    assert.equal(result.body.singleResult.data.__schema.queryType.name, 'Query');
  } finally {
    await server.stop();
  }
});

test('products combina filtros y escapa expresiones regulares', () => {
  const query = resolvers.Query.products(null, {
    filter: {
      name: 'A+B',
      category: 'Libros',
      minPrice: 1,
      maxPrice: 20,
      inStock: true,
    },
  });

  assert.deepEqual(query.getFilter(), {
    name: { $regex: 'A\\+B', $options: 'i' },
    category: { $regex: '^Libros$', $options: 'i' },
    price: { $gte: 1, $lte: 20 },
    stock: { $gt: 0 },
  });
});

test('products rechaza un rango de precios invertido', () => {
  assert.throws(
    () => resolvers.Query.products(null, { filter: { minPrice: 25, maxPrice: 5 } }),
    { message: 'minPrice no puede ser mayor que maxPrice.' },
  );
});
