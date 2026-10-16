# Guía de validaciones y conexión entre frontend y backend

Esta guía explica, paso a paso, cómo funciona la reserva de cupo: desde que se
cargan las actividades hasta que el backend valida y guarda una inscripción.
También puede utilizarse como guion para presentar el funcionamiento del
código.

## Recorrido general

```text
Formulario React
    │
    ├── GET /api/actividades ──> Backend Express
    │                             └── Devuelve actividades y cupos disponibles
    │
    └── POST /api/inscripciones -> Backend Express
                                  ├── Valida los datos
                                  ├── Comprueba fecha, duplicados y cupos
                                  └── Guarda la inscripción
```

## 1. Preparar la comunicación entre frontend y backend

### Proxy del frontend

**Archivo:** `frontend/vite.config.js`

Vite reenvía al backend todas las solicitudes cuyo camino comienza con `/api`.
Así, el código React puede usar rutas como `/api/actividades` sin indicar la
dirección completa del servidor.

```js
proxy: {
  '/api': 'http://localhost:3001',
}
```

### Middleware del backend

**Archivo:** `backend/server.js`

Express permite solicitudes desde el frontend y convierte el contenido JSON de
las peticiones en datos que las rutas pueden leer desde `request.body`.

```js
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));
```

En desarrollo, el frontend suele ejecutarse en `http://localhost:5173` y el
backend en `http://localhost:3001`.

## 2. Cargar las actividades disponibles

**Frontend:** `frontend/src/pages/EnrollmentPage.jsx`, función
`fetchActivities`.

**Backend:** `backend/server.js`, ruta `GET /api/actividades`.

Al abrir el formulario, el frontend consulta al backend. La respuesta contiene
las actividades junto con los cupos restantes. El formulario utiliza esa
información para mostrar las opciones disponibles.

```js
const response = await fetch('/api/actividades');
const result = await response.json();
```

El backend calcula los cupos disponibles a partir del límite de cada actividad
y de las inscripciones guardadas. Si la solicitud falla, el frontend muestra
un mensaje de error en lugar de dar por exitosa la carga.

## 3. Validar los datos en el formulario

**Archivo:** `frontend/src/pages/EnrollmentPage.jsx`, función
`handleSubmit`.

Cuando la persona confirma la reserva, `handleSubmit` detiene el envío
automático del navegador, normaliza los valores y los valida antes de llamar a
la API. `trim()` quita espacios al inicio y al final.

```js
const normalizedName = nombre.trim();
const normalizedEmail = email.trim();
const normalizedDescription = descripcion.trim();
```

Las validaciones del formulario comprueban:

| Dato | Validación |
| --- | --- |
| Nombre | Entre 2 y 80 caracteres después de quitar espacios externos. |
| Correo | Formato básico válido y máximo de 254 caracteres. |
| Motivación | Entre 20 y 300 caracteres después de quitar espacios externos. |
| Actividad | Debe seleccionarse una actividad existente en la lista cargada. |
| Cupo | La actividad seleccionada debe mostrar al menos un cupo disponible. |

La función `isValidEmail` realiza la comprobación básica del correo. Los
atributos HTML de los campos (`required`, `minLength` y `maxLength`) también
ayudan a limitar lo que se escribe. El formulario usa `noValidate` para que
`handleSubmit` controle los mensajes de validación y pueda mostrar mensajes
propios.

Si una actividad aparece sin cupos, el formulario avisa y vuelve a consultar
las actividades para actualizar la información.

## 4. Enviar la inscripción desde el frontend

**Archivo:** `frontend/src/pages/EnrollmentPage.jsx`, dentro de
`handleSubmit`.

Cuando pasan las validaciones del formulario, se activa el estado de envío y
se hace una petición `POST` a `/api/inscripciones`. El cuerpo se envía en JSON
con los datos de la persona, la actividad seleccionada y el identificador
anónimo del navegador.

```js
const response = await fetch('/api/inscripciones', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    actividadId,
    nombre: normalizedName,
    email: normalizedEmail,
    descripcion: normalizedDescription,
    visitorId: getVisitorId(),
  }),
});
```

Mientras espera la respuesta, el botón y el formulario muestran que los datos
se están enviando. Cuando llega la respuesta, el frontend muestra una
confirmación o el mensaje de error correspondiente.

### Identificador del navegador

