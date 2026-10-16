const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const cors = require('cors');
const express = require('express');

const app = express();
const PORT = Number(process.env.PORT || 3001);
const ENROLLMENTS_FILE = process.env.ENROLLMENTS_FILE
  || path.join(__dirname, 'data', 'inscripciones.json');
const VISITOR_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIVITIES = [
  {
    id: 'ACT-001',
    nombre: 'Reforestación del Parque Central',
    categoria: 'Medio ambiente',
    descripcion: 'Siembra de árboles nativos y recuperación de las zonas verdes del parque.',
    fecha: '2027-04-18',
    hora: '09:00',
    lugar: 'Parque Central',
    cupo: 24,
  },
  {
    id: 'ACT-002',
    nombre: 'Apoyo en comedor comunitario',
    categoria: 'Ayuda social',
    descripcion: 'Preparación y entrega de alimentos para familias de la comunidad.',
    fecha: '2027-04-22',
    hora: '08:00',
    lugar: 'Centro Comunitario La Esperanza',
    cupo: 15,
  },
  {
    id: 'ACT-003',
    nombre: 'Tutorías para niños',
    categoria: 'Educación',
    descripcion: 'Acompañamiento en lectura, escritura y matemáticas para estudiantes.',
    fecha: '2027-04-26',
    hora: '10:00',
    lugar: 'Biblioteca Municipal',
    cupo: 12,
  },
  {
    id: 'ACT-004',
    nombre: 'Jornada de bienestar animal',
    categoria: 'Animales',
    descripcion: 'Apoyo en alimentación, limpieza y socialización de animales rescatados.',
    fecha: '2027-05-03',
    hora: '08:00',
    lugar: 'Refugio Huellas',
    cupo: 18,
  },
];
const LEGACY_ACTIVITIES = [
  {
    id: 'limpieza-parque',
    nombre: 'Jornada de limpieza del parque',
    descripcion: 'Recuperemos juntos las áreas verdes y los espacios comunes de nuestra comunidad.',
    fecha: '2026-11-07',
    hora: '09:00',
    lugar: 'Parque Central',
    cupo: 1,
  },
  {
    id: 'apoyo-escolar',
    nombre: 'Acompañamiento escolar',
    descripcion: 'Comparte tus conocimientos y apoya a niñas y niños con sus actividades escolares.',
    fecha: '2026-11-14',
    hora: '10:00',
    lugar: 'Centro Comunitario',
    cupo: 12,
  },
  {
    id: 'colecta-alimentos',
    nombre: 'Colecta de alimentos',
    descripcion: 'Ayuda a organizar y distribuir alimentos para familias de la zona.',
    fecha: '2026-11-21',
    hora: '08:30',
    lugar: 'Banco de Alimentos',
    cupo: 15,
  },
];
const ALL_ACTIVITIES = [...ACTIVITIES, ...LEGACY_ACTIVITIES];
const COMMUNITY_RECORDS = [
  {
    id: 'VOL-2841',
    nombre: 'María González',
    actividad: 'Reforestación del Parque Central',
    descripcion: 'Quiero aportar a la recuperación de las áreas verdes de mi comunidad.',
    fecha: '2026-04-18',
    categoria: 'Medio ambiente',
    estado: 'Confirmada',
    createdAt: '2026-03-10T10:00:00.000Z',
  },
  {
    id: 'VOL-1975',
    nombre: 'Carlos Mendoza',
    actividad: 'Apoyo en comedor comunitario',
    descripcion: 'Tengo experiencia en cocina y disponibilidad para apoyar durante toda la jornada.',
    fecha: '2026-04-22',
    categoria: 'Ayuda social',
    estado: 'Confirmada',
    createdAt: '2026-03-09T16:30:00.000Z',
  },
  {
    id: 'VOL-3158',
    nombre: 'Laura Ramírez',
    actividad: 'Tutorías para niños',
    descripcion: 'Puedo brindar apoyo en lectura y matemáticas a estudiantes de primaria.',
    fecha: '2026-04-26',
    categoria: 'Educación',
    estado: 'Confirmada',
    createdAt: '2026-03-08T14:20:00.000Z',
  },
];
let writeQueue = Promise.resolve();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));

