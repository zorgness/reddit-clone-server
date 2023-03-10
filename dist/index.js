"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("dotenv-safe/config");
const apollo_server_core_1 = require("apollo-server-core");
const apollo_server_express_1 = require("apollo-server-express");
const connect_redis_1 = __importDefault(require("connect-redis"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const ioredis_1 = __importDefault(require("ioredis"));
const path_1 = __importDefault(require("path"));
const type_graphql_1 = require("type-graphql");
const typeorm_1 = require("typeorm");
const constants_1 = require("./constants");
const Post_1 = require("./entities/Post");
const User_1 = require("./entities/User");
const Comment_1 = require("./entities/Comment");
const hello_1 = require("./resolvers/hello");
const post_1 = require("./resolvers/post");
const user_1 = require("./resolvers/user");
const Updoot_1 = require("./entities/Updoot");
const createUserLoader_1 = require("./utils/createUserLoader");
const createUpdooLoader_1 = require("./utils/createUpdooLoader");
const Category_1 = require("./entities/Category");
const category_1 = require("./resolvers/category");
const main = async () => {
    var _a;
    const session = require("express-session");
    try {
        await (0, typeorm_1.createConnection)({
            type: "postgres",
            url: process.env.DATABASE_URL,
            migrations: [path_1.default.join(__dirname, "./migrations/*")],
            logging: true,
            synchronize: !constants_1.__prod__,
            entities: [Post_1.Post, User_1.User, Updoot_1.Updoot, Category_1.Category, Comment_1.Comment],
        });
        const app = (0, express_1.default)();
        let RedisStore = (0, connect_redis_1.default)(session);
        const redisUrl = (_a = process.env.REDIS_URL) === null || _a === void 0 ? void 0 : _a.split(":");
        const redis = new ioredis_1.default(constants_1.__prod__
            ? process.env.REDIS_URL
            : {
                port: parseInt(redisUrl === null || redisUrl === void 0 ? void 0 : redisUrl[1]),
                host: redisUrl === null || redisUrl === void 0 ? void 0 : redisUrl[0],
            });
        app.set("trust proxy", 1);
        const corsOptions = {
            origin: [process.env.CORS_ORIGIN],
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
                httpOnly: true,
                sameSite: "lax",
                secure: constants_1.__prod__,
                domain: constants_1.__prod__ ? ".mini-reddit.fun" : undefined,
            },
            saveUninitialized: false,
            secret: process.env.SESSION_SECRET,
            resave: false,
        }));
        app.get("/", (_, res) => {
            res.send("api connection established");
        });
        const apolloServer = new apollo_server_express_1.ApolloServer({
            schema: await (0, type_graphql_1.buildSchema)({
                resolvers: [
                    hello_1.HelloResolver,
                    post_1.PostResolver,
                    user_1.UserResolver,
                    category_1.CategoryResolver,
                ],
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
            context: ({ req, res }) => ({
                req,
                res,
                redis,
                userloader: (0, createUserLoader_1.createUserLoader)(),
                updootLoader: (0, createUpdooLoader_1.createUpdootLoader)(),
            }),
        });
        await apolloServer.start();
        apolloServer.applyMiddleware({
            app,
            cors: false,
        });
        app.listen(parseInt(process.env.PORT), () => {
            console.log("server listening on port 4000");
        });
    }
    catch (error) {
        console.log(error, "ERRR");
    }
};
main().catch((err) => console.error(err));
//# sourceMappingURL=index.js.map