import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Field, ObjectType, Int } from "type-graphql";
import { User } from "./User";
import { Updoot } from "./Updoot";
import { Category } from "./Category";
import { Comment } from "./Comment";

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
  @Column({ type: "int", default: 0 })
  points!: number;

  @Field(() => Int, { nullable: true })
  voteStatus!: number | null; // 1 -1 or null

  @Field()
  @Column()
  creatorId: number;

  @Field()
  @Column()
  categoryId: number;

  @Field()
  @ManyToOne(() => User, (user) => user.posts, { eager: true })
  creator: User;

  @Field(() => Category)
  @ManyToOne(() => Category, (category) => category.posts, { eager: true })
  category: Category;

  @OneToMany(() => Updoot, (updoot) => updoot.post)
  updoots: Updoot[];

  // @OneToMany(() => Comment, (comment) => comment.post)
  // comments: Comment[];
}
