import os
import sqlite3
from typing import Generator

DB_PATH = os.path.join(os.path.dirname(__file__), "taskflow.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_connection()
    cur = conn.cursor()
    # create users table
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            token TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );
        """
    )

    # create tasks table with scheduling columns if not exists
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'todo',
            due_date TEXT,
            start_date TEXT,
            start_time TEXT,
            end_time TEXT,
            user_id INTEGER,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT
        );
        """
    )

    # If the tasks table already existed, ensure new columns are present (safe migration)
    cur.execute("PRAGMA table_info('tasks')")
    existing = {row['name'] for row in cur.fetchall()}
    for col in ('start_date', 'start_time', 'end_time', 'user_id'):
        if col not in existing:
            cur.execute(f"ALTER TABLE tasks ADD COLUMN {col} TEXT")

    conn.commit()
    conn.close()


# simple helper to map rows to dict

def row_to_dict(row: sqlite3.Row) -> dict:
    d = {k: row[k] for k in row.keys()}
    # Normalize date for frontend compatibility: prefer start_date, then due_date
    if not d.get('date'):
        if d.get('start_date'):
            d['date'] = d['start_date']
        elif d.get('due_date'):
            d['date'] = d['due_date']
    # Provide camelCase time fields expected by the React frontend
    if 'start_time' in d and d['start_time'] is not None:
        d['startTime'] = d['start_time']
    if 'end_time' in d and d['end_time'] is not None:
        d['endTime'] = d['end_time']
    # Ensure id is a string to match frontend Task.id typing
    if 'id' in d and d['id'] is not None:
        d['id'] = str(d['id'])
# User helpers

def get_user_by_token(token: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE token = ?", (token,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_username(username: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username = ?", (username,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


def create_user(username: str, password_hash: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, password_hash))
    conn.commit()
    user_id = cur.lastrowid
    cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


def set_user_token(user_id: int, token: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE users SET token = ? WHERE id = ?", (token, user_id))
    conn.commit()
    conn.close()


# simple helper to map rows to dict

def row_to_dict(row: sqlite3.Row) -> dict:
    d = {k: row[k] for k in row.keys()}
    # Normalize date for frontend compatibility: prefer start_date, then due_date
    if not d.get('date'):
        if d.get('start_date'):
            d['date'] = d['start_date']
        elif d.get('due_date'):
            d['date'] = d['due_date']
    # Provide camelCase time fields expected by the React frontend
    if 'start_time' in d and d['start_time'] is not None:
        d['startTime'] = d['start_time']
    if 'end_time' in d and d['end_time'] is not None:
        d['endTime'] = d['end_time']
    # Ensure id is a string to match frontend Task.id typing
    if 'id' in d and d['id'] is not None:
        d['id'] = str(d['id'])
    return d