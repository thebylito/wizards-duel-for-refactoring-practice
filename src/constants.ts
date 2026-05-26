export const APP_PORT = 3005;

export const POTTER_API_BASE = 'https://api.potterdb.com/v1';
export const PACK_PAGE_SIZE = 100;
export const MAX_PAGES = 8;
export const DRAFT_PACK_SIZE = 4;
export const CPU_DECK_SIZE = 2;
export const SPELLS_PAGE_SIZE = 100;
export const TOTAL_SPELLS_POOL = 20;

export const BASE_STAT = 50;
export const HP_BASE_BONUS = 80;
export const HP_RANDOM_RANGE = 20;
export const BASE_SPELL_DAMAGE = 30;

export const HOUSE_POWER: Record<string, number> = {
  Gryffindor: 90,
  Slytherin: 85,
  Ravenclaw: 80,
  Hufflepuff: 75,
};

export const SPECIES_MAGIC: Record<string, number> = {
  human: 70,
  'half-giant': 88,
  giant: 95,
  'house elf': 82,
  ghost: 60,
  werewolf: 91,
  vampire: 87,
  centaur: 78,
};

export const ANCESTRY_DEFENSE: Record<string, number> = {
  'pure-blood': 90,
  'half-blood': 75,
  'muggle-born': 70,
  muggle: 40,
  squib: 35,
};

export const SPELL_DAMAGE: Record<string, number> = {
  Charm: 45,
  Curse: 90,
  Hex: 65,
  Jinx: 55,
  Spell: 50,
  Transfiguration: 40,
  'Counter-spell': 35,
  'Healing spell': -40,
};
