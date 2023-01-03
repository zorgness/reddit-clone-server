import {
  Entity,
  PrimaryKey,
  Property,
  OptionalProps,
  ManyToOne,
} from "@mikro-orm/core";
import { Field, ObjectType, Int } from "type-graphql";
import { User } from "./User";

@ObjectType()
@Entity()
export class Post {
  [OptionalProps]?: "title" | "updateAt" | "createdAt";
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
  @Property({ type: "text" })
  title!: string;

  @Field()
  @Property()
  text!: string;

  @Field()
  @Property()
  creatorId: number;

  // @Field()
  // @ManyToOne(() => User, (user) => user.posts)
  // creator: User;

  constructor(title: string, text: string) {
    this.title = title;
    this.text = text;
  }
}
