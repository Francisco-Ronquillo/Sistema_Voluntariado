import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Inicio from './pages/home'
import Footer from './components/footer'
import Navbar from './components/navbar'
function App() {
  return (
    <BrowserRouter>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Inicio />} />
      </Routes>
      <Footer/>
    </BrowserRouter>
    

  )
}

export default App
