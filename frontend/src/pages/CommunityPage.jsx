import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import RecordCard from '../components/RecordCard'
import { getVisitorId } from '../utils/visitor'
import '../css/activities.css'

function toEnrollmentRecord(enrollment) {
  return {
    id: enrollment.id,
    categoria: enrollment.actividad?.categoria ?? 'Voluntariado',
    estado: 'Confirmada',
    actividad: enrollment.actividad?.nombre ?? 'Actividad no disponible',
    descripcion: enrollment.descripcion
      || 'No se registró una motivación para esta inscripción.',
    nombre: enrollment.nombre,
    fecha: enrollment.actividad?.fecha ?? enrollment.createdAt,
  }
}

function CommunityPage() {
  const [records, setRecords] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true)
  const [enrollmentsError, setEnrollmentsError] = useState('')

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

    async function loadEnrollments() {
      try {
        const response = await fetch('/api/inscripciones', {
          headers: { 'X-Visitor-Id': getVisitorId() },
        })
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.message || 'No se pudieron cargar tus inscripciones.')
        }
        if (!Array.isArray(result.inscripciones)) {
          throw new Error('El servidor devolvió una lista de inscripciones no válida.')
        }
        if (active) {
          setEnrollments(result.inscripciones)
        }
      } catch (requestError) {
        if (active) {
          setEnrollmentsError(requestError instanceof TypeError
            ? 'No se pudieron cargar tus inscripciones. Verifica que el backend esté iniciado.'
            : requestError.message)
        }
      } finally {
        if (active) {
          setEnrollmentsLoading(false)
        }
      }
    }

    loadRecords()
    loadEnrollments()
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

  const filteredEnrollments = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('es')
    return enrollments
      .map(toEnrollmentRecord)
      .filter((record) =>
        `${record.nombre} ${record.actividad}`.toLocaleLowerCase('es').includes(search),
      )
  }, [enrollments, query])

  return (
    <main className="community-page">
      <section className="container community-section" aria-labelledby="community-title">
        <span className="badge">Tu participación</span>
        <h1 id="community-title">Mis inscripciones</h1>
        <p className="activities-intro">
          Revisa tus reservas y descubre las actividades de nuestra comunidad.
        </p>

        <label className="community-search">
          <span className="visually-hidden">Buscar inscripciones por nombre o actividad</span>
          <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar inscripciones por nombre o actividad..."
            type="search"
            value={query}
          />
        </label>

        <section className="community-subsection" aria-labelledby="my-enrollments-title">
          <h2 id="my-enrollments-title">Tus reservas</h2>
          <p className="community-privacy">
            Solo tú puedes consultar las inscripciones guardadas desde este navegador.
          </p>
          {enrollmentsLoading && (
            <p className="page-message" role="status">Cargando tus inscripciones...</p>
          )}
          {enrollmentsError && (
            <p className="page-message error-message" role="alert">{enrollmentsError}</p>
          )}
          {!enrollmentsLoading && !enrollmentsError && filteredEnrollments.length > 0 && (
            <div className="record-grid">
              {filteredEnrollments.map((record) => (
                <RecordCard key={record.id} record={record} />
              ))}
            </div>
          )}
          {!enrollmentsLoading && !enrollmentsError && enrollments.length === 0 && (
            <p className="community-empty">
              Aún no tienes inscripciones.
              {' '}<Link to="/actividades">Explora las actividades disponibles.</Link>
            </p>
          )}
          {!enrollmentsLoading && !enrollmentsError && enrollments.length > 0
            && filteredEnrollments.length === 0 && (
              <p className="community-empty">No hay inscripciones que coincidan con tu búsqueda.</p>
            )}
        </section>

        <section className="community-subsection" aria-labelledby="community-examples-title">
          <h2 id="community-examples-title">Personas de nuestra comunidad</h2>
          <p className="community-privacy">
            Estos son registros de ejemplo; no incluyen las inscripciones privadas de otras personas.
          </p>
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
                ? 'No hay registros de ejemplo que coincidan con tu búsqueda.'
                : 'Todavía no hay registros de ejemplo para mostrar.'}
            </p>
          )}
        </section>
      </section>
    </main>
  )
}

export default CommunityPage
