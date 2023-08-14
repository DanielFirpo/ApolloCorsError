import express from "express";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { typeDefs, resolvers } from "./graphql";
// import spotifyAuthRouter from "./routes/spotifyAuth";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
// import { decodeToken, disallowTrace } from "./middleware";
const jwt = require("jsonwebtoken");
function decodeToken(req: Request, res: Response, next: Function) {
  const token = req.cookies?.token;
  if (token) {
    try {
        res.locals.user = jwt.verify(token, "supersecretkey!");//process.env.JWT_SECRET);
    } catch (err) {
      console.log("Issue decoding token, client sent fake token?", err);
    }
  }
  next();
}
// import prisma from "./prisma/prismaConnection";
import { Request, Response } from "express";

dotenv.config();
const app = express();
const port = 4000;

const httpServer = http.createServer(app);

const bootstrapServer = async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });
  await server.start();

  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }));

  // parse application/json
  app.use(bodyParser.json());

  function corsSettings(req: Request, res: Response, next: Function) {
    console.log("CORS middleware executed");
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Credentials", "true"); // Allow credentials
    next();
  }

  // cors is sending it's own settings, and they will override the ones from
  // the corsSettings function 😊
  // app.use(cors());
  app.use(corsSettings);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  // app.use(disallowTrace);
  app.use(cookieParser());
  app.use(decodeToken);
  console.log("http://localhost:5173");

  app.use(
    "/graphql",
    // cors(),
    // corsSettings,
    cors<cors.CorsRequest>({
      origin: "http://localhost:5173",
      credentials: true,
    }),
    expressMiddleware(server, {
      context: async ({ req, res }) => ({
        user: res.locals.user,
      }),
    })
  );

  // app.use("/spotifyauth", spotifyAuthRouter);

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.listen(port, () => {
    console.log(`🚀 Express ready at http://localhost:${port}`);
    console.log(`🚀 Graphql ready at http://localhost:${port}/graphql`);
  });
};

// process.on("exit", async () => {
//   console.log("Server is exiting. Disconnecting Prisma...");
//   await prisma.$disconnect();
// });

bootstrapServer();
