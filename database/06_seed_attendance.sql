-- Assistència d'exempple per a l'estudiant Amara Dube

-- una cláusula WITH define un conjunto temporal de datos cuya salida está disponible para ser referenciada en consultas posteriores. https://learnsql.es/blog/que-es-la-clausula-with-en-sql/. Així, creem un resultat temporal per emmagatzemar les següents dades i poder provar el rol Parent. 

-- Creem un resultat que li diem amara amb l'id de l'alumna Amara Dube. Seleccionem el seu id de la taula students i filtrem amb el seu nom exacte, retornant 1 resultat com a màxim
WITH amara AS (
  SELECT id FROM students WHERE full_name = 'Amara Dube' LIMIT 1
)
-- inserim els següents registres en la taula attendance (columnes)
INSERT INTO attendance (school_id, student_id, subject_id, date, status, note)
SELECT -- preparem els valors que anem a inserir
  'a0000000-0000-0000-0000-000000000001',
  amara.id,
  v.subject_id::uuid,
  CURRENT_DATE - v.days_ago, -- data actual menys N dies
  v.status,
  v.note
FROM amara,
(VALUES -- No creem taula permanent a Supabase. Tan sols una llistat de valors per a que PostgreSQL els use durant aquesta operació
  ('d0000000-0000-0000-0000-000000000001', 0, 'present',   NULL),
  ('d0000000-0000-0000-0000-000000000002', 0, 'late',      NULL),
  ('d0000000-0000-0000-0000-000000000001', 1, 'present',   NULL),
  ('d0000000-0000-0000-0000-000000000002', 1, 'present',   NULL),
  ('d0000000-0000-0000-0000-000000000001', 2, 'present',   NULL),
  ('d0000000-0000-0000-0000-000000000002', 2, 'present',   NULL),
  ('d0000000-0000-0000-0000-000000000001', 3, 'absent',    'Fever'),
  ('d0000000-0000-0000-0000-000000000002', 3, 'absent',    'Fever'),
  ('d0000000-0000-0000-0000-000000000001', 4, 'present',   NULL),
  ('d0000000-0000-0000-0000-000000000002', 4, 'present',   NULL),
  ('d0000000-0000-0000-0000-000000000001', 7, 'late',      NULL),
  ('d0000000-0000-0000-0000-000000000002', 7, 'present',   NULL),
  ('d0000000-0000-0000-0000-000000000001', 9, 'justified', 'Doctor appointment'),
  ('d0000000-0000-0000-0000-000000000002', 9, 'justified', 'Doctor appointment')
) AS v(subject_id, days_ago, status, note) -- v com a taula temporal
ON CONFLICT (student_id, subject_id, date) DO NOTHING; -- "The ON CONFLICT DO NOTHING clause in PostgreSQL allows you to handle conflicts that arise when attempting to insert data into a table with unique constraints or primary keys. Instead of throwing an error when a conflict occurs, the database ignores the conflicting row, ensuring smooth data handling" (https://www.w3resource.com/PostgreSQL/snippets/postgres-on-conflict-do-nothing.php) -> es tracta d'una protecció: en cas que la combinació d'alumne, matèria i data ja existica, no duplia ni dona error. 