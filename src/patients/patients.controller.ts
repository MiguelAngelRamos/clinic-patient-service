// src/patients/patients.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { PatientsService } from "./patients.service";
import { CreatePatientDto } from "./dto/create-patient.dto";
import { UpdatePatientDto } from "./dto/update-patient.dto";
import { RolesGuard, Roles } from "../common/guards/roles.guard";
import {
  CurrentUser,
  GatewayUser,
} from "../common/decorators/gateway-user.decorator";

@Controller("patients")
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  // GET /patients/health — health check para K8s probes
  @Get("health")
  health() {
    return { status: "ok", service: "clinic-patient-service" };
  }

  // GET /patients — solo ADMIN
  @UseGuards(RolesGuard)
  @Roles("admin")
  @Get()
  findAll() {
    return this.patientsService.findAll();
  }

  // GET /patients/me — el paciente obtiene su propio perfil por userId
  @Get("me")
  findMe(@CurrentUser() user: GatewayUser) {
    return this.patientsService.findByUserId(user.id, user.id, user.role);
  }

  // GET /patients/user/:userId — buscar por userId
  // Útil para que appointment-service verifique el perfil
  @Get("user/:userId")
  findByUserId(
    @Param("userId", ParseUUIDPipe) userId: string,
    @CurrentUser() user: GatewayUser,
  ) {
    return this.patientsService.findByUserId(userId, user.id, user.role);
  }

  // GET /patients/:id — por ID interno del perfil
  @Get(":id")
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: GatewayUser,
  ) {
    return this.patientsService.findOne(id, user.id, user.role);
  }

  // POST /patients — crea el perfil clínico
  // Verifica existencia del usuario en user-service via HTTP REST
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePatientDto, @CurrentUser() user: GatewayUser) {
    return this.patientsService.create(dto, user.id, user.role);
  }

  // PATCH /patients/:id — actualiza perfil — solo el propio o ADMIN
  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser() user: GatewayUser,
  ) {
    return this.patientsService.update(id, dto, user.id, user.role);
  }

  // DELETE /patients/:id — soft delete — solo ADMIN
  @UseGuards(RolesGuard)
  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  deactivate(@Param("id", ParseUUIDPipe) id: string) {
    return this.patientsService.deactivate(id);
  }
}
