// src/database/migrations/1748000002000-InitialSchema.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1748000002000 implements MigrationInterface {
  name = "InitialSchema1748000002000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TYPE "public"."patients_gender_enum"
        AS ENUM('male', 'female', 'other')
    `);

    await queryRunner.query(`
      CREATE TABLE "patients" (
        "id"                       UUID          NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"                  UUID          NOT NULL,
        "first_name"               VARCHAR(100)  NOT NULL,
        "last_name"                VARCHAR(100)  NOT NULL,
        "date_of_birth"            DATE          NOT NULL,
        "gender"                   "public"."patients_gender_enum" NOT NULL,
        "phone"                    VARCHAR(20),
        "emergency_contact_name"   VARCHAR(100),
        "emergency_contact_phone"  VARCHAR(20),
        "allergies"                TEXT,
        "medical_notes"            TEXT,
        "is_active"                BOOLEAN       NOT NULL DEFAULT true,
        "created_at"               TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"               TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_patients_id"       PRIMARY KEY ("id"),
        CONSTRAINT "UQ_patients_user_id"  UNIQUE ("user_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_patients_user_id"   ON "patients" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_patients_is_active" ON "patients" ("is_active")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_patients_is_active"`);
    await queryRunner.query(`DROP INDEX "IDX_patients_user_id"`);
    await queryRunner.query(`DROP TABLE "patients"`);
    await queryRunner.query(`DROP TYPE "public"."patients_gender_enum"`);
  }
}
