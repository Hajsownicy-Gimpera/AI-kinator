# GitHub Actions CI/CD Workflow

## 📋 Opis

Workflow `ci.yml` automatycznie uruchamia się przy każdym **push** do `main` lub `develop` oraz przy każdym **pull request**. Wykonuje następujące zadania:

### 🔄 Trigger Events

- **Push** do gałęzi `main` lub `develop`
- **Pull Request** do `main` lub `develop`

---

## 🛠️ Co robi workflow?

### 1️⃣ Backend Job (`backend`)

Testuje kod Pythona w folderze `/backend`:

- ✅ **Setup Python 3.9** na Ubuntu
- ✅ **Install uv** (package manager)
- ✅ **uv sync** – synchronizacja zależności
- ✅ **flake8** – linting (Syntax errors check)
- ✅ **mypy** – type checking (opcjonalny warning)
- ✅ **pytest** – uruchomienie testów z `backend/tests/`

**Status:** Jeśli jest błąd syntax – job fails (❌)

---

### 2️⃣ Frontend Job (`frontend`)

Testuje kod JavaScriptu w folderze `/frontend`:

- ✅ **Setup Node.js 18** na Ubuntu
- ✅ **npm ci** – czysty install zależności
- ✅ **npm run lint** – ESLint (opcjonalny warning)
- ✅ **npm run build** – build aplikacji React
- ✅ **npm test** – uruchomienie testów

**Status:** Wszystko non-blocking (continue-on-error: true)

---

### 3️⃣ Integration Job

Końcowa weryfikacja:

- Sprawdza czy backend i frontend passou
- Jeśli jakikolwiek job failed → całość fails (❌)
- Jeśli wszystko ok → ✅ All checks passed!

---

## 📊 Wynik

### Success ✅

Wszystko przechodzi → **Green checkmark** na PR / commit

### Failure ❌

Cokolwiek się nie powiedzie → **Red X** na PR / commit

---

## 🚀 Jak korzystać?

### Dla deweloperów:

1. **Push do main/develop** automatycznie uruchomi workflow
2. **Otwórz PR** → workflow uruchomi się na branch'u
3. **Czekaj na status** – pokaże się na PR/commit

### View Logs:

- GitHub → **Actions** tab → workflow run
- Kliknij job (Backend/Frontend) → view logs
- Szukaj błędów w output'cie

---

## 📝 Aktualizacja Workflow

Aby zmienić workflow, edytuj `.github/workflows/ci.yml` i push'uj zmiany.

**Common updates:**

```yaml
# Zmień Python version:
python-version: "3.10"  # zamiast 3.9

# Zmień Node version:
node-version: "20"  # zamiast 18

# Dodaj nowy branch trigger:
branches: [main, develop, staging]

# Wyłącz continue-on-error (fail na warning):
continue-on-error: false
```

---

## 🔒 Security

- Workflow NIE loguje `OPENAI_API_KEY` ani żadne secrets
- `.env` files NIE commituje się do repo
- Secrets mogą być dodane w GitHub Settings → Secrets

---

## 📌 Status Badge (opcjonalnie)

Dodaj do `README.md`:

```markdown
[![CI Tests](https://github.com/Hajsownicy-Gimpera/AI-kinator/actions/workflows/ci.yml/badge.svg)](https://github.com/Hajsownicy-Gimpera/AI-kinator/actions/workflows/ci.yml)
```

---

## Troubleshooting

| Problem | Rozwiązanie |
|---------|-----------|
| Backend job fails (syntax error) | Sprawdź linting: `flake8 backend/` |
| Frontend build fails | Sprawdź `npm run build` lokalnie |
| uv sync fails | Sprawdź `backend/pyproject.toml` (jeśli exists) |
| Tests timeout | Zwiększ timeout w workflow lub sprawdź testy |

---

**Last Updated:** 2026-04-19  
**Status:** ✅ Active and monitoring all pushes to main/develop
