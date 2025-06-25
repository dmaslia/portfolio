from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
import uvicorn
import json
import httpx
import asyncio
import subprocess
import time
import os
from typing import List, Optional
from config import (
    LLAMA_SERVER_CONFIG, 
    RAG_CONFIG, 
    SYSTEM_PROMPT, 
    API_CONFIG,
    get_llama_server_path,
    get_model_path,
    validate_config
)

# Load once at startup
embeddings = HuggingFaceEmbeddings(model_name=RAG_CONFIG["embedding_model"])
vectorstore = Chroma(persist_directory=RAG_CONFIG["vectorstore_path"], embedding_function=embeddings)

# Verify vectorstore is loaded
print(f"✅ Vectorstore loaded with {vectorstore._collection.count()} documents")

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

class ChatInput(BaseModel):
    messages: List[dict]

class LlamaServerManager:
    def __init__(self):
        self.process = None
        self.is_running = False
    
    def start_server(self):
        """Start the llama-server process"""
        if self.process is None or self.process.poll() is not None:
            try:
                # Check if llama-server is already running
                import requests
                response = requests.get(f"{LLAMA_SERVER_CONFIG['url']}/health", timeout=2)
                if response.status_code == 200:
                    self.is_running = True
                    print("Llama server is already running")
                    return True
            except:
                pass
            
            # Validate configuration first
            errors = validate_config()
            if errors:
                print("Configuration errors:")
                for error in errors:
                    print(f"  - {error}")
                print("\nPlease update the server_directory in config.py to point to your llama-server location")
                return False
            
            # Start the llama-server process
            llama_executable = get_llama_server_path()
            model_path = get_model_path()
            
            cmd = [
                llama_executable,
                "-m", model_path,
                "--port", str(LLAMA_SERVER_CONFIG["port"]),
                "--threads", str(LLAMA_SERVER_CONFIG["threads"]),
                "--ctx-size", str(LLAMA_SERVER_CONFIG["ctx_size"])
            ]
            
            try:
                print(f"Starting llama-server with command: {' '.join(cmd)}")
                self.process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    cwd=os.path.dirname(llama_executable)  # Use the directory of the executable
                )
                
                # Wait a bit for the server to start
                time.sleep(5)
                
                # Check if server started successfully
                try:
                    response = requests.get(f"{LLAMA_SERVER_CONFIG['url']}/health", timeout=5)
                    if response.status_code == 200:
                        self.is_running = True
                        print("Llama server started successfully")
                        return True
                except:
                    print("Failed to start llama server - health check failed")
                    return False
                    
            except Exception as e:
                print(f"Error starting llama server: {e}")
                return False
    
    def stop_server(self):
        """Stop the llama-server process"""
        if self.process:
            self.process.terminate()
            self.process.wait()
            self.process = None
            self.is_running = False

# Initialize llama server manager
llama_manager = LlamaServerManager()

@app.on_event("startup")
async def startup_event():
    """Start llama-server on startup"""
    print("Starting RAG server...")
    llama_manager.start_server()

@app.on_event("shutdown")
async def shutdown_event():
    """Stop llama-server on shutdown"""
    print("Shutting down RAG server...")
    llama_manager.stop_server()

@app.post("/query")
def query_vectorstore(input: QueryInput):
    """Get relevant documents from vector store"""
    print(f"🔍 Searching for: {input.query}")
    
    # Search entire vectorstore without filters
    results = vectorstore.similarity_search(
        input.query,
        k=RAG_CONFIG["max_results"]
    )
    
    print(f"📄 Found {len(results)} results")
    
    # Return document contents
    texts = [doc.page_content for doc in results]
    return texts

async def call_llama_server(messages: List[dict], context: str = "") -> str:
    """Call the local llama-server API"""
    if not llama_manager.is_running:
        if not llama_manager.start_server():
            raise Exception("Failed to start llama server")
    
    # Prepare the prompt with context
    full_prompt = f"{SYSTEM_PROMPT}\n"
    if context:
        full_prompt += f"\n---\nContext:\n{context}\n---\n"
    
    # Add conversation history
    for message in messages:
        role = message.get("role", "user")
        content = message.get("content", "")
        if role == "system":
            continue  # Skip system messages as we have our own
        elif role == "user":
            full_prompt += f"\nUser: {content}"
        elif role == "assistant":
            full_prompt += f"\nAssistant: {content}"
    
    full_prompt += "\nAssistant:"
    
    # Call llama-server API
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{LLAMA_SERVER_CONFIG['url']}/completion",
                json={
                    "prompt": full_prompt,
                    "n_predict": 2048,
                    "temperature": 0.7,
                    "stop": ["User:", "\n\n"]
                },
                timeout=60.0
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("content", "").strip()
            else:
                raise Exception(f"Llama server error: {response.status_code}")
                
        except Exception as e:
            print(f"Error calling llama server: {e}")
            raise

@app.post("/api/chat")
async def chat_endpoint(input: ChatInput):
    """Main chat endpoint that combines RAG and LLM"""
    try:
        messages = input.messages
        if not messages:
            return {"error": "No messages provided"}
        
        user_message = messages[-1].get("content", "")
        print(f"Received user message: {user_message}")
        
        # Get vector context from RAG system
        vector_context = ""
        try:
            # Use the existing query endpoint
            rag_response = await query_vectorstore_async(QueryInput(query=user_message))
            vector_context = "\n---\n".join(rag_response)
        except Exception as e:
            print(f"Vector store query failed: {e}")
        
        # Call local llama-server
        bot_response = await call_llama_server(messages, vector_context)
        print(f"Got bot response: {bot_response}")
        
        # Save chat history (optional)
        try:
            save_chat_history(user_message, bot_response)
        except Exception as e:
            print(f"Failed to save chat history: {e}")
        
        return {"response": bot_response}
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return {"error": f"Something went wrong: {str(e)}"}

async def query_vectorstore_async(input: QueryInput):
    """Async version of query_vectorstore"""
    # This is a simple wrapper to make the existing function async-compatible
    return query_vectorstore(input)

def save_chat_history(user_message: str, bot_response: str):
    """Save chat history to file"""
    try:
        import datetime
        log_entry = {
            "timestamp": datetime.datetime.now().isoformat(),
            "userMessage": user_message,
            "botResponse": bot_response
        }
        
        # Ensure logs directory exists
        os.makedirs("logs", exist_ok=True)
        
        # Load existing history
        history_file = "logs/chat_history.json"
        try:
            with open(history_file, "r") as f:
                history = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            history = []
        
        # Add new entry
        history.append(log_entry)
        
        # Save back to file
        with open(history_file, "w") as f:
            json.dump(history, f, indent=2)
            
    except Exception as e:
        print(f"Error saving chat history: {e}")

# Optional: allow uvicorn to run directly
if __name__ == "__main__":
    uvicorn.run("rag_server:app", host=API_CONFIG["host"], port=API_CONFIG["port"])
