/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, Chat, Content, Part } from "@google/genai";
import * as appState from '../state/appState';
import { SYSTEM_PROMPT } from "../config/constants";
import * as domElements from '../dom/domElements'; // Import domElements
import { playOnlineSound, playLongBeepSound } from '../utils/helpers';


export async function initializeGeminiAI(): Promise<boolean> {
    const statusEl = domElements.geminiApiStatusTextEl; 
    const disclaimerEl = domElements.mainDisclaimerEl;

    try {
      const newAiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      // Try to set AI instance first, but be prepared to unset it if test call fails
      appState.setAiInstance(newAiInstance); 

      // Perform a test call
      try {
        const response = await newAiInstance.models.generateContent({
          model: 'gemini-2.5-flash-preview-04-17',
          contents: 'Confirm API is operational by responding with "API OK".',
        });

        if (response && response.text && response.text.includes("API OK")) {
          if (statusEl) {
            statusEl.textContent = "GEMINI: ONLINE";
            statusEl.style.color = "var(--accent-green)";
          }
          if (disclaimerEl) {
            disclaimerEl.textContent = "User Data is stored locally. For authorized Personal Use only.";
          }
          return true; // Indicate success
        } else {
          throw new Error("API test call response was not as expected.");
        }
      } catch (testError) {
        console.error("Gemini API test call failed:", testError);
        if (statusEl) {
          statusEl.textContent = "GEMINI: OFFLINE";
          statusEl.style.color = "var(--accent-amber)";
        }
        if (disclaimerEl) {
          disclaimerEl.textContent = "SYSTEM OFFLINE. AI Test Call Failed. Check Console.";
          disclaimerEl.style.color = "var(--accent-amber)";
        }
        appState.setAiInstance(undefined as any); // Invalidate AI instance
        return false; // Indicate failure
      }
    } catch (initError) {
      console.error("Failed to initialize GoogleGenAI:", initError);
      if (statusEl) {
        statusEl.textContent = "GEMINI: OFFLINE";
        statusEl.style.color = "var(--accent-amber)";
      }
      if (disclaimerEl) {
        disclaimerEl.textContent = "SYSTEM OFFLINE. AI Initialization Failed. Check Console.";
        disclaimerEl.style.color = "var(--accent-amber)";
      }
      appState.setAiInstance(undefined as any); // Invalidate AI instance
      return false; // Indicate failure
    }
}

export function getActiveEncounterAI(): Chat | null {
    if (!appState.activeEncounterId || !appState.ai) return null;
    
    if (!appState.activeEncounterAIInstances[appState.activeEncounterId]) {
        const encounter = appState.patientEncounters.find(e => e.id === appState.activeEncounterId);
        if (encounter) {
            const history: Content[] = encounter.messages.map(msg => {
                const parts: Part[] = [{ text: msg.text }];
                // Note: File handling in history rehydration is simplified here.
                // If messages in history could contain files, this would need more complex logic
                // to reconstruct `Part` objects for files, possibly involving re-fetching or storing base64.
                // For now, assuming text-only history rehydration for chat.
                return { role: msg.role, parts };
            });

            appState.activeEncounterAIInstances[appState.activeEncounterId] = appState.ai.chats.create({
                model: 'gemini-2.5-flash-preview-04-17',
                config: { systemInstruction: SYSTEM_PROMPT },
                history: history
            });
        }
    }
    return appState.activeEncounterAIInstances[appState.activeEncounterId] || null;
}

export function rehydrateEncounterAIInstances() {
    if (!appState.ai) return;
    appState.patientEncounters.forEach(encounter => {
        if (!appState.activeEncounterAIInstances[encounter.id]) {
           const history: Content[] = encounter.messages.map(msg => {
             const parts: Part[] = [{ text: msg.text }];
             // Simplified history rehydration as above
             return { role: msg.role, parts };
           });
           appState.activeEncounterAIInstances[encounter.id] = appState.ai.chats.create({
             model: 'gemini-2.5-flash-preview-04-17',
             config: { systemInstruction: SYSTEM_PROMPT },
             history: history,
           });
        }
      });
}