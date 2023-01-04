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

const main = async () => {
  const session = require("express-session");

  try {
    await createConnection({
      type: "postgres",
      database: "lireddit2",
      username: "postgres",
      password: "postgres",
      migrations: [path.join(__dirname, "./migrations/*")],
      logging: true,
      synchronize: true,
      entities: [Post, User],
    });

    // await conn
    //   .runMigrations()
    //   .then((result) => console.log(result))
    //   .catch((err) => console.log(err));

    const app = express();

    let RedisStore = connectRedis(session);

    const redis = new Redis();

    app.set("trust proxy", true);
    app.set("Access-Control-Allow-Origin", "http://localhost:4000/graphql");
    app.set("Access-Control-Allow-Credentials", true);

    // app.get("/", (_, res) => {
    //   res.send("hello world!");
    // });

    const corsOptions = {
      // add for apollo studio
      origin: ["http://localhost:3000"],
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

      context: ({ req, res }) => ({ req, res, redis }),
    });

    await apolloServer.start();

    apolloServer.applyMiddleware({
      app,
      cors: false,
    });

    app.listen(4000, () => {
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
