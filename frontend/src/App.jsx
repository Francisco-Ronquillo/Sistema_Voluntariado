import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Footer from './components/footer'
import Navbar from './components/navbar'
import AuthPage from './pages/AuthPage.jsx'
import ActivitiesPage from './pages/ActivitiesPage.jsx'
import Home from './pages/home'
import InscripcionesPage from './pages/InscripcionesPage.jsx'

const SESSION_KEY = 'sumamos-session'

function readSession() {
  const savedSession = localStorage.getItem(SESSION_KEY)
  if (!savedSession) {
    return null
  }

  try {
    const session = JSON.parse(savedSession)
    if (typeof session.token === 'string' && session.usuario?.id) {
      return session
    }
  } catch {
    localStorage.removeItem(SESSION_KEY)
  }

  return null
}

function App() {
  const [session, setSession] = useState(readSession)

  function handleLogin(nextSession) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
  }

  return (
    <BrowserRouter>
      <Navbar session={session} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/actividades" element={<ActivitiesPage session={session} onLogout={handleLogout} />} />
        <Route
          path="/inscripciones"
          element={session
            ? <InscripcionesPage session={session} onLogout={handleLogout} />
            : <Navigate to="/login" replace state={{ from: '/inscripciones' }} />}
        />
        <Route path="/login" element={<AuthPage key="login" onLogin={handleLogin} />} />
        <Route path="/registro" element={<AuthPage key="registro" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}
export default App
