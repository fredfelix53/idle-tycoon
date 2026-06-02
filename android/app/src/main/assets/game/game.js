/* ===== Idle Tycoon — Game =====
   Tap to earn coins, buy auto-generators, passive income grows
   Multiple generators (Lemonade → Newspaper → Cookie), prestige/reset system, offline earnings
*/
(function() {
  'use strict';

  const GENERATORS = [
    { id: 'lemonade', name: '🍋 Lemonade Stand',  baseCost: 10,   baseRate: 0.5,  emoji: '🍋', desc: 'Sells fresh lemonade' },
    { id: 'newspaper', name: '📰 Newspaper Route',baseCost: 80,   baseRate: 2,    emoji: '📰', desc: 'Delivers newspapers' },
    { id: 'cookie',   name: '🍪 Cookie Stall',    baseCost: 500,  baseRate: 8,    emoji: '🍪', desc: 'Fresh cookies daily' },
    { id: 'lemonade2',name: '🍊 Juice Bar',       baseCost: 3000, baseRate: 40,   emoji: '🍊', desc: 'Sells premium juices' },
    { id: 'bakery',   name: '🥖 Bakery',          baseCost: 20000,baseRate: 200,  emoji: '🥖', desc: 'Bakes bread & pastries' },
    { id: 'cafe',     name: '☕ Coffee Shop',     baseCost: 100000,baseRate: 800, emoji: '☕', desc: 'Serves coffee & snacks' },
    { id: 'restaurant',name: '🍽️ Restaurant',    baseCost: 1000000,baseRate: 5000,emoji: '🍽️',desc: 'Full restaurant service' },
    { id: 'hotel',    name: '🏨 Hotel Chain',    baseCost: 50000000,baseRate: 50000,emoji: '🏨',desc: 'Luxury hotel empire' },
  ];

  let coins = 50;
  let totalEarned = 0;
  let ownedGenerators = {};
  let tapLevel = 1;
  let prestigeMulti = 1;
  let prestigeCount = 0;
  let totalTaps = 0;
  let gameRunning = false;
  let lastTick = Date.now();
  let coinAnimations = [];
  let tickInterval = null;

  // UI refs
  let coinsEl, rateEl, prestigeEl, genContainer, tapBtn;
  let prestigeBtn;

  function init() {
    ProgressionSystem.load();

    // Initialize framework modules
    AdsManager.init();
    ChallengesSystem.init();
    StoreRotator.init();
    RetentionSystem.init();
    CollectiblesSystem.init();
    TutorialSystem.init({ gameTitle: 'Idle Tycoon' });
    if (TutorialSystem.shouldShow()) {
      setTimeout(() => TutorialSystem.start(), 500);
    }

    RetentionSystem.onGameStart();

    loadGameState();

    coinsEl = document.getElementById('coins');
    rateEl = document.getElementById('rate');
    prestigeEl = document.getElementById('prestigeMulti');
    genContainer = document.getElementById('generators');
    tapBtn = document.getElementById('tapBtn');
    prestigeBtn = document.getElementById('prestigeBtn');

    tapBtn.addEventListener('click', handleTap);
    prestigeBtn.addEventListener('click', handlePrestige);

    renderGenerators();
    updateUI();

    gameRunning = true;
    lastTick = Date.now();
    tickInterval = setInterval(gameTick, 100); // 10 updates/sec
  }

  function loadGameState() {
    const state = ProgressionSystem.getState();
    coins = state.coins;
    totalEarned = state.totalEarned;
    prestigeMulti = state.prestigeMulti || 1;
    prestigeCount = state.prestigeCount || 0;
    totalTaps = state.totalTaps || 0;
    ownedGenerators = state.generators || {};
    if (!ownedGenerators.lemonade) {
      ownedGenerators = {};
      for (const g of GENERATORS) ownedGenerators[g.id] = 0;
    }
    tapLevel = 1;
  }

  function saveGameState() {
    const state = ProgressionSystem.getState();
    state.coins = coins;
    state.totalEarned = totalEarned;
    state.prestigeMulti = prestigeMulti;
    state.prestigeCount = prestigeCount;
    state.totalTaps = totalTaps;
    state.generators = ownedGenerators;
    ProgressionSystem.save();
  }

  function handleTap(e) {
    const bonuses = ProgressionSystem.getActiveBonuses();
    let value = 1 * bonuses.tapValue * prestigeMulti;
    // Apply tapMulti
    if (bonuses.tapMulti > 1) value *= bonuses.tapMulti;
    // Crit
    let isCrit = false;
    if (Math.random() < bonuses.critChance) {
      value *= bonuses.critMulti;
      isCrit = true;
    }
    value = Math.floor(value);
    coins += value;
    totalEarned += value;
    totalTaps++;

    // Visual feedback
    const rect = tapBtn.getBoundingClientRect();
    const x = e.type === 'click' ? e.clientX - rect.left : rect.width / 2;
    const y = e.type === 'click' ? e.clientY - rect.top : rect.height / 2;
    coinAnimations.push({
      x, y, text: `+${value}${isCrit ? ' 💥' : ''}`,
      life: 1, vy: -3,
      color: isCrit ? '#ffd700' : '#fff',
    });

    tapBtn.style.transform = 'scale(0.9)';
    setTimeout(() => tapBtn.style.transform = 'scale(1)', 100);

    // Framework hooks
    ChallengesSystem.reportProgress('score', value);
    CollectiblesSystem.incrementTracker('wins');

    updateUI();
    saveGameState();
  }

  function calculatePassiveRate() {
    const bonuses = ProgressionSystem.getActiveBonuses();
    let rate = 0;
    for (const g of GENERATORS) {
      const count = ownedGenerators[g.id] || 0;
      if (count > 0) {
        rate += g.baseRate * count * bonuses.passiveRate * prestigeMulti;
      }
    }
    return rate; // per second
  }

  function gameTick() {
    if (!gameRunning) return;

    const now = Date.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;

    // Passive income
    const rate = calculatePassiveRate();
    const earned = rate * dt;
    if (earned >= 1) {
      coins += Math.floor(earned);
      totalEarned += Math.floor(earned);
    }

    // Update coin animations
    for (let i = coinAnimations.length - 1; i >= 0; i--) {
      const a = coinAnimations[i];
      a.y += a.vy;
      a.vy *= 0.97;
      a.life -= 0.025;
      if (a.life <= 0) coinAnimations.splice(i, 1);
    }

    updateUI();
    saveGameState();
  }

  function buyGenerator(id) {
    const gen = GENERATORS.find(g => g.id === id);
    if (!gen) return;

    const count = ownedGenerators[id] || 0;
    const cost = Math.floor(gen.baseCost * Math.pow(1.15, count));

    if (coins < cost) {
      showNotification('Not enough coins!');
      return;
    }

    coins -= cost;
    ownedGenerators[id] = (ownedGenerators[id] || 0) + 1;
    const state = ProgressionSystem.getState();
    state.generatorsBought = (state.generatorsBought || 0) + 1;
    ProgressionSystem.save();

    // XP
    ProgressionSystem.addXp(5);
    ProgressionSystem.checkAchievements();

    // Framework hooks
    ChallengesSystem.reportProgress('score', cost);
    ChallengesSystem.reportProgress('powerups', 1);
    CollectiblesSystem.incrementTracker('madePurchase');

    showNotification(`Bought ${gen.name}! 🎉`);
    renderGenerators();
    updateUI();
  }

  function renderGenerators() {
    let html = '';
    for (const gen of GENERATORS) {
      const count = ownedGenerators[gen.id] || 0;
      const cost = Math.floor(gen.baseCost * Math.pow(1.15, count));
      const canAfford = coins >= cost;
      const rate = gen.baseRate * count;
      html += `
        <div class="gen-item ${canAfford ? '' : 'locked'}">
          <div class="gen-info">
            <div class="gen-name">${gen.emoji} ${gen.name}</div>
            <div class="gen-desc">${gen.desc}</div>
            <div class="gen-stats">Owned: <strong>${count}</strong> | Rate: <strong>${rate.toFixed(1)}/s</strong></div>
          </div>
          <button class="gen-buy ${canAfford ? '' : 'disabled'}" onclick="IdleTycoon.buyGenerator('${gen.id}')">
            🪙 ${formatCoins(cost)}
          </button>
        </div>`;
    }
    genContainer.innerHTML = html;
  }

  function handlePrestige() {
    if (coins < 100000) {
      showNotification('Need 100,000 coins to prestige!');
      return;
    }
    if (!confirm('Prestige? You will lose all coins & generators but gain permanent multiplier!')) return;

    const state = ProgressionSystem.getState();
    state.prestigeCount = (state.prestigeCount || 0) + 1;

    // Calculate prestige multiplier
    const totalInvested = calculateTotalInvested();
    const newMulti = 1 + (state.prestigeCount * 0.5) + (totalInvested / 50000000);
    state.prestigeMulti = Math.floor(newMulti * 10) / 10;

    // Reset
    coins = 0;
    for (const g of GENERATORS) ownedGenerators[g.id] = 0;
    prestigeMulti = state.prestigeMulti;
    prestigeCount = state.prestigeCount;

    state.coins = 0;
    state.generators = ownedGenerators;
    ProgressionSystem.save();
    ProgressionSystem.checkAchievements();

    // Framework hooks
    RetentionSystem.onGameEnd(totalEarned);
    RetentionSystem.submitScore('Player', Math.floor(totalEarned));
    ChallengesSystem.reportProgress('games', 1);
    ChallengesSystem.reportProgress('score', Math.floor(totalEarned));
    CollectiblesSystem.incrementTracker('totalGames');
    CollectiblesSystem.setTracker('highestScore', Math.floor(totalEarned));
    AdsManager.tryShowInterstitial();

    showNotification(`✨ Prestige! Multiplier: ${prestigeMulti}x`);
    renderGenerators();
    updateUI();
  }

  function calculateTotalInvested() {
    let total = 0;
    for (const g of GENERATORS) {
      const count = ownedGenerators[g.id] || 0;
      for (let i = 0; i < count; i++) {
        total += Math.floor(g.baseCost * Math.pow(1.15, i));
      }
    }
    return total;
  }

  function formatCoins(amount) {
    if (amount >= 1000000000) return (amount / 1000000000).toFixed(1) + 'B';
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K';
    return Math.floor(amount).toString();
  }

  function updateUI() {
    if (coinsEl) coinsEl.textContent = formatCoins(coins);
    if (rateEl) rateEl.textContent = formatCoins(calculatePassiveRate()) + '/s';
    if (prestigeEl) prestigeEl.textContent = `${prestigeMulti}x`;
    document.getElementById('prestigeBtn').textContent = `🔄 Prestige (${formatCoins(100000)})`;
    renderGenerators();
  }

  function showNotification(msg) {
    const el = document.getElementById('notification') || (() => { const n=document.createElement('div'); n.id='notification'; document.body.appendChild(n); return n; })();
    el.textContent = msg;
    el.className = 'show';
    clearTimeout(el._timeout);
    el._timeout = setTimeout(()=>el.className='',2500);
  }

  // ─── Public API ─────────────────────────────────────
  window.IdleTycoon = { init, buyGenerator, handlePrestige };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
