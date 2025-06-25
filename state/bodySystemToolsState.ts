/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ActiveBodySystemToolContext {
    system: string;      // e.g., "Cardiovascular", "Neurological"
    toolId: string | null; // e.g., "ascvdRiskCalculator", "gcsCalculator", or null for system tool menu
}

export interface GCSData {
    eye: number | null;
    verbal: number | null;
    motor: number | null;
    total: number | null;
}

export interface ASCVDData {
    age: string;
    sex: 'male' | 'female' | '';
    race: 'white' | 'africanAmerican' | '';
    totalCholesterol: string;
    hdlCholesterol: string;
    systolicBP: string;
    onHypertensionTreatment: 'yes' | 'no' | '';
    isDiabetic: 'yes' | 'no' | '';
    isSmoker: 'yes' | 'no' | '';
    riskScore: string | null;
}
export interface HeartRateZoneData {
    age: string;
    maxHeartRate: number | null;
    targetZoneLower: number | null;
    targetZoneUpper: number | null;
}

export interface OxygenationIndexData {
    map: string;
    fio2: string;
    pao2: string;
    oiScore: number | null;
    interpretation: string | null;
}

export interface BICSData {
    coughSeverity: number;
    sputumVolume: number;
    wheezeFrequency: number;
    totalScore: number | null;
    interpretation: string | null;
}

export interface RansonsCriteriaData {
    ageOver55: boolean;
    wbcOver16k: boolean;
    glucoseOver200: boolean;
    ldhOver350: boolean;
    astOver250: boolean;
    criteriaMet: number | null;
    interpretation: string | null;
}

export interface FRAXData {
    age: string;
    sex: 'male' | 'female' | '';
    weightKg: string;
    heightCm: string;
    previousFracture: 'yes' | 'no' | '';
    parentFracturedHip: 'yes' | 'no' | '';
    currentSmoking: 'yes' | 'no' | '';
    glucocorticoids: 'yes' | 'no' | '';
    rheumatoidArthritis: 'yes' | 'no' | '';
    secondaryOsteoporosis: 'yes' | 'no' | '';
    alcoholThreeOrMoreUnitsPerDay: 'yes' | 'no' | '';
    bmdTscore: string; // Optional
    majorOsteoporoticFractureRiskPercent: number | null;
    hipFractureRiskPercent: number | null;
    aiStatus: 'idle' | 'loading' | 'success' | 'error';
    aiError: string | null;
}

export interface ROMEntry {
    joint: string;
    motion: string;
    degrees: string;
    timestamp: string;
}
export interface ROMTrackerData {
    selectedJoint: string;
    selectedMotion: string;
    measuredDegrees: string;
    recordedROMs: ROMEntry[];
}

export interface BurnCalculatorData {
    burnDepth: 'superficial' | 'superficialPartial' | 'deepPartial' | 'fullThickness' | '';
    affectedAreas: string[]; // Values from Rule of Nines checkboxes
    patientAge: string;
    estimatedTBSA_percent: number | null;
    severityClassification: string | null;
    initialManagementPoints: string[] | null;
    aiStatus: 'idle' | 'loading' | 'success' | 'error';
    aiError: string | null;
}

export interface ThyroidFunctionData {
    tsh: string;
    freeT4: string;
    freeT3: string; // optional
    antiTPO: string; // optional
    interpretation: string | null;
    contributingFactors: string[] | null;
    furtherInvestigation: string[] | null;
    aiStatus: 'idle' | 'loading' | 'success' | 'error';
    aiError: string | null;
}

export interface DiabetesRiskData {
    age: string;
    bmi: string;
    familyHistoryDiabetes: 'yes' | 'no' | '';
    gestationalDiabetes: 'yes' | 'no' | 'na' | '';
    physicalActivity: 'low' | 'moderate' | 'high' | '';
    raceEthnicity: 'caucasian' | 'africanAmerican' | 'hispanic' | 'asian' | 'other' | '';
    bloodPressureStatus: 'normal' | 'elevated' | 'hypertension_stage1' | 'hypertension_stage2_on_rx' | '';
    hdlCholesterol: string;
    riskLevel: string | null;
    identifiedRiskFactors: string[] | null;
    lifestyleRecommendations: string[] | null;
    screeningSuggestion: string | null;
    aiStatus: 'idle' | 'loading' | 'success' | 'error';
    aiError: string | null;
}

