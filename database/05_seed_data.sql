/*
Insertem les següents dades de prova (seed data) a Supabase per poder començar a provar l'app SumeliaEdu
*/

-- Dues classes, amb el professor com a tutor
INSERT INTO classes (id, school_id, name, year, tutor_id) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Grade 6A', 2026, 'e45aeac9-b673-4136-955a-b6315d6cfee3'),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Grade 7B', 2026, 'e45aeac9-b673-4136-955a-b6315d6cfee3');

-- Tres asignatures, amb el mateix professor. La primera i la segona són per a la primera classe, i la tercera és per a la segona classe.
INSERT INTO subjects (id, school_id, class_id, teacher_id, name, code) VALUES
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'e45aeac9-b673-4136-955a-b6315d6cfee3', 'Mathematics', 'MATH6'),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'e45aeac9-b673-4136-955a-b6315d6cfee3', 'Science', 'SCI6'),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'e45aeac9-b673-4136-955a-b6315d6cfee3', 'English', 'ENG7');

-- Quatre alumnes. Només Amara està vinculada al compte de la família.
INSERT INTO students (school_id, class_id, parent_id, full_name, admission_no, gender) VALUES
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '713c1f91-2a11-47af-8085-c75c9e1c42a5', 'Amara Dube', 'WIS/24/001', 'female'),
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', NULL, 'Kagiso Nkosi', 'WIS/24/002', 'male'),
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', NULL, 'Bontle Molefe', 'WIS/24/004', 'female'),
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', NULL, 'Lesedi Mokoena', 'WIS/24/003', 'male');