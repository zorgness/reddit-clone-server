"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20221229175806 = void 0;
const migrations_1 = require("@mikro-orm/migrations");
class Migration20221229175806 extends migrations_1.Migration {
    async up() {
        this.addSql('create table "post" ("_id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "title" text not null);');
    }
}
exports.Migration20221229175806 = Migration20221229175806;
//# sourceMappingURL=Migration20221229175806.js.map