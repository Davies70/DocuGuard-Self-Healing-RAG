import os
import shutil
import uuid
import time
from typing import Dict, List
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_groq import ChatGroq
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document

from scenarios import SCENARIOS

app = FastAPI()

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. SETUP BRAIN ---
print("Loading local embedding model...")
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

llm = ChatGroq(
    api_key=os.getenv("GROK_API_KEY"),
    model="llama-3.3-70b-versatile",
    temperature=0
)

# --- 2. SESSION MANAGEMENT ---
# Store vectorstores in memory: { "session_id": FAISS_Object }
user_sessions: Dict[str, FAISS] = {}
SESSION_TIMEOUT = 3600  # 1 hour

def get_session_id(request: Request):
    return request.headers.get("X-Session-ID")

def get_vectorstore(session_id: str):
    if session_id in user_sessions:
        return user_sessions[session_id]
    
    # Try loading from disk
    folder_path = f"faiss_indexes/{session_id}"
    if os.path.exists(folder_path):
        try:
            vs = FAISS.load_local(folder_path, embeddings, allow_dangerous_deserialization=True)
            user_sessions[session_id] = vs
            return vs
        except:
            return None
    return None


class ChatRequest(BaseModel):
    message: str

class ScenarioRequest(BaseModel):
    scenario_id: str

# --- API ENDPOINTS ---

@app.post("/load-scenario")
async def load_scenario(req: ScenarioRequest, request: Request):
    session_id = get_session_id(request)
    if not session_id: return {"error": "No Session ID"}
    
    data = SCENARIOS.get(req.scenario_id)
    if not data: return {"error": "Scenario not found"}
    
    # Create fake documents from the dictionary
    docs = [
        Document(page_content=data["doc_a"], metadata={"source": "Old_Documentation.txt"}),
        Document(page_content=data["doc_b"], metadata={"source": "New_Changelog.txt"})
    ]
    
    # Split & Embed
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    splits = splitter.split_documents(docs)
    
    # Save isolated for this user
    vectorstore = FAISS.from_documents(documents=splits, embedding=embeddings)
    
    # Persist to disk
    folder = f"faiss_indexes/{session_id}"
    if not os.path.exists(folder): os.makedirs(folder)
    vectorstore.save_local(folder)
    
    # Update memory
    user_sessions[session_id] = vectorstore
    
    return {"status": f"Loaded scenario: {req.scenario_id}", "chunks": len(splits)}

@app.post("/ingest")
async def ingest_documents(request: Request):
    session_id = get_session_id(request)
    if not session_id: return {"error": "Missing Session ID"}

    # Standard ingest logic (assuming user put files in a folder named after their session)
    # For simplicity in this demo, we assume ./documents is shared or uploaded via UI
    # In a real app, you'd handle file uploads here.
    
    # For now, let's just return a placeholder if no file upload logic exists yet
    return {"status": "For this demo, please use the 'Load Scenario' dropdown."}

@app.post("/chat")
async def chat(req: ChatRequest, request: Request):
    session_id = get_session_id(request)
    vectorstore = get_vectorstore(session_id)
    
    if vectorstore is None:
        return {"response": "Please load a scenario first."}
        
    retriever = vectorstore.as_retriever()
    docs = retriever.invoke(req.message)
    context = "\n\n".join([d.page_content for d in docs])
    
    prompt = f"Context: {context}\n\nQuestion: {req.message}"
    response = llm.invoke(prompt)
    return {"response": response.content}

@app.get("/maintenance")
async def run_maintenance(request: Request):
    session_id = get_session_id(request)
    vectorstore = get_vectorstore(session_id)
    
    if vectorstore is None:
        return {"issues": []}

    docstore = vectorstore.docstore._dict
    doc_ids = list(docstore.keys())
    
    if len(doc_ids) < 2: return {"issues": []}

    # Grab the two loaded docs
    doc_a = docstore[doc_ids[0]].page_content
    doc_b = docstore[doc_ids[1]].page_content # In scenario mode we strictly have 2 docs
    
    prompt = f"""
    You are a Senior Technical Writer auditing software documentation.
    
    Compare "Text A" (Old Docs) against "Text B" (New Changelog).
    
    Task: Identify DEPRECATED features or CONFLICTING instructions.
    
    Text A: {doc_a}
    Text B: {doc_b}
    
    Reply ONLY in JSON format: 
    {{
        "contradiction": true, 
        "reason": "Explain the conflict clearly", 
        "fix": "Write the exact new sentence that should be in the docs", 
        "severity": "High",
        "old_quote": "Exact quote from Text A that is now wrong",
        "new_quote": "Exact quote from Text B that proves it changed"
    }}
    
    If no contradiction, reply: {{"contradiction": false}}
    """
    
    response = llm.invoke(prompt)
    return {"issues": [response.content]}