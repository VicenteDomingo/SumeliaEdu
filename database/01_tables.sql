/* 
1. Taula schools -> Cada escola representa un tenant indepentent. Totes les dades de cada escola estan aïllats. 
*/
CREATE TABLE schools (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- tipus de dada "Universal Unique Identifier". PRIMARY KEY -> "Every well-designed SQL table includes a primary key, whether it's a single column or a combination of multiple columns."https://mimo.org/glossary/sql/primary-key . En cas de no donar un id en insertar, PostgreSQL en genera un automàticament. 
  name        TEXT NOT NULL, -- columna de text. NOT NULL -> es obligatòria. No podem crear una escola sense nom.
  country     TEXT NOT NULL DEFAULT 'Botswana',
  currency    TEXT NOT NULL DEFAULT 'BWP',
  logo_url    TEXT, -- Opcional
  primary_color TEXT DEFAULT '#0D47A1',
  created_at  TIMESTAMPTZ DEFAULT NOW() -- quan es va crear cada fila
);


/* 
2. Taula profiles -> Aquesta taula exten la taula auth.users de Supabase. Cada usuari disposa d'un rol: admin, teacher o parent
*/
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- REFERENCES auth.users(id) -> l'id ha d'existir ja a la taula auth.users, és a dir, la taula de Supabase on guardem email i contrasenya. 
  school_id   UUID REFERENCES schools(id) ON DELETE CASCADE, -- cada perfil apunta a una escola existent. Aquesta és la base del multi-tenancy -> cada fila sap a quina escola perteneix. Si borrem l'escola, es borra tot el que pertany. 
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'parent')),
  email       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


/* 
3. Taula classes 
*/
CREATE TABLE classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID REFERENCES schools(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  year        INT NOT NULL DEFAULT 2026,
  tutor_id    UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


/*
4. Taula students. class_id y parent_id son dues foreign keys ("foreign key is a field or set of fields in one table that refers to the primary key in another table. This foreign key creates a link between tables to ensure that the data in the referencing table matches valid entries in the referenced table." https://www.datacamp.com/tutorial/foreign-key?utm_cid=23340058068&utm_aid=192632749329&utm_campaign=230119_1-ps-dscia~dsa-tofu~sql_2-b2c_3-europe_4-prc_5-na_6-na_7-le_8-pdsh-go_9-nb-e_10-na_11-na&utm_loc=20297-&utm_mtd=-c&utm_kw=&utm_source=google&utm_medium=paid_search&utm_content=ps-dscia~europe-en~dsa~tofu~tutorial~sql&gad_source=1&gad_campaignid=23340058068&gbraid=0AAAAADQ9WsEFM8neRAVe6_MrZqzSnksS-&gclid=CjwKCAjwo5bXBhAEEiwAkgpgXG2J6hIDmwGaGO96GGqdcFL5wS2Jq2xEaGBzu6TfgDpijy5-8ck7WhoCyF0QAvD_BwE) class_id -> quina classe està?; parent_id -> qui és seu pare/mare?
Amb active BOOLEAN DEFAULT TRUE ens permet "desactivar" un alumne sense eliminar-lo. 
*/
CREATE TABLE students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID REFERENCES schools(id) ON DELETE CASCADE,
  class_id        UUID REFERENCES classes(id),
  parent_id       UUID REFERENCES profiles(id),
  full_name       TEXT NOT NULL,
  admission_no    TEXT,
  date_of_birth   DATE,
  gender          TEXT CHECK (gender IN ('male', 'female', 'other')),
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);


/*
5. Taula subjects. Uneix una classe amb un professor (classe_id i teachear_id). D'aquesta manera sabem qui dona, per exemple, matemàtiques en Grade 6A.
*/
CREATE TABLE subjects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID REFERENCES schools(id) ON DELETE CASCADE,
  class_id    UUID REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id  UUID REFERENCES profiles(id),
  name        TEXT NOT NULL,
  code        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


/*
6. Taula attendance. Unim ací alumne, assignatura i data, amb l'estat limitat per CHECK
*/
CREATE TABLE attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID REFERENCES schools(id) ON DELETE CASCADE,
  student_id  UUID REFERENCES students(id) ON DELETE CASCADE,
  subject_id  UUID REFERENCES subjects(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  status      TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'justified')),
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),


  -- Un alumne no podrà tenir dos registres per a la mateixa assignatura el mateix dia
  UNIQUE (student_id, subject_id, date)
);


/*
7. Taula grades. Limitem el term a 1, 2 o 3, com trobem a Botswana o els països del Sud d'Àfrica. 
*/
CREATE TABLE grades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID REFERENCES schools(id) ON DELETE CASCADE,
  student_id      UUID REFERENCES students(id) ON DELETE CASCADE,
  subject_id      UUID REFERENCES subjects(id) ON DELETE CASCADE,
  term            INT NOT NULL CHECK (term IN (1, 2, 3)),
  assessment_name TEXT NOT NULL,
  score           NUMERIC(5,2),
  max_score       NUMERIC(5,2) DEFAULT 100,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);


/*
8. Taula announcements. Amb target -> limita a 'all', 'parents', 'teachers', 'class'. 
*/
CREATE TABLE announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID REFERENCES schools(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES profiles(id),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  target      TEXT NOT NULL CHECK (target IN ('all', 'parents', 'teachers', 'class')),
  class_id    UUID REFERENCES classes(id),
  pinned      BOOLEAN DEFAULT FALSE,
  rsvp        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


/*
9. Taula rsvp_responses. Guardem la resposta de cada usuari. Amb UNIQUE (announcement_id, user_id) -> impedim que algú puga respondre dues vegades al mateix announcement. 
*/
CREATE TABLE rsvp_responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  response        TEXT CHECK (response IN ('yes', 'no')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (announcement_id, user_id)
);


/*
10. Taula fees
*/
CREATE TABLE fees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID REFERENCES schools(id) ON DELETE CASCADE,
  student_id  UUID REFERENCES students(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  due_date    DATE,
  paid        BOOLEAN DEFAULT FALSE,
  paid_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


/*
11. Taula messages
*/
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  from_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  CHECK (from_id <> to_id)
);