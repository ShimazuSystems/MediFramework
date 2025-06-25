/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Global types from globals.d.ts are automatically recognized by TypeScript.
// No runtime import is needed if it only contains 'declare global' or ambient declarations.

import { initializeApp } from './core/appCore';

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});
