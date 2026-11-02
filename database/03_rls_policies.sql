/*
Activem RLS en totes les taules. 

"Row Level Security (RLS) is a way to restrict what a given user can read and write in a Postgres database. This is accomplished through policies. Policies created for select and delete statements effectively append to the where clause of the query to ensure the correct data is returned. Policies on statements that modify data like insert or update will check the query to make sure no violations occur, preventing data from being modified when it shouldn’t be." https://dev.to/brianmmdev/an-introduction-to-postgres-row-level-security-rls-306k

ALTER TABLE -> modifiquem l'estructura de la taula
ENABLE ROW LEVEL SECURITY -> li diem a PostgreSQL que active les comprobacions de seguretat basades en l'usuari que realitza la consulta

"Once enabled, policies can be created on the table to apply the checks and filters"

*/

ALTER TABLE schools       ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE students      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance    ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades        ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees          ENABLE ROW LEVEL SECURITY;


/*
Les policies s'han de crear per cada taula i per cada tipus d'operació (SELECT, INSERT, UPDATE, DELETE) que es vulgui controlar.
*/

-- PROFILES
-- Cada usuari sols pot veure perfils de la seva mateixa escola
CREATE POLICY "profiles_select" -- descripció de la policy
ON profiles FOR SELECT          -- taula on s'aplica la policy i tipus d'operació. 
USING (school_id = get_my_school_id()); -- que fa la política? get_my_school_id() ens retorna l'id de l'escola de l'usuari autenticat (auth.uid()).

-- Cada usuari sols pot actualitzar el seu propi perfil
CREATE POLICY "profiles_update" -- descripció de la policy. Actualizar el perfil de l'usuari autenticat.
ON profiles FOR UPDATE          -- taula profiles i UPDATE 
USING (id = auth.uid());        -- que fa la política? sols permet actualitzar el perfil de l'usuari autenticat (auth.uid()).


-- STUDENTS 
-- Admin i Teacher veuen tots els alumnes de la seva escola
CREATE POLICY "students_select_admin_teacher"
ON students FOR SELECT 
USING (
  school_id = get_my_school_id()
  AND get_my_role() IN ('admin', 'teacher') -- la 1a condició comprova que l'escola de l'alumne coincideix exactament amb la del centre educatiu de l'usuari que està connectat en eixe moment, gràcies a la funció get_my_school_id(). Garantim així, que un professor o administrador d'una escola no puga veure els alumnes d'un altra escola. La 2a condició comprova que el rol de l'usuari autenticat és 'admin' o 'teacher', gràcies a la funció get_my_role(). Garantim així, que un pare no puga veure els alumnes d'un altra escola.
);

-- Parent sols veu els seus propis fills 
CREATE POLICY "students_select_parent"
ON students FOR SELECT -- apliquem a la taula students i s'activa quan l'usuari fa un SELECT (consulta), és a dir, intenta llegir o consultar dades de la taula students.
USING (
  school_id = get_my_school_id() -- 1a condició: l'alumne ha de pertànyer a la mateixa escola que l'usuari autenticat. 
  AND parent_id = auth.uid()     -- 2a condició: comprova que la columna parent_id de l'alumne coincidisca amb l'id de l'usuari que ha iniciat sessió (auth.uid()).
);

-- Admin sols pot crear, editar i desactivar alumnes. Els pares i professors no poden fer-ho
CREATE POLICY "students_insert_admin"
ON students FOR INSERT
WITH CHECK (
  school_id = get_my_school_id()
  AND get_my_role() = 'admin'
);

CREATE POLICY "students_update_admin"
ON students FOR UPDATE
USING (
  school_id = get_my_school_id()
  AND get_my_role() = 'admin'
);

--  ATTENDANCE 
-- Teacher pot veure i gestionar l'assistència de la seva escola
CREATE POLICY "attendance_all_teacher"
ON attendance FOR ALL
USING (
  school_id = get_my_school_id()
  AND get_my_role() = 'teacher'
);

-- Parent sols pot veure l'assistència dels seus propis fills
CREATE POLICY "attendance_select_parent"
ON attendance FOR SELECT
USING (
  school_id = get_my_school_id()
  AND student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
);

-- Admin veu tota l'assistència de la seva escola
CREATE POLICY "attendance_select_admin"
ON attendance FOR SELECT
USING (
  school_id = get_my_school_id()
  AND get_my_role() = 'admin'
);

-- GRADES 
-- Teacher gestiona les notes de la seva escola
CREATE POLICY "grades_all_teacher"
ON grades FOR ALL
USING (
  school_id = get_my_school_id()
  AND get_my_role() = 'teacher'
);

-- Parent sols pot veure les notes dels seus propis fills
CREATE POLICY "grades_select_parent"
ON grades FOR SELECT
USING (
  school_id = get_my_school_id()
  AND student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
);

-- ANNOUNCEMENTS 
-- Admin gestiona tots els anuncis de la seva escola
CREATE POLICY "announcements_all_admin"
ON announcements FOR ALL
USING (
  school_id = get_my_school_id()
  AND get_my_role() = 'admin'
);

-- Teacher gestiona els seus propis anuncis de la seva escola
CREATE POLICY "announcements_all_teacher"
ON announcements FOR ALL
USING (
  school_id = get_my_school_id()
  AND get_my_role() = 'teacher'
  AND author_id = auth.uid()
);

-- Parent sols pot llegir anuncis dirigits a ell
CREATE POLICY "announcements_select_parent"
ON announcements FOR SELECT
USING (
  school_id = get_my_school_id()
  AND target IN ('all', 'parents')
);

-- FEES 
-- Admin gestiona totes les quotes de la seva escola
CREATE POLICY "fees_all_admin"
ON fees FOR ALL
USING (
  school_id = get_my_school_id()
  AND get_my_role() = 'admin'
);

-- Parent sols pot veure les quotes dels seus propis fills
CREATE POLICY "fees_select_parent"
ON fees FOR SELECT
USING (
  school_id = get_my_school_id()
  AND student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
);


-- SCHOOLS 
-- Cada usuari sols pot veure la seva escola (ací la columna és "id", no "school_id")
CREATE POLICY "schools_select_own"
ON schools FOR SELECT
USING (id = get_my_school_id());

-- Solo l'admin pot modificar la informació de la seva escola
CREATE POLICY "schools_update_admin"
ON schools FOR UPDATE
USING (id = get_my_school_id() AND get_my_role() = 'admin');


-- CLASSES 
-- Tots els usuaris veuen les classes de la seva escola
CREATE POLICY "classes_select_school"
ON classes FOR SELECT
USING (school_id = get_my_school_id());

-- Solo l'admin crea, edita i borra classes
CREATE POLICY "classes_all_admin"
ON classes FOR ALL
USING (school_id = get_my_school_id() AND get_my_role() = 'admin')
WITH CHECK (school_id = get_my_school_id() AND get_my_role() = 'admin');


-- SUBJECTS 
-- Tots els usuaris veuen les asignaturas de la seva escola
CREATE POLICY "subjects_select_school"
ON subjects FOR SELECT
USING (school_id = get_my_school_id());

-- Sols l'admin gestiona assignatures i assigna professorat
CREATE POLICY "subjects_all_admin"
ON subjects FOR ALL
USING (school_id = get_my_school_id() AND get_my_role() = 'admin')
WITH CHECK (school_id = get_my_school_id() AND get_my_role() = 'admin');


-- RSVP_RESPONSES 
-- Cada usuari gestiona les seues pròpies respostes 
CREATE POLICY "rsvp_own"
ON rsvp_responses FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
