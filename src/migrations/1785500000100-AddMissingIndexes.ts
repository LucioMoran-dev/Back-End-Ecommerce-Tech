import { MigrationInterface, QueryRunner } from 'typeorm';

// Crea los indices detectados en la auditoria de entities:
//  - files.productId: FileService filtra los archivos por producto (getProductImages / deleteImage).
//  - refund_requests.order_id: al crear un refund se busca uno PENDING por orden (anti-duplicado).
// Nombres de columna confirmados contra information_schema (productId camelCase, order_id snake_case).
// IF NOT EXISTS -> idempotente. CREATE INDEX normal (no CONCURRENTLY) porque corre dentro de la
// transaccion de la migracion y las tablas son chicas; en prod con tablas grandes se usaria CONCURRENTLY.
export class AddMissingIndexes1785500000100 implements MigrationInterface {
  name = 'AddMissingIndexes1785500000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_files_product" ON "files" ("productId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_refund_order" ON "refund_requests" ("order_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refund_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_product"`);
  }
}
