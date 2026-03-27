"""FastAPI server for Vietnamese autocomplete."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.core.suggestion_engine import SuggestionEngine
from src.core.corpus_processor import CorpusProcessor
from src.data.database import init_database, batch_update_frequencies

app = FastAPI(title="Vietnamese Autocomplete API")

# Enable CORS for VS Code extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database and engine
init_database()
engine = SuggestionEngine()
processor = CorpusProcessor()


class SuggestRequest(BaseModel):
    context: str
    prefix: str


class SuggestResponse(BaseModel):
    suggestions: list[str]


class ImportRequest(BaseModel):
    folder_path: str


class ImportResponse(BaseModel):
    success: bool
    words: int
    bigrams: int
    error: str | None = None


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/api/suggest", response_model=SuggestResponse)
async def get_suggestions(request: SuggestRequest):
    """Get autocomplete suggestions."""
    try:
        suggestions = engine.get_suggestions(request.context, request.prefix)
        return SuggestResponse(suggestions=suggestions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/import", response_model=ImportResponse)
async def import_corpus(request: ImportRequest):
    """Import corpus from folder."""
    try:
        word_freq, bigram_freq = processor.process_corpus_folder(request.folder_path)
        batch_update_frequencies(word_freq, bigram_freq)
        return ImportResponse(
            success=True,
            words=len(word_freq),
            bigrams=len(bigram_freq)
        )
    except Exception as e:
        return ImportResponse(
            success=False,
            words=0,
            bigrams=0,
            error=str(e)
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
