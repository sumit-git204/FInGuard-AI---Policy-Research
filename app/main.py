from uuid import uuid4
from pydantic import BaseModel, Field

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.services.document_loader import extract_pdf
from app.services.text_chunker import chunk_pages
from app.services.embedding_service import EmbeddingService
from app.services.vector_store import VectorStore
from app.services.llm_service import LLMService

app = FastAPI(
title="FinGuard AI",
description="Evidence-based banking policy assistant",
version="0.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

embedder = EmbeddingService()
vector_store = VectorStore(path="./chroma_data")
llm_service = LLMService()

class SearchRequest(BaseModel):
    query: str
    top_k: int = Field(default=10, ge=1, le=50)
    min_similarity: float = Field(default=0.25, ge=-1.0, le=1.0)

@app.get("/health")
def health_check():
    return {
    "status": "healthy",
    "project": "FinGuard AI"
    }

@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
        status_code=400,
        detail="Please upload a PDF file."
        )


    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty."
        )

    try:
        pages = extract_pdf(file_bytes)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unable to read this PDF."
        )

    if not pages:
        raise HTTPException(
            status_code=422,
            detail="No extractable text found in the PDF."
        )

    chunks = chunk_pages(pages)

    if not chunks:
        raise HTTPException(
            status_code=422,
            detail="No text chunks could be generated."
        )

    texts = [chunk["text"] for chunk in chunks]
    embeddings = embedder.embed_texts(texts)

    document_id = uuid4().hex

    vector_store.delete_by_source(file.filename)
    
    vector_store.add_chunks(
        chunks=chunks,
        embeddings=embeddings,
        document_id=document_id,
        source=file.filename
    )

    return {
        "message": "Document processed and stored successfully.",
        "filename": file.filename,
        "document_id": document_id,
        "pages_extracted": len(pages),
        "total_chunks": len(chunks),
        "stored": True
    }


@app.post("/search")
def search_documents(request: SearchRequest):
    query = request.query.strip()

    if not query:
        raise HTTPException(
            status_code=400,
            detail="Please provide a search question."
        )

    if vector_store.collection.count() == 0:
        return {
            "query": query,
            "results": [],
            "message": "No documents have been indexed."
        }

    query_embedding = embedder.embed_texts([query])[0]

    search_results = vector_store.search(
        query_embedding=query_embedding,
        top_k=request.top_k
    )

    results = []

    for idx, chunk_id in enumerate(search_results["ids"][0]):
        distance = float(search_results["distances"][0][idx])
        similarity = 1.0 - distance

        if similarity < request.min_similarity:
            continue

        metadata = search_results["metadatas"][0][idx]

        results.append({
            "chunk_id": metadata["chunk_id"],
            "text": search_results["documents"][0][idx],
            "source": metadata["source"],
            "page": metadata["page"],
            "similarity": similarity,
            "distance": distance
        })

    return {
        "query": query,
        "top_k": request.top_k,
        "min_similarity": request.min_similarity,
        "results_count": len(results),
        "results": results
    }


@app.post("/ask")
def ask_question(request: SearchRequest):
    query = request.query.strip()

    if not query:
        raise HTTPException(
            status_code=400,
            detail="Please provide a question."
        )

    if vector_store.collection.count() == 0:
        return {
            "query": query,
            "answer": "No documents have been indexed yet. Upload a PDF first.",
            "sources": [],
            "retrieved_chunks": 0
        }

    query_embedding = embedder.embed_texts([query])[0]

    search_results = vector_store.search(
        query_embedding=query_embedding,
        top_k=request.top_k
    )

    contexts = []

    for idx, chunk_id in enumerate(search_results["ids"][0]):
        distance = float(search_results["distances"][0][idx])
        similarity = 1.0 - distance

        if similarity < request.min_similarity:
            continue

        metadata = search_results["metadatas"][0][idx]

        contexts.append({
            "chunk_id": metadata["chunk_id"],
            "text": search_results["documents"][0][idx],
            "source": metadata["source"],
            "page": metadata["page"],
            "similarity": similarity,
            "distance": distance
        })

    if not contexts:
        return {
            "query": query,
            "answer": (
                "I couldn't find sufficiently relevant information in the "
                "indexed documents to answer this question."
            ),
            "sources": [],
            "retrieved_chunks": 0
        }

    try:
        answer = llm_service.generate_answer(
            query=query,
            contexts=contexts
        )
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="The language model service could not generate an answer."
        )

    sources = [
            {
                "source_id": f"S{index}",
                "source": context["source"],
                "page": context["page"],
                "chunk_id": context["chunk_id"],
                "similarity": round(context["similarity"], 4)
            }
            for index, context in enumerate(contexts, start=1)
            ]

    return {
        "query": query,
        "answer": answer,
        "sources": sources,
        "retrieved_chunks": len(contexts)
    }

