"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryData1676310761316 = void 0;
class CategoryData1676310761316 {
    async up(queryRunner) {
        await queryRunner.query(`insert into category (title) values ('gamming');
        insert into category (title) values ('sports');
        insert into category (title) values ('buisness');
        insert into category (title) values ('crypto');
        insert into category (title) values ('celebrities');
        insert into category (title) values ('news');
        `);
    }
    async down(_) { }
}
exports.CategoryData1676310761316 = CategoryData1676310761316;
//# sourceMappingURL=1676310761310-CategoryData.js.map