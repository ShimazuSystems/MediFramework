/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as bodySystemToolsState from '../state/bodySystemToolsState';
import { playButtonSound } from '../utils/helpers';

// Import individual tool rendering functions
import { renderCardiovascularToolsMenu, renderASCVDToolUI, handleASCVDInputChange, renderHeartRateZoneToolUI, handleHRZoneInputChange } from './cardiovascularTools';
import { renderNeurologicalToolsMenu, renderGCSToolUI, handleGCSInputChange, renderNIHSSToolUI } from './neurologicalTools';
import { renderRespiratoryToolsMenu, renderOxygenationIndexToolUI, handleOIInputChange, renderBICSToolUI, handleBICSInputChange } from './respiratoryTools';
import { renderGastrointestinalToolsMenu, renderRansonsCriteriaToolUI, handleRansonsCriteriaInputChange } from './gastrointestinalTools';
import { renderMusculoskeletalToolsMenu, renderFRAXToolUI, handleFRAXInputChange, renderROMTrackerToolUI, handleROMInputChange } from './musculoskeletalTools';
import { renderIntegumentaryToolsMenu, renderBurnCalculatorToolUI, handleBurnCalculatorInputChange, handleBurnCalculatorCheckboxChange } from './integumentaryTools';
import { renderEndocrineToolsMenu, renderThyroidFunctionToolUI, handleThyroidFunctionInputChange, renderDiabetesRiskToolUI, handleDiabetesRiskInputChange } from './endocrineTools';
import { renderHematologicLymphaticToolsMenu, renderCoagulationProfileToolUI, handleCoagulationProfileInputChange } from './hematologicLymphaticTools';
import { renderGeneralConstitutionalToolsMenu, renderConstitutionalSymptomAnalyzerToolUI, handleConstitutionalSymptomInputChange, handleConstitutionalSymptomCheckboxChange } from './generalConstitutionalTools';


// This function will be called by uiManager.updateRightPanelForSystem
export function renderBodySystemTools(systemName: string | null, toolsContainer: HTMLElement) {
    toolsContainer.innerHTML = ''; // Clear previous content

    if (!systemName) {
        toolsContainer.innerHTML = `
            <h3 class="resource-section-title">System-Specific Tools</h3>
            <p>Select a body system from the left to see relevant tools.</p>`;
        return;
    }

    const titleEl = document.createElement('h3');
    titleEl.className = 'resource-section-title';
    toolsContainer.appendChild(titleEl);

    const toolContentArea = document.createElement('div');
    toolContentArea.className = 'tool-content-area'; 
    toolsContainer.appendChild(toolContentArea);

    const activeCtx = bodySystemToolsState.bodySystemToolsState.activeToolContext;

    if (activeCtx && activeCtx.system === systemName && activeCtx.toolId) {
        titleEl.textContent = `${systemName} - ${activeCtx.toolId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`;
        renderSpecificToolUI(systemName, activeCtx.toolId, toolContentArea);
        
        const backButton = document.createElement('button');
        backButton.innerHTML = `&larr; Back to ${systemName} Tools Menu`;
        backButton.className = 'tool-menu-button back-button';
        backButton.onclick = () => {
            playButtonSound();
            bodySystemToolsState.setActiveSystemTool(systemName, null);
            renderBodySystemTools(systemName, toolsContainer); 
        };
        toolContentArea.appendChild(backButton);
    } else {
        titleEl.textContent = `${systemName} - Tools Menu`;
        renderSystemToolMenu(systemName, toolContentArea);
    }

    attachToolEventListeners(toolContentArea, systemName, toolsContainer);
}

function renderSystemToolMenu(systemName: string, container: HTMLElement) {
    switch (systemName) {
        case 'Cardiovascular':
            renderCardiovascularToolsMenu(container);
            break;
        case 'Neurological':
            renderNeurologicalToolsMenu(container);
            break;
        case 'Respiratory':
            renderRespiratoryToolsMenu(container);
            break;
        case 'Gastrointestinal':
            renderGastrointestinalToolsMenu(container);
            break;
        case 'Musculoskeletal':
            renderMusculoskeletalToolsMenu(container);
            break;
        case 'Integumentary':
            renderIntegumentaryToolsMenu(container);
            break;
        case 'Endocrine':
            renderEndocrineToolsMenu(container);
            break;
        case 'Hematologic/Lymphatic':
            renderHematologicLymphaticToolsMenu(container);
            break;
        case 'General/Constitutional':
            renderGeneralConstitutionalToolsMenu(container);
            break;
        default:
            container.innerHTML = `<p>No specific tools available for ${systemName} at this time.</p>`;
            break;
    }
}

