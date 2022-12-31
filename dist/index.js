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
const apollo_server_core_1 = require("apollo-server-core");
const connect_redis_1 = __importDefault(require("connect-redis"));
const main = async () => {
    const session = require("express-session");
    try {
        const orm = await postgresql_1.MikroORM.init(mikro_orm_config_1.default);
        await orm.getMigrator().up();
        const app = (0, express_1.default)();
        app.set("trust proxy", process.env.NODE_ENV !== "production");
        app.set("Access-Control-Allow-Origin", "https://studio.apollographql.com");
        app.set("Access-Control-Allow-Credentials", true);
        const redisClient = (0, redis_1.createClient)({ legacyMode: true });
        await redisClient.connect().catch(console.error);
        let RedisStore = (0, connect_redis_1.default)(session);
        app.use(session({
            name: "QIDTOM",
            store: new RedisStore({
                client: redisClient,
                disableTouch: true,
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24,
                httpOnly: true,
                sameSite: "none",
                secure: true,
            },
            saveUninitialized: false,
            secret: process.env.SESSION_SECRET,
            resave: false,
        }));
        const emFork = orm.em.fork();
        const apolloServer = new apollo_server_express_1.ApolloServer({
            schema: await (0, type_graphql_1.buildSchema)({
                resolvers: [hello_1.HelloResolver, post_1.PostResolver, user_1.UserResolver],
                validate: false,
            }),
            plugins: [
                (0, apollo_server_core_1.ApolloServerPluginLandingPageGraphQLPlayground)({}),
            ],
            context: ({ req, res }) => ({ em: emFork, req, res }),
        });
        const cors = {
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
    }
    catch (error) {
        console.log(error, "ERRR");
    }
};
main().catch((err) => console.error(err));
//# sourceMappingURL=index.js.map