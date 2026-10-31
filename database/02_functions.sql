/*
Funcions Auxiliar per a Row Level Security. Fonamentals per a la seguretat. Evitem així la recursió infinita quan les polítiques RLS consulten la taula profiles.
"SQL functions are built-in operations that perform calculations, manipulate data, and return results in queries, making data handling simpler without writing complex code." 
https://www.geeksforgeeks.org/sql/sql-functions/
*/

/*
1. get_my_school_id() Per Obtenir l'escola de l'usuari actual.
En aquesta funció cerquem a la taula profiles l'identificador de l'escola (schoo_id) associat a l'usuari que està fent la petició en eixe moment
*/

CREATE OR REPLACE FUNCTION get_my_school_id() -- Crea o sobreescriu la funció si ja existia
RETURNS UUID -- el valor que retorna es UUID format d'identificador únic que usa la columna (school_id) https://supabase.com/docs/guides/database/extensions/uuid-ossp
LANGUAGE SQL -- El codi de la funció -> SQL pla
SECURITY DEFINER -- "attribute that can be applied to functions, stored procedures, views, and triggers in SQL databases like PostgreSQL, MySQL, Oracle, and Clickhouse. When an object is defined with SECURITY DEFINER, it executes with the privileges of the user who created it(or the user who is specified in the security definer policy), rather than the user who invokes it."https://medium.com/@sajjadaghapour/apply-data-security-on-clickhouse-using-security-definer-6da187cd79d2 
STABLE -- "The function returns the same result for the same arguments within a single table scan and doesn’t modify the database. Examples: functions that read from tables but don’t depend on session state."https://medium.com/@aravindcsebe/mastering-postgresql-functions-a-complete-guide-9b18e68b5a02 -> 
AS $$  
  SELECT school_id FROM profiles WHERE id = auth.uid() -- La consulta real -> Cerca a la taula profiles la fila l'identificador id de la qual coincidisca amb auth.uid() https://supabase.com/docs/guides/auth. Aquesta és una funció nadiva que Supabase proveeix per a saber l'identificador únic de l'usuari autenticat actual. Retorna el seu school_id.
$$;

/* 
2. get_my_role(): Obtenir el rol de l'usuari actual. Amb una estructura molt semblant a la funció anterior, en lloc de retornar l'id de l'escola, retorna un TEXT -> el rol de l'usuari (admin, teacher o parent)
*/

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT -- En emmagatzemar els rols com a strings, el valor retornat és de tipus TEXT.
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$  
  SELECT role FROM profiles WHERE id = auth.uid() -- Extrau sols la columna rol de profiles autenticats
$$;