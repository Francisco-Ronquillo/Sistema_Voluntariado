import { useState } from "react"
import { activities } from "./activities.js"

const initialForm = {
  nombre: "",
  email: "",
  actividadId: "",
  motivacion: "",
}

function formatDate(date) {
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`))
}

function App() {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [registration, setRegistration] = useState(null)
  const selectedActivity = activities.find(
    (activity) => activity.id === form.actividadId,
  )

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError("")
    setRegistration(null)
  }

  function selectActivity(activityId) {
    setForm((current) => ({ ...current, actividadId }))
    setError("")
    setRegistration(null)
    document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" })
  }

  async function submitRegistration(event) {
    event.preventDefault()
    setError("")
    setRegistration(null)
    setSubmitting(true)

    try {
      const response = await fetch("/api/inscripciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const body = await response.json()
      if (!response.ok) {
        throw new Error(
          body.detalles?.join(" ") ??
            body.error ??
            "No fue posible guardar la inscripción.",
        )
      }
      setRegistration(body)
      setForm(initialForm)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No fue posible conectar con el servidor.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Voluntariado, inicio">
          <span className="brand-mark" aria-hidden="true">
            +
          </span>
          <span>Voluntariado</span>
        </a>
        <a className="topbar-link" href="#actividades">
          Actividades
        </a>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-content">
          <span className="eyebrow">Tu tiempo puede transformar vidas</span>
          <h1>Haz la diferencia, empieza por aquí.</h1>
          <p>
            Encuentra una jornada que te inspire y reserva tu lugar para ayudar
            a tu comunidad.
          </p>
          <a className="button button-light" href="#actividades">
            Explorar actividades <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sun" />
          <div className="art-circle art-circle-one" />
          <div className="art-circle art-circle-two" />
          <div className="art-card">
            <span className="art-heart">♥</span>
            <span>Pequeñas acciones,<br />grandes cambios</span>
          </div>
        </div>
      </section>

      <section className="activities-section" id="actividades">
        <div className="section-heading">
          <div>
            <span className="eyebrow eyebrow-dark">Próximas jornadas</span>
            <h2>Elige cómo quieres ayudar</h2>
          </div>
          <p>Hay un lugar para ti en cada iniciativa.</p>
        </div>

        <div className="activity-grid">
          {activities.map((activity) => (
            <article className="activity-card" key={activity.id}>
              <div className="activity-card-top">
                <span className="category">{activity.category}</span>
                <span className="spots">
                  {activity.spots} <span>cupos</span>
                </span>
              </div>
              <h3>{activity.name}</h3>
              <p className="activity-description">{activity.description}</p>
              <div className="activity-meta">
                <span>
                  <span aria-hidden="true">◷</span> {formatDate(activity.date)}
                </span>
                <span>
                  <span aria-hidden="true">⌖</span> {activity.place}
                </span>
              </div>
              <button
                className="button button-outline"
                onClick={() => selectActivity(activity.id)}
                type="button"
              >
                Inscribirme <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="registration-section" id="formulario">
        <div className="registration-aside">
          <span className="eyebrow eyebrow-dark">Da el siguiente paso</span>
          <h2>Tu ayuda empieza con una inscripción.</h2>
          <p>
            Completa tus datos y cuéntanos por qué quieres participar. Te
            esperamos.
          </p>
          <div className="aside-note">
            <span className="note-icon" aria-hidden="true">✓</span>
            <span>Tu inscripción se guardará para confirmar tu participación.</span>
          </div>
        </div>

        <form className="registration-form" onSubmit={submitRegistration}>
          <h3>Reserva tu lugar</h3>
          <p className="form-intro">Completa la información para inscribirte.</p>

          <label htmlFor="nombre">Nombre completo</label>
          <input
            autoComplete="name"
            id="nombre"
            maxLength={100}
            name="nombre"
            onChange={updateField}
            placeholder="Ej. Ana Martínez"
            required
            value={form.nombre}
          />

          <label htmlFor="email">Correo electrónico</label>
          <input
            autoComplete="email"
            id="email"
            maxLength={150}
            name="email"
            onChange={updateField}
            placeholder="ana@ejemplo.com"
            required
            type="email"
            value={form.email}
          />

          <label htmlFor="actividadId">Actividad</label>
          <select
            id="actividadId"
            name="actividadId"
            onChange={updateField}
            required
            value={form.actividadId}
          >
            <option value="">Selecciona una actividad</option>
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.name}
              </option>
            ))}
          </select>

          {selectedActivity && (
            <div className="selected-activity">
              <span>{selectedActivity.category}</span>
              <span>{formatDate(selectedActivity.date)} · {selectedActivity.place}</span>
            </div>
          )}

          <label htmlFor="motivacion">¿Por qué quieres participar?</label>
          <textarea
            id="motivacion"
            maxLength={300}
            minLength={20}
            name="motivacion"
            onChange={updateField}
            placeholder="Cuéntanos brevemente cómo te gustaría ayudar (20 a 300 caracteres)."
            required
            rows={4}
            value={form.motivacion}
          />
          <span className="character-count">{form.motivacion.length}/300</span>

          {error && <p className="message message-error" role="alert">{error}</p>}
          {registration && (
            <div className="message message-success" role="status">
              <strong>¡Inscripción recibida!</strong>
              <span>
                Código {registration.id}. Te esperamos en{" "}
                {registration.actividad}.
              </span>
            </div>
          )}

          <button className="button button-submit" disabled={submitting} type="submit">
            {submitting ? "Enviando..." : "Confirmar inscripción"}
            {!submitting && <span aria-hidden="true">→</span>}
          </button>
          <p className="privacy-note">Tus datos se usarán para gestionar tu inscripción.</p>
        </form>
      </section>

      <footer className="footer">
        <a className="brand brand-footer" href="#inicio">
          <span className="brand-mark" aria-hidden="true">+</span>
          <span>Voluntariado</span>
        </a>
        <span>Juntos hacemos más.</span>
      </footer>
    </main>
  )
}

export default App
