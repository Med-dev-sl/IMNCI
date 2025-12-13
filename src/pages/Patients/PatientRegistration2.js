import React from 'react'
import { Form, Input, DatePicker, Radio, Select, Button, Card, message, InputNumber } from 'antd'
import moment from 'moment'
import * as api from '../../api/supabaseApi'
import './Patients.css'

const { Option } = Select

export default function PatientRegistration({ onCreate }) {
  const [form] = Form.useForm()

  const onFinish = async (values) => {
    try {
      // Validate DOB constraints
      const payload = { ...values }

      if (values.date_of_birth && moment(values.date_of_birth).isValid()) {
        const dob = moment(values.date_of_birth)
        // Reasonable date range: not before 2010-01-01 and not future
        const minDate = moment('2010-01-01')
        if (dob.isBefore(minDate) || dob.isAfter(moment())) {
          message.error('Date of birth must be between 2010 and today')
          return
        }
        payload.date_of_birth = dob.format('YYYY-MM-DD')
      } else {
        payload.date_of_birth = null
      }

      // If unknown DOB, ensure age_months is supplied
      if (payload.dob_mode === 'unknown' && !payload.age_months) {
        message.error('Please provide age in months when DOB is unknown')
        return
      }

      // Auto-generate patient_id if not provided
      if (!payload.patient_id) {
        const facility = payload.facility_code || 'UNK'
        const { patient_id, error } = await api.generatePatientId(facility)
        if (error) {
          console.error('ID generation error', error)
          message.error('Failed to generate patient ID')
          return
        }
        payload.patient_id = patient_id
      }

      const { data, error } = await api.createPatient(payload)
      if (error) {
        console.error('Create patient error:', error)
        message.error(error.message || 'Failed to create patient')
      } else {
        message.success(`Patient registered: ${payload.patient_id}`)
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
        <Form.Item name="facility_code" label="Facility Code" rules={[{ required: true, message: 'Facility code is required' }]}>
          <Input placeholder="e.g. BO-HC" />
        </Form.Item>

        <Form.Item name="patient_id" label="Patient ID" tooltip="Leave blank to auto-generate">
          <Input placeholder="Leave blank to auto-generate" />
        </Form.Item>

        <Form.Item label="Name" style={{ marginBottom: 0 }}>
          <Form.Item name="first_name" rules={[{ required: true, pattern: /^[A-Za-z\s-]+$/, message: 'Only letters, spaces and hyphens allowed' }]} style={{ display: 'inline-block', width: '49%', marginRight: '2%' }}>
            <Input placeholder="First name" />
          </Form.Item>
          <Form.Item name="last_name" rules={[{ pattern: /^[A-Za-z\s-]*$/, message: 'Only letters, spaces and hyphens allowed' }]} style={{ display: 'inline-block', width: '49%' }}>
            <Input placeholder="Last name" />
          </Form.Item>
        </Form.Item>

        <Form.Item label="Date of birth / Age" style={{ marginBottom: 0 }}>
          <Form.Item name="dob_mode" initialValue="exact" style={{ display: 'inline-block', width: '100%', marginBottom: 8 }}>
            <Radio.Group>
              <Radio value="exact">Exact</Radio>
              <Radio value="estimated">Estimated (±1 month)</Radio>
              <Radio value="unknown">Unknown</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item shouldUpdate={(prev, cur) => prev.dob_mode !== cur.dob_mode} style={{ marginBottom: 0 }}>
            {() => {
              const mode = form.getFieldValue('dob_mode')
              return (
                <div>
                  {mode !== 'unknown' && (
                    <Form.Item name="date_of_birth" style={{ width: '100%' }}>
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  )}

                  {mode === 'unknown' && (
                    <Form.Item name="age_months" label="Age (months)" rules={[{ required: true, type: 'number', min: 0 }]}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  )}
                </div>
              )
            }}</Form.Item>
        </Form.Item>

        <Form.Item label="Gender and Contact" style={{ marginBottom: 0 }}>
          <Form.Item name="gender" style={{ display: 'inline-block', width: '49%', marginRight: '2%' }}>
            <Select placeholder="Select gender">
              <Option value="male">Male</Option>
              <Option value="female">Female</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="contact_number" style={{ display: 'inline-block', width: '49%' }} rules={[{ pattern: /^(\+232)?\s?\d{8}$/, message: 'Sierra Leone phone number (optionally +232 followed by 8 digits)' }]}>
            <Input placeholder="Contact number (e.g. +23276xxxxxx)" />
          </Form.Item>
        </Form.Item>

        <Form.Item label="Mother's name" name="mother_name">
          <Input />
        </Form.Item>

        <Form.Item label="Father's name" name="father_name">
          <Input />
        </Form.Item>

        <Form.Item label="Village" name="village">
          <Input />
        </Form.Item>

        <Form.Item label="GPS Coordinates" name="gps_coordinates">
          <Input placeholder="lat,lon" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">Register Patient</Button>
        </Form.Item>
      </Form>
    </Card>
  )
}
