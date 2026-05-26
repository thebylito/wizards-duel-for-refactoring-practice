import fetch from 'node-fetch';
import { POTTER_API_BASE, PACK_PAGE_SIZE, SPELLS_PAGE_SIZE } from '../constants.ts';

export interface CharacterAttributes {
  name: string | null;
  house: string | null;
  species: string | null;
  ancestry: string | null;
  image: string | null;
}

export interface CharacterData {
  id: string;
  attributes: CharacterAttributes;
}

export interface SpellAttributes {
  name: string | null;
  effect: string | null;
  category: string | null;
  light: string | null;
}

export interface SpellData {
  id: string;
  attributes: SpellAttributes;
}

interface PotterApiResponse<T> {
  data: T[];
}

export const fetchCharactersPage = async (page: number): Promise<CharacterData[]> => {
  const response = await fetch(
    `${POTTER_API_BASE}/characters?page[size]=${PACK_PAGE_SIZE}&page[number]=${page}`,
  );
  const data = (await response.json()) as PotterApiResponse<CharacterData>;
  return data.data;
};

export const fetchSpells = async (): Promise<SpellData[]> => {
  const response = await fetch(`${POTTER_API_BASE}/spells?page[size]=${SPELLS_PAGE_SIZE}`);
  const data = (await response.json()) as PotterApiResponse<SpellData>;
  return data.data;
};
