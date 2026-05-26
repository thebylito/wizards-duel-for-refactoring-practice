import { Router } from 'express';
import { CPU_DECK_SIZE, MAX_PAGES } from '../constants.ts';
import { fetchCharactersPage } from '../services/potterApi.ts';
import { buildCharacterCard, shuffle } from '../services/statsCalculator.ts';

const router = Router();

router.post('/cpu-deck', async (_req, res) => {
  try {
    const randomPage = Math.floor(Math.random() * MAX_PAGES) + 1;
    const characters = await fetchCharactersPage(randomPage);

    const cards = characters.map(buildCharacterCard).filter((card) => card !== null);
    const shuffled = shuffle(cards);

    res.json({ deck: shuffled.slice(0, CPU_DECK_SIZE) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'erro ao montar deck cpu' });
  }
});

export default router;
