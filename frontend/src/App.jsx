import { useState } from 'react'
import { BrowserRouter, Routes, Route,Navigate } from "react-router-dom";
import Inicio from './pages/home'
import Footer from './components/footer'
import Navbar from './components/navbar'
import AuthPage from './pages/AuthPage.jsx'
function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<AuthPage key="login" />} />
        <Route path="/registro" element={<AuthPage key="registro" />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}
export default App
