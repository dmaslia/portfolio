import os
from pathlib import Path

# Llama-server configuration
LLAMA_SERVER_CONFIG = {
    "url": "http://localhost:8001",
    "model": "qwen2.5-1.5b-instruct-q4_k_m.gguf",
    "port": 8001,
    "threads": 4,
    "ctx_size": 4096,
    # Update this path to where your llama-server executable and model file are located
    "server_directory": "~/Desktop/coding/llama.cpp/build/bin",  # CHANGE THIS PATH
    "executable": "llama-server"
}

# RAG configuration
RAG_CONFIG = {
    "vectorstore_path": "/Users/danielmaslia/Desktop/coding/portfolio/backend/vectorstore",
    "embedding_model": "sentence-transformers/paraphrase-MiniLM-L6-v2",
    "max_results": 10,
    "transcript_filter": {"source": "transcript"}
}

# System prompt for the LLM
SYSTEM_PROMPT = """You are a helpful AI assistant that generates HTML content for a portfolio website. You should:

1. Use Tailwind CSS v3.x classes for styling
2. Generate semantic HTML5 markup
3. Include proper accessibility attributes
4. Use responsive design patterns
5. Follow modern web development best practices

When generating HTML, wrap it in a code block like this:
```html
<your HTML here>
```

The HTML should be a complete, standalone document that can be rendered directly. Do not include any explanations or text outside the code block
The message reply should only contain the HTML and no other text."""

# API configuration
API_CONFIG = {
    "host": "0.0.0.0",
    "port": 8000,
    "log_level": "info"
}

def get_llama_server_path():
    """Get the full path to the llama-server executable"""
    server_dir = LLAMA_SERVER_CONFIG["server_directory"]
    executable = LLAMA_SERVER_CONFIG["executable"]
    
    # Expand ~ to home directory and make path absolute
    server_dir = os.path.expanduser(server_dir)
    if not os.path.isabs(server_dir):
        server_dir = os.path.abspath(server_dir)
    
    return os.path.join(server_dir, executable)

def get_model_path():
    """Get the full path to the model file"""
    server_dir = LLAMA_SERVER_CONFIG["server_directory"]
    model = LLAMA_SERVER_CONFIG["model"]
    
    # Expand ~ to home directory and make path absolute
    server_dir = os.path.expanduser(server_dir)
    if not os.path.isabs(server_dir):
        server_dir = os.path.abspath(server_dir)
    
    return os.path.join(server_dir, model)

def validate_config():
    """Validate that all required files exist"""
    errors = []
    
    # Check llama-server executable
    llama_path = get_llama_server_path()
    if not os.path.exists(llama_path):
        errors.append(f"Llama-server executable not found at: {llama_path}")
    
    # Check model file
    model_path = get_model_path()
    if not os.path.exists(model_path):
        errors.append(f"Model file not found at: {model_path}")
    
    return errors 