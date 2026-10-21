const labels = {primary:'Posição principal',secondary:'Posição secundária',adapted:'Adaptação'};
export function resultText(sport) {
  if (!sport.result) return '';
  const r=sport.result;
  return [`${sport.name} · Sorteio de equipes`,new Date(r.createdAt).toLocaleString('pt-BR'),r.revision!==sport.revision?'ATENÇÃO: resultado desatualizado.':'',...r.teams.map(t=>`\n${t.name}\nTitulares (${t.starters.length})\n${t.starters.map(p=>`• ${p.name} — ${p.assigned}${p.assignment!=='primary'?` (${labels[p.assignment]}; principal: ${p.primary})`:''}`).join('\n')}\nReservas (${t.reserves.length})\n${t.reserves.map(p=>`• ${p.name} — ${p.primary}`).join('\n')||'Sem reservas'}`)].filter(Boolean).join('\n');
}
export function renderResults(container,sport) {
  container.replaceChildren();
  if(!sport.result){const empty=document.createElement('div');empty.className='empty';const title=document.createElement('strong');title.textContent='O próximo time ainda é uma surpresa';const p=document.createElement('p');p.textContent='Cadastre os participantes e clique em Sortear equipes.';empty.append(title,p);container.append(empty);return;}
  const r=sport.result;
  if(r.revision!==sport.revision){const notice=document.createElement('div');notice.className='notice';notice.textContent='Resultado desatualizado: participantes ou configurações foram alterados. Realize um novo sorteio.';container.append(notice);}
  const date=document.createElement('p');date.className='hint';date.textContent=`Sorteado em ${new Date(r.createdAt).toLocaleString('pt-BR')} · Sem avaliação de habilidade técnica.`;container.append(date);
  const grid=document.createElement('div');grid.className='team-grid';
  for(const team of r.teams){
    const card=document.createElement('article');card.className='team';
    const title=document.createElement('h3');title.textContent=team.name;card.append(title);
    for(const [heading,players,starter] of [[`${team.starters.length} titulares`,team.starters,true],[`${team.reserves.length} reservas`,team.reserves,false]]){
      const label=document.createElement('p');label.className='hint';label.textContent=heading;card.append(label);
      const list=document.createElement('ul');
      for(const player of players){const li=document.createElement('li');const name=document.createElement('strong');name.textContent=player.name;const detail=document.createElement('small');detail.textContent=starter?`${player.assigned}${player.assignment!=='primary'?` · ${labels[player.assignment]} (principal: ${player.primary})`:''}`:player.primary;li.append(name,detail);list.append(li);}
      card.append(list);
    }
    grid.append(card);
  }
  container.append(grid);
}
