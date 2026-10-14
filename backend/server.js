const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { promisify } = require('node:util');
const cors = require('cors');
const express = require('express');

const app = express();
const PORT = Number(process.env.PORT || 3001);
const USERS_FILE = path.join(__dirname, 'data', 'usuarios.json');
const ENROLLMENTS_FILE = path.join(__dirname, 'data', 'inscripciones.json');
const scrypt = promisify(crypto.scrypt);
const SESSION_DURATION = 12 * 60 * 60 * 1000;
const ACTIVITIES = [
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
const sessions = new Map();
let writeQueue = Promise.resolve();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));

async function readUsers() {
  const contents = await fs.readFile(USERS_FILE, 'utf8');
  const users = JSON.parse(contents);

  if (!Array.isArray(users)) {
    throw new Error('El archivo de usuarios debe contener una lista JSON.');
  }

  return users;
}

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

function updateUsers(update) {
  return updateJsonFile(USERS_FILE, update);
}

function validateEmail(email) {
  return typeof email === 'string'
    && email.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function publicUser(user) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function authenticate(request, response, next) {
  const authorization = request.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : '';
  const session = sessions.get(token);

  if (!session || session.expiresAt <= Date.now()) {
    if (token) {
      sessions.delete(token);
    }
    return response.status(401).json({
      message: 'Tu sesión venció. Inicia sesión nuevamente.',
    });
  }

  request.userId = session.userId;
  return next();
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}

async function checkPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash || !/^[a-f0-9]{128}$/i.test(hash)) {
    return false;
  }

  const submittedHash = await scrypt(password, salt, 64);
  return crypto.timingSafeEqual(submittedHash, Buffer.from(hash, 'hex'));
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

app.post('/api/auth/registro', async (request, response) => {
  const { nombre, email, contrasena } = request.body ?? {};

  if (
    typeof nombre !== 'string'
    || nombre.trim().length < 2
    || nombre.trim().length > 80
    || !validateEmail(email)
    || typeof contrasena !== 'string'
    || contrasena.length < 8
    || contrasena.length > 128
  ) {
    return response.status(400).json({
      message: 'Ingresa un nombre, un correo válido y una contraseña de 8 a 128 caracteres.',
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await hashPassword(contrasena);
    const user = await updateUsers((users) => {
      if (users.some((existingUser) => existingUser.email === normalizedEmail)) {
        return null;
      }

      const newUser = {
        id: crypto.randomUUID(),
        nombre: nombre.trim(),
        email: normalizedEmail,
        passwordHash,
        createdAt: new Date().toISOString(),
      };
      users.push(newUser);
      return newUser;
    });

    if (!user) {
      return response.status(409).json({
        message: 'Ya existe una cuenta con ese correo electrónico.',
      });
    }

    return response.status(201).json({
      message: 'Cuenta creada correctamente.',
      usuario: publicUser(user),
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return response.status(500).json({
      message: 'No se pudo crear la cuenta. Inténtalo de nuevo más tarde.',
    });
  }
});

app.post('/api/auth/login', async (request, response) => {
  const { email, contrasena } = request.body ?? {};

  if (
    !validateEmail(email)
    || typeof contrasena !== 'string'
    || contrasena.length === 0
    || contrasena.length > 128
  ) {
    return response.status(400).json({
      message: 'Ingresa un correo válido y tu contraseña.',
    });
  }

  try {
    const users = await readUsers();
    const user = users.find(
      (registeredUser) => registeredUser.email === email.trim().toLowerCase(),
    );

    if (!user || !(await checkPassword(contrasena, user.passwordHash))) {
      return response.status(401).json({
        message: 'El correo o la contraseña son incorrectos.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, {
      userId: user.id,
      expiresAt: Date.now() + SESSION_DURATION,
    });

    return response.status(200).json({
      message: 'Inicio de sesión exitoso.',
      usuario: publicUser(user),
      token,
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    return response.status(500).json({
      message: 'No se pudo iniciar sesión. Inténtalo de nuevo más tarde.',
    });
  }
});

app.post('/api/inscripciones', authenticate, async (request, response) => {
  const { actividadId } = request.body ?? {};
  const activity = ACTIVITIES.find((item) => item.id === actividadId);

  if (!activity) {
    return response.status(404).json({ message: 'La actividad seleccionada no existe.' });
  }

  if (new Date(`${activity.fecha}T${activity.hora}`) <= new Date()) {
    return response.status(400).json({ message: 'Esta actividad ya se realizó.' });
  }

  try {
    const enrollment = await updateJsonFile(ENROLLMENTS_FILE, (enrollments) => {
      if (enrollments.some(
        (item) => item.actividadId === actividadId && item.usuarioId === request.userId,
      )) {
        return { error: 'Ya tienes una inscripción para esta actividad.' };
      }

      const enrolledCount = enrollments.filter(
        (item) => item.actividadId === actividadId,
      ).length;
      if (enrolledCount >= activity.cupo) {
        return { error: 'Ya no quedan cupos disponibles para esta actividad.' };
      }

      const newEnrollment = {
        id: crypto.randomUUID(),
        actividadId,
        usuarioId: request.userId,
        createdAt: new Date().toISOString(),
      };
      enrollments.push(newEnrollment);
      return { enrollment: newEnrollment };
    });

    if (enrollment.error) {
      return response.status(409).json({ message: enrollment.error });
    }

    return response.status(201).json({
      message: 'Tu inscripción se realizó correctamente.',
      inscripcion: enrollment.enrollment,
    });
  } catch (error) {
    console.error('Error al crear inscripción:', error);
    return response.status(500).json({
      message: 'No se pudo completar la inscripción. Inténtalo de nuevo más tarde.',
    });
  }
});

app.get('/api/inscripciones', authenticate, async (request, response) => {
  try {
    const enrollments = JSON.parse(await fs.readFile(ENROLLMENTS_FILE, 'utf8'));
    const inscripciones = enrollments
      .filter((item) => item.usuarioId === request.userId)
      .map((item) => ({
        ...item,
        actividad: ACTIVITIES.find((activity) => activity.id === item.actividadId),
      }));

    return response.status(200).json({ inscripciones });
  } catch (error) {
    console.error('Error al consultar inscripciones:', error);
    return response.status(500).json({
      message: 'No se pudieron consultar tus inscripciones. Inténtalo de nuevo más tarde.',
    });
  }
});

app.delete('/api/inscripciones/:id', authenticate, async (request, response) => {
  try {
    const cancelled = await updateJsonFile(ENROLLMENTS_FILE, (enrollments) => {
      const enrollmentIndex = enrollments.findIndex(
        (item) => item.id === request.params.id && item.usuarioId === request.userId,
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
  await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });

  for (const [filePath, initialContents] of [
    [USERS_FILE, []],
    [ENROLLMENTS_FILE, []],
  ]) {
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

startServer().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error);
  process.exitCode = 1;
});
