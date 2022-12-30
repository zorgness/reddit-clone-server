import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { Request, Response } from "express";
import { SessionData } from "express-session";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}
export type MyContext = {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
  req: Request & { session: SessionData };
  res: Response;
};
