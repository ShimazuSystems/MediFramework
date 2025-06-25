/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { GoogleGenAI } from "@google/genai"; // Changed to import type

// Import data types for global functions
import { phq9Data as PHQ9DataType } from '../psychometrics/phq9';
import { gad7Data as GAD7DataType } from '../psychometrics/gad7';
import { pcl5Data as PCL5DataType } from '../psychometrics/pcl5';
import { mseData as MSEDataType } from '../psychometrics/mse';
// import { cognitiveTestData as CognitiveDataType } from '../psychometrics/cognitive'; // Removed
import { personalityMatrixData as PersonalityMatrixDataType } from '../psychometrics/personalityMatrix';
import { clinicalInterviewData as ClinicalInterviewDataType } from '../psychometrics/clinicalInterview';
import { reportGeneratorData as ReportGeneratorDataType } from '../psychometrics/reportGenerator';
import { nnpaData as NNPADatatype } from '../psychometrics/nnpa';

import {
    ASCVDData as ASCVDDataType,
    GCSData as GCSDataType,
    HeartRateZoneData as HeartRateZoneDataType,
    OxygenationIndexData as OxygenationIndexDataType,
    BICSData as BICSDataType,
    RansonsCriteriaData as RansonsCriteriaDataType,
    FRAXData as FRAXDataType,
    ROMTrackerData as ROMTrackerDataType,
    BurnCalculatorData as BurnCalculatorDataType,
    ThyroidFunctionData as ThyroidFunctionDataType,
    DiabetesRiskData as DiabetesRiskDataType,
    CoagulationProfileData as CoagulationProfileDataType,
    ConstitutionalSymptomsData as ConstitutionalSymptomsDataType,
} from '../state/bodySystemToolsState';


type PsychometricModuleKey = 'phq9' | 'gad7' | 'pcl5' | 'mse' /* | 'cognitive' */ | 'personalityMatrix' | 'clinicalInterview' | 'reportGenerator' | 'nnpa'; // Removed 'cognitive'
type PsychometricDataMap = {
    phq9: typeof PHQ9DataType;
    gad7: typeof GAD7DataType;
    pcl5: typeof PCL5DataType;
    mse: typeof MSEDataType;
    // cognitive: typeof CognitiveDataType; // Removed
    personalityMatrix: typeof PersonalityMatrixDataType;
    clinicalInterview: typeof ClinicalInterviewDataType;
    reportGenerator: typeof ReportGeneratorDataType;
    nnpa: typeof NNPADatatype;
};

type CardiovascularToolKey = 'ascvdRiskCalculator' | 'heartRateZoneCalculator';
type NeurologicalToolKey = 'gcsCalculator';
type RespiratoryToolKey = 'oxygenationIndexCalculator' | 'bicsCalculator';
type GastrointestinalToolKey = 'ransonsCriteria';
type MusculoskeletalToolKey = 'fraxCalculatorAI' | 'romTracker';
type IntegumentaryToolKey = 'burnCalculatorAI';
type EndocrineToolKey = 'thyroidFunctionAnalyzerAI' | 'diabetesRiskProfilerAI';
type HematologicLymphaticToolKey = 'coagulationProfileInterpreterAI';
type GeneralConstitutionalToolKey = 'constitutionalSymptomAnalyzerAI';


type BodySystemToolDataMap = {
    Cardiovascular: {
        ascvdRiskCalculator?: ASCVDDataType;
        heartRateZoneCalculator?: HeartRateZoneDataType;
    };
    Neurological: {
        gcsCalculator?: GCSDataType;
    };
    Respiratory: {
        oxygenationIndexCalculator?: OxygenationIndexDataType;
        bicsCalculator?: BICSDataType;
    };
    Gastrointestinal: {
        ransonsCriteria?: RansonsCriteriaDataType;
    };
    Musculoskeletal: {
        fraxCalculatorAI?: FRAXDataType;
        romTracker?: ROMTrackerDataType;
    };
    Integumentary: {
        burnCalculatorAI?: BurnCalculatorDataType;
    };
    Endocrine: {
        thyroidFunctionAnalyzerAI?: ThyroidFunctionDataType;
        diabetesRiskProfilerAI?: DiabetesRiskDataType;
    };
    HematologicLymphatic: {
        coagulationProfileInterpreterAI?: CoagulationProfileDataType;
    };
    "General/Constitutional": {
        constitutionalSymptomAnalyzerAI?: ConstitutionalSymptomsDataType;
    };
};

type BodySystemKey = keyof BodySystemToolDataMap;


declare global {
  // --- Web Speech API Type Declarations ---
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly [index: number]: SpeechRecognitionAlternative;
    readonly length: number;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  interface SpeechRecognitionStatic {
    new (): SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    grammars: SpeechGrammarList;
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    serviceURI?: string;

    start(): void;
    stop(): void;
    abort(): void;

    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;

    addEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
  }

  interface SpeechGrammarList {
    readonly length: number;
    item(index: number): SpeechGrammar;
    [index: number]: SpeechGrammar;
    addFromString(string: string, weight?: number): void;
    addFromURI(src: string, weight?: number): void;
  }

  interface SpeechGrammar {
    src: string;
    weight: number;
  }

  interface SpeechRecognitionEventMap {
    "audiostart": Event;
    "audioend": Event;
    "end": Event;
    "error": SpeechRecognitionErrorEvent;
    "nomatch": SpeechRecognitionEvent;
    "result": SpeechRecognitionEvent;
    "soundstart": Event;
    "soundend": Event;
    "speechstart": Event;
    "speechend": Event;
    "start": Event;
  }

  var SpeechRecognition: SpeechRecognitionStatic | undefined;
  var webkitSpeechRecognition: SpeechRecognitionStatic | undefined;

  // Augment the Window interface for TypeScript
  interface Window {
      SpeechRecognition?: SpeechRecognitionStatic;
      webkitSpeechRecognition?: SpeechRecognitionStatic;
      ai: GoogleGenAI; // Make AI instance globally available for modules
      renderPsychometricTerminal: () => void;
      createUIRadioGroupHTML: (name: string, options: any[], selectedValue: number | null, questionIndex: number) => string;
      createUIProgressBarHTML: (value: number, max: number, text?: string, id?: string) => string;
      createPsychTerminalStyledText: (text: string) => string;
      createUITextAreaHTML: (placeholder: string, name: string, rows: number, value?: string, readonly?: boolean) => string;
      createUICriteriaTrackerHTML: (met: number, total: number) => string;
      createUISliderHTML: (id:string, label: string, minLabel: string, maxLabel: string, min: number, max: number, value: number, color: string) => string;
      createUITextInputHTML: (placeholder: string, name: string, value?: string, type?: string) => string; // Added type
      createUISelectHTML: (id: string, label: string, options: { value: string; text: string }[], selectedValue: string | string[], allowMultiple?: boolean, helpText?: string) => string;
      createUICheckboxHTML: (label: string, name: string, value: string, checked: boolean) => string;
      createUICheckboxGroupHTML: (idPrefix: string, legend: string, options: { value: string; labelText: string }[], selectedValues: string[], helpText?: string) => string;

      // New global functions for updating encounter data
      updatePsychometricDataForActiveEncounter: <K extends PsychometricModuleKey>(moduleKey: K, data: PsychometricDataMap[K]) => void;
      updateToolDataForActiveEncounter: <S extends BodySystemKey, T extends keyof BodySystemToolDataMap[S]>(
        systemKey: S,
        toolKey: T,
        data: NonNullable<BodySystemToolDataMap[S]>[T]
      ) => void;
  }
}