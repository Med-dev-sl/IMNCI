import './App.css'
import { useEffect, useState } from 'react'
import supabase from './supabaseClient'
import Login from './Login'
import Dashboard from './Dashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'

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
      {user ? (
        user.isSuperAdmin ? (
          <SuperAdminDashboard user={user} onLogout={() => setUser(null)} />
        ) : (
          <Dashboard user={user} onLogout={() => setUser(null)} />
        )
      ) : (
        <Login onLoginSuccess={setUser} />
      )}
    </div>
  )
}

export default App
