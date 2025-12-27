import os
import psycopg2
import psycopg2.extras
from typing import Optional
import datetime

# Expect a full DATABASE_URL (Neon) in the environment, e.g.:
# postgres://... or postgresql://...
DATABASE_URL = os.environ.get("DATABASE_URL")


def get_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL environment variable not set")
    # Use RealDictCursor so fetchone()/fetchall() return dict-like rows
    conn = psycopg2.connect(DATABASE_URL, sslmode="require", cursor_factory=psycopg2.extras.RealDictCursor)
    return conn


def init_db() -> None:
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            token TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'todo',
            due_date DATE,
            start_date DATE,
            start_time TIME,
            end_time TIME,
            user_id INTEGER REFERENCES users(id),
            actual_start_time TIME,
            actual_end_time TIME,
            completed_items TEXT,
            pending_items TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE
        );
        """
    )

    # safe migration: ensure optional columns exist (add missing columns)
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks'")
    existing = {row['column_name'] for row in cur.fetchall()}
    column_types = {
        'start_date': 'DATE',
        'start_time': 'TIME',
        'end_time': 'TIME',
        'user_id': 'INTEGER',
        'actual_start_time': 'TIME',
        'actual_end_time': 'TIME',
        'completed_items': 'TEXT',
        'pending_items': 'TEXT',
    }
    for col, sql_type in column_types.items():
        if col not in existing:
            cur.execute(f"ALTER TABLE tasks ADD COLUMN {col} {sql_type}")

    conn.commit()
    cur.close()
    conn.close()


def row_to_dict(row: Optional[dict]) -> dict:
    if not row:
        return {}
    # psycopg2 RealDictCursor returns a dict-like mapping already
    d = dict(row)
    # Convert date/time/datetime values to ISO strings for JSON serialization
    for k, v in list(d.items()):
        if isinstance(v, datetime.datetime):
            d[k] = v.isoformat()
        elif isinstance(v, datetime.date):
            d[k] = v.isoformat()
        elif isinstance(v, datetime.time):
            # times -> HH:MM:SS
            d[k] = v.strftime("%H:%M:%S")
    # Normalize date for frontend compatibility: prefer start_date, then due_date
    if not d.get('date'):
        if d.get('start_date'):
            d['date'] = d['start_date']
        elif d.get('due_date'):
            d['date'] = d['due_date']
    # Provide camelCase time fields expected by the React frontend
    if 'start_time' in d and d['start_time'] is not None:
        d['startTime'] = str(d['start_time'])
    if 'end_time' in d and d['end_time'] is not None:
        d['endTime'] = str(d['end_time'])
    if 'actual_start_time' in d and d['actual_start_time'] is not None:
        d['actualStartTime'] = str(d['actual_start_time'])
    if 'actual_end_time' in d and d['actual_end_time'] is not None:
        d['actualEndTime'] = str(d['actual_end_time'])
    if 'completed_items' in d and d['completed_items'] is not None:
        d['completedItems'] = d['completed_items']
    if 'pending_items' in d and d['pending_items'] is not None:
        d['pendingItems'] = d['pending_items']
    # Ensure id is a string to match frontend Task.id typing
    if 'id' in d and d['id'] is not None:
        d['id'] = str(d['id'])
    return d


def get_user_by_token(token: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE token = %s", (token,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return dict(row) if row else None


def get_user_by_username(username: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username = %s", (username,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return dict(row) if row else None


def create_user(username: str, password_hash: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO users (username, password_hash) VALUES (%s, %s) RETURNING id", (username, password_hash))
    user_id = cur.fetchone()['id']
    conn.commit()
    cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return dict(row) if row else None


def set_user_token(user_id: int, token: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE users SET token = %s WHERE id = %s", (token, user_id))
    conn.commit()
    cur.close()
    conn.close()