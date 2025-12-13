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

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosis ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Superadmins can view all users" ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role = 'superadmin'
    )
  );

-- Create policies for diagnosis table
CREATE POLICY "Users can view their own diagnosis" ON public.diagnosis
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Superadmins can view all diagnosis" ON public.diagnosis
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND role = 'superadmin'
    )
  );

-- Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.diagnosis TO authenticated;
