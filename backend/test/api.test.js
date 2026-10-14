const assert = require("node:assert/strict")
const { after, before, test } = require("node:test")
const { createApp } = require("../src/app")

let baseUrl
let server
const records = []

before(async () => {
  const storage = {
    async add(record) {
      records.unshift(record)
      return record
    },
  }
  const app = createApp({ storage })
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve)
  })
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
})

function validInput(overrides = {}) {
  return {
    nombre: "Ana Martínez",
    email: "ana@example.com",
    actividadId: "ACT-001",
    motivacion: "Quiero colaborar con el cuidado de las áreas verdes.",
    ...overrides,
  }
}

test("GET salud confirma que la API está disponible", async () => {
  const response = await fetch(`${baseUrl}/api/salud`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { estado: "ok" })
})

test("POST rechaza datos incompletos", async () => {
  const response = await fetch(`${baseUrl}/api/inscripciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre: "A" }),
  })
  const body = await response.json()

  assert.equal(response.status, 400)
  assert.equal(body.error, "Los datos enviados no son válidos.")
  assert.ok(body.detalles.length > 0)
})

test("POST rechaza actividades inexistentes", async () => {
  const response = await fetch(`${baseUrl}/api/inscripciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validInput({ actividadId: "ACT-999" })),
  })

  assert.equal(response.status, 400)
  assert.match((await response.json()).detalles.join(" "), /actividad/)
})

test("POST crea una inscripción y la envía al almacenamiento", async () => {
  const response = await fetch(`${baseUrl}/api/inscripciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validInput()),
  })
  const created = await response.json()

  assert.equal(response.status, 201)
  assert.match(created.id, /^INS-[A-F0-9]{8}$/)
  assert.equal(created.estado, "Confirmada")
  assert.equal(created.email, "ana@example.com")
  assert.equal(created.actividad, "Reforestación del parque")
  assert.equal(records.length, 1)
  assert.equal(records[0].id, created.id)
})
