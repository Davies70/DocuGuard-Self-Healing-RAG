import os
from dotenv import load_dotenv # <--- ADD THIS
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings, ChatOllama

# --- NEW: GROQ & HUGGINGFACE IMPORTS ---
from langchain_groq import ChatGroq
from langchain_community.embeddings import HuggingFaceEmbeddings

# app = FastAPI()

# # --- ALLOW FRONTEND TO TALK TO BACKEND ---
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # 1. Setup - The Brain & Database
# embeddings = OllamaEmbeddings(model="llama3") 
# llm = ChatOllama(model="llama3")

# # Try to load existing DB if it exists (Persist data)
# vectorstore = None
# if os.path.exists("faiss_index"):
#     try:
#         # allow_dangerous_deserialization is needed for local files in newer LangChain versions
#         vectorstore = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)
#         print("Loaded existing FAISS index.")
#     except Exception as e:
#         print(f"Could not load index: {e}")

# class ChatRequest(BaseModel):
#     message: str

# # 2. Ingest API - Reads your documents
# @app.post("/ingest")
# async def ingest_documents():
#     global vectorstore
    
#     # Check if documents folder exists
#     if not os.path.exists('./documents'):
#         os.makedirs('./documents')
#         return {"status": "Created 'documents' folder. Please add .txt files there."}

#     loader = DirectoryLoader('./documents', glob="**/*.txt", loader_cls=TextLoader)
#     docs = loader.load()
    
#     if not docs:
#         return {"status": "No documents found in /documents folder."}

#     splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
#     splits = splitter.split_documents(docs)
    
#     # Create the DB from the docs (or update existing)
#     if vectorstore is None:
#         vectorstore = FAISS.from_documents(documents=splits, embedding=embeddings)
#     else:
#         vectorstore.add_documents(splits)

#     # Save to disk
#     vectorstore.save_local("faiss_index")
    
#     return {"status": f"Ingested {len(splits)} chunks."}

# # 3. Chat API - Answers questions
# @app.post("/chat")
# async def chat(request: ChatRequest):
#     if vectorstore is None:
#         return {"response": "I haven't read any documents yet. Please click 'Read Docs' first."}
        
#     retriever = vectorstore.as_retriever()
#     docs = retriever.invoke(request.message)
#     context = "\n\n".join([d.page_content for d in docs])
    
#     prompt = f"Answer based on this context: {context}\n\nQuestion: {request.message}"
#     response = llm.invoke(prompt)
#     return {"response": response.content}

# # 4. Self-Healing API - The "Auditor"
# @app.get("/maintenance")
# async def run_maintenance():
#     if vectorstore is None:
#         return {"issues": ["No documents found. Please ingest data first."]}

#     # Get all documents (FAISS specific trick to peek at data)
#     # Note: FAISS doesn't easily let you list 'all' docs like Chroma, 
#     # so we will use the docstore directly for this maintenance check.
#     docstore = vectorstore.docstore._dict
#     doc_ids = list(docstore.keys())
    
#     issues = []
    
#     if len(doc_ids) < 2:
#         return {"issues": []} # Not enough docs to compare

#     # Compare the first doc with the others
#     doc_a = docstore[doc_ids[0]].page_content
    
#     for i in range(1, len(doc_ids)):
#         doc_b = docstore[doc_ids[i]].page_content
        
#         # Ask AI if they contradict
#         prompt = f"""
#         Compare these two texts. Do they contradict each other?
#         Text A: {doc_a}
#         Text B: {doc_b}
        
#         Reply strictly in JSON format: {{"contradiction": true/false, "reason": "why", "fix": "suggestion"}}
#         """
#         response = llm.invoke(prompt)
#         issues.append(response.content)
        
#     return {"issues": issues}


app = FastAPI()

# --- CORS SETUP ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. SETUP THE HYBRID BRAIN ---

# A. Embeddings (Local CPU - "The Memory")
# This downloads a small model (~100MB) automatically the first time you run it.
print("Loading local embedding model... (this might take a minute the first time)")
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# B. LLM (Groq Cloud - "The Brain")
# It looks for the GROQ_API_KEY environment variable automatically.
llm = ChatGroq(
    api_key=os.getenv("GROK_API_KEY"), # Good practice to be explicit
    model="llama-3.3-70b-versatile",
)

# --- DATABASE SETUP ---
vectorstore = None

# Helper to load existing DB
def load_db():
    global vectorstore
    if os.path.exists("faiss_index"):
        try:
            vectorstore = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)
            print("Loaded existing FAISS index.")
        except Exception as e:
            print(f"Could not load index: {e}")

# Try loading on startup
load_db()

class ChatRequest(BaseModel):
    message: str

# --- 2. INGEST API ---
@app.post("/ingest")
async def ingest_documents():
    global vectorstore
    
    if not os.path.exists('./documents'):
        os.makedirs('./documents')
        return {"status": "Created 'documents' folder. Please add .txt files there."}

    loader = DirectoryLoader('./documents', glob="**/*.txt", loader_cls=TextLoader)
    docs = loader.load()
    
    if not docs:
        return {"status": "No documents found in /documents folder."}

    # Split text
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    splits = splitter.split_documents(docs)
    
    # Create/Update DB
    if vectorstore is None:
        vectorstore = FAISS.from_documents(documents=splits, embedding=embeddings)
    else:
        vectorstore.add_documents(splits)

    vectorstore.save_local("faiss_index")
    
    return {"status": f"Ingested {len(splits)} chunks using Hybrid RAG (Groq + HF)."}

# --- 3. CHAT API ---
@app.post("/chat")
async def chat(request: ChatRequest):
    if vectorstore is None:
        return {"response": "I haven't read any documents yet. Please ingest first."}
        
    retriever = vectorstore.as_retriever()
    # Get relevant docs
    docs = retriever.invoke(request.message)
    context = "\n\n".join([d.page_content for d in docs])
    
    # Ask Groq
    prompt = f"Answer based on this context:\n\n{context}\n\nQuestion: {request.message}"
    response = llm.invoke(prompt)
    
    return {"response": response.content}

# --- 4. MAINTENANCE API ---
@app.get("/maintenance")
async def run_maintenance():
    if vectorstore is None:
        return {"issues": ["No documents found."]}

    # Access raw docs from FAISS
    docstore = vectorstore.docstore._dict
    doc_ids = list(docstore.keys())
    
    if len(doc_ids) < 2:
        return {"issues": []}

    issues = []
    
    # Compare first doc with up to 3 others (to save API calls)
    doc_a = docstore[doc_ids[0]].page_content
    
    for i in range(1, min(len(doc_ids), 4)):
        doc_b = docstore[doc_ids[i]].page_content
        
        # Strict JSON prompt for the Agent
        prompt = f"""
        Compare these two texts. Do they contradict each other?
        
        Text A: {doc_a}
        Text B: {doc_b}
        
        Reply ONLY in JSON format like this: 
        {{"contradiction": true, "reason": "brief explanation", "fix": "suggestion", "text_a_snippet": "part of A", "text_b_snippet": "part of B"}}
        
        If no contradiction, reply: {{"contradiction": false}}
        """
        
        response = llm.invoke(prompt)
        issues.append(response.content)
        
    return {"issues": issues}