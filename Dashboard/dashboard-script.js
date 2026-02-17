'use strict';

/* ── Auth guard ── */
if(localStorage.getItem('isLoggedIn')!=='true') window.location.replace('./index.html');

/* ── Utils ── */
const $=id=>document.getElementById(id);
const uKey=k=>`${localStorage.getItem('userEmail')||'guest'}_${k}`;
const load=(k,d=[])=>{ try{ const v=localStorage.getItem(uKey(k)); return v!==null?JSON.parse(v):d; }catch{return d;} };
const save=(k,v)=>localStorage.setItem(uKey(k),JSON.stringify(v));
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number(v)||0));
const today=()=>{ const d=new Date();d.setHours(0,0,0,0);return d.toISOString().slice(0,10); };
const ago=ts=>{ const s=Math.floor((Date.now()-ts)/1000); if(s<60)return'just now'; if(s<3600)return`${Math.floor(s/60)}m ago`; if(s<86400)return`${Math.floor(s/3600)}h ago`; return`${Math.floor(s/86400)}d ago`; };
const safeColor=v=>/^#[0-9a-f]{6}$/i.test(v)?v:'#7c3aed';

/* ── Data store ── */
const D={
  subjects:load('subjects'),
  todos:load('todos'),
  focus:load('focusItems'),
  notes:load('notes'),
  events:load('events'),
  goals:load('goals'),
  pSessions:load('pomodoroSessions'),
  sSessions:load('studySessions'),
  settings:load('pomodoroSettings',{pomodoro:25,shortBreak:5,longBreak:15,autoStartBreaks:false,soundEnabled:true})
};

/* ── Toast ── */
const toastEl=$('toast'); let _tt;
function toast(msg,type='ok'){
  clearTimeout(_tt);$('toastMsg').textContent=msg;
  toastEl.className=`toast ${type} show`;
  _tt=setTimeout(()=>toastEl.classList.remove('show'),3000);
}

/* ── Modals ── */
const openM=id=>$(id).classList.add('open');
const closeM=id=>$(id).classList.remove('open');
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeM(b.dataset.close));
document.querySelectorAll('.mb').forEach(bd=>bd.onclick=e=>{ if(e.target===bd)closeM(bd.id); });

/* ── Sidebar ── */
const sidebar=$('sidebar');
$('sidebarToggle').onclick=()=>{ sidebar.classList.toggle('collapsed'); setTimeout(renderChart,320); };
$('mobileToggle').onclick=()=>sidebar.classList.toggle('mobile-open');

document.querySelectorAll('.ni[data-s]').forEach(item=>{
  item.onclick=()=>{
    document.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));
    item.classList.add('active');
    const s=item.dataset.s;
    document.querySelectorAll('.section').forEach(x=>x.classList.remove('active'));
    $(`${s}-section`)?.classList.add('active');
    $('pageTitle').textContent=item.querySelector('.nl')?.textContent||s;
    if(window.innerWidth<=768)sidebar.classList.remove('mobile-open');
    if(s==='calendar')renderCalendar();
    if(s==='dashboard'){updateDashboard();renderChart();}
  };
});

$('logoutBtn').onclick=()=>{
  if(confirm('Sign out?')){ localStorage.removeItem('isLoggedIn'); window.location.href='./index.html'; }
};

/* ── Theme ── */
const SUN=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const MOON=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
$('themeToggle').innerHTML=MOON;
$('themeToggle').onclick=()=>{ renderChart(); };

/* ════════════════════
   DASHBOARD
════════════════════ */
function updateDashboard(){
  const totalMin=D.sSessions.reduce((a,s)=>a+(Number(s.duration)||0),0);
  $('totalStudyHours').textContent=`${Math.floor(totalMin/60)}h`;
  $('completedTasks').textContent=D.todos.filter(t=>t.completed).length;
  $('goalsAchieved').textContent=D.goals.filter(g=>g.progress===100).length;
  $('currentStreak').textContent=calcStreak();
  renderFocus();renderActivity();
}

