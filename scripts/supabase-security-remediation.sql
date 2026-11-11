-- ============================================================================
-- SUPABASE SECURITY AUDIT & AUTOMATIC REMEDIATION SCRIPT (PostgreSQL 15+ / RLS)
-- ============================================================================
-- Purpose:
--   1. Lock down all user-facing schemas (public, cs2_market, cs2market, etc.)
--      against unintended Supabase Data API (PostgREST anon / authenticated)
--      exposure while preserving full Prisma access via `postgres`/`service_role`.
--   2. Enable RLS + revoke PUBLIC/anon/authenticated grants on every table,
--      sequence, view, materialized view, foreign table, and routine.
--   3. Add explicit `deny_all_anon_authenticated` RLS policies on every table
--      that lacks policies (resolving `rls_enabled_no_policy` advisories).
--   4. Enforce `security_invoker = true` on views and fixed `search_path` on
--      user functions.
--   5. Configure `ALTER DEFAULT PRIVILEGES` and install/upgrade the
--      `docnova_auto_enable_rls` DDL event trigger so ALL future tables,
--      sequences, views, materialized views, foreign tables, and functions
--      (e.g., from `prisma db push`) are automatically secured on creation.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS docnova_private;

-- 1. Schema-level hardening
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA docnova_private FROM PUBLIC;

DO $$
DECLARE
  sch text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON SCHEMA docnova_private FROM anon;
    REVOKE ALL ON SCHEMA public FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON SCHEMA docnova_private FROM authenticated;
    REVOKE ALL ON SCHEMA public FROM authenticated;
  END IF;
  REVOKE ALL ON SCHEMA public FROM PUBLIC;

  FOREACH sch IN ARRAY ARRAY['cs2_market', 'cs2market'] LOOP
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = sch) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA %I FROM PUBLIC', sch);
      IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        EXECUTE format('REVOKE ALL ON SCHEMA %I FROM anon', sch);
      END IF;
      IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE format('REVOKE ALL ON SCHEMA %I FROM authenticated', sch);
      END IF;
    END IF;
  END LOOP;

  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
    GRANT USAGE ON SCHEMA public TO service_role;
  END IF;
END
$$;

-- 2. Harden all existing tables, sequences, views, matviews, foreign tables, and functions
DO $$
DECLARE
  rec record;
  has_supabase_roles boolean;
  pol_name text := 'deny_all_anon_authenticated';
