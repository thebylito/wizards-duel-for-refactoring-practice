import { Router } from 'express';
import { TOTAL_SPELLS_POOL } from '../constants.ts';
import { fetchSpells } from '../services/potterApi.ts';
import { buildSpellCard, shuffle } from '../services/statsCalculator.ts';

const router = Router();

router.get('/spells', async (_req, res) => {
  try {
    const spells = await fetchSpells();

    const spellCards = spells.map(buildSpellCard).filter((spell) => spell !== null);
    const shuffled = shuffle(spellCards);

    res.json({ spells: shuffled.slice(0, TOTAL_SPELLS_POOL) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'erro ao buscar feiticos' });
  }
});

export default router;
