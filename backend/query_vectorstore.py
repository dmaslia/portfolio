import sys
import json
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings

def run_query(query_text):
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-MiniLM-L6-v2")
    vectorstore = Chroma(persist_directory="./vectorstore", embedding_function=embeddings)
    results = vectorstore.similarity_search(query_text, k=3)
    return [doc.page_content for doc in results]

if __name__ == "__main__":
    input_text = sys.argv[1]
    context = run_query(input_text)
    print(json.dumps(context))
