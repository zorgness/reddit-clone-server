import { MikroORM } from "@mikro-orm/postgresql";
// import { Post } from "./entities/Post";
import mikroConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { COOKIE_NAME, __prod__ } from "./constants";
import { createClient } from "redis";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import connectRedis from "connect-redis";
import cors from "cors";

const main = async () => {
  const session = require("express-session");

  try {
    const orm = await MikroORM.init(mikroConfig);
    await orm.getMigrator().up();

    const app = express();
    app.set("trust proxy", true);
    app.set("Access-Control-Allow-Origin", "http://localhost:4000/graphql");
    app.set("Access-Control-Allow-Credentials", true);

    const redisClient = createClient({ legacyMode: true });
    await redisClient.connect().catch(console.error);
    let RedisStore = connectRedis(session);

    // app.get("/", (_, res) => {
    //   res.send("hello world!");
    // });
    const corsOptions = {
      // add for apollo studio
      origin: ["http://localhost:3000", "https://studio.apollographql.com"],
      credentials: true,
    };

    app.use(cors(corsOptions));
    app.use(
      session({
        name: COOKIE_NAME,
        store: new RedisStore({
          client: redisClient,
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

    const emFork = orm.em.fork();

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

      context: ({ req, res }) => ({ em: emFork, req, res }),
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
