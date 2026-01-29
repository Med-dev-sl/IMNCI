-- Create medications catalog table
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  generic_name TEXT,
  unit TEXT NOT NULL DEFAULT 'tablets',
  category TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory table for stock tracking
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  batch_number TEXT,
  expiry_date DATE,
  facility_name TEXT,
  reorder_level INTEGER DEFAULT 10,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dispensing records table
CREATE TABLE public.dispensing_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id),
  patient_id UUID REFERENCES public.patients(id),
  inventory_id UUID NOT NULL REFERENCES public.inventory(id),
  quantity_dispensed INTEGER NOT NULL,
  dispensed_by UUID NOT NULL,
  notes TEXT,
  dispensed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispensing_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medications (read by all authenticated, write by pharmacy/admin)
CREATE POLICY "Authenticated users can view medications"
ON public.medications FOR SELECT
USING (true);

CREATE POLICY "Pharmacy and admin can manage medications"
ON public.medications FOR ALL
USING (has_role(auth.uid(), 'pharmacy') OR has_role(auth.uid(), 'admin'));

-- RLS Policies for inventory
CREATE POLICY "Authenticated users can view inventory"
ON public.inventory FOR SELECT
USING (true);

CREATE POLICY "Pharmacy and admin can manage inventory"
ON public.inventory FOR ALL
USING (has_role(auth.uid(), 'pharmacy') OR has_role(auth.uid(), 'admin'));

-- RLS Policies for dispensing records
CREATE POLICY "Authenticated users can view dispensing records"
ON public.dispensing_records FOR SELECT
USING (true);

CREATE POLICY "Pharmacy can create dispensing records"
ON public.dispensing_records FOR INSERT
WITH CHECK (has_role(auth.uid(), 'pharmacy') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Pharmacy can manage own dispensing records"
ON public.dispensing_records FOR ALL
USING (dispensed_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_medications_updated_at
BEFORE UPDATE ON public.medications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
BEFORE UPDATE ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert common IMNCI medications
INSERT INTO public.medications (name, generic_name, unit, category) VALUES
('Amoxicillin 250mg', 'Amoxicillin', 'capsules', 'Antibiotic'),
('Amoxicillin 125mg/5ml Suspension', 'Amoxicillin', 'bottles', 'Antibiotic'),
('Cotrimoxazole 480mg', 'Sulfamethoxazole/Trimethoprim', 'tablets', 'Antibiotic'),
('Cotrimoxazole Suspension', 'Sulfamethoxazole/Trimethoprim', 'bottles', 'Antibiotic'),
('Paracetamol 500mg', 'Paracetamol', 'tablets', 'Analgesic'),
('Paracetamol 120mg/5ml Syrup', 'Paracetamol', 'bottles', 'Analgesic'),
('ORS Sachets', 'Oral Rehydration Salts', 'sachets', 'Rehydration'),
('Zinc 20mg Dispersible', 'Zinc Sulfate', 'tablets', 'Supplement'),
('Artemether-Lumefantrine 20/120mg', 'Artemether-Lumefantrine', 'tablets', 'Antimalarial'),
('Artesunate 60mg Injection', 'Artesunate', 'vials', 'Antimalarial'),
('Vitamin A 100,000 IU', 'Retinol', 'capsules', 'Supplement'),
('Vitamin A 200,000 IU', 'Retinol', 'capsules', 'Supplement'),
('Gentamicin Injection 40mg/ml', 'Gentamicin', 'vials', 'Antibiotic'),
('Ampicillin 500mg Injection', 'Ampicillin', 'vials', 'Antibiotic'),
('Chloramphenicol Eye Drops', 'Chloramphenicol', 'bottles', 'Antibiotic'),
('Tetracycline Eye Ointment', 'Tetracycline', 'tubes', 'Antibiotic'),
('Mebendazole 500mg', 'Mebendazole', 'tablets', 'Anthelmintic'),
('Albendazole 400mg', 'Albendazole', 'tablets', 'Anthelmintic'),
('Iron Syrup', 'Ferrous Sulfate', 'bottles', 'Supplement'),
('Folic Acid 5mg', 'Folic Acid', 'tablets', 'Supplement');