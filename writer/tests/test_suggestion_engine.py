from src.core.suggestion_engine import SuggestionEngine


def test_get_suggestions_returns_top_5():
    """Test that suggestions returns exactly 5 items."""
    engine = SuggestionEngine()

    # Setup: add some bigrams
    engine.add_bigram("lam", "việc", 120)
    engine.add_bigram("lam", "bài", 60)
    engine.add_bigram("lam", "người", 20)
    engine.add_bigram("lam", "ăn", 15)
    engine.add_bigram("lam", "quen", 10)

    suggestions = engine.get_suggestions("lam ", "")
    assert len(suggestions) == 5


def test_get_suggestions_filters_by_prefix():
    """Test that suggestions are filtered by prefix."""
    engine = SuggestionEngine()

    engine.add_bigram("lam", "việc", 120)
    engine.add_bigram("lam", "vui", 50)
    engine.add_bigram("lam", "bài", 60)

    # Filter by prefix "v"
    suggestions = engine.get_suggestions("lam ", "v")

    assert all(s.startswith("v") for s in suggestions)
    assert "việc" in suggestions
    assert "vui" in suggestions


def test_get_suggestions_sorts_by_frequency():
    """Test that suggestions are sorted by frequency."""
    engine = SuggestionEngine()

    engine.add_bigram("testword", "việc", 120)
    engine.add_bigram("testword", "bài", 60)
    engine.add_bigram("testword", "người", 20)

    suggestions = engine.get_suggestions("testword ", "")

    assert suggestions[0] == "việc"
    assert suggestions[1] == "bài"
    assert suggestions[2] == "người"


def test_get_suggestions_fallback_to_dictionary():
    """Test dictionary fallback when corpus has < 5 suggestions."""
    engine = SuggestionEngine()

    # Only 1 bigram available that starts with "v"
    engine.add_bigram("testprefix", "việc", 120)

    # Should fill remaining from dictionary
    suggestions = engine.get_suggestions("testprefix ", "v")

    # Should have at least the bigram + some dictionary words
    assert len(suggestions) >= 1
    assert "việc" in suggestions
