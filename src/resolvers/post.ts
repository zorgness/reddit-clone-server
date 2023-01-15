import { Post } from "../entities/Post";
import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  Query,
  Resolver,
  Int,
  Mutation,
  Field,
  InputType,
  UseMiddleware,
  ObjectType,
  FieldResolver,
  Root,
} from "type-graphql";
import dataSource, { getConnection } from "typeorm";
import { isAuth } from "../middleware/isAuth";
import { Updoot } from "../entities/Updoot";

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}

// @Resolver is used as Controller in Symfony
// cursor give the position
// limit is the number of posts after the cursor
@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() post: Post) {
    return post.text.slice(0, 50);
  }

  // @FieldResolver(() => User)
  // creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
  //   return userLoader?.load(post.creatorId);
  // }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpdoot = value !== -1;
    const realValue = isUpdoot ? 1 : -1;
    const { userId } = req.session;
    await Updoot.insert({
      userId,
      postId,
      value: realValue,
    });
    await getConnection().query(
      `update post p
      set p.points = p.points + $1
      where p._id = $2 `,
      [realValue, postId]
    );

    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);

    const realLimitPlusOne = realLimit + 1;

    const replacements: any[] = [realLimitPlusOne];

    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }

    const posts = await getConnection().query(
      `
    select p.*,
    json_build_object(
      '_id', u._id,
      'username', u.username) creator
    from post p
    inner join public.user u on u._id = p."creatorId"
    ${cursor ? `where p."createdAt" < $2` : ""}
    order by p."createdAt" DESC
    limit $1
    `,
      replacements
    );

    console.log("post: ", posts);

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }

  @Query(() => Post, { nullable: true })
  post(@Arg("_id", () => Int) _id: number): Promise<Post | undefined> {
    return Post.findOne({ where: { _id } });
  }

  // @Mutation is for inserting, updating, deleting
  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("_id") _id: number,
    @Arg("title", () => String, { nullable: true }) title: string,
    @Arg("text", () => String, { nullable: true }) text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const result = await dataSource
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId" = :creatorId', {
        _id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();

    return result.raw[0];
  }

  @Mutation(() => Boolean)
  async deletePost(
    @Arg("_id") _id: number,
    @Ctx() { req }: MyContext
  ): Promise<Boolean> {
    await Post.delete({ _id, creatorId: req.session.userId });
    return true;
  }
}
