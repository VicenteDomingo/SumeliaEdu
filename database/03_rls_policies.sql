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