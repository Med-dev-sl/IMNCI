import React, { useState } from 'react'
import supabase from '../supabaseClient'
import './SuperAdminDashboard.css'

export default function SuperAdminDashboard({ user, onLogout }) {
  const [loggingOut, setLoggingOut] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [users, setUsers] = useState([])
  const [showUserForm, setShowUserForm] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'doctor' })
  const [savingUser, setSavingUser] = useState(false)

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

  const handleAddUser = (e) => {
    e.preventDefault()
    setSavingUser(true)
    setTimeout(() => {
      if (newUser.name && newUser.email) {
        setUsers([
          ...users,
          {
            id: users.length + 1,
            ...newUser,
            status: 'active',
            joinDate: new Date().toISOString().split('T')[0],
          },
        ])
        setNewUser({ name: '', email: '', role: 'doctor' })
        setShowUserForm(false)
      }
      setSavingUser(false)
    }, 1000)
  }

  const toggleUserStatus = (id) => {
    setUsers(
      users.map(u =>
        u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
      )
    )
  }

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalDiagnoses: 0,
    systemHealth: 100,
  }

  return (
    <div className="superadmin-container">
      {/* Header */}
      <header className="superadmin-header">
        <div className="superadmin-header-left">
          <img src="/logo.jpg" alt="Logo" className="superadmin-logo" />
          <div className="superadmin-header-title">
            <h1>SuperAdmin Dashboard</h1>
            <p>IMNCI System Administration</p>
          </div>
        </div>
        <div className="superadmin-header-right">
          <div className="admin-info">
            <span className="admin-email">{user?.email}</span>
            <span className="admin-role">Super Administrator</span>
          </div>
          <button
            className="superadmin-logout-btn"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="superadmin-nav">
        <button
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 User Management
        </button>
        <button
          className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
        <button
          className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </nav>

      {/* Main Content */}
      <main className="superadmin-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <section className="tab-content">
            <h2>System Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>Total Users</h3>
                  <p className="stat-value">{stats.totalUsers}</p>
                  <span className="stat-change">+2 this month</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✓</div>
                <div className="stat-info">
                  <h3>Active Users</h3>
                  <p className="stat-value">{stats.activeUsers}</p>
                  <span className="stat-change">{Math.round((stats.activeUsers / stats.totalUsers) * 100)}% online</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔍</div>
                <div className="stat-info">
                  <h3>Total Diagnoses</h3>
                  <p className="stat-value">0</p>
                  <span className="stat-change">No diagnoses yet</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-info">
                  <h3>System Health</h3>
                  <p className="stat-value">{stats.systemHealth}%</p>
                  <span className="stat-change">System operational</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <section className="recent-activity">
              <h3>Recent Activity</h3>
              <div className="activity-log">
                {/* Activity items will be populated from database */}
              </div>
            </section>
          </section>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <section className="tab-content">
            <div className="users-header">
              <h2>User Management</h2>
              <button
                className="btn-primary"
                onClick={() => setShowUserForm(!showUserForm)}
              >
                {showUserForm ? 'Cancel' : '+ Add New User'}
              </button>
            </div>

            {showUserForm && (
              <form className="user-form" onSubmit={handleAddUser}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="doctor">Doctor</option>
                      <option value="nurse">Nurse</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={savingUser}>
                  {savingUser ? (
                    <span className="btn-loading">
                      <span className="btn-loading-spinner"></span>
                      Adding User...
                    </span>
                  ) : (
                    'Add User'
                  )}
                </button>
              </form>
            )}

            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Join Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td><span className={`role-badge role-${user.role}`}>{user.role}</span></td>
                      <td>
                        <span className={`status-badge status-${user.status}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>{user.joinDate}</td>
                      <td>
                        <button
                          className="btn-action"
                          onClick={() => toggleUserStatus(user.id)}
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <section className="tab-content">
            <h2>System Analytics</h2>
            <div className="analytics-grid">
              <div className="chart-container">
                <h3>User Growth</h3>
                <div className="chart-placeholder">
                  <p>📈 Chart will display user growth trends</p>
                </div>
              </div>
              <div className="chart-container">
                <h3>Diagnosis Distribution</h3>
                <div className="chart-placeholder">
                  <p>📊 Chart will show diagnosis statistics</p>
                </div>
              </div>
              <div className="chart-container">
                <h3>System Performance</h3>
                <div className="chart-placeholder">
                  <p>⚡ Chart will display performance metrics</p>
                </div>
              </div>
              <div className="chart-container">
                <h3>User Activity</h3>
                <div className="chart-placeholder">
                  <p>🔔 Chart will show activity patterns</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <section className="tab-content">
            <h2>System Settings</h2>
            <div className="settings-grid">
              <div className="settings-card">
                <h3>General Settings</h3>
                <div className="setting-item">
                  <label>System Name</label>
                  <input type="text" placeholder="Enter system name" />
                </div>
                <div className="setting-item">
                  <label>Support Email</label>
                  <input type="email" placeholder="Enter support email" />
                </div>
                <button className="btn-primary">Save Changes</button>
              </div>

              <div className="settings-card">
                <h3>Security Settings</h3>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked /> Two-Factor Authentication
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked /> Session Timeout (minutes)
                  </label>
                  <input type="number" defaultValue="30" />
                </div>
                <button className="btn-primary">Update Security</button>
              </div>

              <div className="settings-card">
                <h3>Backup Settings</h3>
                <div className="setting-item">
                  <p>No backups scheduled yet</p>
                </div>
                <div className="setting-item">
                  <label>Backup Frequency</label>
                  <select>
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
                <button className="btn-primary">Run Backup Now</button>
              </div>

              <div className="settings-card">
                <h3>Notifications</h3>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked /> Email Notifications
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked /> System Alerts
                  </label>
                </div>
                <button className="btn-primary">Update Preferences</button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
