import React, { useEffect, useState } from 'react'
import { Card, List, Skeleton } from 'antd'
import * as api from '../../api/supabaseApi'
import './Patients.css'

export default function PatientProfile({ patient }) {
  const [diagnoses, setDiagnoses] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!patient) return
      setLoading(true)
      try {
        const name = patient.first_name || ''
        const { data, error } = await api.searchDiagnosesByPatientName(name)
        if (!mounted) return
        if (error) console.error('Diagnoses fetch error:', error)
        else setDiagnoses(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [patient])

  if (!patient) return <Card className="patients-card"><p>Select a patient to view profile</p></Card>

  return (
    <Card title={`Patient Profile — ${patient.patient_id}`} className="patients-card">
      <div className="profile-grid">
        <div><strong>Name</strong><div>{patient.first_name} {patient.last_name}</div></div>
        <div><strong>DOB</strong><div>{patient.date_of_birth || '—'}</div></div>
        <div><strong>Gender</strong><div>{patient.gender || '—'}</div></div>
        <div><strong>Mother</strong><div>{patient.mother_name || '—'}</div></div>
        <div><strong>Contact</strong><div>{patient.contact_number || '—'}</div></div>
        <div><strong>Village</strong><div>{patient.village || '—'}</div></div>
      </div>

      <h4 style={{ marginTop: 16 }}>Diagnoses</h4>
      {loading ? <Skeleton active /> : (
        <List dataSource={diagnoses} renderItem={d => (
          <List.Item key={d.id} className="diagnosis-row">
            <List.Item.Meta title={`${d.diagnosis_type} — ${d.status}`} description={`${d.created_at?.split('T')?.[0]} • Confidence: ${d.confidence_score || '—'}`} />
            <div>{d.diagnosis_result}</div>
          </List.Item>
        )} />
      )}
    </Card>
  )
}
