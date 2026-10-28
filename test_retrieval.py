import numpy as np

from app.services.embedding_service import EmbeddingService
from app.services.retrieval_service import RetrievalService


embedder = EmbeddingService()

chunks = [
    {
        "chunk_id": "doc1_page1_chunk1",
        "page": 1,
        "text": "Customers can raise complaints through the bank's grievance redressal mechanism."
    },
    {
        "chunk_id": "doc1_page2_chunk1",
        "page": 2,
        "text": "Borrowers must repay their loans according to the agreed repayment schedule."
    },
    {
        "chunk_id": "doc1_page3_chunk1",
        "page": 3,
        "text": "The bank must disclose all applicable service charges."
    }
]

texts = [chunk["text"] for chunk in chunks]

embeddings = embedder.embed_texts(texts)

retriever = RetrievalService(embedder)

query = "How can I report a problem with my bank?"

results = retriever.retrieve(
    query=query,
    chunks=chunks,
    embeddings=embeddings,
    top_k=3
)

for result in results:
    print(f"\nChunk: {result['chunk_id']}")
    print(f"Page: {result['page']}")
    print(f"Similarity: {result['similarity']:.4f}")
    print(f"Text: {result['text']}")