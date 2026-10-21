import {validateParticipant} from './model.js';
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
export function validateConfig(config) {
  if (!config || !integer(config.size, 1, 100) || !(config.teams === null || integer(config.teams, 1, 1000))) throw new Error('Tamanho ou quantidade de equipes inválido.');
  if (!Array.isArray(config.positions) || !config.positions.length || config.positions.length > 30) throw new Error('Informe entre 1 e 30 posições.');
  const names = new Set(); const ids = new Set();
  for (const p of config.positions) {
    if (!p || typeof p.id !== 'string' || !p.id || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 60 || ids.has(p.id) || names.has(p.name.trim().toLowerCase()) || !integer(p.slots, 0, 100) || typeof p.mandatory !== 'boolean') throw new Error('Posições inválidas ou repetidas.');
    names.add(p.name.trim().toLowerCase());ids.add(p.id);
  }
  if (config.positions.reduce((sum, p) => sum + p.slots, 0) !== config.size) throw new Error('A soma das vagas por posição deve ser igual ao número de titulares.');
}
export function validateBackup(data) {
  if (!data || data.version !== 1 || !['football', 'volleyball'].includes(data.selected) || !data.sports) throw new Error('Formato de backup incompatível.');
  for (const key of ['football', 'volleyball']) {
    const s = data.sports[key];
    if (!s || typeof s.name !== 'string' || !integer(s.revision, 0, Number.MAX_SAFE_INTEGER) || !Array.isArray(s.participants) || s.participants.length > 10000) throw new Error('Dados da modalidade inválidos.');
    validateConfig(s.config);
    const ids = new Set();
    for (const p of s.participants) {if (!p || typeof p.id !== 'string' || !p.id || ids.has(p.id) || typeof p.secondary !== 'string') throw new Error('Identificador ou participante inválido.');validateParticipant(p, s);ids.add(p.id);}
    if (s.result !== null) validateResult(s.result, s);
  }
  return structuredClone(data);
}
function validateResult(result, sport) {
  if (!result || !integer(result.revision, 0, sport.revision) || !Array.isArray(result.teams) || !result.teams.length || typeof result.createdAt !== 'string' || !Number.isFinite(Date.parse(result.createdAt))) throw new Error('Resultado de backup inválido.');
  const ids = new Set();
  for (const team of result.teams) {
    if (typeof team.name !== 'string' || !Array.isArray(team.starters) || !team.starters.length || !Array.isArray(team.reserves)) throw new Error('Equipe inválida no backup.');
    for (const p of [...team.starters, ...team.reserves]) {
      if (!p || typeof p.id !== 'string' || !p.id || ids.has(p.id) || typeof p.name !== 'string' || typeof p.primary !== 'string' || typeof p.secondary !== 'string') throw new Error('Jogador inválido no resultado.');
      ids.add(p.id);
    }
    for (const p of team.starters) if (typeof p.assigned !== 'string' || !['primary','secondary','adapted'].includes(p.assignment)) throw new Error('Posição atribuída inválida.');
  }
  if (result.revision === sport.revision && (ids.size !== sport.participants.length || sport.participants.some(p => !ids.has(p.id)))) throw new Error('Resultado não corresponde aos participantes.');
}
