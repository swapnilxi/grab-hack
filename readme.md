# Grab Hackathon Project

This is a monorepo containing both the frontend (Next.js) and backend (FastAPI) for the Grab Hackathon project.

## Project Structure

```
.
├── backend/         # FastAPI backend (Python)
│   ├── main.py
|   |-- src/(entry point for agents)
│   ├── requirements.txt
│   └── ...
├── frontend/        # Next.js frontend (React/TypeScript)
│   ├── package.json
│   ├── src/
│   └── ...
├── dataset/         # Datasets used for the project
└── readme.md        # This file
```

---

## Prerequisites

- Python 3.10+ (for backend)
- Node.js 18+ and npm (for frontend)

---

## Backend Setup (FastAPI)

1. **Install dependencies**

```bash
cd backend
pip install -r requirements.txt
```

2. **Run the FastAPI server**

```bash
python main.py
```

- The backend will start on `http://localhost:8080` (or as configured in `main.py`).

---

## Frontend Setup (Next.js)

1. **Install dependencies**

```bash
cd frontend
npm install
```

2. **Run the development server**

```bash
npm run dev
```

- The frontend will start on `http://localhost:3000` by default.

---

## Usage

- Open [http://localhost:3000](http://localhost:3000) in your browser to access the dashboard UI.
- The dashboard allows you to run triage on all incidents, view case resolution stats, and interact with a chatbot (embedded via iframe).
- The frontend communicates with the backend FastAPI server at `http://localhost:8080`.

---

## Notes

- Make sure both the backend and frontend servers are running for full functionality.
- Datasets could be added in the `dataset/` folder for reference. provided by grabhack
- For any issues, check the terminal output of both servers for errors.

---

## Handover Checklist

- [x] Backend (FastAPI) runs and serves API endpoints
- [x] Frontend (Next.js) runs and connects to backend
- [x] Instructions for setup and running are provided above

---

## Contact

For any questions, please contact the project team.
