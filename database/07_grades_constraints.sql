-- 3 Regles importants que creem a PostgreSQL per a quan s'introduïsca o modifique una nota. Així, protegim les dades a la pròpia bbdd

-- 1a Restricció -> Evitem avaluacions duplicades. Una sola nota per alumne, assignatura, term i avaluació. Ens cal per guardar amb upsert.
ALTER TABLE grades -- modifiquem l'estrutura de la taula grades
  ADD CONSTRAINT grades_unique_assessment -- "SQL constraints are rules that allow data to be entered into a table only if it meets the predefined conditions. They are part of your database schema, the broader set of rules that governs your database." https://www.cockroachlabs.com/blog/sql-add-constraint/ Afegim una restricció (nom molt descriptiu)
  UNIQUE (student_id, subject_id, term, assessment_name); -- Aquesta és la restricció -> no pot repetir-se la combinació dels 4 camps. Així, si s'han d'actualizar amb upsert(), Supabase sàpiga quin registre actualitzar.


-- 2a Restricció -> La nota no pot superar el màxim
ALTER TABLE grades
  ADD CONSTRAINT grades_score_range
  CHECK (score IS NULL OR (score >= 0 AND score <= max_score)); -- PostgreSQL comprovarà la següent condició -> score IS NULL OR (score >= 0 AND score <= max_score). 

-- 2a Restricció -> El màxim ha de ser positiu. Evitem dividir per 0 en calcular percentatges
ALTER TABLE grades
  ADD CONSTRAINT grades_max_positive
  CHECK (max_score > 0);