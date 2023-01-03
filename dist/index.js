"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgresql_1 = require("@mikro-orm/postgresql");
const apollo_server_core_1 = require("apollo-server-core");
const apollo_server_express_1 = require("apollo-server-express");
const connect_redis_1 = __importDefault(require("connect-redis"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const ioredis_1 = __importDefault(require("ioredis"));
const type_graphql_1 = require("type-graphql");
const constants_1 = require("./constants");
const mikro_orm_config_1 = __importDefault(require("./mikro-orm.config"));
const hello_1 = require("./resolvers/hello");
const post_1 = require("./resolvers/post");
const user_1 = require("./resolvers/user");
const main = async () => {
    const session = require("express-session");
    try {
        const orm = await postgresql_1.MikroORM.init(mikro_orm_config_1.default);
        await orm.getMigrator().up();
        const app = (0, express_1.default)();
        let RedisStore = (0, connect_redis_1.default)(session);
        const redis = new ioredis_1.default();
        app.set("trust proxy", true);
        app.set("Access-Control-Allow-Origin", "http://localhost:4000/graphql");
        app.set("Access-Control-Allow-Credentials", true);
        const corsOptions = {
            origin: ["http://localhost:3000", "https://studio.apollographql.com"],
            credentials: true,
        };
        app.use((0, cors_1.default)(corsOptions));
        app.use(session({
            name: constants_1.COOKIE_NAME,
            store: new RedisStore({
                client: redis,
                disableTouch: true,
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24,
                httpOnly: false,
                sameSite: "lax",
                secure: constants_1.__prod__,
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
                (0, apollo_server_core_1.ApolloServerPluginLandingPageGraphQLPlayground)({
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
    }
    catch (error) {
        console.log(error, "ERRR");
    }
};
main().catch((err) => console.error(err));
//# sourceMappingURL=index.js.map