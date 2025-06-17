CREATE TABLE ptd_calendrier (
  id INTEGER PRIMARY KEY,
  date_debut DATE NOT NULL,
  date_fin DATE DEFAULT NULL,
  pays INTEGER NOT NULL DEFAULT 1,
  motif VARCHAR(150) NOT NULL
);

INSERT INTO ptd_calendrier (id, date_debut, date_fin, pays, motif) VALUES
(1, '2025-11-01', NULL, 0, 'jour férié'),
(2, '2025-11-11', NULL, 0, 'jour férié'),
(3, '2025-12-25', NULL, 0, 'jour férié'),
(4, '2026-01-01', NULL, 0, 'jour férié'),
(5, '2026-04-06', NULL, 0, 'jour férié'),
(6, '2026-05-01', NULL, 0, 'jour férié'),
(7, '2026-05-08', NULL, 0, 'jour férié'),
(8, '2026-05-14', NULL, 0, 'jour férié'),
(9, '2026-05-25', NULL, 0, 'jour férié'),
(28, '2025-11-01', NULL, 2, 'jour férié'),
(29, '2025-11-11', NULL, 2, 'jour férié'),
(30, '2025-12-25', NULL, 2, 'jour férié'),
(31, '2026-01-01', NULL, 2, 'jour férié'),
(32, '2026-04-06', NULL, 2, 'jour férié'),
(33, '2026-05-01', NULL, 2, 'jour férié'),
(34, '2026-05-14', NULL, 2, 'jour férié'),
(35, '2026-05-25', NULL, 2, 'jour férié'),
(36, '2026-07-21', NULL, 2, 'jour férié'),
(37, '2026-08-15', NULL, 2, 'jour férié'),
(38, '2025-10-18', '2025-11-03', 4, 'vacances'),
(39, '2025-12-20', '2026-01-05', 4, 'vacances'),
(40, '2026-02-07', '2026-02-23', 4, 'vacances'),
(41, '2026-04-04', '2026-04-20', 4, 'vacances'),
(42, '2026-07-04', '2026-07-04', 4, 'vacances'),
(43, '2025-10-18', '2025-11-03', 3, 'vacances'),
(44, '2025-12-20', '2026-01-05', 3, 'vacances'),
(45, '2026-02-14', '2026-03-02', 3, 'vacances'),
(46, '2026-04-11', '2026-04-27', 3, 'vacances'),
(47, '2026-07-04', '2026-07-04', 3, 'vacances'),
(48, '2025-10-18', '2025-11-03', 1, 'vacances'),
(49, '2025-12-20', '2026-01-05', 1, 'vacances'),
(50, '2026-02-21', '2026-03-09', 1, 'vacances'),
(51, '2026-04-18', '2026-05-04', 1, 'vacances'),
(52, '2026-07-04', '2026-07-04', 1, 'vacances'),
(53, '2025-10-27', '2025-11-02', 2, 'vacances'),
(54, '2025-12-22', '2026-01-04', 2, 'vacances'),
(55, '2026-02-16', '2026-02-27', 2, 'vacances'),
(56, '2026-04-01', '2026-04-20', 2, 'vacances'),
(57, '2026-07-01', '2026-08-31', 2, 'vacances');



CREATE TABLE ptd_categorie (
  id INTEGER PRIMARY KEY,
  nom VARCHAR(20) NOT NULL,
  duree INTEGER NOT NULL DEFAULT 10
);

INSERT INTO ptd_categorie (id, nom) VALUES
(1, 'U14', 50),
(2, 'U19', 70),
(3, 'N1', 90),
(4, 'Elite', 90);


CREATE TABLE ptd_clubs (
  id INTEGER PRIMARY KEY,
  nom VARCHAR(50) NOT NULL,
  code VARCHAR(10) NOT NULL,
  pays INTEGER NOT NULL
);

INSERT INTO ptd_clubs (id, nom, code, pays) VALUES
(1, 'Ivry-sur-Seine', '01905', 1),
(2, 'Shinobis Riders', '01905', 2),
(3, 'Argenteuil R2R', '01486', 1),
(4, 'Pumas Savigny', '02065', 1),
(5, 'UMS Easy Riders Pontault-Combault', '01911', 1),
(6, 'Cabriès Roller Foot', '01889', 3);

CREATE TABLE ptd_creneau (
  id INTEGER PRIMARY KEY,
  date DATE NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  club INTEGER NOT NULL,
  gymnase VARCHAR(100) NOT NULL
);

