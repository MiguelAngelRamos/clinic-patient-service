// src/patients/entities/patient.entity.ts
//
// Perfil clínico del paciente — propio del patient-service.
// userId es una referencia al user en user-service, NO una FK real.
// En microservicios no hay FK entre BDs distintas — la integridad
// referencial se garantiza por el protocolo (verificar existencia via HTTP REST).
//
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

@Entity("patients")
export class Patient {
  // UUID propio del patient-service — generado aquí
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // userId — referencia al usuario en user-service
  // No es FK de BD — es una referencia lógica entre microservicios
  // Índice único: un usuario solo puede tener un perfil de paciente
  @Index({ unique: true })
  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  // Datos clínicos del paciente
  @Column({ name: "first_name", length: 100 })
  firstName!: string;

  @Column({ name: "last_name", length: 100 })
  lastName!: string;

  @Column({ name: "date_of_birth", type: "date" })
  dateOfBirth!: Date;

  @Column({
    type: "enum",
    enum: Gender,
  })
  gender!: Gender;

  @Column({ type: "varchar", length: 20, nullable: true })
  phone!: string | null;

  @Column({ name: "emergency_contact_name", type: "varchar", length: 100, nullable: true })
  emergencyContactName!: string | null;

  @Column({ name: "emergency_contact_phone", type: "varchar", length: 20, nullable: true })
  emergencyContactPhone!: string | null;

  @Column({ type: "text", nullable: true })
  allergies!: string | null;

  @Column({ name: "medical_notes", type: "text", nullable: true })
  medicalNotes!: string | null;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
