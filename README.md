# DocuGuard: Self-Healing RAG Auditor

DocuGuard is an automated documentation verification system designed to identify and remediate inconsistencies between software documentation and technical changelogs. By leveraging Retrieval-Augmented Generation (RAG) and Large Language Models (LLM), the system audits documentation for deprecated features, breaking changes, and security warnings.

## Overview

The system operates by ingesting pairs of documents—typically an existing documentation file and a newer changelog or release note. It generates vector embeddings for these documents to facilitate semantic search and comparison. The application provides two primary functions:

1. **Automated Auditing:** It autonomously compares the provided texts to detect contradictions, generating a structured report of issues such as outdated code snippets or deprecated API usage.
2. **Verification Agent:** A conversational interface allows users to query the documentation state to verify specific details or technical requirements.

## Architecture

The application is composed of two containerized services orchestrated via Docker Compose:

- **Backend (FastAPI):** Handles document ingestion, vector storage (FAISS), and LLM orchestration (Groq/Llama 3). It exposes REST endpoints for the frontend interface.
- **Frontend (Next.js):** A React-based dashboard that provides the user interface for loading scenarios, viewing audit reports, and interacting with the verification agent.

## Technology Stack

### Backend

- **Framework:** FastAPI (Python)
- **LLM Integration:** LangChain, Groq API (Llama 3 model)
- **Vector Store:** FAISS (CPU optimized)
- **Embeddings:** HuggingFace (`all-MiniLM-L6-v2`)

### Frontend

- **Framework:** Next.js 14
- **Styling:** Tailwind CSS
- **UI Components:** Lucide React, Shadcn UI

## Prerequisites

- Docker and Docker Compose
- An API Key from Groq (for LLM inference)

## Installation and Setup

### 1. Environment Configuration

Create a `.env` file in the root directory (or ensure these variables are set in your deployment environment):

```bash
GROQ_API_KEY=your_api_key_here
```

### 2. Running with Docker (Recommended)

The project includes a docker-compose.yml file for orchestrating both services.
Build and start the containers:

```bash
docker-compose up --build
```

The services will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

### 3. Manual Installation (Development)

If you prefer to run the services locally without Docker:

**Backend Setup**

```bash
cd backend
python -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend Setup**

```bash
cd frontend
npm install
npm run dev
```

## Usage Guide

### Loading Scenarios

Access the control panel on the left sidebar. Select a predefined technical scenario (e.g., "Stripe API", "Next.js 14"). This triggers the backend to:

1. Load the associated text files (Legacy Docs vs. Changelog)

2. Split and embed the text

3. Store the vectors in a session-specific FAISS index

### Running an Audit

Click "Run Auto-Auditor". The system will:

1. Retrieve the conflicting documents from the vector store

2. Perform a comparative analysis using the LLM

3. Return a JSON-structured list of discrepancies, including severity levels, specific quotes, and recommended remediation

### Verification Agent

Use the chat interface to ask specific questions about the loaded environment. The agent uses RAG to retrieve relevant context before generating an answer, ensuring responses are grounded in the provided documentation files.

## API Reference

### POST /load-scenario

Initializes the vector store with documents for a specific scenario.

```bash
Body:
{
"scenario_id": "string"
}
```

### POST /chat

```bash

Processes natural language queries against the loaded context.
Body:
{
"message": "string"
}
```

### GET /maintenance

Triggers the discrepancy analysis logic. Returns a list of identified documentation conflicts.
