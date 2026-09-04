# Pack: flash

Client-only vertical pack: a spaced-repetition flashcard app (FlashBot) at `web/app/src/View/Flash/`.

## What ships

- A study app: a deck list with mastery progress bars and due-count badges, a tap-to-flip study session with **Again / Got it** grading, and a session summary with review stats (owns `/` when this pack is active; otherwise preview at `/flash`)
- **Every deck lives in `content.ts`** — deck titles, emoji, descriptions, and cards (front / back / optional hint) in one typed file; the scheduler and UI adapt to whatever you define
- The scheduler lives in `scheduler.ts`: a pure five-box Leitner system (doubling intervals of 1/2/4/8/16 days, "Got it" promotes, "Again" resets to box 1), mirrored in `FlashScheduler.swift` / `FlashScheduler.kt` with the same tests, so progress means the same thing on every platform
- Progress persists on device — localStorage on web, UserDefaults on iOS, SharedPreferences on Android — keyed by deck id + card front, so editing other cards never wipes progress
- Native ports as the home surface of the iOS app (`ios/App/View/Flash/`) and the Android app (`android/.../view/flash/`)

Set [`../active.json`](../active.json) to `{ "key": "flash" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the decks: edit `decks` in `web/app/src/View/Flash/content.ts` (and the mirrored data in `FlashContent.swift` / `FlashContent.kt` if the native apps ship). Card fronts must be unique within a deck — they double as stable identifiers for saved progress.
- Tune the schedule: `BOX_INTERVALS` in the scheduler controls how many days each box waits. Keep the three platform copies identical.
- Content tests on all three platforms verify deck ids and card fronts are unique and nothing ships blank.
- **Shared decks / classroom accounts / sync:** that's a backend — follow `docs/adding-a-domain.md` for a `decks` domain, then flip `clientOnly` in `catalog.json`.

## Non-goals for this pack

- Accounts, cross-device sync, or shared decks (needs a backend domain)
- Full SM-2 / Anki-grade scheduling — the five-box system is deliberately simple enough to explain in a sentence
