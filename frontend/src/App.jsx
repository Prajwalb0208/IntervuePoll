import React, { useEffect } from 'react'
import './App.css'
import LandingPage from './pages/LandingPage/LandingPage'
import KickOut from './pages/KickOut/KickOut'
import StartingS from './pages/StartingS/StartingS'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import StartingT from './pages/StartingT/StartingT'
import PollHistory from './pages/PollHistory/PollHistory'

function AutoConnect() {
  useEffect(() => {
    // no-op placeholder for future global socket init
  }, [])
  return null
}

const App = () => {
  return (
    <BrowserRouter>
      <AutoConnect />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/student" element={<StartingS />} />
        <Route path="/teacher" element={<StartingT />} />
        <Route path="/history" element={<PollHistory />} />
        <Route path="/kicked" element={<KickOut />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App