BEGIN
  has_supabase_roles :=
    EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon')
    AND EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated');

  -- 2a. Tables & Partitioned Tables
  FOR rec IN
    SELECT
      c.oid,
      n.nspname AS schema_name,
      c.relname AS table_name
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r', 'p')
      AND n.nspname NOT LIKE 'pg_%'
      AND n.nspname NOT IN (
        'information_schema', 'auth', 'storage', 'realtime',
        'extensions', 'graphql', 'graphql_public', 'vault',
        'cron', 'net', 'pgsodium', 'pgsodium_masks',
        'supabase_functions', 'supabase_migrations', 'pgbouncer', '_realtime'
      )
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', rec.schema_name, rec.table_name);
    EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM PUBLIC', rec.schema_name, rec.table_name);

    IF has_supabase_roles THEN
      EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM anon, authenticated', rec.schema_name, rec.table_name);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_policy p WHERE p.polrelid = rec.oid
    ) THEN
      IF has_supabase_roles THEN
        EXECUTE format(
          'CREATE POLICY %I ON %I.%I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
          pol_name, rec.schema_name, rec.table_name
        );
      ELSE
        EXECUTE format(
          'CREATE POLICY %I ON %I.%I FOR ALL TO PUBLIC USING (false) WITH CHECK (false)',
          pol_name, rec.schema_name, rec.table_name
        );
      END IF;
    END IF;
  END LOOP;

  -- 2b. Sequences
  FOR rec IN
    SELECT n.nspname AS schema_name, c.relname AS seq_name
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S'
      AND n.nspname NOT LIKE 'pg_%'
      AND n.nspname NOT IN (
        'information_schema', 'auth', 'storage', 'realtime',
        'extensions', 'graphql', 'graphql_public', 'vault',
        'cron', 'net', 'pgsodium', 'pgsodium_masks',
        'supabase_functions', 'supabase_migrations', 'pgbouncer', '_realtime'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON SEQUENCE %I.%I FROM PUBLIC', rec.schema_name, rec.seq_name);
    IF has_supabase_roles THEN
      EXECUTE format('REVOKE ALL ON SEQUENCE %I.%I FROM anon, authenticated', rec.schema_name, rec.seq_name);
    END IF;
  END LOOP;

  -- 2c. Views (force security_invoker = true and revoke PostgREST grants)
  FOR rec IN
    SELECT n.nspname AS schema_name, c.relname AS view_name
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'v'
      AND n.nspname NOT LIKE 'pg_%'
      AND n.nspname NOT IN (
        'information_schema', 'auth', 'storage', 'realtime',
        'extensions', 'graphql', 'graphql_public', 'vault',
        'cron', 'net', 'pgsodium', 'pgsodium_masks',
        'supabase_functions', 'supabase_migrations', 'pgbouncer', '_realtime'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM PUBLIC', rec.schema_name, rec.view_name);
    IF has_supabase_roles THEN
      EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM anon, authenticated', rec.schema_name, rec.view_name);
    END IF;
    BEGIN
      EXECUTE format('ALTER VIEW %I.%I SET (security_invoker = true)', rec.schema_name, rec.view_name);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;

  -- 2d. Materialized Views & Foreign Tables
  FOR rec IN
    SELECT n.nspname AS schema_name, c.relname AS rel_name, c.relkind
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('m', 'f')
      AND n.nspname NOT LIKE 'pg_%'
      AND n.nspname NOT IN (
        'information_schema', 'auth', 'storage', 'realtime',
        'extensions', 'graphql', 'graphql_public', 'vault',
        'cron', 'net', 'pgsodium', 'pgsodium_masks',
        'supabase_functions', 'supabase_migrations', 'pgbouncer', '_realtime'
      )
  LOOP
    IF rec.relkind = 'f' THEN
      EXECUTE format('REVOKE ALL ON FOREIGN TABLE %I.%I FROM PUBLIC', rec.schema_name, rec.rel_name);
      IF has_supabase_roles THEN
        EXECUTE format('REVOKE ALL ON FOREIGN TABLE %I.%I FROM anon, authenticated', rec.schema_name, rec.rel_name);
      END IF;
    ELSE
      EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM PUBLIC', rec.schema_name, rec.rel_name);
      IF has_supabase_roles THEN
        EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM anon, authenticated', rec.schema_name, rec.rel_name);
      END IF;
    END IF;
  END LOOP;

  -- 2e. User Functions / Procedures: lock execute grants & mutable search_path
  FOR rec IN
    SELECT
      p.oid,
      n.nspname AS schema_name,
      p.proname AS func_name,
      pg_catalog.pg_get_function_identity_arguments(p.oid) AS args,
      p.prokind,
      p.proconfig
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname NOT LIKE 'pg_%'
      AND n.nspname NOT IN (
        'information_schema', 'auth', 'storage', 'realtime',
        'extensions', 'graphql', 'graphql_public', 'vault',
        'cron', 'net', 'pgsodium', 'pgsodium_masks',
        'supabase_functions', 'supabase_migrations', 'pgbouncer', '_realtime'
      )
      AND NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_depend d
        WHERE d.objid = p.oid AND d.deptype = 'e'
      )
  LOOP
    IF rec.prokind = 'p' THEN
      EXECUTE format('REVOKE ALL ON PROCEDURE %I.%I(%s) FROM PUBLIC', rec.schema_name, rec.func_name, rec.args);
      IF has_supabase_roles THEN
        EXECUTE format('REVOKE ALL ON PROCEDURE %I.%I(%s) FROM anon, authenticated', rec.schema_name, rec.func_name, rec.args);
      END IF;
      IF rec.proconfig IS NULL THEN
        EXECUTE format('ALTER PROCEDURE %I.%I(%s) SET search_path = pg_catalog, public', rec.schema_name, rec.func_name, rec.args);
      END IF;
    ELSE
      EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC', rec.schema_name, rec.func_name, rec.args);
      IF has_supabase_roles THEN
        EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM anon, authenticated', rec.schema_name, rec.func_name, rec.args);
      END IF;
      IF rec.proconfig IS NULL THEN
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = pg_catalog, public', rec.schema_name, rec.func_name, rec.args);
      END IF;
    END IF;
  END LOOP;
END
$$;

-- 3. Lock down default privileges for future objects created by current role (and supabase_admin if permitted)
DO $$
DECLARE
  sch text;
  has_supabase_roles boolean;
BEGIN
  has_supabase_roles :=
    EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon')
    AND EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated');

  FOREACH sch IN ARRAY ARRAY['public', 'docnova_private', 'cs2_market', 'cs2market'] LOOP
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = sch) THEN
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE ALL ON TABLES FROM PUBLIC', sch);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE ALL ON SEQUENCES FROM PUBLIC', sch);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE ALL ON FUNCTIONS FROM PUBLIC', sch);
      IF has_supabase_roles THEN
        EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE ALL ON TABLES FROM anon, authenticated', sch);
        EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE ALL ON SEQUENCES FROM anon, authenticated', sch);
        EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE ALL ON FUNCTIONS FROM anon, authenticated', sch);

        BEGIN
          EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA %I REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated', sch);
          EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA %I REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated', sch);
          EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA %I REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated', sch);
        EXCEPTION WHEN insufficient_privilege OR undefined_object THEN
          NULL;
        END;
      END IF;
    END IF;
  END LOOP;
END
$$;

-- 4. Permanent DDL Event Trigger: automatically harden ALL future user objects on creation
CREATE OR REPLACE FUNCTION docnova_private.auto_enable_rls()
RETURNS event_trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  obj record;
  has_supabase_roles boolean;
  pol_name text := 'deny_all_anon_authenticated';
  func_proconfig text[];
  func_kind "char";
