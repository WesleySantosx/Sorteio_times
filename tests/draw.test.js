import test from 'node:test';
import assert from 'node:assert/strict';
import {createState, saveParticipant} from '../js/model.js';
import {estimate} from '../js/estimate.js';
import {drawTeams} from '../js/draw.js';
import {parseBackup} from '../js/storage.js';
import {validateConfig} from '../js/validation.js';
function football(total, keepers = 4) {const s = createState().sports.football;s.participants = Array.from({length:total}, (_,i) => ({id:String(i),name:`Pessoa ${i}`,primary:i < keepers ? 'Goleiro' : 'Atacante',secondary:''}));return s;}
function invariant(s, result) {
  const players = result.teams.flatMap(t => [...t.starters,...t.reserves]);assert.equal(players.length,s.participants.length);assert.equal(new Set(players.map(p => p.id)).size,s.participants.length);
  const reserves = result.teams.map(t => t.reserves.length);assert.ok(Math.max(...reserves)-Math.min(...reserves)<=1);
  for (const team of result.teams) {assert.equal(team.starters.length,s.config.size);for (const p of s.config.positions) {const members = team.starters.filter(m => m.assigned === p.id);assert.equal(members.length,p.slots);if(p.mandatory) assert.ok(members.every(m => m.primary === p.id || m.secondary === p.id));}}
}
for (const total of [28,31,35,50]) test(`${total} inscritos: titulares, reservas, posições e unicidade`, () => {const s=football(total);const r=drawTeams(s);invariant(s,r);assert.equal(r.teams.length,Math.min(4,Math.floor(total/7)));});
test('insuficientes e ausência de goleiros impedem sorteio', () => {for(const s of [football(6),football(28,0)]) assert.throws(()=>drawTeams(s));});
test('insuficiência de goleiros reduz equipes e recalcula reservas', () => {const s=football(31,3);const e=estimate(s.participants,s.config);assert.equal(e.teams,3);assert.equal(e.reserves,10);invariant(s,drawTeams(s));});
test('posições secundárias cobrem goleiro', () => {const s=football(28,3);s.participants[8].secondary='Goleiro';const r=drawTeams(s);invariant(s,r);assert.equal(r.teams.length,4);assert.ok(r.teams.flatMap(t=>t.starters).some(p=>p.id==='8'&&p.assignment==='secondary'));});
test('excesso de atacantes gera adaptações de linha identificadas', () => {const s=football(28);const r=drawTeams(s);invariant(s,r);assert.ok(r.teams.flatMap(t=>t.starters).some(p=>p.assignment==='adapted'));});
test('configuração manual inviável é recusada', () => {const s=football(28,3);s.config.teams=4;assert.throws(()=>drawTeams(s));s.config.teams=2;invariant(s,drawTeams(s));});
test('matching de aptidões obrigatórias compartilhadas não duplica jogadores', () => {const s=football(14,2);s.config.positions[1].mandatory=true;s.participants[0].secondary='Defensor';assert.equal(estimate(s.participants,s.config).teams,0);});
test('vôlei com posições repetidas permite adaptação sem exigir líbero', () => {const s=createState().sports.volleyball;s.participants=football(19,0).participants.map(p=>({...p,primary:'Ponteiro'}));invariant(s,drawTeams(s));});
test('preferência global por principais evita usar secundária desnecessariamente', () => {const s=football(14,2);const positions=['Defensor','Defensor','Meio-campo','Meio-campo','Atacante','Atacante'];s.participants.slice(2).forEach((p,i)=>p.primary=positions[i%6]);assert.ok(drawTeams(s).teams.flatMap(t=>t.starters).every(p=>p.assignment==='primary'));});
test('sorteio não favorece apenas os primeiros cadastrados', () => {const s=football(31,5);const signatures=new Set(Array.from({length:15},()=>drawTeams(s).teams.flatMap(t=>t.reserves).map(p=>p.id).sort().join(',')));assert.ok(signatures.size>1);});
test('backups inválidos e configurações inconsistentes', () => {for(const text of ['{','{}','null',JSON.stringify({...createState(),version:2})]) assert.throws(()=>parseBackup(text));const state=createState();state.sports.football.config.size=8;assert.throws(()=>parseBackup(JSON.stringify(state)));assert.throws(()=>validateConfig({size:0}));});
test('backup válido com resultado e resultado desatualizado', () => {const state=createState();state.sports.football=football(31);state.sports.football.result=drawTeams(state.sports.football);assert.deepEqual(parseBackup(JSON.stringify(state)),state);state.sports.football.participants.pop();state.sports.football.revision++;assert.deepEqual(parseBackup(JSON.stringify(state)),state);});
test('cadastro rejeita nomes repetidos com caixa e espaços diferentes', () => {const s=football(7,1);saveParticipant(s,{id:'x',name:' Ana   Santos ',primary:'Atacante',secondary:''});assert.throws(()=>saveParticipant(s,{id:'y',name:'ana santos',primary:'Defensor',secondary:''}));});
test('estresse de invariantes em 100 sorteios', () => {for(let i=0;i<100;i++){const s=football(7+i%43,1+i%6);invariant(s,drawTeams(s));}});
