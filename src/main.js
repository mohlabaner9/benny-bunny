import "./style.css";

const GAMES = [
  ["🌼","Flower Match","Match the same flowers.", "match"],
  ["🥕","Carrot Catch","Catch the falling carrots.", "catch"],
  ["🦋","Butterfly Count","Count the butterflies.", "count"],
  ["🍓","Berry Sort","Sort berries by color.", "sort"],
  ["🌧️","Rainy Garden","Tap the raindrops.", "rain"],
  ["🐝","Busy Bees","Help bees find flowers.", "bees"],
  ["⭐","Star Hunt","Find the hidden stars.", "stars"],
  ["🎈","Balloon Pop","Pop the balloons.", "balloons"],
  ["🍎","Apple Dash","Collect the apples.", "apples"],
  ["🧩","Bunny Puzzle","Complete the picture.", "puzzle"]
];

const OUTFITS = [
  ["🌱","Garden Bunny",0],
  ["🎩","Top Hat Benny",3],
  ["🕶️","Cool Benny",6],
  ["🦸","Super Benny",10],
  ["👑","Royal Benny",15]
];

const defaultState = {
  selectedCharacter:"Benny",
  stars:0,
  completed:[],
  badges:[],
  outfit:0,
  sound:true
};

let state = load();
let currentGame = null;
let audioCtx = null;

