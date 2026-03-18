-- Shield TX database schema
-- Run this in your Supabase SQL editor

-- Trades table: stores every trade from the HL WebSocket feed
CREATE TABLE trades (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL,
  coin TEXT NOT NULL,
  side TEXT NOT NULL,          -- 'B' (buy) or 'A' (sell/ask)
  px NUMERIC NOT NULL,
  sz NUMERIC NOT NULL,
  hash TEXT,
  tid BIGINT,
  buyer TEXT NOT NULL,         -- buyer wallet address
  seller TEXT NOT NULL         -- seller wallet address
);

-- Primary query: find trades on a coin within a time window
CREATE INDEX idx_trades_coin_ts ON trades (coin, ts);

-- Find all trades involving a specific address
CREATE INDEX idx_trades_buyer ON trades (buyer, ts);
CREATE INDEX idx_trades_seller ON trades (seller, ts);

-- Cleanup: delete trades older than 7 days
-- Run this as a Supabase cron or from the collector
CREATE OR REPLACE FUNCTION cleanup_old_trades()
RETURNS void
LANGUAGE SQL
AS $$
  DELETE FROM trades WHERE ts < NOW() - INTERVAL '7 days';
$$;

-- Beta signups table
CREATE TABLE beta_signups (
  id BIGSERIAL PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  email TEXT,
  volume_range TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (required by Supabase)
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_signups ENABLE ROW LEVEL SECURITY;

-- Service role policies (the collector and API use the service role key)
CREATE POLICY "Service role full access on trades"
  ON trades FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on beta_signups"
  ON beta_signups FOR ALL
  USING (true)
  WITH CHECK (true);
