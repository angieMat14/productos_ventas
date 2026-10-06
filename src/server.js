import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { expressMiddleware } from "@as-integrations/express5";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { resolvers, typeDefs } from "./graphql/schema.js";

const app = express();

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })]
});

app.get("/health", (_, response) => {
  response.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

async function start() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("Falta configurar la variable de entorno MONGODB_URI.");
  }

  await mongoose.connect(mongoUri);

  await apolloServer.start();

  app.use(
    "/graphql",
    cors({ origin: process.env.CORS_ORIGIN || "*" }),
    express.json(),
    expressMiddleware(apolloServer)
  );

  const port = Number(process.env.PORT || 4000);

  app.listen(port, "0.0.0.0", () => {
    console.log(`API lista en el puerto ${port}; GraphQL: /graphql`);
  });
}

start().catch((error) => {
  console.error("No se pudo iniciar la API:", error.message);
  process.exitCode = 1;
});