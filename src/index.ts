import { MikroORM } from "@mikro-orm/postgresql";
import { Post } from "./entities/Post";
import mikroConfig from "./mikro-orm.config";

const main = async () => {
  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up();

  const emFork = orm.em.fork();
  // const post = await emFork.create(Post, {
  //   title: "second post",
  // } as Post);
  // await emFork.persistAndFlush(post);
  const posts = await emFork.find(Post, {});
  console.log(posts);
};

main().catch((err) => console.error(err));
