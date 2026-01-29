// IMNCI Classification Logic and Referral Prediction

export type ClassificationColor = 'green' | 'yellow' | 'pink' | 'red';

export interface ClassificationResult {
  classification: string;
  color: ClassificationColor;
  requiresReferral: boolean;
  urgency?: 'routine' | 'urgent' | 'emergency';
  treatment?: string;
}

// Check for general danger signs
export function assessDangerSigns(data: {
  notAbleToDrink: boolean;
  vomitsEverything: boolean;
  hasConvulsions: boolean;
  lethargicUnconscious: boolean;
  convulsingNow: boolean;
}): ClassificationResult {
  const hasDangerSign = 
    data.notAbleToDrink ||
    data.vomitsEverything ||
    data.hasConvulsions ||
    data.lethargicUnconscious ||
    data.convulsingNow;

  if (hasDangerSign) {
    return {
      classification: 'General Danger Signs Present',
      color: 'red',
      requiresReferral: true,
      urgency: 'emergency',
      treatment: 'Give first dose of appropriate antibiotic. Refer URGENTLY to hospital.',
    };
  }

  return {
    classification: 'No General Danger Signs',
    color: 'green',
    requiresReferral: false,
  };
}

// Assess cough and breathing problems
export function assessCoughBreathing(data: {
  hasCoughDifficultyBreathing: boolean;
  coughDurationDays?: number;
  breathsPerMinute?: number;
  ageInMonths: number;
  chestIndrawing: boolean;
  stridor: boolean;
  hasDangerSigns: boolean;
}): ClassificationResult {
  if (!data.hasCoughDifficultyBreathing) {
    return {
      classification: 'No Cough or Breathing Problem',
      color: 'green',
      requiresReferral: false,
    };
  }

  // Determine fast breathing threshold based on age
  const fastBreathingThreshold = data.ageInMonths < 2 ? 60 : data.ageInMonths < 12 ? 50 : 40;
  const hasFastBreathing = (data.breathsPerMinute || 0) >= fastBreathingThreshold;

  // Severe Pneumonia or Very Severe Disease
  if (data.hasDangerSigns || data.stridor || data.chestIndrawing) {
    return {
      classification: 'Severe Pneumonia or Very Severe Disease',
      color: 'red',
      requiresReferral: true,
      urgency: 'emergency',
      treatment: 'Give first dose of antibiotic. Give first dose of paracetamol for high fever. Refer URGENTLY to hospital.',
    };
  }

  // Pneumonia
  if (hasFastBreathing) {
    return {
      classification: 'Pneumonia',
      color: 'yellow',
      requiresReferral: false,
      treatment: 'Give oral antibiotic for 5 days. Soothe the throat with safe remedy. If wheezing, give bronchodilator for 5 days. Follow up in 2 days.',
    };
  }

  // No Pneumonia: Cough or Cold
  return {
    classification: 'No Pneumonia: Cough or Cold',
    color: 'green',
    requiresReferral: false,
    treatment: 'If coughing more than 14 days, refer for assessment. Soothe the throat with safe remedy. Follow up in 5 days if not improving.',
  };
}

// Assess diarrhea
export function assessDiarrhea(data: {
  hasDiarrhea: boolean;
  diarrheaDurationDays?: number;
  bloodInStool: boolean;
  sunkenEyes: boolean;
  skinPinchSlow: boolean;
  skinPinchVerySlow: boolean;
  restlessIrritable: boolean;
  drinksEagerly: boolean;
  notAbleToDrink: boolean;
  lethargicUnconscious: boolean;
}): ClassificationResult {
  if (!data.hasDiarrhea) {
    return {
      classification: 'No Diarrhea',
      color: 'green',
      requiresReferral: false,
    };
  }

  // Severe Dehydration
  if (
    (data.lethargicUnconscious || data.notAbleToDrink) ||
    (data.sunkenEyes && data.skinPinchVerySlow)
  ) {
    return {
      classification: 'Severe Dehydration',
      color: 'red',
      requiresReferral: true,
      urgency: 'emergency',
      treatment: 'If child has no other severe classification: Give fluid for severe dehydration (Plan C). If child also has another severe classification: Refer URGENTLY with mother giving frequent sips of ORS. Advise to continue breastfeeding.',
    };
  }

  // Some Dehydration
  if (
    data.restlessIrritable ||
    data.sunkenEyes ||
    data.drinksEagerly ||
    data.skinPinchSlow
  ) {
    return {
      classification: 'Some Dehydration',
      color: 'yellow',
      requiresReferral: false,
      treatment: 'Give fluid and food for some dehydration (Plan B). If child also has a severe classification, refer URGENTLY with mother giving frequent sips of ORS on the way. Advise to continue breastfeeding.',
    };
  }

  // Dysentery
  if (data.bloodInStool) {
    return {
      classification: 'Dysentery',
      color: 'yellow',
      requiresReferral: false,
      treatment: 'Give ciprofloxacin for 3 days. Follow up in 2 days.',
    };
  }

  // Persistent Diarrhea
  if ((data.diarrheaDurationDays || 0) >= 14) {
    return {
      classification: 'Persistent Diarrhea',
      color: 'yellow',
      requiresReferral: true,
      urgency: 'routine',
      treatment: 'Refer for assessment and treatment.',
    };
  }

  // No Dehydration
  return {
    classification: 'No Dehydration',
    color: 'green',
    requiresReferral: false,
    treatment: 'Give fluid and food to treat diarrhea at home (Plan A). Give zinc supplements for 10-14 days. Advise mother when to return immediately. Follow up in 5 days if not improving.',
  };
}