export interface CoagulationProfileData {
    pt: string; // Prothrombin Time
    inr: string; // International Normalized Ratio
    aptt: string; // Activated Partial Thromboplastin Time
    fibrinogen: string; // Fibrinogen Level
    dDimer: string; 
    clinicalContext: string; 
    interpretation: string | null;
    potentialImplications: string[] | null;
    furtherSuggestions: string[] | null;
    aiStatus: 'idle' | 'loading' | 'success' | 'error';
    aiError: string | null;
}

export interface ConstitutionalSymptomsData {
    fever: boolean;
    feverTemp: string;
    fatigue: boolean;
    fatigueSeverity: 'mild' | 'moderate' | 'severe' | '';
    weightLoss: boolean;
    weightLossAmount: string;
    weightGain: boolean;
    weightGainAmount: string;
    malaise: boolean;
    chills: boolean;
    nightSweats: boolean;
    otherSymptomsContext: string;
    aiStatus: 'idle' | 'loading' | 'success' | 'error';
    aiError: string | null;
    symptomPatternSummary: string | null;
    potentialConcerns: string[] | null;
    suggestedNextSteps: string[] | null;
}


export type BodySystemToolData = {
    Cardiovascular?: {
        ascvdRiskCalculator?: ASCVDData;
        heartRateZoneCalculator?: HeartRateZoneData;
    };
    Neurological?: {
        gcsCalculator?: GCSData;
    };
    Respiratory?: {
        oxygenationIndexCalculator?: OxygenationIndexData;
        bicsCalculator?: BICSData;
    };
    Gastrointestinal?: {
        ransonsCriteria?: RansonsCriteriaData;
    };
    Musculoskeletal?: {
        fraxCalculatorAI?: FRAXData;
        romTracker?: ROMTrackerData;
    };
    Integumentary?: {
        burnCalculatorAI?: BurnCalculatorData;
    };
    Endocrine?: {
        thyroidFunctionAnalyzerAI?: ThyroidFunctionData;
        diabetesRiskProfilerAI?: DiabetesRiskData;
    };
    HematologicLymphatic?: { 
        coagulationProfileInterpreterAI?: CoagulationProfileData;
    };
    "General/Constitutional"?: {
        constitutionalSymptomAnalyzerAI?: ConstitutionalSymptomsData;
    };
};


