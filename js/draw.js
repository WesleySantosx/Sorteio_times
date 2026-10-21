import {estimate, eligible} from './estimate.js';
export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {const j = Math.floor(random() * (i + 1));[copy[i], copy[j]] = [copy[j], copy[i]];}
  return copy;
}
// Fluxo de custo mínimo: primeiro minimiza adaptações, depois posições secundárias.
// Arestas reversas permitem rever escolhas sem bloquear jogadores de posições raras.
function allocate(players, positions, count) {
  const source = 0, playerStart = 1, positionStart = players.length + 1, sink = positionStart + positions.length;
  const graph = Array.from({length:sink + 1}, () => []);
  function edge(from, to, capacity, cost) {
    const forward = {to, capacity, cost, reverse:graph[to].length};
    graph[from].push(forward);graph[to].push({to:from,capacity:0,cost:-cost,reverse:graph[from].length - 1});
    return forward;
  }
  const choices = [];
  players.forEach((p, i) => {
    edge(source, playerStart + i, 1, 0);
    positions.forEach((position, j) => {
      if (!position.slots || (position.mandatory && !eligible(p, position))) return;
      const assignment = p.primary === position.id ? 'primary' : p.secondary === position.id ? 'secondary' : 'adapted';
      const cost = assignment === 'primary' ? 0 : assignment === 'secondary' ? 1 : players.length + 1;
      choices.push({i,j,assignment,edge:edge(playerStart + i, positionStart + j, 1, cost)});
    });
  });
  positions.forEach((p, j) => edge(positionStart + j, sink, p.slots * count, 0));
  const required = positions.reduce((sum, p) => sum + p.slots * count, 0);
  for (let flow = 0; flow < required; flow++) {
    const distance = Array(graph.length).fill(Infinity), previous = [], queued = Array(graph.length).fill(false);
    distance[source] = 0;const queue = [source];queued[source] = true;
    for (let head = 0; head < queue.length; head++) {
      const node = queue[head];queued[node] = false;
      graph[node].forEach((e, index) => {
        if (e.capacity > 0 && distance[e.to] > distance[node] + e.cost) {
          distance[e.to] = distance[node] + e.cost;previous[e.to] = [node,index];
          if (!queued[e.to]) {queue.push(e.to);queued[e.to] = true;}
        }
      });
    }
    if (!Number.isFinite(distance[sink])) throw new Error('Não foi possível preencher todas as posições. Revise a configuração.');
    for (let node = sink; node !== source;) {const [from,index] = previous[node];const e = graph[from][index];e.capacity--;graph[node][e.reverse].capacity++;node = from;}
  }
  return choices.filter(choice => choice.edge.capacity === 0).map(({i,j,assignment}) => ({...players[i],assigned:positions[j].id,assignment}));
}
export function drawTeams(sport, random = Math.random) {
  const info = estimate(sport.participants, sport.config);
  if (info.error) throw new Error(info.error);
  const players = shuffle(sport.participants, random);
  const positions = shuffle(sport.config.positions, random);
  const allocated = allocate(players, positions, info.teams);
  const teams = Array.from({length:info.teams}, (_, index) => ({name:`Equipe ${teamLabel(index)}`,starters:[],reserves:[]}));
  for (const position of positions) {
    const group = allocated.filter(p => p.assigned === position.id);
    // Espalha adaptações e posições secundárias entre equipes, com desempates aleatórios.
    group.sort((a,b) => ({adapted:0,secondary:1,primary:2}[a.assignment] - {adapted:0,secondary:1,primary:2}[b.assignment]));
    const order = shuffle(teams, random).sort((a,b) => a.starters.filter(p => p.assignment !== 'primary').length - b.starters.filter(p => p.assignment !== 'primary').length);
    group.forEach((p,index) => order[index % order.length].starters.push(p));
  }
  const used = new Set(allocated.map(p => p.id));
  const reserves = shuffle(players.filter(p => !used.has(p.id)), random), order = shuffle(teams, random);
  reserves.forEach((p,index) => order[index % order.length].reserves.push({...p}));
  return {revision:sport.revision,createdAt:new Date().toISOString(),teams};
}
function teamLabel(index) {let label = '';for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) label = String.fromCharCode(65 + (n - 1) % 26) + label;return label;}
