import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Stethoscope, Search } from 'lucide-react';
import { z } from 'zod';

const caseSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  chiefComplaint: z.string().min(10, 'Chief complaint is required'),
  classification: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
  medications: z.string().optional(),
  notes: z.string().optional(),
});

export default function CaseForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [patientSearch, setPatientSearch] = useState('');

  const [formData, setFormData] = useState({
    patientId: searchParams.get('patientId') || '',
    chiefComplaint: '',
    classification: '',
    diagnosis: '',
    treatmentPlan: '',
    medications: '',
    notes: '',
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: async () => {
      let query = supabase
        .from('patients')
        .select('id, first_name, last_name, registration_number')
        .order('created_at', { ascending: false })
        .limit(20);

      if (patientSearch) {
        query = query.or(
          `first_name.ilike.%${patientSearch}%,last_name.ilike.%${patientSearch}%,registration_number.ilike.%${patientSearch}%`
        );
      }

      const { data } = await query;
      return data || [];
    },
  });

  const generateCaseNumber = () => {
    const prefix = 'CASE';
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${date}-${random}`;
  };

  const createCase = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: newCase, error } = await supabase
        .from('cases')
        .insert({
          case_number: generateCaseNumber(),
          patient_id: data.patientId,
          clinician_id: user?.id,
          chief_complaint: data.chiefComplaint,
          classification: data.classification || null,
          diagnosis: data.diagnosis || null,
          treatment_plan: data.treatmentPlan || null,
          medications: data.medications || null,
          notes: data.notes || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return newCase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast({
        title: 'Case Created',
        description: 'The case has been successfully created.',
      });
      navigate('/cases');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = caseSchema.safeParse(formData);
    if (!validation.success) {
      toast({
        title: 'Validation Error',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    createCase.mutate(formData);
  };

  const imnciClassifications = [
    'Pink - No Danger Signs',
    'Yellow - Some Danger Signs',
    'Red - Severe Classification',
    'Pneumonia',
    'Severe Pneumonia',
    'Diarrhea - No Dehydration',
    'Diarrhea - Some Dehydration',
    'Diarrhea - Severe Dehydration',
    'Malaria - Uncomplicated',
    'Malaria - Severe',
    'Measles',
    'Malnutrition - Moderate',
    'Malnutrition - Severe',
    'Ear Infection',
    'Other',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create New Case</h1>
          <p className="text-muted-foreground">Record IMNCI case details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Patient Selection */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Select Patient
              </CardTitle>
              <CardDescription>Choose the patient for this case</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients by name or registration number..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={formData.patientId}
                  onValueChange={(value) => setFormData({ ...formData, patientId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {patients?.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} ({patient.registration_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Clinical Assessment
              </CardTitle>
              <CardDescription>IMNCI assessment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chiefComplaint">Chief Complaint *</Label>
                <Textarea
                  id="chiefComplaint"
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                  placeholder="Describe the main symptoms and concerns..."
                  rows={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="classification">IMNCI Classification</Label>
                <Select
                  value={formData.classification}
                  onValueChange={(value) => setFormData({ ...formData, classification: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {imnciClassifications.map((classification) => (
                      <SelectItem key={classification} value={classification}>
                        {classification}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  placeholder="Clinical diagnosis..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Treatment Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Treatment Plan</CardTitle>
              <CardDescription>Prescribed treatment and medications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="treatmentPlan">Treatment Plan</Label>
                <Textarea
                  id="treatmentPlan"
                  value={formData.treatmentPlan}
                  onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                  placeholder="Describe the treatment plan..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medications">Medications</Label>
                <Textarea
                  id="medications"
                  value={formData.medications}
                  onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                  placeholder="List prescribed medications with dosages..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional observations or follow-up instructions..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={createCase.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {createCase.isPending ? 'Creating...' : 'Create Case'}
          </Button>
        </div>
      </form>
    </div>
  );
}
