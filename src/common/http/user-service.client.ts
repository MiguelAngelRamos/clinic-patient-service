// src/common/http/user-service.client.ts
//
// COMUNICACIÓN HTTP REST con user-service
//
// Este cliente implementa la comunicación síncrona entre microservicios.
// Se usa en el caso: patient-service necesita verificar que el userId
// existe y tiene rol 'patient' ANTES de crear el perfil clínico.
//
// Por qué síncrono aquí:
//   La creación del perfil de paciente REQUIERE saber si el usuario
//   existe. Sin esa respuesta, la operación no puede continuar.
//   → HTTP REST es la elección correcta.
//
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpClient, HttpResponse } from "./http-client";

export interface UserExistsResponse {
  exists: boolean;
  role: string | null;
}

@Injectable()
export class UserServiceClient {
  private readonly logger = new Logger(UserServiceClient.name);
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpClient: HttpClient,
  ) {
    // URL del user-service — configurada en app.config.ts
    // En K8s: http://user-service:3002
    // En dev: http://localhost:3002
    this.baseUrl = this.configService.getOrThrow<string>("app.userServiceUrl");
  }

  // verifyUserExists — llama a GET /users/:id/exists del user-service
  // Retorna { exists: boolean, role: string | null }
  // Lanza ServiceUnavailableException si el user-service no responde
  async verifyUserExists(userId: string): Promise<UserExistsResponse> {
    let response: HttpResponse<UserExistsResponse>;
    try {
      response = await this.httpClient.get<UserExistsResponse>(
        `${this.baseUrl}/users/${userId}/exists`,
        { timeoutMs: 5000 },
      );
    } catch (error) {
      this.logger.error(
        `Error al contactar user-service [GET /users/${userId}/exists]: ` +
          `${(error as Error).message}`,
      );
      throw new ServiceUnavailableException(
        "El servicio de usuarios no está disponible. Intenta de nuevo.",
      );
    }
    if (!response.ok) {
      this.logger.error(
        `Error al contactar user-service [GET /users/${userId}/exists]: ` +
          `HTTP ${response.status}`,
      );
      throw new ServiceUnavailableException(
        "El servicio de usuarios no está disponible. Intenta de nuevo.",
      );
    }
    return response.data;
  }
}
