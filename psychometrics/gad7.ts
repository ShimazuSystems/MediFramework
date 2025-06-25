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

interface GAD7Option { label: string; value: number }
interface GAD7Question {
  id: string;
  text: string;
  options: GAD7Option[];
  selectedValue: number | null;
}

const initialGAD7Questions: ReadonlyArray<Omit<GAD7Question, 'selectedValue'>> = [
    { id: 'gad7-q0', text: 'Feeling nervous, anxious, or on edge', options: [{label:'Not at all', value:0}, {label:'Several days', value:1}, {label:'More than half the days', value:2}, {label:'Nearly every day', value:3}]},
    { id: 'gad7-q1', text: 'Not being able to stop or control worrying', options: [{label:'Not at all', value:0}, {label:'Several days', value:1}, {label:'More than half the days', value:2}, {label:'Nearly every day',value:3}]},
    { id: 'gad7-q2', text: 'Worrying too much about different things', options: [{label:'Not at all', value:0}, {label:'Several days', value:1}, {label:'More than half the days', value:2}, {label:'Nearly every day', value:3}]},
    { id: 'gad7-q3', text: 'Trouble relaxing', options: [{label:'Not at all', value:0}, {label:'Several days', value:1}, {label:'More than half the days', value:2}, {label:'Nearly every day', value:3}]},
    { id: 'gad7-q4', text: 'Being so restless that it is hard to sit still', options: [{label:'Not at all', value:0}, {label:'Several days', value:1}, {label:'More than half the days', value:2}, {label:'Nearly every day', value:3}]},
    { id: 'gad7-q5', text: 'Becoming easily annoyed or irritable', options: [{label:'Not at all', value:0}, {label:'Several days', value:1}, {label:'More than half the days', value:2}, {label:'Nearly every day', value:3}]},
    { id: 'gad7-q6', text: 'Feeling afraid as if something awful might happen', options: [{label:'Not at all', value:0}, {label:'Several days', value:1}, {label:'More than half the days', value:2}, {label:'Nearly every day', value:3}]},
];

export let gad7Data: {
  questions: GAD7Question[];
  totalScore: number;
} = {
  questions: initialGAD7Questions.map(q => ({ ...q, selectedValue: null })),
  totalScore: 0,
};

export function initializeGAD7Data(savedData?: typeof gad7Data): void {
    if (savedData && savedData.questions && savedData.questions.length === initialGAD7Questions.length) {
        gad7Data.questions = JSON.parse(JSON.stringify(savedData.questions));
        gad7Data.totalScore = savedData.totalScore || 0;
    } else {
        gad7Data.questions = initialGAD7Questions.map(q => ({ ...q, selectedValue: null }));
        gad7Data.totalScore = 0;
    }
     let score = 0;
    gad7Data.questions.forEach(q => {
        if (q.selectedValue !== null) {
            score += q.selectedValue;
        }
    });
    gad7Data.totalScore = score;
}


export function renderGAD7Screen(): string {
    let content = `<div class='psych-module-content'><div class='psych-module-title'>GAD-7 GENERALIZED ANXIETY DISORDER SCREENING</div>`;
    content += `<p class="psych-assessment-instruction">Over the last 2 weeks, how often have you been bothered by the following problems?</p>`;
    
    gad7Data.totalScore = 0; // Recalculate score during render
    let questionsAnswered = 0;
    gad7Data.questions.forEach((q, index) => {
        content += `<div class="gad7-question">
            <p>[${index + 1}] ${q.text}</p>
            ${createUIRadioGroupHTML(q.id, q.options, q.selectedValue, index)}
        </div>`;
        if (q.selectedValue !== null) {
            gad7Data.totalScore += q.selectedValue;
            questionsAnswered++;
        }
    });

    let anxietyLevel = "Minimal";
    if (gad7Data.totalScore >= 15) anxietyLevel = "Severe";
    else if (gad7Data.totalScore >= 10) anxietyLevel = "Moderate";
    else if (gad7Data.totalScore >= 5) anxietyLevel = "Mild";

    content += `<div class="gad7-summary">
        PROGRESS: ${createUIProgressBarHTML(questionsAnswered, gad7Data.questions.length, `[${questionsAnswered}/${gad7Data.questions.length}] QUESTIONS`)}
        CURRENT SCORE: ${gad7Data.totalScore}    ANXIETY LEVEL: [${anxietyLevel.toUpperCase()}]
    </div>`;
    content += `<div class="psych-actions">${createPsychTerminalStyledText("[S]AVE PROGRESS    [Q]UIT ASSESSMENT")}</div>`;
    content += `<div class="psych-nav-options"><button data-nav-target="mainMenu">Back to Main Menu</button></div></div>`;
    return content;
}

export function handleGAD7OptionChange(radioName: string, value: number): void {
  const questionIndex = parseInt(radioName.replace('gad7-q', ''), 10);
  if (gad7Data.questions[questionIndex]) {
    gad7Data.questions[questionIndex].selectedValue = value;
    
    // Recalculate total score
    gad7Data.totalScore = 0;
    gad7Data.questions.forEach(q => {
        if (q.selectedValue !== null) {
            gad7Data.totalScore += q.selectedValue;
        }
    });

    // Save to active encounter
    if (typeof window.updatePsychometricDataForActiveEncounter === 'function') {
        window.updatePsychometricDataForActiveEncounter('gad7', { ...gad7Data });
    }
    
    if (typeof renderPsychometricTerminal === 'function') {
        renderPsychometricTerminal();
    } else {
        console.error("renderPsychometricTerminal function is not available for GAD-7 handler.");
    }
  }
}