import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { MikroORM } from "@mikro-orm/postgresql";
import path from "path";

export default {
  migrations: {
    path: path.join(__dirname, './migrations')
  },
  entities: [Post],
  dbName: "lireddit",
  type: "postgresql",
  debug: !__prod__,
  user: "",
  password: "",
} as Parameters<typeof MikroORM.init>[0];
