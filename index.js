require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const useSsl = process.env.DB_SSL === 'true';

const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 5432),
  ssl: useSsl
    ? { rejectUnauthorized: false }
    : false
});

console.log('ENV:', {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS ? '*****' : '(vide)',
  DB_SSL: process.env.DB_SSL,
  PORT: process.env.PORT
});

/*
 * Convertit une valeur en identifiant numérique.
 */
function parseId(value) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const parsedValue = Number.parseInt(
    String(value),
    10
  );

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue <= 0
  ) {
    return null;
  }

  return parsedValue;
}

function sendDatabaseError(
  res,
  error
) {
  console.error('Erreur PostgreSQL :', error);

  return res.status(500).json({
    message: error.message
  });
}

/*
 * Route de contrôle du back.
 */
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');

    res.json({
      status: 'ok'
    });
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

/*
 * Liste publique des clubs.
 *
 * On ne renvoie pas les codes.
 */
app.get('/api/listeclub', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        nom,
        pays,
        zone
      FROM ptd_clubs
      ORDER BY nom
    `);

    res.json(result.rows);
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

/*
 * Liste des saisons.
 *
 * Dans ta base, la table s'appelle réellement :
 *
 * saison
 *
 * Le champ nom est un CHAR(30), donc TRIM évite
 * de recevoir des espaces en fin de libellé.
 */
async function getListeSaisons(
  req,
  res
) {
  try {
    const result = await db.query(`
      SELECT *
      FROM saison
      ORDER BY
        date_debut DESC NULLS LAST,
        id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    sendDatabaseError(res, error);
  }
}

app.get('/api/saison', getListeSaisons);
app.get('/api/listesaison', getListeSaisons);

/*
 * Validation du code club.
 */
