import {
  Entity,
  PrimaryKey,
  Property,
  OptionalProps,
  OneToMany,
} from "@mikro-orm/core";
import { Field, ObjectType, Int } from "type-graphql";
import { Post } from "./Post";

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

  @Field(() => String)
  @Property({ type: "text", unique: true })
  email!: string;

  @Property({ type: "text" })
  password!: string;

  // @OneToMany(() => Post, (post) => post.creator)
  // posts: Post[];
}
