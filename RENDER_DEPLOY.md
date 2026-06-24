# Render Deployment Guide

This project has 3 services to deploy on Render:
1. **ML Service** (Python/FastAPI)
2. **Backend** (Java/Spring Boot)
3. **Frontend** (React/Nginx)

---

## Step 1 — Create a PostgreSQL Database on Render
1. Render Dashboard → New → PostgreSQL
2. Note down: **Host**, **Port**, **Database**, **Username**, **Password**, **External Database URL**

---

## Step 2 — Deploy ML Service (Python)
1. New → Web Service → connect your repo
2. **Root Directory**: `ML-Service`
3. **Runtime**: Python 3
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. **Environment Variables**:
   - `PORT` = `8000`
7. Note the deployed URL: `https://your-ml-service.onrender.com`

---

## Step 3 — Deploy Backend (Java/Spring Boot)
1. New → Web Service → connect your repo
2. **Root Directory**: `Student-AI-Backend`
3. **Runtime**: Docker  (uses the Dockerfile)
4. **Environment Variables** (set in Render dashboard):

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `jdbc:postgresql://<host>:5432/<db>` |
| `DB_USERNAME` | from Render Postgres |
| `DB_PASSWORD` | from Render Postgres |
| `JWT_SECRET_KEY` | any random 32+ char string |
| `JWT_EXPIRATION` | `3600000` |
| `GROK_API_KEY` | your Grok API key |
| `ML_SERVICE_URL` | URL from Step 2 |
| `FRONTEND_URL` | URL from Step 4 (set/update after frontend deploys) |
| `PORT` | `8080` |

5. Note the deployed URL: `https://your-backend.onrender.com`

---

## Step 4 — Deploy Frontend (React)
1. New → Web Service → connect your repo
2. **Root Directory**: `Student-AI-Frontend`
3. **Runtime**: Docker (uses the Dockerfile)
4. **Environment Variables**:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | URL from Step 3 |

5. After deploy, go back to **Backend service** → update `FRONTEND_URL` with this URL.

---

## Important Notes
- Render free tier spins down after inactivity — first request may be slow (~30s).
- The `DATABASE_URL` for Spring Boot must use JDBC format: `jdbc:postgresql://host:5432/dbname`
- `spring.jpa.hibernate.ddl-auto=update` will auto-create all tables on first boot.
