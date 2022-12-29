"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgresql_1 = require("@mikro-orm/postgresql");
const Post_1 = require("./entities/Post");
const mikro_orm_config_1 = __importDefault(require("./mikro-orm.config"));
const main = async () => {
    const orm = await postgresql_1.MikroORM.init(mikro_orm_config_1.default);
    await orm.getMigrator().up();
    const emFork = orm.em.fork();
    const posts = await emFork.find(Post_1.Post, {});
    console.log(posts);
};
main().catch((err) => console.error(err));
//# sourceMappingURL=index.js.map