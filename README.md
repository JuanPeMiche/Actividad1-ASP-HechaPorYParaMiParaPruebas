# Actividad1-ASP-HechaPorYParaMiParaPruebas
Actividad 1 particular para mi

## PASO 7 — README.md con respuestas 12-factor

Reemplazar el README.md actual con las respuestas a las 3 preguntas:

### a. Dos factores aplicados

**Factor III — Configuración:** Las credenciales AWS, la región y el nombre de la tabla se inyectan como variables de entorno (`.env` / `env_file` en Docker Compose), nunca hardcodeadas en el código. Ejemplo: `process.env.AWS_REGION`, `process.env.DYNAMODB_TABLE`.

**Factor II — Dependencias:** Todas las dependencias se declaran explícitamente en `package.json` e instalan con `npm ci`. El `Dockerfile` usa `npm ci --only=production` garantizando reproducibilidad total sin dependencias del sistema host.

### b. Factor no aplicado

**Factor XI — Logs:** La aplicación actualmente hace `console.log` directamente. Para cumplirlo correctamente, debería usar un logger estructurado (Winston/Pino) que emita a stdout sin gestión de archivos de log, y en ECS configurar CloudWatch Logs como destino. Cambios: añadir `awslogs` log driver en la task definition, agregar librería de logging estructurado.

### c. Factor de concurrencia — notificaciones por mail

Al agregar una reseña (`POST /books/:isbn/reviews`):
1. La API publica un mensaje en una cola **SQS** con los datos de la reseña (ISBN, lector, puntaje).
2. Un **Worker independiente** (segunda task ECS o Lambda) consume la cola SQS y llama a **Amazon SES** para enviar el mail.
3. Respeto al factor de concurrencia: la API y el worker son **procesos separados y sin estado**, escalables independientemente. Si hay muchas reseñas simultáneas, se escalan más workers sin afectar la API.

---