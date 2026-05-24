import { MigrationInterface, QueryRunner } from "typeorm";

export class Repairs1773685400534 implements MigrationInterface {
    name = 'Repairs1773685400534'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."repair_comments_statussnapshot_enum" AS ENUM('pending', 'reviewing', 'in_progress', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "repair_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "repairId" uuid NOT NULL, "adminId" uuid NOT NULL, "comment" text NOT NULL, "statusSnapshot" "public"."repair_comments_statussnapshot_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8cd833a59f9154255377a721647" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_338c359d35d9aaa2b2b803ab16" ON "repair_comments" ("repairId") `);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "imgUrls" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "newsletter_campaigns" ALTER COLUMN "featuredProductIds" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "repair_comments" ADD CONSTRAINT "FK_338c359d35d9aaa2b2b803ab167" FOREIGN KEY ("repairId") REFERENCES "repairs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "repair_comments" ADD CONSTRAINT "FK_9913ca9a077165e68a3f547b101" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repair_comments" DROP CONSTRAINT "FK_9913ca9a077165e68a3f547b101"`);
        await queryRunner.query(`ALTER TABLE "repair_comments" DROP CONSTRAINT "FK_338c359d35d9aaa2b2b803ab167"`);
        await queryRunner.query(`ALTER TABLE "newsletter_campaigns" ALTER COLUMN "featuredProductIds" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "imgUrls" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`DROP INDEX "public"."IDX_338c359d35d9aaa2b2b803ab16"`);
        await queryRunner.query(`DROP TABLE "repair_comments"`);
        await queryRunner.query(`DROP TYPE "public"."repair_comments_statussnapshot_enum"`);
    }

}
