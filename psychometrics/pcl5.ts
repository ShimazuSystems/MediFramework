/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Assume these are globally available from index.tsx or will be passed/imported
declare function createUIRadioGroupHTML(name: string, options: { label: string; value: number }[], selectedValue: number | null, questionIndex: number): string;
declare function createUIProgressBarHTML(value: number, max: number, text?: string, id?: string): string;
declare function renderPsychometricTerminal(): void;
declare function createPsychTerminalStyledText(text: string): string;
declare function createUICriteriaTrackerHTML(met: number, total: number): string; // For DSM criteria

interface PCL5Option { label: string; value: number }
interface PCL5Question {
  id: string;
  text: string;
  criterion: 'B' | 'C' | 'D' | 'E';
  options: PCL5Option[];
  selectedValue: number | null;
}

const initialPCL5Questions: ReadonlyArray<Omit<PCL5Question, 'selectedValue'>> = [
    // Criterion B: Intrusion Symptoms
    { id: 'pcl5-q0', text: 'Repeated, disturbing, and unwanted memories of the stressful experience?', criterion: 'B', options: [{label:'Not at all', value:0}, {label:'A little bit', value:1}, {label:'Moderately', value:2}, {label:'Quite a bit', value:3}, {label:'Extremely', value:4}]},
    { id: 'pcl5-q1', text: 'Repeated, disturbing dreams of the stressful experience?', criterion: 'B', options: [{label:'Not at all', value:0}, {label:'A little bit', value:1}, {label:'Moderately', value:2}, {label:'Quite a bit', value:3}, {label:'Extremely', value:4}]},
    { id: 'pcl5-q2', text: 'Suddenly feeling or acting as if the stressful experience were actually happening again?', criterion: 'B', options: [{label:'Not at all', value:0}, {label:'A little bit', value:1}, {label:'Moderately', value:2}, {label:'Quite a bit', value:3}, {label:'Extremely', value:4}]},
    { id: 'pcl5-q3', text: 'Feeling very upset when something reminded you of the stressful experience?', criterion: 'B', options: [{label:'Not at all', value:0}, {label:'A little bit', value:1}, {label:'Moderately', value:2}, {label:'Quite a bit', value:3}, {label:'Extremely', value:4}]},
    { id: 'pcl5-q4', text: 'Having strong physical reactions when something reminded you of the stressful experience (e.g., heart pounding, sweating)?', criterion: 'B', options: [{label:'Not at all', value:0}, {label:'A little bit', value:1}, {label:'Moderately', value:2}, {label:'Quite a bit', value:3}, {label:'Extremely', value:4}]},
    // Criterion C: Avoidance
    { id: 'pcl5-q5', text: 'Avoiding memories, thoughts, or feelings related to the stressful experience?', criterion: 'C', options: [{label:'Not at all', value:0}, {label:'A little bit', value:1}, {label:'Moderately', value:2}, {label:'Quite a bit', value:3}, {label:'Extremely', value:4}]},
    { id: 'pcl5-q6', text: 'Avoiding external reminders of the stressful experience (e.g., people, places, situations)?', criterion: 'C', options: [{label:'Not at all', value:0}, {label:'A little bit', value:1}, {label:'Moderately', value:2}, {label:'Quite a bit', value:3}, {label:'Extremely', value:4}]},
    // Criterion D: Negative Alterations in Cognitions and Mood
    { id: 'pcl5-q7', text: 'Trouble remembering important parts of the stressful experience?', criterion: 'D', options: [{label:'Not at all', value:0}, {label:'A little bit', value:1}, {label:'Moderately', value:2}, {label:'Quite a bit', value:3}, {label:'Extremely', value:4}]},
    { id: 'pcl5-q8', text: 'Having strong negative beliefs about yourself, other people, or the world?', criterion: 'D', options: [{label:'Not at all', value:0}, {label:'A little bit', value:1}, {label:'Moderately', value:2}, {label:'Quite a bit', value:3}, {label:'Extremely', value:4}]},
    { id: 'pcl5-q9', text: 'Blaming yourself or someone else for the stressful experience or for what happened after it?', criterion: 'D', options: [{label:'Not at all', value:0}, {label:'A little bit', value:1}, {label:'Moderately', value:2}, {label:'Quite a bit', value:3}, {label:'Extremely', value:4}]},
    { id: 'pcl5-q10', text: 'Having strong negative feelings such as fear, horror, anger, guilt, or shame?', criterion: 'D', options: [{label:'Not at all', value:0}, {label:'A little bit', value:1}, {label:'Moderately', value:2}, {label:'Quite a bit', value:3}, {label:'Extremely', value:4}]},
    { id: 'pcl5-q11', text: 'Loss of interest in activities that you used to enjoy?', criterion: 'D', options: [{label:'Not at all', value:0}, {label:'A little bit', value:1}, {label:'Moderately', value:2}, {label:'Quite a bit', value:3}, {label:'Extremely', value:4}]},
    { id: 'pcl5-q12', text: 'Feeling distant or cut off from other people?', criterion: 'D', options: [{label:'Not at all', value:0}, {label:'A little bit', value:1}, {label:'Moderately', value:2}, {label:'Quite a bit', value:3}, {label:'Extremely', value:4}]},
    { id: 'pcl5-q13', text: 'Trouble experiencing positive feelings (e.g., happiness, loving feelings)?', criterion: 'D', options: [{label:'Not at all', value:0}, {label:'A little bit', value:1}, {label:'Moderately', value:2}, {label:'Quite a bit', value:3}, {label:'Extremely', value:4}]},
    // Criterion E: Alterations in Arousal and Reactivity
    { id: 'pcl5-q14', text: 'Irritable behavior, angry outbursts, or acting aggressively?', criterion: 'E', options: [{label:'Not at all', value:0}, {label:'A little bit', value:1}, {label:'Moderately', value:2}, {label:'Quite a bit', value:3}, {label:'Extremely', value:4}]},
    { id: 'pcl5-q15', text: 'Taking too many risks or doing things that could cause you harm?', criterion: 'E', options: [{label:'Not at all', value:0}, {label:'A little bit', value:1}, {label:'Moderately', value:2}, {label:'Quite a bit', value:3}, {label:'Extremely', value:4}]},
    { id: 'pcl5-q16', text: 'Being "superalert" or watchful or on guard?', criterion: 'E', options: [{label:'Not at all', value:0}, {label:'A little bit', value:1}, {label:'Moderately', value:2}, {label:'Quite a bit', value:3}, {label:'Extremely', value:4}]},
    { id: 'pcl5-q17', text: 'Feeling jumpy or easily startled?', criterion: 'E', options: [{label:'Not at all', value:0}, {label:'A little bit', value:1}, {label:'Moderately', value:2}, {label:'Quite a bit', value:3}, {label:'Extremely', value:4}]},
    { id: 'pcl5-q18', text: 'Having difficulty concentrating?', criterion: 'E', options: [{label:'Not at all', value:0}, {label:'A little bit', value:1}, {label:'Moderately', value:2}, {label:'Quite a bit', value:3}, {label:'Extremely', value:4}]},
    { id: 'pcl5-q19', text: 'Trouble falling or staying asleep?', criterion: 'E', options: [{label:'Not at all', value:0}, {label:'A little bit', value:1}, {label:'Moderately', value:2}, {label:'Quite a bit', value:3}, {label:'Extremely', value:4}]},
];

