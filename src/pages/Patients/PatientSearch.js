import React, { useState } from 'react'
import { Form, Input, Button, Card, Table, Space, message } from 'antd'
import * as api from '../../api/supabaseApi'
import './Patients.css'

export default function PatientSearch({ onSelect }) {
  const [form] = Form.useForm()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async (values) => {
    setLoading(true)
    try {
      const { data, error } = await api.searchPatientsBy(values)
      if (error) {
        message.error(error.message || 'Search failed')
      } else {
        setResults((data || []).map(r => ({ ...r, key: r.id })))
      }
    } catch (err) {
      console.error(err)
      message.error('Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { title: 'Patient ID', dataIndex: 'patient_id', key: 'patient_id' },
    { title: 'Name', key: 'name', render: (_, r) => `${r.first_name} ${r.last_name}` },
    { title: 'Village', dataIndex: 'village', key: 'village' },
    { title: 'Contact', dataIndex: 'contact_number', key: 'contact_number' },
    { title: 'Actions', key: 'actions', render: (_, record) => (
      <Space>
        <Button size="small" onClick={() => onSelect && onSelect(record)}>View</Button>
      </Space>
    ) }
  ]

  return (
    <Card title="Search Patients" className="patients-card">
      <Form form={form} layout="inline" onFinish={handleSearch} style={{ marginBottom: 12 }}>
        <Form.Item name="patient_id">
          <Input placeholder="Patient ID" />
        </Form.Item>
        <Form.Item name="first_name">
          <Input placeholder="First name" />
        </Form.Item>
        <Form.Item name="last_name">
          <Input placeholder="Last name" />
        </Form.Item>
        <Form.Item name="mother_name">
          <Input placeholder="Mother's name" />
        </Form.Item>
        <Form.Item name="contact_number">
          <Input placeholder="Contact number" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>Search</Button>
        </Form.Item>
      </Form>

      <Table dataSource={results} columns={columns} pagination={{ pageSize: 5 }} />
    </Card>
  )
}
