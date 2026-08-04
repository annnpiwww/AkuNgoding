-- Tambahkan breakdown_tasks ke Realtime publication utk sync live (MCP agent -> UI done)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.breakdown_tasks;
  END IF;
END $$;