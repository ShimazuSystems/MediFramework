/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Part } from "@google/genai";
import * as domElements from '../dom/domElements'; 

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export async function fileToGenerativePart(file: File): Promise<Part | null> {
  const base64data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
  return { inlineData: { data: base64data, mimeType: file.type } };
}

export function updateSystemTime() {
    const now = new Date();
    if (domElements.systemTimeEl) {
        domElements.systemTimeEl.textContent = `TIME: ${now.toLocaleTimeString()}`;
    }
}

export function playButtonSound() {
    if (domElements.uiButtonSound && domElements.uiButtonSound.readyState >= 2) { // readyState 2 (HAVE_CURRENT_DATA) or higher
        domElements.uiButtonSound.currentTime = 0; // Rewind to start
        domElements.uiButtonSound.play().catch(error => console.warn("Error playing button sound:", error));
    }
}

export function playLongBeepSound() {
    if (domElements.uiLongBeepSound && domElements.uiLongBeepSound.readyState >= 2) {
        domElements.uiLongBeepSound.currentTime = 0;
        domElements.uiLongBeepSound.play().catch(error => console.warn("Error playing long beep sound:", error));
    }
}

export function playOnlineSound() {
    if (domElements.uiOnlineSound && domElements.uiOnlineSound.readyState >= 2) {
        domElements.uiOnlineSound.currentTime = 0;
        domElements.uiOnlineSound.play().catch(error => console.warn("Error playing online sound:", error));
    }
}