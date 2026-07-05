import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPublicIdToFile1782771352693 implements MigrationInterface {
    name = 'AddPublicIdToFile1782771352693'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "files" ADD "publicId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "publicId"`);
    }

}
