import numpy as np

from app.services.embedding_service import EmbeddingService


class RetrievalService:
    def __init__(self, embedder: EmbeddingService):
        self.embedder = embedder

    def retrieve(self, query: str, chunks: list[dict], embeddings, top_k: int = 3):
        if not chunks:
            return []

        query_vector = self.embedder.embed_texts([query])[0]

        scores = embeddings @ query_vector
        # embeddings is a 2D array (3, 384) 3 vector rows and 384 numericals to reprsent , and query_vector is a 1D array (384,). The @ operator performs matrix multiplication, resulting in a 1D array of similarity scores.

        # scores is a 1D array of similarity scores, where each score corresponds to the similarity between the query and a chunk. The length of scores is equal to the number of chunks.

        ranked_indices = np.argsort(scores)[::-1][:top_k]

        results = []

        for idx in ranked_indices:
            results.append({
                "chunk_id": chunks[idx]["chunk_id"],
                "page": chunks[idx]["page"],
                "text": chunks[idx]["text"],
                "similarity": float(scores[idx])
            })

        return results