// Assess fever
export function assessFever(data: {
  hasFever: boolean;
  feverDurationDays?: number;
  temperature?: number;
  stiffNeck: boolean;
  malariaRdtResult?: string;
  generalizedRash: boolean;
  runnyNose: boolean;
  mouthUlcers: boolean;
  pusDrainingEye: boolean;
  cloudingCornea: boolean;
  hasDangerSigns: boolean;
}): ClassificationResult {
  if (!data.hasFever) {
    return {
      classification: 'No Fever',
      color: 'green',
      requiresReferral: false,
    };
  }

  // Very Severe Febrile Disease / Severe Malaria
  if (data.hasDangerSigns || data.stiffNeck) {
    return {
      classification: 'Very Severe Febrile Disease',
      color: 'red',
      requiresReferral: true,
      urgency: 'emergency',
      treatment: 'Give first dose of artesunate or quinine for severe malaria. Give first dose of antibiotic for severe bacterial infection. Treat to prevent low blood sugar. Give first dose of paracetamol. Refer URGENTLY.',
    };
  }

  // Check for measles complications
  if (data.generalizedRash && data.runnyNose) {
    if (data.cloudingCornea || data.mouthUlcers || data.pusDrainingEye) {
      return {
        classification: 'Severe Complicated Measles',
        color: 'red',
        requiresReferral: true,
        urgency: 'emergency',
        treatment: 'Give vitamin A. Give first dose of antibiotic. If clouding of cornea, apply tetracycline eye ointment. Refer URGENTLY.',
      };
    }
    return {
      classification: 'Measles with Eye or Mouth Complications',
      color: 'yellow',
      requiresReferral: false,
      treatment: 'Give vitamin A. If pus draining from eye, apply tetracycline eye ointment. If mouth ulcers, apply gentian violet.',
    };
  }

  // Malaria
  if (data.malariaRdtResult === 'positive') {
    return {
      classification: 'Malaria',
      color: 'yellow',
      requiresReferral: false,
      treatment: 'Give oral antimalarial (ACT) for 3 days. Give paracetamol for fever. Follow up in 2 days if fever persists.',
    };
  }

  // Fever - Malaria Unlikely or No Malaria
  return {
    classification: data.malariaRdtResult === 'negative' ? 'Fever - No Malaria' : 'Fever - Cause Unknown',
    color: 'green',
    requiresReferral: (data.feverDurationDays || 0) >= 7,
    urgency: 'routine',
    treatment: 'Give paracetamol for fever. Follow up in 2 days if fever persists. If fever for 7 days or more, refer for assessment.',
  };
}

// Assess ear problems
export function assessEarProblem(data: {
  hasEarProblem: boolean;
  earPain: boolean;
  earDischarge: boolean;
  earDischargeDurationDays?: number;
  tenderSwellingBehindEar: boolean;
}): ClassificationResult {
  if (!data.hasEarProblem) {
    return {
      classification: 'No Ear Problem',
      color: 'green',
      requiresReferral: false,
    };
  }

  // Mastoiditis
  if (data.tenderSwellingBehindEar) {
    return {
      classification: 'Mastoiditis',
      color: 'red',
      requiresReferral: true,
      urgency: 'urgent',
      treatment: 'Give first dose of antibiotic. Give first dose of paracetamol for pain. Refer URGENTLY.',
    };
  }

  // Chronic Ear Infection
  if ((data.earDischargeDurationDays || 0) >= 14) {
    return {
      classification: 'Chronic Ear Infection',
      color: 'yellow',
      requiresReferral: true,
      urgency: 'routine',
      treatment: 'Dry the ear by wicking. Refer for specialist assessment.',
    };
  }

  // Acute Ear Infection
  if (data.earDischarge || data.earPain) {
    return {
      classification: 'Acute Ear Infection',
      color: 'yellow',
      requiresReferral: false,
      treatment: 'Give antibiotic for 5 days. Give paracetamol for pain. Dry the ear by wicking. Follow up in 5 days.',
    };
  }

  return {
    classification: 'No Ear Infection',
    color: 'green',
    requiresReferral: false,
  };
}

