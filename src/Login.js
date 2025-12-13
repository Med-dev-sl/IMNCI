import React, { useState } from 'react'
import supabase from './supabaseClient'
import './Login.css'

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // For this example, we'll use the username as email (username@app.local)
      // You can modify this to fit your auth backend
      const email = `${username}@app.local`
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
      } else if (data?.user) {
        onLoginSuccess(data.user)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* Left side: Logo and branding */}
        <div className="login-left">
          <div className="login-logo-section">
            <img src="/logo.jpg" alt="Logo" className="login-logo" />
            <h1 className="login-brand-title">IMNCI Digital Diagnosis</h1>
            <p className="login-brand-subtitle">Healthcare Platform</p>
          </div>
          <div className="login-features">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <p>Fast & Reliable Diagnosis</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <p>Secure Patient Data</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <p>24/7 Support</p>
            </div>
          </div>
        </div>

        {/* Right side: Login form */}
        <div className="login-right">
          <div className="login-form-wrapper">
            <h2 className="login-form-title">Welcome Back</h2>
            <p className="login-form-subtitle">Sign in to your account</p>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  className="form-input"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? (
                  <span className="button-loader">
                    <span className="spinner"></span> Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="login-footer">
              <p>
                Don't have an account?{' '}
                <a href="#signup" className="signup-link">
                  Sign up here
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
