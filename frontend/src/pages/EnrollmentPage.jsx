import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import '../css/activities.css'
import { getVisitorId } from '../utils/visitor'

async function fetchActivities() {
  const response = await fetch('/api/actividades')
  const result = await response.json()
  if (!response.ok) {
    throw new Error(result.message || 'No se pudieron cargar las actividades.')
  }
  if (!Array.isArray(result.actividades)) {
    throw new Error('La respuesta del servidor no contiene una lista de actividades válida.')
  }
  return result.actividades
}

function isValidEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function Field({ label, children, wide = false }) {
  return (
    <label className={`registration-field${wide ? ' registration-field-wide' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}

function EnrollmentPage() {
  const [searchParams] = useSearchParams()
  const [activities, setActivities] = useState([])
  const [activityId, setActivityId] = useState(searchParams.get('actividad') ?? '')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let active = true

    async function loadActivities() {
      try {
        if (active) {
          setActivities(await fetchActivities())
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

  const selectedActivity = activities.find((activity) => activity.id === activityId)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const normalizedName = nombre.trim()
    const normalizedEmail = email.trim()
    const normalizedDescription = descripcion.trim()

    if (normalizedName.length < 2 || normalizedName.length > 80) {
      setError('El nombre debe tener entre 2 y 80 caracteres, sin contar espacios al inicio o al final.')
      return
    }
    if (!isValidEmail(normalizedEmail)) {
      setError('Ingresa un correo válido de hasta 254 caracteres.')
      return
    }
    if (normalizedDescription.length < 20 || normalizedDescription.length > 300) {
      setError('La motivación debe tener entre 20 y 300 caracteres, sin contar espacios al inicio o al final.')
      return
    }
    if (!activityId) {
      setError('Selecciona una actividad para reservar tu cupo.')
      return
    }
    if (!selectedActivity) {
      setError('La actividad seleccionada ya no está disponible. Actualiza la página e inténtalo de nuevo.')
      return
    }
    if (selectedActivity.disponibles === 0) {
      setError('Ya no quedan cupos para esta actividad. Selecciona otra opción.')
      try {
        setActivities(await fetchActivities())
      } catch (requestError) {
        setError(`Ya no quedan cupos para esta actividad. No se pudo actualizar la lista: ${requestError.message}`)
      }
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/inscripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actividadId: activityId,
          nombre: normalizedName,
          email: normalizedEmail,
          descripcion: normalizedDescription,
          visitorId: getVisitorId(),
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        if (response.status === 409 || response.status === 410) {
          try {
            setActivities(await fetchActivities())
          } catch (refreshError) {
            setError(`${result.message || 'La actividad cambió y no se pudo confirmar la reserva.'} No se pudo actualizar la lista: ${refreshError.message}`)
            return
          }
        }
        throw new Error(result.message || 'No se pudo completar la inscripción.')
      }

      setSuccessMessage(result.message || 'Tu inscripción se realizó correctamente.')
    } catch (requestError) {
      setError(requestError instanceof TypeError
        ? 'No se pudo conectar con el servidor. Inténtalo de nuevo.'
        : requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="registration-page">
      <section className="container registration-section" aria-labelledby="registration-title">
        <div className="registration-intro">
          <span className="badge">Tu participación</span>
          <h1 id="registration-title">Reserva tu cupo</h1>
          <p className="activities-intro">
            Completa tus datos y cuéntanos por qué quieres participar.
          </p>
          <aside className="registration-note">
            <span className="registration-note-icon" aria-hidden="true">
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <div>
              <h2>Fácil y sin complicaciones</h2>
              <p>No necesitas crear una cuenta. Te tomará solo unos minutos.</p>
            </div>
          </aside>
          <div className="registration-promise">
            <span className="registration-promise-dot" aria-hidden="true" />
            <span>Tu tiempo puede hacer una gran diferencia.</span>
          </div>
        </div>

        <div className="registration-content">
          {successMessage ? (
            <div className="registration-card registration-success" role="status">
              <span className="success-check" aria-hidden="true">
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </span>
              <h2>¡Gracias por sumarte!</h2>
              <p>{successMessage}</p>
              {selectedActivity && (
                <p className="registration-success-activity">
                  {selectedActivity.nombre} · {selectedActivity.lugar}
                </p>
              )}
              <Link className="button button-primary" to="/actividades">
                Ver más actividades
              </Link>
            </div>
          ) : (
          <div className="registration-card">
            {loading ? (
              <p className="page-message" role="status">Cargando actividades...</p>
            ) : (
              <form className="registration-form" noValidate onSubmit={handleSubmit}>
                <Field label="Participante">
                  <input
                    autoComplete="name"
                    className="registration-input"
                    maxLength={80}
                    minLength={2}
                    onChange={(event) => setNombre(event.target.value)}
                    required
                    value={nombre}
                  />
                </Field>

                <Field label="Correo">
                  <input
                    autoComplete="email"
                    className="registration-input"
                    maxLength={254}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    type="email"
                    value={email}
                  />
                </Field>

                <Field label="Actividad">
                  <select
                    className="registration-input"
                    onChange={(event) => setActivityId(event.target.value)}
                    required
                    value={activityId}
                  >
                    <option value="">Selecciona una actividad</option>
                    {activities.map((activity) => (
                      <option
                        key={activity.id}
                        disabled={activity.disponibles === 0}
                        value={activity.id}
                      >
                        {activity.nombre}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Lugar">
                  <input
                    className="registration-input"
                    readOnly
                    value={selectedActivity?.lugar ?? ''}
                  />
                </Field>

                <Field label="Motivación" wide>
                  <textarea
                    className="registration-input registration-textarea"
                    maxLength={300}
                    minLength={20}
                    onChange={(event) => setDescripcion(event.target.value)}
                    placeholder="Cuéntanos por qué quieres sumarte a esta actividad (mínimo 20 caracteres)."
                    required
                    value={descripcion}
                  />
                  <span className="character-count">{descripcion.length}/300</span>
                </Field>

                {error && (
                  <p className="registration-error" role="alert">{error}</p>
                )}

                <button
                  className="button button-primary registration-submit"
                  disabled={submitting || activities.length === 0}
                  type="submit"
                >
                  {submitting ? 'Se están enviando sus datos…' : 'Confirmar mi inscripción'}
                </button>
                {submitting && (
                  <p className="registration-submitting" role="status" aria-live="polite">
                    Se están enviando sus datos. Por favor, espera.
                  </p>
                )}
              </form>
            )}
          </div>
          )}

          {!loading && activities.length === 0 && !error && (
            <p className="page-message">Por el momento no hay actividades disponibles.</p>
          )}

          {!successMessage && (
            <p className="registration-back">
              ¿Buscas otra actividad? <Link to="/actividades">Explorar actividades</Link>
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

export default EnrollmentPage
