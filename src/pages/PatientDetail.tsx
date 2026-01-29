import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientImageUpload } from '@/components/patient/PatientImageUpload';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Phone,
  User,
  FileText,
  Stethoscope,
  AlertTriangle,
  ClipboardList,
  Plus,
  Activity,
} from 'lucide-react';
import { format, differenceInMonths, differenceInYears } from 'date-fns';
import { getColorDisplay } from '@/lib/imnci-classification';

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: cases } = useQuery({
    queryKey: ['patient-cases', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: assessments } = useQuery({
    queryKey: ['patient-assessments', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imnci_assessments')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: referrals } = useQuery({
    queryKey: ['patient-referrals', id],
    queryFn: async () => {
      if (!cases?.length) return [];
      const caseIds = cases.map((c) => c.id);
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .in('case_id', caseIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!cases?.length,
  });

  const updatePatient = useMutation({
    mutationFn: async (updates: { profile_picture_url?: string }) => {
      const { error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
    },
  });

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const years = differenceInYears(new Date(), birthDate);
    const months = differenceInMonths(new Date(), birthDate);
    if (years < 1) return `${months} months`;
    if (years < 5) return `${years} years, ${months % 12} months`;
    return `${years} years`;
  };

  const getAgeInMonths = (dob: string) => {
    return differenceInMonths(new Date(), new Date(dob));
  };

  if (loadingPatient) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse-subtle text-muted-foreground">Loading patient...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Patient not found</h2>
        <Button onClick={() => navigate('/patients')}>Back to Patients</Button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    referred: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    resolved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    discharged: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Patient Details</h1>
          <p className="text-muted-foreground font-mono text-sm">{patient.registration_number}</p>
        </div>
        <Button asChild>
          <Link to={`/cases/new?patientId=${patient.id}`}>
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </Link>
        </Button>
      </div>

      {/* Patient Info Card */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <PatientImageUpload
                patientId={patient.id}
                currentImageUrl={patient.profile_picture_url}
                patientName={`${patient.first_name} ${patient.last_name}`}
                onImageUploaded={(url) => updatePatient.mutate({ profile_picture_url: url })}
                size="lg"
              />
              <h2 className="mt-4 text-xl font-semibold">
                {patient.first_name} {patient.last_name}
              </h2>
              <p className="text-muted-foreground capitalize">{patient.gender}</p>
              
              <div className="mt-4 w-full space-y-2 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{calculateAge(patient.date_of_birth)}</span>
                  <Badge variant="outline" className="ml-auto">
                    {getAgeInMonths(patient.date_of_birth)} mo
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.guardian_name}</span>
                </div>
                {patient.guardian_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.guardian_phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {[patient.chiefdom, patient.district].filter(Boolean).join(', ') || 'N/A'}
                  </span>
                </div>
                {patient.facility_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{patient.facility_name}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <Tabs defaultValue="cases">
            <CardHeader className="pb-0">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="cases" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Cases ({cases?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="assessments" className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Assessments ({assessments?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="referrals" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Referrals ({referrals?.length || 0})
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Cases Tab */}
              <TabsContent value="cases" className="mt-0 space-y-4">
                {cases && cases.length > 0 ? (
                  cases.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-mono text-sm text-muted-foreground">
                            {caseItem.case_number}
                          </p>
                          <p className="font-medium mt-1">{caseItem.chief_complaint}</p>
                          {caseItem.classification && (
                            <Badge variant="outline" className="mt-2">
                              {caseItem.classification}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge className={statusColors[caseItem.status] || ''}>
                            {caseItem.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(caseItem.created_at), 'dd MMM yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/assessments/new?caseId=${caseItem.id}&patientId=${patient.id}`}>
                            <Stethoscope className="h-4 w-4 mr-1" />
                            Start Assessment
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No cases recorded</p>
                    <Button className="mt-3" size="sm" asChild>
                      <Link to={`/cases/new?patientId=${patient.id}`}>Create First Case</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Assessments Tab */}
              <TabsContent value="assessments" className="mt-0 space-y-4">
                {assessments && assessments.length > 0 ? (
                  assessments.map((assessment) => {
                    const colorInfo = assessment.overall_classification_color
                      ? getColorDisplay(assessment.overall_classification_color as any)
                      : null;
                    return (
                      <div
                        key={assessment.id}
                        className={`p-4 border rounded-lg ${colorInfo?.borderClass || ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{assessment.overall_classification || 'In Progress'}</p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {assessment.danger_signs_completed && (
                                <Badge variant="outline">Danger Signs ✓</Badge>
                              )}
                              {assessment.cough_breathing_completed && (
                                <Badge variant="outline">Cough/Breathing ✓</Badge>
                              )}
                              {assessment.diarrhea_completed && (
                                <Badge variant="outline">Diarrhea ✓</Badge>
                              )}
                              {assessment.fever_completed && (
                                <Badge variant="outline">Fever ✓</Badge>
                              )}
                              {assessment.nutrition_completed && (
                                <Badge variant="outline">Nutrition ✓</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {colorInfo && (
                              <Badge className={`${colorInfo.bgClass} ${colorInfo.textClass}`}>
                                {colorInfo.label}
                              </Badge>
                            )}
                            {assessment.requires_referral && (
                              <Badge variant="destructive" className="ml-2">
                                Referral Required
                              </Badge>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(assessment.created_at), 'dd MMM yyyy HH:mm')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No assessments recorded</p>
                  </div>
                )}
              </TabsContent>

              {/* Referrals Tab */}
              <TabsContent value="referrals" className="mt-0 space-y-4">
                {referrals && referrals.length > 0 ? (
                  referrals.map((referral) => (
                    <div key={referral.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-mono text-sm text-muted-foreground">
                            {referral.referral_number}
                          </p>
                          <p className="font-medium mt-1">{referral.reason}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {referral.from_facility} → {referral.to_facility}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={referral.urgency === 'emergency' ? 'destructive' : 'outline'}
                          >
                            {referral.urgency}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(referral.created_at), 'dd MMM yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No referrals recorded</p>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
