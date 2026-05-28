# clinic-patient-service

Microservicio de pacientes de la **Clinic App**.

Responsabilidad única: gestionar el perfil clínico del paciente.

## La pieza nueva: comunicación HTTP REST con user-service

Cuando se crea un perfil de paciente, este servicio llama a `GET /users/:id/exists`
del `user-service` para verificar que el usuario existe y está activo.

```
POST /patients
       │
       ├── 1. GET http://user-service:3002/users/{userId}/exists
       │         ↓
       │   { exists: true, role: 'patient' }
       │
       └── 2. Crear el perfil en patient_db
```

Por qué HTTP REST y no mensajería: la creación del perfil **necesita la respuesta**
para continuar. Si el usuario no existe, la operación debe fallar de inmediato.

## Endpoints

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| `GET` | `/patients/health` | Público | Health check K8s |
| `GET` | `/patients` | ADMIN | Listar todos |
| `GET` | `/patients/me` | Propio | Mi perfil clínico |
| `GET` | `/patients/user/:userId` | Ownership | Por userId |
| `GET` | `/patients/:id` | Ownership | Por ID interno |
| `POST` | `/patients` | Autenticado | Crear perfil |
| `PATCH` | `/patients/:id` | Ownership | Actualizar |
| `DELETE` | `/patients/:id` | ADMIN | Soft delete |

## Kubernetes

```bash
kubectl create secret generic patient-postgres-secret \
  --namespace clinic \
  --from-literal=POSTGRES_USER=patient_svc_user \
  --from-literal=POSTGRES_PASSWORD=<PASSWORD> \
  --from-literal=POSTGRES_DB=patient_db

kubectl apply -f k8s/patient-service.yaml
kubectl get pods -n clinic -l app=patient-service
```
