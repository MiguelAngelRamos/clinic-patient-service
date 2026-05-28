// src/patients/patients.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Patient } from "./entities/patient.entity";
import { CreatePatientDto } from "./dto/create-patient.dto";
import { UpdatePatientDto } from "./dto/update-patient.dto";
import { UserServiceClient } from "../common/http/user-service.client";

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    // Cliente HTTP para comunicación síncrona con user-service
    private readonly userServiceClient: UserServiceClient,
  ) {}

  // findAll — solo ADMIN
  async findAll(): Promise<Patient[]> {
    return this.patientRepository.find({
      where: { isActive: true },
      order: { createdAt: "DESC" },
    });
  }

  // findOne — verifica ownership antes de devolver datos
  async findOne(
    id: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id, isActive: true },
    });

    if (!patient) throw new NotFoundException(`Paciente ${id} no encontrado`);

    // IDOR prevention — OWASP A01: Broken Access Control
    this.assertCanAccess(patient, requesterId, requesterRole);
    return patient;
  }

  // findByUserId — un usuario busca su propio perfil
  async findByUserId(
    userId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<Patient> {
    // Solo el propio usuario o ADMIN puede buscar por userId
    if (requesterRole !== "admin" && requesterId !== userId) {
      throw new ForbiddenException(
        "No tienes permiso para acceder a este perfil",
      );
    }

    const patient = await this.patientRepository.findOne({
      where: { userId, isActive: true },
    });

    if (!patient) {
      throw new NotFoundException(
        `No existe perfil de paciente para el usuario ${userId}`,
      );
    }

    return patient;
  }

  // create — verifica que el usuario existe en user-service via HTTP REST
  // OWASP A01: integridad referencial entre microservicios sin FK real
  async create(
    dto: CreatePatientDto,
    requesterId: string,
    requesterRole: string,
  ): Promise<Patient> {
    // Un paciente solo puede crear su propio perfil
    // ADMIN puede crear perfiles para cualquier usuario
    // El userId que se usará es el del propio solicitante (a menos que sea admin)
    const userId = requesterId;

    // ── Paso 1: Verificar que el usuario existe en user-service ──
    // Comunicación HTTP REST síncrona — necesitamos la respuesta ahora
    this.logger.log(
      `Verificando existencia del userId ${userId} en user-service`,
    );
    const userCheck = await this.userServiceClient.verifyUserExists(userId);

    if (!userCheck.exists) {
      throw new BadRequestException(
        `El usuario ${userId} no existe o está inactivo`,
      );
    }

    // Verificar que el usuario tiene rol patient
    if (userCheck.role !== "patient" && requesterRole !== "admin") {
      throw new BadRequestException(
        "Solo los usuarios con rol patient pueden tener perfil de paciente",
      );
    }

    // ── Paso 2: Verificar que no existe ya un perfil para este usuario ──
    const existing = await this.patientRepository.findOne({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un perfil de paciente para el usuario ${userId}`,
      );
    }

    // ── Paso 3: Crear el perfil clínico ──
    const patient = this.patientRepository.create({
      ...dto,
      userId,
      dateOfBirth: new Date(dto.dateOfBirth),
    });

    const saved = await this.patientRepository.save(patient);
    this.logger.log(
      `Perfil de paciente creado: ${saved.id} para userId ${userId}`,
    );
    return saved;
  }

  // update — verifica ownership
  async update(
    id: string,
    dto: UpdatePatientDto,
    requesterId: string,
    requesterRole: string,
  ): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id, isActive: true },
    });

    if (!patient) throw new NotFoundException(`Paciente ${id} no encontrado`);

    this.assertCanAccess(patient, requesterId, requesterRole);

    Object.assign(patient, dto);
    const updated = await this.patientRepository.save(patient);
    this.logger.log(`Paciente actualizado: ${updated.id}`);
    return updated;
  }

  // deactivate — soft delete — solo ADMIN
  async deactivate(id: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({ where: { id } });
    if (!patient) throw new NotFoundException(`Paciente ${id} no encontrado`);

    patient.isActive = false;
    const deactivated = await this.patientRepository.save(patient);
    this.logger.log(`Paciente desactivado: ${deactivated.id}`);
    return deactivated;
  }

  // assertCanAccess — IDOR prevention
  // El paciente solo puede acceder a su propio perfil
  // ADMIN puede acceder a cualquiera
  private assertCanAccess(
    patient: Patient,
    requesterId: string,
    requesterRole: string,
  ): void {
    if (requesterRole === "admin") return;
    if (patient.userId === requesterId) return;
    throw new ForbiddenException(
      "No tienes permiso para acceder a este perfil",
    );
  }
}
