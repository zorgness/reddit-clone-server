import { Comment } from "../entities/Comment";
import { Arg, Int, Query, Resolver } from "type-graphql";

@Resolver()
export class CategoryResolver {
  @Query(() => [Comment], { nullable: true })
  async comments() {
    const comments = await Comment.find();
    return comments;
  }

  @Query(() => Comment, { nullable: true })
  async comment(
    @Arg("_id", () => Int) _id: number
  ): Promise<Comment | undefined> {
    const comment = await Comment.findOne({
      where: { _id: _id },
    });
    return comment;
  }
}
