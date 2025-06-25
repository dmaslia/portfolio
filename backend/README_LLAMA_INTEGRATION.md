# Llama-Server RAG Integration

This document explains how to integrate your local llama-server with the RAG system, replacing external API calls with local LLM inference.

## Overview

The system now uses:

- **Local llama-server** for LLM inference (replacing OpenAI API)
- **FastAPI RAG server** that combines vector search with local LLM
- **Single endpoint** `/api/chat` that handles both RAG and LLM in one request

## Prerequisites

1. **llama-server executable** - The llama.cpp server binary
2. **Model file** - `qwen2.5-1.5b-instruct-q4_k_m.gguf` (or any compatible model)
3. **Python dependencies** - Already included in `requirements.txt`

## Setup Instructions

### 1. Run the Setup Script

The easiest way to configure the system is to use the provided setup script:

```bash
cd backend
python setup_llama.py
```

This script will:

- Automatically search for llama-server and model files
- Prompt you for paths if not found automatically
- Update the configuration file
- Validate the setup

### 2. Manual Configuration

If you prefer to configure manually, edit `config.py` and update:

```python
LLAMA_SERVER_CONFIG = {
    "server_directory": "/path/to/your/llama-server/directory",  # CHANGE THIS
    "model": "qwen2.5-1.5b-instruct-q4_k_m.gguf",
    # ... other settings
}
```

### 3. Start the Server

```bash
cd backend
python rag_server.py
```

The server will:

- Start on port 8000
- Automatically launch llama-server in the background
- Provide both `/query` (RAG only) and `/api/chat` (RAG + LLM) endpoints

## API Endpoints

### `/api/chat` (Main Endpoint)

This is the main endpoint that combines RAG with local LLM inference.

**Request:**

```json
{
  "messages": [{ "role": "user", "content": "What classes did Daniel take?" }]
}
```

**Response:**

```json
{
  "response": "Based on the transcript, Daniel took courses including..."
}
```

### `/query` (RAG Only)

This endpoint returns only the relevant documents from the vector store.

**Request:**

```json
{
  "query": "What classes did Daniel take?"
}
```

**Response:**

```json
["Document 1 content...", "Document 2 content...", "..."]
```

## Architecture Changes

### Before (External API)

```
Frontend → server.js → OpenAI API
         ↓
         rag_server.py (vector search only)
```

### After (Local LLM)

```
Frontend → rag_server.py → llama-server (local)
         ↓
         Vector search + LLM inference
```

## Configuration Options

### Llama-Server Settings

Edit `config.py` to customize:

- **Model**: Change the model file
- **Threads**: Adjust CPU threads (default: 4)
- **Context size**: Change context window (default: 4096)
- **Port**: Change server port (default: 8000)

### RAG Settings

- **Max results**: Number of documents to retrieve (default: 10)
- **Embedding model**: Change embedding model
- **Vector store path**: Location of vector database

## Troubleshooting

### Llama-Server Won't Start

1. Check if the executable path is correct in `config.py`
2. Ensure the model file exists
3. Check if port 8000 is available
4. Run `python setup_llama.py` to validate paths

### Model Not Found

1. Verify the model file path in `config.py`
2. Ensure the model file is in the same directory as llama-server
3. Check file permissions

### Performance Issues

1. Reduce `threads` in config if CPU is overloaded
2. Reduce `ctx_size` for lower memory usage
3. Use a smaller model file

## Migration from External APIs

### Frontend Changes

Update your frontend to call the new endpoint:

```javascript
// Old: Call server.js
fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages: [...] })
})

// New: Call rag_server.py directly
fetch("http://localhost:8000/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages: [...] })
})
```

### Remove server.js

You can now remove or disable `server.js` since the RAG server handles everything.

## Benefits

1. **No API costs** - All inference is local
2. **Privacy** - No data sent to external services
3. **Speed** - Lower latency for local inference
4. **Offline** - Works without internet connection
5. **Customizable** - Full control over the model and parameters

## Limitations

1. **Resource usage** - Requires CPU/GPU resources
2. **Model quality** - Local models may be smaller than cloud APIs
3. **Setup complexity** - Requires downloading and configuring llama-server
4. **Memory usage** - Models can be several GB in size
