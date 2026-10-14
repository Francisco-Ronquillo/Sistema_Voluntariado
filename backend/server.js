const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { promisify } = require('node:util');
const cors = require('cors');
const express = require('express');

const app = express();
const PORT = 3000;
const USERS_FILE = path.join(__dirname, 'data', 'usuarios.json');
const scrypt = promisify(crypto.scrypt);
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

async function writeUsers(users) {
  const temporaryFile = `${USERS_FILE}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(temporaryFile, JSON.stringify(users, null, 2), 'utf8');
  await fs.rename(temporaryFile, USERS_FILE);
}

function updateUsers(update) {
  const operation = writeQueue.then(async () => {
    const users = await readUsers();
    const result = await update(users);
    await writeUsers(users);
    return result;
  });

  writeQueue = operation.then(() => undefined, () => undefined);
  return operation;
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

    return response.status(200).json({
      message: 'Inicio de sesión exitoso.',
      usuario: publicUser(user),
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    return response.status(500).json({
      message: 'No se pudo iniciar sesión. Inténtalo de nuevo más tarde.',
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

  try {
    await fs.access(USERS_FILE);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    await writeUsers([]);
  }

  app.listen(PORT, () => {
    console.log(`Backend en http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error);
  process.exitCode = 1;
});
