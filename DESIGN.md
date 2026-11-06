# Jobless Royale: design notes

## Card design rules
1. **One signature mechanic per card, always visible.** Every power produces something you can see on the battlefield: a shove, a stun, a team-colour change, a leap, a spawn, a pull, a revive. Invisible stat tweaks were cut (percentage audits, damage marks, stacking weaken, blind, random damage, elixir trickle).
2. **The mechanic is the real job, pushed to an absurd extreme.** A bailiff escorts people out, so it shoves troops aside. A solicitor signs clients, so it converts enemies. A sniper has the longest range. A paramedic revives. A hacker shuts systems down.
3. **Every deck has the same skeleton.** Win condition (attacks towers), Champion, swarm, ranged or anti-air, a control or splash card, and spells. That gives each arena real counter-play: swarms beat single-target troops, splash beats swarms, and air units beat ground-only decks.
4. **A shared vocabulary across jobs.** Charge, leap, spawner, death spawn, splash, chain, pierce, roll, stun, pull, shield, heal aura, rage aura, conversion and invisibility recur in every theme, so players learn the rules once and then enjoy the job-specific twist.
5. **Champions give the player an active decision.** One per arena. Once on the field, a golden ability button appears. It costs 1–2 elixir and recharges, and the AI uses it too.

| Arena | Champion | Tap ability |
|---|---|---|
| Supreme Court | The Hanging Judge | Death Sentence: executes the strongest enemy troop in range |
| Wall Street | Hedge Fund Manager | Hostile Takeover: the strongest enemy fights for you for 7s |
| Moon Base | Rocket Scientist | Saturn V: a giant rocket lands on the nearest enemy tower |
| FBI HQ | Hacker | System Override: all enemy towers and buildings go offline |
| Bio Lab 9 | Mutant Assistant | Rampage: instantly giant, heals, attacks faster |
| General Hospital | Paramedic | CLEAR!: stun pulse and revives your last two fallen troops |
| Hell's Kitchen | Head Chef Furioso | IT'S RAW!: blasts and stuns everything nearby |
| Fire Station 51 | Fire Chief | Water Cannon: washes enemies far back |
| Construction Site | Crane Operator | Wrecking Spin: 360° knockback smash |
| Rock Arena | Rockstar | Guitar Smash: 380-damage shockwave |
| Dog Park | Cavalier King Charles | Puppy Eyes: nearby enemies fight for you for 5s |
| Grand Stadium | Star Striker | Fireball Kick: a flaming football rolls down the lane like a log and slams the tower |
| Grand Gallery | The Grand Master | Masterpiece: nearby enemies are painted into a still life and turn to stone for 3s |
| Hollywood Backlot | The Director | CUT!: nearby enemies are rewound 3.5 tiles and stunned |
| Viral House | Mega Influencer | GO VIRAL!: five Followers appear instantly |
| Wild Zoo | Head Zookeeper | Tranquilizer: the 3 strongest enemies in range fall asleep for 3s |
| The Palace | The Supreme Leader | Cult of Personality: nearby enemies salute and fight for him for 4.5s |
| The Pub | Beer Belly Barry | Belly Bounce: the strongest enemy nearby is launched to the back of the arena |

Every arena also has a second Champion that unlocks at 🏆 1300 (Lord Chancellor, The CEO, Flight Director, FBI Director, Subject Zero, Chief of Medicine, Nonna, Hotshot Captain, Site Foreman, Pop Diva, Golden Retriever, Head Coach, Pop Artist, Movie Star, Podcast Bro, Big Cat Trainer).

## Counters and balance
The game is built around a counter web, like Clash Royale. Every arena contains:
- tanks and tower-chasers
- swarms, which beat heavy single-target hitters
- splash, which beats swarms
- flyers, which beat ground-only melee; anti-air beats flyers
- ramping-damage "melters" (beams that grow up to 4-6x on one target), which beat tanks
- stuns, which **reset** melters, charges and wind-ups (`src/sim.js`: any stun or freeze resets ramp, charge and attack timer)
- heavy single-target hitters, which beat tanks and chargers
- buildings that shoot, spawn, pump or control, and pull tower-chasers
- spells sized for swarms (small) and support clumps (big)

