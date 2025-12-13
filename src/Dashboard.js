import React, { useState } from 'react'
import supabase from './supabaseClient'
import './Dashboard.css'

export default function Dashboard({ user, onLogout }) {
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (!error) {
        onLogout()
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <img src="/logo.jpg" alt="Logo" className="dashboard-logo" />
          <h1>IMNCI Digital Diagnosis</h1>
        </div>
        <div className="dashboard-header-right">
          <span className="user-email">{user?.email}</span>
          <button
            className="logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome to IMNCI Digital Diagnosis Platform</h2>
          <p>You are now logged in and ready to use the platform.</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">📋</div>
            <h3>Patient Records</h3>
            <p>Access and manage patient information</p>
          </div>
          <div className="dashboard-card">
            <div className="card-icon">🔍</div>
            <h3>Diagnosis</h3>
            <p>Perform digital diagnosis analysis</p>
          </div>
          <div className="dashboard-card">
            <div className="card-icon">📊</div>
            <h3>Reports</h3>
            <p>View diagnosis reports and history</p>
          </div>
          <div className="dashboard-card">
            <div className="card-icon">⚙️</div>
            <h3>Settings</h3>
            <p>Configure your account preferences</p>
          </div>
        </div>
      </div>
    </div>
  )
}