// Assess nutrition
export function assessNutrition(data: {
  visibleSevereWasting: boolean;
  edemaBothFeet: boolean;
  weightForAge?: number;
  muacMeasurement?: number;
  palmarPallor: boolean;
  severePalmarPallor: boolean;
}): ClassificationResult {
  // Severe Acute Malnutrition
  if (
    data.visibleSevereWasting ||
    data.edemaBothFeet ||
    (data.muacMeasurement && data.muacMeasurement < 11.5) ||
    (data.weightForAge && data.weightForAge < -3)
  ) {
    return {
      classification: 'Severe Acute Malnutrition',
      color: 'red',
      requiresReferral: true,
      urgency: 'urgent',
      treatment: 'Give vitamin A. Treat the child to prevent low blood sugar. Keep child warm. Refer URGENTLY.',
    };
  }

  // Severe Anemia
  if (data.severePalmarPallor) {
    return {
      classification: 'Severe Anemia',
      color: 'red',
      requiresReferral: true,
      urgency: 'urgent',
      treatment: 'Refer URGENTLY.',
    };
  }

  // Moderate Acute Malnutrition
  if (
    (data.muacMeasurement && data.muacMeasurement >= 11.5 && data.muacMeasurement < 12.5) ||
    (data.weightForAge && data.weightForAge >= -3 && data.weightForAge < -2)
  ) {
    return {
      classification: 'Moderate Acute Malnutrition',
      color: 'yellow',
      requiresReferral: false,
      treatment: 'Assess feeding and give counseling. Give supplementary feeding. Give vitamin A every 6 months. Follow up in 14 days.',
    };
  }

  // Anemia
  if (data.palmarPallor) {
    return {
      classification: 'Anemia',
      color: 'yellow',
      requiresReferral: false,
      treatment: 'Give iron and folic acid. Give mebendazole if child is 1 year or older. Follow up in 14 days.',
    };
  }

  // No Malnutrition or Anemia
  return {
    classification: 'No Malnutrition or Anemia',
    color: 'green',
    requiresReferral: false,
    treatment: 'Counsel on feeding. Give vitamin A every 6 months.',
  };
}

// Calculate overall assessment and referral prediction
export function calculateOverallAssessment(classifications: ClassificationResult[]): {
  overallClassification: string;
  overallColor: ClassificationColor;
  requiresReferral: boolean;
  referralUrgency: string;
  criticalFindings: string[];
} {
  const criticalFindings: string[] = [];
  let highestPriority: ClassificationColor = 'green';
  let referralUrgency = 'none';
  let requiresReferral = false;

  const priorityOrder: ClassificationColor[] = ['green', 'yellow', 'pink', 'red'];

  classifications.forEach((c) => {
    if (c.requiresReferral) {
      requiresReferral = true;
      criticalFindings.push(c.classification);
    }

    if (priorityOrder.indexOf(c.color) > priorityOrder.indexOf(highestPriority)) {
      highestPriority = c.color;
    }

    if (c.urgency === 'emergency') {
      referralUrgency = 'emergency';
    } else if (c.urgency === 'urgent' && referralUrgency !== 'emergency') {
      referralUrgency = 'urgent';
    } else if (c.urgency === 'routine' && referralUrgency === 'none') {
      referralUrgency = 'routine';
    }
  });

  let overallClassification = 'Child can be treated at home';
  const colorPriority = priorityOrder.indexOf(highestPriority);
  const redPriority = priorityOrder.indexOf('red');
  const yellowPriority = priorityOrder.indexOf('yellow');
  
  if (colorPriority >= redPriority) {
    overallClassification = 'REFER URGENTLY - Severe Classification';
  } else if (colorPriority >= yellowPriority && requiresReferral) {
    overallClassification = 'REFER - Treatment Required at Higher Facility';
  } else if (colorPriority >= yellowPriority) {
    overallClassification = 'Treatment at PHU - Follow up required';
  }

  return {
    overallClassification,
    overallColor: highestPriority,
    requiresReferral,
    referralUrgency: requiresReferral ? referralUrgency : 'none',
    criticalFindings,
  };
}

// Get color display properties
export function getColorDisplay(color: ClassificationColor): {
  bgClass: string;
  textClass: string;
  borderClass: string;
  label: string;
} {
  const colorMap: Record<ClassificationColor, { bgClass: string; textClass: string; borderClass: string; label: string }> = {
    red: {
      bgClass: 'bg-red-100 dark:bg-red-900/30',
      textClass: 'text-red-700 dark:text-red-400',
      borderClass: 'border-red-300 dark:border-red-700',
      label: 'Urgent Referral',
    },
    pink: {
      bgClass: 'bg-pink-100 dark:bg-pink-900/30',
      textClass: 'text-pink-700 dark:text-pink-400',
      borderClass: 'border-pink-300 dark:border-pink-700',
      label: 'Referral Needed',
    },
    yellow: {
      bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
      textClass: 'text-yellow-700 dark:text-yellow-400',
      borderClass: 'border-yellow-300 dark:border-yellow-700',
      label: 'Treatment Required',
    },
    green: {
      bgClass: 'bg-green-100 dark:bg-green-900/30',
      textClass: 'text-green-700 dark:text-green-400',
      borderClass: 'border-green-300 dark:border-green-700',
      label: 'Home Care',
    },
  };

  return colorMap[color] || colorMap.green;
}
