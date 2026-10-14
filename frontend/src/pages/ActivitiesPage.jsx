import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../css/activities.css'

function formatDate(date, time) {
  return new Date(`${date}T${time}`).toLocaleString('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short',
  })
}

function ActivitiesPage({ session, onLogout }) {
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

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

  async function handleEnroll(actividadId) {
    if (!session) {
      navigate('/login', {
        state: {
          from: '/actividades',
          message: 'Inicia sesión para inscribirte a una actividad.',
        },
      })
      return
    }

    setSubmittingId(actividadId)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/inscripciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ actividadId }),
      })
      const result = await response.json()
      if (!response.ok) {
        if (response.status === 401) {
          onLogout()
          navigate('/login', {
            replace: true,
            state: { from: '/actividades', message: result.message },
          })
          return
        }
        throw new Error(result.message || 'No se pudo completar la inscripción.')
      }

      navigate('/inscripciones', { state: { message: result.message } })
    } catch (requestError) {
      setError(requestError instanceof TypeError
        ? 'No se pudo conectar con el servidor. Inténtalo de nuevo.'
        : requestError.message)
    } finally {
      setSubmittingId('')
    }
  }

  return (
    <main className="activities-page">
      <section className="container activities-section" aria-labelledby="activities-title">
        <span className="badge">Encuentra tu manera de ayudar</span>
        <h1 id="activities-title">Actividades disponibles</h1>
        <p className="activities-intro">
          Elige una causa que te inspire y reserva tu lugar para participar.
        </p>

        {message && <p className="page-message success-message" role="status">{message}</p>}
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
                  <span className="activity-label">Voluntariado</span>
                  <h2>{activity.nombre}</h2>
                  <p className="activity-description">{activity.descripcion}</p>
                  <dl className="activity-details">
                    <div>
                      <dt>Fecha y hora</dt>
                      <dd>{formatDate(activity.fecha, activity.hora)}</dd>
                    </div>
                    <div>
                      <dt>Lugar</dt>
                      <dd>{activity.lugar}</dd>
                    </div>
                    <div>
                      <dt>Cupos disponibles</dt>
                      <dd>{activity.disponibles} de {activity.cupo}</dd>
                    </div>
                  </dl>
                </div>
                <button
                  className="button button-primary activity-button"
                  disabled={activity.disponibles === 0 || submittingId === activity.id}
                  onClick={() => handleEnroll(activity.id)}
                  type="button"
                >
                  {submittingId === activity.id
                    ? 'Inscribiendo...'
                    : activity.disponibles === 0
                      ? 'Cupo completo'
                      : 'Inscribirme'}
                </button>
              </article>
            ))}
          </div>
        )}

        {session && (
          <p className="activities-link">
            <Link to="/inscripciones">Consulta tus inscripciones</Link>
          </p>
        )}
      </section>
    </main>
  )
}

export default ActivitiesPage
