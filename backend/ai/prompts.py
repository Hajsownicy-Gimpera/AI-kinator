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

HINT_PROMPT = """\
Jesteś AI prowadzącym grę w zgadywanie postaci (w stylu Akinatora).

Sekretna postać to: {secret_character}

Podaj jedną krótką, charakterystyczną cechę tej postaci.
Nie zdradzaj jej nazwy ani nie dodawaj wyjaśnień.
Odpowiedz po polsku, krótko i konkretnie.
"""

DUMMY_HINTS = {
    "Albert Einstein": "To był fizyk kojarzony z teorią względności.",
    "Cleopatra": "Była władczynią starożytnego Egiptu.",
    "Sherlock Holmes": "To fikcyjny detektyw z literatury.",
    "Marie Curie": "Była pionierką badań nad promieniotwórczością.",
    "Batman": "To zamaskowany bohater z Gotham.",
    "Napoleon Bonaparte": "Był francuskim wodzem i cesarzem.",
    "Frida Kahlo": "Była meksykańską malarką.",
    "Harry Potter": "To czarodziej z serii książek i filmów.",
    "Leonardo da Vinci": "To renesansowy artysta i wynalazca.",
    "Pikachu": "To żółty elektryczny stworek z popkultury.",
}


def get_dummy_answer() -> str:
    """Return a random answer from the valid set (for use without API key)."""
    return random.choice(list(VALID_ANSWERS))


def get_dummy_hint(character_name: str) -> str:
    """Return a deterministic hint for the configured character when no API key is available."""
    return DUMMY_HINTS.get(character_name, "To postać z wyraźną, rozpoznawalną cechą.")


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
