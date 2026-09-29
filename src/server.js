import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { expressMiddleware } from '@as-integrations/express5';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { resolvers } from './graphql/resolvers.js';
import { typeDefs } from './graphql/schema.js';

const port = Number(process.env.PORT ?? 4000);
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error('Falta configurar la variable de entorno MONGODB_URI.');
}

const app = express();
const apollo = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
});

await mongoose.connect(mongoUri);
await apollo.start();

app.get('/health', (_request, response) => {
  const connected = mongoose.connection.readyState === 1;
  response.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'unavailable' });
});

app.use('/graphql', cors(), express.json(), expressMiddleware(apollo));

const httpServer = app.listen(port, '0.0.0.0', () => {
  console.log(`API GraphQL disponible en el puerto ${port}`);
});

let isShuttingDown = false;
async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`Señal ${signal} recibida; cerrando el servidor.`);
  httpServer.close(async () => {
    await apollo.stop();
    await mongoose.disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
