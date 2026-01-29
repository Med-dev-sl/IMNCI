-- Add profile_picture_url and facility_id to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS facility_name TEXT;

-- Create storage bucket for patient photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-photos', 'patient-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for patient photos
CREATE POLICY "Authenticated users can upload patient photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patient-photos');

CREATE POLICY "Authenticated users can view patient photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'patient-photos');

CREATE POLICY "Authenticated users can update patient photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'patient-photos');

CREATE POLICY "Authenticated users can delete patient photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'patient-photos');

-- Create IMNCI assessment status enum
CREATE TYPE public.assessment_status AS ENUM ('in_progress', 'completed');

-- Create IMNCI classification color enum (for referral prediction)
CREATE TYPE public.classification_color AS ENUM ('green', 'yellow', 'pink', 'red');

-- Create comprehensive IMNCI assessments table
CREATE TABLE public.imnci_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL,
  status assessment_status NOT NULL DEFAULT 'in_progress',
  
  -- Step 1: General Danger Signs
  danger_signs_completed BOOLEAN DEFAULT false,
  not_able_to_drink BOOLEAN DEFAULT false,
  vomits_everything BOOLEAN DEFAULT false,
  has_convulsions BOOLEAN DEFAULT false,
  lethargic_unconscious BOOLEAN DEFAULT false,
  convulsing_now BOOLEAN DEFAULT false,
  
  -- Step 2: Cough/Breathing Assessment
  cough_breathing_completed BOOLEAN DEFAULT false,
  has_cough_difficulty_breathing BOOLEAN DEFAULT false,
  cough_duration_days INTEGER,
  breaths_per_minute INTEGER,
  chest_indrawing BOOLEAN DEFAULT false,
  stridor BOOLEAN DEFAULT false,
  wheezing BOOLEAN DEFAULT false,
  cough_classification TEXT,
  cough_classification_color classification_color,
  
  -- Step 3: Diarrhea Assessment
  diarrhea_completed BOOLEAN DEFAULT false,
  has_diarrhea BOOLEAN DEFAULT false,
  diarrhea_duration_days INTEGER,
  blood_in_stool BOOLEAN DEFAULT false,
  sunken_eyes BOOLEAN DEFAULT false,
  skin_pinch_slow BOOLEAN DEFAULT false,
  skin_pinch_very_slow BOOLEAN DEFAULT false,
  restless_irritable BOOLEAN DEFAULT false,
  drinks_eagerly BOOLEAN DEFAULT false,
  not_able_to_drink_diarrhea BOOLEAN DEFAULT false,
  diarrhea_classification TEXT,
  diarrhea_classification_color classification_color,
  
  -- Step 4: Fever Assessment
  fever_completed BOOLEAN DEFAULT false,
  has_fever BOOLEAN DEFAULT false,
  fever_duration_days INTEGER,
  temperature DECIMAL(4,1),
  stiff_neck BOOLEAN DEFAULT false,
  malaria_rdt_result TEXT,
  measles_last_3_months BOOLEAN DEFAULT false,
  runny_nose BOOLEAN DEFAULT false,
  generalized_rash BOOLEAN DEFAULT false,
  mouth_ulcers BOOLEAN DEFAULT false,
  pus_draining_eye BOOLEAN DEFAULT false,
  clouding_cornea BOOLEAN DEFAULT false,
  fever_classification TEXT,
  fever_classification_color classification_color,
  
  -- Step 5: Ear Problem Assessment
  ear_completed BOOLEAN DEFAULT false,
  has_ear_problem BOOLEAN DEFAULT false,
  ear_pain BOOLEAN DEFAULT false,
  ear_discharge BOOLEAN DEFAULT false,
  ear_discharge_duration_days INTEGER,
  tender_swelling_behind_ear BOOLEAN DEFAULT false,
  ear_classification TEXT,
  ear_classification_color classification_color,
  
  -- Step 6: Nutrition Assessment
  nutrition_completed BOOLEAN DEFAULT false,
  visible_severe_wasting BOOLEAN DEFAULT false,
  edema_both_feet BOOLEAN DEFAULT false,
  weight_for_age DECIMAL(4,2),
  muac_measurement DECIMAL(4,1),
  palmar_pallor BOOLEAN DEFAULT false,
  severe_palmar_pallor BOOLEAN DEFAULT false,
  nutrition_classification TEXT,
  nutrition_classification_color classification_color,
  
  -- Step 7: HIV Assessment (if applicable)
  hiv_completed BOOLEAN DEFAULT false,
  mother_hiv_positive BOOLEAN,
  child_hiv_tested BOOLEAN,
  child_hiv_result TEXT,
  
  -- Step 8: Immunization & Vitamin A
  immunization_completed BOOLEAN DEFAULT false,
  immunization_up_to_date BOOLEAN DEFAULT false,
  vitamin_a_given BOOLEAN DEFAULT false,
  deworming_given BOOLEAN DEFAULT false,
  
  -- Overall Assessment Result
  overall_classification TEXT,
  overall_classification_color classification_color,
  requires_referral BOOLEAN DEFAULT false,
  referral_urgency TEXT,
  treatment_recommendations TEXT,
  follow_up_instructions TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.imnci_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assessments
CREATE POLICY "Authenticated users can view assessments"
ON public.imnci_assessments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Clinicians can create assessments"
ON public.imnci_assessments FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'clinician') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Clinicians can manage their assessments"
ON public.imnci_assessments FOR ALL
TO authenticated
USING (clinician_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_imnci_assessments_updated_at
BEFORE UPDATE ON public.imnci_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();