**Archivo:** `frontend/src/utils/visitor.js`, función `getVisitorId`.

Esta función recupera de `localStorage` un identificador anónimo existente o
crea uno nuevo. El backend lo utiliza para asociar las inscripciones con el
navegador y detectar reservas duplicadas. No sustituye una cuenta de usuario.

## 5. Validar de nuevo en el backend

**Archivo:** `backend/server.js`, ruta `POST /api/inscripciones`.

La validación del frontend mejora la experiencia, pero no es suficiente para
proteger los datos: una petición puede enviarse directamente al servidor. Por
eso, el backend vuelve a verificar la información recibida antes de guardarla.

El servidor comprueba:

1. Que la actividad exista.
2. Que el nombre tenga entre 2 y 80 caracteres después de quitar espacios
   externos.
3. Que el correo tenga formato válido y no exceda 254 caracteres.
4. Que la motivación tenga entre 20 y 300 caracteres después de quitar
   espacios externos.
5. Que el identificador anónimo tenga el formato esperado.
6. Que la persona no tenga ya una inscripción para esa actividad, según su
   identificador o su correo.
7. Que la actividad todavía no se haya realizado.
8. Que aún queden cupos disponibles.

Las comprobaciones de duplicados, fecha y cupo se hacen dentro de la
actualización de las inscripciones. La disponibilidad se comprueba de nuevo en
el servidor justo antes de guardar, porque otra persona podría reservar el
último cupo después de que se cargó el formulario.

Si los datos pasan todas las validaciones, el backend crea la inscripción y
responde con estado HTTP `201`.

## 6. Guardar los datos y responder

**Archivo:** `backend/server.js`, funciones `updateJsonFile` y
`writeJsonFile`.

Las inscripciones se guardan en `backend/data/inscripciones.json`. La
actualización se serializa para evitar que dos escrituras simultáneas se
pisen. El backend devuelve una respuesta JSON con un mensaje de éxito o con
el error que corresponda.

Algunos estados HTTP que puede recibir el frontend:

| Estado | Significado en esta operación |
| --- | --- |
| `201` | Inscripción creada correctamente. |
| `400` | Algún dato enviado no cumple las validaciones. |
| `404` | La actividad seleccionada no existe. |
| `409` | Ya hay una inscripción duplicada o no quedan cupos. |
| `410` | La actividad ya se realizó o ya no acepta reservas. |
| `500` | Ocurrió un error inesperado al procesar o guardar los datos. |

Si el servidor responde `409` o `410`, el frontend intenta actualizar la lista
de actividades. Esto permite reflejar cambios de disponibilidad en el
formulario.

## Guion breve para explicar el flujo

> “Primero, el formulario solicita las actividades disponibles mediante
> `GET /api/actividades`. Cuando la persona completa sus datos, el frontend
> recorta los espacios y valida nombre, correo, motivación, actividad y cupo.
> Si los datos pasan esas comprobaciones, envía una petición `POST` con JSON.
> El backend vuelve a validar todo, incluyendo duplicados, fecha y cupos
> actuales, porque no se debe confiar solamente en la validación del navegador.
> Si hay un cupo disponible, guarda la inscripción en un archivo JSON y
> responde con éxito; de lo contrario, devuelve un mensaje que el formulario
> presenta a la persona.”

## Cómo ejecutar y probar

Inicia el backend desde una terminal:

```powershell
cd backend
npm run dev
```

Inicia el frontend desde otra terminal:

```powershell
cd frontend
npm run dev
```

Para ejecutar las pruebas del backend desde la raíz del proyecto:

```powershell
npm.cmd --prefix backend test
```

Las pruebas de validaciones y disponibilidad están en
`backend/test/enrollments.test.js`. Incluyen límites de caracteres, entradas
con espacios, correo inválido, actividad inexistente, duplicados y cupos
agotados.

## Archivos principales

| Archivo | Responsabilidad |
| --- | --- |
| `frontend/src/pages/EnrollmentPage.jsx` | Formulario, validación del lado del cliente y peticiones HTTP. |
| `frontend/src/utils/visitor.js` | Obtención del identificador anónimo del navegador. |
| `frontend/vite.config.js` | Proxy de las rutas `/api` al backend. |
| `backend/server.js` | Rutas API, validación del servidor y persistencia de inscripciones. |
| `backend/test/enrollments.test.js` | Pruebas de validación y reserva de cupos. |