Players are never told what counters what. Cards show plain facts (damage/s, hit speed, single target or splash, ramping, stuns, armour, dodge, thorns) and the deck builder shows the average elixir. The AI on Normal and Hard defends with cards measured to answer each threat (`src/data_counters.js`), so players learn the web by playing.

Mechanics added for variety:
- chain lightning (`onHit.chain`)
- thorns, dodge, pack bonus (`onHit.pack`), bounty (elixir per kill)
- tower repair and enemy-slow auras
- jackpot pumps
- projectile ramping
- spawners that start straight away

**Tools:**
- `tools/duel.js` plays every attacker-vs-defender pairing in each arena with the real engine, headless: the attacker walks at your tower and your defender drops in as it reaches the bridge.
- `tools/duelreport.js` reports, per card, its average elixir trade on attack and defence, its answers, and what it beats.
- `tools/tune.js` nudges HP and damage multipliers (`src/data_tune.js`, generated, 0.5-1.5x). Each card is judged within its own arena, on what it is for (attack or defence), and a real threat with fewer than 3 answers is always nerfed.
- `tools/winrates.js` plays full AI-vs-AI matches with random sensible decks. `tools/wrtune.js` gently corrects cards far from 50%.
- `tools/balance.sh` runs the duel/tune loop.
- Hand-made changes (new roles, building jobs, swarm traits, mechanical fixes) live in `src/data_balance.js`.

Results from the November 2026 pass:

| Measure | Before | After |
|---|---|---|
| Real threats with fewer than 3 answers in their arena | 94 | 7 |
| Card win-rate spread in 6,300 AI matches | 6.8% | 5.2% |
| Cards outside 35-65% win rate | 24 | 3 |

## Arenas, decks and the Trophy Road
- **16 arenas.** The original 11 professions plus Sports Stars, Artists, Actors, Influencers and a Zoo.
- **Every arena has 20–23 characters and 4 spells.** The deck is 6 characters + 2 spells with at most one Champion. Each arena remembers its own deck, and Mix & Match builds a 6 + 2 deck from every unlocked card in the game.
- **Trophy Road.** Every card from the first three rounds of design is available from the start (15–18 characters + 4 spells per arena). On top of that, each arena has 5 brand-new characters that unlock at 🏆 100 (rare), 300 (rare), 600 (epic), 1000 (epic) and 1600 (Legendary), 80 in total. A win is worth 25 + 5 per crown and a loss costs 15. The end screen announces new unlocks.
- **AI decks.** Rookie plays the starter deck. Knight builds a random deck from cards up to 300 trophies ahead of you. Champion uses the whole pool.

