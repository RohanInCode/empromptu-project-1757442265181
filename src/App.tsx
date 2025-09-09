import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DatabaseProvider } from './contexts/DatabaseContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Pets from './pages/Pets'
import Vaccinations from './pages/Vaccinations'
import Grooming from './pages/Grooming'
import Appointments from './pages/Appointments'
import Health from './pages/Health'
import Community from './pages/Community'
import Marketplace from './pages/Marketplace'
import Profile from './pages/Profile'
import Login from './pages/Login'
import { useAuth } from './contexts/AuthContext'

function AppContent() {
  const { user } = useAuth()
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true'
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pets" element={<Pets />} />
          <Route path="/vaccinations" element={<Vaccinations />} />
          <Route path="/grooming" element={<Grooming />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/health" element={<Health />} />
          <Route path="/community" element={<Community />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <DatabaseProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </DatabaseProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
