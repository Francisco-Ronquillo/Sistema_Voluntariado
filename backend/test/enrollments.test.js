const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { after, before, beforeEach, test } = require('node:test');

let app;
let baseUrl;
let enrollmentsFile;
let server;
let temporaryDirectory;

before(async () => {
  temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'volunteer-enrollments-'));
  enrollmentsFile = path.join(temporaryDirectory, 'inscripciones.json');
  process.env.ENROLLMENTS_FILE = enrollmentsFile;
  ({ app } = require('../server'));
  await fs.writeFile(enrollmentsFile, '[]', 'utf8');
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(async () => {
  await fs.writeFile(enrollmentsFile, '[]', 'utf8');
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  if (temporaryDirectory) {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
  delete process.env.ENROLLMENTS_FILE;
});

function validEnrollment(overrides = {}) {
  return {
    actividadId: 'ACT-001',
    nombre: 'Ana',
    email: 'ana@example.com',
    descripcion: 'Quiero colaborar con mi comunidad.',
    visitorId: '00000000-0000-4000-8000-000000000001',
    ...overrides,
  };
}

async function postEnrollment(data) {
  const response = await fetch(`${baseUrl}/api/inscripciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return { response, body: await response.json() };
}

test('acepta los límites mínimos y máximos tras quitar espacios externos', async () => {
  const minimum = await postEnrollment(validEnrollment({
    nombre: ' Ab ',
    email: ' ANA@Example.COM ',
    descripcion: ' 12345678901234567890 ',
  }));
  assert.equal(minimum.response.status, 201);

  const maximum = await postEnrollment(validEnrollment({
    nombre: 'N'.repeat(80),
    email: 'maximo@example.com',
    descripcion: 'M'.repeat(300),
    visitorId: '00000000-0000-4000-8000-000000000002',
  }));
  assert.equal(maximum.response.status, 201);

  const stored = JSON.parse(await fs.readFile(enrollmentsFile, 'utf8'));
  assert.equal(stored[0].nombre, 'Ab');
  assert.equal(stored[0].email, 'ana@example.com');
  assert.equal(stored[0].descripcion, '12345678901234567890');
  assert.equal(stored[1].nombre.length, 80);
  assert.equal(stored[1].descripcion.length, 300);
});

test('rechaza datos vacíos después de normalizarlos y muestra el campo que falla', async () => {
  const whitespaceName = await postEnrollment(validEnrollment({ nombre: '   ' }));
  assert.equal(whitespaceName.response.status, 400);
  assert.match(whitespaceName.body.message, /nombre/i);

  const shortMotivation = await postEnrollment(validEnrollment({
    descripcion: ' '.repeat(20),
  }));
  assert.equal(shortMotivation.response.status, 400);
  assert.match(shortMotivation.body.message, /motivación/i);

  const longName = await postEnrollment(validEnrollment({ nombre: 'N'.repeat(81) }));
  assert.equal(longName.response.status, 400);
  assert.match(longName.body.message, /nombre/i);

  const longMotivation = await postEnrollment(validEnrollment({
    descripcion: 'M'.repeat(301),
  }));
  assert.equal(longMotivation.response.status, 400);
  assert.match(longMotivation.body.message, /motivación/i);

  const invalidEmail = await postEnrollment(validEnrollment({ email: 'no-es-correo' }));
  assert.equal(invalidEmail.response.status, 400);
  assert.match(invalidEmail.body.message, /correo/i);
});

test('rechaza actividad inexistente y evita una inscripción duplicada', async () => {
  const missingActivity = await postEnrollment(validEnrollment({ actividadId: 'no-existe' }));
  assert.equal(missingActivity.response.status, 404);
  assert.match(missingActivity.body.message, /actividad/i);

  const first = await postEnrollment(validEnrollment());
  assert.equal(first.response.status, 201);

  const duplicate = await postEnrollment(validEnrollment());
  assert.equal(duplicate.response.status, 409);
  assert.match(duplicate.body.message, /inscripción/i);
});

test('confirma los cupos al enviar, aunque la lista se haya cargado antes', async () => {
  const activitiesResponse = await fetch(`${baseUrl}/api/actividades`);
  const activities = await activitiesResponse.json();
  assert.equal(activities.actividades.find((activity) => activity.id === 'ACT-001').disponibles, 24);

  const fullActivity = Array.from({ length: 24 }, (_, index) => ({
    actividadId: 'ACT-001',
    email: `voluntario${index}@example.com`,
    visitorId: `00000000-0000-4000-8000-${String(index + 10).padStart(12, '0')}`,
  }));
  await fs.writeFile(enrollmentsFile, JSON.stringify(fullActivity), 'utf8');

  const result = await postEnrollment(validEnrollment());
  assert.equal(result.response.status, 409);
  assert.match(result.body.message, /no quedan cupos/i);
});