function load(){
  try { return {...defaultState,...JSON.parse(localStorage.getItem("benny-bunny-save")||"{}")}; }
  catch { return {...defaultState}; }
}
function save(){ localStorage.setItem("benny-bunny-save", JSON.stringify(state)); }
function playTone(freq=520,duration=.09){
  if(!state.sound) return;
  try{
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.frequency.value=freq; o.type="sine"; g.gain.value=.045;
    o.connect(g); g.connect(audioCtx.destination); o.start();
    g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);
    o.stop(audioCtx.currentTime+duration);
  }catch{}
}
function completeGame(id, bonus=3){
  if(!state.completed.includes(id)){
    state.completed.push(id);
    state.stars += bonus;
    if(state.completed.length===3) state.badges.push("🌟 First Steps");
    if(state.completed.length===5) state.badges.push("🏅 Garden Explorer");
    if(state.completed.length===10) state.badges.push("🏆 Bunny Champion");
  } else state.stars += 1;
  while(state.outfit+1<OUTFITS.length && state.stars>=OUTFITS[state.outfit+1][2]) state.outfit++;
  save(); playTone(880,.16); render();
}
function app(){
  document.querySelector("#app").innerHTML = `
    <header><div class="brand">🐰 <span>Benny Bunny</span></div>
      <div class="hud"><span>⭐ <b id="stars">${state.stars}</b></span><button id="sound" class="icon">${state.sound?"🔊":"🔇"}</button></div>
    </header>
    <main id="screen"></main>
    <footer>🌷 Play • Learn • Explore • Grow 🌷</footer>`;
  document.querySelector("#sound").onclick=()=>{state.sound=!state.sound;save();render();};
}
function render(){ app(); showMap(); }
function showMap(){
  const s=document.querySelector("#screen");
  const progress=Math.round(state.completed.length/10*100);
  s.innerHTML=`
    <section class="hero">
      <div class="bunny">${OUTFITS[state.outfit][0]}</div>
      <div><h1>Welcome to Benny's Garden!</h1><p>Choose a game and earn stars to unlock Benny's outfits.</p>
      <div class="bar"><i style="width:${progress}%"></i></div><small>${state.completed.length}/10 games completed</small></div>
    </section>
    <div class="tabs"><button class="active">🌳 Garden Map</button><button id="wardrobe">👕 Wardrobe</button><button id="badges">🏅 Badges</button></div>
    <section class="map">${GAMES.map((g,i)=>{
      const unlocked=i===0 || state.completed.length>=i;
      const done=state.completed.includes(g[3]);
      return `<button class="game ${unlocked?"":"locked"}" data-i="${i}" ${unlocked?"":"disabled"}>
        <span class="num">${done?"✓":i+1}</span><span class="emoji">${g[0]}</span><b>${g[1]}</b><small>${done?"Completed":"Play now"}</small>
      </button>`;
    }).join("")}</section>`;
  s.querySelectorAll(".game").forEach(b=>b.onclick=()=>startGame(GAMES[+b.dataset.i]));
  s.querySelector("#wardrobe").onclick=showWardrobe;
  s.querySelector("#badges").onclick=showBadges;
}
function showWardrobe(){
  const s=document.querySelector("#screen");
  s.innerHTML=`<div class="panel"><button class="back" onclick="render()">← Garden</button><h2>👕 Benny's Wardrobe</h2><p>Complete games to unlock outfits.</p>
  <div class="wardrobe">${OUTFITS.map((o,i)=>`<button class="outfit ${state.stars>=o[2]?"":"locked"}" data-i="${i}" ${state.stars>=o[2]?"":"disabled"}><span>${o[0]}</span><b>${o[1]}</b><small>${state.stars>=o[2]?(state.outfit===i?"Equipped":"Tap to wear"):`🔒 ${o[2]} stars`}</small></button>`).join("")}</div></div>`;
  s.querySelectorAll(".outfit:not(.locked)").forEach(b=>b.onclick=()=>{state.outfit=+b.dataset.i;save();render();});
}
function showBadges(){
  const s=document.querySelector("#screen");
  s.innerHTML=`<div class="panel"><button class="back" onclick="render()">← Garden</button><h2>🏅 My Badges</h2><div class="badge-list">
  ${["🌟 First Steps","🏅 Garden Explorer","🏆 Bunny Champion"].map(x=>`<div class="badge ${state.badges.includes(x)?"earned":""}">${x}<small>${state.badges.includes(x)?"Earned!":"Keep playing to unlock"}</small></div>`).join("")}</div></div>`;
}
function startGame(g){
  currentGame=g; const s=document.querySelector("#screen");
  const [emoji,title,desc,id]=g;
  s.innerHTML=`<div class="panel game-panel"><button class="back" onclick="render()">← Garden</button><div class="big">${emoji}</div><h2>${title}</h2><p>${desc}</p><div id="playarea"></div><button id="done" class="primary" style="display:none">🎉 Claim Stars</button></div>`;
  buildMini(id);
}
function finishButton(){
  const b=document.querySelector("#done"); b.style.display="inline-flex";
  b.onclick=()=>completeGame(currentGame[3],3);
}
function buildMini(id){
  const a=document.querySelector("#playarea");
  if(id==="match"){
    const items=["🌷","🌻","🌸","🌼","🌻","🌷"];
    a.innerHTML=`<p>Tap two matching flowers.</p><div class="tiles">${items.map((x,i)=>`<button data-i="${i}">❓</button>`).join("")}</div>`;
    let open=[],matched=0;
    a.querySelectorAll("button").forEach((b,i)=>b.onclick=()=>{
      if(open.length===2||b.textContent!=="❓")return;
      b.textContent=items[i];open.push(i);playTone(600);
      if(open.length===2){setTimeout(()=>{if(items[open[0]]===items[open[1]]){matched++;open.forEach(j=>a.querySelectorAll("button")[j].disabled=true);if(matched===3)finishButton();}else open.forEach(j=>a.querySelectorAll("button")[j].textContent="❓");open=[];},450)}
    });
  } else if(id==="catch"||id==="rain"||id==="balloons"||id==="apples"){
    const thing={catch:"🥕",rain:"💧",balloons:"🎈",apples:"🍎"}[id];
    let n=0; a.innerHTML=`<p>Tap ${thing} as many times as you can!</p><div class="tapzone" id="tap">${thing}</div><div class="score">0 / 8</div>`;
    a.querySelector("#tap").onclick=()=>{n++;a.querySelector(".score").textContent=`${n} / 8`;a.querySelector("#tap").style.transform=`translate(${Math.random()*120-60}px,${Math.random()*70-35}px)`;playTone(500+n*30);if(n>=8)finishButton();};
  } else if(id==="count"||id==="stars"||id==="bees"){
    const thing={count:"🦋",stars:"⭐",bees:"🐝"}[id], n=3+Math.floor(Math.random()*5);
    a.innerHTML=`<p>How many ${thing} do you see?</p><div class="creatures">${Array.from({length:n},()=>`<span>${thing}</span>`).join("")}</div><div class="answers">${[n-1,n,n+1].map(x=>`<button>${x}</button>`).join("")}</div>`;
    a.querySelectorAll(".answers button").forEach(b=>b.onclick=()=>{if(+b.textContent===n){b.classList.add("correct");playTone(850);finishButton();}else{b.classList.add("wrong");playTone(180)}})
  } else if(id==="sort"){
    const colors=["🔴","🔵","🟡"];let score=0;
    a.innerHTML=`<p>Tap the berries in rainbow order: red, blue, yellow.</p><div class="berries">${colors.map((x,i)=>`<button data-i="${i}">${x}</button>`).join("")}</div><div class="score">0 / 3</div>`;
    a.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(+b.dataset.i===score){score++;b.disabled=true;a.querySelector(".score").textContent=`${score} / 3`;playTone(700+score*80);if(score===3)finishButton()}else playTone(150)});
  } else {
    let score=0; a.innerHTML=`<p>Tap the puzzle pieces in order: 1, 2, 3, 4!</p><div class="puzzle">${[1,2,3,4].map(n=>`<button data-n="${n}">${n}</button>`).join("")}</div>`;
    a.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(+b.dataset.n===score+1){score++;b.classList.add("correct");playTone(600+score*100);if(score===4)finishButton()}else playTone(160)})
  }
}
window.render=render;
render();