from src.core.corpus_processor import CorpusProcessor


def test_normalize_text():
    """Test text normalization."""
    processor = CorpusProcessor()

    # Multiple spaces -> single space
    assert processor.normalize_text("hello   world") == "hello world"

    # Multiple newlines -> single newline
    assert processor.normalize_text("hello\n\n\nworld") == "hello\nworld"


def test_tokenize_vietnamese():
    """Test Vietnamese tokenization."""
    processor = CorpusProcessor()

    tokens = processor.tokenize("tôi đang làm việc chăm")
    assert "tôi" in tokens
    assert "làm" in tokens
    assert "việc" in tokens


def test_extract_bigrams():
    """Test bigram extraction."""
    processor = CorpusProcessor()

    tokens = ["tôi", "đang", "làm", "việc"]
    bigrams = processor.extract_ngrams(tokens, 2)

    assert ("tôi", "đang") in bigrams
    assert ("đang", "làm") in bigrams
    assert ("làm", "việc") in bigrams


def test_process_corpus_updates_frequency():
    """Test that processing corpus updates word and bigram frequencies."""
    processor = CorpusProcessor()

    text = "tôi làm việc tôi làm bài"
    word_freq, bigram_freq = processor.process_text(text)

    assert word_freq["tôi"] == 2
    assert word_freq["làm"] == 2
    assert ("tôi", "làm") in bigram_freq