function calcStreak(){
  if(!D.sSessions.length)return 0;
  const days=new Set(D.sSessions.map(s=>{ const d=new Date(s.date);d.setHours(0,0,0,0);return d.getTime(); }));
  const c=new Date();c.setHours(0,0,0,0);
  if(!days.has(c.getTime()))c.setDate(c.getDate()-1);
  let n=0; while(days.has(c.getTime())){n++;c.setDate(c.getDate()-1);}
  return n;
}

function renderActivity(){
  const items=[];
  D.sSessions.slice(-3).forEach(s=>items.push({txt:`Studied ${s.subject} for ${s.duration} min`,t:s.date,ico:'📚',bg:'rgba(124,58,237,.15)'}));
  D.todos.filter(t=>t.completed).slice(-2).forEach(t=>items.push({txt:`Completed: ${t.text}`,t:t.completedAt||Date.now(),ico:'✅',bg:'rgba(16,185,129,.15)'}));
  items.sort((a,b)=>b.t-a.t);
  const el=$('activityList');
  if(!items.length){el.innerHTML=`<div class="empty"><span class="ei2">🕐</span><span class="et2">No recent activity</span></div>`;return;}
  el.innerHTML=items.slice(0,5).map(a=>`<div class="ai"><div class="ad" style="background:${a.bg}">${a.ico}</div><div class="at2">${esc(a.txt)}</div><span class="ag">${ago(a.t)}</span></div>`).join('');
}

function renderFocus(){
  const t=today(),items=D.focus.filter(i=>i.dateKey===t).sort((a,b)=>Number(a.completed)-Number(b.completed));
  const el=$('focusList');
  if(!items.length){el.innerHTML=`<div class="empty"><span class="ei2">🎯</span><span class="et2">No focus items</span></div>`;return;}
  el.innerHTML=items.map(i=>`<div class="fi ${i.completed?'done':''}"><input type="checkbox" class="tc" ${i.completed?'checked':''} onchange="toggleFocus(${i.id})"><span class="ft">${esc(i.text)}</span>${i.time?`<span class="ftg">${esc(i.time)}</span>`:''}<button class="db" onclick="delFocus(${i.id})">✕</button></div>`).join('');
}

window.toggleFocus=id=>{const i=D.focus.find(f=>f.id===id);if(i){i.completed=!i.completed;save('focusItems',D.focus);renderFocus();}};
window.delFocus=id=>{D.focus=D.focus.filter(f=>f.id!==id);save('focusItems',D.focus);renderFocus();};
$('addFocusBtn').onclick=()=>{
  const txt=prompt('Focus item for today:')?.trim();if(!txt)return;
  const time=prompt('Time label (optional):','')?.trim()||'';
  D.focus.push({id:Date.now(),text:txt,time,completed:false,dateKey:today(),createdAt:Date.now()});
  save('focusItems',D.focus);renderFocus();toast('Focus item added');
};

/* ── Chart ── */
$('weekFilter').onchange=renderChart;
window.addEventListener('resize',renderChart);

