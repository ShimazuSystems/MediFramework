/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Assume these are globally available from index.tsx or will be passed/imported
// These declarations help TypeScript understand that these functions exist elsewhere.
declare function createUIRadioGroupHTML(name: string, options: { label: string; value: number }[], selectedValue: number | null, questionIndex: number): string;
declare function createUIProgressBarHTML(value: number, max: number, text?: string, id?: string): string;
declare function renderPsychometricTerminal(): void; // To trigger re-render
declare function createPsychTerminalStyledText(text: string): string;


export interface PHQ9Option { label: string; value: number }
export interface PHQ9Question {
  id: string;
  text: string;
  options: PHQ9Option[];
  selectedValue: number | null;
}

// Initial questions structure - this should not change during runtime for a specific version of PHQ-9
const initialPHQ9Questions: ReadonlyArray<Omit<PHQ9Question, 'selectedValue'>> = [
    { id: 'phq9-q0', text: 'Little interest or pleasure in doing things', options: [{label:'Not at all', value:0}, {label:'Several days', value:1}, {label:'>Half the days', value:2}, {label:'Nearly every day', value:3}]},
    { id: 'phq9-q1', text: 'Feeling down, depressed, or hopeless', options: [{label:'Not at all', value:0}, {label:'Several days', value:1}, {label:'>Half the days', value:2}, {label:'Nearly every day',value:3}]},
    { id: 'phq9-q2', text: 'Trouble falling/staying asleep, sleeping too much', options: [{label:'Not at all', value:0}, {label:'Several days', value:1}, {label:'>Half the days', value:2}, {label:'Nearly every day', value:3}]},
    { id: 'phq9-q3', text: 'Feeling tired or having little energy', options: [{label:'Not at all', value:0}, {label:'Several days', value:1}, {label:'>Half the days', value:2}, {label:'Nearly every day', value:3}]},
    { id: 'phq9-q4', text: 'Poor appetite or overeating', options: [{label:'Not at all', value:0}, {label:'Several days', value:1}, {label:'>Half the days', value:2}, {label:'Nearly every day', value:3}]},
    { id: 'phq9-q5', text: 'Feeling bad about yourself - or that you are a failure or have let yourself or your family down', options: [{label:'Not at all', value:0}, {label:'Several days', value:1}, {label:'>Half the days', value:2}, {label:'Nearly every day', value:3}]},
    { id: 'phq9-q6', text: 'Trouble concentrating on things, such as reading the newspaper or watching television', options: [{label:'Not at all', value:0}, {label:'Several days', value:1}, {label:'>Half the days', value:2}, {label:'Nearly every day', value:3}]},
    { id: 'phq9-q7', text: 'Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual', options: [{label:'Not at all', value:0}, {label:'Several days', value:1}, {label:'>Half the days', value:2}, {label:'Nearly every day', value:3}]},
    { id: 'phq9-q8', text: 'Thoughts that you would be better off dead, or of hurting yourself', options: [{label:'Not at all', value:0}, {label:'Several days', value:1}, {label:'>Half the days', value:2}, {label:'Nearly every day', value:3}]},
];


export let phq9Data: {
  questions: PHQ9Question[];
  totalScore: number;
} = {
  questions: initialPHQ9Questions.map(q => ({ ...q, selectedValue: null })),
  totalScore: 0,
};

export function initializePHQ9Data(savedData?: typeof phq9Data): void {
    if (savedData && savedData.questions && savedData.questions.length === initialPHQ9Questions.length) {
        // Deep copy saved data to prevent shared references if savedData comes from another object
        phq9Data.questions = JSON.parse(JSON.stringify(savedData.questions));
        phq9Data.totalScore = savedData.totalScore || 0;
    } else {
        // Reset to initial default state
        phq9Data.questions = initialPHQ9Questions.map(q => ({ ...q, selectedValue: null }));
        phq9Data.totalScore = 0;
    }
    // Recalculate score just in case, or trust saved totalScore
    let score = 0;
    phq9Data.questions.forEach(q => {
        if (q.selectedValue !== null) {
            score += q.selectedValue;
        }
    });
    phq9Data.totalScore = score;
}


export function renderPHQ9Screen(): string {
    let content = `<div class='psych-module-content'><div class='psych-module-title'>PHQ-9 DEPRESSION SCREENING</div>`;
    content += `<p class="psych-assessment-instruction">Over the last 2 weeks, how often have you been bothered by:</p>`;
    
    phq9Data.totalScore = 0; // Recalculate score during render
    let questionsAnswered = 0;
    phq9Data.questions.forEach((q, index) => {
        content += `<div class="phq9-question">
            <p>[${index + 1}] ${q.text}</p>
            ${createUIRadioGroupHTML(q.id, q.options, q.selectedValue, index)}
        </div>`;
        if (q.selectedValue !== null) {
            phq9Data.totalScore += q.selectedValue;
            questionsAnswered++;
        }
    });

    const riskMap = { 0: "NONE", 1: "MINIMAL", 5: "MILD", 10: "MODERATE", 15: "MOD-SEVERE", 20: "SEVERE" };
    type RiskMapNumericKey = keyof typeof riskMap; 

    let riskLevel = "NONE";
    const sortedThresholds = Object.keys(riskMap).map(Number).sort((a,b) => a - b);

    for (const threshold of sortedThresholds) {
        if (phq9Data.totalScore >= threshold) {
            riskLevel = riskMap[threshold as RiskMapNumericKey];
        } else {
            break; 
        }
    }
    
    content += `<div class="phq9-summary">
        PROGRESS: ${createUIProgressBarHTML(questionsAnswered, phq9Data.questions.length, `[${questionsAnswered}/${phq9Data.questions.length}] QUESTIONS`)}
        CURRENT SCORE: ${phq9Data.totalScore}    RISK: [${riskLevel}]
    </div>`;
    content += `<div class="psych-actions">${createPsychTerminalStyledText("[S]AVE PROGRESS    [Q]UIT ASSESSMENT")}</div>`;
    content += `<div class="psych-nav-options"><button data-nav-target="mainMenu">Back to Main Menu</button></div></div>`;
    return content;
}

export function handlePHQ9OptionChange(radioName: string, value: number): void {
  const questionIndex = parseInt(radioName.replace('phq9-q', ''), 10);
  if (phq9Data.questions[questionIndex]) {
    phq9Data.questions[questionIndex].selectedValue = value;

    // Recalculate total score
    phq9Data.totalScore = 0;
    phq9Data.questions.forEach(q => {
        if (q.selectedValue !== null) {
            phq9Data.totalScore += q.selectedValue;
        }
    });
    
    // Save to active encounter
    if (typeof window.updatePsychometricDataForActiveEncounter === 'function') {
        window.updatePsychometricDataForActiveEncounter('phq9', { ...phq9Data });
    }

    if (typeof renderPsychometricTerminal === 'function') {
        renderPsychometricTerminal();
    } else {
        console.error("renderPsychometricTerminal function is not available for PHQ-9 handler.");
    }
  }
}