require('dotenv').config();
const express = require('express');
const { Pool } = require('pg'); // 👈 PostgreSQL
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());


const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DB,
  port:process.env.PORT,
   ssl: {
    rejectUnauthorized: false
  }
});

// Exemple d'endpoint
app.get('/api/listeclub', (req, res) => {
  db.query('SELECT id, nom FROM ptd_clubs', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});
app.post('/api/validcode', (req, res) => {
  const { id, code } = req.body; // ✅ récupère correctement depuis le JSON du body

  db.query(
    'SELECT COUNT(id) AS count FROM ptd_clubs WHERE id = ? AND code = ?',
    [id, code],
    (err, results) => {
      if (err) return res.status(500).send(err);

      // Renvoie true si 1 résultat, false sinon
      const isValid = results[0].count === 1;
      res.json({ valid: isValid });
    }
  );
});

// Génère les endpoints pour une table
function setupTableRoutes(name, fields) {
  const fieldsStr = fields.join(', ');
  const placeholders = fields.map(() => '?').join(', ');
  const updateStr = fields.map(f => `${f}=?`).join(', ');

  app.get(`/api/${name}`, (req, res) => {
    db.query(`SELECT * FROM ptd_${name}`, (err, results) =>
      err ? res.status(500).send(err) : res.json(results)
    );
  });

  app.get(`/api/${name}/:id`, (req, res) => {
    db.query(`SELECT * FROM ptd_${name} WHERE id = ?`, [req.params.id],
      (err, results) =>
        err ? res.status(500).send(err) : res.json(results[0] || {})
    );
  });

  app.post(`/api/${name}`, (req, res) => {
    const vals = fields.map(f => req.body[f]);
    db.query(`INSERT INTO ptd_${name} (${fieldsStr}) VALUES (${placeholders})`, vals,
      (err, result) =>
        err ? res.status(500).send(err) : res.json({id: result.insertId})
    );
  });

  app.put(`/api/${name}/:id`, (req, res) => {
    const vals = [...fields.map(f => req.body[f]), req.params.id];
    db.query(`UPDATE ptd_${name} SET ${updateStr} WHERE id = ?`, vals,
      (err) => err ? res.status(500).send(err) : res.json({updated: true})
    );
  });

  app.delete(`/api/${name}/:id`, (req, res) => {
    db.query(`DELETE FROM ptd_${name} WHERE id = ?`, [req.params.id],
      (err) => err ? res.status(500).send(err) : res.json({deleted: true})
    );
  });
}

// Déclarations des tables
setupTableRoutes('calendrier', ['date_debut','date_fin','pays','motif']);
setupTableRoutes('categorie', ['nom', 'duree']);
setupTableRoutes('clubs', ['nom','code','pays']);
setupTableRoutes('creneau', ['date','heure_debut','heure_fin','club','gymnase']);
setupTableRoutes('equipe_engagee', ['nom','club','categorie']);
setupTableRoutes('match', ['domicile','exterieur','categorie','club_recevant','creneau_choisi']);





const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
