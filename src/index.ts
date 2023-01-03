import { MikroORM } from "@mikro-orm/postgresql";
// import { Post } from "./entities/Post";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import cors from "cors";
import express from "express";
import Redis from "ioredis";
import { buildSchema } from "type-graphql";
import { COOKIE_NAME, __prod__ } from "./constants";
import mikroConfig from "./mikro-orm.config";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

const main = async () => {
  const session = require("express-session");

  try {
    const orm = await MikroORM.init(mikroConfig);
    await orm.getMigrator().up();

    const app = express();
    // const redisClient = createClient({ legacyMode: true });
    let RedisStore = connectRedis(session);
    // const redis = new Redis(process.env.REDIS_URL as string);
    const redis = new Redis();
    // await redis.connect().catch(console.error);

    app.set("trust proxy", true);
    app.set("Access-Control-Allow-Origin", "http://localhost:4000/graphql");
    app.set("Access-Control-Allow-Credentials", true);

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

      context: ({ req, res }) => ({ em: emFork, req, res, redis }),
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
