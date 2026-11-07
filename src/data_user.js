// =====================================================================
//  OWNER'S CHANGES — loaded last (after data_tune.js), so these values are final.
//  November 2026 feedback pass: specific cards, Clash Royale-style spell costing, arena tower troops,
//  Bio Lab and General Hospital revamps, Election Night toned down.
// =====================================================================
(function(){
const B=(k,o)=>{ const c=CARDS[k]; if(!c) return; for(const f in o){ if(o[f]===null) delete c[f]; else c[f]=o[f]; } };
const S=(k,o)=>{ const c=CARDS[k]; if(c&&c.sp) c.sp={...c.sp,...o}; };
const mul=(k,h,d)=>{ const c=CARDS[k]; if(!c||c.type==='spell') return; if(c.hp) c.hp=Math.round(c.hp*h); if(c.dmg) c.dmg=Math.round(c.dmg*d); };

// ---------------------------------------------------------------- Supreme Court
B('tradingdesk',{hp:2200,desc:'Prints money: makes 1 elixir every 5.5s for 45s (+8 in total). Built like a bank vault, so it takes a lot of smashing.'});
B('witnessstand',{range:7,hp:750,desc:'The witness testifies at air and ground troops up to 7 tiles away, and everyone they point at takes 30% more damage for 3s. A Paralegal runs out every 6.5s, and three more storm out when it is destroyed.'});
B('bailiff',{cost:4,hp:4300,dmg:180,desc:'Marches straight at the nearest building with enormous health, physically escorting every enemy troop out of its way.'});
B('orderincourt',{cost:2}); B('summons',{cost:2});

// ---------------------------------------------------------------- Wall Street
B('whale',{targets:'ground',hp:2700,dmg:560,hs:1.8,speed:0.7,desc:'A gigantic flying whale that floats over the river and crushes whatever is beneath it, troops or buildings, with one enormous slam at a time. Splashes down when defeated.'});
B('loanshark',{onHit:{lifesteal:0.75},desc:'A flying shark in a suit. Bites air and ground and heals 75% of the damage it deals.'});

// ---------------------------------------------------------------- FBI
B('van',{cost:7,hp:6000,dmg:260,hs:1.1,speed:0.8,desc:'An armoured van with 6000 health that rams buildings again and again. Two SWAT agents jump out when it is finally stopped.'});
B('director',{cost:5,range:6,hp:1050});
B('sniper',{cost:5,hp:220,range:7,desc:'One huge shot every 3s at air and ground from 7 tiles away, just inside tower range. Very fragile.'});
B('hacker',{targets:'ground'});
B('k9',{hp:525});

// ---------------------------------------------------------------- Hell's Kitchen
B('butcher',{hs:1.3,dmg:300,desc:'Chops fast and hard with a heavy cleaver, one target at a time. Heals 400 every time it finishes a troop off.'});
B('meatball',{death:{rage:[3,7],rageCallout:'SAUCE! 🍝'},desc:'A giant meatball that rolls at buildings, shoving troops aside. When it bursts it leaves a pool of sauce: friendly troops in it move and attack 40% faster for 7s.'});
B('foodtruck',{hp:2700});
if(CARDS.headchef) CARDS.headchef.tap={...CARDS.headchef.tap,r:4.2,dmg:260,stun:2,push:2.8,cd:12};
B('headchef',{desc:'Whacks with a frying pan. TAP – IT’S RAW! (1 elixir): an earth-shaking scream that deals 260 damage to every enemy within 4 tiles, hurls them backward and leaves them stunned for 2s.'});
if(CARDS.nonna&&CARDS.nonna.tap) CARDS.nonna.tap={...CARDS.nonna.tap,cost:1};
B('pizza',{hs:2.6,dmg:150});

// ---------------------------------------------------------------- Moon Base
if(CARDS.spacedog&&CARDS.spacedog.sp) CARDS.spacedog.sp={...CARDS.spacedog.sp,stun:0};
B('spacedog',{hp:520,desc:'A very good boy in a tiny helmet. Leaps on enemies from up to 4.5 tiles away.'});

// ---------------------------------------------------------------- Influencer House
B('cancelled',{cost:2}); B('glitter',{hp:950}); B('podcast',{hp:850}); B('mysterybox',{hp:850});

// ---------------------------------------------------------------- Construction Site
B('dozer',{cost:5,hp:3200,death:{spawn:['scaffolders',2]},desc:'Ploughs straight at buildings, shoving every troop out of its way. Two Scaffolders hop out of the cab when it is wrecked.'});
B('steamroller',{atk:{k:'melee',splash:1.1},desc:'Slow but crushing. Every roll flattens everything in a wide strip and stuns it for 0.6s.'});

// ---------------------------------------------------------------- Sports
if(CARDS.striker) CARDS.striker.cost+=1;
B('linebacker',{hp:1500,plowCharge:true});
B('sumo',{cost:7,hp:3800,dmg:200,repel:3,desc:'Anything that hits it up close bounces off: attackers are knocked back 3 tiles and dazed. Ploughs through troops with a huge belly.'});

// ---------------------------------------------------------------- Pub
B('poolshark',{range:3,dmg:303,desc:'Pots everything at close range: heavy pool balls that bounce on to three more targets. Hits air and ground.'});

// ---------------------------------------------------------------- Fire Station / Zoo: splash where the idea is an area
B('firechief',{atk:{k:'melee',splash:0.9}});
B('rhino',{plowCharge:true});

// ---------------------------------------------------------------- Election Night: toned down overall, Motorcade made worth playing
for(const k of (THEMES.find(t=>t.id==='politics')||{pool:[]}).pool) if(k!=='motorcade') mul(k,0.88,0.88);
B('motorcade',{hp:2300,dmg:210,desc:'An armoured limo with outriders. Takes 40% less damage from splash and spells, and after a short run-up rams buildings for double damage, shoving troops out of the road.'});
B('scandal',{});  // fear doubled below with the spell pass
B('bodyguard',{taunt:null,desc:'Huge single takedowns: whatever he grabs gets put on the floor.'});

// ---------------------------------------------------------------- Bio Lab revamp: Mutant toned down, every other card stronger and more distinct
B('mutant',{hp:1500,dmg:170,sp:{k:'growOnKill',max:2,f:0.18,callout:'MUTATE!'}});
if(CARDS.mutant&&CARDS.mutant.tap) CARDS.mutant.tap={...CARDS.mutant.tap,cd:20,cost:2};
B('mutant',{desc:'A lab assistant who drank the wrong flask. Grows bigger with each of its first two kills. TAP – Rampage (2 elixir): goes berserk for 6s.'});
for(const k of (THEMES.find(t=>t.id==='bio')||{pool:[]}).pool) if(k!=='mutant') mul(k,1.15,1.12);
B('zombie',{infectAura:{r:3.2},desc:'Shambles at buildings. Any enemy troop that dies within 3.2 tiles rises again as a zombie on your side, and it bursts into a toxic cloud when defeated.'});
B('rats',{onHit:{poison:[15,2]},dodge:0.25,desc:'Six escaped lab rats at top speed. They dodge 25% of everything shot at them, and every bite carries something nasty.'});
B('labmonkey',{sp:{k:'leap',cd:4,min:2,max:5,r:1.1,dmg:90,stun:0,callout:'OOK OOK!'},desc:'Broke out with a mystery serum. Leaps onto enemies from up to 5 tiles away, and every punch leaves a puff of toxic gas.'});
B('virologist',{onHit:{cloud:[1.6,60,3],gadget:true},desc:'Lobs flasks that burst in a splash and a toxic cloud, and every strain mutates: each hit also freezes, slimes or explodes at random.'});
B('plague',{aura:{r:3.5,heal:60,poison:35},desc:'Treats the troops around it: friendly troops nearby heal 60 a second, while enemy troops nearby get sicker by 35 a second.'});

// ---------------------------------------------------------------- General Hospital revamp: every card a different kind of medicine
B('dentist',{sp:{k:'pulse',cd:5,r:2.8,stun:1.2,dance:true,callout:'LAUGHING GAS!'},desc:'Every 5s releases laughing gas: every enemy within 2.8 tiles giggles helplessly (stunned) for 1.2s. Drills one target at a time in between.'});
B('psychiatrist',{sp:{k:'pulse',cd:7,r:3,charm:2.5,callout:'LET’S TALK ABOUT IT.'},desc:'Every 7s holds a group session: every enemy within 3 tiles is talked round and fights for you for 2.5s.'});
B('pharmacist',{onHit:{gadget:true},desc:'Lobs pill bottles that heal friendly troops in the splash and hurt enemies. Every enemy hit gets a random side effect: frozen, slimed or a small explosion.'});
B('janitor',{atk:{k:'melee',splash:1.0},onHit:{puddle:[1.2,5,1.1]},sp:null,desc:'Swings a wide wet mop that hits everything in front of him and leaves slippery puddles: enemies that walk through them skid and fall over.'});
B('hypochondriac',{taunt:3,desc:'Insists it is dying and demands everyone’s attention: enemy troops within 3 tiles have to deal with it first, while it heals 45 a second.'});
B('surgeon',{sp:{k:'dash',cd:5,mult:1.5,callout:'INCISION!'},desc:'The fastest hands in the game. Every 5s lunges through a line of enemies with the scalpel, and every 4th cut is a STAT! critical.'});
B('ambulance',{death:{spawn:['medinterns',2]}});
B('nurse',{desc:'Heals every friendly troop nearby by 90 a second and throws pills at air and ground.'});

// ---------------------------------------------------------------- tower troops: every arena's tower shots do something on-theme
const TFX={ law:[{mark:[2,1.15]},'Tower clerks throw writs: hit troops take 15% more damage.'], finance:[{slow:[0.8,0.8]},'Tower brokers throw coins that weigh troops down.'],
  space:[{splash:0.8},'Tower lasers splash nearby troops.'], fbi:[{stun:0.12},'Tower agents fire stun rounds.'], bio:[{poison:[15,2]},'Tower darts poison troops.'],
  hospital:[{slow:[1,0.7]},'Tower pills are sedatives: hit troops slow down.'], kitchen:[{splash:0.8},'Tower eggs splat on nearby troops.'], fire:[{push:0.4},'Tower water balls push troops back.'],
  build:[{splash:0.9},'Tower bricks splash nearby troops.'], rock:[{push:0.5},'Tower bass shots knock troops back.'], dog:[{slow:[0.8,0.75]},'Tower treats distract troops (slow).'],
  sports:[{push:0.3},'Tower balls knock troops back.'], art:[{mark:[2,1.15]},'Tower paint marks troops: 15% more damage.'], film:[{stun:0.12},'Tower directors yell CUT! (micro-stun).'],
  influencer:[{mark:[2,1.15]},'Tower likes mark troops: 15% more damage.'], zoo:[{slow:[1,0.7]},'Tower bananas trip troops up (slow).'], palace:[{drunk:1},'Tower leaflets confuse troops.'],
  pub:[{drunk:1},'Tower pints make troops tipsy.'], politics:[{slow:[0.8,0.8]},'Tower leaflets bog troops down.'], ballpark:[{push:0.4},'Tower fastballs knock troops back.'],
  fright:[{slow:[1,0.7]},'Tower candy is sticky: hit troops slow down.'], bonfire:[{burn:[20,2]},'Tower rockets set troops alight.'] };
for(const th of THEMES){ const f=TFX[th.id]; if(f){ th.towerFx=f[0]; th.towerTxt=f[1]; } }

// ---------------------------------------------------------------- spells costed like Clash Royale (scaled to this game's 1500-HP towers)
// 2 elixir ~ Zap/Log, 3 ~ Arrows, 4 ~ Fireball, 6 ~ Rocket. Stuns/freezes get shorter the cheaper they are.
const BIG=['ipo','asteroid','dronestrike','explosion','backdraft'];          // these become 6-elixir Rocket-tier spells
for(const k of BIG) if(CARDS[k]){ CARDS[k].cost=6; CARDS[k].sp={...CARDS[k].sp,r:2.2,towerDmg:null}; }
const DMG={2:200,3:340,4:520,5:800,6:1150}, STUN={2:[1.0,90],3:[1.8,110],4:[2.6,140]}, FRZ={3:[2.0,90],4:[3.2,100]}, BAR={3:640,4:920,5:1150,6:1400},
      ROLL={2:220,3:300}, CLOUD={3:330,4:480,5:650}, PULL={2:[1.4,50],3:[2.0,60],4:[2.6,80]}, RUSH={2:5,3:7}, CANCEL={2:120,3:150};
const fix=(c,a,b)=>{ if(c.desc) c.desc=c.desc.replace(a,b); };
for(const k in CARDS){ const c=CARDS[k]; if(c.type!=='spell'||!c.sp) continue; const s={...c.sp}, n=c.cost;
  if(s.k==='damage'&&DMG[n]){ const rf=Math.min(1.3,Math.max(0.8,Math.sqrt(2.5/(s.r||2.5)))); const d=Math.round(DMG[n]*rf/10)*10; fix(c,new RegExp('\\b'+s.dmg+'\\b','g'),String(d)); s.dmg=d; s.towerPct=n>=5?0.3:0.35; delete s.towerDmg;
    if(s.stun) s.stun=Math.min(s.stun,n<=2?0.5:1); }
  else if(s.k==='stun'&&STUN[n]){ const [t,d]=STUN[n]; fix(c,new RegExp('\\b'+s.t+'s','g'),t+'s'); fix(c,new RegExp('\\b'+s.dmg+'\\b','g'),String(d)); s.t=t; s.dmg=d; s.r=Math.min(s.r||3,3); }
  else if(s.k==='freeze'&&FRZ[n]){ const [t,d]=FRZ[n]; fix(c,new RegExp('\\b'+s.t+'s','g'),t+'s'); s.t=t; s.dmg=d; }
  else if(s.k==='barrage'&&BAR[n]&&s.n){ const d=Math.round(BAR[n]/s.n/5)*5; fix(c,new RegExp('\\b'+s.dmg+'\\b','g'),String(d)); s.dmg=d; }
  else if(s.k==='roll'&&ROLL[n]){ fix(c,new RegExp('\\b'+s.dmg+'\\b','g'),String(ROLL[n])); s.dmg=ROLL[n]; }
  else if(s.k==='cloud'&&CLOUD[n]&&s.t){ const d=Math.round(CLOUD[n]/s.t/5)*5; if(s.dps) fix(c,new RegExp('\\b'+s.dps+'\\b','g'),String(d)); s.dps=d; }
  else if(s.k==='pull'&&PULL[n]){ const [t,d]=PULL[n]; fix(c,new RegExp('\\b'+s.t+'s','g'),t+'s'); s.t=t; s.dps=d; }
  else if(s.k==='rush'&&RUSH[n]){ fix(c,new RegExp('\\b'+s.t+'s','g'),RUSH[n]+'s'); s.t=RUSH[n]; }
  else if(s.k==='cancel'&&CANCEL[n]){ fix(c,new RegExp('\\b'+s.dmg+'\\b','g'),String(CANCEL[n])); s.dmg=CANCEL[n]; }
  c.sp=s; }
if(CARDS.scandal){ const s=CARDS.scandal.sp; s.fear=(s.fear||2)*2; CARDS.scandal.desc=(CARDS.scandal.desc||'').replace(/(\d+(\.\d+)?)s/,s.fear.toFixed(1).replace('.0','')+'s'); }
B('ipo',{desc:'The IPO goes to the moon, then straight back down: a rocket crashes into a small area for '+CARDS.ipo.sp.dmg+' damage.'});
B('asteroid',{desc:'Calls down a real asteroid: '+CARDS.asteroid.sp.dmg+' damage in a small area. The biggest hit in orbit.'});
B('dronestrike',{desc:'A precision strike from far above: '+CARDS.dronestrike.sp.dmg+' damage in a small area.'});
B('explosion',{desc:'The biggest practical effect in film history: '+CARDS.explosion.sp.dmg+' damage in a small area, and a fireball you can feel from the back row.'});
B('backdraft',{desc:'Opens a door on a room full of fire: a '+CARDS.backdraft.sp.dmg+'-damage blast in a small area.'});
if(CARDS.defib) CARDS.defib.desc=CARDS.defib.desc.replace('for 1s','for 0.5s');
B('orderincourt',{desc:'A colossal gavel slams down: 90 damage, and every enemy troop and tower in the area is stunned for 1s.'});
B('summons',{desc:'A legal summons drags every enemy in the area into the middle for 1.4s, dealing damage while they are held.'});
})();
