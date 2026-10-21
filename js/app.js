import {estimate} from './estimate.js';
import {updateConfig} from './settings.js';
import {createState, uid, saveParticipant} from './model.js';
import {loadState, storeState, parseBackup, downloadBackup} from './storage.js';
let loadError;
let state;
try {state = loadState();} catch(error) {state = createState();loadError = error.message;}
let selected = state.selected;
const $ = selector => document.querySelector(selector);
const sport = () => state.sports[selected];
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let toastTimer;
function notify(message) {$('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').hidden = true, 5500);}
function persist() {try {storeState(state);} catch {notify('Não foi possível salvar no navegador. Exporte um backup antes de sair.');}}
function tab(id) {document.querySelectorAll('.panel').forEach(panel => panel.hidden = panel.id !== id);document.querySelectorAll('[data-tab]').forEach(button => button.classList.toggle('active', button.dataset.tab === id));}
document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => tab(button.dataset.tab)));
function options(blank = '') {return blank + sport().config.positions.map(p => `<option value="${escape(p.id)}">${escape(p.name)}</option>`).join('');}
function resetForm() {$('#participant-form').reset();$('#participant-id').value = '';$('#form-title').textContent = 'Adicionar participante';$('#participant-form button[type="submit"]').textContent = '+ Adicionar participante';$('#cancel-edit').hidden = true;}
function renderList() {
  const query = $('#search').value.trim().toLocaleLowerCase('pt-BR');
  const position = $('#position-filter').value;
  const people = sport().participants.filter(p => p.name.toLocaleLowerCase('pt-BR').includes(query) && (!position || p.primary === position || p.secondary === position));
  $('#participant-list').innerHTML = people.length ? people.map(p => `<div class="person"><span class="avatar" aria-hidden="true">${escape(p.name.split(' ').map(n => n[0]).slice(0,2).join(''))}</span><div class="person-info"><strong>${escape(p.name)}</strong><small>${escape(p.primary)}${p.secondary ? ` · Secundária: ${escape(p.secondary)}` : ''}</small></div><button data-edit="${escape(p.id)}" aria-label="Editar ${escape(p.name)}">Editar</button><button data-delete="${escape(p.id)}" class="danger" aria-label="Excluir ${escape(p.name)}">Excluir</button></div>`).join('') : `<div class="empty"><div class="symbol" aria-hidden="true">♧</div><strong>${sport().participants.length ? 'Nenhum participante encontrado' : 'A equipe começa com o primeiro nome'}</strong><p>${sport().participants.length ? 'Tente outro nome ou posição.' : 'Adicione os participantes ao lado para preparar o sorteio.'}</p></div>`;
}
function render() {
  $('#sport-label').textContent = sport().name; $('#count').textContent = sport().participants.length;
  $('#primary').innerHTML = options();$('#secondary').innerHTML = options('<option value="">Nenhuma</option>');$('#position-filter').innerHTML = options('<option value="">Todas as posições</option>');
  document.querySelectorAll('[data-sport]').forEach(b => b.classList.toggle('active', b.dataset.sport === selected));
  renderList();renderSettings();renderEstimate();
}
function changed() {persist();render();}
document.querySelectorAll('[data-sport]').forEach(b => b.addEventListener('click', () => {selected = b.dataset.sport;state.selected = selected;$('#search').value = '';resetForm();changed();}));
$('#participant-form').addEventListener('submit', event => {event.preventDefault();try {saveParticipant(sport(), {id: $('#participant-id').value || uid(), name: $('#name').value, primary: $('#primary').value, secondary: $('#secondary').value});resetForm();changed();notify('Participante salvo.');} catch(error) {notify(error.message);}});
$('#cancel-edit').addEventListener('click', resetForm);
$('#search').addEventListener('input', renderList);$('#position-filter').addEventListener('change', renderList);
$('#participant-list').addEventListener('click', event => {
  const edit = event.target.closest('[data-edit]'); const remove = event.target.closest('[data-delete]');
  if (edit) {const p = sport().participants.find(p => p.id === edit.dataset.edit);$('#participant-id').value = p.id;$('#name').value = p.name;$('#primary').value = p.primary;$('#secondary').value = p.secondary;$('#form-title').textContent = 'Editar participante';$('#participant-form button[type="submit"]').textContent = 'Salvar alterações';$('#cancel-edit').hidden = false;$('#name').focus();}
  if (remove && confirm('Excluir este participante?')) {sport().participants = sport().participants.filter(p => p.id !== remove.dataset.delete);sport().revision++;resetForm();changed();notify('Participante excluído.');}
});
render();

