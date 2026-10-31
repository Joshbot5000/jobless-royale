# Jobless Royale: the weekly news update

Every week (Saturday morning) the game gets a new **topical arena** inspired by what is big in the news right now
(for example a space launch → astronauts, an election → politicians, a World Cup → footballers).

## 1. Pick the topic
- Search the news from the **last 7 days**: world, tech, science, sport, entertainment and business. Use several searches.
- Choose the story that is most talked about **and** maps onto a fun set of **jobs**. The arena is about the profession, not the event.
- Skip anything that would be grim to play: wars, attacks, disasters with victims, deaths and illness. If the top story is grim, pick the next big lighter one.
- Never use real people's names or likenesses, real brands, logos, or political parties. Satirise the job, never a person or side.
- Do not repeat an arena that already exists. Check `id`, `job` and `news` in `src/data.js`, `src/data_more2.js` and every `src/data_news_*.js`.

## 2. Build the arena: `src/data_news_YYYYMMDD.js`
Copy the structure of `src/data_news_20261027.js` (Election Night):
- `THEMES.push({...})` with `added:'YYYY-MM-DD'` (today) and `news:'<3–5 word headline topic>'`. This shows a NEW badge on the arena for 7 days.
  Give the arena its own colours, river (`kind`: water, pond, lava, void, neon, gold, acid, laser, cement, ink, pool, paint, film), deco, king, archer, `towerProj`, foe names and emotes.
- **At least 15 characters with `unlock:0`** (available immediately), **including exactly one Champion** (`champ:true` plus a `tap` ability), and **4 spells** with `unlock:0`.
- **5 Trophy Road characters** at `unlock` 100 (rare), 300 (rare), 600 (epic), 1000 (epic) and 1600 (`rar:'legendary'`).
- Starter deck `cards`: exactly 6 characters (including the Champion) and 2 spells.
- Card ids must be unique across the whole game (search `src/` before choosing one).
- Every power must be the **real job pushed to an absurd, visible extreme**, with one signature mechanic per card. Use the existing vocabulary (see "Mechanics" in `DESIGN.md`, and the fields used in `src/data_more*.js`):
  charge, leap, dash, plow, stealth, spawn/spawner, death spawn/blast/cloud/elixir/random, splash, pierce, bounce, cone, ramp, stun, sleep, fear, frozen/stone, shrink, slow, burn, poison, mark, hack, repo, yank, push, lifesteal, convert, charm, taunt, regen, shield0, swim, deployAnywhere, auras (heal/rush/poison), pulses (stun, pull, shieldAllies, rally, charm, cloud, fear), zap (banish, box, invis, fear), everyN, reviveSelf, reviveAllies, growOnKill, growUp, trail, strip.
  Champion taps: execute, takeover, saturn, override, rampage, clear, raw/spin/smash, charm, cannon, aoe, clone, leap, firebreak, taunt, decoy, spawn, kick, zapN.
  Spell kinds: damage, stun, freeze, drain, heal, healCloud, rush, mega, invis, cloud, slow, barrage, roll, float, pull, decoy, revive, summon, convert, cancel.
  Only add a new mechanic if the job really needs one, and implement it in `src/sim.js`.
- Balance against similar existing cards (similar cost → similar HP and damage).
- Models: build characters from `HU({...})` (humans: skin, hair, hat, outfit, face, prop, back, cape, w, h, sc), `DOG({...})` (animals), `FLY({type})`, `BLOB({type})`, `PEN({})`, vehicles `{k:'v',type}` and buildings `{k:'b',type}`. Add any new props, hats, outfits, vehicles, buildings or flyers in `src/models_more.js`, and any new deco or spell drop (`fall`) in `src/models_world.js`.

## 3. Test
```
python3 build.py
node tools/test.js <new-arena-id>
```
It must print `ALL TESTS PASSED`. Fix every failure. Also render the new cards' portraits and look at them, and fix anything that looks broken.

## 4. Ship
- Add one line to the "News arenas" log at the bottom of `DESIGN.md`.
- Commit and push to `main`. GitHub Pages redeploys the home-screen app (`index.html` at the repo root) automatically.
- Publish `dist/artifact.html` to the claude.ai artifact https://claude.ai/artifact/TWHFWxCfjxryE9KvmBZJH8. Use the Artifact tool with that `url` and read it first if asked.
