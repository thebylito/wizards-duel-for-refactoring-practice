// Funções de renderização

const FALLBACK_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/300px-No_image_available.svg.png';

function getHouseColor(house) {
  if (house === 'Gryffindor') return '#6b1010';
  if (house === 'Slytherin') return '#0a3018';
  if (house === 'Hufflepuff') return '#3a2800';
  if (house === 'Ravenclaw') return '#0a1a3a';
  return '#1e1040';
}

function getHouseEmoji(house) {
  if (house === 'Gryffindor') return '🦁';
  if (house === 'Slytherin') return '🐍';
  if (house === 'Hufflepuff') return '🦡';
  if (house === 'Ravenclaw') return '🦅';
  return '✦';
}

function hpColor(percentage) {
  if (percentage > 0.6) return 'linear-gradient(90deg,#0a4a2a,#22cc77)';
  if (percentage > 0.3) return 'linear-gradient(90deg,#4a3a00,#ccaa22)';
  return 'linear-gradient(90deg,#4a0a0a,#cc2222)';
}

function renderCard(character) {
  const hpPercentage = character.hp / character.maxHp;
  const houseColor = getHouseColor(character.house);
  const houseEmoji = getHouseEmoji(character.house);

  return `
    <div class="card-img">
      <img src="${character.image}" alt="${character.name}" onerror="this.src='${FALLBACK_IMAGE}'">
      <div class="house-badge" style="background:${houseColor}">${houseEmoji}</div>
    </div>
    <div class="card-body">
      <div class="card-name">${character.name}</div>
      <div class="card-meta">${character.species} · ${character.house}</div>
      <div class="hp-bar-wrap">
        <span class="hp-label">HP</span>
        <div class="hp-track">
          <div class="hp-fill" style="width:${Math.max(0, hpPercentage * 100)}%;background:${hpColor(hpPercentage)}"></div>
        </div>
        <span class="hp-val">${Math.max(0, character.hp)}/${character.maxHp}</span>
      </div>
      <div class="mini-stats">
        <div class="mini-stat">
          <span class="mini-stat-icon">⚡</span>
          <span class="mini-stat-val">${character.power}</span>
          <span class="mini-stat-lbl">Poder</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-icon">🔮</span>
          <span class="mini-stat-val">${character.magic}</span>
          <span class="mini-stat-lbl">Magia</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-icon">🛡</span>
          <span class="mini-stat-val">${character.defense}</span>
          <span class="mini-stat-lbl">Defesa</span>
        </div>
      </div>
    </div>
  `;
}

function renderDeckBadges(deck, activeIndex, elementId) {
  const element = document.getElementById(elementId);
  element.innerHTML = deck
    .map((character, index) => {
      const isDead = character.hp <= 0;
      const isActive = index === activeIndex;
      const className = isDead ? 'deck-thumb dead' : isActive ? 'deck-thumb active' : 'deck-thumb';
      return `<div class="${className}"><img src="${character.image}" onerror="this.src='${FALLBACK_IMAGE}'"></div>`;
    })
    .join('');
}

function renderSpells(spells, enabled) {
  const element = document.getElementById('spellList');
  element.innerHTML = spells
    .map((spell, index) => {
      const isHeal = spell.damage < 0;
      const damageLabel = isHeal ? `💚 +${Math.abs(spell.damage)} HP` : `💀 ${spell.damage} dmg`;
      const damageClass = isHeal ? 'spell-dmg heal' : 'spell-dmg attack';
      const disabledAttr = enabled ? '' : 'disabled';
      return `
        <button class="spell-btn" ${disabledAttr} onclick="castSpell(${index})">
          <div>
            <span class="spell-name">${spell.name}</span>
            <span class="spell-effect">${spell.effect}</span>
          </div>
          <span class="${damageClass}">${damageLabel}</span>
        </button>
      `;
    })
    .join('');
}

function renderPack(pack, selectedCards, onToggle) {
  const grid = document.getElementById('packGrid');
  grid.innerHTML = '';
  pack.forEach((character, index) => {
    const isSelected = selectedCards.includes(index);
    const div = document.createElement('div');
    div.className = `card${isSelected ? ' selected' : ''}`;
    div.innerHTML = renderCard(character);
    div.setAttribute('data-idx', index);
    div.onclick = () => onToggle(index);
    grid.appendChild(div);
  });
  document.getElementById('draftCount').textContent = selectedCards.length;
  document.getElementById('btnConfirmDraft').disabled = selectedCards.length < 2;
}
