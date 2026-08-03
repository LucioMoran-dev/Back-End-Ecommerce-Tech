import { MigrationInterface, QueryRunner } from "typeorm";

export class NormalizeArrayColumnDefaults1782874542099 implements MigrationInterface {
    name = 'NormalizeArrayColumnDefaults1782874542099'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "imgUrls" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "newsletter_campaigns" ALTER COLUMN "featuredProductIds" SET DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "newsletter_campaigns" ALTER COLUMN "featuredProductIds" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "imgUrls" SET DEFAULT ARRAY[]`);
    }

}
