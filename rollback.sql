-- ============================================================
-- ROLLBACK SCRIPT — feature/live-scores-chatbot
-- Reverts all schema changes introduced by this feature branch.
-- Run this BEFORE reverting the application code.
-- ============================================================

BEGIN;

-- ── Step 1: Remove bot-generated chat messages ───────────────
-- Reactions on bot messages must be deleted first (FK constraint)
DELETE FROM message_reactions
WHERE message_id IN (
  SELECT id FROM chat_messages WHERE bot_name IS NOT NULL
);

-- Delete all bot messages
DELETE FROM chat_messages WHERE bot_name IS NOT NULL;

-- ── Step 2: Remove bot user ──────────────────────────────────
DELETE FROM users WHERE username = 'scorebot';

-- ── Step 3: Drop new tables ──────────────────────────────────
DROP TABLE IF EXISTS message_reactions;
DROP TABLE IF EXISTS match_bot_settings;

-- ── Step 4: Drop new columns ─────────────────────────────────
ALTER TABLE chat_messages DROP COLUMN IF EXISTS bot_name;
ALTER TABLE chat_messages DROP COLUMN IF EXISTS reply_to_id;
ALTER TABLE results       DROP COLUMN IF EXISTS toss;

-- ── Step 5: Verify ───────────────────────────────────────────
DO $$
BEGIN
  ASSERT NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name IN ('message_reactions', 'match_bot_settings')
  ), 'Rollback failed: tables still exist';

  ASSERT NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name IN ('bot_name', 'reply_to_id')
  ), 'Rollback failed: columns still exist on chat_messages';

  ASSERT NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'results' AND column_name = 'toss'
  ), 'Rollback failed: toss column still exists on results';

  RAISE NOTICE 'Rollback verified successfully.';
END $$;

COMMIT;
