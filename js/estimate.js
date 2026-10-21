import {validateConfig} from './validation.js';
export function eligible(player, position) {return player.primary === position.id || player.secondary === position.id;}
// Matching global evita contar duas vezes quem pode cobrir duas posições obrigatórias.
export function mandatoryFeasible(participants, config, count) {
  const slots = config.positions.filter(p => p.mandatory).flatMap(p => Array(count * p.slots).fill(p));
  const owners = new Map();
  function match(index, visited) {
    for (let i = 0; i < participants.length; i++) {
      if (visited.has(i) || !eligible(participants[i], slots[index])) continue;
      visited.add(i);
      if (!owners.has(i) || match(owners.get(i), visited)) {owners.set(i, index);return true;}
    }
    return false;
  }
  return slots.every((_, index) => match(index, new Set()));
}
export function estimate(participants, config) {
  validateConfig(config);
  const capacity = Math.floor(participants.length / config.size);
  let low = 0, high = capacity;
  while (low < high) {const mid = Math.ceil((low + high) / 2);if (mandatoryFeasible(participants, config, mid)) low = mid;else high = mid - 1;}
  const feasible = low;
  const teams = config.teams === null ? feasible : config.teams;
  const error = teams > feasible ? `A quantidade solicitada excede o limite de ${feasible} equipe(s) viável(is).` : teams < 1 ? 'Ainda não há participantes aptos suficientes para formar uma equipe completa.' : '';
  return {capacity, feasible, teams: error ? 0 : teams, reserves: error ? participants.length : participants.length - teams * config.size, error, limited: feasible < capacity};
}
