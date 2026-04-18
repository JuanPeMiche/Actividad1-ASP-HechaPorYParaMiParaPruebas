# Plan: Actividad Práctica — Gestión de Libros y Reseñas

## Context
El repositorio está completamente vacío (solo tiene el README placeholder y el enunciado). Se necesita construir todo desde cero: aplicación Node.js/Express, persistencia en DynamoDB, Docker, despliegue en AWS ECS, y respuestas 12-factor en el README.

---

## PASO 1 — Configuración inicial del proyecto

### 1.1 Crear `.gitignore`
```
.env
node_modules/
```

### 1.2 Crear `src/` con la app Node.js + Express + DynamoDB SDK

**Dependencias:**
- `express` — servidor HTTP
- `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb` (AWS SDK v3) — cliente DynamoDB
- `dotenv` — carga de variables de entorno
- `uuid` — generación de IDs para reseñas

**`package.json`** con `"type": "module"` o CommonJS según preferencia. Usar CommonJS para simplicidad.

### 1.3 Estructura de archivos a crear

```
/
├── src/
│   ├── app.js          # Express app, rutas
│   ├── db.js           # Cliente DynamoDB y funciones de acceso a datos
│   └── server.js       # Punto de entrada (escucha en puerto)
├── .env.example        # Variables requeridas sin valores reales
├── .gitignore
├── Dockerfile
├── docker-compose.yml
└── README.md           # Respuestas 12-factor (reemplaza el actual)
```

---

## PASO 2 — Código de la aplicación

### 2.1 `src/db.js` — Cliente DynamoDB

```js
// Crea el DocumentClient de DynamoDB apuntando a la región y tabla
// configuradas por variables de entorno
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE = process.env.DYNAMODB_TABLE;
```

**Modelo DynamoDB (tabla única):**
- `PK` = `BOOK#<isbn>` (partition key)
- `SK` = `METADATA` para el libro, `REVIEW#<uuid>` para reseñas
- Permite almacenar libros y reseñas en la misma tabla con single-table design

### 2.2 `src/app.js` — Rutas Express

| Método | Ruta | Lógica |
|--------|------|--------|
| `POST /books` | Body: `{ isbn, title, author }` | Inserta ítem con PK=`BOOK#isbn`, SK=`METADATA` |
| `POST /books/:isbn/reviews` | Body: `{ reader, score, comment }` | Inserta ítem con PK=`BOOK#isbn`, SK=`REVIEW#uuid`, valida score 1-10 |
| `GET /books/:isbn/reviews` | — | Query por PK=`BOOK#isbn` y SK begins_with `REVIEW#` |

### 2.3 Variables de entorno requeridas (`.env.example`)

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=
DYNAMODB_TABLE=books-reviews
PORT=3000
```

---

## PASO 3 — Docker

### 3.1 `Dockerfile`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 3000
CMD ["node", "src/server.js"]
```

### 3.2 `docker-compose.yml`

```yaml
version: "3.9"
services:
  api:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
```

> Las credenciales AWS se inyectan desde `.env` (nunca commiteado).

### 3.3 Verificación local
```bash
# Crear .env con credenciales reales del Learner Lab
docker compose up --build
curl -X POST http://localhost:3000/books -H "Content-Type: application/json" \
  -d '{"isbn":"978-0-13-468599-1","title":"Clean Architecture","author":"Robert C. Martin"}'
```

---

## PASO 4 — Crear tabla DynamoDB en AWS

```bash
aws dynamodb create-table \
  --table-name books-reviews \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

---

## PASO 5 — Despliegue en AWS ECS

### 5.1 Publicar imagen en ECR

```bash
# 1. Crear repositorio ECR
aws ecr create-repository --repository-name books-reviews-api --region us-east-1

# 2. Autenticar Docker con ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# 3. Build + tag + push
docker build -t books-reviews-api .
docker tag books-reviews-api:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/books-reviews-api:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/books-reviews-api:latest
```

### 5.2 Crear Task Definition ECS (Fargate)

- **Family:** `books-reviews-task`
- **CPU:** 256, **Memory:** 512
- **Container:** imagen ECR, puerto 3000
- **Environment variables:** AWS_REGION, DYNAMODB_TABLE, (credenciales via IAM Task Role — ver nota)

> **Nota importante (Learner Lab):** Las credenciales del Learner Lab expiran cada ~4h. Usar variables de entorno en la task definition para `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` y `AWS_SESSION_TOKEN`. En producción real se usaría IAM Task Role sin credenciales hardcodeadas.

### 5.3 Crear Cluster + Service + IP pública

```bash
# Cluster
aws ecs create-cluster --cluster-name books-reviews-cluster --region us-east-1

# Service con IP pública (obtener subnet y security group de la VPC default)
aws ecs create-service \
  --cluster books-reviews-cluster \
  --service-name books-reviews-service \
  --task-definition books-reviews-task:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_ID>],securityGroups=[<SG_ID>],assignPublicIp=ENABLED}"
```

### 5.4 Security Group — abrir puerto 3000

```bash
aws ec2 authorize-security-group-ingress \
  --group-id <SG_ID> \
  --protocol tcp --port 3000 --cidr 0.0.0.0/0
```

### 5.5 Verificación pública

```bash
# Obtener IP pública de la task
aws ecs describe-tasks --cluster books-reviews-cluster --tasks <TASK_ARN>

# Probar endpoints
curl http://<PUBLIC_IP>:3000/books -X POST ...
```

---

## PASO 6 — Evidencia

Crear carpeta `evidencia/` con capturas de:
1. Tabla DynamoDB creada en consola AWS
2. Imagen publicada en ECR
3. Task corriendo en ECS (status RUNNING)
4. Pruebas con cURL o Postman mostrando los 3 endpoints funcionando desde la IP pública

---
## Archivos críticos a crear

| Archivo | Estado |
|---------|--------|
| `.gitignore` | Crear |
| `package.json` | Crear |
| `src/server.js` | Crear |
| `src/app.js` | Crear |
| `src/db.js` | Crear |
| `.env.example` | Crear |
| `Dockerfile` | Crear |
| `docker-compose.yml` | Crear |
| `README.md` | Reemplazar |

---

## Verificación end-to-end

1. `docker compose up --build` — app levanta sin errores
2. `POST /books` — 201 Created, libro aparece en DynamoDB
3. `POST /books/:isbn/reviews` — 201 Created, reseña aparece en DynamoDB
4. `GET /books/:isbn/reviews` — 200 con array de reseñas
5. Mismas pruebas apuntando a la IP pública del ECS task
6. Capturas guardadas en `evidencia/`
