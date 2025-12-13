-- Supabase Database Setup for IMNCI Digital Diagnosis Platform
-- This script creates the users table for authentication and user management

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(20) DEFAULT 'active',
  join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional metadata JSONB column for extensible user attributes
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Create diagnosis records table
CREATE TABLE IF NOT EXISTS public.diagnosis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  patient_name VARCHAR(255),
  diagnosis_type VARCHAR(100),
  symptoms TEXT,
  diagnosis_result TEXT,
  confidence_score FLOAT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for diagnosis lookups
CREATE INDEX IF NOT EXISTS idx_diagnosis_user_id ON public.diagnosis(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_created_at ON public.diagnosis(created_at);

-- Patients table (core patient management per README)
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255),
  date_of_birth DATE,
  -- dob_mode: 'exact' | 'estimated' | 'unknown'
  dob_mode VARCHAR(20) DEFAULT 'exact',
  dob_estimated BOOLEAN DEFAULT FALSE,
  gender VARCHAR(20),
  mother_name VARCHAR(255),
  father_name VARCHAR(255),
  contact_number VARCHAR(50),
  village VARCHAR(255),
  facility_code VARCHAR(50),
  age_months INT,
  last_visit_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  gps_coordinates VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON public.patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_last_name ON public.patients(last_name);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
-- Ensure policies are not duplicated: drop if they already exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Superadmins can view all users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;
DROP POLICY IF EXISTS "Allow all users access" ON public.users;

-- Temporarily allow all access (note: use Supabase Auth for production)
CREATE POLICY "Allow all users access" ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policies for diagnosis table
-- Ensure diagnosis policies are not duplicated
DROP POLICY IF EXISTS "Users can view their own diagnosis" ON public.diagnosis;
DROP POLICY IF EXISTS "Authenticated users can view all diagnosis" ON public.diagnosis;
DROP POLICY IF EXISTS "Allow all diagnosis access" ON public.diagnosis;

-- Temporarily allow all access (note: use Supabase Auth for production)
CREATE POLICY "Allow all diagnosis access" ON public.diagnosis
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policies for patients table
DROP POLICY IF EXISTS "Users can view patients in their facility" ON public.patients;
DROP POLICY IF EXISTS "Superadmins can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Allow all patients access" ON public.patients;

-- Temporarily allow all access (note: use Supabase Auth for production)
CREATE POLICY "Allow all patients access" ON public.patients
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.diagnosis TO authenticated;
GRANT ALL ON public.patients TO authenticated;