function renderChart(){
  const canvas=$('weeklyChart');if(!canvas)return;
  const ctx=canvas.getContext('2d'),par=canvas.parentElement;
  const W=par.clientWidth||400,H=par.clientHeight||200,dpr=devicePixelRatio||1;
  canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=`${W}px`;canvas.style.height=`${H}px`;
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
  const offset=$('weekFilter').value==='last'?7:0;
  const now=new Date();now.setHours(0,0,0,0);
  const dow=(now.getDay()+6)%7;
  const sow=new Date(now);sow.setDate(now.getDate()-dow-offset);
  const LABS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const vals=LABS.map((_,i)=>{
    const d=new Date(sow);d.setDate(sow.getDate()+i);
    const k=d.toISOString().slice(0,10);
    return D.sSessions.filter(s=>{const sd=new Date(s.date);sd.setHours(0,0,0,0);return sd.toISOString().slice(0,10)===k;}).reduce((a,s)=>a+(Number(s.duration)||0),0)/60;
  });
  const maxV=Math.max(1,...vals);
  const pad={l:36,r:16,t:14,b:34};
  const cW=W-pad.l-pad.r,cH=H-pad.t-pad.b;
  const bW=Math.min(36,cW/7-6),gap=(cW-bW*7)/6;
  const gc='rgba(255,255,255,0.06)',lc='rgba(238,234,255,0.28)';
  ctx.font=`11px 'Figtree',sans-serif`;ctx.textBaseline='middle';
  for(let i=0;i<=4;i++){
    const y=pad.t+(cH/4)*i,v=(1-i/4)*maxV;
    ctx.strokeStyle=gc;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();
    ctx.fillStyle=lc;ctx.textAlign='right';
    ctx.fillText(`${v>=1?v.toFixed(0):v.toFixed(1)}h`,pad.l-4,y);
  }
  const gr=ctx.createLinearGradient(0,pad.t,0,H-pad.b);
  gr.addColorStop(0,'#a78bfa');gr.addColorStop(0.5,'#7c3aed');gr.addColorStop(1,'#4338ca');
  ctx.textAlign='center';
  vals.forEach((v,i)=>{
    const x=pad.l+i*(bW+gap),bH=(v/maxV)*cH,y=H-pad.b-bH,r=5;
    ctx.fillStyle=gr;
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+bW-r,y);
    ctx.quadraticCurveTo(x+bW,y,x+bW,y+r);ctx.lineTo(x+bW,H-pad.b);ctx.lineTo(x,H-pad.b);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.fill();
    // Glow
    ctx.shadowColor='rgba(124,58,237,0.4)';ctx.shadowBlur=12;ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle=lc;ctx.fillText(LABS[i],x+bW/2,H-pad.b+14);
  });
}

/* ════════════════════
   STUDY TRACKER
════════════════════ */
let curSubId=null;
$('addSubjectBtn').onclick=()=>openM('subjectModalWrap');

$('saveSubjectBtn').onclick=()=>{
  const name=$('subjectName').value.trim();
  const color=safeColor($('subjectColor').value);
  const target=clamp(parseInt($('subjectTarget').value)||10,1,168);
  if(!name){toast('Enter a subject name.','er');return;}
  D.subjects.push({id:Date.now(),name,color,target,totalHours:0,sessions:0});
  save('subjects',D.subjects);renderSubjects();closeM('subjectModalWrap');$('subjectName').value='';toast('Subject added');
};

function renderSubjects(){
  const g=$('subjectsGrid');
  if(!D.subjects.length){g.innerHTML=`<div class="empty" style="grid-column:1/-1"><span class="ei2">📖</span><span class="et2">No subjects yet</span></div>`;updateStudyStats();return;}
  g.innerHTML=D.subjects.map(s=>{
    const h=Number(s.totalHours)||0,t=clamp(Number(s.target)||10,1,168);
    const pct=Math.min((h/t)*100,100).toFixed(0),sess=Math.max(0,Number(s.sessions)||0);
    const avg=sess>0?(h/sess*60).toFixed(0):0,col=safeColor(s.color);
    return `<div class="subc" style="border-left-color:${col}">
      <div class="subh"><div class="subn">${esc(s.name)}</div><button class="db always" onclick="delSubject(${s.id})">✕</button></div>
      <div class="pl"><span>${h.toFixed(1)}h / ${t}h</span><span>${pct}%</span></div>
      <div class="pb"><div class="pf" style="width:${pct}%;background:linear-gradient(90deg,${col},${col}aa)"></div></div>
      <div class="sm"><span>${sess} sessions</span><span>${avg} min avg</span></div>
      <div class="sf2"><button class="btn btn-o btn-sm" onclick="logSess(${s.id})">＋ Log session</button></div>
    </div>`;
  }).join('');
  updateStudyStats();
}

function updateStudyStats(){
  const ts=D.subjects.reduce((a,s)=>a+(Number(s.sessions)||0),0);
  const th=D.subjects.reduce((a,s)=>a+(Number(s.totalHours)||0),0);
  $('totalSessions').textContent=ts;
  $('avgDuration').textContent=ts>0?`${(th/ts*60).toFixed(0)} min`:'0 min';
  const top=D.subjects.reduce((a,s)=>(Number(s.totalHours)||0)>(Number(a?.totalHours)||0)?s:a,null);
  $('topSubject').textContent=top?.name||'—';
}

