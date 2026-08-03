import { MigrationInterface, QueryRunner } from 'typeorm';

// Agrega la columna opcional "description" a la tabla categories. Es nullable, asi que las
// categorias existentes quedan con NULL y no hay que backfillear nada; el admin puede cargarla
// despues via PUT /categories/:id. synchronize esta en false, por eso el cambio va por migracion.
export class AddDescriptionToCategory1785500000000 implements MigrationInterface {
  name = 'AddDescriptionToCategory1785500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" ADD "description" character varying(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "description"`);
  }
}
