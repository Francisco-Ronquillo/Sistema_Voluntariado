import { useEffect, useMemo, useState } from 'react'
import RecordCard from '../components/RecordCard'
import '../css/activities.css'

function CommunityPage() {
  const [records, setRecords] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadRecords() {
      try {
        const response = await fetch('/api/registros')
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.message || 'No se pudieron cargar los registros.')
        }
        if (!Array.isArray(result.registros)) {
          throw new Error('El servidor devolvió una lista de registros no válida.')
        }
        if (active) {
          setRecords(result.registros)
        }
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof TypeError
            ? 'No se pudo conectar con el servidor. Verifica que el backend esté iniciado.'
            : requestError.message)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadRecords()
    return () => {
      active = false
    }
  }, [])

  const filteredRecords = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('es')
    return records.filter((record) =>
      `${record.nombre} ${record.actividad}`.toLocaleLowerCase('es').includes(search),
    )
  }, [records, query])

  return (
    <main className="community-page">
      <section className="container community-section" aria-labelledby="community-title">
        <span className="badge">Nuestra comunidad</span>
        <h1 id="community-title">Personas que están sumando</h1>
        <p className="activities-intro">
          Conoce algunas de las personas y causas que inspiran nuestra comunidad.
        </p>
        <p className="community-privacy">
          Estos son registros de ejemplo; las inscripciones reales solo las puede consultar quien las realizó.
        </p>

        <label className="community-search">
          <span className="visually-hidden">Buscar por nombre o actividad</span>
          <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o actividad..."
            type="search"
            value={query}
          />
        </label>

        {loading && <p className="page-message" role="status">Cargando registros...</p>}
        {error && <p className="page-message error-message" role="alert">{error}</p>}

        {!loading && !error && filteredRecords.length > 0 && (
          <div className="record-grid">
            {filteredRecords.map((record) => (
              <RecordCard key={record.id} record={record} />
            ))}
          </div>
        )}

        {!loading && !error && filteredRecords.length === 0 && (
          <p className="community-empty">
            {query
              ? 'No hay registros que coincidan con tu búsqueda.'
              : 'Todavía no hay registros de ejemplo para mostrar.'}
          </p>
        )}
      </section>
    </main>
  )
}

export default CommunityPage
