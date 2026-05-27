-- D1 SQLite Database Schema for ENDD Alliance Power Tracker

CREATE TABLE IF NOT EXISTS power_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,       -- Discord ID of the user
    username TEXT NOT NULL,      -- Discord username of the user
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, -- Timestamp of snapshot
    raw_data TEXT NOT NULL       -- JSON string containing all extracted key-value pairs
);

-- Index for high-performance time-series historical queries
CREATE INDEX IF NOT EXISTS idx_power_user_timestamp ON power_snapshots (user_id, timestamp);
