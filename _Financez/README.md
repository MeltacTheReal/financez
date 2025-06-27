# My Financez

A personal finance tracker web app.

## Project Structure

```
_Financez/
│
├── backend/         # Python Flask backend
├── frontend/        # Static frontend (HTML, JS, Tailwind CSS)
```

## Getting Started

### 1. Backend (Flask)

1. Install dependencies:
   ```bash
   pip install flask
   ```
2. Run the backend:
   ```bash
   python app.py
   ```
   (from the `backend` directory)

### 2. Backend (FastAPI)

Install dependencies:

    pip install fastapi uvicorn

Run the backend server:

    cd _Financez/backend
    uvicorn app:app --host 0.0.0.0 --port 8001

### Frontend

Open `frontend/index.html` in your browser. (For API calls to work, the backend must be running on the same host and port, or you may need to adjust CORS/settings.)

---

## Features (Planned)
- Income & expense tracking
- Budget planning
- Goal setting
- Bill reminders
- Reports & analysis
- Secure data storage 