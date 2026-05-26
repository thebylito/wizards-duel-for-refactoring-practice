import express from 'express';
import { APP_PORT } from './constants.ts';
import charactersRouter from './routes/characters.ts';
import spellsRouter from './routes/spells.ts';
import gameRouter from './routes/game.ts';

const app = express();
app.use(express.static('public'));
app.use(express.json());

app.use('/api', charactersRouter);
app.use('/api', spellsRouter);
app.use('/api', gameRouter);

app.listen(APP_PORT, () => {
  console.log(`Rodando na porta ${APP_PORT}`);
});
