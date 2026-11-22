-- Creem l'Arxiu de Dades de Prova -> introduïm notes d'exemple per poder desenvolupar i provar la interfície del teacher i, posteriorment, la dels parents

INSERT INTO grades ( -- volem introduïr registres a la taula grades (indiquem les columnes)
  school_id, 
  student_id, 
  subject_id, 
  term, 
  assessment_name, 
  score, 
  max_score
)
SELECT -- d'on obtenim els valors per a cada columna
  'a0000000-0000-0000-0000-000000000001', -- UUID de l'escola
  st.id,
  su.id,
  v.term,
  v.assessment,
  v.score,
  v.max_score
FROM students st -- consultem la taula students i...
JOIN subjects su ON su.class_id = st.class_id -- relacionem amb les assignatures 
JOIN (VALUES -- creem ací una xicoteta taula temporal dins de la consulta
  ('Mathematics', 1, 'Test 1',     78, 100),
  ('Mathematics', 1, 'Midterm',    82, 100),
  ('Mathematics', 1, 'Assignment', 18, 20),
  ('Mathematics', 2, 'Test 1',     85, 100),
  ('Science',     1, 'Test 1',     65, 100),
  ('Science',     1, 'Midterm',    70, 100),
  ('Setswana',    1, 'Test 1',     74, 100)
) AS v(subject_name, term, assessment, score, max_score) -- donem el nom 'v' a eixa taula temporal i assignem noms a les cinc columnes
  ON v.subject_name = su.name -- comparem el nom de la assignatura de la nostra taula temporal amb el nom de la assignatura real a Supabase
WHERE st.full_name = 'Amara Dube' -- amb WHERE filtrem els resultats per a que les dades d'exemple corresponguen únicament a l'alumna Amara Dube
ON CONFLICT (student_id, subject_id, term, assessment_name) DO NOTHING; -- si volem introduïr avaluació que ja existeix, PostgreSQL detecta i DO NOTHING -> no fa res. Així, no duplica