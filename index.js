require('dotenv').config();
console.log('ENV:', {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS ? '*****' : '(vide)',
  DB_SSL: process.env.DB_SSL,
  PORT: process.env.PORT_APP
});
const express = require('express');
const { Pool } = require('pg'); // 👈 PostgreSQL
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());


const useSsl = process.env.DB_SSL === 'true';

const db = new Pool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port:     process.env.DB_PORT,
  ssl:      useSsl
    ? { rejectUnauthorized: false }
    : false
});

// Exemple d'endpoint
app.get('/api/listeclub', (req, res) => {
  db.query('SELECT id, nom FROM ptd_clubs', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results.rows);
  });
});

app.post('/api/validcode', async (req, res) => {
  const { id, code } = req.body;

  try {
    const result = await db.query(
      'SELECT COUNT(id) AS count FROM ptd_clubs WHERE id = $1 AND code = $2',
      [id, code]
    );

    const isValid = result.rows[0].count === '1'; // Attention : COUNT retourne une string !
    res.json({ valid: isValid });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Génère les endpoints pour une table
function setupTableRoutes(name, fields) {
  const fieldsStr = fields.join(', ');
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
  const updateStr = fields.map((f, i) => `${f}=$${i + 1}`).join(', ');

  app.get(`/api/${name}`, async (req, res) => {
    try {
      const result = await db.query(`SELECT * FROM ptd_${name}`);
      res.json(result.rows);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  app.get(`/api/${name}/:id`, async (req, res) => {
    try {
      const result = await db.query(`SELECT * FROM ptd_${name} WHERE id = $1`, [req.params.id]);
      res.json(result.rows[0] || {});
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  app.post(`/api/${name}`, async (req, res) => {
    try {
      const vals = fields.map(f => req.body[f]);
      const result = await db.query(
        `INSERT INTO ptd_${name} (${fieldsStr}) VALUES (${placeholders}) RETURNING id`
        , vals
      );
      res.json({ id: result.rows[0].id });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  app.put(`/api/${name}/:id`, async (req, res) => {
    try {
      const vals = fields.map(f => req.body[f]);
      vals.push(req.params.id);
      await db.query(`UPDATE ptd_${name} SET ${updateStr} WHERE id = $${vals.length}`, vals);
      res.json({ updated: true });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  app.delete(`/api/${name}/:id`, async (req, res) => {
    try {
      await db.query(`DELETE FROM ptd_${name} WHERE id = $1`, [req.params.id]);
      res.json({ deleted: true });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
}

// Déclarations des tables
setupTableRoutes('calendrier', ['date_debut','date_fin','pays','motif']);
setupTableRoutes('categorie', ['nom', 'duree']);
setupTableRoutes('clubs', ['nom','code','pays']);
setupTableRoutes('creneau', ['date','heure_debut','heure_fin','club','gymnase', 'notes']);
setupTableRoutes('equipe_engagee', ['nom','club','categorie']);
setupTableRoutes('match', ['domicile','exterieur','categorie','club_recevant','creneau_choisi']);
setupTableRoutes('gymnase', ['nom', 'club']);





const PORT = process.env.PORT_APP || 3300;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