export let pcl5Data: {
  questions: PCL5Question[];
  totalScore: number;
  dsm5Criteria: {
    A: boolean; 
    B: boolean; 
    C: boolean; 
    D: boolean; 
    E: boolean; 
  };
  provisionalDiagnosisMet: boolean;
  severityInterpretation: string;
} = {
  questions: initialPCL5Questions.map(q => ({ ...q, selectedValue: null })),
  totalScore: 0,
  dsm5Criteria: { A: true, B: false, C: false, D: false, E: false },
  provisionalDiagnosisMet: false,
  severityInterpretation: "Not yet assessed",
};

function calculatePCL5CriteriaAndSeverity(): void {
  pcl5Data.totalScore = 0;
  let questionsAnswered = 0;
  
  let countB = 0, countC = 0, countD = 0, countE = 0;

  pcl5Data.questions.forEach(q => {
    if (q.selectedValue !== null) {
      pcl5Data.totalScore += q.selectedValue;
      questionsAnswered++;
      if (q.selectedValue >= 2) { // Scored "Moderately" or higher
        if (q.criterion === 'B') countB++;
        else if (q.criterion === 'C') countC++;
        else if (q.criterion === 'D') countD++;
        else if (q.criterion === 'E') countE++;
      }
    }
  });

  pcl5Data.dsm5Criteria.B = countB >= 1;
  pcl5Data.dsm5Criteria.C = countC >= 1;
  pcl5Data.dsm5Criteria.D = countD >= 2;
  pcl5Data.dsm5Criteria.E = countE >= 2;

  pcl5Data.provisionalDiagnosisMet = 
    pcl5Data.dsm5Criteria.A && 
    pcl5Data.dsm5Criteria.B &&
    pcl5Data.dsm5Criteria.C &&
    pcl5Data.dsm5Criteria.D &&
    pcl5Data.dsm5Criteria.E;

  if (questionsAnswered < pcl5Data.questions.length) {
    pcl5Data.severityInterpretation = "Assessment Incomplete";
  } else if (pcl5Data.totalScore >= 51) {
    pcl5Data.severityInterpretation = "Severe Symptoms / Probable PTSD";
  } else if (pcl5Data.totalScore >= 31) { // Common cut-off around 31-33
    pcl5Data.severityInterpretation = "Moderate Symptoms / PTSD Likely";
  } else if (pcl5Data.totalScore >= 11) {
    pcl5Data.severityInterpretation = "Mild Symptoms / PTSD Unlikely";
  } else {
    pcl5Data.severityInterpretation = "Minimal to No Symptoms";
  }
}


