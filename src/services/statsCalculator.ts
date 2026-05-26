import {
  BASE_STAT,
  BASE_SPELL_DAMAGE,
  HP_BASE_BONUS,
  HP_RANDOM_RANGE,
  HOUSE_POWER,
  SPECIES_MAGIC,
  ANCESTRY_DEFENSE,
  SPELL_DAMAGE,
} from '../constants.ts';
import type { CharacterData, SpellData } from './potterApi.ts';

export interface CharacterCard {
  id: string;
  name: string;
  house: string;
  species: string;
  ancestry: string;
  image: string;
  power: number;
  magic: number;
  defense: number;
  hp: number;
  maxHp: number;
}

export interface SpellCard {
  id: string;
  name: string;
  effect: string;
  category: string;
  light: string;
  damage: number;
}

export const calculatePower = (house: string | null): number =>
  HOUSE_POWER[house ?? ''] ?? BASE_STAT;

export const calculateMagic = (species: string | null): number =>
  SPECIES_MAGIC[species ?? ''] ?? BASE_STAT;

export const calculateDefense = (ancestry: string | null): number =>
  ANCESTRY_DEFENSE[ancestry ?? ''] ?? BASE_STAT;

export const calculateHp = (defense: number): number =>
  defense + Math.floor(Math.random() * HP_RANDOM_RANGE) + HP_BASE_BONUS;

export const calculateSpellDamage = (category: string | null): number =>
  SPELL_DAMAGE[category ?? ''] ?? BASE_SPELL_DAMAGE;

export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const buildCharacterCard = (character: CharacterData): CharacterCard | null => {
  const { id, attributes } = character;
  if (!attributes.name || !attributes.image) return null;

  const power = calculatePower(attributes.house);
  const magic = calculateMagic(attributes.species);
  const defense = calculateDefense(attributes.ancestry);
  const hp = calculateHp(defense);

  return {
    id,
    name: attributes.name,
    house: attributes.house ?? 'Unknown',
    species: attributes.species ?? 'Unknown',
    ancestry: attributes.ancestry ?? 'Unknown',
    image: attributes.image,
    power,
    magic,
    defense,
    hp,
    maxHp: hp,
  };
};

export const buildSpellCard = (spell: SpellData): SpellCard | null => {
  const { id, attributes } = spell;
  if (!attributes.name) return null;

  return {
    id,
    name: attributes.name,
    effect: attributes.effect ?? 'Efeito desconhecido',
    category: attributes.category ?? 'Spell',
    light: attributes.light ?? 'Unknown',
    damage: calculateSpellDamage(attributes.category),
  };
};
