import supabase from '../supabaseClient'

// --- Users
export async function findUserByUsernameAndPassword(username, password) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single()

  return { data, error }
}

export async function listUsers() {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false })
  return { data, error }
}

export async function createUser(payload) {
  // payload should be an object with username, email, password, name, role
  const { data, error } = await supabase.from('users').insert([payload])
  return { data, error }
}

export async function updateUser(id, changes) {
  const { data, error } = await supabase.from('users').update(changes).eq('id', id)
  return { data, error }
}

// --- Patients

export async function countPatientsForFacilityYear(facilityCode) {
  try {
    const yearStart = `${new Date().getFullYear()}-01-01`
    const { data, count, error } = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: false })
      .eq('facility_code', facilityCode)
      .gte('created_at', yearStart)

    if (error) {
      console.error('Count patients error:', error)
      // Fallback: use a simple sequential number if count fails
      return { count: 1, error: null }
    }
    return { count: count || 0, error: null }
  } catch (err) {
    console.error('Count patients exception:', err)
    return { count: 1, error: null }
  }
}

export async function generatePatientId(facilityCode = 'UNK') {
  try {
    const year = new Date().getFullYear()
    const { count } = await countPatientsForFacilityYear(facilityCode)
    const seq = (count || 0) + 1
    const seqStr = String(seq).padStart(4, '0')
    const patient_id = `${facilityCode}-${year}-${seqStr}`
    return { patient_id }
  } catch (err) {
    console.error('Generate patient ID error:', err)
    // Fallback ID generation with timestamp
    const ts = Date.now().toString().slice(-6)
    return { patient_id: `${facilityCode}-${ts}` }
  }
}

export async function createPatient(payload) {
  // Auto-generate patient_id if not provided
  const pl = { ...payload }
  if (!pl.patient_id) {
    const facility = pl.facility_code || 'UNK'
    const { patient_id } = await generatePatientId(facility)
    pl.patient_id = patient_id
  }

  const { data, error } = await supabase.from('patients').insert([pl])
  return { data, error }
}

export async function searchPatientsBy(criteria = {}) {
  // Supports: patient_id (exact), first_name/last_name/mother_name (fuzzy ilike), contact_number (exact),
  // age_min_months, age_max_months (integers), village, last_visit_from, last_visit_to, status
  // Pagination: page (1-based), pageSize (default 20)

  const page = criteria.page && criteria.page > 0 ? criteria.page : 1
  const pageSize = criteria.pageSize || 20
  const from = (page - 1) * pageSize
  const to = page * pageSize - 1

  let query = supabase.from('patients').select('*')

  if (criteria.patient_id) query = query.eq('patient_id', criteria.patient_id)
  if (criteria.first_name && criteria.first_name.length >= 3) query = query.ilike('first_name', `%${criteria.first_name}%`)
  if (criteria.last_name && criteria.last_name.length >= 1) query = query.ilike('last_name', `%${criteria.last_name}%`)
  if (criteria.mother_name && criteria.mother_name.length >= 1) query = query.ilike('mother_name', `%${criteria.mother_name}%`)
  if (criteria.contact_number) query = query.eq('contact_number', criteria.contact_number)
  if (criteria.village) query = query.ilike('village', `%${criteria.village}%`)
  if (criteria.status) query = query.eq('status', criteria.status)

  if (criteria.last_visit_from) query = query.gte('last_visit_date', criteria.last_visit_from)
  if (criteria.last_visit_to) query = query.lte('last_visit_date', criteria.last_visit_to)

  // Age range filtering: convert months to date_of_birth range
  if (criteria.age_min_months || criteria.age_max_months) {
    const now = new Date()
    if (criteria.age_max_months) {
      const maxDate = new Date(now.getFullYear(), now.getMonth() - criteria.age_max_months, now.getDate())
      // date_of_birth <= maxDate
      query = query.lte('date_of_birth', maxDate.toISOString().slice(0, 10))
    }
    if (criteria.age_min_months) {
      const minDate = new Date(now.getFullYear(), now.getMonth() - criteria.age_min_months, now.getDate())
      // date_of_birth >= minDate
      query = query.gte('date_of_birth', minDate.toISOString().slice(0, 10))
    }
  }

  const { data, error } = await query.range(from, to).order('created_at', { ascending: false })
  return { data, error }
}

// --- Diagnosis
export async function createDiagnosis(payload) {
  const { data, error } = await supabase.from('diagnosis').insert([payload])
  return { data, error }
}

export async function listDiagnosesForUser(user_id) {
  const { data, error } = await supabase.from('diagnosis').select('*').eq('user_id', user_id).order('created_at', { ascending: false })
  return { data, error }
}

export async function searchDiagnosesByPatientName(name) {
  const { data, error } = await supabase
    .from('diagnosis')
    .select('*')
    .ilike('patient_name', `%${name}%`)
    .order('created_at', { ascending: false })
  return { data, error }
}

export default {
  findUserByUsernameAndPassword,
  listUsers,
  createUser,
  updateUser,
  countPatientsForFacilityYear,
  generatePatientId,
  createPatient,
  searchPatientsBy,
  createDiagnosis,
  listDiagnosesForUser,
  searchDiagnosesByPatientName,
}
