/* ===== Idle Tycoon — Progression System ===== */
(function() {
  'use strict';

  const SAVE_KEY = 'tycoon_progress';

  const UPGRADE_TIERS = {
    weapon: {
      name: 'Click (Weapon)',
      icon: '👆',
      maxLevel: 5,
      baseCost: 1000,
      costMultiplier: 2,
      gemCost: 50,
      levels: [
        { level: 0, name: 'Finger Tap',       bonus: { tapValue: 1.0, tapMulti: 1 },     gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Double Tap',       bonus: { tapValue: 1.5, tapMulti: 1 },     gemReq: 50,  coinsReq: 1000 },
        { level: 2, name: 'Triple Tap',       bonus: { tapValue: 2.0, tapMulti: 2 },     gemReq: 80,  coinsReq: 2000 },
        { level: 3, name: 'Mega Tap',         bonus: { tapValue: 3.0, tapMulti: 2 },     gemReq: 120, coinsReq: 4000 },
        { level: 4, name: 'Neon Tap',         bonus: { tapValue: 5.0, tapMulti: 3 },     gemReq: 200, coinsReq: 8000 },
        { level: 5, name: '⚡ God Tap',       bonus: { tapValue: 10.0, tapMulti: 3 },    gemReq: 500, coinsReq: 20000 },
      ]
    },
    case: {
      name: 'Income (Case)',
      icon: '💰',
      maxLevel: 5,
      baseCost: 800,
      costMultiplier: 2,
      gemCost: 50,
      levels: [
        { level: 0, name: 'Tin Can',          bonus: { passiveRate: 1.0, offlineHours: 1 },    gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Piggy Bank',       bonus: { passiveRate: 1.5, offlineHours: 2 },    gemReq: 40,  coinsReq: 800 },
        { level: 2, name: 'Cash Register',    bonus: { passiveRate: 2.0, offlineHours: 3 },    gemReq: 70,  coinsReq: 1600 },
        { level: 3, name: 'Vault',            bonus: { passiveRate: 3.0, offlineHours: 4 },    gemReq: 100, coinsReq: 3200 },
        { level: 4, name: 'Gold Reserve',     bonus: { passiveRate: 5.0, offlineHours: 6 },    gemReq: 180, coinsReq: 6400 },
        { level: 5, name: '💎 Bank Empire',   bonus: { passiveRate: 10.0, offlineHours: 12 },  gemReq: 400, coinsReq: 16000 },
      ]
    },
    outfit: {
      name: 'Boost (Outfit)',
      icon: '🚀',
      maxLevel: 5,
      baseCost: 600,
      costMultiplier: 2,
      gemCost: 40,
      levels: [
        { level: 0, name: 'Rag Hat',          bonus: { critChance: 0, critMulti: 1 },         gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Cap',              bonus: { critChance: 0.05, critMulti: 2 },      gemReq: 30,  coinsReq: 600 },
        { level: 2, name: 'Beret',            bonus: { critChance: 0.08, critMulti: 3 },      gemReq: 60,  coinsReq: 1200 },
        { level: 3, name: 'Top Hat',          bonus: { critChance: 0.12, critMulti: 3 },      gemReq: 90,  coinsReq: 2400 },
        { level: 4, name: 'Crown',            bonus: { critChance: 0.15, critMulti: 4 },      gemReq: 150, coinsReq: 4800 },
        { level: 5, name: '🔥 Phoenix Crown', bonus: { critChance: 0.20, critMulti: 5 },      gemReq: 350, coinsReq: 12000 },
      ]
    }
  };

  const PREMIUM_ITEMS = {
    legendarySkins: [
      { id: 'lg_void',       name: 'Void Empire',   desc: 'Dark matter theme',             price: 4.99,  gemPrice: 0, type: 'legendary', tier: 'legendary' },
      { id: 'lg_cosmic',     name: 'Cosmic Coins',  desc: 'Galaxy-themed coins',            price: 6.99,  gemPrice: 0, type: 'legendary', tier: 'legendary' },
      { id: 'lg_flame',      name: 'Inferno Cash',  desc: 'Living flame coins',             price: 8.99,  gemPrice: 0, type: 'legendary', tier: 'legendary' },
    ],
    premiumCases: [
      { id: 'pc_royal',      name: 'Royal Pass',    desc: '7 days: 2x income + 50 gems/day', price: 4.99,  gemPrice: 0, type: 'subscription', duration: '7d' },
      { id: 'pc_vip',        name: 'VIP Status',    desc: '30 days: 3x income + 100 gems/day', price: 12.99, gemPrice: 0, type: 'subscription', duration: '30d' },
    ],
    bundles: [
      { id: 'bundle_starter',  name: 'Starter Bundle',   desc: '200 gems + 50000 coins',                   price: 2.99,  gemPrice: 0, type: 'one_time' },
      { id: 'bundle_mega',     name: 'Mega Cash Pack',   desc: '500 gems + 500000 coins + neon theme',    price: 7.99,  gemPrice: 0, type: 'one_time' },
      { id: 'bundle_ultimate', name: 'Ultimate Bundle',  desc: '2000 gems + 10M coins + legendary theme', price: 19.99, gemPrice: 0, type: 'one_time' },
    ],
    removeAds: { id: 'remove_ads', name: 'Remove Ads', desc: 'Permanently remove all ads', price: 2.99, gemPrice: 0, type: 'one_time' },
  };

  const GEM_PACKS = [
    { id: 'gems_small',  name: 'Small Gem Pack',    gems: 100,  price: 0.99,  bonus: 0,    popular: false },
    { id: 'gems_medium', name: 'Standard Gem Pack', gems: 500,  price: 3.99,  bonus: 50,   popular: true  },
    { id: 'gems_large',  name: 'Large Gem Pack',    gems: 1200, price: 7.99,  bonus: 200,  popular: false },
    { id: 'gems_mega',   name: 'Mega Gem Pack',     gems: 4000, price: 19.99, bonus: 1000, popular: false },
    { id: 'gems_ultra',  name: '🐳 Whale Pack',     gems: 10000,price: 39.99, bonus: 5000, popular: false },
  ];

  const CATALOG = {
    themes: [
      { id: 'default',   name: 'Classic Dark', price: 0,    desc: 'Original dark theme',          colors: { bg: '#0f1020', accent: '#1a1a2e' } },
      { id: 'ocean',     name: 'Ocean Blue',   price: 500,  desc: 'Calming ocean blues',          colors: { bg: '#023047', accent: '#0a4a6e' } },
      { id: 'sunset',    name: 'Sunset Glow',  price: 800,  desc: 'Warm sunset orange & pink',    colors: { bg: '#2d1b3d', accent: '#4a1a3a' } },
      { id: 'neon',      name: 'Neon Nights',  price: 1500, desc: 'Bright neon on dark purple',   colors: { bg: '#1a0030', accent: '#2a0050' } },
    ],
    boosters: [
      { id: 'income_x2',   name: 'Income Booster',   price: 500,  desc: '2x passive income for 30 min',  effect: 'incomeMultiplier:2' },
      { id: 'tap_bonus',   name: 'Tap Power',        price: 400,  desc: '3x tap value for 30 min',       effect: 'tapMultiplier:3' },
    ],
  };

  const ACHIEVEMENTS = [
    { id: 'first_tap',    name: 'First Coin',        desc: 'Earn your first coin',              reward: { coins: 50,  gems: 0 },  icon: '🪙', check: p => p.totalEarned >= 1 },
    { id: 'earn_1k',      name: 'Small Change',      desc: 'Earn 1,000 total coins',            reward: { coins: 200, gems: 0 },  icon: '💵', check: p => p.totalEarned >= 1000 },
    { id: 'earn_100k',    name: 'Hundred Grand',     desc: 'Earn 100,000 total coins',          reward: { coins: 500, gems: 5 },  icon: '💰', check: p => p.totalEarned >= 100000 },
    { id: 'earn_1m',      name: 'Millionaire',       desc: 'Earn 1,000,000 total coins',        reward: { coins: 2000, gems: 20 },icon: '🏦', check: p => p.totalEarned >= 1000000 },
    { id: 'earn_100m',    name: 'Hundred Million',   desc: 'Earn 100,000,000 total coins',      reward: { coins: 10000, gems: 100 },icon: '🌟', check: p => p.totalEarned >= 100000000 },
    { id: 'gen_1',        name: 'Lemonade Stand',    desc: 'Buy your first generator',          reward: { coins: 100, gems: 0 },  icon: '🍋', check: p => p.generatorsBought >= 1 },
    { id: 'gen_10',       name: 'Tycoon Begins',     desc: 'Buy 10 total generators',           reward: { coins: 300, gems: 5 },  icon: '🏗️', check: p => p.generatorsBought >= 10 },
    { id: 'gen_50',       name: 'Empire Builder',    desc: 'Buy 50 total generators',           reward: { coins: 2000, gems: 20 },icon: '🏰', check: p => p.generatorsBought >= 50 },
    { id: 'prestige_1',   name: 'Fresh Start',       desc: 'Prestige once',                    reward: { coins: 500, gems: 10 }, icon: '🔄', check: p => p.prestigeCount >= 1 },
    { id: 'prestige_5',   name: 'Phoenix',           desc: 'Prestige 5 times',                 reward: { coins: 3000, gems: 30 },icon: '🔥', check: p => p.prestigeCount >= 5 },
    { id: 'prestige_10',  name: 'Immortal',          desc: 'Prestige 10 times',                reward: { coins: 10000, gems: 100 },icon: '👑', check: p => p.prestigeCount >= 10 },
    { id: 'weapon_1',     name: 'Tapper Up',         desc: 'Upgrade Click to level 1',         reward: { coins: 200, gems: 0 },  icon: '👆', check: p => (p.upgrades?.weapon || 0) >= 1 },
    { id: 'weapon_5',     name: 'Tap Master',        desc: 'Reach max Click level',            reward: { coins: 2000, gems: 50 },icon: '⚡', check: p => (p.upgrades?.weapon || 0) >= 5 },
    { id: 'case_1',       name: 'Income Up',         desc: 'Upgrade Income to level 1',        reward: { coins: 200, gems: 0 },  icon: '💰', check: p => (p.upgrades?.case || 0) >= 1 },
    { id: 'case_5',       name: 'Income Master',     desc: 'Reach max Income level',           reward: { coins: 2000, gems: 50 },icon: '💎', check: p => (p.upgrades?.case || 0) >= 5 },
    { id: 'outfit_1',     name: 'Booster Up',        desc: 'Upgrade Boost to level 1',         reward: { coins: 200, gems: 0 },  icon: '🚀', check: p => (p.upgrades?.outfit || 0) >= 1 },
    { id: 'outfit_5',     name: 'Boost Master',      desc: 'Reach max Boost level',            reward: { coins: 2000, gems: 50 },icon: '👘', check: p => (p.upgrades?.outfit || 0) >= 5 },
    { id: 'gems_100',     name: 'Gem Collector',     desc: 'Earn 100 total gems',              reward: { coins: 500, gems: 20 }, icon: '💎', check: p => p.totalGems >= 100 },
    { id: 'gems_500',     name: 'Gem Hoarder',       desc: 'Earn 500 total gems',              reward: { coins: 1000, gems: 50 },icon: '💠', check: p => p.totalGems >= 500 },
  ];

  function defaultState() {
    return {
      coins: 50, gems: 0, totalGems: 0, xp: 0, level: 1,
      totalEarned: 0, generatorsBought: 0, prestigeCount: 0, prestigeMulti: 1,
      bestPrestige: 0, totalTaps: 0, offlineTime: 0,
      upgrades: { weapon: 0, case: 0, outfit: 0 },
      ownedThemes: ['default'], activeTheme: 'default',
      activeBoosters: {}, inventory: {}, achievements: {},
      lastSaveDate: null, adFree: false, subscriptions: {},
    };
  }

  let state = null;

  function save() { state.lastSaveDate = new Date().toISOString(); try {localStorage.setItem(SAVE_KEY, JSON.stringify(state));}catch(e){} }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) { state = {...defaultState(), ...JSON.parse(raw)}; if(!state.upgrades)state.upgrades={weapon:0,case:0,outfit:0}; if(!state.gems&&state.gems!==0)state.gems=0; if(!state.totalGems)state.totalGems=0; save();return true;}
    }catch(e){}
    reset(); return false;
  }
  function reset() { state = defaultState(); save(); }
  function xpForLevel(lvl) { return Math.floor(100 * Math.pow(1.2, lvl-1)); }
  function addXp(amount) { if(!state)return false; state.xp+=amount; let lvl=false; while(state.xp>=xpForLevel(state.level)){state.xp-=xpForLevel(state.level);state.level++;lvl=true;} save(); return lvl; }
  function addCoins(a) { if(!state)return 0; state.coins+=a; state.totalEarned+=a; save(); return state.coins; }
  function spendCoins(a) { if(!state||state.coins<a)return false; state.coins-=a; save(); return true; }
  function addGems(a) { if(!state)return 0; state.gems+=a; state.totalGems+=a; save(); return state.gems; }
  function spendGems(a) { if(!state||state.gems<a)return false; state.gems-=a; save(); return true; }
  function getUpgradeCost(cat, cur) { const t=UPGRADE_TIERS[cat]; if(!t)return null; const n=t.levels.find(l=>l.level===cur+1); return n?{coins:n.coinsReq,gems:n.gemReq}:null; }
  function upgradeItem(cat,useGems) {
    if(!state)return{success:false,reason:'no_state'}; const t=UPGRADE_TIERS[cat]; if(!t)return{success:false,reason:'invalid'};
    const cur=state.upgrades[cat]||0; if(cur>=t.maxLevel)return{success:false,reason:'max'};
    const c=getUpgradeCost(cat,cur); if(!c)return{success:false,reason:'no_data'};
    if(useGems){if(state.gems<c.gems)return{success:false,reason:'not_enough_gems'};spendGems(c.gems);}else{if(state.coins<c.coins)return{success:false,reason:'not_enough_coins'};spendCoins(c.coins);}
    state.upgrades[cat]++; save(); return{success:true,newLevel:state.upgrades[cat]};
  }
  function getActiveBonuses() {
    if(!state)return{tapValue:1,tapMulti:1,passiveRate:1,offlineHours:1,critChance:0,critMulti:1};
    const b={tapValue:1,tapMulti:1,passiveRate:1,offlineHours:1,critChance:0,critMulti:1};
    const w=state.upgrades.weapon||0; const wd=UPGRADE_TIERS.weapon.levels[w]; if(wd){b.tapValue=wd.bonus.tapValue;b.tapMulti=wd.bonus.tapMulti;}
    const c=state.upgrades.case||0; const cd=UPGRADE_TIERS.case.levels[c]; if(cd){b.passiveRate=cd.bonus.passiveRate;b.offlineHours=cd.bonus.offlineHours;}
    const o=state.upgrades.outfit||0; const od=UPGRADE_TIERS.outfit.levels[o]; if(od){b.critChance=od.bonus.critChance;b.critMulti=od.bonus.critMulti;}
    return b;
  }
  function ownsPremiumItem(id) { return state&&state.inventory&&state.inventory[id]===true; }
  function purchasePremiumItem(id) { if(!state)return false; state.inventory[id]=true; if(id==='remove_ads'){state.adFree=true;if(typeof AdsManager!=='undefined'&&AdsManager.onAdsRemoved)AdsManager.onAdsRemoved();} const bg={bundle_starter:200,bundle_mega:500,bundle_ultimate:2000}; if(bg[id])addGems(bg[id]); save(); return true; }
  function checkAchievements() {
    if(!state)return[]; const u=[];
    for(const a of ACHIEVEMENTS){if(state.achievements[a.id])continue;if(a.check(state)){state.achievements[a.id]=true;addCoins(a.reward.coins);if(a.reward.gems)addGems(a.reward.gems);u.push(a);}}
    if(u.length>0)save(); return u;
  }
  function getState(){return state;}
  function getUpgradeTiers(){return UPGRADE_TIERS;}
  function getPremiumItems(){return PREMIUM_ITEMS;}
  function getGemPacks(){return GEM_PACKS;}
  function getCatalog(){return CATALOG;}
  function getAchievements(){return ACHIEVEMENTS;}
  function getCoinBalance(){return state?state.coins:0;}
  function getGemBalance(){return state?state.gems:0;}

  window.ProgressionSystem = {
    load,save,reset,addCoins,spendCoins,getCoinBalance,addGems,spendGems,getGemBalance,
    addXp,xpForLevel,upgradeItem,getUpgradeCost,getActiveBonuses,getUpgradeTiers,UPGRADE_TIERS,
    getPremiumItems,PREMIUM_ITEMS,getGemPacks,GEM_PACKS,ownsPremiumItem,purchasePremiumItem,
    getCatalog,CATALOG,getAchievements,ACHIEVEMENTS,checkAchievements,endOfGame,getState,defaultState,
  };
})();