$('#export').addEventListener('click', () => downloadBackup(state));
$('#import').addEventListener('click', () => $('#backup-file').click());
$('#backup-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try {if (file.size > 10000000) throw new Error('O backup deve ter no máximo 10 MB.');const imported = parseBackup(await file.text());if (!confirm('Substituir todos os dados deste navegador pelo backup?')) return;storeState(imported);state = imported;selected = state.selected;resetForm();render();notify('Backup importado.');} catch(error) {notify(error.message);} finally {event.target.value = '';}
});
$('#clear').addEventListener('click', () => {if (confirm('Apagar participantes, configurações e resultados de TODAS as modalidades? Exporte um backup antes de continuar.')) {const empty = createState();try {storeState(empty);state = empty;selected = state.selected;resetForm();render();notify('Dados apagados.');} catch {notify('Não foi possível apagar os dados armazenados.');}}});
if (loadError) {notify('Dados locais não puderam ser lidos. Exporte ou recupere um backup antes de cadastrar novos dados.');}

function renderEstimate() {
  const e = estimate(sport().participants, sport().config);
  $('#teams-count').textContent = e.teams;$('#reserves-count').textContent = e.teams ? e.reserves : '—';
  $('#estimate-detail').textContent = `${sport().config.size} titulares por equipe`;
  $('#draw-message').textContent = e.error || (e.limited ? `Limite de posições obrigatórias: ${e.feasible} equipe(s), com ${e.reserves} reserva(s).` : `${e.teams * sport().config.size} titulares e ${e.reserves} reserva(s). Sem avaliação de habilidade.`);
  $('#draw').disabled = !!e.error;
}
function positionRow(p) {
  const row = document.createElement('div');row.className = 'position-row';row.dataset.id = p.id;
  row.innerHTML = `<label>Nome da posição<input class="position-name" maxlength="60" required value="${escape(p.name)}"></label><label>Vagas<input class="position-slots" type="number" min="0" max="100" required value="${p.slots}"></label><label class="check"><input type="checkbox" class="position-mandatory" ${p.mandatory ? 'checked' : ''}> Exigir aptidão</label><button type="button" class="remove-position danger">Remover</button>`;
  return row;
}
function renderSettings() {
  $('#team-size').value = sport().config.size;$('#manual-teams').value = sport().config.teams ?? '';
  $('#position-settings').replaceChildren(...sport().config.positions.map(positionRow));
}
$('#add-position').addEventListener('click', () => {if ($('#position-settings').children.length >= 30) return notify('Limite de 30 posições.');$('#position-settings').append(positionRow({id:uid(),name:'',slots:0,mandatory:false}));$('#position-settings').lastElementChild.querySelector('input').focus();});
$('#position-settings').addEventListener('click', event => {if (event.target.closest('.remove-position') && confirm('Remover esta posição da configuração? A alteração só será aplicada ao salvar.')) event.target.closest('.position-row').remove();});
$('#settings-form').addEventListener('submit', event => {
  event.preventDefault();try {
    const positions = [...document.querySelectorAll('.position-row')].map(row => ({id:row.dataset.id,name:row.querySelector('.position-name').value.trim(),slots:Number(row.querySelector('.position-slots').value),mandatory:row.querySelector('.position-mandatory').checked}));
    updateConfig(sport(), {size:Number($('#team-size').value),teams:$('#manual-teams').value === '' ? null : Number($('#manual-teams').value),positions});changed();notify('Configuração salva.');
  } catch(error) {notify(error.message);}
});
