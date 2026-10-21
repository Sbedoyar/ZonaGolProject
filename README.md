# ZonaGol

ZonaGol es una plataforma web orientada a la gestión de apuestas deportivas. El proyecto integra autenticación de usuarios, gestión de apuestas, información deportiva, pagos, historial de actividad y servicios externos.

El sistema utiliza una arquitectura con múltiples motores de bases de datos y servicios externos, coordinados mediante un backend en Node.js y una interfaz desarrollada con React.

---

## Tecnologías principales

### Frontend

- React
- Vite

### Backend

- Node.js
- Express

### Bases de datos

ZonaGol utiliza cuatro motores de bases de datos:

- **SQL Server**: autenticación, usuarios, roles e identidades externas.
- **MySQL**: información de negocio, clientes, apuestas, pagos y saldos.
- **PostgreSQL**: información deportiva, equipos, partidos, reglas, temporadas y estadísticas.
- **MongoDB**: historial de acceso y actividad.

También se utiliza **Firebase/Firestore** para el registro de eventos relacionados con pagos.

### Servicios externos

El proyecto integra:

- Google Sign-In
- Google Drive
- Firebase
- API-Football
- Wompi

---

# Arquitectura con Docker

El proyecto incluye un archivo `compose.yaml` que permite ejecutar los principales componentes mediante Docker Compose.

Los servicios definidos son:

| Servicio | Descripción | Puerto host |
|---|---|---:|
| `frontend` | Aplicación React/Vite | `5173` |
| `backend` | API Node.js/Express | `5000` |
| `sqlserver` | SQL Server 2025 Express | `1434` |
| `postgres` | PostgreSQL 18 | `5433` |
| `mysql` | MySQL 8 | `3307` |
| `mongodb` | MongoDB | `27018` |
| `sqlserver-init` | Inicialización de ZonaGolAuth | No publica puerto |

Dentro de la red de Docker los servicios utilizan los puertos estándar de cada motor.

---

# Requisitos

Para ejecutar el proyecto con Docker se necesita:

- Git
- Docker Desktop
- Docker Compose

Docker Desktop debe estar iniciado antes de ejecutar el proyecto.

Para comprobar la instalación:

```bash
docker --version
docker compose version
```

---

# Clonar el proyecto

```bash
git clone <URL_DEL_REPOSITORIO>
cd usermanager
```

---

# Configuración de variables de entorno

Por seguridad, las credenciales reales no se almacenan en el repositorio.

El proyecto proporciona archivos `.env.example` que indican las variables necesarias.

Se deben crear tres archivos locales:

```text
.env.docker
backend/.env
frontend/.env
```

Estos archivos están excluidos de Git.

---

## 1. Variables de Docker

Copiar:

```text
.env.docker.example
```

como:

```text
.env.docker
```

En PowerShell:

```powershell
Copy-Item .env.docker.example .env.docker
```

Después se deben reemplazar los valores de ejemplo por credenciales locales válidas.

Este archivo contiene la configuración utilizada por Docker para:

- SQL Server
- PostgreSQL
- MySQL

---

## 2. Variables del backend

Copiar:

```text
backend/.env.example
```

como:

```text
backend/.env
```

En PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

El archivo contiene la configuración necesaria para:

- SQL Server
- MySQL
- MongoDB
- PostgreSQL
- Firebase
- correo electrónico
- JWT
- Google Sign-In
- API-Football
- Wompi
- Google Drive

Los valores marcados como valores de ejemplo deben reemplazarse por las credenciales correspondientes.

> Las claves privadas, contraseñas, tokens y secretos nunca deben subirse al repositorio.

---

## 3. Variables del frontend

Copiar:

```text
frontend/.env.example
```

como:

```text
frontend/.env
```

En PowerShell:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

Actualmente el frontend requiere la configuración correspondiente a Google Sign-In.

---

# Inicialización de las bases de datos

ZonaGol incluye scripts que permiten preparar las estructuras necesarias cuando las bases de datos de Docker se crean por primera vez.

Los scripts se encuentran en:

```text
docker/
├── mongodb/
│   └── init/
├── mysql/
│   └── init/
├── postgres/
│   └── init/
└── sqlserver/
    └── init/
```

---

## SQL Server

SQL Server utiliza la base:

```text
ZonaGolAuth
```

El script:

```text
docker/sqlserver/init/01-zonagol-auth.sql
```

crea la estructura de autenticación necesaria.

Incluye las tablas:

- `Rol`
- `Usuario`
- `Login`
- `RecuperacionClave`
- `IdentidadExterna`

También crea el catálogo inicial de roles:

- ADMINISTRADOR
- OPERADOR
- CLIENTE

El servicio:

```text
sqlserver-init
```

espera a que SQL Server esté saludable, ejecuta el script de inicialización y finaliza.

Por esta razón es normal que posteriormente aparezca como:

```text
Exited (0)
```

Esto indica que la inicialización terminó correctamente.

---

## PostgreSQL

PostgreSQL contiene el dominio deportivo de ZonaGol.

El script de inicialización se encuentra en:

```text
docker/postgres/init/01-zonagol-postgres.sql
```

