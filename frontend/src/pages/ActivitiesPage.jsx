import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../css/activities.css'

function formatDate(date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

const categoryClasses = {
  'Medio ambiente': 'category-environment',
  'Ayuda social': 'category-social',
  Educación: 'category-education',
  Animales: 'category-animals',
}

function ActivitiesPage() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadActivities() {
      try {
        const response = await fetch('/api/actividades')
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.message || 'No se pudieron cargar las actividades.')
        }
        if (active) {
          setActivities(result.actividades)
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

    loadActivities()
    return () => {
      active = false
    }
  }, [])

  return (
    <main className="activities-page">
      <section className="container activities-section" aria-labelledby="activities-title">
        <span className="badge">Oportunidades disponibles</span>
        <h1 id="activities-title">Elige dónde quieres sumar</h1>
        <p className="activities-intro">
          Consulta las próximas jornadas, sus fechas y cupos antes de inscribirte.
        </p>

        {error && <p className="page-message error-message" role="alert">{error}</p>}
        {loading && <p className="page-message" role="status">Cargando actividades...</p>}

        {!loading && !error && activities.length === 0 && (
          <p className="page-message">Por el momento no hay actividades disponibles.</p>
        )}

        {!loading && activities.length > 0 && (
          <div className="activity-grid">
            {activities.map((activity) => (
              <article className="activity-card" key={activity.id}>
                <div className="activity-card-content">
                  <div className="activity-card-meta">
                    <span className={`activity-label ${categoryClasses[activity.categoria] ?? ''}`}>
                      {activity.categoria}
                    </span>
                    <span className="activity-capacity">
                      {activity.disponibles === 0
                        ? 'Cupo completo'
                        : `${activity.disponibles} cupos`}
                    </span>
                  </div>
                  <h2>{activity.nombre}</h2>
                  <p className="activity-description">{activity.descripcion}</p>
                  <dl className="activity-details">
                    <div>
                      <dt>Fecha</dt>
                      <dd className="activity-detail-icon">
                        <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
                        </svg>
                        {formatDate(activity.fecha)}
                      </dd>
                    </div>
                    <div>
                      <dt>Lugar</dt>
                      <dd className="activity-detail-icon">
                        <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                          <circle cx="12" cy="10" r="2.5" />
                        </svg>
                        {activity.lugar}
                      </dd>
                    </div>
                  </dl>
                </div>
                <Link
                  className={`button button-primary activity-button${activity.disponibles === 0 ? ' button-disabled' : ''}`}
                  aria-disabled={activity.disponibles === 0}
                  onClick={(event) => {
                    if (activity.disponibles === 0) event.preventDefault()
                  }}
                  to={`/registro?actividad=${encodeURIComponent(activity.id)}`}
                >
                  {activity.disponibles === 0 ? (
                    'Cupo completo'
                  ) : (
                    <>
                      Reservar mi cupo
                      <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 12h14m-5-5 5 5-5 5" />
                      </svg>
                    </>
                  )}
                </Link>
              </article>
            ))}
          </div>
        )}

      </section>
    </main>
  )
}

export default ActivitiesPage
