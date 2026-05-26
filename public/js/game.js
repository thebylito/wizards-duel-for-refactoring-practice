// Lógica do jogo

const PLAYER_SPELLS_COUNT = 5;
const SPELL_ANIMATION_DELAY = 800;
const CPU_ATTACK_DELAY = 700;
const HIT_ANIMATION_DURATION = 600;
const BATTLE_ANIMATION_DURATION = 500;
const LOADING_COMPLETE_DELAY = 400;
const LOADING_FADE_DURATION = 600;

const state = {
  phase: 'loading',
  pack: [],
  selectedCards: [],
  playerDeck: [],
  cpuDeck: [],
  spells: [],
  playerSpells: [],
  round: 1,
  scoreP: 0,
  scoreC: 0,
  waiting: false,
};

// ── Utilitários ───────────────────────────────────────

function log(message, type = 'info') {
  const logEl = document.getElementById('battleLog');
  const span = document.createElement('span');
  span.className = `log-entry ${type}`;
  span.textContent = message;
  logEl.appendChild(span);
  logEl.scrollTop = logEl.scrollHeight;
}

function setStatus(message) {
  document.getElementById('battleStatus').textContent = message;
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) targetScreen.classList.add('active');
}

function getActiveIndex(deck) {
  return deck.findIndex((character) => character.hp > 0);
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ── Loading ───────────────────────────────────────────

async function loadGame() {
  const loadBar = document.getElementById('loadBar');
  const loadMsg = document.getElementById('loadMsg');

  loadMsg.textContent = 'Invocando personagens...';
  loadBar.style.width = '20%';
  state.pack = await fetchPack();

  loadBar.style.width = '55%';
  loadMsg.textContent = 'Consultando o livro de feitiços...';
  state.spells = await fetchSpells();

  loadBar.style.width = '85%';
  loadMsg.textContent = 'Preparando o adversário...';
  state.cpuDeck = await fetchCpuDeck();

  state.playerSpells = shuffleArray(state.spells).slice(0, PLAYER_SPELLS_COUNT);

  loadBar.style.width = '100%';
  loadMsg.textContent = 'Pronto!';

  setTimeout(() => {
    document.getElementById('screen-loading').classList.add('fade-out');
    setTimeout(() => {
      document.getElementById('screen-loading').style.display = 'none';
      showScreen('screen-draft');
      renderPack(state.pack, state.selectedCards, toggleDraftCard);
    }, LOADING_FADE_DURATION);
  }, LOADING_COMPLETE_DELAY);
}

// ── Draft ─────────────────────────────────────────────

function toggleDraftCard(index) {
  const position = state.selectedCards.indexOf(index);
  if (position >= 0) {
    state.selectedCards.splice(position, 1);
  } else {
    if (state.selectedCards.length >= 2) return;
    state.selectedCards.push(index);
  }
  renderPack(state.pack, state.selectedCards, toggleDraftCard);
}

async function rerollPack() {
  state.selectedCards = [];
  document.getElementById('packGrid').innerHTML =
    '<div style="text-align:center;padding:40px;font-family:Cinzel,serif;font-size:0.7rem;letter-spacing:2px;color:var(--parchment-dark);grid-column:1/-1">Invocando novos bruxos...</div>';
  state.pack = await fetchPack();
  renderPack(state.pack, state.selectedCards, toggleDraftCard);
}

function confirmDraft() {
  if (state.selectedCards.length < 2) return;
  state.playerDeck = [state.pack[state.selectedCards[0]], state.pack[state.selectedCards[1]]];
  startBattle();
}

// ── Battle ────────────────────────────────────────────

function startBattle() {
  state.round = 1;
  state.scoreP = 0;
  state.scoreC = 0;
  state.waiting = false;

  document.getElementById('scoreP').textContent = '0';
  document.getElementById('scoreC').textContent = '0';
  document.getElementById('roundNum').textContent = '1';
  document.getElementById('battleLog').innerHTML = '';
  document.getElementById('btnNext').style.display = 'none';

  showScreen('screen-battle');
  renderBattleState();
  log('⚔ O duelo começou! Escolha um feitiço para atacar.', 'info');
  setStatus('Escolha um feitiço para atacar!');
}

function renderBattleState() {
  const playerIndex = getActiveIndex(state.playerDeck);
  const cpuIndex = getActiveIndex(state.cpuDeck);

  if (playerIndex < 0 || cpuIndex < 0) {
    endGame();
    return;
  }

  const playerCharacter = state.playerDeck[playerIndex];
  const cpuCharacter = state.cpuDeck[cpuIndex];

  document.getElementById('playerActiveName').textContent = playerCharacter.name;
  document.getElementById('cpuActiveName').textContent = cpuCharacter.name;

  const playerSlot = document.getElementById('playerCardSlot');
  const cpuSlot = document.getElementById('cpuCardSlot');

  const playerDiv = document.createElement('div');
  playerDiv.className = 'card battle-card';
  playerDiv.id = 'battleCardP';
  playerDiv.innerHTML = renderCard(playerCharacter);
  playerSlot.innerHTML = '';
  playerSlot.appendChild(playerDiv);

  const cpuDiv = document.createElement('div');
  cpuDiv.className = 'card battle-card';
  cpuDiv.id = 'battleCardC';
  cpuDiv.innerHTML = renderCard(cpuCharacter);
  cpuSlot.innerHTML = '';
  cpuSlot.appendChild(cpuDiv);

  renderDeckBadges(state.playerDeck, playerIndex, 'playerDeckBadges');
  renderDeckBadges(state.cpuDeck, cpuIndex, 'cpuDeckBadges');
  renderSpells(state.playerSpells, !state.waiting);
}

function applyPlayerSpell(spell, playerCharacter, cpuCharacter) {
  const damage = Math.floor(
    spell.damage * (playerCharacter.magic / 100) * (Math.random() * 0.4 + 0.8),
  );
  if (spell.damage < 0) {
    const healAmount = Math.abs(damage);
    playerCharacter.hp = Math.min(playerCharacter.maxHp, playerCharacter.hp + healAmount);
    log(
      `✨ ${spell.name} — você curou ${healAmount} HP! (${playerCharacter.name}: ${playerCharacter.hp} HP)`,
      'heal',
    );
    document.getElementById('battleCardP').classList.add('battling');
    setTimeout(
      () => document.getElementById('battleCardP')?.classList.remove('battling'),
      BATTLE_ANIMATION_DURATION,
    );
  } else {
    cpuCharacter.hp -= damage;
    log(
      `⚡ ${spell.name} → ${cpuCharacter.name} perdeu ${damage} HP! (${cpuCharacter.name}: ${Math.max(0, cpuCharacter.hp)} HP)`,
      'win',
    );
    document.getElementById('battleCardC').classList.add('hit');
    setTimeout(() => document.getElementById('battleCardC')?.classList.remove('hit'), HIT_ANIMATION_DURATION);
  }
}

function applyCpuSpell(cpuCharacter, playerCharacter) {
  const cpuSpell = state.spells[Math.floor(Math.random() * state.spells.length)];
  const cpuDamage = Math.floor(
    cpuSpell.damage * (cpuCharacter.magic / 100) * (Math.random() * 0.4 + 0.8),
  );

  if (cpuSpell.damage < 0) {
    const cpuHeal = Math.abs(cpuDamage);
    cpuCharacter.hp = Math.min(cpuCharacter.maxHp, cpuCharacter.hp + cpuHeal);
    log(
      `🧙 CPU: ${cpuSpell.name} — CPU curou ${cpuHeal} HP! (${cpuCharacter.name}: ${cpuCharacter.hp} HP)`,
      'heal',
    );
    document.getElementById('battleCardC')?.classList.add('battling');
    setTimeout(
      () => document.getElementById('battleCardC')?.classList.remove('battling'),
      BATTLE_ANIMATION_DURATION,
    );
  } else {
    playerCharacter.hp -= cpuDamage;
    log(
      `💀 CPU: ${cpuSpell.name} → ${playerCharacter.name} perdeu ${cpuDamage} HP! (${playerCharacter.name}: ${Math.max(0, playerCharacter.hp)} HP)`,
      'lose',
    );
    document.getElementById('battleCardP')?.classList.add('hit');
    setTimeout(() => document.getElementById('battleCardP')?.classList.remove('hit'), HIT_ANIMATION_DURATION);
  }
}

function checkDeaths(playerIndex, cpuIndex) {
  let roundOver = false;
  if (playerIndex >= 0 && state.playerDeck[playerIndex].hp <= 0) {
    log(`💀 ${state.playerDeck[playerIndex].name} foi derrotado!`, 'lose');
    state.scoreC++;
    document.getElementById('scoreC').textContent = state.scoreC;
    roundOver = true;
  }
  if (cpuIndex >= 0 && state.cpuDeck[cpuIndex].hp <= 0) {
    log(`🏆 ${state.cpuDeck[cpuIndex].name} foi derrotado!`, 'win');
    state.scoreP++;
    document.getElementById('scoreP').textContent = state.scoreP;
    roundOver = true;
  }
  return roundOver;
}

function castSpell(spellIndex) {
  if (state.waiting) return;
  state.waiting = true;
  renderSpells(state.playerSpells, false);

  const spell = state.playerSpells[spellIndex];
  const playerIndex = getActiveIndex(state.playerDeck);
  const cpuIndex = getActiveIndex(state.cpuDeck);
  const playerCharacter = state.playerDeck[playerIndex];
  const cpuCharacter = state.cpuDeck[cpuIndex];

  applyPlayerSpell(spell, playerCharacter, cpuCharacter);

  setTimeout(() => {
    applyCpuSpell(cpuCharacter, playerCharacter);

    setTimeout(() => {
      const roundOver = checkDeaths(playerIndex, cpuIndex);
      renderBattleState();

      const playerAlive = getActiveIndex(state.playerDeck);
      const cpuAlive = getActiveIndex(state.cpuDeck);

      if (playerAlive < 0 || cpuAlive < 0) {
        setTimeout(endGame, SPELL_ANIMATION_DELAY);
        return;
      }

      state.waiting = false;

      if (roundOver) {
        state.round++;
        document.getElementById('roundNum').textContent = state.round;
        log(`— Rodada ${state.round} —`, 'info');
      }

      setStatus('Escolha um feitiço para atacar!');
      renderSpells(state.playerSpells, true);
    }, CPU_ATTACK_DELAY);
  }, SPELL_ANIMATION_DELAY);
}

function nextRound() {
  document.getElementById('btnNext').style.display = 'none';
  state.round++;
  document.getElementById('roundNum').textContent = state.round;
  log(`— Rodada ${state.round} —`, 'info');
  state.waiting = false;
  renderBattleState();
  setStatus('Escolha um feitiço para atacar!');
}

// ── Fim do jogo ───────────────────────────────────────

function endGame() {
  const overScreen = document.getElementById('screen-over');
  const glyphEl = document.getElementById('overGlyph');
  const titleEl = document.getElementById('overTitle');
  const subEl = document.getElementById('overSub');
  const scoreEl = document.getElementById('overScore');

  if (state.scoreP > state.scoreC) {
    glyphEl.textContent = '🏆';
    titleEl.textContent = 'Vitória!';
    subEl.textContent = 'Você dominou o duelo!';
  } else if (state.scoreC > state.scoreP) {
    glyphEl.textContent = '💀';
    titleEl.textContent = 'Derrota';
    subEl.textContent = 'O CPU foi mais poderoso desta vez.';
  } else {
    glyphEl.textContent = '✦';
    titleEl.textContent = 'Empate';
    subEl.textContent = 'Bruxos igualmente poderosos.';
  }

  scoreEl.textContent = `Você ${state.scoreP}  ×  ${state.scoreC} CPU`;
  overScreen.classList.add('active');
}

function restartGame() {
  document.getElementById('screen-over').classList.remove('active');
  state.selectedCards = [];
  state.pack = [];
  state.playerDeck = [];

  const loadingEl = document.getElementById('screen-loading');
  loadingEl.style.display = 'flex';
  loadingEl.classList.remove('fade-out');
  document.getElementById('loadBar').style.width = '0%';
  showScreen('');
  loadGame();
}

// ── Inicialização ─────────────────────────────────────
loadGame();
