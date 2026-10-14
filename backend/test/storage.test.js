const assert = require("node:assert/strict")
const { mkdtemp, readFile, rm } = require("node:fs/promises")
const { tmpdir } = require("node:os")
const { join } = require("node:path")
const { test } = require("node:test")
const { createStorage } = require("../src/storage")

test("guarda inscripciones en el archivo JSON y las conserva", async () => {
  const directory = await mkdtemp(join(tmpdir(), "inscripcion-actividad-"))
  const filePath = join(directory, "data", "inscripciones.json")
  const storage = createStorage(filePath)
  const record = {
    id: "INS-12345678",
    nombre: "Ana Martínez",
    email: "ana@example.com",
  }

  try {
    assert.deepEqual(await storage.readAll(), [])
    await storage.add(record)
    assert.deepEqual(await storage.readAll(), [record])
    assert.deepEqual(JSON.parse(await readFile(filePath, "utf8")), [record])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
