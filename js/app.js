import {createState, uid, saveParticipant} from './model.js';
let state = createState();
let selected = state.selected;
const $ = selector => document.querySelector(selector);
const sport = () => state.sports[selected];
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let toastTimer;
function notify(message) {$('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').hidden = true, 5500);}
function persist() {}
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
  renderList();
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
