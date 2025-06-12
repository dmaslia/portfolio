import os
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document


UPLOAD_DIR = "./uploads"
VECTOR_DIR = "./vectorstore"

def load_documents():
    docs = []
    # First load transcript.txt if it exists
    transcript_path = os.path.join(UPLOAD_DIR, "transcript.txt")
    if os.path.exists(transcript_path):
        loader = TextLoader(transcript_path)
        transcript_docs = loader.load()
        # Add metadata to indicate this is from transcript
        for doc in transcript_docs:
            doc.metadata["source"] = "transcript"
            doc.metadata["priority"] = 1
        docs.extend(transcript_docs)
    
    # Then load other documents
    for filename in os.listdir(UPLOAD_DIR):
        if filename == "transcript.txt":
            continue  # Skip transcript as we already loaded it
        filepath = os.path.join(UPLOAD_DIR, filename)
        if filename.endswith(".pdf"):
            loader = PyPDFLoader(filepath)
            pages = loader.load()
            # Combine all pages into a single string to preserve flow
            full_text = "\n".join([p.page_content for p in pages])
            docs.append(Document(page_content=full_text, metadata={"source": filename, "priority": 0}))
        elif filename.endswith(".txt"):
            loader = TextLoader(filepath)
            other_docs = loader.load()
            for doc in other_docs:
                doc.metadata["source"] = filename
                doc.metadata["priority"] = 0
            docs.extend(other_docs)
    return docs

def embed_and_store():
    print("[*] Loading documents...")
    docs = load_documents()

    print(f"[*] Loaded {len(docs)} documents. Splitting into chunks...")
    
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n---\n\n", "\n\n", "\n", ".", " "],
    )

    chunks = splitter.split_documents(docs)

    print(f"[*] Generated {len(chunks)} chunks. Embedding...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-MiniLM-L6-v2")

    print(f"[*] Storing into Chroma at {VECTOR_DIR}")
    vs = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=VECTOR_DIR,
    )
    print("✅ Stored chunks:", vs._collection.count())

    print("[✓] Done. Vectorstore saved.")

if __name__ == "__main__":
    embed_and_store()
