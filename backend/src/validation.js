const { activities } = require("./activities")

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateRegistration(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      errors: ["El cuerpo de la petición debe ser un objeto JSON."],
    }
  }

  const data = {
    nombre: typeof input.nombre === "string" ? input.nombre.trim() : "",
    email:
      typeof input.email === "string" ? input.email.trim().toLowerCase() : "",
    actividadId:
      typeof input.actividadId === "string" ? input.actividadId.trim() : "",
    motivacion:
      typeof input.motivacion === "string" ? input.motivacion.trim() : "",
  }
  const errors = []

  if (data.nombre.length < 3 || data.nombre.length > 100) {
    errors.push("El nombre debe tener entre 3 y 100 caracteres.")
  }
  if (data.email.length > 150 || !emailPattern.test(data.email)) {
    errors.push("El correo electrónico no tiene un formato válido.")
  }
  if (!activities.some((activity) => activity.id === data.actividadId)) {
    errors.push("La actividad seleccionada no es válida.")
  }
  if (data.motivacion.length < 20 || data.motivacion.length > 300) {
    errors.push("La motivación debe tener entre 20 y 300 caracteres.")
  }

  return { errors, data }
}

module.exports = { validateRegistration }
