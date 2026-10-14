const { join } = require("node:path")
const { createApp } = require("./app")
const { createStorage } = require("./storage")

const port = Number(process.env.PORT ?? 3000)
const dataFile =
  process.env.DATA_FILE ?? join(__dirname, "..", "data", "inscripciones.json")
const allowedOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173"

const app = createApp({
  storage: createStorage(dataFile),
  allowedOrigin,
})

app.listen(port, () => {
  console.log(`API de inscripciones disponible en http://localhost:${port}/api`)
})