window.delSubject=id=>{ if(!confirm('Delete this subject?'))return; D.subjects=D.subjects.filter(s=>s.id!==id); save('subjects',D.subjects); renderSubjects(); };
window.logSess=id=>{ curSubId=id; $('sessionDuration').value=''; $('sessionNotes').value=''; openM('sessionModalWrap'); };

$('saveSessionBtn').onclick=()=>{
  const dur=parseInt($('sessionDuration').value)||0;
  if(dur<=0){toast('Enter a valid duration.','er');return;}
  const sub=D.subjects.find(s=>s.id===curSubId);if(!sub)return;
  sub.totalHours=(Number(sub.totalHours)||0)+dur/60;
  sub.sessions=(Number(sub.sessions)||0)+1;
  D.sSessions.push({subject:sub.name,duration:dur,notes:$('sessionNotes').value.trim(),date:Date.now()});
  save('subjects',D.subjects);save('studySessions',D.sSessions);
  renderSubjects();closeM('sessionModalWrap');toast('Session logged! 🎉');
};

/* ════════════════════
   TODO
════════════════════ */
let tFilter='all';
function renderTodos(){
  let items=D.todos;
  if(tFilter==='active')items=D.todos.filter(t=>!t.completed);
  if(tFilter==='completed')items=D.todos.filter(t=>t.completed);
  const el=$('todoList');
  if(!items.length){el.innerHTML=`<div class="empty"><span class="ei2">✅</span><span class="et2">No tasks</span></div>`;return;}
  el.innerHTML=items.map(t=>`<div class="ti ${t.completed?'done':''}"><input type="checkbox" class="tc" ${t.completed?'checked':''} onchange="toggleTodo(${t.id})"><div class="pp ${t.priority||'medium'}"></div><span class="tt">${esc(t.text)}</span><button class="db" onclick="delTodo(${t.id})">✕</button></div>`).join('');
}

function addTodo(){
  const inp=$('todoInput'),txt=inp.value.trim();if(!txt)return;
  D.todos.push({id:Date.now(),text:txt,priority:$('todoPriority').value,completed:false,createdAt:Date.now()});
  save('todos',D.todos);renderTodos();inp.value='';toast('Task added');
}
$('addTodoBtn').onclick=addTodo;
$('todoInput').onkeydown=e=>{ if(e.key==='Enter')addTodo(); };
window.toggleTodo=id=>{ const t=D.todos.find(t=>t.id===id);if(t){t.completed=!t.completed;if(t.completed)t.completedAt=Date.now();save('todos',D.todos);renderTodos();} };
window.delTodo=id=>{ D.todos=D.todos.filter(t=>t.id!==id);save('todos',D.todos);renderTodos(); };
document.querySelectorAll('.fb').forEach(b=>b.onclick=()=>{ document.querySelectorAll('.fb').forEach(x=>x.classList.remove('active'));b.classList.add('active');tFilter=b.dataset.filter;renderTodos(); });

/* ════════════════════
   POMODORO
════════════════════ */
const CIRC=2*Math.PI*96;
let timeLeft=D.settings.pomodoro*60,pomRun=false,pomInt=null,pomMode='pomodoro',pomCount=0;

function getModeTime(){ return pomMode==='pomodoro'?D.settings.pomodoro:pomMode==='short'?D.settings.shortBreak:D.settings.longBreak; }

function updateTimer(){
  const m=Math.floor(timeLeft/60),s=timeLeft%60;
  $('timerDisplay').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  const total=getModeTime()*60,off=CIRC-CIRC*(total-timeLeft)/total;
  $('ringProgress').style.strokeDashoffset=clamp(off,0,CIRC);
}

function resetTimer(){
  clearInterval(pomInt);pomRun=false;timeLeft=getModeTime()*60;updateTimer();
  const b=$('timerStartBtn');
  b.innerHTML=`<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>Start`;
  b.className='btn btn-p';
  $('timerLabel').textContent=pomMode==='pomodoro'?'FOCUS TIME':pomMode==='short'?'SHORT BREAK':'LONG BREAK';
}

