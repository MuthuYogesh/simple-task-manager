import os
import sqlite3
from flask import Flask, jsonify, request, abort, g
from flask_cors import CORS
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from secrets import token_hex
from db import get_connection, init_db, row_to_dict, get_user_by_token, get_user_by_username, create_user, set_user_token
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Ensure DB and migrations are applied for all server start methods
# Some Flask installations (used by the CLI) may not expose `before_first_request` at import time,
# so provide a compatibility fallback that runs the init once on first request if needed.
if hasattr(app, "before_first_request"):
    @app.before_first_request
    def ensure_db_initialized():
        init_db()
        app.logger.info("Database initialized or already up-to-date.")
else:
    _db_initialized = False

    @app.before_request
    def ensure_db_initialized():
        nonlocal_flag = globals()
        global _db_initialized
        if not _db_initialized:
            init_db()
            _db_initialized = True
            app.logger.info("Database initialized or already up-to-date (fallback).")


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/init", methods=["POST"])  # POST to avoid accidental GET
def init_database():
    init_db()
    return jsonify({"status": "initialized"}), 201


# --- Authentication helpers and endpoints ---

def _get_auth_token():
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return auth.split(' ', 1)[1]
    return None


def require_auth(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        token = _get_auth_token()
        if not token:
            abort(401)
        user = get_user_by_token(token)
        if not user:
            abort(401)
        g.user = user
        return f(*args, **kwargs)
    return wrapped


@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''
    if not username or not password or len(password) < 4:
        abort(400, 'username and password (>=4 chars) required')
    if get_user_by_username(username):
        abort(409, 'username already exists')
    password_hash = generate_password_hash(password)
    user = create_user(username, password_hash)
    return jsonify({'message': 'created', 'username': user['username']}), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''
    user = get_user_by_username(username)
    if not user or not check_password_hash(user['password_hash'], password):
        abort(401, 'invalid credentials')
    # create a token and save it
    token = token_hex(24)
    set_user_token(user['id'], token)
    return jsonify({'token': token, 'username': user['username']})


@app.route("/api/tasks", methods=["GET"])
@require_auth
def list_tasks():
    user_id = g.user['id']
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC", (user_id,))
    rows = cur.fetchall()
    conn.close()
    return jsonify([row_to_dict(r) for r in rows])


@app.route("/api/tasks", methods=["POST"])
@require_auth
def create_task():
    data = request.get_json() or {}
    # Accept frontend camelCase payloads and normalize to snake_case used by DB
    if 'date' in data and 'start_date' not in data:
        data['start_date'] = data['date']
    if 'startTime' in data and 'start_time' not in data:
        data['start_time'] = data['startTime']
    if 'endTime' in data and 'end_time' not in data:
        data['end_time'] = data['endTime']

    title = data.get("title")
    if not title:
        abort(400, "title is required")
    description = data.get("description")
    status = data.get("status", "todo")
    due_date = data.get("due_date")

    # new scheduling fields — accept what frontend sends; if missing, default to current date/time
    start_date = data.get("start_date")
    start_time = data.get("start_time")
    end_time = data.get("end_time")

    # Use current UTC date/time only when frontend did not provide values
    now = datetime.utcnow()
    if not start_date:
        start_date = now.date().isoformat()
    if not start_time:
        start_time = now.time().isoformat(timespec='seconds')

    # require auth and attach task to user
    user_id = g.user['id']
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO tasks (title, description, status, due_date, start_date, start_time, end_time, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (title, description, status, due_date, start_date, start_time, end_time, user_id),
    )
    conn.commit()
    task_id = cur.lastrowid
    cur.execute("SELECT * FROM tasks WHERE id = ? AND user_id = ?", (task_id, user_id))
    row = cur.fetchone()
    conn.close()
    return jsonify(row_to_dict(row)), 201


@app.route("/api/tasks/<int:task_id>", methods=["GET"])
@require_auth
def get_task(task_id: int):
    user_id = g.user['id']
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM tasks WHERE id = ? AND user_id = ?", (task_id, user_id))
    row = cur.fetchone()
    conn.close()
    if not row:
        abort(404)
    return jsonify(row_to_dict(row))


@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
@require_auth
def update_task(task_id: int):
    data = request.get_json() or {}
    # Normalize camelCase keys from frontend
    if 'date' in data and 'start_date' not in data:
        data['start_date'] = data['date']
    if 'startTime' in data and 'start_time' not in data:
        data['start_time'] = data['startTime']
    if 'endTime' in data and 'end_time' not in data:
        data['end_time'] = data['endTime']

    fields = []
    values = []
    # include scheduling fields
    for key in ("title", "description", "status", "due_date", "start_date", "start_time", "end_time"):
        if key in data:
            fields.append(f"{key} = ?")
            values.append(data[key])
    if not fields:
        abort(400, "no fields to update")
    values.append(task_id)
    user_id = g.user['id']
    conn = get_connection()
    cur = conn.cursor()
    # include user_id guard so a user can't update another user's task
    cur.execute(f"UPDATE tasks SET {', '.join(fields)}, updated_at = datetime('now') WHERE id = ? AND user_id = ?", tuple(values + [user_id]))
    conn.commit()
    if cur.rowcount == 0:
        abort(404)
    cur.execute("SELECT * FROM tasks WHERE id = ? AND user_id = ?", (task_id, user_id))
    row = cur.fetchone()
    conn.close()
    if not row:
        abort(404)
    return jsonify(row_to_dict(row))


@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
@require_auth
def delete_task(task_id: int):
    user_id = g.user['id']
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM tasks WHERE id = ? AND user_id = ?", (task_id, user_id))
    changed = cur.rowcount
    conn.commit()
    conn.close()
    if not changed:
        abort(404)
    return jsonify({"status": "deleted"})


if __name__ == "__main__":
    # ensure DB and migrations are applied on startup
    init_db()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