La estructura incluye información relacionada con:

- deportes
- ligas
- temporadas
- equipos
- estadios
- partidos
- reglas
- calendarios
- eventos
- estadísticas
- identificadores externos

El script incluye la información deportiva y de configuración necesaria para el entorno preparado del proyecto.

---

## MySQL

MySQL contiene el dominio de negocio y apuestas.

El script se encuentra en:

```text
docker/mysql/init/01-zonagol-negocio.sql
```

Incluye la estructura de las tablas y catálogos básicos necesarios.

Por seguridad, el script distribuido no contiene información personal, historial de apuestas ni transacciones privadas.

Los datos operativos deben generarse mediante la aplicación.

---

## MongoDB

MongoDB almacena información histórica de la aplicación.

El script:

```text
docker/mongodb/init/01-zonagol-mongodb.js
```

prepara las colecciones:

```text
historial_acceso
historial_actividad
```

Los historiales reales de usuarios no se incluyen en el repositorio.

---

# Levantar ZonaGol con Docker

Después de configurar los archivos de entorno, ejecutar desde la raíz:

```bash
docker compose --env-file .env.docker up -d --build
```

Docker realizará el proceso de construcción e inicio de los servicios.

El backend espera a que las bases de datos necesarias estén disponibles antes de iniciar.

---

# Comprobar el estado

Ejecutar:

```bash
docker compose --env-file .env.docker ps
```

Los servicios de bases de datos deberían aparecer como:

```text
healthy
```

El servicio `sqlserver-init` es un proceso de inicialización de una sola ejecución, por lo que puede comprobarse con:

```bash
docker compose --env-file .env.docker ps -a
```

y aparecer como:

```text
Exited (0)
```

Esto es normal.

---

# Acceso a la aplicación

Una vez iniciados los servicios:

### Frontend

```text
http://localhost:5173
```

### Backend

```text
http://localhost:5000
```

---

# Detener los contenedores

Para detener y eliminar los contenedores conservando los datos:

```bash
docker compose --env-file .env.docker down
```

Los volúmenes permanecen almacenados y las bases de datos conservan su información.

---

# Reiniciar el proyecto

Para volver a iniciar los servicios:

```bash
docker compose --env-file .env.docker up -d
```

Si se modificó código del frontend o backend y es necesario reconstruir las imágenes:

```bash
docker compose --env-file .env.docker up -d --build
```

---

# Reinicialización completa de las bases de datos

> **ADVERTENCIA:** el siguiente procedimiento elimina los volúmenes Docker y todos los datos almacenados dentro de las bases de datos Docker.

Solo debe utilizarse cuando se desea crear un entorno completamente nuevo.

```bash
docker compose --env-file .env.docker down -v
docker compose --env-file .env.docker up -d --build
```

Después de eliminar los volúmenes, los scripts de inicialización prepararán nuevamente las bases de datos.

Este procedimiento no debe utilizarse si existen datos Docker que se desean conservar.

---

# Persistencia

Docker utiliza volúmenes para conservar los datos:

```text
zonagol_sqlserver_data
zonagol_mongodb_data
zonagol_postgres_data
zonagol_mysql_data
```

Por esta razón, detener o recrear un contenedor no implica necesariamente perder la información de las bases de datos.

---

# Seguridad

El repositorio no debe contener:

- contraseñas reales;
- secretos JWT;
- claves privadas;
- tokens OAuth;
- refresh tokens;
- credenciales de Firebase;
- credenciales privadas de Wompi;
- claves privadas de Google;
- dumps que contengan información personal;
- historiales reales de acceso;
- información privada de pagos.

Los archivos sensibles están excluidos mediante `.gitignore`.

Los archivos `.env.example` únicamente documentan las variables que deben configurarse.

---

# Servicios externos

Algunas funcionalidades requieren credenciales externas válidas.

## Google Sign-In

Utilizado para autenticación mediante Google.

## Google Drive

Utilizado para almacenar imágenes de perfil y logos de equipos.

## API-Football

Utilizado para sincronizar información deportiva.

La sincronización automática está configurada para ejecutarse periódicamente mediante el scheduler del backend.

## Wompi

Utilizado para el flujo de pagos de la aplicación.

## Firebase / Firestore

Utilizado para registrar eventos relacionados con pagos.

Estas credenciales deben configurarse localmente y no forman parte del repositorio.

---

# Desarrollo local

Docker no impide continuar trabajando con el proyecto de manera local.

El código fuente del frontend y backend continúa siendo la fuente principal del proyecto.

Después de realizar modificaciones en el código, las imágenes pueden reconstruirse mediante:

```bash
docker compose --env-file .env.docker up -d --build
```

Los datos de las bases de datos Docker permanecen almacenados en sus respectivos volúmenes mientras estos no sean eliminados.

---

# Proyecto académico

ZonaGol fue desarrollado como proyecto académico para aplicar conceptos relacionados con:

- desarrollo web;
- APIs REST;
- autenticación;
- bases de datos relacionales y NoSQL;
- integración de servicios externos;
- pagos;
- contenedores;
- Docker Compose;
- persistencia de datos;
- arquitectura de software.