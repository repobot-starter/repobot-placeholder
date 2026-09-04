# Pack: quiz

Client-only vertical pack: a multiple-choice quiz app (QuizBot) at `web/app/src/View/Quiz/`.

## What ships

- A trivia app: a quiz shelf with best-score badges, a question flow with instant right/wrong feedback and explanations, and a results screen with a verdict line and every miss listed with its correct answer (owns `/` when this pack is active; otherwise preview at `/quiz`)
- **Every quiz lives in `content.ts`** — quiz titles, emoji, descriptions, and questions (prompt / choices / answerIndex / optional explanation) in one typed file
- The scoring lives in `engine.ts`: pure functions for grading, summarizing, verdict tiers, and best-score comparison, mirrored in `QuizEngine.swift` / `QuizEngine.kt` with the same tests, so a score means the same thing on every platform
- Best scores persist on device — localStorage on web, UserDefaults on iOS, SharedPreferences on Android — keyed by quiz id
- Native ports as the home surface of the iOS app (`ios/App/View/Quiz/`) and the Android app (`android/.../view/quiz/`)

Set [`../active.json`](../active.json) to `{ "key": "quiz" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the quizzes: edit `quizzes` in `web/app/src/View/Quiz/content.ts` (and the mirrored data in `QuizContent.swift` / `QuizContent.kt` if the native apps ship). Quiz ids must be unique — they key saved best scores. Each question needs two or more choices with `answerIndex` pointing at the right one.
- Explanations are optional but do the teaching: they show after each answer and again next to misses on the results screen.
- Content tests on all three platforms verify quiz ids are unique, every answerIndex is in range, and choices don't repeat within a question.
- **Leaderboards / shared results / accounts:** that's a backend — follow `docs/adding-a-domain.md` for a `scores` domain, then flip `clientOnly` in `catalog.json`.

## Non-goals for this pack

- Accounts, leaderboards, or cross-device sync (needs a backend domain)
- Timers, lifelines, or scoring streaks — the format is deliberately calm; ask the agent if you want game-show pressure
