Task 2 Completion Report – Basic Room Creation Endpoints

Date: 2026-04-12 Task: BE-2 from AIKINATOR-PROTOTYPE.md Status: ✅ COMPLETED 

Summary
Task 2 został zakończony pomyślnie. Backend obsługuje teraz tworzenie pokoi gier z trwałym zapisem danych. Zamiast tymczasowych słowników w pamięci, system wykorzystuje bazę danych SQLite, co gwarantuje, że pokoje nie znikną po restarcie serwera. 

What Was Created
Backend (/backend) 

Pliki zmodyfikowane/utworzone:


main.py – Rozbudowany o: 


Konfigurację Bazy Danych: Integracja SQLAlchemy z SQLite (akinator.db). 


Model Pokoju: Schemat bazy danych zawierający room_id, game_mode, status oraz created_at. 


Schematy Pydantic: RoomResponse dla ustandaryzowanych odpowiedzi API. 

Endpointy Tworzenia:


POST /games/solo 


POST /games/duel 


POST /games/battle-royale 


requirements.txt – Zaktualizowany o bibliotekę sqlalchemy. 


akinator.db – Plik bazy danych (generowany automatycznie). 

Weryfikacja:

✅ Logika tworzenia pokoi używa UUID4 dla zapewnienia unikalnych identyfikatorów. 

✅ Rekordy są poprawnie zapisywane w bazie danych. 

✅ API zwraca poprawną strukturę JSON dla wszystkich trybów. 

Acceptance Criteria – All Met ✅

Endpointy POST zwracają 200 OK ✅ 

Zwracają unikalne room_id i właściwy game_mode. 


Trwały zapis (Persistent Storage) ✅ 

Dane są utrwalane w SQLite, a nie tylko w pamięci RAM. 


Konfiguracja CORS ✅ 

Nowe endpointy są dostępne dla frontendu na http://localhost:3000. 

Poprawka błędu 500 ✅

Wyeliminowano błąd krytyczny w punkcie wejścia /.

How to Test
1. Uruchomienie Serwera
Bash
cd backend
# Upewnij się, że masz zainstalowane zależności
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
2. Weryfikacja przez Swagger UI
Otwórz w przeglądarce: http://127.0.0.1:8000/docs

Rozwiń dowolny endpoint /games/ (POST).

Kliknij "Try it out", a następnie "Execute".

Sprawdź, czy serwer zwrócił dane nowego pokoju.

Next Steps

Task 3: Backend – Dummy Room State Endpoint 

Implementacja GET /rooms/{room_id}/state. 

Pobieranie rzeczywistych danych o pokoju z bazy na podstawie ID. 

Zwracanie przykładowej (dummy) historii rozmowy zgodnie z wymaganiami prototypu. 

Notes
Wybór SQLite zamiast JSON pozwala na lepszą obsługę wielu graczy jednocześnie. 


UUID gwarantują, że identyfikatory pokoi są niemożliwe do zgadnięcia, co zwiększa bezpieczeństwo sesji.