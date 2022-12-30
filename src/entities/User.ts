import { Entity, PrimaryKey, Property, OptionalProps } from "@mikro-orm/core";
import { Field, ObjectType, Int } from "type-graphql";

@ObjectType()
@Entity()
export class User {
  [OptionalProps]?: "username" | "updateAt" | "createdAt" | "password";
  @Field(() => Int)
  @PrimaryKey()
  _id!: number;

  // @Field decorator is used to expose properties
  @Field(() => String)
  @Property({ type: "date" })
  createdAt: Date = new Date();

  @Field(() => String)
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Field(() => String)
  @Property({ type: "text", unique: true })
  username!: string;

  @Property({ type: "text" })
  password!: string;
}
