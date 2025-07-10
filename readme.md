# Grab Hackathon – Grab Triaging Agent (GTA)

**End-to-end AI-driven payment reliability & incident triage platform**  
Monorepo: Next.js (frontend) + FastAPI (backend)

---

## 📑 Table of Contents
- [Live Demo](#-live-demo)
- [Overview](#-overview)
- [Project Structure](#-project-structure)
- [Quickstart](#-quickstart)
- [Usage](#-usage)
- [RAG Chatbot](#-rag-chatbot)
- [Notes](#-notes)
- [Handover Checklist](#-handover-checklist)
- [FAQ](#-faq)
- [Contact](#-contact)

---

## 🚀 Live Demo

For a live demo, visit: [localhost:3000/gta](http://localhost:3000/gta)

---

## 📚 Overview

Grab Triaging Agent (GTA) is a multi-agent platform that automates the triage, routing, and resolution of payments incidents and operational tickets for Grab’s payments team.

**Key Features:**
- **AI-powered triage:** Prioritizes high-impact incidents in real time
- **Specialized agents:** Healing, fraud detection, reconciliation, and routing
- **RAG-based chatbot:** Retrieval-Augmented Generation chatbot that leverages historical incident data (NeonDB + PGVector) to recommend fixes and guide ops
- **Full-stack app:** FastAPI (Python backend), Next.js (React/TS frontend)
- **Human oversight:** All high-priority and unresolved cases go to manual review

---

## 🗂️ Project Structure

```
.
├── backend/         # FastAPI backend (Python, agents, APIs)
│   ├── main.py
│   ├── src/         # Agent logic & orchestration
│   └── requirements.txt
├── frontend/        # Next.js frontend (React/TypeScript UI)
│   ├── src/
│   └── package.json
├── dataset/         # Sample/competition datasets
└── README.md        # This file
```

---

## ⚡ Quickstart

### 1. Prerequisites
- Python 3.10+ (backend)
- Node.js 18+ and npm (frontend)

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```
> Backend runs at `http://localhost:8080`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
> Frontend runs at `http://localhost:3000`
> Demo UI at [localhost:3000/gta](http://localhost:3000/gta)

---

## 🖥️ Usage

- Open [http://localhost:3000/gta](http://localhost:3000/gta) for the GTA dashboard.
- Triage all incidents, view analytics, and interact with the LLM-powered RAG chatbot.
- The RAG chatbot draws on previous resolved incidents to suggest actions and provide guidance in real time.
- Frontend communicates with backend FastAPI at `http://localhost:8080`.

---

## 💡 RAG Chatbot

Our **Retrieval-Augmented Generation (RAG) chatbot** is integrated directly into the dashboard.

- Uses NeonDB with PGVector embeddings for fast, relevant context retrieval.
- Chatbot can recommend resolutions, explain historical fixes, and answer ops questions using company-specific incident data.
- Available as an embedded panel or standalone assistant within the UI.

---

## 🛠️ Notes

- Ensure both backend and frontend servers are running.
- Place additional datasets in `dataset/`.
- Error logs will appear in the terminal for each service.

---

## ✅ Handover Checklist

- [x] Backend: FastAPI server runs and serves endpoints
- [x] Frontend: Next.js UI runs and connects to backend
- [x] RAG chatbot integrated and operational
- [x] Setup instructions provided above
- [x] Dataset structure included

---

## 🙋 FAQ

**Q: What is GTA?**  
A: GTA is an AI-powered triaging platform for payment ops—using agent workflows and a RAG chatbot to boost reliability and reduce manual load.

**Q: How does the RAG chatbot work?**  
A: The chatbot leverages embeddings from past incidents to retrieve relevant knowledge and provide actionable recommendations for current tickets.

**Q: What’s required to run this?**  
A: Python 3.10+ and Node.js 18+ on your machine, plus basic install steps above.

---

## 📧 Contact

For issues or questions, reach out to the project team via email or Slack (see hackathon portal).

---

**You can copy-paste this directly as your README.md!**  
Let me know if you want a contributor/team section, badges, or further customization.
