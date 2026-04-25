from ai.llm_chain import LLMChain
from ai.prompts import VALID_ANSWERS


def test_dummy_mode_returns_valid_answer():
    chain = LLMChain("Batman")
    result = chain.get_answer("Czy ta postac jest fikcyjna?", [])
    assert result["answer"] in VALID_ANSWERS
    assert "raw_response" in result


def test_dummy_mode_with_history():
    chain = LLMChain("Marie Curie")
    history = [
        {"role": "player", "question": "Czy to kobieta?"},
        {"role": "ai", "answer": "Tak"},
    ]
    result = chain.get_answer("Czy ta osoba jest naukowcem?", history)
    assert result["answer"] in VALID_ANSWERS


def test_validate_exact_match():
    assert LLMChain._validate("Tak") == "Tak"
    assert LLMChain._validate("Nie") == "Nie"
    assert LLMChain._validate("Nie wiem") == "Nie wiem"


def test_validate_case_insensitive():
    assert LLMChain._validate("tak") == "Tak"
    assert LLMChain._validate("nie") == "Nie"
    assert LLMChain._validate("NIE WIEM") == "Nie wiem"


def test_validate_strips_trailing_dot():
    assert LLMChain._validate("Tak.") == "Tak"
    assert LLMChain._validate("Nie.") == "Nie"


def test_validate_fallback_on_invalid():
    assert LLMChain._validate("Maybe") == "Nie wiem"
    assert LLMChain._validate("Yes") == "Nie wiem"
    assert LLMChain._validate("To jest Batman") == "Nie wiem"
