# IncidentMind

AI Incident Response Agent for DevOps/SRE teams with persistent memory.

## How It Works

1. **Submit an incident** — title, description, service, environment, error, symptoms
2. **Hindsight memory search** — retrieves similar resolved incidents using TF-IDF cosine similarity
3. **LLM analysis** — sends incident + memories to Groq for structured root cause analysis
4. **Resolution storage** — after resolution, stores root cause + resolution in persistent memory
5. **Improvement over time** — future similar incidents retrieve past memories to improve response

## Architecture

```
frontend/          React app (port 3000)
backend/           FastAPI app (port 8000)
  services/
    memory.py      Hindsight persistent memory (SQLite + TF-IDF similarity)
    llm.py         Groq LLM integration
    incident.py    Incident processing pipeline
  main.py          FastAPI endpoints
  incidents.db     SQLite database (auto-created)
```

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
copy .env.example .env
# Edit .env and add your Groq API key
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/incidents/analyze` | Submit incident for AI analysis |
| POST | `/api/incidents/resolve` | Store resolution in memory |
| GET | `/api/incidents` | List all incidents |
| GET | `/api/incidents/{id}` | Get specific incident |
| GET | `/api/memory/stats` | Memory statistics |

## Get Groq API Key

1. Visit https://console.groq.com
2. Create an account and generate an API key
3. Add it to `backend/.env` as `GROQ_API_KEY=your_key_here`
