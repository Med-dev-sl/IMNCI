import './App.css'
import { useEffect, useState } from 'react'
import supabase from './supabaseClient'
import Login from './Login'
import Dashboard from './Dashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Check if user is already logged in
    async function checkUser() {
      try {
        const { data } = await supabase.auth.getSession()
        if (mounted) {
          setUser(data?.session?.user || null)
          setLoading(false)
        }
      } catch (err) {
        console.error('Session check error:', err)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkUser()

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          setUser(session?.user || null)
        }
      }
    )

    return () => {
      mounted = false
      authListener?.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="App">
      <BrowserRouter>
        {!user ? (
          <Routes>
            <Route path="/*" element={<Login onLoginSuccess={setUser} />} />
          </Routes>
        ) : user.isSuperAdmin ? (
          <Routes>
            <Route path="/admin/*" element={<SuperAdminDashboard user={user} onLogout={() => setUser(null)} />} />
            <Route path="/" element={<Navigate to="/admin" replace />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/dashboard" element={<Dashboard user={user} onLogout={() => setUser(null)} />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        )}
      </BrowserRouter>
    </div>
  )
}

export default App
