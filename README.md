# FinGuard AI — Banking Policy RAG Assistant

FinGuard AI is a Retrieval-Augmented Generation (RAG) application that answers questions about banking policies using evidence retrieved from uploaded PDF documents.

Instead of sending entire documents to the language model for every question, FinGuard AI retrieves relevant text chunks from a persistent vector database and supplies those chunks as context to the model. Answers are designed to remain grounded in the retrieved evidence and include source references.

## Features

* Upload and process PDF documents.
* Extract text and split it into overlapping chunks.
* Generate semantic embeddings using Sentence Transformers.
* Store document chunks and metadata in ChromaDB.
* Retrieve relevant passages using cosine similarity.
* Filter retrieved passages using a configurable similarity threshold.
* Generate evidence-grounded answers using the Groq API.
* Return source filenames, page numbers, chunk IDs, and similarity scores.
* Inspect retrieval results through a dedicated search endpoint.

## Architecture

### 1. Document Ingestion

```text
PDF Upload
    ↓
Text Extraction with PyMuPDF
    ↓
Chunking with RecursiveCharacterTextSplitter
    ↓
Embedding Generation
    ↓
Persistent Storage in ChromaDB
```

Each chunk retains metadata such as its source filename, page number, document ID, and chunk ID.

### 2. Question Answering

```text
User Question
    ↓
Query Embedding
    ↓
ChromaDB Similarity Search
    ↓
Similarity Threshold Filtering
    ↓
Retrieved Evidence + User Question
    ↓
Groq-hosted Language Model
    ↓
Answer with Source References
```

The language model receives the retrieved passages rather than the entire PDF collection.

## Technology Stack

| Component           | Technology               |
| ------------------- | ------------------------ |
| API framework       | FastAPI                  |
| PDF text extraction | PyMuPDF                  |
| Text chunking       | LangChain Text Splitters |
| Embeddings          | Sentence Transformers    |
| Embedding model     | all-MiniLM-L6-v2         |
| Vector database     | ChromaDB                 |
| Language model API  | Groq                     |
| Config and secrets  | python-dotenv            |
| Data validation     | Pydantic                 |

## Project Structure

```text
FinGuard AI/
├── app/
│   ├── __init__.py
│   ├── main.py
│   └── services/
│       ├── __init__.py
│       ├── document_loader.py
│       ├── text_chunker.py
│       ├── embedding_service.py
│       ├── vector_store.py
│       └── llm_service.py
├── chroma_data/
├── .env
├── .gitignore
├── requirements.txt
├── test_chunking.py
├── test_embeddings.py
├── test_vector_store.py
├── test_retrieval.py
└── test_llm.py
```

The `chroma_data/` directory is created for persistent vector storage when the application runs. It should generally be excluded from Git along with the virtual environment and secret configuration.

## Setup

### Prerequisites

* Python installed
* A Groq API key
* Internet access for downloading the embedding model and calling the language model API

### 1. Clone the repository

```powershell
git clone <your-repository-url>
cd "FinGuard AI"
```

### 2. Create and activate a virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks script activation, use an appropriate local execution-policy setting or activate the environment through your preferred terminal.

### 3. Install dependencies

```powershell
python -m pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
```

Replace the placeholder with your own API key. Never commit `.env` or expose the key in source code, screenshots, logs, or public repositories.

### 5. Start the application

Run from the project root:

```powershell
uvicorn app.main:app --reload
```

Open the FastAPI interactive documentation at:

```text
http://127.0.0.1:8000/docs
```

## API Endpoints

### `GET /health`

Checks whether the application is running, if this endpoint is implemented in the current version.

### `POST /documents/upload`

Uploads a PDF for processing and indexing.

The endpoint extracts text, creates chunks, generates embeddings, and stores them in ChromaDB.

Use the interactive API documentation to upload a PDF as multipart form data.

### `POST /search`

Searches the vector database without generating a language-model answer.

Example request:

```json
{
  "query": "What compensation applies to an unauthorized debit?",
  "top_k": 10,
  "min_similarity": 0.25
}
```

The response exposes retrieved passages, metadata, distances, and similarity scores for retrieval debugging.

### `POST /ask`

Retrieves evidence and generates an answer.

Example request:

```json
{
  "query": "According to section 4.1, what happens when SBI detects an unauthorized or erroneous debit, and what compensation applies if the debit causes a cheque to be returned?",
  "top_k": 10,
  "min_similarity": 0.25
}
```

The response contains the query, generated answer, source metadata, and number of retrieved chunks.

The precise request and response schemas should be confirmed against the running API documentation.

## Key Design Decisions

### Why RAG instead of sending the entire PDF?

Sending the entire document for every question increases context usage and can introduce irrelevant material. RAG retrieves a smaller set of relevant passages for each question.

### Why ChromaDB?

ChromaDB provides persistent vector storage and similarity search without requiring a separately managed database server for this prototype.

### Why Sentence Transformers?

The `all-MiniLM-L6-v2` model converts text into 384-dimensional embeddings. Semantically related passages can therefore be retrieved even when they do not share exactly the same words.

### Why cosine similarity?

The ChromaDB collection uses cosine distance. The application calculates similarity as:

`similarity = 1 - cosine_distance`

Higher similarity indicates a closer match under this metric. It is **not** a probability that the answer is correct.

### Why chunk the documents?

Chunking makes retrieval more focused and reduces the amount of text supplied to the language model. The current configuration uses a chunk size of 800 characters and an overlap of 120 characters.

Chunking is performed page by page, so context spanning page boundaries may not always be preserved.

### Why use a similarity threshold?

The threshold can exclude weakly matching passages before generation. Its value is a configurable heuristic and should be tuned using representative test questions rather than treated as a universal confidence score.

### Why use a low temperature?

The language model uses a temperature of `0.1` to encourage relatively consistent, less variable answers. A low temperature does not guarantee factual correctness.

## Testing Strategy

Test the system with questions that cover:

1. Information explicitly stated in a policy.
2. Questions that require combining multiple retrieved passages.
3. Questions about specific sections or procedures.
4. Questions for which the indexed documents contain insufficient evidence.
5. Similar questions that use different wording.
6. Questions that mention an amount, deadline, or eligibility condition.

For each test, inspect both the generated answer and the retrieved source passages. A plausible answer is not sufficient if the supporting evidence is irrelevant or incomplete.

## Current Limitations

* Scanned PDFs requiring OCR are not supported by the current text-extraction implementation.
* Retrieval quality depends on document content, chunk boundaries, query wording, and threshold selection.
* Source labels identify retrieved passages but do not independently verify that every cited passage entails the associated claim.
* Re-uploading a document with the same source filename replaces its existing indexed chunks; filenames are not robust document identities.
* The project has not been validated against a large, independently labelled evaluation dataset.
* Authentication, authorization, rate limiting, and production monitoring are not implemented as part of the current prototype.
* Answers should not be treated as financial, legal, or official banking advice without checking the original policy.

## Future Improvements

1. Build a small evaluation dataset with expected answers and supporting page references.
2. Improve document identity and version management.
3. Add citation validation and stronger evidence-to-claim checks.
4. Evaluate hybrid search or reranking if the baseline fails on representative questions.
5. Add OCR support for scanned documents.
6. Add authentication and operational safeguards before deploying the application publicly.

## Disclaimer

FinGuard AI is an educational prototype for exploring Retrieval-Augmented Generation. It is not an official banking service. Verify important financial or policy decisions against the original documents and the relevant institution's official guidance.