### The Pub (player request)
Requested by the player: Beer Belly Barry (England shirt, Champion, Belly Bounce), The Drunk (spilled pints leave beer puddles that make ground troops slip over), the Karaoke Machine (a building that makes nearby enemies sing instead of fighting), Pub Quiz (a stun spell), the Rolling Keg (the arena's Log) and Buzz Ball Attack (neon cans lobbed from the King Tower that splash colour and make enemies drunk: they stagger, slow down and miss a third of their attacks). Also: Bouncer, Pub Landlord (last orders sends enemies home), Darts Champ (180s), Pool Shark, Barflies, Kebab Van, Glass Collector, Bar Brawler, Stag Do, Hen Party, Pub Dog, Fruit Machine, Happy Hour, and unlocks The Regular, Sunday Roast Chef, Folk Fiddler, Brewery Dray and the Legendary Pub Ghost.

### The Palace (player request)
Dictators and despots, loosely based on history but only on their vanity and famous anecdotes: no real modern leaders, symbols or atrocities. The Supreme Leader (Champion, Cult of Personality), the Little Emperor (hand in coat, grows with every kill), Dictator for Life (crossed the Rubicon, so he swims the river), Consul Horse (Caligula's horse), the Fiddling Emperor (fire aura while he plays), the Sun King (heal aura), Generalissimo (awards himself medals and grows), Propaganda Minister (leaflets confuse), Secret Police, Palace Guard, Giant Golden Statue (everyone bows to it), Rubber-Stamp Parliament, Royal Food Taster, Military Parade, Parade Tank, Yes Men; spells Rigged Election, Mandatory Rally, Five-Year Plan, Birthday Fireworks; unlocks Court Jester, State TV Anchor, Palace Balcony, Golden Limousine and the Legendary Eternal Leader.

### Spells from the King Tower
Spells that are thrown or fired (pans, tomatoes, fireballs, footballs, basketballs, paint, water bombs, banana peels, lawsuits, the drone and buzz balls) are launched from the caster's King Tower: the king winds up and throws, and the spell arcs across the arena. Spells that come from the sky (asteroids, lightning, giant gavels, cages) still drop from above. Mark a spell with `launch:true` to opt in.

### Mechanics added with the expansion
Bouncing shots, red cards that send a troop back to its own king tower, swimmers that ignore the bridges, fear (runs home), shrink, stone and ice freezes, invisible-box traps, lassos and yanks, rewind, cloning, splitting slimes, mystery-box random spawns, elixir refunds on death, regeneration, lifesteal, taunting troops, cement trails, a child star that grows up mid-battle, and flaming kick-rolls.

## Play a Friend (online)
One phone creates a room (a code like `BAKO42`), the other joins with it. The room creator's phone runs the real battle as team 0; the friend's phone runs no simulation at all. It sends its card plays, Champion taps and emotes to the host, and draws a mirrored copy of the host's battle from snapshots sent about 12 times a second, so both players see their own towers at the bottom. One-shot effects (bursts, rings, callouts, sounds, feed lines, damage numbers) are recorded on the host while the simulation runs and replayed on the friend's phone. The host's arena and mode are used; each player brings their own deck. Friendly matches never change trophies. Transport is Trystero (vendored in `vendor/trystero.min.js`, bundled from npm with esbuild). Both phones join room `room-CODE` on two independent families of free public signalling servers at once: about 10 Nostr relays and 5 WebTorrent trackers. Whichever reaches the other phone first wins, and the friend's phone ignores the same host arriving over the second network (matched by session id). After the handshake the battle runs over a direct WebRTC data channel, with no server involved. The game first used the PeerJS public broker, a single server known for outages, which left friends stuck on "Connecting…". `src/net.js` holds all of it; `?net=local` swaps in a BroadcastChannel transport so two browser tabs can play each other in tests.

Joining has to survive real phones:
- **Invite links.** 📤 SEND INVITE shares `…/jobless-royale/?room=CODE`. Tapping it opens the game and joins straight away. Typing the code still works.
- **The host's phone sleeping.** The friend keeps looking for as long as they stay on the screen, and connects as soon as the host's app is back. Both screens show a live count of the online servers they reach, so a dead connection is never silent.
- **Friend drops in the lobby.** The room stays open for them to rejoin.
- **Different versions.** `build.py` stamps a `BUILD` id into the page and writes `version.txt`. On a mismatch, whichever phone is out of date reloads itself into the same room (`?room=CODE` for the friend, `?host=CODE` re-opens the room for the host). A session flag stops reload loops, and the service worker revalidates the page so a reload really fetches the new version.
- **Relays.** Trystero's STUN servers plus the PeerJS TURN relays. If the friend has no direct link after 7 seconds (typical when both phones are on mobile data and the free TURN relay is down), the game falls back to relaying every message through three public MQTT brokers at once (EMQX, HiveMQ, Mosquitto, over secure websockets). It uses a tiny built-in MQTT client and drops duplicate messages. A keepalive spots a friend who has gone; gaps caused by this phone freezing are ignored. `?mqtt=ws://…` points at a local broker for tests.
- **Inside the claude.ai page,** WebRTC is blocked, so the online screen links to the GitHub Pages app instead.
- `?nostrrelay=ws://…&torrentrelay=ws://…` points the game at local signalling servers for testing; giving only one tests that network alone.

## Game modes
Classic, Rush Hour (triple elixir), Sudden Death (first tower wins), Chaos (power orbs everywhere and a random arena event every 20s), and Mix & Match (a 6 + 2 deck from every card you have unlocked, one Champion maximum).

## Readability
- Health bars on every troop, with a crown on Champions.
- Status icons above troops: stun, freeze, stone, boxed, dancing, sleep, fear, shrink, slow, poison, charm, shield, rage, giant, tagged, taunting.
- Name tags when a troop lands.
- An event feed for big moments (executions, takeovers, power orbs, towers).
- Hold any card to read what it does.
- Team-tinted ink outlines.

## Rendering
Three.js r128. Procedural models built from smooth lathe and capsule shapes, merged per rigid part to keep draw calls down, with inverted-hull ink outlines. Real soft shadow maps, procedural stone, shingle and banner textures, and a shader-animated river per theme. The **Smooth** quality setting drops shadows and outlines, and the game switches to it automatically if a battle runs below 30 fps.

## Road to publishing
- **Art ceiling.** Everything is built from code-generated shapes, so there are no texture-painted, rigged character models. Matching Clash Royale's art means commissioned or licensed 3D models and animations, most likely in Unity or Godot. The card data and rules in `src/data.js` and `src/sim.js` port across directly.
- **App stores.** This HTML build can be wrapped with Capacitor or Cordova for iOS and Android as a first release.
- **Before launch.** Real-device performance testing, balance passes with real players, sound effects and music (the current sounds are synthesized placeholders), accounts and online multiplayer if wanted, and an IP check that no names or likenesses resemble real brands or people.

## Animation
- **Anticipation, strike, recovery.** Melee troops wind up *before* the hit lands (driven by the attack cooldown), then snap through a fast strike with a body twist, a forward lunge and an eased follow-through. Throwers draw back and hurl over the top, shooters recoil, slammers rise onto their toes and crash down.
- **Weight.** Stride length scales with speed, the hips sway and the torso counter-twists, and heavy troops kick up dust and shake the camera with each footstep. Champions land with a shockwave and a moment of slow motion.
- **Reactions.** Units recoil away from the blow with a squash, stunned troops wobble, scared ones flee with their arms up, flyers bank into turns and dive to attack, vehicles back up before ramming and lean through corners.
- **Deaths and destruction.** Defeated troops are flung away from the hit, tumble, bounce and poof. Towers explode into physical debris with slow motion and a camera punch. Big hits trigger a hit-stop, white impact flashes and floating damage numbers.

## Audio
Soft, rounded sound effects (thuds, whooshes, chimes) replace the old square-wave beeps. The built-in theme is generated live with Web Audio: a 16-bar loop of groove, an 8-bar call-and-answer hook, then a 4-bar breather with no lead, so it never nags. Each arena plays in its own key, the menu has a calmer version, and battle music speeds up for double elixir and overtime. **Sound** and **Music** toggles sit on the menu and the pause screen, and are remembered.

## News arenas
A new topical arena is added every week (see `UPDATING.md`).
- 2026-10-27 · **Election Night** (Politicians) · midterm election week: The Candidate (Stump Speech), Campaign Bus, Filibuster Senator, Spin Doctor, Lobbyist, Fact Checker, and the Legendary Incumbent.
- 2026-10-29 · **Ballpark** (Baseball Players) · World Series week: The Slugger (HOME RUN!), Groundskeeper's Mower, Umpire, The Closer, Hot Dog Vendor, Tarp Crew, T-Shirt Cannon, and the Legendary Hall of Famer.
- 2026-10-31 · **Fright Night** (Scare Actors & Ghost Hunters) · Halloween: The Head Scare Actor (JUMP SCARE!), Haunted Hayride, Vampire Actor, Jump-Scare Coffin, Fortune Teller, Bedsheet Ghosts, Rolling Pumpkin, and the Legendary Headless Horseman.
