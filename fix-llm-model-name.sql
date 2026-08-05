-- Fix LLM Settings: Update model name to 'PRD' for combo model endpoint
-- Run this ONLY if you previously saved LLM settings with wrong model name (like 'gpt-4')

-- Check current settings (optional - see what's in database)
SELECT id, user_id, model_name, base_url, is_active, created_at 
FROM llm_settings;

-- Update model_name to 'PRD' for all active settings using the combo endpoint
UPDATE llm_settings 
SET model_name = 'PRD',
    updated_at = NOW()
WHERE base_url LIKE '%100.106.72.4:20129%'
  AND model_name != 'PRD';

-- Verify the update
SELECT id, user_id, model_name, base_url, is_active 
FROM llm_settings;
