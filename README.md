# Sistema de Voluntariado

Aplicación web compuesta por un frontend desarrollado con React y Vite, y un
backend desarrollado con Node.js y Express.

## Requisitos

Antes de ejecutar el proyecto, instala:

- [Node.js](https://nodejs.org/) (se recomienda la versión LTS).
- npm, incluido con Node.js.
- Git, únicamente si vas a clonar el repositorio.

Comprueba que Node.js y npm estén disponibles:

```powershell
node --version
npm --version
```

## Descargar el proyecto

Si todavía no tienes el proyecto en tu equipo, clónalo y entra en su carpeta:

```powershell
git clone <URL_DEL_REPOSITORIO>
cd "Sistema Voluntariado"
```

Si ya tienes el proyecto descargado, abre una terminal en la carpeta raíz del
proyecto:

```text
Sistema Voluntariado/
├── backend/
├── frontend/
└── README.md
```

## Instalar dependencias

Las dependencias del backend y del frontend se instalan por separado. Ejecuta
los siguientes comandos desde la carpeta raíz:

```powershell
cd backend
npm install

cd ..\frontend
npm install

cd ..
```

No es necesario crear archivos `.env` para la configuración actual.

## Ejecutar el proyecto en desarrollo

El frontend y el backend deben ejecutarse al mismo tiempo. Abre dos terminales
ubicadas en la carpeta raíz del proyecto.

### Terminal 1: backend

```powershell
cd backend
npm run dev
```

El backend quedará disponible en:

```text
http://localhost:3001
```

Para usar otro puerto, define la variable de entorno `PORT` antes de iniciar
el servidor y actualiza el proxy de `frontend/vite.config.js` para que apunte
al mismo puerto.

El comando `npm run dev` usa Nodemon y reinicia el servidor automáticamente
cuando detecta cambios en los archivos.

También puedes iniciar el backend sin Nodemon:

```powershell
cd backend
npm start
```

### Terminal 2: frontend

```powershell
cd frontend
npm run dev
```

Vite mostrará en la terminal la URL del frontend, normalmente:

```text
http://localhost:5173
```

Abre esa dirección en el navegador.

## Comprobar que el backend funciona

Con el backend iniciado, visita
[http://localhost:3001](http://localhost:3001) o ejecuta:

```powershell
Invoke-WebRequest http://localhost:3001
```

La respuesta esperada es:

```text
API de Voluntariado
```

## Configuración de comunicación frontend-backend

El frontend de Vite tiene configurado un proxy para las rutas que comienzan
con `/api`:

```text
/api -> http://localhost:3001
```

El backend acepta solicitudes CORS provenientes de
`http://localhost:5173`. Si cambias el puerto del frontend, actualiza también
el origen permitido en `backend/server.js`.

El backend incluye las rutas de autenticación siguientes:

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/api/auth/registro` | Crea una cuenta con nombre, correo y contraseña. |
| `POST` | `/api/auth/login` | Valida las credenciales y devuelve los datos públicos del usuario. |

El frontend presenta las pantallas `/login` y `/registro`; Vite reenvía las
peticiones `/api` a `http://localhost:3001`. Las cuentas se guardan en
`backend/data/usuarios.json` y las contraseñas se almacenan como hashes, nunca
en texto plano. Al iniciar sesión, la API entrega un token temporal que permite
gestionar las inscripciones del usuario.

## Actividades e inscripciones

En `/actividades` se muestran las actividades disponibles, sus fechas, lugares
y cupos. Para reservar un cupo, el voluntario debe iniciar sesión. En
`/inscripciones` puede consultar sus reservas y cancelar cualquiera de ellas.
El backend guarda las inscripciones en `backend/data/inscripciones.json`;
ambos archivos de datos se crean automáticamente al iniciar el servidor.

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/actividades` | Lista actividades con cupos disponibles. |
| `POST` | `/api/inscripciones` | Inscribe al usuario autenticado en una actividad. |
| `GET` | `/api/inscripciones` | Consulta las inscripciones del usuario autenticado. |
| `DELETE` | `/api/inscripciones/:id` | Cancela una inscripción propia. |

Las actividades de ejemplo están definidas en `backend/server.js`. Los cupos
se validan en el servidor para evitar sobreinscripciones y registros
duplicados.

## Comandos disponibles

### Backend

Ejecutar desde `backend`:

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia Express con Nodemon para desarrollo. |
| `npm start` | Inicia Express directamente con Node.js. |
| `npm test` | No hay pruebas configuradas actualmente. |

### Frontend

Ejecutar desde `frontend`:

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia Vite en modo desarrollo con recarga automática. |
| `npm run build` | Genera la versión optimizada de producción en `dist`. |
| `npm run preview` | Sirve localmente la compilación generada. |
| `npm run lint` | Ejecuta ESLint sobre el frontend. |

## Crear y revisar la compilación de producción

Desde la carpeta raíz:

```powershell
cd frontend
npm run lint
npm run build
npm run preview
```

Después de ejecutar `npm run preview`, abre la URL que indique Vite,
normalmente `http://localhost:4173`.

La compilación de producción del frontend se guarda en `frontend/dist`.

## Solución de problemas comunes

### `npm` o `node` no se reconoce

Instala Node.js desde su sitio oficial y reinicia la terminal o VS Code.
Después verifica de nuevo:

```powershell
node --version
npm --version
```

### El puerto 3000 ya está ocupado

Detén el proceso que utiliza el puerto o cambia la constante `Port` en
`backend/server.js`. Si cambias el puerto del backend, actualiza también el
proxy de `frontend/vite.config.js`.

### El puerto 5173 ya está ocupado

Vite puede seleccionar otro puerto y mostrarlo en la terminal. Si esto ocurre,
actualiza el origen permitido en `backend/server.js` para que coincida con la
nueva URL del frontend.

### Error de dependencias

Desde la carpeta correspondiente, elimina únicamente la carpeta
`node_modules` y el archivo `package-lock.json`, y vuelve a instalar:

```powershell
cd backend
npm install

cd ..\frontend
npm install
```

Haz esto solo si `npm install` falla por una instalación dañada o
inconsistente.

## Estructura principal

```text
.
├── backend/
│   ├── data/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Detener la aplicación

En cada terminal donde esté ejecutándose un servicio, presiona:

```text
Ctrl + C
```