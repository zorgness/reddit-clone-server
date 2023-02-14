import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Post } from "../entities/Post";
import { Updoot } from "../entities/Updoot";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
  @Field()
  categoryId: number;
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

  // NOT WORKING ??? TO LOAD USER AS CREATOR ON POST IN A SINGLE QUERY
  //
  // @FieldResolver(() => User)
  // async creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
  //   console.log("userloader: ", userLoader);
  //   console.log("post: ", post);
  //   const user = await userLoader.load(post.creatorId);

  //   return user;
  // }

  // MODOIFY THE ORDER OF POST DEPENDS ON VOTE
  //
  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(
    @Root() post: Post,
    @Ctx() { updootLoader, req }: MyContext
  ) {
    if (!req.session.userId) {
      return null;
    }

    const updoot = await updootLoader.load({
      postId: post._id,
      userId: req.session.userId,
    });

    return updoot ? updoot.value : null;
  }

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

    const updoot = await Updoot.findOne({ where: { postId, userId } });

    // user as already voted and want to change their vote
    if (updoot && updoot.value !== realValue) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
        update updoot
        set value = $1
        where "postId" = $2 and "userId" = $3
        `,
          [realValue, postId, userId]
        );

        await tm.query(
          ` Update post
            set points = points + $1
            where _id = $2 `,
          [2 * realValue, postId]
        );
      });
    } else if (!updoot) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
        insert into updoot ("userId", "postId", value)
        values ($1, $2, $3)
        `,
          [userId, postId, value]
        ),
          await tm.query(
            `update post
          set points = points + $1
          where _id = $2 `,
            [realValue, postId]
          );
      });
    }

    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("categoryId", () => Int, { nullable: true }) categoryId: number | null,
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: MyContext
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);

    const realLimitPlusOne = realLimit + 1;

    const replacements: any[] = [realLimitPlusOne];

    let cursorIndex = 2;
    if (req.session.userId) {
      replacements.push(req.session.userId);
      cursorIndex = 3;
    }

    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }

    // const posts = await getConnection().query(
    //   `
    // select p.*
    // from post p
    // ${cursor ? `where p."createdAt" < $2` : ""}
    // order by p."createdAt" DESC
    // limit $1
    // `,
    //   replacements
    // );

    const posts = await getConnection().query(
      `
    select p.*,
    json_build_object(
      '_id', u._id,
      'username', u.username) creator,
      json_build_object(
        '_id', c._id,
        'title', c.title
      ) category,
      ${
        req.session.userId
          ? `(select value from updoot where "userId" = $2 and "postId" = p._id) "voteStatus"`
          : "null as voteStatus"
      }
    from post p
    inner join public.user u on u._id = p."creatorId"
    inner join category c on c._id = p."categoryId"
    ${cursor ? `where p."createdAt" < $${cursorIndex}` : ""}
    ${cursor && categoryId ? "and" : ""}
    ${!cursor && categoryId ? "where" : ""}
    ${categoryId ? `p."categoryId" = ${categoryId}` : ""}
    order by p."createdAt" DESC
    limit $1
    `,
      replacements
    );

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }

  @Query(() => Post, { nullable: true })
  async post(@Arg("_id", () => Int) _id: number): Promise<Post | undefined> {
    const post = await Post.findOne({
      where: { _id: _id },
    });
    return post;
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
    @Arg("categoryId", () => Number, { nullable: true }) categoryId: number,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text, categoryId })
      .where(
        '_id = :_id and "creatorId" = :creatorId and "categoryId" = :categoryId',
        {
          _id,
          creatorId: req.session.userId,
          categoryId,
        }
      )
      .returning("*")
      .execute();

    return result.raw[0];
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("_id") _id: number,
    @Ctx() { req }: MyContext
  ): Promise<Boolean> {
    const post = await Post.findOne(_id);
    if (!post) {
      return false;
    }
    if (post.creatorId !== req.session.userId) {
      return false;
    }

    await Post.delete(_id);
    return true;
  }
}