function startTimer(){
  if(pomRun){pauseTimer();return;}
  if(timeLeft<=0)resetTimer();
  pomRun=true;
  const b=$('timerStartBtn');
  b.innerHTML=`<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Pause`;
  b.className='btn btn-o';
  pomInt=setInterval(()=>{ timeLeft--;updateTimer();if(timeLeft<=0)completeTimer(); },1000);
}

function pauseTimer(){
  clearInterval(pomInt);pomRun=false;
  const b=$('timerStartBtn');
  b.innerHTML=`<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>Resume`;
  b.className='btn btn-p';
}

function completeTimer(){
  clearInterval(pomInt);pomRun=false;
  if(D.settings.soundEnabled){try{new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==').play();}catch{}}
  if(pomMode==='pomodoro'){
    pomCount=(pomCount+1)%4;
    D.pSessions.push({type:'pomodoro',duration:D.settings.pomodoro,date:Date.now()});
    save('pomodoroSessions',D.pSessions);updatePomStats();toast('Pomodoro done! Take a break 🎉');
    if(D.settings.autoStartBreaks)setTimeout(()=>{switchMode(pomCount===0?'long':'short');startTimer();},2000);
  } else {
    D.pSessions.push({type:pomMode,duration:getModeTime(),date:Date.now()});
    save('pomodoroSessions',D.pSessions);updatePomStats();toast("Break over! Let's focus 💪");
    if(D.settings.autoStartBreaks)setTimeout(()=>{switchMode('pomodoro');startTimer();},2000);
  }
  const b=$('timerStartBtn');b.innerHTML=`<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>Start`;b.className='btn btn-p';
}

function switchMode(m){
  pomMode=m;
  document.querySelectorAll('.mt2').forEach(t=>t.classList.toggle('active',t.dataset.mode===m));
  resetTimer();
}

function updatePomStats(){
  const focus=D.pSessions.filter(s=>s.type==='pomodoro');
  const total=focus.reduce((a,s)=>a+(Number(s.duration)||0),0);
  $('pomodoroCount').textContent=`${focus.length%4}/4`;
  $('pomodoroTotalTime').textContent=`${Math.floor(total/60)}h ${total%60}m`;
  const hist=$('timerHistory'),rec=[...D.pSessions].reverse().slice(0,8);
  if(!rec.length){hist.innerHTML=`<div class="empty"><span class="ei2">⏱</span><span class="et2">No sessions yet</span></div>`;return;}
  hist.innerHTML=rec.map(s=>{
    const cls=s.type==='pomodoro'?'hbf':s.type==='short'?'hbs':'hbl';
    const lbl=s.type==='pomodoro'?'Focus':s.type==='short'?'Short break':'Long break';
    return `<div class="hi"><span class="hb ${cls}">${lbl}</span><div class="hd"><div class="hn">${new Date(s.date).toLocaleDateString()}</div><div class="hda">${new Date(s.date).toLocaleTimeString()}</div></div><span class="hdr">${s.duration}m</span></div>`;
  }).join('');
}

document.querySelectorAll('.mt2').forEach(b=>b.onclick=()=>{if(!pomRun)switchMode(b.dataset.mode);});
$('timerStartBtn').onclick=startTimer;
$('timerResetBtn').onclick=resetTimer;

$('pomSettingsBtn').onclick=()=>{
  $('pomodoroDuration').value=D.settings.pomodoro;
  $('shortBreakDuration').value=D.settings.shortBreak;
  $('longBreakDuration').value=D.settings.longBreak;
  $('autoStartBreaks').checked=D.settings.autoStartBreaks;
  $('soundEnabled').checked=D.settings.soundEnabled;
  openM('pomSettingsModalWrap');
};
$('savePomSettingsBtn').onclick=()=>{
  D.settings.pomodoro=clamp(parseInt($('pomodoroDuration').value)||25,1,60);
  D.settings.shortBreak=clamp(parseInt($('shortBreakDuration').value)||5,1,30);
  D.settings.longBreak=clamp(parseInt($('longBreakDuration').value)||15,1,60);
  D.settings.autoStartBreaks=$('autoStartBreaks').checked;
  D.settings.soundEnabled=$('soundEnabled').checked;
  save('pomodoroSettings',D.settings);closeM('pomSettingsModalWrap');resetTimer();toast('Settings saved');
};
$('goalProgress').oninput=e=>$('goalProgressValue').textContent=`${e.target.value}%`;

/* ════════════════════
   NOTES
════════════════════ */
let editNoteId=null;
$('addNoteBtn').onclick=()=>{editNoteId=null;$('noteModalTitle').textContent='New Note';$('noteTitle').value='';$('noteContent').value='';openM('noteModalWrap');};
$('saveNoteBtn').onclick=()=>{
  const title=$('noteTitle').value.trim(),content=$('noteContent').value.trim();
  if(!title||!content){toast('Fill in both title and content.','er');return;}
  if(editNoteId!==null){const n=D.notes.find(n=>n.id===editNoteId);if(n){n.title=title;n.content=content;n.updatedAt=Date.now();}}
  else D.notes.push({id:Date.now(),title,content,createdAt:Date.now(),updatedAt:Date.now()});
  save('notes',D.notes);renderNotes();closeM('noteModalWrap');toast('Note saved');
};

function renderNotes(){
  const g=$('notesGrid');
  if(!D.notes.length){g.innerHTML=`<div class="empty" style="grid-column:1/-1"><span class="ei2">📝</span><span class="et2">No notes yet</span></div>`;return;}
  g.innerHTML=D.notes.map(n=>{
    const prev=n.content.length>160?n.content.slice(0,160)+'…':n.content;
    return `<div class="nc" onclick="editNote(${n.id})"><div class="nh"><div class="nt">${esc(n.title)}</div><button class="db always" onclick="event.stopPropagation();delNote(${n.id})">✕</button></div><div class="nb">${esc(prev)}</div><div class="nf"><span>${new Date(n.updatedAt).toLocaleDateString()}</span><span>${n.content.length} chars</span></div></div>`;
  }).join('');
}
window.editNote=id=>{const n=D.notes.find(n=>n.id===id);if(!n)return;editNoteId=id;$('noteModalTitle').textContent='Edit Note';$('noteTitle').value=n.title;$('noteContent').value=n.content;openM('noteModalWrap');};
window.delNote=id=>{if(!confirm('Delete this note?'))return;D.notes=D.notes.filter(n=>n.id!==id);save('notes',D.notes);renderNotes();};

/* ════════════════════
   CALENDAR
════════════════════ */
let calDate=new Date();
$('addEventBtn').onclick=()=>{$('eventDate').value=today();openM('eventModalWrap');};
$('saveEventBtn').onclick=()=>{
  const title=$('eventTitle').value.trim(),date=$('eventDate').value;
  if(!title||!date){toast('Fill in title and date.','er');return;}
  D.events.push({id:Date.now(),title,date,time:$('eventTime').value,type:$('eventType').value,createdAt:Date.now()});
  save('events',D.events);renderCalendar();closeM('eventModalWrap');$('eventTitle').value='';toast('Event added');
};
$('prevMonth').onclick=()=>{calDate.setMonth(calDate.getMonth()-1);renderCalendar();};
$('nextMonth').onclick=()=>{calDate.setMonth(calDate.getMonth()+1);renderCalendar();};

function renderCalendar(){
  const y=calDate.getFullYear(),m=calDate.getMonth();
  $('currentMonth').textContent=calDate.toLocaleString('default',{month:'long',year:'numeric'});
  const firstDay=new Date(y,m,1).getDay(),dims=new Date(y,m+1,0).getDate(),prev=new Date(y,m,0).getDate();
  const evDates=new Set(D.events.map(e=>e.date));
  const g=$('calendarGrid');g.innerHTML='';
  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d=>{const h=document.createElement('div');h.className='cdh';h.textContent=d;g.appendChild(h);});
  for(let i=firstDay-1;i>=0;i--){const d=document.createElement('div');d.className='cd other';d.textContent=prev-i;g.appendChild(d);}
  const now=new Date();now.setHours(0,0,0,0);
  for(let i=1;i<=dims;i++){
    const d=document.createElement('div');d.className='cd';
    const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
    if(evDates.has(ds))d.classList.add('has-event');
    if(new Date(y,m,i).getTime()===now.getTime())d.classList.add('today');
    d.textContent=i;g.appendChild(d);
  }
  const rem=42-(firstDay+dims);
  for(let i=1;i<=rem;i++){const d=document.createElement('div');d.className='cd other';d.textContent=i;g.appendChild(d);}
  renderUpcoming();
}

function renderUpcoming(){
  const t=today(),up=D.events.filter(e=>e.date>=t).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,6);
  const el=$('upcomingEvents');
  if(!up.length){el.innerHTML=`<div class="empty"><span class="ei2">📅</span><span class="et2">No upcoming events</span></div>`;return;}
  const TC={exam:'#f43f5e',assignment:'#f59e0b',class:'#0ea5e9',other:'#7c3aed'};
  el.innerHTML=up.map(e=>{const c=TC[e.type]||'#7c3aed';return `<div class="ei" style="border-left-color:${c}"><div class="etn">${esc(e.title)}</div><div class="em">${e.date}${e.time?` · ${e.time}`:''}</div><span class="etb" style="background:${c}20;color:${c}">${e.type}</span></div>`;}).join('');
}

