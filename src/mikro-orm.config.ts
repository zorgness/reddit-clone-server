import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { MikroORM } from "@mikro-orm/postgresql";

export default {
  entities: [Post],
  dbName: "lireddit",
  type: "postgresql",
  debug: !__prod__,
  user: "",
  password: "",
} as Parameters<typeof MikroORM.init>[0];
