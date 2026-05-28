// src/patients/patients.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Patient } from "./entities/patient.entity";
import { PatientsService } from "./patients.service";
import { PatientsController } from "./patients.controller";
import { UserServiceClient } from "../common/http/user-service.client";
import { HttpClient } from "../common/http/http-client";

@Module({
  imports: [TypeOrmModule.forFeature([Patient])],
  controllers: [PatientsController],
  providers: [PatientsService, HttpClient, UserServiceClient],
})
export class PatientsModule {}
