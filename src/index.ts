import { MikroORM } from "@mikro-orm/postgresql";
// import { Post } from "./entities/Post";
import mikroConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { __prod__, __secret__ } from "./constants";
// import { MyContext } from "./types";
import { createClient } from "redis";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
// import session from "express-session";
import connectRedis from "connect-redis";

const main = async () => {
  const session = require("express-session");

  try {
    const orm = await MikroORM.init(mikroConfig);
    await orm.getMigrator().up();

    const app = express();
    app.set("trust proxy", process.env.NODE_ENV !== "production");
    app.set("Access-Control-Allow-Origin", "https://studio.apollographql.com");
    app.set("Access-Control-Allow-Credentials", true);

    const redisClient = createClient({ legacyMode: true });
    await redisClient.connect().catch(console.error);
    let RedisStore = connectRedis(session);

    // app.get("/", (_, res) => {
    //   res.send("hello world!");
    // });

    app.use(
      session({
        name: "QIDTOM",
        store: new RedisStore({
          client: redisClient as any,
          disableTouch: true,
        }),
        cookie: {
          maxAge: 1000 * 60 * 60 * 24, // 24 hours
          httpOnly: true,
          sameSite: "none", // csrf protection
          secure: true,
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
          // options
        }),
      ],
      context: ({ req, res }) => ({ em: emFork, req, res }),
    });

    const cors = {
      // add for apollo studio
      credentials: true,
      origin: "https://studio.apollographql.com",
    };

    await apolloServer.start();

    apolloServer.applyMiddleware({
      app,
      cors,
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
