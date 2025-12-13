import React, { useState } from 'react'
import { Form, Input, Button, Card, Table, Space, message, DatePicker, Select, InputNumber, Collapse, Tag } from 'antd'
import moment from 'moment'
import * as api from '../../api/supabaseApi'
import './Patients.css'

const { Option } = Select
const { RangePicker } = DatePicker

export default function PatientSearch({ onSelect }) {
  const [form] = Form.useForm()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [isRemote, setIsRemote] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const handleSearch = async (values) => {
    setLoading(true)
    setCurrentPage(1)
    try {
      // Convert age range (in months) to filters
      const searchCriteria = { ...values, page: 1, pageSize: 20 }

      // Handle age range filtering
      if (values.age_range && values.age_range.length === 2) {
        searchCriteria.age_min_months = values.age_range[0]
        searchCriteria.age_max_months = values.age_range[1]
      }
      delete searchCriteria.age_range

      // Handle last visit date range
      if (values.visit_date_range && values.visit_date_range.length === 2) {
        searchCriteria.last_visit_from = values.visit_date_range[0].format('YYYY-MM-DD')
        searchCriteria.last_visit_to = values.visit_date_range[1].format('YYYY-MM-DD')
      }
      delete searchCriteria.visit_date_range

      const { data, error } = await api.searchPatientsBy(searchCriteria)
      if (error) {
        message.error(error.message || 'Search failed')
        setResults([])
      } else {
        setResults((data || []).map(r => ({ ...r, key: r.id })))
        setIsRemote(true)
      }
    } catch (err) {
      console.error(err)
      message.error('Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = async (page) => {
    setCurrentPage(page)
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const searchCriteria = { ...values, page, pageSize: 20 }

      if (values.age_range && values.age_range.length === 2) {
        searchCriteria.age_min_months = values.age_range[0]
        searchCriteria.age_max_months = values.age_range[1]
      }
      delete searchCriteria.age_range

      if (values.visit_date_range && values.visit_date_range.length === 2) {
        searchCriteria.last_visit_from = values.visit_date_range[0].format('YYYY-MM-DD')
        searchCriteria.last_visit_to = values.visit_date_range[1].format('YYYY-MM-DD')
      }
      delete searchCriteria.visit_date_range

      const { data, error } = await api.searchPatientsBy(searchCriteria)
      if (error) {
        message.error(error.message || 'Failed to load page')
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
    { title: 'Patient ID', dataIndex: 'patient_id', key: 'patient_id', width: '15%' },
    {
      title: 'Name',
      key: 'name',
      width: '20%',
      render: (_, r) => `${r.first_name || ''} ${r.last_name || ''}`.trim(),
    },
    {
      title: 'DOB',
      dataIndex: 'date_of_birth',
      key: 'date_of_birth',
      width: '12%',
      render: (dob) => dob ? moment(dob).format('DD/MM/YYYY') : 'Unknown',
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      width: '10%',
    },
    {
      title: 'Mother',
      dataIndex: 'mother_name',
      key: 'mother_name',
      width: '15%',
    },
    {
      title: 'Village',
      dataIndex: 'village',
      key: 'village',
      width: '15%',
    },
    {
      title: 'Contact',
      dataIndex: 'contact_number',
      key: 'contact_number',
      width: '13%',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '10%',
      render: (_, record) => (
        <Space>
          <Button size="small" type="link" onClick={() => onSelect && onSelect(record)}>View</Button>
        </Space>
      ),
    },
  ]

  return (
    <Card title="Search Patients" className="patients-card">
      <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        {isRemote && <Tag color="blue">Searching: Remote Database</Tag>}
        {!isRemote && <Tag color="orange">Searching: Local Cache</Tag>}
      </div>

      <Collapse
        items={[
          {
            key: '1',
            label: 'Quick Search',
            children: (
              <Form form={form} layout="vertical" onFinish={handleSearch} style={{ marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12 }}>
                  <Form.Item name="patient_id" label="Patient ID" style={{ margin: 0 }}>
                    <Input placeholder="Patient ID" />
                  </Form.Item>
                  <Form.Item name="first_name" label="First Name" style={{ margin: 0 }}>
                    <Input placeholder="First name (min 3 chars)" />
                  </Form.Item>
                  <Form.Item name="last_name" label="Last Name" style={{ margin: 0 }}>
                    <Input placeholder="Last name" />
                  </Form.Item>
                  <Form.Item name="contact_number" label="Contact" style={{ margin: 0 }}>
                    <Input placeholder="Contact number" />
                  </Form.Item>
                  <Form.Item style={{ margin: 0, marginTop: 24 }}>
                    <Button type="primary" htmlType="submit" loading={loading}>Search</Button>
                  </Form.Item>
                </div>
              </Form>
            ),
          },
          {
            key: '2',
            label: 'Advanced Filters',
            children: (
              <Form form={form} layout="vertical" style={{ marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <Form.Item name="mother_name" label="Mother's Name">
                    <Input placeholder="Mother's name" />
                  </Form.Item>
                  <Form.Item name="village" label="Village">
                    <Input placeholder="Village" />
                  </Form.Item>
                  <Form.Item name="status" label="Status">
                    <Select placeholder="All statuses">
                      <Option value="">All</Option>
                      <Option value="active">Active</Option>
                      <Option value="inactive">Inactive</Option>
                    </Select>
                  </Form.Item>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Form.Item name="age_range" label="Age Range (months)">
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Form.Item name="age_min" noStyle>
                        <InputNumber min={0} placeholder="Min age (months)" style={{ width: '100%' }} />
                      </Form.Item>
                      <span>to</span>
                      <Form.Item name="age_max" noStyle>
                        <InputNumber min={0} placeholder="Max age (months)" style={{ width: '100%' }} />
                      </Form.Item>
                    </div>
                  </Form.Item>

                  <Form.Item name="visit_date_range" label="Last Visit Date Range">
                    <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </div>

                <Form.Item>
                  <Button type="primary" onClick={() => handleSearch(form.getFieldsValue())} loading={loading}>
                    Apply Filters
                  </Button>
                  <Button style={{ marginLeft: 8 }} onClick={() => { form.resetFields(); setResults([]); }}>
                    Reset
                  </Button>
                </Form.Item>
              </Form>
            ),
          },
        ]}
      />

      <div style={{ marginTop: 16 }}>
        <Table
          dataSource={results}
          columns={columns}
          pagination={{
            current: currentPage,
            pageSize: 20,
            onChange: handlePageChange,
            showSizeChanger: false,
            total: results.length,
          }}
          loading={loading}
          scroll={{ x: 1200 }}
        />
      </div>

      {results.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
          No patients found. Use the filters above to search.
        </div>
      )}
    </Card>
  )
}
