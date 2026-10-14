const { mkdir, readFile, rename, writeFile } = require("node:fs/promises")
const { dirname } = require("node:path")

function createStorage(filePath) {
  async function readAll() {
    await mkdir(dirname(filePath), { recursive: true })

    let content
    try {
      content = await readFile(filePath, "utf8")
    } catch (error) {
      if (error.code !== "ENOENT") throw error
      await writeFile(filePath, "[]\n", "utf8")
      return []
    }

    let records
    try {
      records = JSON.parse(content)
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error("El archivo de inscripciones contiene JSON inválido.", {
          cause: error,
        })
      }
      throw error
    }

    if (!Array.isArray(records)) {
      throw new Error("El archivo de inscripciones no contiene una lista.")
    }
    return records
  }

  async function add(record) {
    const records = await readAll()
    records.unshift(record)
    await mkdir(dirname(filePath), { recursive: true })
    const temporaryPath = `${filePath}.tmp`
    await writeFile(
      temporaryPath,
      `${JSON.stringify(records, null, 2)}\n`,
      "utf8",
    )
    await rename(temporaryPath, filePath)
    return record
  }

  return { readAll, add }
}

module.exports = { createStorage }
