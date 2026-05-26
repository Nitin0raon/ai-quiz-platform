# AI Quiz Platform — Complete Setup Guide
## Windows 11 · Python 3.12 · PostgreSQL · Django · Gemini

---

## TABLE OF CONTENTS

1. [What You'll Build](#1-what-youll-build)
2. [Prerequisites — Install Everything First](#2-prerequisites)
3. [Project Setup](#3-project-setup)
4. [Configure Environment Variables](#4-configure-environment-variables)
5. [Configure PostgreSQL](#5-configure-postgresql)
6. [Run Migrations](#6-run-migrations)
7. [Create Superuser](#7-create-superuser)
8. [Run the Server](#8-run-the-server)
9. [Test All APIs](#9-test-all-apis)
10. [Architecture Explained](#10-architecture-explained)
11. [API Reference](#11-api-reference)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. WHAT YOU'LL BUILD

A production-quality backend API for an AI Quiz Platform where users can:

- ✅ Register and login (JWT authentication)
- ✅ Upload PDF documents
- ✅ Extract text from PDFs automatically
- ✅ Generate AI-powered MCQ quizzes using Google Gemini
- ✅ Take timed quizzes and submit answers
- ✅ View scores and detailed results
- ✅ Track analytics (accuracy, streaks, points)
- ✅ Compete on a leaderboard

**Tech Stack:**
```
Django 5 + DRF → REST API framework
PostgreSQL      → Production database
JWT             → Secure authentication
Google Gemini   → AI quiz generation
LangChain       → RAG orchestration
FAISS           → Vector similarity search
pdfplumber      → PDF text extraction
Redis           → Caching (optional but recommended)
```

---

## 2. PREREQUISITES

You need to install these tools BEFORE setting up the project.
Open each link, download, and install.

### Step 2.1 — Install Python 3.12

1. Go to: https://www.python.org/downloads/
2. Download **Python 3.12.x** (click the yellow button)
3. Run the installer
4. ⚠️ **IMPORTANT**: Check ✅ "Add Python to PATH" at the bottom of the installer
5. Click "Install Now"

**Verify installation** — open Command Prompt (press Win+R, type `cmd`, press Enter):
```cmd
python --version
```
You should see: `Python 3.12.x`

---

### Step 2.2 — Install PostgreSQL

1. Go to: https://www.postgresql.org/download/windows/
2. Click "Download the installer" (EDB installer)
3. Download the latest PostgreSQL 16 installer
4. Run the installer, click Next through everything
5. **Remember the password you set for the `postgres` user** — you'll need it!
6. Default port is `5432` — leave it as is
7. Finish installation

**Verify installation:**
```cmd
psql --version
```
If `psql` is not found, add PostgreSQL to PATH:
- Open: Control Panel → System → Advanced System Settings → Environment Variables
- Under "System Variables", find "Path", click Edit
- Add: `C:\Program Files\PostgreSQL\16\bin`

---

### Step 2.3 — Install Redis (Optional but Recommended)

Redis is used for caching. The project works WITHOUT it but will be slower.

**Option A — Use Redis for Windows (Memurai):**
1. Go to: https://www.memurai.com/get-memurai
2. Download and install Memurai (free Redis-compatible server for Windows)
3. It runs automatically as a Windows service

**Option B — Skip Redis** (if you're just learning):
- In `core/settings.py`, the project will still work but without caching
- Change `CACHES` to use the default dummy cache (explained in Troubleshooting)

---

### Step 2.4 — Get a Google Gemini API Key

1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key — you'll add it to `.env` later
5. **Free tier is sufficient** for development

---

### Step 2.5 — Install VS Code (Recommended Editor)

1. Go to: https://code.visualstudio.com/
2. Download and install
3. Install these VS Code extensions:
   - Python (by Microsoft)
   - Django (by Baptiste Darthenay)
   - REST Client (by Huachao Mao) — for testing APIs

---

## 3. PROJECT SETUP

### Step 3.1 — Extract the Project

1. Extract the zip file you received
2. You'll see a folder called `ai_quiz_platform`
3. Inside it is the `backend` folder — this is your Django project

### Step 3.2 — Open in VS Code

1. Open VS Code
2. File → Open Folder → Select the `backend` folder
3. You should see the project structure in the left panel

### Step 3.3 — Open Terminal in VS Code

Press `` Ctrl+` `` (backtick) to open the integrated terminal.

Make sure you're in the `backend` directory:
```cmd
cd C:\path\to\ai_quiz_platform\backend
```

### Step 3.4 — Create a Virtual Environment

A virtual environment is an isolated Python environment for this project.
It keeps your project's packages separate from other Python projects.

```cmd
python -m venv venv
```

This creates a `venv` folder in your `backend` directory.

### Step 3.5 — Activate the Virtual Environment

```cmd
venv\Scripts\activate
```

Your terminal prompt will change to show `(venv)` at the start.
**You must activate this every time you open a new terminal.**

✅ You should see: `(venv) C:\path\to\backend>`

### Step 3.6 — Install Dependencies

```cmd
pip install -r requirements.txt
```

This will take 3-5 minutes. It installs Django, DRF, LangChain, FAISS, etc.

**If you see errors:**
- `pip install --upgrade pip` then try again
- For `faiss-cpu` errors: `pip install faiss-cpu --no-cache-dir`
- For `pdfplumber` errors: `pip install pdfplumber --no-deps` then `pip install pdfminer.six`

---

## 4. CONFIGURE ENVIRONMENT VARIABLES

The `.env` file holds your secrets (passwords, API keys).
**Never commit this file to Git.**

### Step 4.1 — Create the .env File

In the `backend` folder, create a new file called `.env`:

```cmd
copy .env.example .env
```

### Step 4.2 — Edit the .env File

Open `.env` in VS Code and fill in your values:

```env
# Django Settings
SECRET_KEY=my-super-secret-key-at-least-50-chars-long-random-string-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# PostgreSQL Database
DB_NAME=ai_quiz_db
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
DB_HOST=localhost
DB_PORT=5432

# Google Gemini API Key
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

# Redis (if installed)
REDIS_URL=redis://localhost:6379/1

# Media Files
MEDIA_URL=/media/
MEDIA_ROOT=media/

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# CORS (your frontend URL)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**Generate a SECRET_KEY:**
```cmd
python -c "import secrets; print(secrets.token_urlsafe(50))"
```
Copy the output and paste it as your SECRET_KEY value.

---

## 5. CONFIGURE POSTGRESQL

### Step 5.1 — Open PostgreSQL Command Line

```cmd
psql -U postgres
```

Enter the password you set during installation.

### Step 5.2 — Create the Database

Inside the psql prompt, run these commands one by one:

```sql
CREATE DATABASE ai_quiz_db;
```

Press Enter. You should see: `CREATE DATABASE`

```sql
\q
```

This exits psql.

### Step 5.3 — Verify Connection

Test that Django can connect:
```cmd
python -c "import psycopg2; conn = psycopg2.connect(dbname='ai_quiz_db', user='postgres', password='YOUR_PASSWORD', host='localhost'); print('Connected!'); conn.close()"
```

You should see: `Connected!`

---

## 6. RUN MIGRATIONS

Migrations create the database tables from our models.
**Run these in order.**

### Step 6.1 — Create Migration Files

```cmd
python manage.py makemigrations users
python manage.py makemigrations documents
python manage.py makemigrations quizzes
python manage.py makemigrations
```

You should see output like:
```
Migrations for 'users':
  apps/users/migrations/0001_initial.py
    - Create model User
```

### Step 6.2 — Apply Migrations to Database

```cmd
python manage.py migrate
```

This creates all the tables in your PostgreSQL database.
You should see many lines ending with `OK`.

### Step 6.3 — Verify Tables Were Created

```cmd
psql -U postgres -d ai_quiz_db -c "\dt"
```

You should see a list of tables including: `users`, `documents`, `quizzes`, etc.

---

## 7. CREATE SUPERUSER

A superuser can access the Django Admin panel at `/admin/`.

```cmd
python manage.py createsuperuser
```

You'll be prompted for:
- **Email**: your@email.com
- **Username**: admin
- **Password**: (at least 8 characters)

---

## 8. RUN THE SERVER

```cmd
python manage.py runserver
```

You should see:
```
Django version 5.0.6, using settings 'core.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

### Test it's working:

Open your browser and visit:
- http://127.0.0.1:8000/ → Should show `{"status": "healthy", ...}`
- http://127.0.0.1:8000/admin/ → Django admin (login with superuser)

---

## 9. TEST ALL APIs

Use **Postman** (https://www.postman.com/downloads/) or the VS Code **REST Client** extension.

### 9.1 — Register a User

**POST** `http://127.0.0.1:8000/api/v1/auth/register/`

Headers:
```
Content-Type: application/json
```

Body:
```json
{
    "username": "testuser",
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User",
    "password": "MyPassword123!",
    "password_confirm": "MyPassword123!"
}
```

Expected Response (201):
```json
{
    "message": "Account created successfully. Welcome!",
    "user": {
        "id": "uuid-here",
        "email": "test@example.com",
        "username": "testuser",
        "full_name": "Test User"
    },
    "tokens": {
        "refresh": "eyJ...",
        "access": "eyJ..."
    }
}
```

**Copy the `access` token — you'll use it for all other requests.**

---

### 9.2 — Login

**POST** `http://127.0.0.1:8000/api/v1/auth/login/`

Body:
```json
{
    "email": "test@example.com",
    "password": "MyPassword123!"
}
```

---

### 9.3 — Get Your Profile

**GET** `http://127.0.0.1:8000/api/v1/auth/profile/`

Headers:
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

---

### 9.4 — Upload a PDF

**POST** `http://127.0.0.1:8000/api/v1/documents/upload/`

Headers:
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

Body (form-data, NOT JSON):
```
file: [select a PDF file from your computer]
title: My Study Notes
description: Chapter 1 notes
```

Expected Response (201):
```json
{
    "success": true,
    "message": "Document uploaded and processed successfully. Extracted 5 pages, created 12 chunks.",
    "document": {
        "id": "uuid-here",
        "title": "My Study Notes",
        "status": "processed",
        "page_count": 5,
        ...
    }
}
```

**Copy the document `id` — you'll need it to generate a quiz.**

---

### 9.5 — Generate a Quiz

**POST** `http://127.0.0.1:8000/api/v1/quizzes/generate/`

Headers:
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json
```

Body:
```json
{
    "document_id": "YOUR_DOCUMENT_UUID_HERE",
    "topic": "Main concepts from chapter 1",
    "difficulty": "medium",
    "num_questions": 5,
    "title": "My First AI Quiz",
    "time_limit_minutes": 10
}
```

This calls Google Gemini and may take 5-15 seconds.

Expected Response (201):
```json
{
    "success": true,
    "message": "Quiz generated successfully with 5 questions!",
    "quiz": {
        "id": "quiz-uuid-here",
        "title": "My First AI Quiz",
        "questions": [
            {
                "id": "question-uuid",
                "order": 1,
                "question_text": "What is...?",
                "option_a": "...",
                "option_b": "...",
                "option_c": "...",
                "option_d": "...",
                "correct_answer": "B",
                "explanation": "..."
            },
            ...
        ]
    }
}
```

**Copy the quiz `id` and question `id`s.**

---

### 9.6 — Submit Quiz Answers

**POST** `http://127.0.0.1:8000/api/v1/quizzes/QUIZ_UUID_HERE/submit/`

Headers:
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json
```

Body:
```json
{
    "answers": [
        {"question_id": "QUESTION_1_UUID", "selected_option": "B"},
        {"question_id": "QUESTION_2_UUID", "selected_option": "A"},
        {"question_id": "QUESTION_3_UUID", "selected_option": "C"},
        {"question_id": "QUESTION_4_UUID", "selected_option": "D"},
        {"question_id": "QUESTION_5_UUID", "selected_option": "B"}
    ],
    "time_taken_seconds": 240
}
```

Expected Response:
```json
{
    "success": true,
    "message": "Quiz submitted successfully!",
    "result": {
        "score": 3,
        "total_questions": 5,
        "accuracy": 60.0,
        "points_earned": 30,
        "answers": [...]
    }
}
```

---

### 9.7 — View Analytics Dashboard

**GET** `http://127.0.0.1:8000/api/v1/analytics/dashboard/`

Headers:
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

---

### 9.8 — View Leaderboard

**GET** `http://127.0.0.1:8000/api/v1/analytics/leaderboard/`

Headers:
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

---

## 10. ARCHITECTURE EXPLAINED

### Project Structure

```
backend/
│
├── apps/                    ← All Django applications live here
│   ├── users/               ← Authentication, user profiles
│   │   ├── models.py        ← Custom User model
│   │   ├── serializers.py   ← Input validation + JSON conversion
│   │   ├── views.py         ← HTTP request handlers
│   │   ├── urls.py          ← URL routing for this app
│   │   └── admin.py         ← Django admin configuration
│   │
│   ├── documents/           ← PDF upload and processing
│   │   ├── models.py        ← UploadedDocument, DocumentChunk
│   │   ├── services.py      ← PDF extraction, chunking logic
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── quizzes/             ← Quiz generation and attempts
│   │   ├── models.py        ← Quiz, Question, QuizAttempt, QuizAnswer
│   │   ├── ai_service.py    ← Gemini API integration
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── rag/                 ← RAG pipeline (embeddings + FAISS)
│   │   ├── services.py      ← EmbeddingService, FAISSService
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── analytics/           ← Dashboard, leaderboard
│   │   ├── views.py
│   │   └── urls.py
│   │
│   └── common/              ← Shared utilities
│       ├── exceptions.py    ← Global error handler
│       ├── pagination.py    ← Pagination classes
│       └── permissions.py   ← Custom permissions
│
├── core/                    ← Django project configuration
│   ├── settings.py          ← All settings (DB, JWT, Redis, etc.)
│   ├── urls.py              ← Root URL routing
│   └── wsgi.py              ← Web server gateway
│
├── media/                   ← Uploaded files (PDFs, avatars)
├── faiss_indexes/           ← FAISS vector index files (auto-created)
├── logs/                    ← Application logs (auto-created)
│
├── manage.py                ← Django management commands
├── requirements.txt         ← Python dependencies
└── .env                     ← Your secrets (never commit this!)
```

### How a Request Flows

```
Browser/Postman
     ↓
  HTTP Request
     ↓
Django URLs (core/urls.py)
     ↓
App URLs (apps/users/urls.py etc.)
     ↓
View (apps/users/views.py)
     ↓
Serializer (validate input / format output)
     ↓
Service Layer (business logic)
     ↓
Model (database operations)
     ↓
PostgreSQL Database
     ↓
Response (JSON)
```

### JWT Authentication Flow

```
1. User sends: POST /api/v1/auth/login/ {email, password}
2. Server validates credentials
3. Server creates:
   - access token  (expires in 60 min) ← use for API calls
   - refresh token (expires in 7 days) ← use to get new access token
4. Client stores tokens
5. Client sends: GET /api/v1/quizzes/ 
   Header: Authorization: Bearer <access_token>
6. Server validates token → grants access
7. When access token expires:
   POST /api/v1/auth/token/refresh/ {refresh: <refresh_token>}
   → returns new access token
8. Logout: POST /api/v1/auth/logout/ {refresh_token: <refresh_token>}
   → blacklists refresh token
```

### RAG Pipeline Explained

```
PDF Upload
   ↓
Text Extraction (pdfplumber)
   "Chapter 1: The water cycle is..."
   ↓
Text Chunking (LangChain RecursiveCharacterTextSplitter)
   Chunk 1: "Chapter 1: The water cycle..."
   Chunk 2: "...evaporation occurs when..."
   Chunk 3: "...precipitation falls as..."
   ↓
Embedding Generation (Google Gemini embedding-001)
   Chunk 1 → [0.12, -0.45, 0.78, ...]  (768-dimensional vector)
   Chunk 2 → [0.34, 0.21, -0.56, ...]
   Chunk 3 → [-0.11, 0.67, 0.43, ...]
   ↓
FAISS Index (stored on disk)
   Vectors saved for fast similarity search
   ↓
Quiz Generation Request: "topic: water cycle"
   ↓
Query Embedding: "water cycle" → [0.15, -0.42, 0.80, ...]
   ↓
FAISS Similarity Search
   Find top 5 most similar chunks to query vector
   → Returns: Chunk 1, Chunk 3, Chunk 7...
   ↓
Build Prompt: "Based on this context: [chunks]... generate 10 MCQs"
   ↓
Gemini API → Returns structured JSON with questions
   ↓
Save to PostgreSQL + Return to user
```

---

## 11. API REFERENCE

### Authentication APIs (`/api/v1/auth/`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register/` | No | Create new account |
| POST | `/login/` | No | Login, get tokens |
| POST | `/logout/` | Yes | Invalidate refresh token |
| GET | `/profile/` | Yes | Get your profile |
| PATCH | `/profile/` | Yes | Update your profile |
| POST | `/change-password/` | Yes | Change password |
| POST | `/token/refresh/` | No | Refresh access token |

### Document APIs (`/api/v1/documents/`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List your documents |
| POST | `/upload/` | Yes | Upload a PDF |
| GET | `/<id>/` | Yes | Get document details |
| DELETE | `/<id>/` | Yes | Delete a document |
| POST | `/<id>/reprocess/` | Yes | Re-run processing |

### Quiz APIs (`/api/v1/quizzes/`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List your quizzes |
| POST | `/generate/` | Yes | Generate AI quiz |
| GET | `/<id>/` | Yes | Get quiz (no answers) |
| GET | `/<id>/?with_answers=true` | Yes | Get quiz with answers |
| DELETE | `/<id>/delete/` | Yes | Delete a quiz |
| POST | `/<id>/submit/` | Yes | Submit quiz answers |
| GET | `/attempts/` | Yes | Your attempt history |
| GET | `/attempts/<id>/` | Yes | Specific attempt result |

### Analytics APIs (`/api/v1/analytics/`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard/` | Yes | Your full analytics |
| GET | `/leaderboard/` | Yes | Global leaderboard |
| GET | `/accuracy/?days=30` | Yes | Accuracy over time |

### Query Parameters (for list endpoints)

```
?page=2               → Get page 2
?page_size=20         → 20 items per page
?search=python        → Search by title/topic
?difficulty=hard      → Filter by difficulty
?ordering=-created_at → Sort (- = descending)
```

---

## 12. TROUBLESHOOTING

### Problem: `psycopg2` installation fails

```cmd
pip install psycopg2-binary --no-binary psycopg2-binary
```

### Problem: `faiss-cpu` installation fails

```cmd
pip install faiss-cpu --no-cache-dir
```

If still failing on Windows, try:
```cmd
pip install faiss-cpu==1.7.4
```

### Problem: Redis not available / caching errors

In `core/settings.py`, replace the CACHES section with:
```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}
```
This disables caching (fine for development).

### Problem: "No module named 'apps.users'"

Make sure you're running commands from the `backend` directory:
```cmd
cd C:\path\to\ai_quiz_platform\backend
python manage.py runserver
```

### Problem: Gemini API error

1. Check your API key in `.env`
2. Verify you have internet access
3. Check usage limits: https://ai.google.dev/
4. Try generating with a smaller `num_questions` (5 instead of 10)

### Problem: PDF processing fails

- Ensure the PDF is not password-protected
- Ensure the PDF has actual text (not just scanned images)
- Try a different PDF to confirm it's document-specific

### Problem: "FAISS index not found" during quiz generation

The system will fall back to using raw extracted text. This is fine!
To properly build the FAISS index, call the reprocess endpoint:
```
POST /api/v1/documents/<document_id>/reprocess/
```

### Problem: `makemigrations` fails with model errors

Make sure you run in this order:
```cmd
python manage.py makemigrations users
python manage.py makemigrations documents
python manage.py makemigrations quizzes
python manage.py makemigrations
python manage.py migrate
```

### Problem: "Table doesn't exist" errors

```cmd
python manage.py migrate --run-syncdb
```

---

## DEVELOPMENT TIPS

### Daily Workflow

```cmd
# 1. Navigate to project
cd C:\path\to\ai_quiz_platform\backend

# 2. Activate virtual environment
venv\Scripts\activate

# 3. Start server
python manage.py runserver
```

### Useful Management Commands

```cmd
# Open Django shell (interactive Python with Django loaded)
python manage.py shell

# Check for issues without running server
python manage.py check

# After changing a model, always run:
python manage.py makemigrations
python manage.py migrate

# See all available commands
python manage.py help
```

### View Logs

```
logs/app.log    → All application logs
logs/errors.log → Only errors
```

### Access Django Admin

1. Go to: http://127.0.0.1:8000/admin/
2. Login with your superuser credentials
3. You can view/edit all data: users, documents, quizzes, attempts

---

## NEXT STEPS (When You're Ready)

1. **Add Celery** for background PDF processing (so uploads don't block the response)
2. **Add email verification** for registration
3. **Deploy to a VPS** (DigitalOcean, AWS, Render)
4. **Add Nginx** in production for serving media files
5. **Build a React frontend** to consume these APIs
6. **Add rate limiting** per user (currently uses DRF throttling globally)

---

*Built with ❤️ — AI Quiz Platform v1.0*