export const initialBodySystemToolsToolData: Readonly<BodySystemToolData> = {
    Cardiovascular: {
        ascvdRiskCalculator: { age: '', sex: '', race: '', totalCholesterol: '', hdlCholesterol: '', systolicBP: '', onHypertensionTreatment: '', isDiabetic: '', isSmoker: '', riskScore: null },
        heartRateZoneCalculator: { age: '', maxHeartRate: null, targetZoneLower: null, targetZoneUpper: null }
    },
    Neurological: {
        gcsCalculator: { eye: null, verbal: null, motor: null, total: null }
    },
    Respiratory: {
        oxygenationIndexCalculator: { map: '', fio2: '', pao2: '', oiScore: null, interpretation: null },
        bicsCalculator: { coughSeverity: 5, sputumVolume: 5, wheezeFrequency: 5, totalScore: null, interpretation: null }
    },
    Gastrointestinal: {
        ransonsCriteria: { ageOver55: false, wbcOver16k: false, glucoseOver200: false, ldhOver350: false, astOver250: false, criteriaMet: null, interpretation: null }
    },
    Musculoskeletal: {
        fraxCalculatorAI: {
            age: '', sex: '', weightKg: '', heightCm: '', previousFracture: '', parentFracturedHip: '', currentSmoking: '', glucocorticoids: '', rheumatoidArthritis: '', secondaryOsteoporosis: '', alcoholThreeOrMoreUnitsPerDay: '', bmdTscore: '',
            majorOsteoporoticFractureRiskPercent: null, hipFractureRiskPercent: null, aiStatus: 'idle', aiError: null
        },
        romTracker: {
            selectedJoint: '', selectedMotion: '', measuredDegrees: '', recordedROMs: []
        }
    },
    Integumentary: {
        burnCalculatorAI: {
            burnDepth: '', affectedAreas: [], patientAge: '',
            estimatedTBSA_percent: null, severityClassification: null, initialManagementPoints: null,
            aiStatus: 'idle', aiError: null
        }
    },
    Endocrine: {
        thyroidFunctionAnalyzerAI: {
            tsh: '', freeT4: '', freeT3: '', antiTPO: '',
            interpretation: null, contributingFactors: null, furtherInvestigation: null,
            aiStatus: 'idle', aiError: null
        },
        diabetesRiskProfilerAI: {
            age: '', bmi: '', familyHistoryDiabetes: '', gestationalDiabetes: '', physicalActivity: '', raceEthnicity: '', bloodPressureStatus: '', hdlCholesterol: '',
            riskLevel: null, identifiedRiskFactors: null, lifestyleRecommendations: null, screeningSuggestion: null,
            aiStatus: 'idle', aiError: null
        }
    },
    HematologicLymphatic: { 
        coagulationProfileInterpreterAI: {
            pt: '', inr: '', aptt: '', fibrinogen: '', dDimer: '', clinicalContext: '',
            interpretation: null, potentialImplications: null, furtherSuggestions: null,
            aiStatus: 'idle', aiError: null
        }
    },
    "General/Constitutional": {
        constitutionalSymptomAnalyzerAI: {
            fever: false, feverTemp: '', fatigue: false, fatigueSeverity: '',
            weightLoss: false, weightLossAmount: '', weightGain: false, weightGainAmount: '',
            malaise: false, chills: false, nightSweats: false, otherSymptomsContext: '',
            aiStatus: 'idle', aiError: null, symptomPatternSummary: null, potentialConcerns: null, suggestedNextSteps: null
        }
    }
};


export interface BodySystemToolState {
    activeToolContext: ActiveBodySystemToolContext | null;
    toolData: BodySystemToolData;
}

export let bodySystemToolsState: BodySystemToolState = {
    activeToolContext: null,
    toolData: JSON.parse(JSON.stringify(initialBodySystemToolsToolData)) // Deep copy initial state
};

export function loadToolDataFromEncounter(savedToolResults?: BodySystemToolData) {
    // Reset to default first to ensure all structures are present
    bodySystemToolsState.toolData = JSON.parse(JSON.stringify(initialBodySystemToolsToolData));

    if (savedToolResults) {
        // Deep merge saved data into the default structure
        for (const systemKey in savedToolResults) {
            const key = systemKey as keyof BodySystemToolData;
            if (bodySystemToolsState.toolData[key] && savedToolResults[key]) {
                // Iterate through tools within the system
                for (const toolKey in savedToolResults[key]) {
                    const tKey = toolKey as keyof NonNullable<BodySystemToolData[keyof BodySystemToolData]>;
                     if (bodySystemToolsState.toolData[key]![tKey] && savedToolResults[key]![tKey]) {
                        Object.assign(bodySystemToolsState.toolData[key]![tKey]!, savedToolResults[key]![tKey]!);
                    } else if (savedToolResults[key]![tKey]) {
                         (bodySystemToolsState.toolData[key]! as any)[tKey] = JSON.parse(JSON.stringify(savedToolResults[key]![tKey]!));
                    }
                }
            } else if (savedToolResults[key]) {
                // If the system itself is new (not in defaults, unlikely), add it
                (bodySystemToolsState.toolData as any)[key] = JSON.parse(JSON.stringify(savedToolResults[key]!));
            }
        }
    }
}


export function setActiveSystemTool(system: string, toolId: string | null) {
    bodySystemToolsState.activeToolContext = { system, toolId };
}

export function clearActiveSystemTool() {
    bodySystemToolsState.activeToolContext = null;
}

