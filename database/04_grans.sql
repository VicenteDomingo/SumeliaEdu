/*
Garantir i Retirar permisos sobre els roles anon (anònim) i authenticaded (usuari loguejat)
*/

-- anon: sense cap tipus de permis sobre les taules. Retirem tot en totes les taules de l'esquema public
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- authenticated: llevem el que no necessitem (es queda amb SELECT, INSERT, UPDATE, DELETE)
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Per a que les taules futures no tornen a donar-li permisos a anon. Canviem així, el que Supabase concedeix automàticament a les taules a partir d'ara
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;