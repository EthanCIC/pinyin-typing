"""SQLite database for progress persistence."""
import sqlite3
import time


class Database:
    def __init__(self, path: str = "db/progress.db"):
        self.path = path
        self.conn = sqlite3.connect(path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row

    def init(self):
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS progress (
                item_id TEXT NOT NULL,
                item_type TEXT NOT NULL,
                interval REAL DEFAULT 0,
                ease_factor REAL DEFAULT 2.5,
                repetitions INTEGER DEFAULT 0,
                next_review REAL DEFAULT 0,
                correct_count INTEGER DEFAULT 0,
                wrong_count INTEGER DEFAULT 0,
                updated_at REAL DEFAULT 0,
                PRIMARY KEY (item_id, item_type)
            );
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phase INTEGER NOT NULL,
                mode TEXT NOT NULL,
                duration INTEGER NOT NULL,
                total INTEGER NOT NULL,
                correct INTEGER NOT NULL,
                created_at REAL DEFAULT 0
            );
        """)
        self.conn.commit()

    def save_progress(self, item_id, item_type, interval, ease_factor,
                      repetitions, next_review, correct_count, wrong_count):
        self.conn.execute("""
            INSERT INTO progress (item_id, item_type, interval, ease_factor,
                                  repetitions, next_review, correct_count,
                                  wrong_count, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(item_id, item_type) DO UPDATE SET
                interval=?, ease_factor=?, repetitions=?, next_review=?,
                correct_count=?, wrong_count=?, updated_at=?
        """, (item_id, item_type, interval, ease_factor, repetitions,
              next_review, correct_count, wrong_count, time.time(),
              interval, ease_factor, repetitions, next_review,
              correct_count, wrong_count, time.time()))
        self.conn.commit()

    def load_progress(self, item_id, item_type):
        row = self.conn.execute(
            "SELECT * FROM progress WHERE item_id=? AND item_type=?",
            (item_id, item_type)).fetchone()
        return dict(row) if row else None

    def load_all_progress(self):
        rows = self.conn.execute("SELECT * FROM progress").fetchall()
        return [dict(r) for r in rows]

    def save_session(self, phase, mode, duration, total, correct):
        self.conn.execute("""
            INSERT INTO sessions (phase, mode, duration, total, correct, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (phase, mode, duration, total, correct, time.time()))
        self.conn.commit()

    def get_sessions(self, limit=50):
        rows = self.conn.execute(
            "SELECT * FROM sessions ORDER BY created_at DESC LIMIT ?",
            (limit,)).fetchall()
        return [dict(r) for r in rows]

    def close(self):
        self.conn.close()