// Getters and Updaters
export function getGCSScores(): GCSData {
    if (!bodySystemToolsState.toolData.Neurological?.gcsCalculator) {
        if (!bodySystemToolsState.toolData.Neurological) bodySystemToolsState.toolData.Neurological = {};
        bodySystemToolsState.toolData.Neurological.gcsCalculator = JSON.parse(JSON.stringify(initialBodySystemToolsToolData.Neurological!.gcsCalculator!));
    }
    return bodySystemToolsState.toolData.Neurological.gcsCalculator;
}
export function updateGCSScores(updatedScores: Partial<GCSData>) {
    const gcsData = getGCSScores(); // Ensures it's initialized
    Object.assign(gcsData, updatedScores); // Mutate the existing object in toolData
    const { eye, verbal, motor } = gcsData;
    if (eye !== null && verbal !== null && motor !== null) {
        gcsData.total = eye + verbal + motor;
    } else {
        gcsData.total = null;
    }
}

export function getASCVDData(): ASCVDData {
     if (!bodySystemToolsState.toolData.Cardiovascular?.ascvdRiskCalculator) {
        if (!bodySystemToolsState.toolData.Cardiovascular) bodySystemToolsState.toolData.Cardiovascular = {};
        bodySystemToolsState.toolData.Cardiovascular.ascvdRiskCalculator = JSON.parse(JSON.stringify(initialBodySystemToolsToolData.Cardiovascular!.ascvdRiskCalculator!));
    }
    return bodySystemToolsState.toolData.Cardiovascular.ascvdRiskCalculator;
}
export function updateASCVDData(updatedData: Partial<ASCVDData>) {
    const ascvdData = getASCVDData();
    Object.assign(ascvdData, updatedData);
}

export function getHeartRateZoneData(): HeartRateZoneData {
    if(!bodySystemToolsState.toolData.Cardiovascular?.heartRateZoneCalculator) {
        if (!bodySystemToolsState.toolData.Cardiovascular) bodySystemToolsState.toolData.Cardiovascular = {};
        bodySystemToolsState.toolData.Cardiovascular.heartRateZoneCalculator = JSON.parse(JSON.stringify(initialBodySystemToolsToolData.Cardiovascular!.heartRateZoneCalculator!));
    }
    return bodySystemToolsState.toolData.Cardiovascular.heartRateZoneCalculator;
}
export function updateHeartRateZoneData(updatedData: Partial<HeartRateZoneData>) {
    const hrData = getHeartRateZoneData();
    Object.assign(hrData, updatedData);
}

export function getOxygenationIndexData(): OxygenationIndexData {
    if (!bodySystemToolsState.toolData.Respiratory?.oxygenationIndexCalculator) {
        if (!bodySystemToolsState.toolData.Respiratory) bodySystemToolsState.toolData.Respiratory = {};
        bodySystemToolsState.toolData.Respiratory.oxygenationIndexCalculator = JSON.parse(JSON.stringify(initialBodySystemToolsToolData.Respiratory!.oxygenationIndexCalculator!));
    }
    return bodySystemToolsState.toolData.Respiratory.oxygenationIndexCalculator;
}
export function updateOxygenationIndexData(updatedData: Partial<OxygenationIndexData>) {
    const oiData = getOxygenationIndexData();
    Object.assign(oiData, updatedData);
}

export function getBICSData(): BICSData {
    if (!bodySystemToolsState.toolData.Respiratory?.bicsCalculator) {
         if (!bodySystemToolsState.toolData.Respiratory) bodySystemToolsState.toolData.Respiratory = {};
        bodySystemToolsState.toolData.Respiratory.bicsCalculator = JSON.parse(JSON.stringify(initialBodySystemToolsToolData.Respiratory!.bicsCalculator!));
    }
    return bodySystemToolsState.toolData.Respiratory.bicsCalculator;
}
export function updateBICSData(updatedData: Partial<BICSData>) {
    const bicsData = getBICSData();
     Object.assign(bicsData, updatedData);
     const { coughSeverity, sputumVolume, wheezeFrequency } = bicsData;
    bicsData.totalScore = coughSeverity + sputumVolume + wheezeFrequency;
}

