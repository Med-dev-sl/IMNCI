import React, { useState } from 'react'
import PatientRegistration from './PatientRegistration2'
import PatientSearch from './PatientSearch2'
import PatientProfile from './PatientProfile'
import { Row, Col } from 'antd'
import './Patients.css'

export default function Patients() {
  const [selected, setSelected] = useState(null)

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={16}>
        <Col xs={24} lg={10}>
          <PatientRegistration onCreate={(p) => setSelected(p)} />
          <div style={{ height: 16 }} />
          <PatientSearch onSelect={(p) => setSelected(p)} />
        </Col>
        <Col xs={24} lg={14}>
          <PatientProfile patient={selected} />
        </Col>
      </Row>
    </div>
  )
}