/* ════════════════════
   GOALS
════════════════════ */
$('addGoalBtn').onclick=()=>{$('goalDate').value=today();$('goalProgress').value=0;$('goalProgressValue').textContent='0%';$('goalTitle').value='';openM('goalModalWrap');};
$('saveGoalBtn').onclick=()=>{
  const title=$('goalTitle').value.trim(),date=$('goalDate').value,progress=clamp(parseInt($('goalProgress').value)||0,0,100);
  if(!title||!date){toast('Fill in title and date.','er');return;}
  D.goals.push({id:Date.now(),title,date,progress,createdAt:Date.now()});
  save('goals',D.goals);renderGoals();closeM('goalModalWrap');toast('Goal created! 🚀');
};

function renderGoals(){
  const el=$('goalsList');
  if(!D.goals.length){el.innerHTML=`<div class="empty"><span class="ei2">🏆</span><span class="et2">No goals yet</span></div>`;return;}
  el.innerHTML=D.goals.map(g=>{
    const p=clamp(Number(g.progress)||0,0,100);
    const col=p===100?'#10b981':p>=60?'#f59e0b':'#7c3aed';
    return `<div class="gc"><div class="gch"><div><div class="gct">${esc(g.title)}</div><div class="gcd">Target: ${g.date}</div></div><div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800;background:linear-gradient(135deg,${col},${col}aa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${p}%</div></div><div class="gpl"><span>Progress</span><span>${p===100?'🎉 Complete':'In progress'}</span></div><div class="pb" style="height:8px"><div class="pf" style="width:${p}%;background:linear-gradient(90deg,${col},${col}aa)"></div></div><div class="gf"><button class="btn btn-o btn-sm" onclick="updateGoal(${g.id})">Update</button><button class="btn btn-o btn-sm" style="color:#f43f5e" onclick="delGoal(${g.id})">Delete</button></div></div>`;
  }).join('');
}
window.updateGoal=id=>{const g=D.goals.find(g=>g.id===id);if(!g)return;const v=prompt(`Progress for "${g.title}" (0–100):`,g.progress);if(v===null)return;g.progress=clamp(parseInt(v)||0,0,100);save('goals',D.goals);renderGoals();if(g.progress===100)toast('Goal completed! 🎉');};
window.delGoal=id=>{if(!confirm('Delete this goal?'))return;D.goals=D.goals.filter(g=>g.id!==id);save('goals',D.goals);renderGoals();};

/* ════════════════════
   INIT
════════════════════ */
(function init(){
  const name=localStorage.getItem('userName')||'Student';
  $('userName').textContent=name;
  $('userAvatar').textContent=name[0].toUpperCase();
  renderSubjects();renderTodos();renderNotes();renderCalendar();renderGoals();
  updatePomStats();updateTimer();updateDashboard();
  $('eventDate').value=today();$('goalDate').value=today();
  setTimeout(renderChart,50);
})();