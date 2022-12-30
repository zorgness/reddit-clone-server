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
import { MyContext } from "./types";

const main = async () => {
  const session = require("express-session");
  let RedisStore = require("connect-redis")(session);

  // redis@v4
  const { createClient } = require("redis");
  let redisClient = createClient({ legacyMode: true });
  redisClient.connect().catch(console.error);

  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up();

  const app = express();

  // app.get("/", (_, res) => {
  //   res.send("hello world!");
  // });

  app.use(
    session({
      name: "qid",
      store: new RedisStore({
        client: redisClient,
        disableTouch: true,
      }),
      cookie: {
        path: "/",
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        httpOnly: true,
        sameSite: "lax", // csrf protection
        secure: __prod__,
      },
      saveUninitialized: false,
      secret: "dhfkdqsjhfkqjfkljqsfklq",
      resave: false,
    })
  );

  const emFork = orm.em.fork();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ em: emFork, req, res }),
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({
    app,
  });

  app.listen(4000, () => {
    console.log("server listening on port 4000");
  });

  // const emFork = orm.em.fork();
  // // const post = await emFork.create(Post, {
  // //   title: "second post",
  // // } as Post);
  // // await emFork.persistAndFlush(post);
  // const posts = await emFork.find(Post, {});
  // console.log(posts);
};

main().catch((err) => console.error(err));
