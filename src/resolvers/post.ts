import { Post } from "../entities/Post";
import { MyContext } from "src/types";
import { Arg, Ctx, Query, Resolver, Int, Mutation } from "type-graphql";

// @Resolver is used as Controller in Symfony
@Resolver()
export class PostResolver {
  @Query(() => [Post])
  posts(@Ctx() { em }: MyContext): Promise<Post[]> {
    return em.find(Post, {});
  }

  @Query(() => Post, { nullable: true })
  post(
    @Arg("_id", () => Int) _id: number,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    return em.findOne(Post, { _id });
  }

  // @Mutation is for inserting, updating, deleting
  @Mutation(() => Post)
  async createPost(
    @Arg("title") title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    const post = em.create(Post, {
      title,
    } as Post);
    await em.persistAndFlush(post);
    return post;
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("_id") _id: number,
    @Arg("title", () => String, { nullable: true }) title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    const post = await em.findOne(Post, { _id });
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      post.title = title;
      await em.persistAndFlush(post);
    }

    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(
    @Arg("_id") _id: number,
    @Ctx() { em }: MyContext
  ): Promise<Boolean> {
    const post = await em.findOne(Post, { _id });
    if (!post) {
      return false;
    }
    em.removeAndFlush(post);

    return true;
  }
}
