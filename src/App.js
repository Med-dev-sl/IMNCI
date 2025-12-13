import logo from './logo.svg'
import './App.css'
import { useEffect, useState } from 'react'
import supabase from './supabaseClient'

function App() {
  const [status, setStatus] = useState('connecting...')
  const [user, setUser] = useState(null)

  useEffect(() => {
    let mounted = true

    async function check() {
      try {
        const res = await supabase.auth.getUser()
        if (!mounted) return
        if (res?.data?.user) {
          setUser(res.data.user)
          setStatus('connected (user found)')
        } else {
          setUser(null)
          setStatus('connected (no user session)')
        }
      } catch (err) {
        console.error('Supabase check error', err)
        setStatus('error connecting')
      }
    }

    check()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Supabase status: <code>{status}</code>
        </p>
        {user ? (
          <div>
            <strong>User ID:</strong> <span>{user.id}</span>
          </div>
        ) : (
          <div>No authenticated user in session.</div>
        )}
      </header>
    </div>
  )
}

export default App
