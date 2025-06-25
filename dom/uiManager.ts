/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as appState from '../state/appState';
import * as domElements from './domElements';
import { BODY_SYSTEMS, SEVERITY_COLORS } from '../config/constants';
import { savePatientEncounters } from '../components/encounterManager'; // Assuming this will be created

// Forward declare renderBodySystemTools from bodySystemToolsController
declare function renderBodySystemTools(systemName: string | null, toolsContainer: HTMLElement): void;


export function renderMessages() {
  const currentChatHistoryEl = document.getElementById('chat-history'); // Query fresh, in case it's recreated
  if (!currentChatHistoryEl) return;

  currentChatHistoryEl.innerHTML = '';
  const activeEncounter = appState.getActiveEncounter();
  if (!activeEncounter) return;

  activeEncounter.messages.forEach(msg => {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', msg.role);
    msgDiv.setAttribute('aria-role', 'listitem');

    let messageText = msg.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const timestampPrefix = msg.timestamp ? `<span class="message-timestamp">${msg.timestamp}</span>` : "";
    
    if (msg.role === 'model') {
        if (messageText.startsWith('**MEDIFRAMEWORK:**')) {
            messageText = `<strong>MEDIFRAMEWORK:</strong>${messageText.substring('**MEDIFRAMEWORK:**'.length)}`;
        } else if (messageText.startsWith('MEDIFRAMEWORK:')) {
             messageText = `<strong>MEDIFRAMEWORK:</strong>${messageText.substring('MEDIFRAMEWORK:'.length)}`;
        }
        messageText = messageText.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>'); 
        messageText = messageText.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>'); 
        messageText = messageText.replace(/~~(.*?)~~/g, '<del>$1</del>'); 
        messageText = messageText.replace(/```(\w*)\n([\s\S]*?)\n```/g, (_match, lang, code) => { 
            const languageClass = lang ? `language-${lang}` : '';
            return `<pre><code class="${languageClass}">${code.trim()}</code></pre>`;
        });
        messageText = messageText.replace(/`([^`]+)`/g, '<code>$1</code>'); 
        
        const listRegex = /^\s*([*-]|\d+\.)\s+(.*)/gm;
        let listMatches;
        let inList = false;
        let listType = ''; 
        let processedText = '';
        let lastIndex = 0;

        while((listMatches = listRegex.exec(messageText)) !== null) {
            processedText += messageText.substring(lastIndex, listMatches.index);
            const marker = listMatches[1];
            const item = listMatches[2];
            const currentListType = (marker === '*' || marker === '-') ? 'ul' : 'ol';

            if (!inList) {
                inList = true;
                listType = currentListType;
                processedText += `<${listType}>`;
            } else if (listType !== currentListType) {
                processedText += `</${listType}><${currentListType}>`;
                listType = currentListType;
            }
            processedText += `<li>${item}</li>`;
            lastIndex = listRegex.lastIndex;
        }
        processedText += messageText.substring(lastIndex);
        if (inList) {
            processedText += `</${listType}>`;
        }
        messageText = processedText;
        
        messageText = messageText.replace(/\n/g, '<br>'); 
        messageText = messageText.replace(/<br>\s*(<\/?(ul|ol|li)>)/gi, '$1');
        messageText = messageText.replace(/(<\/(ul|ol|li)>)\s*<br>/gi, '$1');
    }
    
    msgDiv.innerHTML = timestampPrefix + messageText;

    if (msg.files && msg.files.length > 0) {
      const filesDiv = document.createElement('div');
      filesDiv.className = 'message-files';
      filesDiv.innerHTML = `<strong>Attached Files:</strong><ul>${msg.files.map(f => `<li>${f.name} (${(f.size / 1024).toFixed(1)}KB)</li>`).join('')}</ul>`;
      msgDiv.appendChild(filesDiv);
    }
    
    if (msg.groundingChunks && msg.groundingChunks.length > 0) {
        const groundingDiv = document.createElement('div');
        groundingDiv.className = 'grounding-sources';
        let groundingHtml = '<h4>Sources:</h4><ul>';
        msg.groundingChunks.forEach(chunk => {
            if (chunk.web && chunk.web.uri) {
                groundingHtml += `<li><a href="${chunk.web.uri}" target="_blank" rel="noopener noreferrer">${chunk.web.title || chunk.web.uri}</a></li>`;
            }
        });
        groundingHtml += '</ul>';
        groundingDiv.innerHTML = groundingHtml;
        msgDiv.appendChild(groundingDiv);
    }

    currentChatHistoryEl.appendChild(msgDiv);
  });
  currentChatHistoryEl.scrollTop = currentChatHistoryEl.scrollHeight;
}

export function renderUploadedFiles() {
  const currentUploadedFilesListEl = document.getElementById('uploaded-files-list'); // Query fresh
  const currentDropPromptEl = document.getElementById('drop-prompt'); // Query fresh
  if (!currentUploadedFilesListEl || !currentDropPromptEl) return;
  
  currentUploadedFilesListEl.innerHTML = '';
  if (appState.uploadedFileObjects.length > 0) {
    currentDropPromptEl.style.display = 'none';
  } else {
    currentDropPromptEl.style.display = 'block';
  }

  appState.uploadedFileObjects.forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'uploaded-file-item';
    fileItem.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    
    const removeButton = document.createElement('button');
    removeButton.innerHTML = '&times;';
    removeButton.setAttribute('aria-label', `Remove ${file.name}`);
    removeButton.onclick = () => {
      (window as any).playButtonSound?.(); // Assuming playButtonSound is global or imported
      appState.removeUploadedFile(index);
      renderUploadedFiles();
    };
    fileItem.appendChild(removeButton);
    currentUploadedFilesListEl.appendChild(fileItem);
  });
}

export function renderNotes() {
  const activeEncounter = appState.getActiveEncounter();
  const notesToRender = activeEncounter ? activeEncounter.notes : { redFlags: [], symptoms: [], diagnoses: [], medications: [], followUp: [], patientEducation: [] };

  const renderList = (listEl: HTMLElement, items: string[]) => {
    listEl.innerHTML = '';
    if (items && items.length > 0) {
      items.forEach(itemText => {
        const li = document.createElement('li');
        li.textContent = itemText;
        listEl.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'N/A';
      li.classList.add('na-item');
      listEl.appendChild(li);
    }
  };

  if (domElements.notesRedFlagsListEl) renderList(domElements.notesRedFlagsListEl, notesToRender.redFlags);
  if (domElements.notesSymptomsListEl) renderList(domElements.notesSymptomsListEl, notesToRender.symptoms);
  if (domElements.notesDiagnosesListEl) renderList(domElements.notesDiagnosesListEl, notesToRender.diagnoses);
  if (domElements.notesMedicationsListEl) renderList(domElements.notesMedicationsListEl, notesToRender.medications);
  if (domElements.notesFollowUpListEl) renderList(domElements.notesFollowUpListEl, notesToRender.followUp);
  if (domElements.notesPatientEducationListEl) renderList(domElements.notesPatientEducationListEl, notesToRender.patientEducation);
}

export function setLoading(state: boolean) {
  appState.setIsLoading(state);
  if (domElements.loadingIndicatorEl) {
    domElements.loadingIndicatorEl.style.display = appState.isLoading ? 'flex' : 'none';
  }
  
  const currentSendButtonEl = document.getElementById('send-button') as HTMLButtonElement | null;
  const currentChatInputEl = document.getElementById('chat-input') as HTMLTextAreaElement | null;

  if(currentSendButtonEl) currentSendButtonEl.disabled = appState.isLoading;
  if(currentChatInputEl) currentChatInputEl.disabled = appState.isLoading;
  
  if (domElements.newEncounterButtonEl) domElements.newEncounterButtonEl.disabled = appState.isLoading;
  if (domElements.bodySystemTabsEl) {
    domElements.bodySystemTabsEl.querySelectorAll<HTMLButtonElement>('.system-tab-button').forEach(btn => btn.disabled = state);
  }
}

export function displaySystemError(message: string, isNexusError: boolean = false) {
    const targetEl = isNexusError && document.getElementById('chat-history') 
                   ? document.getElementById('chat-history') 
                   : document.getElementById('chat-history'); // Fallback or primary for general errors
    
    if (!targetEl) {
        console.error("System Error: Target element not found for error message. Message:", message);
        alert(`System Error: ${message}`);
        setLoading(false);
        return;
    }
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message model error';
    errorDiv.textContent = `System Error: ${message}`;
    targetEl.appendChild(errorDiv);
    targetEl.scrollTop = targetEl.scrollHeight;
    setLoading(false);
}

export function renderPatientEncountersList() {
    if (!domElements.patientEncountersListEl) return;
    domElements.patientEncountersListEl.innerHTML = '';
    const sortedEncounters = [...appState.patientEncounters].sort((a, b) => b.lastActivityAt - a.lastActivityAt);

    sortedEncounters.forEach(encounter => {
        const li = document.createElement('li');
        li.className = 'patient-encounter-item';
        li.setAttribute('role', 'option');
        li.dataset.encounterId = encounter.id;
        if (encounter.id === appState.activeEncounterId) {
            li.classList.add('active');
            li.setAttribute('aria-selected', 'true');
        } else {
            li.setAttribute('aria-selected', 'false');
        }

        const nameSpan = document.createElement('span');
        nameSpan.className = 'encounter-name';
        nameSpan.textContent = encounter.name; 
        
        const timestampSpan = document.createElement('span');
        timestampSpan.className = 'encounter-timestamp';
        timestampSpan.textContent = new Date(encounter.lastActivityAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-encounter-button';
        deleteButton.innerHTML = '&times;'; // Unicode multiplication sign as delete icon
        deleteButton.setAttribute('aria-label', `Delete encounter: ${encounter.name}`);
        deleteButton.onclick = (e) => {
            (window as any).playButtonSound?.();
            e.stopPropagation(); 
            (window as any).handleDeleteEncounter?.(encounter.id);
        };

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        // Removed individual rename button
        buttonContainer.appendChild(deleteButton);
        
        li.appendChild(nameSpan);
        li.appendChild(timestampSpan);
        li.appendChild(buttonContainer);

        li.onclick = () => {
            (window as any).playButtonSound?.();
            (window as any).handleSwitchEncounter?.(encounter.id); 
        }
        domElements.patientEncountersListEl.appendChild(li);
    });

    // Enable/disable the header rename button based on active encounter
    if (domElements.renameActiveEncounterButtonEl) {
        domElements.renameActiveEncounterButtonEl.disabled = !appState.activeEncounterId;
    }
}

export function updatePatientCoreInfo() {
    const activeEncounter = appState.getActiveEncounter();
    if (domElements.currentPatientIdEl) {
        if (activeEncounter) {
            domElements.currentPatientIdEl.textContent = activeEncounter.name; 
        } else {
            domElements.currentPatientIdEl.textContent = "N/A";
        }
    }
}

export function renderBodySystemTabs() {
    if (!domElements.bodySystemTabsEl) return;
    domElements.bodySystemTabsEl.innerHTML = '';
    const activeEncounter = appState.getActiveEncounter();
    if (!activeEncounter || !activeEncounter.bodySystemSeverities) return;

    BODY_SYSTEMS.forEach(systemName => {
        const tabButton = document.createElement('button');
        tabButton.className = 'system-tab-button';
        tabButton.dataset.systemName = systemName;
        tabButton.setAttribute('role', 'tab');

        const severityIndicator = document.createElement('span');
        severityIndicator.className = 'severity-indicator';
        
        if (systemName === appState.activeSystemTab) {
            severityIndicator.style.backgroundColor = 'var(--accent-green)'; // Highlighted color for active tab
            tabButton.classList.add('active');
            tabButton.setAttribute('aria-selected', 'true');
        } else {
            const severityKey = activeEncounter.bodySystemSeverities[systemName] || 'noData';
            severityIndicator.style.backgroundColor = SEVERITY_COLORS[severityKey as keyof typeof SEVERITY_COLORS];
            tabButton.setAttribute('aria-selected', 'false');
        }
        
        tabButton.appendChild(severityIndicator);
        tabButton.appendChild(document.createTextNode(systemName));

        tabButton.addEventListener('click', () => {
            (window as any).playButtonSound?.();
            handleSystemTabClick(systemName);
        });
        domElements.bodySystemTabsEl.appendChild(tabButton);
    });
}

export function handleSystemTabClick(systemName: string) {
    appState.setActiveSystemTab(systemName);
    renderBodySystemTabs();
    updateCenterPanelForSystem(systemName);
    updateRightPanelForSystem(systemName);

    // This severity update logic seems like it should be part of the actual assessment for that system,
    // not just clicking the tab. For now, preserving existing behavior but noting it for review.
    /*
    const activeEncounter = appState.getActiveEncounter();
    if (activeEncounter && activeEncounter.bodySystemSeverities) {
        const currentSeverity = activeEncounter.bodySystemSeverities[systemName];
        const SEVERITY_LEVELS = Object.keys(SEVERITY_COLORS);
        let currentIndex = SEVERITY_LEVELS.indexOf(currentSeverity);
        currentIndex = (currentIndex + 1) % SEVERITY_LEVELS.length;
        activeEncounter.bodySystemSeverities[systemName] = SEVERITY_LEVELS[currentIndex];
        renderBodySystemTabs(); 
        savePatientEncounters(); 
    }
    */
}


export function updateCenterPanelForSystem(systemName: string | null) {
    if (domElements.currentSelectedSystemNameEl && domElements.selectedSystemDisplayHeaderEl) {
        if (systemName) {
            domElements.currentSelectedSystemNameEl.textContent = systemName;
            domElements.selectedSystemDisplayHeaderEl.style.display = 'block';
        } else {
            domElements.currentSelectedSystemNameEl.textContent = 'None';
            domElements.selectedSystemDisplayHeaderEl.style.display = 'none';
        }
    }
}

export function updateRightPanelForSystem(systemName: string | null) {
    // Update System-Specific Tools section
    if (domElements.componentSpecificToolsContainerEl) {
        if (typeof (window as any).renderBodySystemTools === 'function') {
            (window as any).renderBodySystemTools(systemName, domElements.componentSpecificToolsContainerEl);
        } else {
            // Fallback if the controller/function isn't ready
            const toolsTitleEl = domElements.componentSpecificToolsContainerEl.querySelector('.resource-section-title') || document.createElement('h3');
            if (!domElements.componentSpecificToolsContainerEl.contains(toolsTitleEl)) {
                 toolsTitleEl.className = 'resource-section-title';
                 domElements.componentSpecificToolsContainerEl.prepend(toolsTitleEl);
            }
            (toolsTitleEl as HTMLElement).textContent = 'System-Specific Tools';
            
            const toolsParagraphEl = domElements.componentSpecificToolsContainerEl.querySelector('p') || document.createElement('p');
             if (!domElements.componentSpecificToolsContainerEl.contains(toolsParagraphEl)) {
                 domElements.componentSpecificToolsContainerEl.appendChild(toolsParagraphEl);
            }
            toolsParagraphEl.textContent = systemName 
                ? `Tools for ${systemName} will appear here.` 
                : "Select a body system from the left to see relevant tools.";
        }
    }
}

export function showRenameModal(currentName: string) {
    if (domElements.renameModalEl && domElements.renameModalInputEl && domElements.renameModalTitleEl) {
        domElements.renameModalInputEl.value = currentName;
        // Optionally update modal title if it needs to be dynamic, though it's static "Rename Patient"
        // domElements.renameModalTitleEl.textContent = `Rename Patient: ${currentName}`; 
        domElements.renameModalEl.style.display = 'flex';
        domElements.renameModalInputEl.focus();
        domElements.renameModalInputEl.select();
    }
}

export function hideRenameModal() {
    if (domElements.renameModalEl && domElements.renameModalInputEl) {
        domElements.renameModalEl.style.display = 'none';
        domElements.renameModalInputEl.value = ''; // Clear input
    }
}