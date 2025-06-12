import sys
import json
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
import os

print(">>> Python script started", file=sys.stderr)
sys.stderr.flush()

VECTOR_DIR = "vectorstore"

def run_query(query_text):
    
    print(f"[QUERY] Searching for: {query_text}", file=sys.stderr)
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/paraphrase-MiniLM-L6-v2"
    )
    
    vectorstore = Chroma(
        persist_directory=VECTOR_DIR,
        embedding_function=embeddings
    )
    
    results = vectorstore.similarity_search(query_text, k=5)
    
    print(f"[RESULT] Retrieved {len(results)} documents", file=sys.stderr)
    for i, doc in enumerate(results):
        print(f"\n-- Result {i+1} ---\n{doc.page_content}\n", file=sys.stderr)

    
    return [doc.page_content for doc in results]

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 query_vectorstore.py \"your query here\"")
        sys.exit(1)

    input_text = sys.argv[1]
    context = run_query(input_text)
    print(json.dumps(context))

