import {createState} from './model.js';
import {validateBackup} from './validation.js';
const KEY = 'em-campo-v1';
export function loadState() {const raw = localStorage.getItem(KEY);return raw ? parseBackup(raw) : createState();}
export function storeState(state) {localStorage.setItem(KEY, JSON.stringify(state));}
export function parseBackup(text) {try {return validateBackup(JSON.parse(text));} catch(error) {throw new Error(`Backup inválido: ${error.message}`);}}
export function downloadBackup(state) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], {type:'application/json'}));
  const link = document.createElement('a');link.href = url;link.download = `em-campo-backup-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(() => URL.revokeObjectURL(url), 1000);
}
