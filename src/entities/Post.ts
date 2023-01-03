import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
} from "typeorm";
import { Field, ObjectType, Int } from "type-graphql";
// import { User } from "./User";

// BaseEntity is an class abstraction to help run sql requests

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  _id!: number;

  // @Field decorator is used to expose properties
  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date = new Date();

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date = new Date();

  @Field(() => String)
  @Column()
  title!: string;

  @Field()
  @Column()
  text!: string;

  @Field()
  @Column()
  creatorId: number;

  // @Field()
  // @ManyToOne(() => User, (user) => user.posts)
  // creator: User;
}
