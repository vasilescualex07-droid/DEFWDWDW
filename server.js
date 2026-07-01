import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const { Pool } = pg;
const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(express.json());

app.get('/api/leaderboard', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT name, balance, biggest_win, games_played, wins, losses, level, updated_at
      FROM leaderboard
      ORDER BY balance DESC
      LIMIT 50
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/leaderboard/submit', async (req, res) => {
  const { name, balance, biggest_win, games_played, wins, losses, level } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Invalid name' });
  }
  const cleanName = name.trim().slice(0, 32);
  try {
    await pool.query(`
      INSERT INTO leaderboard (name, balance, biggest_win, games_played, wins, losses, level, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (LOWER(name))
      DO UPDATE SET
        balance = EXCLUDED.balance,
        biggest_win = EXCLUDED.biggest_win,
        games_played = EXCLUDED.games_played,
        wins = EXCLUDED.wins,
        losses = EXCLUDED.losses,
        level = EXCLUDED.level,
        updated_at = NOW()
    `, [cleanName, balance, biggest_win, games_played, wins, losses, level]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, 'dist');

if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('/{*path}', (req, res) => {
    res.sendFile(join(distDir, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
