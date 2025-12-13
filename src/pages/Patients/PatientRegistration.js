import React from 'react'
import { Form, Input, DatePicker, Checkbox, Select, Button, Card, message } from 'antd'
import moment from 'moment'
import * as api from '../../api/supabaseApi'
import './Patients.css'

const { Option } = Select

export default function PatientRegistration({ onCreate }) {
  const [form] = Form.useForm()

  const onFinish = async (values) => {
    try {
      const payload = {
        ...values,
        date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : null,
      }
      const { data, error } = await api.createPatient(payload)
      if (error) {
        console.error('Create patient error:', error)
        message.error(error.message || 'Failed to create patient')
      } else {
        message.success('Patient registered')
        form.resetFields()
        if (onCreate) onCreate(data?.[0] || null)
      }
    } catch (err) {
      console.error(err)
      message.error('Unexpected error')
    }
  }

  return (
    <Card title="Register New Patient" className="patients-card">
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Form.Item name="patient_id" label="Patient ID" rules={[{ required: true }]}> 
          <Input />
        </Form.Item>

        <Form.Item label="Name" style={{ marginBottom: 0 }}>
          <Form.Item name="first_name" rules={[{ required: true }]} style={{ display: 'inline-block', width: '49%', marginRight: '2%' }}>
            <Input placeholder="First name" />
          </Form.Item>
          <Form.Item name="last_name" style={{ display: 'inline-block', width: '49%' }}>
            <Input placeholder="Last name" />
          </Form.Item>
        </Form.Item>

        <Form.Item label="Date of birth">
          <Form.Item name="date_of_birth" style={{ display: 'inline-block', width: '49%', marginRight: '2%' }}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="dob_estimated" valuePropName="checked" style={{ display: 'inline-block', width: '49%' }}>
            <Checkbox>Estimated DOB</Checkbox>
          </Form.Item>
        </Form.Item>

        <Form.Item label="Gender and Contact" style={{ marginBottom: 0 }}>
          <Form.Item name="gender" style={{ display: 'inline-block', width: '49%', marginRight: '2%' }}>
            <Select placeholder="Select gender">
              <Option value="male">Male</Option>
              <Option value="female">Female</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="contact_number" style={{ display: 'inline-block', width: '49%' }}>
            <Input placeholder="Contact number" />
          </Form.Item>
        </Form.Item>

        <Form.Item label="Mother's name" name="mother_name">
          <Input />
        </Form.Item>

        <Form.Item label="Village" name="village">
          <Input />
        </Form.Item>

        <Form.Item label="GPS Coordinates" name="gps_coordinates">
          <Input />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">Register Patient</Button>
        </Form.Item>
      </Form>
    </Card>
  )
}