function renderSpecificToolUI(systemName: string, toolId: string, container: HTMLElement) {
    (window as any).renderBodySystemToolContent(systemName, toolId, container);
}

(window as any).renderBodySystemToolContent = (systemName: string, toolId: string, currentContainer?: HTMLElement) => {
    const containerToRenderIn = currentContainer || document.querySelector('.tool-content-area');
    if (!containerToRenderIn) return;

    if (currentContainer) currentContainer.innerHTML = ''; // Clear only if it's a re-render of the specific tool view

    if (systemName === 'Cardiovascular') {
        if (toolId === 'ascvdRiskCalculator') renderASCVDToolUI(containerToRenderIn);
        else if (toolId === 'heartRateZoneCalculator') renderHeartRateZoneToolUI(containerToRenderIn);
    } else if (systemName === 'Neurological') {
        if (toolId === 'gcsCalculator') renderGCSToolUI(containerToRenderIn);
        else if (toolId === 'nihssPlaceholder') renderNIHSSToolUI(containerToRenderIn); 
    } else if (systemName === 'Respiratory') {
        if (toolId === 'oxygenationIndexCalculator') renderOxygenationIndexToolUI(containerToRenderIn);
        else if (toolId === 'bicsCalculator') renderBICSToolUI(containerToRenderIn);
    } else if (systemName === 'Gastrointestinal') {
        if (toolId === 'ransonsCriteria') renderRansonsCriteriaToolUI(containerToRenderIn);
    } else if (systemName === 'Musculoskeletal') {
        if (toolId === 'fraxCalculatorAI') renderFRAXToolUI(containerToRenderIn);
        else if (toolId === 'romTracker') renderROMTrackerToolUI(containerToRenderIn);
    } else if (systemName === 'Integumentary') {
        if (toolId === 'burnCalculatorAI') renderBurnCalculatorToolUI(containerToRenderIn);
    } else if (systemName === 'Endocrine') {
        if (toolId === 'thyroidFunctionAnalyzerAI') renderThyroidFunctionToolUI(containerToRenderIn);
        else if (toolId === 'diabetesRiskProfilerAI') renderDiabetesRiskToolUI(containerToRenderIn);
    } else if (systemName === 'Hematologic/Lymphatic') {
        if (toolId === 'coagulationProfileInterpreterAI') renderCoagulationProfileToolUI(containerToRenderIn);
    } else if (systemName === 'General/Constitutional') {
        if (toolId === 'constitutionalSymptomAnalyzerAI') renderConstitutionalSymptomAnalyzerToolUI(containerToRenderIn);
    }


    const toolsMainContainer = document.getElementById('component-specific-tools-container');
    if(toolsMainContainer && containerToRenderIn) {
      attachToolEventListeners(containerToRenderIn, systemName, toolsMainContainer);
    }
};


