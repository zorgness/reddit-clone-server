import "reflect-metadata";
import "dotenv-safe/config";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import cors from "cors";
import express from "express";
import Redis from "ioredis";
import path from "path";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import { COOKIE_NAME, __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { Updoot } from "./entities/Updoot";
import { createUserLoader } from "./utils/createUserLoader";
import { createUpdootLoader } from "./utils/createUpdooLoader";

const main = async () => {
  const session = require("express-session");

  try {
    const conn = await createConnection({
      type: "postgres",
      url: process.env.DATABASE_URL,
      migrations: [path.join(__dirname, "./migrations/*")],
      logging: true,
      // synchronize: true,
      entities: [Post, User, Updoot],
    });

    await conn
      .runMigrations()
      .then((result) => console.log(result))
      .catch((err) => console.log(err));

    const app = express();

    let RedisStore = connectRedis(session);

    const redis = new Redis(process.env.REDIS_URL as any);

    app.set("trust proxy", 1);
    app.set("Access-Control-Allow-Credentials", true);
    app.set("Access-Control-Allow-Origin", process.env.CORS_ORIGIN as string);
    app.set(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-HTTP-Method-Override, Set-Cookie, Cookie"
    );
    app.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");

    const corsOptions = {
      // add for apollo studio
      origin: [process.env.CORS_ORIGIN as string],
      credentials: true,
    };

    app.use(cors(corsOptions));
    app.use(
      session({
        name: COOKIE_NAME,
        store: new RedisStore({
          client: redis as any,
          disableTouch: true,
        }),
        cookie: {
          maxAge: 1000 * 60 * 60 * 24, // 24 hours
          httpOnly: false,
          sameSite: "lax", // csrf protection
          secure: __prod__,
        },
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET,
        resave: false,
      })
    );

    app.get("/", (_, res) => {
      res.send("api connection established");
    });

    const apolloServer = new ApolloServer({
      schema: await buildSchema({
        resolvers: [HelloResolver, PostResolver, UserResolver],
        validate: false,
      }),
      plugins: [
        ApolloServerPluginLandingPageGraphQLPlayground({
          settings: {
            "request.credentials": "include",
            "editor.reuseHeaders": false,
          },
        }),
      ],

      context: ({ req, res }) => ({
        req,
        res,
        redis,
        userloader: createUserLoader(),
        updootLoader: createUpdootLoader(),
      }),
    });

    await apolloServer.start();

    apolloServer.applyMiddleware({
      app,
      cors: false,
    });

    app.listen(parseInt(process.env.PORT as string), () => {
      console.log("server listening on port 4000");
    });
  } catch (error) {
    console.log(error, "ERRR");
  }

  // const emFork = orm.em.fork();
  // // const post = await emFork.create(Post, {
  // //   title: "second post",
  // // } as Post);
  // // await emFork.persistAndFlush(post);
  // const posts = await emFork.find(Post, {});
  // console.log(posts);
};

main().catch((err) => console.error(err));
