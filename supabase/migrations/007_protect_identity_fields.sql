-- ============================================
-- Migration 007: Protect identity fields on public.users
--
-- Problem:
--   The current RLS policy "Users can update own profile" allows
--   authenticated users to update ANY column in their own row,
--   including email, phone, and role. An attacker can bypass the
--   frontend's disabled inputs via browser console or direct API
--   calls and write arbitrary values.
--
-- Solution:
--   1. A BEFORE UPDATE trigger that silently resets email, phone,
--      and role to their original values if tampered with.
--      It uses pg_trigger_depth() to allow cascading updates from
--      the auth sync trigger (depth > 1) while blocking direct
--      client writes (depth = 1).
--   2. An AFTER UPDATE trigger on auth.users that syncs email/phone
--      changes to public.users when Supabase Auth legitimately
--      updates them (e.g., via the email change flow).
-- ============================================

-- ─── Trigger 1: Enforce immutability of identity fields ───
-- Silently reverts any direct attempt to modify email, phone, or role
-- via the Supabase client SDK, REST API, or any other path.
--
-- pg_trigger_depth() returns:
--   1 when this trigger fires from a direct UPDATE (client/API)
--   2+ when this trigger fires as part of a cascade (e.g., auth sync)

CREATE OR REPLACE FUNCTION public.enforce_immutable_identity_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow cascading updates from other triggers (e.g., auth sync)
  -- Direct client writes have depth = 1; cascaded writes have depth > 1
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Prevent changing email — must be synced from auth.users only
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    NEW.email := OLD.email;
  END IF;

  -- Prevent changing phone — must be synced from auth.users only
  IF NEW.phone IS DISTINCT FROM OLD.phone THEN
    NEW.phone := OLD.phone;
  END IF;

  -- Prevent changing role after initial set
  -- (role is set during onboarding and should never change via profile edit)
  IF OLD.role IS NOT NULL AND OLD.role != '' AND NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to make migration re-runnable
DROP TRIGGER IF EXISTS trg_enforce_immutable_identity ON public.users;

CREATE TRIGGER trg_enforce_immutable_identity
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_immutable_identity_fields();


-- ─── Trigger 2: Sync auth.users changes to public.users ───
-- When Supabase Auth legitimately updates email or phone (e.g., via
-- supabase.auth.updateUser({ email })), this trigger propagates
-- those changes to the public.users table.
--
-- Runs as SECURITY DEFINER to bypass RLS. The immutability trigger
-- above allows this through because pg_trigger_depth() will be > 1
-- (this trigger fires at depth 1, its UPDATE fires the immutability
-- trigger at depth 2).

CREATE OR REPLACE FUNCTION public.sync_auth_to_public_users()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    email = NEW.email,
    phone = NEW.phone
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to make migration re-runnable
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email OR OLD.phone IS DISTINCT FROM NEW.phone)
  EXECUTE FUNCTION public.sync_auth_to_public_users();