export function getRansonsCriteriaData(): RansonsCriteriaData {
    if (!bodySystemToolsState.toolData.Gastrointestinal?.ransonsCriteria) {
        if (!bodySystemToolsState.toolData.Gastrointestinal) bodySystemToolsState.toolData.Gastrointestinal = {};
        bodySystemToolsState.toolData.Gastrointestinal.ransonsCriteria = JSON.parse(JSON.stringify(initialBodySystemToolsToolData.Gastrointestinal!.ransonsCriteria!));
    }
    return bodySystemToolsState.toolData.Gastrointestinal.ransonsCriteria;
}
export function updateRansonsCriteriaData(updatedData: Partial<RansonsCriteriaData>) {
    const ransonsData = getRansonsCriteriaData();
    Object.assign(ransonsData, updatedData);
    let count = 0;
    const data = ransonsData;
    if (data.ageOver55) count++;
    if (data.wbcOver16k) count++;
    if (data.glucoseOver200) count++;
    if (data.ldhOver350) count++;
    if (data.astOver250) count++;
    data.criteriaMet = count;
}

export function getFRAXData(): FRAXData {
    if (!bodySystemToolsState.toolData.Musculoskeletal?.fraxCalculatorAI) {
        if (!bodySystemToolsState.toolData.Musculoskeletal) bodySystemToolsState.toolData.Musculoskeletal = {};
        bodySystemToolsState.toolData.Musculoskeletal.fraxCalculatorAI = JSON.parse(JSON.stringify(initialBodySystemToolsToolData.Musculoskeletal!.fraxCalculatorAI!));
    }
    return bodySystemToolsState.toolData.Musculoskeletal.fraxCalculatorAI;
}
export function updateFRAXData(updatedData: Partial<FRAXData>) {
    const fraxData = getFRAXData();
    Object.assign(fraxData, updatedData);
}

export function getROMTrackerData(): ROMTrackerData {
    if (!bodySystemToolsState.toolData.Musculoskeletal?.romTracker) {
        if (!bodySystemToolsState.toolData.Musculoskeletal) bodySystemToolsState.toolData.Musculoskeletal = {};
        bodySystemToolsState.toolData.Musculoskeletal.romTracker = JSON.parse(JSON.stringify(initialBodySystemToolsToolData.Musculoskeletal!.romTracker!));
    }
    return bodySystemToolsState.toolData.Musculoskeletal.romTracker;
}
export function updateROMTrackerData(updatedData: Partial<ROMTrackerData>) {
    const romData = getROMTrackerData(); 
    Object.assign(romData, updatedData);
}
export function addROMEntry(entry: ROMEntry) {
    const romData = getROMTrackerData();
    romData.recordedROMs.push(entry);
    if (romData.recordedROMs.length > 10) { 
        romData.recordedROMs.shift();
    }
}

export function getBurnCalculatorData(): BurnCalculatorData {
    if (!bodySystemToolsState.toolData.Integumentary?.burnCalculatorAI) {
        if (!bodySystemToolsState.toolData.Integumentary) bodySystemToolsState.toolData.Integumentary = {};
        bodySystemToolsState.toolData.Integumentary.burnCalculatorAI = JSON.parse(JSON.stringify(initialBodySystemToolsToolData.Integumentary!.burnCalculatorAI!));
    }
    return bodySystemToolsState.toolData.Integumentary.burnCalculatorAI;
}
export function updateBurnCalculatorData(updatedData: Partial<BurnCalculatorData>) {
    const burnData = getBurnCalculatorData(); 
    Object.assign(burnData, updatedData);
}

export function getThyroidFunctionData(): ThyroidFunctionData {
    if (!bodySystemToolsState.toolData.Endocrine?.thyroidFunctionAnalyzerAI) {
        if (!bodySystemToolsState.toolData.Endocrine) bodySystemToolsState.toolData.Endocrine = {};
        bodySystemToolsState.toolData.Endocrine.thyroidFunctionAnalyzerAI = JSON.parse(JSON.stringify(initialBodySystemToolsToolData.Endocrine!.thyroidFunctionAnalyzerAI!));
    }
    return bodySystemToolsState.toolData.Endocrine.thyroidFunctionAnalyzerAI;
}
export function updateThyroidFunctionData(updatedData: Partial<ThyroidFunctionData>) {
    const thyroidData = getThyroidFunctionData(); 
    Object.assign(thyroidData, updatedData);
}