BEGIN
  has_supabase_roles :=
    EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon')
    AND EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated');

  FOR obj IN
    SELECT * FROM pg_catalog.pg_event_trigger_ddl_commands()
  LOOP
    CONTINUE WHEN obj.schema_name IS NULL
      OR obj.schema_name LIKE 'pg_%'
      OR obj.schema_name IN (
        'information_schema', 'auth', 'storage', 'realtime',
        'extensions', 'graphql', 'graphql_public', 'vault',
        'cron', 'net', 'pgsodium', 'pgsodium_masks',
        'supabase_functions', 'supabase_migrations', 'pgbouncer', '_realtime'
      );

    IF obj.object_type IN ('table', 'partitioned table') THEN
      EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', obj.object_identity);
      EXECUTE format('REVOKE ALL ON TABLE %s FROM PUBLIC', obj.object_identity);
      IF has_supabase_roles THEN
        EXECUTE format('REVOKE ALL ON TABLE %s FROM anon, authenticated', obj.object_identity);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_policy p WHERE p.polrelid = obj.objid
      ) THEN
        IF has_supabase_roles THEN
          EXECUTE format(
            'CREATE POLICY %I ON %s FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
            pol_name, obj.object_identity
          );
        ELSE
          EXECUTE format(
            'CREATE POLICY %I ON %s FOR ALL TO PUBLIC USING (false) WITH CHECK (false)',
            pol_name, obj.object_identity
          );
        END IF;
      END IF;

    ELSIF obj.object_type = 'sequence' THEN
      EXECUTE format('REVOKE ALL ON SEQUENCE %s FROM PUBLIC', obj.object_identity);
      IF has_supabase_roles THEN
        EXECUTE format('REVOKE ALL ON SEQUENCE %s FROM anon, authenticated', obj.object_identity);
      END IF;

    ELSIF obj.object_type = 'view' THEN
      EXECUTE format('REVOKE ALL ON TABLE %s FROM PUBLIC', obj.object_identity);
      IF has_supabase_roles THEN
        EXECUTE format('REVOKE ALL ON TABLE %s FROM anon, authenticated', obj.object_identity);
      END IF;
      BEGIN
        EXECUTE format('ALTER VIEW %s SET (security_invoker = true)', obj.object_identity);
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;

    ELSIF obj.object_type = 'materialized view' THEN
      EXECUTE format('REVOKE ALL ON TABLE %s FROM PUBLIC', obj.object_identity);
      IF has_supabase_roles THEN
        EXECUTE format('REVOKE ALL ON TABLE %s FROM anon, authenticated', obj.object_identity);
      END IF;

    ELSIF obj.object_type = 'foreign table' THEN
      EXECUTE format('REVOKE ALL ON FOREIGN TABLE %s FROM PUBLIC', obj.object_identity);
      IF has_supabase_roles THEN
        EXECUTE format('REVOKE ALL ON FOREIGN TABLE %s FROM anon, authenticated', obj.object_identity);
      END IF;

    ELSIF obj.object_type IN ('function', 'procedure') THEN
      SELECT p.proconfig, p.prokind INTO func_proconfig, func_kind
      FROM pg_catalog.pg_proc p
      WHERE p.oid = obj.objid;

      IF func_kind = 'p' THEN
        EXECUTE format('REVOKE ALL ON PROCEDURE %s FROM PUBLIC', obj.object_identity);
        IF has_supabase_roles THEN
          EXECUTE format('REVOKE ALL ON PROCEDURE %s FROM anon, authenticated', obj.object_identity);
        END IF;
        IF func_proconfig IS NULL THEN
          BEGIN
            EXECUTE format('ALTER PROCEDURE %s SET search_path = pg_catalog, public', obj.object_identity);
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END;
        END IF;
      ELSE
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', obj.object_identity);
        IF has_supabase_roles THEN
          EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, authenticated', obj.object_identity);
        END IF;
        IF func_proconfig IS NULL THEN
          BEGIN
            EXECUTE format('ALTER FUNCTION %s SET search_path = pg_catalog, public', obj.object_identity);
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END;
        END IF;
      END IF;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION docnova_private.auto_enable_rls() FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON FUNCTION docnova_private.auto_enable_rls() FROM anon, authenticated;
  END IF;
END
$$;

DROP EVENT TRIGGER IF EXISTS docnova_auto_enable_rls;
CREATE EVENT TRIGGER docnova_auto_enable_rls
  ON ddl_command_end
  WHEN TAG IN (
    'CREATE TABLE',
    'CREATE TABLE AS',
    'SELECT INTO',
    'CREATE SEQUENCE',
    'CREATE VIEW',
    'CREATE MATERIALIZED VIEW',
    'CREATE FOREIGN TABLE',
    'CREATE FUNCTION',
    'CREATE PROCEDURE'
  )
  EXECUTE FUNCTION docnova_private.auto_enable_rls();
