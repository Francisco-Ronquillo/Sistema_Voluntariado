const { randomUUID } = require("node:crypto")
const cors = require("cors")
const express = require("express")
const { activities } = require("./activities")
const { validateRegistration } = require("./validation")

function createApp({
  storage,
  allowedOrigin = "http://localhost:5173",
}) {
  const app = express()

  app.disable("x-powered-by")
  app.use(cors({ origin: allowedOrigin }))
  app.use(express.json({ limit: "20kb" }))

  app.get("/api/salud", (_request, response) => {
    response.status(200).json({ estado: "ok" })
  })

  app.post("/api/inscripciones", async (request, response, next) => {
    const { errors, data } = validateRegistration(request.body)
    if (errors.length) {
      return response.status(400).json({
        error: "Los datos enviados no son válidos.",
        detalles: errors,
      })
    }

    const activity = activities.find((item) => item.id === data.actividadId)
    const record = {
      id: `INS-${randomUUID().slice(0, 8).toUpperCase()}`,
      ...data,
      actividad: activity.name,
      categoria: activity.category,
      fecha: activity.date,
      lugar: activity.place,
      estado: "Confirmada",
      createdAt: new Date().toISOString(),
    }

    try {
      await storage.add(record)
      return response.status(201).json(record)
    } catch (error) {
      return next(error)
    }
  })

  app.use((error, _request, response, _next) => {
    if (error instanceof SyntaxError && "body" in error) {
      return response.status(400).json({
        error: "El JSON enviado no es válido.",
      })
    }

    console.error("Error al guardar la inscripción:", error.message)
    return response.status(500).json({
      error: "No fue posible guardar la inscripción.",
    })
  })

  return app
}

module.exports = { createApp }
