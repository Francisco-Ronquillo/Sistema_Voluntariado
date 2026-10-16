import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Footer from './components/footer'
import Navbar from './components/navbar'
import ActivitiesPage from './pages/ActivitiesPage.jsx'
import EnrollmentPage from './pages/EnrollmentPage.jsx'
import Home from './pages/home'
import CommunityPage from './pages/CommunityPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/actividades" element={<ActivitiesPage />} />
        <Route path="/registro" element={<EnrollmentPage />} />
        <Route path="/lista" element={<CommunityPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}
export default App