function attachToolEventListeners(container: HTMLElement, systemName: string, mainToolsContainer: HTMLElement) {
    container.querySelectorAll<HTMLButtonElement>('.tool-menu-button:not(.back-button)').forEach(button => {
        const newButton = button.cloneNode(true) as HTMLButtonElement;
        button.parentNode?.replaceChild(newButton, button);
        
        newButton.addEventListener('click', (e) => {
            const toolId = (e.currentTarget as HTMLElement).dataset.toolId;
            if (toolId) {
                playButtonSound();
                bodySystemToolsState.setActiveSystemTool(systemName, toolId);
                renderBodySystemTools(systemName, mainToolsContainer);
            }
        });
    });

    // Cardiovascular Tools Listeners
    if (systemName === 'Cardiovascular') {
        if (bodySystemToolsState.bodySystemToolsState.activeToolContext?.toolId === 'ascvdRiskCalculator') {
            const fields: (keyof bodySystemToolsState.ASCVDData)[] = ['age', 'totalCholesterol', 'hdlCholesterol', 'systolicBP'];
            fields.forEach(field => {
                container.querySelector<HTMLInputElement>(`input[name="ascvd-${field}"]`)?.addEventListener('input', (e) => {
                    handleASCVDInputChange(field, (e.target as HTMLInputElement).value);
                });
            });
            const selectFields: {name: keyof bodySystemToolsState.ASCVDData, id: string}[] = [
                {name: 'sex', id: 'ascvd-sex'}, {name: 'race', id: 'ascvd-race'},
                {name: 'onHypertensionTreatment', id: 'ascvd-onHypertensionTreatment'},
                {name: 'isDiabetic', id: 'ascvd-isDiabetic'}, {name: 'isSmoker', id: 'ascvd-isSmoker'}
            ];
            selectFields.forEach(sf => {
                 container.querySelector<HTMLSelectElement>(`#${sf.id}`)?.addEventListener('change', (e) => {
                    handleASCVDInputChange(sf.name, (e.target as HTMLSelectElement).value);
                });
            });
        }
        if (bodySystemToolsState.bodySystemToolsState.activeToolContext?.toolId === 'heartRateZoneCalculator') {
            container.querySelector<HTMLInputElement>('input[name="hrzone-age"]')?.addEventListener('input', (e) => {
                 handleHRZoneInputChange((e.target as HTMLInputElement).value);
            });
        }
    }

    // Neurological Tools Listeners
    if (systemName === 'Neurological' && bodySystemToolsState.bodySystemToolsState.activeToolContext?.toolId === 'gcsCalculator') {
        container.querySelectorAll<HTMLInputElement>('input[type="radio"][name^="gcs-"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const target = e.currentTarget as HTMLInputElement;
                const category = target.name.replace('gcs-', '') as 'eye' | 'verbal' | 'motor';
                handleGCSInputChange(category, parseInt(target.value));
            });
        });
    }
    
    // Respiratory Tools Listeners
    if (systemName === 'Respiratory') {
        if (bodySystemToolsState.bodySystemToolsState.activeToolContext?.toolId === 'oxygenationIndexCalculator') {
            const oiFields: (keyof bodySystemToolsState.OxygenationIndexData)[] = ['map', 'fio2', 'pao2'];
            oiFields.forEach(field => {
                container.querySelector<HTMLInputElement>(`input[name="oi-${field}"]`)?.addEventListener('input', (e) => {
                    handleOIInputChange(field, (e.target as HTMLInputElement).value);
                });
            });
        }
        if (bodySystemToolsState.bodySystemToolsState.activeToolContext?.toolId === 'bicsCalculator') {
            const bicsSliders: string[] = ['bics-coughSeverity', 'bics-sputumVolume', 'bics-wheezeFrequency'];
            bicsSliders.forEach(sliderId => {
                const slider = container.querySelector<HTMLInputElement>(`#${sliderId}`);
                if (slider) {
                    const newSlider = slider.cloneNode(true) as HTMLInputElement;
                    slider.parentNode?.replaceChild(newSlider, slider);
                    newSlider.addEventListener('input', (e) => {
                        const target = e.target as HTMLInputElement;
                        handleBICSInputChange(target.id, parseInt(target.value));
                        const outputEl = container.querySelector(`output[for="${target.id}"]`);
                        if (outputEl) outputEl.textContent = `Current: ${target.value}/10`;
                    });
                }
            });
        }
    }
    
    // Gastrointestinal Tools Listeners
    if (systemName === 'Gastrointestinal' && bodySystemToolsState.bodySystemToolsState.activeToolContext?.toolId === 'ransonsCriteria') {
        container.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name^="ransons-admission-"]').forEach(checkbox => {
            const newCheckbox = checkbox.cloneNode(true) as HTMLInputElement;
            checkbox.parentNode?.replaceChild(newCheckbox, checkbox);
            newCheckbox.addEventListener('change', (e) => {
                const target = e.currentTarget as HTMLInputElement;
                const criteriaKey = target.dataset.value as keyof bodySystemToolsState.RansonsCriteriaData;
                if(criteriaKey) handleRansonsCriteriaInputChange(criteriaKey, target.checked);
            });
        });
    }

    // Musculoskeletal Tools Listeners
    if (systemName === 'Musculoskeletal') {
        if (bodySystemToolsState.bodySystemToolsState.activeToolContext?.toolId === 'fraxCalculatorAI') {
            const fraxTextInputs: (keyof bodySystemToolsState.FRAXData)[] = ['age', 'weightKg', 'heightCm', 'bmdTscore'];
            fraxTextInputs.forEach(field => {
                container.querySelector<HTMLInputElement>(`input[name="frax-${field}"]`)?.addEventListener('input', (e) => {
                    handleFRAXInputChange(field, (e.target as HTMLInputElement).value);
                });
            });
            const fraxSelectInputs: { name: keyof bodySystemToolsState.FRAXData, id: string }[] = [
                { name: 'sex', id: 'frax-sex' }, { name: 'previousFracture', id: 'frax-previousFracture' },
                { name: 'parentFracturedHip', id: 'frax-parentFracturedHip' }, { name: 'currentSmoking', id: 'frax-currentSmoking' },
                { name: 'glucocorticoids', id: 'frax-glucocorticoids' }, { name: 'rheumatoidArthritis', id: 'frax-rheumatoidArthritis' },
                { name: 'secondaryOsteoporosis', id: 'frax-secondaryOsteoporosis' }, { name: 'alcoholThreeOrMoreUnitsPerDay', id: 'frax-alcoholThreeOrMoreUnitsPerDay' }
            ];
            fraxSelectInputs.forEach(sf => {
                container.querySelector<HTMLSelectElement>(`#${sf.id}`)?.addEventListener('change', (e) => {
                    handleFRAXInputChange(sf.name, (e.target as HTMLSelectElement).value);
                });
            });
        }
        if (bodySystemToolsState.bodySystemToolsState.activeToolContext?.toolId === 'romTracker') {
            container.querySelector<HTMLSelectElement>('#rom-selectedJoint')?.addEventListener('change', (e) => {
                handleROMInputChange('selectedJoint', (e.target as HTMLSelectElement).value);
            });
            container.querySelector<HTMLSelectElement>('#rom-selectedMotion')?.addEventListener('change', (e) => {
                handleROMInputChange('selectedMotion', (e.target as HTMLSelectElement).value);
            });
            container.querySelector<HTMLInputElement>('input[name="rom-measuredDegrees"]')?.addEventListener('input', (e) => {
                handleROMInputChange('measuredDegrees', (e.target as HTMLInputElement).value);
            });
        }
    }
    // Integumentary Tools Listeners
    if (systemName === 'Integumentary' && bodySystemToolsState.bodySystemToolsState.activeToolContext?.toolId === 'burnCalculatorAI') {
        container.querySelector<HTMLSelectElement>('#burn-burnDepth')?.addEventListener('change', (e) => {
            handleBurnCalculatorInputChange('burnDepth', (e.target as HTMLSelectElement).value);
        });
        container.querySelector<HTMLInputElement>('input[name="burn-patientAge"]')?.addEventListener('input', (e) => {
            handleBurnCalculatorInputChange('patientAge', (e.target as HTMLInputElement).value);
        });
        container.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name^="burn-affectedAreas-"]').forEach(checkbox => {
             const newCheckbox = checkbox.cloneNode(true) as HTMLInputElement; // Re-clone to ensure fresh listeners if re-rendered
            checkbox.parentNode?.replaceChild(newCheckbox, checkbox);
            newCheckbox.addEventListener('change', (e) => {
                const target = e.currentTarget as HTMLInputElement;
                handleBurnCalculatorCheckboxChange(target.name, target.dataset.value || '', target.checked);
            });
        });
    }
    // Endocrine Tools Listeners
    if (systemName === 'Endocrine') {
        if (bodySystemToolsState.bodySystemToolsState.activeToolContext?.toolId === 'thyroidFunctionAnalyzerAI') {
            const thyroidFields: (keyof bodySystemToolsState.ThyroidFunctionData)[] = ['tsh', 'freeT4', 'freeT3', 'antiTPO'];
            thyroidFields.forEach(field => {
                container.querySelector<HTMLInputElement>(`input[name="thyroid-${field}"]`)?.addEventListener('input', (e) => {
                    handleThyroidFunctionInputChange(field, (e.target as HTMLInputElement).value);
                });
            });
        }
        if (bodySystemToolsState.bodySystemToolsState.activeToolContext?.toolId === 'diabetesRiskProfilerAI') {
            const diabetesTextInputs: (keyof bodySystemToolsState.DiabetesRiskData)[] = ['age', 'bmi', 'hdlCholesterol'];
            diabetesTextInputs.forEach(field => {
                container.querySelector<HTMLInputElement>(`input[name="diabetes-${field}"]`)?.addEventListener('input', (e) => {
                    handleDiabetesRiskInputChange(field, (e.target as HTMLInputElement).value);
                });
            });
            const diabetesSelectInputs: { name: keyof bodySystemToolsState.DiabetesRiskData, id: string }[] = [
                { name: 'familyHistoryDiabetes', id: 'diabetes-familyHistoryDiabetes' },
                { name: 'gestationalDiabetes', id: 'diabetes-gestationalDiabetes' },
                { name: 'physicalActivity', id: 'diabetes-physicalActivity' },
                { name: 'raceEthnicity', id: 'diabetes-raceEthnicity' },
                { name: 'bloodPressureStatus', id: 'diabetes-bloodPressureStatus' }
            ];
            diabetesSelectInputs.forEach(sf => {
                container.querySelector<HTMLSelectElement>(`#${sf.id}`)?.addEventListener('change', (e) => {
                    handleDiabetesRiskInputChange(sf.name, (e.target as HTMLSelectElement).value);
                });
            });
        }
    }
    // Hematologic/Lymphatic Tools Listeners
    if (systemName === 'Hematologic/Lymphatic' && bodySystemToolsState.bodySystemToolsState.activeToolContext?.toolId === 'coagulationProfileInterpreterAI') {
        const coagFields: (keyof bodySystemToolsState.CoagulationProfileData)[] = ['pt', 'inr', 'aptt', 'fibrinogen', 'dDimer', 'clinicalContext'];
        coagFields.forEach(field => {
            const inputElement = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="coag-${field}"]`);
            if (inputElement) {
                const newElement = inputElement.cloneNode(true) as HTMLInputElement | HTMLTextAreaElement;
                inputElement.parentNode?.replaceChild(newElement, inputElement);
                newElement.addEventListener('input', (e) => {
                    handleCoagulationProfileInputChange(field, (e.target as HTMLInputElement | HTMLTextAreaElement).value);
                });
            }
        });
    }
    // General/Constitutional Tools Listeners
    if (systemName === 'General/Constitutional' && bodySystemToolsState.bodySystemToolsState.activeToolContext?.toolId === 'constitutionalSymptomAnalyzerAI') {
        // Checkboxes
        const constitutionalCheckboxes: (keyof bodySystemToolsState.ConstitutionalSymptomsData)[] = ['fever', 'fatigue', 'weightLoss', 'weightGain', 'malaise', 'chills', 'nightSweats'];
        constitutionalCheckboxes.forEach(field => {
            container.querySelector<HTMLInputElement>(`input[name="constitutional-${field}"]`)?.addEventListener('change', (e) => {
                handleConstitutionalSymptomCheckboxChange(field, (e.target as HTMLInputElement).checked);
            });
        });
        // Text inputs
        const constitutionalTextInputs: (keyof bodySystemToolsState.ConstitutionalSymptomsData)[] = ['feverTemp', 'weightLossAmount', 'weightGainAmount'];
        constitutionalTextInputs.forEach(field => {
            container.querySelector<HTMLInputElement>(`input[name="constitutional-${field}"]`)?.addEventListener('input', (e) => {
                handleConstitutionalSymptomInputChange(field, (e.target as HTMLInputElement).value);
            });
        });
        // Select
        container.querySelector<HTMLSelectElement>('#constitutional-fatigueSeverity')?.addEventListener('change', (e) => {
            handleConstitutionalSymptomInputChange('fatigueSeverity', (e.target as HTMLSelectElement).value as bodySystemToolsState.ConstitutionalSymptomsData['fatigueSeverity']);
        });
        // Textarea
        container.querySelector<HTMLTextAreaElement>('textarea[name="constitutional-otherSymptomsContext"]')?.addEventListener('input', (e) => {
            handleConstitutionalSymptomInputChange('otherSymptomsContext', (e.target as HTMLTextAreaElement).value);
        });
    }
}

(window as any).renderBodySystemTools = renderBodySystemTools;