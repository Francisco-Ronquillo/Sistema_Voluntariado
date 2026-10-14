import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import '../css/activities.css'

function formatDate(date, time) {
  return new Date(`${date}T${time}`).toLocaleString('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short',
  })
}

function InscripcionesPage({ session, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState(location.state?.message ?? '')

  const loadEnrollments = useCallback(async () => {
    const response = await fetch('/api/inscripciones', {
      headers: { Authorization: `Bearer ${session.token}` },
    })
    const result = await response.json()
    if (!response.ok) {
      if (response.status === 401) {
        onLogout()
        navigate('/login', {
          replace: true,
          state: { from: '/inscripciones', message: result.message },
        })
        return
      }
      throw new Error(result.message || 'No se pudieron cargar tus inscripciones.')
    }
    setEnrollments(result.inscripciones)
  }, [navigate, onLogout, session.token])

  useEffect(() => {
    let active = true

    async function load() {
      try {
        await loadEnrollments()
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

    load()
    return () => {
      active = false
    }
  }, [loadEnrollments])

  async function handleCancel(enrollmentId) {
    if (!window.confirm('¿Quieres cancelar esta inscripción?')) {
      return
    }

    setCancellingId(enrollmentId)
    setError('')
    setMessage('')
    try {
      const response = await fetch(`/api/inscripciones/${encodeURIComponent(enrollmentId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` },
      })
      const result = await response.json()
      if (!response.ok) {
        if (response.status === 401) {
          onLogout()
          navigate('/login', {
            replace: true,
            state: { from: '/inscripciones', message: result.message },
          })
          return
        }
        throw new Error(result.message || 'No se pudo cancelar la inscripción.')
      }

      setEnrollments((current) => current.filter((item) => item.id !== enrollmentId))
      setMessage(result.message)
    } catch (requestError) {
      setError(requestError instanceof TypeError
        ? 'No se pudo conectar con el servidor. Inténtalo de nuevo.'
        : requestError.message)
    } finally {
      setCancellingId('')
    }
  }

  return (
    <main className="activities-page">
      <section className="container activities-section" aria-labelledby="enrollments-title">
        <span className="badge">Tu participación</span>
        <h1 id="enrollments-title">Mis inscripciones</h1>
        <p className="activities-intro">
          Aquí puedes consultar tus actividades y cancelar una inscripción si cambias de plan.
        </p>

        {message && <p className="page-message success-message" role="status">{message}</p>}
        {error && <p className="page-message error-message" role="alert">{error}</p>}
        {loading && <p className="page-message" role="status">Cargando tus inscripciones...</p>}

        {!loading && !error && enrollments.length === 0 && (
          <div className="empty-enrollments">
            <p>Aún no tienes inscripciones.</p>
            <Link className="button button-primary" to="/actividades">
              Explorar actividades
            </Link>
          </div>
        )}

        {!loading && enrollments.length > 0 && (
          <div className="activity-grid">
            {enrollments.map((enrollment) => (
              <article className="activity-card enrollment-card" key={enrollment.id}>
                {enrollment.actividad ? (
                  <>
                    <div className="activity-card-content">
                      <span className="activity-label">Inscripción confirmada</span>
                      <h2>{enrollment.actividad.nombre}</h2>
                      <p className="activity-description">{enrollment.actividad.descripcion}</p>
                      <dl className="activity-details">
                        <div>
                          <dt>Fecha y hora</dt>
                          <dd>{formatDate(enrollment.actividad.fecha, enrollment.actividad.hora)}</dd>
                        </div>
                        <div>
                          <dt>Lugar</dt>
                          <dd>{enrollment.actividad.lugar}</dd>
                        </div>
                      </dl>
                    </div>
                    <button
                      className="button button-danger activity-button"
                      disabled={cancellingId === enrollment.id}
                      onClick={() => handleCancel(enrollment.id)}
                      type="button"
                    >
                      {cancellingId === enrollment.id ? 'Cancelando...' : 'Cancelar inscripción'}
                    </button>
                  </>
                ) : (
                  <p>La actividad de esta inscripción ya no está disponible.</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default InscripcionesPage