export function getDiabetesRiskData(): DiabetesRiskData {
    if (!bodySystemToolsState.toolData.Endocrine?.diabetesRiskProfilerAI) {
        if (!bodySystemToolsState.toolData.Endocrine) bodySystemToolsState.toolData.Endocrine = {};
        bodySystemToolsState.toolData.Endocrine.diabetesRiskProfilerAI = JSON.parse(JSON.stringify(initialBodySystemToolsToolData.Endocrine!.diabetesRiskProfilerAI!));
    }
    return bodySystemToolsState.toolData.Endocrine.diabetesRiskProfilerAI;
}
export function updateDiabetesRiskData(updatedData: Partial<DiabetesRiskData>) {
    const diabetesData = getDiabetesRiskData(); 
    Object.assign(diabetesData, updatedData);
}

export function getCoagulationProfileData(): CoagulationProfileData {
    if (!bodySystemToolsState.toolData.HematologicLymphatic?.coagulationProfileInterpreterAI) {
        if (!bodySystemToolsState.toolData.HematologicLymphatic) bodySystemToolsState.toolData.HematologicLymphatic = {};
        bodySystemToolsState.toolData.HematologicLymphatic.coagulationProfileInterpreterAI = JSON.parse(JSON.stringify(initialBodySystemToolsToolData.HematologicLymphatic!.coagulationProfileInterpreterAI!));
    }
    return bodySystemToolsState.toolData.HematologicLymphatic.coagulationProfileInterpreterAI;
}
export function updateCoagulationProfileData(updatedData: Partial<CoagulationProfileData>) {
    const coagData = getCoagulationProfileData(); 
    Object.assign(coagData, updatedData);
}

export function getConstitutionalSymptomsData(): ConstitutionalSymptomsData {
    const generalConstitutionalKey = "General/Constitutional";
    
    if (!bodySystemToolsState.toolData[generalConstitutionalKey]) {
        bodySystemToolsState.toolData[generalConstitutionalKey] = {};
    }
    
    let toolSystemData = bodySystemToolsState.toolData[generalConstitutionalKey]!;

    if (!toolSystemData.constitutionalSymptomAnalyzerAI) {
        const initialToolDefault = initialBodySystemToolsToolData[generalConstitutionalKey]?.constitutionalSymptomAnalyzerAI;
        if (initialToolDefault) {
            toolSystemData.constitutionalSymptomAnalyzerAI = JSON.parse(JSON.stringify(initialToolDefault));
        } else {
            // This case should ideally not be reached if initialBodySystemToolsToolData is complete
            toolSystemData.constitutionalSymptomAnalyzerAI = {
                fever: false, feverTemp: '', fatigue: false, fatigueSeverity: '',
                weightLoss: false, weightLossAmount: '', weightGain: false, weightGainAmount: '',
                malaise: false, chills: false, nightSweats: false, otherSymptomsContext: '',
                aiStatus: 'idle', aiError: null, symptomPatternSummary: null, potentialConcerns: null, suggestedNextSteps: null
            };
        }
    }
    return toolSystemData.constitutionalSymptomAnalyzerAI!;
}
export function updateConstitutionalSymptomsData(updatedData: Partial<ConstitutionalSymptomsData>) {
    const constitutionalData = getConstitutionalSymptomsData(); 
    Object.assign(constitutionalData, updatedData);
}


export function resetToolData(system: string, toolId: string) {
    const systemKey = system as keyof BodySystemToolData;
    if (bodySystemToolsState.toolData[systemKey]) {
        const toolKeyTyped = toolId as keyof NonNullable<BodySystemToolData[typeof systemKey]>;
        const initialSystemSpecificTools = initialBodySystemToolsToolData[systemKey];
        
        if (initialSystemSpecificTools && toolKeyTyped in initialSystemSpecificTools) {
             const toolDefaults = (initialSystemSpecificTools as any)[toolKeyTyped];
             if (toolDefaults) {
                (bodySystemToolsState.toolData[systemKey]! as any)[toolKeyTyped] = JSON.parse(JSON.stringify(toolDefaults));
             }
        }
    }
}
