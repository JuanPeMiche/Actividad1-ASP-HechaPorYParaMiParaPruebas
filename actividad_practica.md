# Práctica individual — Gestión de libros y reseñas

**Curso:** Arquitectura de Software en la Práctica · ORT Uruguay  
**Modalidad:** Individual · Simulacro de Actividad 1  
**Duración estimada:** 3–4 horas

---

## Descripción del dominio

Estás desarrollando un MVP para gestionar una biblioteca personal de libros y sus reseñas.

Un **libro** está compuesto por un ISBN (clave), título y autor. Por ejemplo:

- **ISBN:** 978-0-13-468599-1  
- **Título:** Clean Architecture  
- **Autor:** Robert C. Martin

Las **reseñas** se asocian a un libro, el nombre del lector, un puntaje numérico del 1 al 10 y un comentario libre.

---

## Parte 1 — Funcionalidad y persistencia _(1.0 pt)_

### A. Extensión de funcionalidad

Sobre la base de una aplicación en Node.js (o tecnología de tu preferencia), implementá los siguientes endpoints:

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/books` | Alta de un libro |
| `POST` | `/books/:isbn/reviews` | Alta de una reseña asociada a un libro |
| `GET` | `/books/:isbn/reviews` | Listado de reseñas de un libro |

La persistencia debe realizarse en un servicio de AWS. Se recomienda **DynamoDB**, pero podés usar RDS, S3+JSON u otro.

### B. Portabilidad — Docker + Docker Compose

La aplicación debe tener:

- Un `Dockerfile` correcto que construya la imagen de la app.
- Un `docker-compose.yml` que levante el servicio completo con un solo `docker compose up`.
- Las variables de entorno (credenciales AWS, región, nombre de tabla) gestionadas via archivo `.env`, **nunca commiteado al repositorio**.

> **Tip:** Agregá `.env` al `.gitignore` desde el principio.

---

## Parte 2 — Despliegue en AWS _(1.0 pt)_

Desplegá la aplicación en AWS utilizando **ECS** (Fargate o EC2 launch type). El servicio debe ser accesible públicamente via HTTP.

Pasos sugeridos:

1. Publicá la imagen en **ECR** (Elastic Container Registry).
2. Creá un cluster, task definition y service en ECS.
3. Verificá que los tres endpoints funcionen desde **Postman** o `cURL` apuntando a la URL pública del servicio.
4. Guardá capturas de pantalla de todo el proceso en una carpeta `evidencia/` dentro del repositorio.

> **Tip (Learner Lab):** Las credenciales del Learner Lab de AWS Academy expiran cada ~4 horas y requieren `aws_session_token`. Verificá que el CLI esté configurado correctamente con `aws sts get-caller-identity` antes de desplegar.

---

## Parte 3 — Preguntas 12 Factor App _(1.5 pts)_

Respondé las siguientes preguntas en el `README.md` del repositorio.

### a. Dos factores aplicados correctamente

Elegí 2 factores del [manifiesto 12-factor](https://12factor.net/es/) que hayas aplicado en tu desarrollo y explicá concretamente cómo los aplicaste, con ejemplos de tu código o configuración.

### b. Un factor no aplicado

Elegí 1 factor que **no** hayas aplicado. Explicá qué cambios concretos habría que hacer en el código, la infraestructura y el despliegue para cumplirlo.

### c. Factor de concurrencia — envío de notificaciones por mail

Describí cómo diseñarías el sistema para añadir el envío automático de un mail cada vez que se agrega una nueva reseña. Tu respuesta debe incluir:

- Qué componente o proceso adicional añadirías y por qué (ej: worker, queue).
- Qué servicio de AWS usarías para la mensajería (ej: SQS) y cuál para el envío de mails (ej: SES).
- Cómo este diseño respeta el **factor de concurrencia** del manifiesto 12-factor.

---

## Entregable

Un repositorio de GitHub con la siguiente estructura:

```
/
├── src/                   # Código fuente de la aplicación
├── evidencia/             # Capturas de pantalla del despliegue y pruebas
├── Dockerfile
├── docker-compose.yml
├── .env.example           # Ejemplo de variables de entorno (sin valores reales)
├── .gitignore             # Debe incluir .env y credenciales
└── README.md              # Respuestas a las preguntas 12-factor
```

---

## Rúbrica de autoevaluación

| Criterio | Puntaje |
|----------|---------|
| Alta de libro, alta de reseña y listado de reseñas funcionando | 0.5 pts |
| Persistencia en AWS (DynamoDB u otro servicio) | 0.5 pts |
| Docker + Docker Compose correctamente configurados | 1.0 pts |
| Despliegue en ECS accesible públicamente | 1.0 pts |
| Prueba desde Postman o cURL con evidencia (capturas) | 0.5 pts |
| Preguntas 12-factor (2 aplicados + 1 no aplicado + concurrencia) | 1.5 pts |
| **Total** | **5.0 pts** |
