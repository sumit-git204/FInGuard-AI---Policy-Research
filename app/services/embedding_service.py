from sentence_transformers import SentenceTransformer


class EmbeddingService:
    def __init__(self):
        self.model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    def embed_texts(self, texts: list[str]):
        return self.model.encode(
            texts,
            normalize_embeddings=True,
            convert_to_numpy=True
        )