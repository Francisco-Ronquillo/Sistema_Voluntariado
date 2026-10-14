import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import '../css/AuthPage.css'

const initialForm = { nombre: '', email: '', contrasena: '', confirmarContrasena: '' }

function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isRegistration = location.pathname === '/registro'
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(location.state?.message ?? '')

  function handleChange(event) {
    setForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }))
    setError('')
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (isRegistration && form.contrasena !== form.confirmarContrasena) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/auth/${isRegistration ? 'registro' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          contrasena: form.contrasena,
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'No se pudo completar la solicitud.')
      }

      if (isRegistration) {
        navigate('/login', {
          replace: true,
          state: { message: 'Tu cuenta se creó correctamente. Ya puedes iniciar sesión.' },
        })
      } else {
        setMessage(`Inicio de sesión exitoso. ¡Hola, ${result.usuario.nombre}!`)
        setForm(initialForm)
      }
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? 'No se pudo conectar con el servidor. Verifica que el backend esté iniciado.'
          : requestError.message,
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-aside" aria-label="Presentación">
        <Link className="brand" to="/login" aria-label="Voluntariado, ir al inicio de sesión">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span>Voluntariado</span>
        </Link>
        <div className="aside-copy">
          <span className="eyebrow">Pequeñas acciones, grandes cambios</span>
          <h1>Tu tiempo puede cambiar una vida.</h1>
          <p>
            Conecta con oportunidades para ayudar y forma parte de una comunidad
            que transforma su entorno.
          </p>
        </div>
        <div className="aside-decoration" aria-hidden="true">
          <span className="decoration-circle decoration-circle-one" />
          <span className="decoration-circle decoration-circle-two" />
          <span className="decoration-heart">+</span>
        </div>
        <p className="aside-footer">Una comunidad que crece cuando ayudamos.</p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="mobile-brand">
            <span className="brand-mark" aria-hidden="true">V</span>
            <span>Voluntariado</span>
          </div>
          <span className="eyebrow auth-eyebrow">
            {isRegistration ? 'Empieza hoy' : 'Qué bueno verte de nuevo'}
          </span>
          <h2>{isRegistration ? 'Crea tu cuenta' : 'Inicia sesión'}</h2>
          <p className="auth-description">
            {isRegistration
              ? 'Regístrate para conectar con oportunidades de voluntariado.'
              : 'Ingresa tus datos para continuar con tu labor voluntaria.'}
          </p>

          {message && <p className="form-message success-message" role="status">{message}</p>}
          {error && <p className="form-message error-message" role="alert">{error}</p>}

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegistration && (
              <label className="form-field">
                <span>Nombre completo</span>
                <input
                  autoComplete="name"
                  maxLength={80}
                  minLength={2}
                  name="nombre"
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  required
                  value={form.nombre}
                />
              </label>
            )}

            <label className="form-field">
              <span>Correo electrónico</span>
              <input
                autoComplete="email"
                maxLength={254}
                name="email"
                onChange={handleChange}
                placeholder="nombre@correo.com"
                required
                type="email"
                value={form.email}
              />
            </label>

            <label className="form-field">
              <span>Contraseña</span>
              <input
                autoComplete={isRegistration ? 'new-password' : 'current-password'}
                maxLength={128}
                minLength={8}
                name="contrasena"
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                required
                type="password"
                value={form.contrasena}
              />
            </label>

            {isRegistration && (
              <label className="form-field">
                <span>Confirma tu contraseña</span>
                <input
                  autoComplete="new-password"
                  maxLength={128}
                  minLength={8}
                  name="confirmarContrasena"
                  onChange={handleChange}
                  placeholder="Escribe de nuevo tu contraseña"
                  required
                  type="password"
                  value={form.confirmarContrasena}
                />
              </label>
            )}

            <button className="submit-button" disabled={loading} type="submit">
              {loading
                ? 'Un momento...'
                : isRegistration
                  ? 'Crear cuenta'
                  : 'Iniciar sesión'}
            </button>
          </form>

          <p className="auth-switch">
            {isRegistration ? '¿Ya tienes una cuenta?' : '¿Aún no tienes una cuenta?'}{' '}
            <Link to={isRegistration ? '/login' : '/registro'}>
              {isRegistration ? 'Inicia sesión' : 'Regístrate'}
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}

export default AuthPage
