import {validateConfig} from './validation.js';
export function updateConfig(sport, config) {
  validateConfig(config);
  const ids = config.positions.map(p => p.id);
  if (sport.participants.some(p => !ids.includes(p.primary) || (p.secondary && !ids.includes(p.secondary)))) throw new Error('Uma posição removida está em uso. Edite os participantes antes de removê-la.');
  sport.config = config;sport.revision++;
}
