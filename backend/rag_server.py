from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
import uvicorn
import json

# Load once at startup
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-MiniLM-L6-v2")
vectorstore = Chroma(persist_directory="vectorstore", embedding_function=embeddings)

app = FastAPI()

# Allow CORS (optional but useful for local testing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryInput(BaseModel):
    query: str

@app.post("/query")
def query_vectorstore(input: QueryInput):
    # First try to get transcript-specific results
    results = vectorstore.similarity_search(
        input.query,
        k=20,  # Get more results initially
        filter={"source": "transcript"}  # Only get transcript chunks
    )
    
    # If no transcript results, fall back to all documents
    if not results:
        results = vectorstore.similarity_search(input.query, k=10)
    
    # Take top 10 most relevant results
    texts = [doc.page_content for doc in results[:10]]
    return texts

# Optional: allow uvicorn to run directly
if __name__ == "__main__":
    uvicorn.run("rag_server:app", host="0.0.0.0", port=8000)