export function initializePCL5Data(savedData?: typeof pcl5Data): void {
    if (savedData && savedData.questions && savedData.questions.length === initialPCL5Questions.length) {
        pcl5Data.questions = JSON.parse(JSON.stringify(savedData.questions));
        // Other fields like totalScore, dsm5Criteria will be recalculated by calculatePCL5CriteriaAndSeverity
    } else {
        pcl5Data.questions = initialPCL5Questions.map(q => ({ ...q, selectedValue: null }));
    }
    calculatePCL5CriteriaAndSeverity(); // Always recalculate based on loaded/reset questions
}


export function renderPCL5Screen(): string {
    calculatePCL5CriteriaAndSeverity(); // Ensure data is up-to-date before rendering

    let content = `<div class='psych-module-content'><div class='psych-module-title'>PCL-5 PTSD CHECKLIST (DSM-5)</div>`;
    content += `<p class="psych-assessment-instruction">In the past month, how much were you bothered by any of the following problems? Criterion A (exposure to a traumatic event) is assumed to be met for this screener.</p>`;
    
    let questionsAnswered = 0;
    pcl5Data.questions.forEach((q, index) => {
        content += `<div class="pcl5-question">
            <p>[${index + 1}] ${q.text} <span class="pcl5-criterion-marker">(Criterion ${q.criterion})</span></p>
            ${createUIRadioGroupHTML(q.id, q.options, q.selectedValue, index)}
        </div>`;
        if (q.selectedValue !== null) {
            questionsAnswered++;
        }
    });

    const dsmCriteriaMetCount = (pcl5Data.dsm5Criteria.B ? 1:0) + (pcl5Data.dsm5Criteria.C ? 1:0) + (pcl5Data.dsm5Criteria.D ? 1:0) + (pcl5Data.dsm5Criteria.E ? 1:0);

    content += `<div class="pcl5-summary">
        PROGRESS: ${createUIProgressBarHTML(questionsAnswered, pcl5Data.questions.length, `[${questionsAnswered}/${pcl5Data.questions.length}] QUESTIONS`)}
        CURRENT SCORE: ${pcl5Data.totalScore} / 80<br>
        SEVERITY: [${pcl5Data.severityInterpretation.toUpperCase()}]<br>
        DSM-5 CRITERIA STATUS (B,C,D,E): ${createUICriteriaTrackerHTML(dsmCriteriaMetCount, 4)}<br>
        <div class="pcl5-criteria-details">
           Criterion B (Intrusion): ${pcl5Data.dsm5Criteria.B ? "[MET]" : "[NOT MET]"} | 
           Criterion C (Avoidance): ${pcl5Data.dsm5Criteria.C ? "[MET]" : "[NOT MET]"} | 
           Criterion D (Cognition/Mood): ${pcl5Data.dsm5Criteria.D ? "[MET]" : "[NOT MET]"} | 
           Criterion E (Arousal/Reactivity): ${pcl5Data.dsm5Criteria.E ? "[MET]" : "[NOT MET]"}
        </div>
        PROVISIONAL PTSD DIAGNOSIS: <span class="term-highlight">[${pcl5Data.provisionalDiagnosisMet ? "LIKELY MET" : "NOT MET"}]</span>
    </div>`;
    content += `<div class="psych-actions">${createPsychTerminalStyledText("[S]AVE PROGRESS    [R]ESET    [Q]UIT ASSESSMENT")}</div>`;
    content += `<div class="psych-nav-options"><button data-nav-target="mainMenu">Back to Main Menu</button></div></div>`;
    return content;
}

export function handlePCL5OptionChange(radioName: string, value: number): void {
  const questionIndex = parseInt(radioName.replace('pcl5-q', ''), 10);
  if (pcl5Data.questions[questionIndex]) {
    pcl5Data.questions[questionIndex].selectedValue = value;
    calculatePCL5CriteriaAndSeverity(); // Recalculate before saving

    // Save to active encounter
    if (typeof window.updatePsychometricDataForActiveEncounter === 'function') {
        window.updatePsychometricDataForActiveEncounter('pcl5', { ...pcl5Data });
    }

    if (typeof renderPsychometricTerminal === 'function') {
        renderPsychometricTerminal();
    } else {
        console.error("renderPsychometricTerminal function is not available for PCL-5 handler.");
    }
  }
}