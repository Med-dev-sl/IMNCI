import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Wind,
  Droplets,
  Thermometer,
  Ear,
  Apple,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { differenceInMonths } from 'date-fns';
import {
  assessDangerSigns,
  assessCoughBreathing,
  assessDiarrhea,
  assessFever,
  assessEarProblem,
  assessNutrition,
  calculateOverallAssessment,
  getColorDisplay,
  ClassificationResult,
} from '@/lib/imnci-classification';

const STEPS = [
  { id: 'danger', label: 'Danger Signs', icon: AlertTriangle },
  { id: 'cough', label: 'Cough/Breathing', icon: Wind },
  { id: 'diarrhea', label: 'Diarrhea', icon: Droplets },
  { id: 'fever', label: 'Fever', icon: Thermometer },
  { id: 'ear', label: 'Ear Problem', icon: Ear },
  { id: 'nutrition', label: 'Nutrition', icon: Apple },
  { id: 'immunization', label: 'Immunization', icon: Shield },
  { id: 'summary', label: 'Summary', icon: CheckCircle },
];

export default function IMNCIAssessment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const caseId = searchParams.get('caseId');
  const patientId = searchParams.get('patientId');

  const [currentStep, setCurrentStep] = useState(0);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [classifications, setClassifications] = useState<ClassificationResult[]>([]);

  // Form state for all steps
  const [formData, setFormData] = useState({
    // Danger Signs
    notAbleToDrink: false,
    vomitsEverything: false,
    hasConvulsions: false,
    lethargicUnconscious: false,
    convulsingNow: false,
    
    // Cough/Breathing
    hasCoughDifficultyBreathing: false,
    coughDurationDays: '',
    breathsPerMinute: '',
    chestIndrawing: false,
    stridor: false,
    wheezing: false,
    
    // Diarrhea
    hasDiarrhea: false,
    diarrheaDurationDays: '',
    bloodInStool: false,
    sunkenEyes: false,
    skinPinchSlow: false,
    skinPinchVerySlow: false,
    restlessIrritable: false,
    drinksEagerly: false,
    notAbleToDrinkDiarrhea: false,
    
    // Fever
    hasFever: false,
    feverDurationDays: '',
    temperature: '',
    stiffNeck: false,
    malariaRdtResult: '',
    generalizedRash: false,
    runnyNose: false,
    mouthUlcers: false,
    pusDrainingEye: false,
    cloudingCornea: false,
    
    // Ear
    hasEarProblem: false,
    earPain: false,
    earDischarge: false,
    earDischargeDurationDays: '',
    tenderSwellingBehindEar: false,
    
    // Nutrition
    visibleSevereWasting: false,
    edemaBothFeet: false,
    weightForAge: '',
    muacMeasurement: '',
    palmarPallor: false,
    severePalmarPallor: false,
    
    // HIV
    motherHivPositive: '',
    childHivTested: false,
    childHivResult: '',
    
    // Immunization
    immunizationUpToDate: false,
    vitaminAGiven: false,
    dewormingGiven: false,
  });

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  const { data: caseData } = useQuery({
    queryKey: ['case', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });

  const ageInMonths = patient ? differenceInMonths(new Date(), new Date(patient.date_of_birth)) : 0;

  // Create or update assessment
  const saveAssessment = useMutation({
    mutationFn: async (data: any) => {
      if (assessmentId) {
        const { error } = await supabase
          .from('imnci_assessments')
          .update(data)
          .eq('id', assessmentId);
        if (error) throw error;
        return assessmentId;
      } else {
        const { data: newAssessment, error } = await supabase
          .from('imnci_assessments')
          .insert({
            case_id: caseId,
            patient_id: patientId,
            clinician_id: user?.id,
            ...data,
          })
          .select()
          .single();
        if (error) throw error;
        return newAssessment.id;
      }
    },
    onSuccess: (id) => {
      setAssessmentId(id);
      queryClient.invalidateQueries({ queryKey: ['patient-assessments', patientId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error saving assessment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const hasDangerSigns = formData.notAbleToDrink ||
    formData.vomitsEverything ||
    formData.hasConvulsions ||
    formData.lethargicUnconscious ||
    formData.convulsingNow;

  const handleNext = () => {
    // Calculate classification for current step
    let classification: ClassificationResult | null = null;
    
    switch (STEPS[currentStep].id) {
      case 'danger':
        classification = assessDangerSigns({
          notAbleToDrink: formData.notAbleToDrink,
          vomitsEverything: formData.vomitsEverything,
          hasConvulsions: formData.hasConvulsions,
          lethargicUnconscious: formData.lethargicUnconscious,
          convulsingNow: formData.convulsingNow,
        });
        break;
      case 'cough':
        classification = assessCoughBreathing({
          hasCoughDifficultyBreathing: formData.hasCoughDifficultyBreathing,
          coughDurationDays: parseInt(formData.coughDurationDays) || undefined,
          breathsPerMinute: parseInt(formData.breathsPerMinute) || undefined,
          ageInMonths,
          chestIndrawing: formData.chestIndrawing,
          stridor: formData.stridor,
          hasDangerSigns,
        });
        break;
      case 'diarrhea':
        classification = assessDiarrhea({
          hasDiarrhea: formData.hasDiarrhea,
          diarrheaDurationDays: parseInt(formData.diarrheaDurationDays) || undefined,
          bloodInStool: formData.bloodInStool,
          sunkenEyes: formData.sunkenEyes,
          skinPinchSlow: formData.skinPinchSlow,
          skinPinchVerySlow: formData.skinPinchVerySlow,
          restlessIrritable: formData.restlessIrritable,
          drinksEagerly: formData.drinksEagerly,
          notAbleToDrink: formData.notAbleToDrinkDiarrhea,
          lethargicUnconscious: formData.lethargicUnconscious,
        });
        break;
      case 'fever':
        classification = assessFever({
          hasFever: formData.hasFever,
          feverDurationDays: parseInt(formData.feverDurationDays) || undefined,
          temperature: parseFloat(formData.temperature) || undefined,
          stiffNeck: formData.stiffNeck,
          malariaRdtResult: formData.malariaRdtResult || undefined,
          generalizedRash: formData.generalizedRash,
          runnyNose: formData.runnyNose,
          mouthUlcers: formData.mouthUlcers,
          pusDrainingEye: formData.pusDrainingEye,
          cloudingCornea: formData.cloudingCornea,
          hasDangerSigns,
        });
        break;
      case 'ear':
        classification = assessEarProblem({
          hasEarProblem: formData.hasEarProblem,
          earPain: formData.earPain,
          earDischarge: formData.earDischarge,
          earDischargeDurationDays: parseInt(formData.earDischargeDurationDays) || undefined,
          tenderSwellingBehindEar: formData.tenderSwellingBehindEar,
        });
        break;
      case 'nutrition':
        classification = assessNutrition({
          visibleSevereWasting: formData.visibleSevereWasting,
          edemaBothFeet: formData.edemaBothFeet,
          weightForAge: parseFloat(formData.weightForAge) || undefined,
          muacMeasurement: parseFloat(formData.muacMeasurement) || undefined,
          palmarPallor: formData.palmarPallor,
          severePalmarPallor: formData.severePalmarPallor,
        });
        break;
    }

    if (classification) {
      setClassifications((prev) => {
        const newClassifications = [...prev];
        newClassifications[currentStep] = classification!;
        return newClassifications;
      });
    }

    // Save progress
    saveAssessment.mutate(buildAssessmentData());

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const buildAssessmentData = () => {
    return {
      danger_signs_completed: currentStep >= 0,
      not_able_to_drink: formData.notAbleToDrink,
      vomits_everything: formData.vomitsEverything,
      has_convulsions: formData.hasConvulsions,
      lethargic_unconscious: formData.lethargicUnconscious,
      convulsing_now: formData.convulsingNow,
      
      cough_breathing_completed: currentStep >= 1,
      has_cough_difficulty_breathing: formData.hasCoughDifficultyBreathing,
      cough_duration_days: parseInt(formData.coughDurationDays) || null,
      breaths_per_minute: parseInt(formData.breathsPerMinute) || null,
      chest_indrawing: formData.chestIndrawing,
      stridor: formData.stridor,
      wheezing: formData.wheezing,
      cough_classification: classifications[1]?.classification || null,
      cough_classification_color: classifications[1]?.color || null,
      
      diarrhea_completed: currentStep >= 2,
      has_diarrhea: formData.hasDiarrhea,
      diarrhea_duration_days: parseInt(formData.diarrheaDurationDays) || null,
      blood_in_stool: formData.bloodInStool,
      sunken_eyes: formData.sunkenEyes,
      skin_pinch_slow: formData.skinPinchSlow,
      skin_pinch_very_slow: formData.skinPinchVerySlow,
      restless_irritable: formData.restlessIrritable,
      drinks_eagerly: formData.drinksEagerly,
      not_able_to_drink_diarrhea: formData.notAbleToDrinkDiarrhea,
      diarrhea_classification: classifications[2]?.classification || null,
      diarrhea_classification_color: classifications[2]?.color || null,
      
      fever_completed: currentStep >= 3,
      has_fever: formData.hasFever,
      fever_duration_days: parseInt(formData.feverDurationDays) || null,
      temperature: parseFloat(formData.temperature) || null,
      stiff_neck: formData.stiffNeck,
      malaria_rdt_result: formData.malariaRdtResult || null,
      generalized_rash: formData.generalizedRash,
      runny_nose: formData.runnyNose,
      mouth_ulcers: formData.mouthUlcers,
      pus_draining_eye: formData.pusDrainingEye,
      clouding_cornea: formData.cloudingCornea,
      fever_classification: classifications[3]?.classification || null,
      fever_classification_color: classifications[3]?.color || null,
      
      ear_completed: currentStep >= 4,
      has_ear_problem: formData.hasEarProblem,
      ear_pain: formData.earPain,
      ear_discharge: formData.earDischarge,
      ear_discharge_duration_days: parseInt(formData.earDischargeDurationDays) || null,
      tender_swelling_behind_ear: formData.tenderSwellingBehindEar,
      ear_classification: classifications[4]?.classification || null,
      ear_classification_color: classifications[4]?.color || null,
      
      nutrition_completed: currentStep >= 5,
      visible_severe_wasting: formData.visibleSevereWasting,
      edema_both_feet: formData.edemaBothFeet,
      weight_for_age: parseFloat(formData.weightForAge) || null,
      muac_measurement: parseFloat(formData.muacMeasurement) || null,
      palmar_pallor: formData.palmarPallor,
      severe_palmar_pallor: formData.severePalmarPallor,
      nutrition_classification: classifications[5]?.classification || null,
      nutrition_classification_color: classifications[5]?.color || null,
      
      immunization_completed: currentStep >= 6,
      immunization_up_to_date: formData.immunizationUpToDate,
      vitamin_a_given: formData.vitaminAGiven,
      deworming_given: formData.dewormingGiven,
      
      hiv_completed: true,
      mother_hiv_positive: formData.motherHivPositive === 'yes' ? true : formData.motherHivPositive === 'no' ? false : null,
      child_hiv_tested: formData.childHivTested,
      child_hiv_result: formData.childHivResult || null,
    };
  };

  const completeAssessment = useMutation({
    mutationFn: async () => {
      const overall = calculateOverallAssessment(classifications.filter(Boolean));
      
      const finalData = {
        ...buildAssessmentData(),
        status: 'completed' as const,
        overall_classification: overall.overallClassification,
        overall_classification_color: overall.overallColor,
        requires_referral: overall.requiresReferral,
        referral_urgency: overall.referralUrgency !== 'none' ? overall.referralUrgency : null,
        treatment_recommendations: classifications
          .filter(Boolean)
          .map((c) => c.treatment)
          .filter(Boolean)
          .join('\n\n'),
      };

      const { error } = await supabase
        .from('imnci_assessments')
        .update(finalData)
        .eq('id', assessmentId);

      if (error) throw error;
      return overall;
    },
    onSuccess: (overall) => {
      queryClient.invalidateQueries({ queryKey: ['patient-assessments', patientId] });
      toast({
        title: 'Assessment Complete',
        description: overall.requiresReferral
          ? 'This child requires referral. Please initiate referral process.'
          : 'Assessment has been saved successfully.',
      });
      navigate(`/patients/${patientId}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'danger':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Ask the mother what the child's problems are. Check for general danger signs.
            </p>
            <CheckboxField
              label="Not able to drink or breastfeed"
              checked={formData.notAbleToDrink}
              onChange={(checked) => setFormData({ ...formData, notAbleToDrink: checked })}
            />
            <CheckboxField
              label="Vomits everything"
              checked={formData.vomitsEverything}
              onChange={(checked) => setFormData({ ...formData, vomitsEverything: checked })}
            />
            <CheckboxField
              label="Has had convulsions"
              checked={formData.hasConvulsions}
              onChange={(checked) => setFormData({ ...formData, hasConvulsions: checked })}
            />
            <CheckboxField
              label="Lethargic or unconscious"
              checked={formData.lethargicUnconscious}
              onChange={(checked) => setFormData({ ...formData, lethargicUnconscious: checked })}
            />
            <CheckboxField
              label="Convulsing now"
              checked={formData.convulsingNow}
              onChange={(checked) => setFormData({ ...formData, convulsingNow: checked })}
            />
            
            {hasDangerSigns && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">General Danger Signs Present</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Complete the assessment urgently and prepare for referral.
                </p>
              </div>
            )}
          </div>
        );

      case 'cough':
        return (
          <div className="space-y-4">
            <CheckboxField
              label="Does the child have cough or difficult breathing?"
              checked={formData.hasCoughDifficultyBreathing}
              onChange={(checked) => setFormData({ ...formData, hasCoughDifficultyBreathing: checked })}
            />
            
            {formData.hasCoughDifficultyBreathing && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>For how long? (days)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.coughDurationDays}
                      onChange={(e) => setFormData({ ...formData, coughDurationDays: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Breaths per minute</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.breathsPerMinute}
                      onChange={(e) => setFormData({ ...formData, breathsPerMinute: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Fast breathing: {ageInMonths < 2 ? '≥60' : ageInMonths < 12 ? '≥50' : '≥40'}/min for this age
                    </p>
                  </div>
                </div>
                <CheckboxField
                  label="Chest indrawing"
                  checked={formData.chestIndrawing}
                  onChange={(checked) => setFormData({ ...formData, chestIndrawing: checked })}
                />
                <CheckboxField
                  label="Stridor in calm child"
                  checked={formData.stridor}
                  onChange={(checked) => setFormData({ ...formData, stridor: checked })}
                />
                <CheckboxField
                  label="Wheezing"
                  checked={formData.wheezing}
                  onChange={(checked) => setFormData({ ...formData, wheezing: checked })}
                />
              </>
            )}
          </div>
        );

      case 'diarrhea':
        return (
          <div className="space-y-4">
            <CheckboxField
              label="Does the child have diarrhea?"
              checked={formData.hasDiarrhea}
              onChange={(checked) => setFormData({ ...formData, hasDiarrhea: checked })}
            />
            
            {formData.hasDiarrhea && (
              <>
                <div className="space-y-2">
                  <Label>For how long? (days)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.diarrheaDurationDays}
                    onChange={(e) => setFormData({ ...formData, diarrheaDurationDays: e.target.value })}
                  />
                </div>
                <CheckboxField
                  label="Blood in stool"
                  checked={formData.bloodInStool}
                  onChange={(checked) => setFormData({ ...formData, bloodInStool: checked })}
                />
                
                <div className="border-t pt-4 mt-4">
                  <p className="font-medium mb-3">Look and feel for signs of dehydration:</p>
                  <CheckboxField
                    label="Sunken eyes"
                    checked={formData.sunkenEyes}
                    onChange={(checked) => setFormData({ ...formData, sunkenEyes: checked })}
                  />
                  <CheckboxField
                    label="Skin pinch goes back slowly"
                    checked={formData.skinPinchSlow}
                    onChange={(checked) => setFormData({ ...formData, skinPinchSlow: checked })}
                  />
                  <CheckboxField
                    label="Skin pinch goes back very slowly (>2 seconds)"
                    checked={formData.skinPinchVerySlow}
                    onChange={(checked) => setFormData({ ...formData, skinPinchVerySlow: checked })}
                  />
                  <CheckboxField
                    label="Restless or irritable"
                    checked={formData.restlessIrritable}
                    onChange={(checked) => setFormData({ ...formData, restlessIrritable: checked })}
                  />
                  <CheckboxField
                    label="Drinks eagerly, thirsty"
                    checked={formData.drinksEagerly}
                    onChange={(checked) => setFormData({ ...formData, drinksEagerly: checked })}
                  />
                  <CheckboxField
                    label="Not able to drink or drinks poorly"
                    checked={formData.notAbleToDrinkDiarrhea}
                    onChange={(checked) => setFormData({ ...formData, notAbleToDrinkDiarrhea: checked })}
                  />
                </div>
              </>
            )}
          </div>
        );

      case 'fever':
        return (
          <div className="space-y-4">
            <CheckboxField
              label="Does the child have fever? (by history or feels hot or temp ≥37.5°C)"
              checked={formData.hasFever}
              onChange={(checked) => setFormData({ ...formData, hasFever: checked })}
            />
            
            {formData.hasFever && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>For how long? (days)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.feverDurationDays}
                      onChange={(e) => setFormData({ ...formData, feverDurationDays: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Temperature (°C)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="35"
                      max="42"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    />
                  </div>
                </div>
                
                <CheckboxField
                  label="Stiff neck"
                  checked={formData.stiffNeck}
                  onChange={(checked) => setFormData({ ...formData, stiffNeck: checked })}
                />

                <div className="space-y-2">
                  <Label>Malaria RDT Result</Label>
                  <RadioGroup
                    value={formData.malariaRdtResult}
                    onValueChange={(value) => setFormData({ ...formData, malariaRdtResult: value })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="positive" id="rdt-pos" />
                      <Label htmlFor="rdt-pos">Positive</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="negative" id="rdt-neg" />
                      <Label htmlFor="rdt-neg">Negative</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="not_done" id="rdt-nd" />
                      <Label htmlFor="rdt-nd">Not Done</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="border-t pt-4 mt-4">
                  <p className="font-medium mb-3">Look for signs of measles:</p>
                  <CheckboxField
                    label="Generalized rash"
                    checked={formData.generalizedRash}
                    onChange={(checked) => setFormData({ ...formData, generalizedRash: checked })}
                  />
                  <CheckboxField
                    label="Runny nose"
                    checked={formData.runnyNose}
                    onChange={(checked) => setFormData({ ...formData, runnyNose: checked })}
                  />
                  <CheckboxField
                    label="Mouth ulcers"
                    checked={formData.mouthUlcers}
                    onChange={(checked) => setFormData({ ...formData, mouthUlcers: checked })}
                  />
                  <CheckboxField
                    label="Pus draining from eye"
                    checked={formData.pusDrainingEye}
                    onChange={(checked) => setFormData({ ...formData, pusDrainingEye: checked })}
                  />
                  <CheckboxField
                    label="Clouding of cornea"
                    checked={formData.cloudingCornea}
                    onChange={(checked) => setFormData({ ...formData, cloudingCornea: checked })}
                  />
                </div>
              </>
            )}
          </div>
        );

      case 'ear':
        return (
          <div className="space-y-4">
            <CheckboxField
              label="Does the child have an ear problem?"
              checked={formData.hasEarProblem}
              onChange={(checked) => setFormData({ ...formData, hasEarProblem: checked })}
            />
            
            {formData.hasEarProblem && (
              <>
                <CheckboxField
                  label="Ear pain"
                  checked={formData.earPain}
                  onChange={(checked) => setFormData({ ...formData, earPain: checked })}
                />
                <CheckboxField
                  label="Ear discharge"
                  checked={formData.earDischarge}
                  onChange={(checked) => setFormData({ ...formData, earDischarge: checked })}
                />
                {formData.earDischarge && (
                  <div className="space-y-2 ml-6">
                    <Label>Ear discharge for how long? (days)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.earDischargeDurationDays}
                      onChange={(e) => setFormData({ ...formData, earDischargeDurationDays: e.target.value })}
                    />
                  </div>
                )}
                <CheckboxField
                  label="Tender swelling behind ear"
                  checked={formData.tenderSwellingBehindEar}
                  onChange={(checked) => setFormData({ ...formData, tenderSwellingBehindEar: checked })}
                />
              </>
            )}
          </div>
        );

      case 'nutrition':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Check for malnutrition and anemia in ALL sick children.
            </p>
            
            <CheckboxField
              label="Visible severe wasting"
              checked={formData.visibleSevereWasting}
              onChange={(checked) => setFormData({ ...formData, visibleSevereWasting: checked })}
            />
            <CheckboxField
              label="Edema of both feet"
              checked={formData.edemaBothFeet}
              onChange={(checked) => setFormData({ ...formData, edemaBothFeet: checked })}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Weight for age (Z-score)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.weightForAge}
                  onChange={(e) => setFormData({ ...formData, weightForAge: e.target.value })}
                  placeholder="e.g., -2.5"
                />
              </div>
              <div className="space-y-2">
                <Label>MUAC (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="30"
                  value={formData.muacMeasurement}
                  onChange={(e) => setFormData({ ...formData, muacMeasurement: e.target.value })}
                  placeholder="e.g., 12.5"
                />
                <p className="text-xs text-muted-foreground">
                  Red: &lt;11.5cm | Yellow: 11.5-12.5cm | Green: &gt;12.5cm
                </p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="font-medium mb-3">Look for palmar pallor:</p>
              <CheckboxField
                label="Some palmar pallor"
                checked={formData.palmarPallor}
                onChange={(checked) => setFormData({ ...formData, palmarPallor: checked, severePalmarPallor: checked ? formData.severePalmarPallor : false })}
              />
              <CheckboxField
                label="Severe palmar pallor"
                checked={formData.severePalmarPallor}
                onChange={(checked) => setFormData({ ...formData, severePalmarPallor: checked, palmarPallor: checked ? true : formData.palmarPallor })}
              />
            </div>
          </div>
        );

      case 'immunization':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Check immunization status and give needed vaccinations.
            </p>
            
            <CheckboxField
              label="Immunization up to date"
              checked={formData.immunizationUpToDate}
              onChange={(checked) => setFormData({ ...formData, immunizationUpToDate: checked })}
            />
            <CheckboxField
              label="Vitamin A given today"
              checked={formData.vitaminAGiven}
              onChange={(checked) => setFormData({ ...formData, vitaminAGiven: checked })}
            />
            <CheckboxField
              label="Deworming given (if ≥1 year and not given in last 6 months)"
              checked={formData.dewormingGiven}
              onChange={(checked) => setFormData({ ...formData, dewormingGiven: checked })}
            />

            <div className="border-t pt-4 mt-4">
              <p className="font-medium mb-3">HIV Assessment (if applicable):</p>
              <div className="space-y-2">
                <Label>Is the mother HIV positive?</Label>
                <RadioGroup
                  value={formData.motherHivPositive}
                  onValueChange={(value) => setFormData({ ...formData, motherHivPositive: value })}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="hiv-yes" />
                    <Label htmlFor="hiv-yes">Yes</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="hiv-no" />
                    <Label htmlFor="hiv-no">No</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="unknown" id="hiv-unk" />
                    <Label htmlFor="hiv-unk">Unknown</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        );

      case 'summary':
        const overall = calculateOverallAssessment(classifications.filter(Boolean));
        const overallColorInfo = getColorDisplay(overall.overallColor);

        return (
          <div className="space-y-6">
            {/* Overall Result */}
            <div className={`p-6 rounded-lg border-2 ${overallColorInfo.borderClass} ${overallColorInfo.bgClass}`}>
              <div className="flex items-center gap-3 mb-4">
                {overall.requiresReferral ? (
                  <AlertCircle className={`h-8 w-8 ${overallColorInfo.textClass}`} />
                ) : (
                  <CheckCircle className={`h-8 w-8 ${overallColorInfo.textClass}`} />
                )}
                <div>
                  <h3 className={`text-xl font-bold ${overallColorInfo.textClass}`}>
                    {overall.overallClassification}
                  </h3>
                  <p className="text-sm text-muted-foreground">{overallColorInfo.label}</p>
                </div>
              </div>

              {overall.requiresReferral && (
                <div className="mt-4 p-3 bg-background/80 rounded-md">
                  <p className="font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    REFERRAL REQUIRED - {overall.referralUrgency.toUpperCase()}
                  </p>
                  <ul className="mt-2 text-sm space-y-1">
                    {overall.criticalFindings.map((finding, i) => (
                      <li key={i}>• {finding}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Classification Summary */}
            <div>
              <h4 className="font-medium mb-3">Assessment Summary by Category:</h4>
              <div className="space-y-2">
                {STEPS.slice(0, -1).map((step, index) => {
                  const classification = classifications[index];
                  if (!classification) return null;
                  const colorInfo = getColorDisplay(classification.color);
                  return (
                    <div
                      key={step.id}
                      className={`p-3 rounded-md border ${colorInfo.borderClass} ${colorInfo.bgClass}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <step.icon className="h-4 w-4" />
                          <span className="font-medium">{step.label}</span>
                        </div>
                        <Badge className={`${colorInfo.bgClass} ${colorInfo.textClass} border-0`}>
                          {classification.classification}
                        </Badge>
                      </div>
                      {classification.treatment && (
                        <p className="text-sm mt-2 text-muted-foreground">
                          {classification.treatment}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!caseId || !patientId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Missing Parameters</h2>
        <p className="text-muted-foreground mb-4">Please select a patient and case first.</p>
        <Button onClick={() => navigate('/patients')}>Go to Patients</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">IMNCI Assessment</h1>
          <p className="text-muted-foreground">
            {patient?.first_name} {patient?.last_name} • {patient ? `${differenceInMonths(new Date(), new Date(patient.date_of_birth))} months` : ''}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{STEPS[currentStep].label}</span>
          <span className="text-muted-foreground">Step {currentStep + 1} of {STEPS.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between overflow-x-auto pb-2">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const classification = classifications[index];
            const colorInfo = classification ? getColorDisplay(classification.color) : null;

            return (
              <button
                key={step.id}
                onClick={() => index <= currentStep && setCurrentStep(index)}
                disabled={index > currentStep}
                className={`flex flex-col items-center gap-1 min-w-[60px] transition-colors ${
                  index > currentStep ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
                }`}
              >
                <div
                  className={`p-2 rounded-full ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted && colorInfo
                      ? `${colorInfo.bgClass} ${colorInfo.textClass}`
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <StepIcon className="h-4 w-4" />
                </div>
                <span className="text-xs hidden sm:block">{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(STEPS[currentStep].icon, { className: 'h-5 w-5' })}
            {STEPS[currentStep].label}
          </CardTitle>
          <CardDescription>
            {currentStep === STEPS.length - 1
              ? 'Review the assessment results and classification'
              : 'Complete the assessment for this section'}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentStep === STEPS.length - 1 ? (
          <Button
            onClick={() => completeAssessment.mutate()}
            disabled={completeAssessment.isPending}
          >
            {completeAssessment.isPending ? 'Saving...' : 'Complete Assessment'}
            <CheckCircle className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Helper component for checkboxes
function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
        id={label.replace(/\s+/g, '-').toLowerCase()}
      />
      <Label
        htmlFor={label.replace(/\s+/g, '-').toLowerCase()}
        className="cursor-pointer font-normal"
      >
        {label}
      </Label>
    </div>
  );
}
