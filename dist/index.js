"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgresql_1 = require("@mikro-orm/postgresql");
const mikro_orm_config_1 = __importDefault(require("./mikro-orm.config"));
const express_1 = __importDefault(require("express"));
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const hello_1 = require("./resolvers/hello");
const post_1 = require("./resolvers/post");
const user_1 = require("./resolvers/user");
const redis_1 = require("redis");
const express_session_1 = __importDefault(require("express-session"));
const constants_1 = require("./constants");
const connect_redis_1 = __importDefault(require("connect-redis"));
const RedisStore = (0, connect_redis_1.default)(express_session_1.default);
const redisClient = (0, redis_1.createClient)();
redisClient.connect().catch(console.error);
const main = async () => {
    const orm = await postgresql_1.MikroORM.init(mikro_orm_config_1.default);
    await orm.getMigrator().up();
    const app = (0, express_1.default)();
    app.use((0, express_session_1.default)({
        name: "qid",
        store: new RedisStore({
            client: redisClient,
            disableTouch: true,
        }),
        cookie: {
            path: "/",
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly: true,
            sameSite: "lax",
            secure: constants_1.__prod__,
        },
        saveUninitialized: false,
        secret: "dhfkdqsjhfkqjfkljqsfklq",
        resave: false,
    }));
    const emFork = orm.em.fork();
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema: await (0, type_graphql_1.buildSchema)({
            resolvers: [hello_1.HelloResolver, post_1.PostResolver, user_1.UserResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({ em: emFork, req, res }),
    });
    await apolloServer.start();
    apolloServer.applyMiddleware({ app });
    app.listen(4000, () => {
        console.log("server listening on port 4000");
    });
};
main().catch((err) => console.error(err));
//# sourceMappingURL=index.js.map