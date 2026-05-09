import random

EXAMPLE_CHARACTERS = [
    "Albert Einstein",
    "Cleopatra",
    "Sherlock Holmes",
    "Marie Curie",
    "Batman",
    "Napoleon Bonaparte",
    "Frida Kahlo",
    "Harry Potter",
    "Leonardo da Vinci",
    "Pikachu",
]

SYSTEM_PROMPT = """\
Jesteś AI prowadzącym grę w zgadywanie postaci (w stylu Akinatora).

Sekretna postać to: {secret_character}

Gracz zadaje pytania Tak/Nie, próbując odgadnąć, kim jest sekretna postać.

ZASADY:
- Odpowiadaj WYŁĄCZNIE jednym z trzech słów: "Tak", "Nie" lub "Nie wiem".
- NIE dodawaj żadnych wyjaśnień, komentarzy ani dodatkowego tekstu.
- Odpowiadaj zgodnie z prawdą na podstawie wiedzy o sekretnej postaci.
- Jeśli nie jesteś pewien odpowiedzi, odpowiedz "Nie wiem".

Dotychczasowa historia rozmowy:
{conversation_history}

Pytanie gracza: {question}
Twoja odpowiedź:\
"""

VALID_ANSWERS = {"Tak", "Nie", "Nie wiem"}


def get_dummy_answer() -> str:
    """Return a random answer from the valid set (for use without API key)."""
    return random.choice(list(VALID_ANSWERS))


def format_conversation_history(history: list[dict]) -> str:
    """Format conversation history list into a string for the prompt."""
    if not history:
        return "(brak historii)"
    lines = []
    for entry in history:
        if entry.get("question"):
            lines.append(f"Gracz: {entry['question']}")
        if entry.get("answer"):
            lines.append(f"AI: {entry['answer']}")
    return "\n".join(lines) if lines else "(brak historii)"
