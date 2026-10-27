// Headless test for Jobless Royale. Run after `python3 build.py`:
//   node tools/test.js            -> every model builds, every card/spell/Champion runs, data checks, 1 match per arena
//   node tools/test.js politics   -> same, plus 3 full AI-vs-AI matches in the named arena(s) (comma-separated ids)
// Exits non-zero on any failure. Needs Playwright (Chromium is pre-installed in Claude cloud sessions).
const { chromium } = require('playwright'); const path=require('path');
const FILE='file://'+path.resolve(__dirname,'..','dist','jobless-royale-offline.html');
(async()=>{
  const focus=(process.argv[2]||'').split(',').filter(Boolean);
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const p=await b.newPage({viewport:{width:200,height:400}}); p.setDefaultTimeout(3600000);
  const errs=[]; p.on('pageerror',e=>errs.push(String(e.stack||e).slice(0,300)));
  await p.goto(FILE); await p.waitForTimeout(2000);
  const res=await p.evaluate((focus)=>{
    const out=[], warn=[];
    // data rules
    for(const th of THEMES){ const chars=th.pool.filter(k=>CARDS[k].type!=='spell'), open=chars.filter(k=>!CARDS[k].unlock);
      if(open.length<15) out.push(`${th.id}: only ${open.length} characters unlocked from the start (need 15+)`);
      if(th.pool.filter(k=>CARDS[k].type==='spell').length<4) out.push(`${th.id}: fewer than 4 spells`);
      const st=th.cards; if(st.filter(k=>CARDS[k].type!=='spell').length!==6||st.filter(k=>CARDS[k].type==='spell').length!==2) out.push(`${th.id}: starter deck must be 6 characters + 2 spells`);
      for(const k of th.pool) if(!CARDS[k]) out.push(`${th.id}: missing card ${k}`); }
    for(const k in CARDS){ const c=CARDS[k]; for(const r of [c.death&&c.death.spawn&&c.death.spawn[0],c.spawner&&c.spawner.card,c.sp&&c.sp.card,c.tap&&c.tap.card]) if(r&&!CARDS[r]) out.push(`${k}: references missing card ${r}`);
      if(c.atk&&c.atk.proj&&!PROJ[c.atk.proj]) out.push(`${k}: missing projectile ${c.atk.proj}`); if(!c.desc&&!c.hidden) out.push(`${k}: no description`); }
    // models
    for(const k in CARDS){ const c=CARDS[k]; if(c.type==='spell') continue; try{ for(const t of [0,1]) getModel(c.model,t); }catch(e){ out.push(`model ${k}: ${e.message}`); } }
    for(const th of THEMES){ try{ buildArena(th); buildTower(th,'king',0); buildTower(th,'princess',1); }catch(e){ out.push(`arena ${th.id}: ${e.message}`); } }
    // every card on its own
    const run=n=>{ for(let i=0;i<n;i++){ update(0.05); if(i%3===0){ syncUnits(0.15); syncWorld(0.15); } const bad=G.units.find(u=>!isFinite(u.x)||!isFinite(u.y)||!isFinite(u.hp)); if(bad) throw new Error('NaN '+bad.card); } };
    for(const th of THEMES) for(const k of th.pool){ const c=CARDS[k];
      try{ newGame(THEMES.indexOf(th),1,'classic',th.cards,th.cards); G.aiTimer=1e9; G.elixir=[10,10];
        ['jury','bull','eagle','sumo','mosquitoes','rover'].forEach((f,i)=>spawnUnit(f,1,4+i*2,19.5,0));
        G.hands[0][0]=k; playCard(0,0,c.type==='spell'?7:8,c.type==='spell'?19.5:22); run(30);
        if(c.champ){ const ch=champOf(0); if(ch){ ch.hp=ch.maxHp=99999; spawnUnit('jury',0,ch.x+0.8,ch.y,0); G.units.filter(u=>u.team===1).forEach(u=>{u.x=ch.x+1.5;u.y=ch.y-1.5;}); } G.tapCd[0]=0; G.elixir[0]=10; const r=useTap(0); if(r!=='ok') warn.push(`tap ${k}: ${r}`); }
        run(80); }catch(e){ out.push(`card ${k}: ${e.message} ${(e.stack||'').split('\n')[1]||''}`); } }
    // matches
    const matches=[];
    for(const th of THEMES){ const reps=focus.includes(th.id)?3:1;
      for(let r=0;r<reps;r++){ try{ newGame(THEMES.indexOf(th),2,['classic','rush','chaos'][r],randomDeck(th.pool),randomDeck(th.pool)); G.diff=DIFF[2]; let s=0;
          while(!G.over&&s<4000){ G.ai0Timer=(G.ai0Timer||1)-0.05; if(G.ai0Timer<=0){ G.ai0Timer=0.6; aiAct(0); } update(0.05); if(s%2===0){ syncUnits(0.1); syncWorld(0.1); } s++; }
          matches.push(`${th.id} ${G.crowns.join('-')} ${Math.round(G.t)}s`); }catch(e){ out.push(`match ${th.id}: ${e.message}`); } } }
    G=null; return {out,warn,matches,arenas:THEMES.length,cards:Object.keys(CARDS).length};
  },focus);
  console.log(`${res.arenas} arenas, ${res.cards} cards`); console.log('matches:',res.matches.join(' | '));
  if(res.warn.length) console.log('warnings:\n  '+res.warn.join('\n  '));
  const fails=res.out.concat(errs.map(e=>'page error: '+e));
  if(fails.length){ console.log('FAIL\n  '+fails.join('\n  ')); process.exitCode=1; } else console.log('ALL TESTS PASSED');
  await b.close();
})();