INSERT INTO ptd_creneau (id, date, heure_debut, heure_fin, club, gymnase) VALUES
(1, '2025-09-07', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(2, '2025-09-28', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(3, '2025-09-14', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(4, '2025-09-21', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(5, '2025-10-05', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(6, '2025-10-12', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(7, '2025-10-19', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(8, '2025-10-26', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(9, '2025-11-02', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(10, '2025-11-09', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(11, '2025-11-16', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(12, '2025-11-23', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(13, '2025-11-30', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(14, '2025-12-07', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(15, '2025-12-14', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(16, '2025-12-21', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(17, '2025-12-28', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(18, '2026-01-04', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(19, '2026-01-11', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(20, '2026-01-18', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(21, '2026-01-25', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(22, '2026-02-01', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(23, '2026-02-08', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(24, '2026-02-15', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(25, '2026-02-22', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(26, '2026-03-01', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(27, '2026-03-08', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(28, '2026-03-15', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(29, '2026-03-22', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(30, '2026-03-29', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(31, '2026-04-05', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(32, '2026-04-12', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(33, '2026-04-19', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(34, '2026-04-26', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(35, '2026-05-03', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(36, '2026-05-10', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(37, '2026-05-17', '14:30:00', '18:30:00', 1, 'Dulcie September'),
(38, '2026-05-24', '14:30:00', '18:30:00', 1, 'Dulcie September');



CREATE TABLE ptd_equipe_engagee (
   id INTEGER PRIMARY KEY,
  nom VARCHAR(50) NOT NULL,
  club INTEGER NOT NULL,
  categorie INTEGER NOT NULL
);


INSERT INTO ptd_equipe_engagee (id, nom, club, categorie) VALUES
(1, 'US Ivry Roller 1  - U14', 1, 1),
(7, 'Shinobis U14', 2, 1),
(11, 'Shinobis U19', 2, 2),
(5, 'US Ivry Roller 2 - U14', 1, 1),
(9, 'US Ivry Roller U19', 1, 2),
(10, 'US Ivry Roller Elite', 1, 4),
(12, 'Shinobis Elite', 2, 4),
(13, 'Argenteuil U14', 3, 1),
(14, 'Argenteuil U19', 3, 2),
(15, 'Pumas U14', 4, 1),
(16, 'Puma U19', 4, 2),
(17, 'Pumas Elite', 4, 4),
(18, 'Pontault-Combault Elite', 5, 4);



CREATE TABLE ptd_match (
  id INTEGER PRIMARY KEY,
  domicile INTEGER NOT NULL,
  exterieur INTEGER NOT NULL,
  categorie INTEGER NOT NULL,
  club_recevant INTEGER NOT NULL,
  creneau_choisi INTEGER DEFAULT NULL
);


INSERT INTO ptd_match (id, domicile, exterieur, categorie, club_recevant, creneau_choisi) VALUES
(1, 1, 5, 1, 1, 0),
(8, 1, 7, 1, 1, 0),
(25, 7, 13, 1, 2, 0),
(24, 1, 13, 1, 1, 0),
(23, 12, 10, 4, 2, 0),
(6, 5, 1, 1, 1, 0),
(22, 10, 12, 4, 1, 0),
(9, 7, 1, 1, 2, 0),
(21, 9, 11, 2, 1, 0),
(11, 7, 5, 1, 2, 0),
(20, 11, 9, 2, 2, 0),
(13, 5, 7, 1, 1, 0),
(26, 5, 13, 1, 1, 0),
(27, 13, 1, 1, 3, 0),
(28, 13, 7, 1, 3, 0),
(29, 13, 5, 1, 3, 0),
(30, 11, 14, 2, 2, 0),
(31, 9, 14, 2, 1, 0),
(32, 14, 11, 2, 3, 0),
(33, 14, 9, 2, 3, 0),
(34, 1, 15, 1, 1, 0),
(35, 7, 15, 1, 2, 0),
(36, 5, 15, 1, 1, 0),
(37, 13, 15, 1, 3, 0),
(38, 15, 1, 1, 4, 0),
(39, 15, 7, 1, 4, 0),
(40, 15, 5, 1, 4, 0),
(41, 15, 13, 1, 4, 0),
(42, 11, 16, 2, 2, 0),
(43, 9, 16, 2, 1, 0),
(44, 14, 16, 2, 3, 0),
(45, 16, 11, 2, 4, 0),
(46, 16, 9, 2, 4, 0),
(47, 16, 14, 2, 4, 0),
(48, 10, 17, 4, 1, 0),
(49, 12, 17, 4, 2, 0),
(50, 17, 10, 4, 4, 0),
(51, 17, 12, 4, 4, 0),
(52, 10, 18, 4, 1, 0),
(53, 12, 18, 4, 2, 0),
(54, 17, 18, 4, 4, 0),
(55, 18, 10, 4, 5, 0),
(56, 18, 12, 4, 5, 0),
(57, 18, 17, 4, 5, 0);
