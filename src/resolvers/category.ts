import { Category } from "../entities/Category";
import { Query, Resolver } from "type-graphql";

@Resolver()
export class CategoryResolver {
  @Query(() => [Category], { nullable: true })
  async category() {
    const categories = await Category.find();
    return categories;
  }
}