app.post('/api/validcode', async (req, res) => {
  const clubId = parseId(req.body.id);

  const code = String(
    req.body.code || ''
  ).trim();

  if (
    clubId === null ||
    code.length === 0
  ) {
    return res.status(400).json({
      valid: false,
      message:
        'Le club et le code sont obligatoires.'
    });
  }

  try {
    const result = await db.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM ptd_clubs
          WHERE id = $1
            AND code = $2
        ) AS valid
      `,
      [
        clubId,
        code
      ]
    );

    res.json({
      valid:
        result.rows[0].valid === true
    });
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

/*
 * Configuration réelle des tables.
 *
 * seasonal = la table possède une colonne saison.
 */
const tableConfigurations = {
  categorie: {
    table: 'ptd_categorie',
    fields: [
      'nom',
      'duree'
    ],
    seasonal: true
  },

  clubs: {
    table: 'ptd_clubs',
    fields: [
      'nom',
      'code',
      'pays',
      'zone'
    ],
    seasonal: false
  },

  creneau: {
    table: 'ptd_creneau',
    fields: [
      'date',
      'heure_debut',
      'heure_fin',
      'club',
      'gymnase',
      'notes',
      'creneau_confirme',
      'un_club'
    ],
    defaults: {
      creneau_confirme: false
    },
    seasonal: true
  },

  equipe_engagee: {
    table: 'ptd_equipe_engagee',
    fields: [
      'nom',
      'club',
      'categorie'
    ],
    seasonal: true
  },

  match: {
    table: 'ptd_match',
    fields: [
      'domicile',
      'exterieur',
      'categorie',
      'club_recevant',
      'creneau_choisi',
      'arbitre',
      'requete_arbitre'
    ],
    defaults: {
      requete_arbitre: false
    },
    seasonal: true
  },

  gymnase: {
    table: 'ptd_gymnase',
    fields: [
      'nom',
      'club'
    ],
    seasonal: false
  }
};

/*
 * Génération des routes standards :
 *
 * GET
 * GET /:id
 * POST
 * PUT
 * DELETE
 */
function setupTableRoutes(
  routeName,
  configuration
) {
  const {
    table,
    fields,
    seasonal,
    defaults = {}
  } = configuration;

  /*
   * LISTE
   *
   * Le filtre saison est appliqué uniquement
   * aux tables qui possèdent réellement la colonne.
   *
   * S'il n'y a pas de paramètre saison, on ne bloque pas :
   * on retourne tout, ce qui conserve la compatibilité
   * avec les anciens écrans.
   */
  app.get(
    `/api/${routeName}`,
    async (req, res) => {
      try {
        console.log(`Requête pour ${routeName} saison=${req.query.saison}, seasonal=${seasonal}`);
        const saisonId = seasonal
          ? parseId(req.query.saison)
          : null;

        const clubId =
          parseId(req.query.club);

        const whereClauses = [];
        const values = [];

        if (
          seasonal &&
          saisonId !== null
        ) {
          values.push(saisonId);

          whereClauses.push(
            `saison = $${values.length}`
          );
        }

        /*
         * Pour les gymnases, le front peut envoyer :
         *
         * GET /api/gymnase?club=4
         */
        if (
          routeName === 'gymnase' &&
          clubId !== null
        ) {
          values.push(clubId);

          whereClauses.push(
            `club = $${values.length}`
          );
        }

        const whereSql =
          whereClauses.length > 0
            ? `WHERE ${whereClauses.join(' AND ')}`
            : '';

        const result = await db.query(
          `
            SELECT *
            FROM ${table}
            ${whereSql}
            ORDER BY id
          `,
          values
        );

        res.json(result.rows);
      } catch (error) {
        sendDatabaseError(res, error);
      }
    }
  );

  /*
   * LECTURE PAR ID
   *
   * La saison est utilisée comme sécurité supplémentaire
   * lorsqu'elle est fournie.
   */
  app.get(
    `/api/${routeName}/:id`,
    async (req, res) => {
      const id = parseId(req.params.id);

      if (id === null) {
        return res.status(400).json({
          message: 'Identifiant invalide.'
        });
      }

      try {
        const saisonId = seasonal
          ? parseId(req.query.saison)
          : null;

        let sql = `
          SELECT *
          FROM ${table}
          WHERE id = $1
        `;

        const values = [id];

        if (
          seasonal &&
          saisonId !== null
        ) {
          sql += `
            AND saison = $2
          `;

          values.push(saisonId);
        }

        const result = await db.query(
          sql,
          values
        );

        if (result.rowCount === 0) {
          return res.status(404).json({
            message:
              `${routeName} introuvable.`
          });
        }

        res.json(result.rows[0]);
      } catch (error) {
        sendDatabaseError(res, error);
      }
    }
  );

  /*
   * CRÉATION
   *
   * Pour les tables saisonnalisées, le front doit envoyer :
   *
   * {
   *   ...,
   *   saison: 2
   * }
   *
   * On accepte aussi ?saison=2 pour plus de souplesse.
   */
  app.post(
    `/api/${routeName}`,
    async (req, res) => {
      const saisonId = seasonal
        ? parseId(
            req.body.saison ??
            req.query.saison
          )
        : null;

      if (
        seasonal &&
        saisonId === null
      ) {
        return res.status(400).json({
          message:
            `La saison est obligatoire pour créer ${routeName}.`
        });
      }

      try {
        const insertFields = [
          ...fields
        ];

        const values = fields.map(
          field =>
            req.body[field] !== undefined
              ? req.body[field]
              : (
                  defaults[field] !== undefined
                    ? defaults[field]
                    : null
                )
        );

        if (seasonal) {
          insertFields.push('saison');
          values.push(saisonId);
        }

        const placeholders =
          insertFields.map(
            (_, index) => `$${index + 1}`
          );

        const result = await db.query(
          `
            INSERT INTO ${table}
            (
              ${insertFields.join(', ')}
            )
            VALUES
            (
              ${placeholders.join(', ')}
            )
            RETURNING *
          `,
          values
        );

        const created = result.rows[0];

        res.status(201).json({
          id: created.id,
          data: created
        });
      } catch (error) {
        sendDatabaseError(res, error);
      }
    }
  );

  /*
   * MODIFICATION
   *
   * Le front actuel envoie l'objet complet.
   * On met donc à jour les champs connus de la table.
   */
  app.put(
    `/api/${routeName}/:id`,
    async (req, res) => {
      const id = parseId(req.params.id);

      if (id === null) {
        return res.status(400).json({
          message: 'Identifiant invalide.'
        });
      }

      const saisonId = seasonal
        ? parseId(
            req.body.saison ??
            req.query.saison
          )
        : null;

      if (
        seasonal &&
        saisonId === null
      ) {
        return res.status(400).json({
          message:
            `La saison est obligatoire pour modifier ${routeName}.`
        });
      }

      try {
        const updateFields = [
          ...fields
        ];

        const values = fields.map(
          field =>
            req.body[field] !== undefined
              ? req.body[field]
              : (
                  defaults[field] !== undefined
                    ? defaults[field]
                    : null
                )
        );

        if (seasonal) {
          updateFields.push('saison');
          values.push(saisonId);
        }

        const setSql =
          updateFields.map(
            (field, index) =>
              `${field} = $${index + 1}`
          );

        values.push(id);

        const idParameter =
          values.length;

        let sql = `
          UPDATE ${table}
          SET ${setSql.join(', ')}
          WHERE id = $${idParameter}
        `;

        /*
         * On empêche de modifier par erreur
         * une donnée appartenant à une autre saison.
         */
        if (seasonal) {
          values.push(saisonId);

          sql += `
            AND saison = $${values.length}
          `;
        }

        sql += `
          RETURNING *
        `;

        const result = await db.query(
          sql,
          values
        );

        if (result.rowCount === 0) {
          return res.status(404).json({
            message:
              `${routeName} introuvable pour cette saison.`
          });
        }

        res.json({
          updated: true,
          data: result.rows[0]
        });
      } catch (error) {
        sendDatabaseError(res, error);
      }
    }
  );

  /*
   * SUPPRESSION
   *
   * La saison est appliquée lorsqu'elle est transmise,
   * mais elle n'est pas obligatoire, car les identifiants
   * sont déjà uniques dans PostgreSQL.
   */
  app.delete(
    `/api/${routeName}/:id`,
    async (req, res) => {
      const id = parseId(req.params.id);

      if (id === null) {
        return res.status(400).json({
          message: 'Identifiant invalide.'
        });
      }

      try {
        const saisonId = seasonal
          ? parseId(
              req.query.saison ??
              req.body?.saison
            )
          : null;
        let sql = `
          DELETE FROM ${table}
          WHERE id = $1
        `;

        const values = [id];

        if (
          seasonal &&
          saisonId !== null
        ) {
          sql += `
            AND saison = $2
          `;

          values.push(saisonId);
        }

        sql += `
          RETURNING *
        `;

        const result = await db.query(
          sql,
          values
        );

        if (result.rowCount === 0) {
          return res.status(404).json({
            message:
              `${routeName} introuvable.`
          });
        }

        res.json({
          deleted: true,
          id,
          data: result.rows[0]
        });
      } catch (error) {
        sendDatabaseError(res, error);
      }
    }
  );
}

/*
 * Route spécifique du calendrier.
 *
 * La table ptd_calendrier possède :
 *
 * - saison
 * - date_debut
 * - date_fin
 *
 * On applique donc :
 *
 * 1. la saison sélectionnée ;
 * 2. la vérification que les dates chevauchent
 *    bien les dates de cette saison.
 */
function normalizeZone(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const zone = String(value)
    .trim()
    .toUpperCase();

  return ['A', 'B', 'C'].includes(zone)
    ? zone
    : null;
}

/*
 * La liste de connexion doit contenir pays et zone :
 *
 * SELECT id, nom, pays, zone
 * FROM ptd_clubs
 * ORDER BY nom
 */

/*
 * REMPLACER toutes les routes /api/calendrier existantes
 * par ce bloc.
 *
 * ptd_calendrier sert à la fois pour :
 * - vacances / jours fériés : club NULL, equipe NULL ;
 * - indisponibilité club : club renseigné, equipe NULL ;
 * - indisponibilité équipe : club et equipe renseignés.
 */

app.get(
  '/api/calendrier',
  async (req, res) => {
    const saisonId =
      parseId(req.query.saison);

    if (saisonId === null) {
      return res.status(400).json({
        message:
          'Le paramètre saison est obligatoire pour le calendrier.'
      });
    }

    try {
      const result = await db.query(
        `
          SELECT calendrier.*
          FROM ptd_calendrier calendrier

          LEFT JOIN saison saison_selectionnee
            ON saison_selectionnee.id = $1

          WHERE calendrier.saison = $1

            AND (
              saison_selectionnee.date_fin IS NULL
              OR calendrier.date_debut
                   <= saison_selectionnee.date_fin
            )

            AND (
              saison_selectionnee.date_debut IS NULL
              OR COALESCE(
                   calendrier.date_fin,
                   calendrier.date_debut
                 ) >= saison_selectionnee.date_debut
            )

          ORDER BY
            calendrier.date_debut,
            calendrier.date_fin NULLS LAST,
            calendrier.id
        `,
        [saisonId]
      );

      res.json(result.rows);
    } catch (error) {
      sendDatabaseError(
        res,
        error
      );
    }
  }
);

app.get(
  '/api/calendrier/:id',
  async (req, res) => {
    const id =
      parseId(req.params.id);

    const saisonId =
      parseId(req.query.saison);

    if (id === null) {
      return res.status(400).json({
        message:
          'Identifiant invalide.'
      });
    }

    try {
      const values = [id];

      let sql = `
        SELECT *
        FROM ptd_calendrier
        WHERE id = $1
      `;

      if (saisonId !== null) {
        values.push(saisonId);

        sql += `
          AND saison = $2
        `;
      }

      const result = await db.query(
        sql,
        values
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          message:
            'Élément de calendrier introuvable.'
        });
      }

      res.json(result.rows[0]);
    } catch (error) {
      sendDatabaseError(
        res,
        error
      );
    }
  }
);

app.post(
  '/api/calendrier',
  async (req, res) => {
    const saisonId =
      parseId(
        req.body.saison ??
        req.query.saison
      );

    if (saisonId === null) {
      return res.status(400).json({
        message:
          'La saison est obligatoire.'
      });
    }

    if (!req.body.date_debut) {
      return res.status(400).json({
        message:
          'La date de début est obligatoire.'
      });
    }

    if (
      !String(
        req.body.motif ?? ''
      ).trim()
    ) {
      return res.status(400).json({
        message:
          'Le motif est obligatoire.'
      });
    }

    try {
      const result = await db.query(
        `
          INSERT INTO ptd_calendrier
          (
            date_debut,
            date_fin,
            pays,
            motif,
            equipe,
            saison,
            club,
            heure_debut,
            heure_fin,
            zone
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10
          )
          RETURNING *
        `,
        [
          req.body.date_debut,
          req.body.date_fin ?? null,
          Number(req.body.pays ?? 1),
          String(req.body.motif).trim(),
          req.body.equipe ?? null,
          saisonId,
          req.body.club ?? null,
          req.body.heure_debut ?? null,
          req.body.heure_fin ?? null,
          normalizeZone(
            req.body.zone
          )
        ]
      );

      const created =
        result.rows[0];

      res.status(201).json({
        id: created.id,
        data: created
      });
    } catch (error) {
      sendDatabaseError(
        res,
        error
      );
    }
  }
);

app.put(
  '/api/calendrier/:id',
  async (req, res) => {
    const id =
      parseId(req.params.id);

    const saisonId =
      parseId(
        req.body.saison ??
        req.query.saison
      );

    if (
      id === null ||
      saisonId === null
    ) {
      return res.status(400).json({
        message:
          'Identifiant ou saison invalide.'
      });
    }

    try {
      const result = await db.query(
        `
          UPDATE ptd_calendrier

          SET
            date_debut = $1,
            date_fin = $2,
            pays = $3,
            motif = $4,
            equipe = $5,
            club = $6,
            heure_debut = $7,
            heure_fin = $8,
            zone = $9

          WHERE id = $10
            AND saison = $11

          RETURNING *
        `,
        [
          req.body.date_debut,
          req.body.date_fin ?? null,
          Number(req.body.pays ?? 1),
          String(req.body.motif ?? '').trim(),
          req.body.equipe ?? null,
          req.body.club ?? null,
          req.body.heure_debut ?? null,
          req.body.heure_fin ?? null,
          normalizeZone(
            req.body.zone
          ),
          id,
          saisonId
        ]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          message:
            'Élément de calendrier introuvable pour cette saison.'
        });
      }

      res.json({
        updated: true,
        data: result.rows[0]
      });
    } catch (error) {
      sendDatabaseError(
        res,
        error
      );
    }
  }
);

app.delete(
  '/api/calendrier/:id',
  async (req, res) => {
    const id =
      parseId(req.params.id);

    const saisonId =
      parseId(req.query.saison);

    if (id === null) {
      return res.status(400).json({
        message:
          'Identifiant invalide.'
      });
    }

    try {
      const values = [id];

      let sql = `
        DELETE FROM ptd_calendrier
        WHERE id = $1
      `;

      if (saisonId !== null) {
        values.push(saisonId);

        sql += `
          AND saison = $2
        `;
      }

      sql += `
        RETURNING *
      `;

      const result = await db.query(
        sql,
        values
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          message:
            'Élément de calendrier introuvable.'
        });
      }

      res.json({
        deleted: true,
        id,
        data: result.rows[0]
      });
    } catch (error) {
      sendDatabaseError(
        res,
        error
      );
    }
  }
);

/*
 * Initialisation des routes génériques.
 */
Object.entries(
  tableConfigurations
).forEach(
  ([routeName, configuration]) => {
    setupTableRoutes(
      routeName,
      configuration
    );
  }
);

const port = Number(
  process.env.PORT || 3300
);

app.listen(port, () => {
  console.log(
    `API running on port ${port}`
  );
});