import React, { useState, useEffect } from 'react'
import supabase from '../supabaseClient'
import * as api from '../api/supabaseApi'
import Patients from './Patients/Patients'
import 'antd/dist/antd.css'
import { Layout, Menu, Avatar, Button, Space, Tabs, Table, Tag, Popconfirm, message, Card, Form, Input, Select } from 'antd'
import { LogoutOutlined, UserOutlined, TeamOutlined, FolderOpenOutlined } from '@ant-design/icons'
import './SuperAdminDashboard.css'

const { Header, Sider, Content } = Layout

export default function SuperAdminDashboard({ user, onLogout }) {
  const [loggingOut, setLoggingOut] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [users, setUsers] = useState([])
  const [showUserForm, setShowUserForm] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'doctor' })
  const [savingUser, setSavingUser] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (!error) {
        onLogout()
        message.success('Logged out')
      } else {
        message.error('Logout failed')
      }
    } catch (err) {
      console.error('Logout error:', err)
      message.error('Unexpected logout error')
    } finally {
      setLoggingOut(false)
    }
  }

  const handleAddUser = (e) => {
    e.preventDefault()
    setSavingUser(true)
    ;(async () => {
      try {
        // Create a minimal username from name + timestamp
        const usernameBase = newUser.name.replace(/[^a-zA-Z]/g, '').toLowerCase().slice(0,8) || 'user'
        const username = `${usernameBase}_${Date.now().toString().slice(-4)}`
        const payload = {
          username,
          email: newUser.email,
          password: 'changeme',
          name: newUser.name,
          role: newUser.role,
          status: 'active',
        }
        const { data, error } = await api.createUser(payload)
        if (error) {
          console.error('Create user error:', error)
          alert('Failed to create user: ' + (error.message || JSON.stringify(error)))
        } else {
          // Refresh list
          await loadUsers()
          setNewUser({ name: '', email: '', role: 'doctor' })
          setShowUserForm(false)
        }
      } catch (err) {
        console.error(err)
        alert('Unexpected error creating user')
      } finally {
        setSavingUser(false)
      }
    })()
  }

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const { data, error } = await api.listUsers()
      if (error) {
        console.error('Error fetching users:', error)
        message.error('Failed to load users')
      } else if (data) {
        const mapped = data.map(u => ({
          key: u.id,
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          joinDate: u.created_at ? u.created_at.split('T')[0] : '',
        }))
        setUsers(mapped)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleUserStatus = (id) => {
    setUsers(
      users.map(u =>
        u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
      )
    )
  }

  const handleDeleteUser = async (id) => {
    try {
      const { data, error } = await api.updateUser(id, { status: 'deleted' })
      if (error) {
        message.error('Failed to delete user')
      } else {
        message.success('User removed')
        loadUsers()
      }
    } catch (err) { console.error(err) }
  }

  // Simple inner form component to create users
  function FormUser({ createHandler, newUser, setNewUser, saving }) {
    const [form] = Form.useForm()
    const onFinish = (values) => {
      // sync values into newUser and call createHandler
      setNewUser({ ...newUser, ...values })
      // createHandler expects event-style; adapt by calling directly
      createHandler({ preventDefault: () => {}, stopPropagation: () => {} })
      form.resetFields()
    }

    return (
      <Form layout="vertical" form={form} onFinish={onFinish} initialValues={newUser}>
        <Form.Item name="name" label="Full name" rules={[{ required: true }]}>
          <Input onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
          <Input onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
        </Form.Item>
        <Form.Item name="role" label="Role">
          <Select onChange={(val) => setNewUser({ ...newUser, role: val })}>
            <Select.Option value="doctor">Doctor</Select.Option>
            <Select.Option value="nurse">Nurse</Select.Option>
            <Select.Option value="admin">Admin</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" type="primary" loading={saving}>Add User</Button>
        </Form.Item>
      </Form>
    )
  }

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role', render: r => <Tag color={r === 'superadmin' ? 'gold' : 'blue'}>{r}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag color={s === 'active' ? 'green' : 'red'}>{s}</Tag> },
    { title: 'Join Date', dataIndex: 'joinDate', key: 'joinDate' },
    {
      title: 'Actions', key: 'actions', render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => toggleUserStatus(record.id)}>
            {record.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
          <Popconfirm title="Remove user?" onConfirm={() => handleDeleteUser(record.id)}>
            <Button danger size="small">Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]


  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalDiagnoses: 0,
    systemHealth: 100,
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={240} style={{ background: '#fff' }}>
        <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.jpg" alt="Logo" style={{ width: 48, height: 48, objectFit: 'cover' }} />
          <div>
            <div style={{ fontWeight: 700 }}>IMNCI Admin</div>
            <div style={{ fontSize: 12, color: '#666' }}>{user?.email}</div>
          </div>
        </div>
        <Menu mode="inline" selectedKeys={[activeTab]} onClick={({ key }) => setActiveTab(key)} items={[
          { key: 'overview', icon: <FolderOpenOutlined />, label: 'Overview' },
          { key: 'users', icon: <TeamOutlined />, label: 'Users' },
          { key: 'patients', icon: <FolderOpenOutlined />, label: 'Patients' },
          { key: 'analytics', icon: <UserOutlined />, label: 'Analytics' },
          { key: 'settings', icon: <UserOutlined />, label: 'Settings' },
        ]} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '8px 16px', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Space>
            <Avatar icon={<UserOutlined />} />
            <div style={{ minWidth: 160 }}>{user?.email}</div>
            <Button icon={<LogoutOutlined />} onClick={handleLogout} loading={loggingOut}>Logout</Button>
          </Space>
        </Header>
        <Content style={{ margin: 16 }}>
          <Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k)}>
            <Tabs.TabPane tab="Overview" key="overview">
              <div className="stats-grid">
                <Card style={{ marginBottom: 12 }}>
                  <h3>Total Users</h3>
                  <div style={{ fontSize: 24 }}>{stats.totalUsers}</div>
                </Card>
                <Card style={{ marginBottom: 12 }}>
                  <h3>Active Users</h3>
                  <div style={{ fontSize: 24 }}>{stats.activeUsers}</div>
                </Card>
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Users" key="users">
              <Card title="User Management" extra={<Button onClick={() => setShowUserForm(!showUserForm)}>{showUserForm ? 'Cancel' : '+ Add New User'}</Button>}>
                {showUserForm && (
                  <Card type="inner" style={{ marginBottom: 12 }}>
                    <FormUser createHandler={handleAddUser} newUser={newUser} setNewUser={setNewUser} saving={savingUser} />
                  </Card>
                )}
                <Table columns={columns} dataSource={users} loading={loadingUsers} />
              </Card>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Patients" key="patients">
              <Patients />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Analytics" key="analytics">
              <Card>Analytics coming soon</Card>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Settings" key="settings">
              <Card>Settings</Card>
            </Tabs.TabPane>
          </Tabs>
        </Content>
      </Layout>
    </Layout>
  )

}