async function writeJsonFile(filePath, contents) {
  const temporaryFile = `${filePath}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(temporaryFile, JSON.stringify(contents, null, 2), 'utf8');
  await fs.rename(temporaryFile, filePath);
}

function updateJsonFile(filePath, update) {
  const operation = writeQueue.then(async () => {
    const contents = JSON.parse(await fs.readFile(filePath, 'utf8'));
    if (!Array.isArray(contents)) {
      throw new Error(`${path.basename(filePath)} debe contener una lista JSON.`);
    }

    const result = await update(contents);
    await writeJsonFile(filePath, contents);
    return result;
  });

  writeQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

function validateEmail(email) {
  return typeof email === 'string'
    && email.trim().length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

app.get('/', (request, response) => {
  response.send('API de Voluntariado');
});

app.get('/api/actividades', async (request, response) => {
  try {
    const enrollments = JSON.parse(await fs.readFile(ENROLLMENTS_FILE, 'utf8'));
    return response.status(200).json({
      actividades: ACTIVITIES.map((activity) => {
        const inscritos = enrollments.filter(
          (enrollment) => enrollment.actividadId === activity.id,
        ).length;
        return {
          ...activity,
          inscritos,
          disponibles: Math.max(activity.cupo - inscritos, 0),
        };
      }),
    });
  } catch (error) {
    console.error('Error al consultar actividades:', error);
    return response.status(500).json({
      message: 'No se pudieron cargar las actividades. Inténtalo de nuevo más tarde.',
    });
  }
});

app.get('/api/registros', (request, response) => {
  return response.status(200).json({ registros: COMMUNITY_RECORDS });
});

app.post('/api/inscripciones', async (request, response) => {
  const { actividadId, nombre, email, descripcion, visitorId } = request.body ?? {};
  const activity = ACTIVITIES.find((item) => item.id === actividadId);

  if (!activity) {
    return response.status(404).json({ message: 'La actividad seleccionada no existe.' });
  }

  if (typeof nombre !== 'string' || nombre.trim().length < 2 || nombre.trim().length > 80) {
    return response.status(400).json({
      message: 'El nombre debe tener entre 2 y 80 caracteres, sin contar espacios al inicio o al final.',
    });
  }

  if (!validateEmail(email)) {
    return response.status(400).json({ message: 'Ingresa un correo electrónico válido.' });
  }

  if (
    typeof descripcion !== 'string'
    || descripcion.trim().length < 20
    || descripcion.trim().length > 300
  ) {
    return response.status(400).json({
      message: 'La motivación debe tener entre 20 y 300 caracteres, sin contar espacios al inicio o al final.',
    });
  }

  if (typeof visitorId !== 'string' || !VISITOR_ID_PATTERN.test(visitorId)) {
    return response.status(400).json({
      message: 'No se pudo identificar este navegador. Recarga la página e inténtalo de nuevo.',
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const enrollmentResult = await updateJsonFile(ENROLLMENTS_FILE, (enrollments) => {
      if (enrollments.some(
        (item) => item.actividadId === actividadId
          && typeof item.email === 'string'
          && item.email.trim().toLowerCase() === normalizedEmail,
      )) {
        return { error: 'Este correo ya tiene una inscripción para esta actividad.' };
      }

      if (new Date(`${activity.fecha}T${activity.hora}`) <= new Date()) {
        return { error: 'Esta actividad ya se realizó o ya no acepta reservas.', status: 410 };
      }

      const enrolledCount = enrollments.filter(
        (item) => item.actividadId === actividadId,
      ).length;
      if (enrolledCount >= activity.cupo) {
        return {
          error: 'Ya no quedan cupos disponibles para esta actividad. Elige otra actividad.',
          status: 409,
        };
      }

      const newEnrollment = {
        id: crypto.randomUUID(),
        actividadId,
        nombre: nombre.trim(),
        email: normalizedEmail,
        descripcion: descripcion.trim(),
        visitorId,
        createdAt: new Date().toISOString(),
      };
      enrollments.push(newEnrollment);
      return { enrollment: newEnrollment };
    });

    if (enrollmentResult.error) {
      return response.status(enrollmentResult.status || 409).json({
        message: enrollmentResult.error,
      });
    }

    return response.status(201).json({
      message: 'Tu inscripción se realizó correctamente.',
      inscripcion: {
        id: enrollmentResult.enrollment.id,
        actividadId: enrollmentResult.enrollment.actividadId,
        createdAt: enrollmentResult.enrollment.createdAt,
      },
    });
  } catch (error) {
    console.error('Error al crear inscripción:', error);
    return response.status(500).json({
      message: 'No se pudo completar la inscripción. Inténtalo de nuevo más tarde.',
    });
  }
});

app.get('/api/inscripciones', async (request, response) => {
  const visitorId = request.get('X-Visitor-Id');
  if (typeof visitorId !== 'string' || !VISITOR_ID_PATTERN.test(visitorId)) {
    return response.status(400).json({ message: 'No se pudo identificar este navegador.' });
  }

  try {
    const enrollments = JSON.parse(await fs.readFile(ENROLLMENTS_FILE, 'utf8'));
    const inscripciones = enrollments
      .filter((item) => item.visitorId === visitorId)
      .map((item) => ({
        id: item.id,
        actividadId: item.actividadId,
        nombre: item.nombre,
        email: item.email,
        descripcion: item.descripcion ?? '',
        createdAt: item.createdAt,
        actividad: ALL_ACTIVITIES.find((activity) => activity.id === item.actividadId),
      }));

    return response.status(200).json({ inscripciones });
  } catch (error) {
    console.error('Error al consultar inscripciones:', error);
    return response.status(500).json({
      message: 'No se pudieron consultar tus inscripciones. Inténtalo de nuevo más tarde.',
    });
  }
});

app.delete('/api/inscripciones/:id', async (request, response) => {
  const visitorId = request.get('X-Visitor-Id');
  if (typeof visitorId !== 'string' || !VISITOR_ID_PATTERN.test(visitorId)) {
    return response.status(400).json({ message: 'No se pudo identificar este navegador.' });
  }

  try {
    const cancelled = await updateJsonFile(ENROLLMENTS_FILE, (enrollments) => {
      const enrollmentIndex = enrollments.findIndex(
        (item) => item.id === request.params.id && item.visitorId === visitorId,
      );
      if (enrollmentIndex === -1) {
        return false;
      }

      enrollments.splice(enrollmentIndex, 1);
      return true;
    });

    if (!cancelled) {
      return response.status(404).json({ message: 'No se encontró esa inscripción.' });
    }

    return response.status(200).json({ message: 'La inscripción se canceló correctamente.' });
  } catch (error) {
    console.error('Error al cancelar inscripción:', error);
    return response.status(500).json({
      message: 'No se pudo cancelar la inscripción. Inténtalo de nuevo más tarde.',
    });
  }
});

app.use((error, request, response, next) => {
  if (error instanceof SyntaxError && Object.hasOwn(error, 'body')) {
    return response.status(400).json({ message: 'El cuerpo de la petición no es JSON válido.' });
  }
  if (error.type === 'entity.too.large') {
    return response.status(413).json({ message: 'La petición supera el tamaño permitido.' });
  }

  console.error('Error no controlado en la API:', error);
  return response.status(500).json({ message: 'Ocurrió un error inesperado en el servidor.' });
});

async function startServer() {
  await fs.mkdir(path.dirname(ENROLLMENTS_FILE), { recursive: true });

  for (const [filePath, initialContents] of [[ENROLLMENTS_FILE, []]]) {
    try {
      await fs.access(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      await writeJsonFile(filePath, initialContents);
    }
  }

  app.listen(PORT, () => {
    console.log(`Backend en http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('No se pudo iniciar el servidor:', error);
    process.exitCode = 1;
  });
}

module.exports = { app };
