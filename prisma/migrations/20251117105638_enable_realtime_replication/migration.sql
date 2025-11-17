-- Enable Supabase Realtime for estimates and estimation_sessions tables
ALTER TABLE "estimates" REPLICA IDENTITY FULL;
ALTER TABLE "estimation_sessions" REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication (with conditional check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'estimates'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE "estimates";
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'estimation_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE "estimation_sessions";
    END IF;
END $$;
