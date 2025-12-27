Here is the **complete `README.md` file** exactly as it should exist.
You can **copy–paste this entire content** into `README.md` and commit it.

---

```md
# 🧠 TaskFlow AI – Simple Task Manager

TaskFlow AI is a minimal **task management application** built with a modern frontend and a lightweight backend.  
The server uses **PostgreSQL** for persistence (Neon recommended) and integrates **Google Gemini** for AI-powered features.

Built using **Google AI Studio + Copilot Agent**, with additional custom work by me 😊

---

## 🧩 Tech Stack

### Frontend
- React
- Vite
- JavaScript
- Tailwind (if enabled)

### Backend
- Python
- Flask
- PostgreSQL (psycopg2) — configured via `DATABASE_URL`

### AI
- Google Gemini API

---

## 📁 Project Structure

```

taskflow-ai/
│
├── app/                    # Frontend (React + Vite)
│   ├── src/
│   ├── public/
│   ├── .env.local
│   └── package.json
│
├── server/                 # Backend (Flask + Postgres via DATABASE_URL)
│   ├── app.py
│   ├── db.py
│   ├── requirements.txt
│   └── .venv/
│
└── README.md

````

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone <your-repo-url>
cd taskflow-ai
````

---

## 🎨 Frontend Setup

```bash
cd app
npm install
```

### Environment Variables

Create a file:

```
app/.env.local
```

Add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Run Frontend

```bash
npm run dev
```

Frontend will be available at:

```
http://localhost:5173
```

---

## 🐍 Backend Setup (Flask + PostgreSQL / Neon)

The backend expects a full `DATABASE_URL` environment variable (Neon or any Postgres-compatible URL). See `server/db.py` which uses `psycopg2` and requires `DATABASE_URL`.

Recommended: create a free Neon PostgreSQL instance and use the provided connection string.

### Quick steps (Neon)

1. Create a Neon project at https://neon.tech and create a database branch.
2. From the Neon dashboard, copy the Postgres connection string (it looks like `postgresql://<user>:<password>@<host>:<port>/<database>`).

### Local server setup

```bash
cd server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in `server/` with your Neon `DATABASE_URL`:

```
server/.env
```

Example `.env` contents:

```env
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<database>?sslmode=require"
PORT=5000
```

Notes:
- The code uses `psycopg2.connect(DATABASE_URL, sslmode="require")`, so including `?sslmode=require` is optional but harmless.
- If you prefer environment export instead of a file, run:

```bash
export DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<database>?sslmode=require"
export PORT=5000
```

### Run the backend

```bash
flask run
# or
python app.py
```

Default backend URL:

```
http://127.0.0.1:5000
```

---

## 🛠️ API Endpoints

### 🔍 Health Check

```
GET /api/health
```

Returns backend status.

---

### 🧱 Initialize Database

```
POST /api/init
```

Creates the Postgres tables if they do not exist
(useful for first run or CI).

---

### 📋 Tasks API

#### Get All Tasks

```
GET /api/tasks
```

---

#### Create Task

```
POST /api/tasks
```

**Request Body (JSON):**

```json
{
  "title": "My Task",
  "description": "Optional description",
  "status": "pending",
  "due_date": "2025-01-10",
  "start_date": "2025-01-09",
  "start_time": "10:00",
  "end_time": "11:00"
}
```

> If `start_date` or `start_time` is omitted, the backend defaults to the **current UTC date/time**.

---

#### Get Single Task

```
GET /api/tasks/<id>
```

---

#### Update Task

```
PUT /api/tasks/<id>
```

Fields that can be updated:

* title
* description
* status
* due_date
* start_date
* start_time
* end_time

---

#### Delete Task

```
DELETE /api/tasks/<id>
```

---

## 🗄️ Database

- **Engine**: PostgreSQL (Neon recommended)
- **Config**: Provide a full `DATABASE_URL` in `server/.env` or environment
- The app uses `psycopg2` and `RealDictCursor` for JSON-friendly rows

---

## ✨ Features

* Minimal and fast
* No heavy ORM
* Clean REST API
* Local-first SQLite database
* AI-ready architecture
* Easy to extend (auth, reminders, AI scheduling)

---

## 📌 Notes

* Designed for **learning, experimentation, and rapid iteration**
* Works fully **locally**
* Suitable for extending into a larger productivity system

```
