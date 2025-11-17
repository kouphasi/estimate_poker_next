-- Enable Supabase Realtime for estimates and estimation_sessions tables
-- This allows real-time WebSocket updates when data changes

-- Step 1: Enable REPLICA IDENTITY to track all column changes
ALTER TABLE "estimates" REPLICA IDENTITY FULL;
ALTER TABLE "estimation_sessions" REPLICA IDENTITY FULL;

-- Step 2: Add tables to the supabase_realtime publication
-- This tells Supabase to broadcast changes for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE "estimates";
ALTER PUBLICATION supabase_realtime ADD TABLE "estimation_sessions";
