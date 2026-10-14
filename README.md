# Inscripción a actividades

Módulo autónomo para explorar actividades de voluntariado e inscribirse. Incluye
su propio frontend React/Vite, API Express y pruebas; no depende del starter ni
de las demás partes del sistema.

## Requisitos

- Node.js 22 o superior.
- npm.

## Iniciar el backend

En una terminal:

```powershell
cd backend
npm install
npm test
npm start
```

La API queda en `http://localhost:3000`. Las inscripciones se guardan en
`backend/data/inscripciones.json`.

## Iniciar el frontend

En otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

Abre la URL que muestre Vite, normalmente `http://localhost:5173`. El proxy de
Vite envía `/api` al backend en el puerto 3000.

## Funcionalidad

- Catálogo de actividades con categoría, fecha, lugar y cupos informativos.
- Formulario de inscripción con nombre, correo y motivación.
- Validación en el frontend y en la API.
- Confirmación de inscripción y mensajes visibles si ocurre un error.
- Persistencia de inscripciones en un archivo JSON.

Las actividades disponibles se configuran en `frontend/src/activities.js` y
`backend/src/activities.js`. Si se cambia el catálogo, actualiza ambos archivos.

## API

`POST /api/inscripciones` recibe:

```json
{
  "nombre": "Ana Martínez",
  "email": "ana@example.com",
  "actividadId": "ACT-001",
  "motivacion": "Quiero colaborar con el cuidado de las áreas verdes."
}
```

Responde `201 Created` al guardar, `400 Bad Request` si los datos no son
válidos y `500 Internal Server Error` si falla el almacenamiento.
