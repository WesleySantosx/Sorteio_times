export const normalizeName = name => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
export const uid = () => globalThis.crypto.randomUUID();
const positions = (names, slots, mandatory = '') => names.map((name, index) => ({id: name, name, slots: slots[index], mandatory: name === mandatory}));
export function createState() {
  return {version: 1, selected: 'football', sports: {
    football: {name: 'Futebol suíço', participants: [], config: {size: 7, teams: null, positions: positions(['Goleiro', 'Defensor', 'Meio-campo', 'Atacante'], [1, 2, 2, 2], 'Goleiro')}, revision: 0, result: null},
    volleyball: {name: 'Vôlei', participants: [], config: {size: 6, teams: null, positions: positions(['Levantador', 'Ponteiro', 'Central', 'Oposto', 'Líbero', 'Flexível'], [1, 2, 2, 1, 0, 0])}, revision: 0, result: null}
  }};
}
export function validateParticipant(participant, sport) {
  if (typeof participant.name !== 'string' || !participant.name.trim() || participant.name.length > 120) throw new Error('Informe um nome com até 120 caracteres.');
  if (sport.participants.some(p => p.id !== participant.id && normalizeName(p.name) === normalizeName(participant.name))) throw new Error('Este nome já está cadastrado nesta modalidade.');
  const ids = sport.config.positions.map(p => p.id);
  if (!ids.includes(participant.primary) || (participant.secondary && !ids.includes(participant.secondary))) throw new Error('Selecione posições válidas.');
  if (participant.primary === participant.secondary) throw new Error('As posições principal e secundária devem ser diferentes.');
}
export function saveParticipant(sport, participant) {
  validateParticipant(participant, sport);
  const clean = {...participant, name: participant.name.trim().replace(/\s+/g, ' ')};
  const index = sport.participants.findIndex(p => p.id === clean.id);
  if (index < 0) sport.participants.push(clean); else sport.participants[index] = clean;
  sport.revision++;
}
