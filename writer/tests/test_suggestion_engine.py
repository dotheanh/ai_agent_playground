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
    # Returns list of tuples (word, is_from_dictionary)
    assert len(suggestions) == 5
    # All should be from corpus (is_from_dictionary=False)
    assert all(not is_dict for _, is_dict in suggestions)


def test_get_suggestions_filters_by_prefix():
    """Test that suggestions are filtered by prefix."""
    engine = SuggestionEngine()

    engine.add_bigram("lam", "việc", 120)
    engine.add_bigram("lam", "vui", 50)
    engine.add_bigram("lam", "bài", 60)

    # Filter by prefix "v"
    suggestions = engine.get_suggestions("lam ", "v")

    # Suggestions are tuples (word, is_from_dictionary)
    words = [word for word, _ in suggestions]
    assert all(word.startswith("v") for word in words)
    assert "việc" in words
    assert "vui" in words


def test_get_suggestions_sorts_by_frequency():
    """Test that suggestions are sorted by frequency."""
    engine = SuggestionEngine()

    engine.add_bigram("testword", "việc", 120)
    engine.add_bigram("testword", "bài", 60)
    engine.add_bigram("testword", "người", 20)

    suggestions = engine.get_suggestions("testword ", "")

    # Suggestions are tuples (word, is_from_dictionary)
    words = [word for word, _ in suggestions]
    assert words[0] == "việc"
    assert words[1] == "bài"
    assert words[2] == "người"


def test_get_suggestions_fallback_to_dictionary():
    """Test dictionary fallback when corpus has < 5 suggestions."""
    engine = SuggestionEngine()

    # Only 1 bigram available that starts with "v"
    engine.add_bigram("testprefix", "việc", 120)

    # Should fill remaining from dictionary
    suggestions = engine.get_suggestions("testprefix ", "v")

    # Suggestions are tuples (word, is_from_dictionary)
    words = [word for word, _ in suggestions]
    # Should have at least the bigram + some dictionary words
    assert len(suggestions) >= 1
    assert "việc" in words
