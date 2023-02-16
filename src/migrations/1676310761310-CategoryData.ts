import { MigrationInterface, QueryRunner } from "typeorm";

export class CategoryData1676310761316 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `insert into category (title) values ('gamming');
        insert into category (title) values ('sports');
        insert into category (title) values ('buisness');
        insert into category (title) values ('crypto');
        insert into category (title) values ('celebrities');
        insert into category (title) values ('news');
        `
    );
  }

  public async down(_: QueryRunner): Promise<void> {}
}
