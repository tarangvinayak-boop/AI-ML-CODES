/* LOGIC: dashboard, tabs, animation player, quiz, flashcards, practice */
const K='aiml_v1',$=s=>document.querySelector(s),esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
let S;try{S=JSON.parse(localStorage.getItem(K))}catch(e){}S=S||{st:{},cd:{},qz:{},days:[],last:null};
const save=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}};
const touch=id=>{S.last=id;const d=new Date().toISOString().slice(0,10);if(!S.days.includes(d))S.days.push(d);if(!S.st[id])S.st[id]='Learning';save()};
const streak=()=>{let n=0,d=new Date();while(S.days.includes(d.toISOString().slice(0,10))){n++;d.setDate(d.getDate()-1)}return n};
let cur=0,tab='learn',st={step:-1,fix:false,ci:0,flip:false,qi:0,ans:null,score:0,done:false,pr:null};
const stat=id=>S.st[id]||'Not started';
function nav(){$('#nav').innerHTML='<button class="'+(cur===0?'on':'')+'" data-p="0">Dashboard</button>'+P.map(p=>`<button class="${cur===p.id?'on':''}" data-p="${p.id}"><span>Q${p.id} ${p.t}</span><i class="dot ${stat(p.id).split(' ')[0]}"></i></button>`).join('')}
function dash(){const n=P.length,c=s=>P.filter(p=>stat(p.id)===s).length,done=c('Completed')+c('Mastered'),lr=c('Learning')+c('Needs revision'),ns=c('Not started');
const qs=Object.values(S.qz),avg=qs.length?Math.round(qs.reduce((a,b)=>a+b,0)/qs.length):null;
const weak=P.filter(p=>S.qz[p.id]!==undefined&&S.qz[p.id]<70),due=P.reduce((a,p)=>a+(S.cd[p.id]?.bad?.length||0),0),last=P.find(p=>p.id===S.last);
return `<div class="hero"><h2>Learn every program in 5 easy steps</h2><div class="path"><span>1 Understand</span><span>2 Watch it run</span><span>3 Flashcards</span><span>4 Quiz</span><span>5 Write it</span></div><button class="pri" data-p="${P[0].id}">Start with Q${P[0].id}</button></div><p class="mut">Your ${n} selected programs. Progress is saved in this browser.</p>
<div class="grid"><div class="card"><div class="big">${n}</div><div class="mut">Programs added</div></div><div class="card"><div class="big">${done}</div><div class="mut">Completed</div></div><div class="card"><div class="big">${lr}</div><div class="mut">Learning</div></div><div class="card"><div class="big">${ns}</div><div class="mut">Not started</div></div><div class="card"><div class="big">${streak()}</div><div class="mut">Day streak</div></div><div class="card"><div class="big">${avg===null?'–':avg+'%'}</div><div class="mut">Quiz average</div></div></div>
<div class="card"><b>Overall progress</b> <span class="mut">${Math.round(done/n*100)}%</span><div class="bar"><i style="width:${done/n*100}%"></i></div></div>
<div class="card"><b>Continue learning</b><p>${last?`<button class="pri" data-p="${last.id}">Q${last.id} ${last.t}</button>`:'Pick any program on the left to begin.'}</p></div>
<div class="card"><b>Daily revision</b><p class="mut">${due?due+' flashcard(s) marked “Don’t know”. Open a program and use Flashcards, then Revise missed.':'No missed flashcards yet.'}</p></div>
<div class="card"><b>Weak topics</b><p class="mut">${weak.length?weak.map(p=>p.topic+' (Q'+p.id+', '+S.qz[p.id]+'%)').join(', '):'Nothing below 70% yet. Take a quiz to find out.'}</p></div>`}
function lines(code,hl){return '<div class="code">'+code.split('\n').map((l,i)=>`<div data-l="${i+1}" class="${hl.includes(i+1)?'hl':''}"><b>${i+1}</b>${esc(l)||' '}</div>`).join('')+'</div>'}
function rng(r){const a=r.split('-').map(Number);const o=[];for(let i=a[0];i<=(a[1]||a[0]);i++)o.push(i);return o}
function learn(p){const code=st.fix?p.fix:p.code,hl=st.step>=0?rng(p.steps[st.step][0]):[];
return concept(p)+`<p>${p.desc}</p><div class="row"><span class="tag">${p.topic}</span><span class="tag">${p.lvl}</span><span class="tag">${p.time}</span></div>
${p.fixNote?`<div class="note">${p.fixNote}</div>`:''}
<h3>${st.fix?'Corrected code':'Original code'}</h3>
<div class="row" style="margin-bottom:8px">${p.fix?`<button id="fx">${st.fix?'Show original':'Show corrected'}</button>`:''}<button id="cp">Copy</button><button id="dl">Download</button></div>${lines(code,hl)}
<h3>Step by step <span class="mut">(tap a step to highlight its lines)</span></h3>${p.steps.map((s,i)=>`<div class="step ${i===st.step?'on':''}" data-s="${i}"><code>${esc(s[1])}</code> <span class="mut">line${s[0].includes('-')?'s':''} ${s[0]}</span><div>${esc(s[2])}</div>${AN[p.id]?.[i]?'<div class="ez">Like this: '+esc(AN[p.id][i])+'</div>':''}</div>`).join('')}
<h3>Expected output</h3><pre class="out">${esc(p.out)}</pre>`}
function cards(p){const d=S.cd[p.id]||(S.cd[p.id]={ok:[],bad:[]}),c=p.cards[st.ci];
return `<p class="mut">Card ${st.ci+1} of ${p.cards.length}. Known: ${d.ok.length}. Need revision: ${d.bad.length}.</p>
<div class="card fc" id="fc">${esc(st.flip?c[1]:c[0])}</div><p class="mut" style="text-align:center">Tap the card to flip</p>
<div class="row"><button id="pv">Previous</button><button id="nx">Next</button><button id="sh">Shuffle</button><button id="kn" class="pri">Know</button><button id="dk">Don't know</button>${d.bad.length?'<button id="rv">Revise missed</button>':''}</div>`}
function quiz(p){const q=p.quiz[st.qi];
if(st.done)return `<div class="card"><div class="big">${st.score}/${p.quiz.length}</div><p>Accuracy ${Math.round(st.score/p.quiz.length*100)}%. ${st.score<p.quiz.length?'Review '+p.topic+' and try again.':'All correct.'}</p><button id="rt" class="pri">Retry</button></div>`;
return `<p class="mut">Question ${st.qi+1} of ${p.quiz.length}</p><h3>${esc(q[0])}</h3>${q[1].map((o,i)=>`<button class="opt ${st.ans!==null?(i===q[2]?'ok':i===st.ans?'bad':''):''}" data-o="${i}">${esc(o)}</button>`).join('')}
${st.ans!==null?`<div class="note">${st.ans===q[2]?'Correct. ':'Not quite. '}${esc(q[3])}</div><button id="qn" class="pri">${st.qi+1<p.quiz.length?'Next question':'See score'}</button>`:''}`}
function practice(p){const src=(p.fix||p.code).split('\n');if(!st.pr||st.pr.id!==p.id){const c=src.map((l,i)=>[l,i]).filter(x=>x[0].trim()&&!x[0].trim().startsWith('#')&&x[0].length>8);const pick=[];while(pick.length<Math.min(4,c.length)){const x=c[Math.floor(Math.random()*c.length)];if(!pick.includes(x))pick.push(x)}st.pr={id:p.id,idx:pick.map(x=>x[1]).sort((a,b)=>a-b),hint:{}}}
return `<p>Type the missing lines from memory. Use hints before giving up: hint 1 shows the first word, hint 2 shows half the line.</p><div class="code" style="padding:12px">${src.map((l,i)=>st.pr.idx.includes(i)?`<div style="display:block;margin:4px 0"><input class="fill" data-i="${i}" placeholder="line ${i+1}" aria-label="Missing line ${i+1}"><span class="mut" id="h${i}"></span> <button data-h="${i}">Hint</button></div>`:`<div><b>${i+1}</b>${esc(l)||' '}</div>`).join('')}</div>
<div class="row" style="margin-top:10px"><button id="ck" class="pri">Check</button><button id="nw">New blanks</button></div><p id="pm" class="mut"></p>`}
function view(){nav();const el=$('#v');if(cur===0){el.innerHTML=dash();return}
const p=P.find(x=>x.id===cur);
el.innerHTML=`<h2>Q${p.id}. ${p.t}</h2><div class="row"><span class="mut">Status</span><select id="sel">${['Not started','Learning','Needs revision','Completed','Mastered'].map(s=>`<option ${stat(p.id)===s?'selected':''}>${s}</option>`).join('')}</select></div>
<div class="tabs">${[['learn','1 Understand'],['anim','2 Watch it run'],['cards','3 Flashcards'],['quiz','4 Quiz'],['prac','5 Write it']].map(t=>`<button class="${tab===t[0]?'on':''}" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>
<div id="tc">${tab==='learn'?learn(p):tab==='cards'?cards(p):tab==='quiz'?quiz(p):tab==='anim'?animView(p):practice(p)}</div>`}
const go=(p,t)=>{cur=p;tab=t||'learn';st={step:-1,fix:false,ci:0,flip:false,qi:0,ans:null,score:0,done:false,pr:null};if(p)touch(p);view();scrollTo(0,0)};
document.addEventListener('click',e=>{const b=e.target.closest('button,.step,.fc');if(!b)return;const p=P.find(x=>x.id===cur),d=b.dataset;
if(d.p!==undefined)return go(+d.p);if(d.t){tab=d.t;st.pr=null;return view()}
if(b.classList.contains('step')){st.step=+d.s;return view()}
const id=b.id;if(!id&&d.o===undefined&&d.h===undefined)return;
if(id==='th'){const r=document.documentElement;r.dataset.theme=(r.dataset.theme||(matchMedia('(prefers-color-scheme:light)').matches?'light':'dark'))==='dark'?'light':'dark';return}
if(id==='rs'){if(confirm('Erase all saved progress?')){S={st:{},cd:{},qz:{},days:[],last:null};save();go(0)}return}
if(id==='fx'){st.fix=!st.fix;return view()}
if(id==='cp'){navigator.clipboard?.writeText(st.fix?p.fix:p.code);b.textContent='Copied';return}
if(id==='dl'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([st.fix?p.fix:p.code]));a.download='q'+p.id+(p.lang==='python'?'.py':'.sh');a.click();return}
if(tab==='cards'){const cd=S.cd[p.id],n=p.cards.length;
if(id==='fc'){st.flip=!st.flip}else if(id==='nx'){st.ci=(st.ci+1)%n;st.flip=false}else if(id==='pv'){st.ci=(st.ci+n-1)%n;st.flip=false}
else if(id==='sh'){p.cards.sort(()=>Math.random()-.5);st.ci=0;st.flip=false}
else if(id==='kn'||id==='dk'){const k=id==='kn'?'ok':'bad',o=k==='ok'?'bad':'ok';cd[o]=cd[o].filter(x=>x!==st.ci);if(!cd[k].includes(st.ci))cd[k].push(st.ci);save();st.ci=(st.ci+1)%n;st.flip=false}
else if(id==='rv'){st.ci=cd.bad[0];st.flip=false}return view()}
if(tab==='quiz'){if(d.o!==undefined&&st.ans===null){st.ans=+d.o;if(st.ans===p.quiz[st.qi][2])st.score++}
else if(id==='qn'){st.ans=null;if(st.qi+1<p.quiz.length)st.qi++;else{st.done=true;S.qz[p.id]=Math.round(st.score/p.quiz.length*100);save()}}
else if(id==='rt'){p.quiz.sort(()=>Math.random()-.5);st.qi=0;st.ans=null;st.score=0;st.done=false}return view()}
if(tab==='prac'){const src=(p.fix||p.code).split('\n');
if(d.h!==undefined){const i=+d.h,l=src[i].trim();st.pr.hint[i]=(st.pr.hint[i]||0)+1;$('#h'+i).textContent=st.pr.hint[i]===1?' starts with: '+l.split(/[\s(]/)[0]:' '+l.slice(0,Math.ceil(l.length/2))+'…'}
else if(id==='ck'){let ok=0;document.querySelectorAll('input.fill').forEach(inp=>{const g=inp.value.trim().replace(/\s+/g,' ')===src[+inp.dataset.i].trim().replace(/\s+/g,' ');inp.className='fill '+(g?'ok':'bad');ok+=g});$('#pm').textContent=ok+' of '+st.pr.idx.length+' correct. Red lines need another look; spacing is ignored.'}
else if(id==='nw'){st.pr=null;view()}}});
document.addEventListener('change',e=>{if(e.target.id==='sel'){S.st[cur]=e.target.value;save();nav()}});
S.an=S.an||{};S.bm=S.bm||{};
const A={pid:0,i:0,play:false,sp:1,mode:'tech',hide:false,rm:false,t:null};
const srcL=p=>p.code.split('\n');
function stg(l){const t=l.trim();if(/^(import|from)\b/.test(t))return'Import';if(/print\(/.test(t))return'Output';if(/^[\w, ]+=\s*(\[|\{|np\.array|pd\.DataFrame)/.test(t)||/^"[^"]*":\s*\[/.test(t))return'Data';return'Process'}
const vstate=(p,i)=>{const v={};for(let k=0;k<=i;k++)for(const c of TR[p.id][k].ch)v[c[0]]=c[1];return v};
const fmt=a=>Array.isArray(a)?a.map(x=>Array.isArray(x)?'['+x.join(', ')+']':x).join(', '):a;
function vcard(n,s,tag,prev){let h='<div class="vc '+tag+'"><b>'+esc(n)+'</b> ';
if(s.k==='v')h+='= '+esc(s.r)+' <span class="tag">'+esc(s.t)+'</span>'+(prev&&prev.k==='v'?'<small>previous value: '+esc(prev.r)+'</small>':'');
else if(s.k==='a'){h+='<span class="tag">ndarray shape '+esc('('+s.s.join(',')+')')+' '+esc(s.t)+'</span>';h+=s.d?(Array.isArray(s.d[0])?s.d.map(r=>'<div class="bx">'+r.map(x=>'<i>'+x+'</i>').join('')+'</div>').join(''):'<div class="bx">'+s.d.map((x,i)=>'<i title="index '+i+'">'+x+'</i>').join('')+'</div>'):'<small>too large to draw</small>'}
else{h+='<span class="tag">DataFrame '+s.n+' rows x '+s.c.length+' cols</span><table><tr><th></th>'+s.c.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr>'+s.r.map((r,i)=>'<tr><th>'+esc(s.i[i])+'</th>'+r.map(x=>'<td>'+x+'</td>').join('')+'</tr>').join('')+'</table>'+(s.n>8?'<small>showing first 8 rows</small>':'')}
return h+'</div>'}
const tn=s=>s.k==='a'?'a NumPy array':s.k==='d'?'a DataFrame (table)':'a '+s.t+' value';
function plot(p,v,l){if(p.id!==18||!v.X||!v.y||l<9)return'';const X=v.X.d.map(r=>r[0]),Y=v.y.d,w=5595.238095238094,b=-1464285.7142857127,sx=x=>20+(x-1400)/1100*260,sy=y=>160-(y-6e6)/7e6*140;
return '<div class="vc" style="font-family:inherit"><span class="lbl c">Conceptual illustration</span><svg viewBox="0 0 300 180" style="width:100%;margin-top:6px"><line x1="20" y1="160" x2="290" y2="160" stroke="#64748B"/><line x1="20" y1="10" x2="20" y2="160" stroke="#64748B"/>'+X.map((x,i)=>'<circle cx="'+sx(x)+'" cy="'+sy(Y[i])+'" r="4" fill="#06B6D4"/>').join('')+'<line class="ln" x1="'+sx(1400)+'" y1="'+sy(w*1400+b)+'" x2="'+sx(2500)+'" y2="'+sy(w*2500+b)+'" stroke="#6366F1" stroke-width="2"/>'+(l>=15?'<circle cx="'+sx(2000)+'" cy="'+sy(w*2000+b)+'" r="5" fill="#22C55E"/>':'')+'<text x="24" y="22" fill="#94A3B8" font-size="9">price vs size</text></svg><small>Points are your real data and the line uses the real fitted w and b. The line-fitting motion is an illustration, not recorded.</small></div>'}
function animView(p){if(A.pid!==p.id){clearTimeout(A.t);Object.assign(A,{pid:p.id,i:0,play:false})}
if(!TR[p.id])return '<div class="note">'+(p.id===1?'Git commands run in a terminal, not in Python, so there is no real Python trace. A simulated terminal animation is planned and will be labelled as simulated.':'Q17 needs Real-estate.csv to run. Send me that file and I will record a real trace for it.')+'</div>';
setTimeout(paint,0);return '<div id="an"></div>'}
function paint(){const el=$('#an');if(!el||tab!=='anim'||cur!==A.pid){clearTimeout(A.t);A.play=false;return}
const p=P.find(x=>x.id===cur),E=TR[p.id],N=E.length,e=E[A.i],L=srcL(p),v=vstate(p,A.i),done=new Set(E.slice(0,A.i).map(x=>x.l)),nx=A.i+1<N?E[A.i+1].l:0;
S.an[p.id]=Math.max(S.an[p.id]||0,A.i+1);save();
const stages=['Start'].concat([...new Set(E.map(x=>stg(L[x.l-1])))],['End']),cs=stg(L[e.l-1]);
const si=p.steps.findIndex(s=>rng(s[0]).includes(e.l)),st=p.steps[si],bm=(S.bm[p.id]||[]).includes(A.i);
let vis=Object.keys(v).map(n=>{const c=e.ch.find(x=>x[0]===n);return vcard(n,v[n],c?(c[2]?'chg':'new'):'',c&&c[2])}).join('')||'<p class="mut">No variables yet.</p>';
let out=E.slice(0,A.i+1).map(x=>x.o).join('');
let ex;if(A.hide)ex='<p class="mut">Explanations hidden. Look at the highlighted line and the centre panel, and say what it does. Press Hide again to check.</p>';
else if(A.mode==='simple')ex='<p>'+(e.ch.length?e.ch.map(c=>(c[2]?'Changed ':'Created ')+'<b>'+esc(c[0])+'</b> ('+tn(c[1])+').').join(' '):'No new variable here.')+(e.o?' It printed text to the output.':'')+'</p>'+(AN[p.id]?.[si]?'<p class="ez">Like this: '+esc(AN[p.id][si])+'</p>':'')+'<p class="mut">Auto-written from the recorded step.</p>';
else if(A.mode==='vis')ex='<p>Watch the centre panel. '+(e.ch.length?'Cards with a green border are new and orange ones changed.':'This line changes no variables.')+'</p>';
else ex=st?'<p><code>'+esc(st[1])+'</code></p><p>'+esc(st[2])+'</p>':'<p class="mut">No written explanation for this line.</p>';
el.innerHTML='<div class="tl">'+stages.map(s=>'<button data-a="st" data-s="'+s+'" class="'+(s===cs?'on':'')+'">'+s+'</button>').join('')+'</div>'+
'<div class="an"><div class="pn"><h4>Code <span class="lbl'+(LB[p.id]?' c':'')+'">'+(LB[p.id]||'Recorded real run')+'</span></h4><div class="code" id="cd">'+L.map((l,i)=>'<div class="'+(i+1===e.l?'cur':done.has(i+1)?'done':i+1===nx?'nx':'')+'"><b>'+(i+1)+'</b>'+esc(l||' ')+'</div>').join('')+'</div></div>'+
'<div class="pn"><h4>Memory and output <span class="mut">step '+(A.i+1)+' of '+N+'</span></h4>'+vis+plot(p,v,e.l)+'<h4 style="margin-top:10px">Output</h4><pre class="out">'+esc(out||'(nothing printed yet)')+'</pre></div>'+
'<div class="pn"><h4>Explanation <span class="mut">line '+e.l+'</span></h4><div class="row" style="margin-bottom:8px">'+[['simple','Simple'],['tech','Technical'],['vis','Visual']].map(m=>'<button data-a="md" data-m="'+m[0]+'" class="'+(A.mode===m[0]?'pri':'')+'">'+m[1]+'</button>').join('')+'</div>'+ex+'<div class="row"><button data-a="hd">'+(A.hide?'Show':'Hide')+' explanation</button><button data-a="bm">'+(bm?'Bookmarked':'Bookmark step')+'</button></div><p class="mut">Watched '+S.an[p.id]+' of '+N+' steps.</p></div></div>'+
'<div class="bar2"><input type="range" id="sc" min="0" max="'+(N-1)+'" value="'+A.i+'" aria-label="Timeline"><div class="row"><button data-a="rs">Restart</button><button data-a="pv">Previous</button><button class="pri" data-a="pl">'+(A.play?'Pause':(A.i>=N-1?'Replay':A.i?'Resume':'Play'))+'</button><button data-a="nx">Next</button><select id="sp" aria-label="Speed">'+[0.25,0.5,1,1.5,2].map(s=>'<option '+(A.sp===s?'selected':'')+' value="'+s+'">'+s+'x'+(s===0.25?' slow motion':'')+'</option>').join('')+'</select><label class="mut"><input type="checkbox" data-a="rm" '+(A.rm?'checked':'')+'> Reduce motion</label></div></div>';
el.classList.toggle('rm',A.rm||matchMedia('(prefers-reduced-motion:reduce)').matches);
const c=$('#cd'),cu=c.querySelector('.cur');if(cu)c.scrollTop=cu.offsetTop-c.clientHeight/2}
function tick(){if(!A.play)return;const N=TR[cur].length;if(A.i<N-1){A.i++;paint();A.t=setTimeout(tick,1600/A.sp)}else{A.play=false;paint()}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||tab!=='anim')return;const a=b.dataset.a,N=TR[cur]?.length||0,p=P.find(x=>x.id===cur);
if(a==='pl'){if(A.play){A.play=false;clearTimeout(A.t)}else{if(A.i>=N-1)A.i=0;A.play=true;A.t=setTimeout(tick,300)}}
else if(a==='nx'){A.play=false;clearTimeout(A.t);A.i=Math.min(N-1,A.i+1)}else if(a==='pv'){A.play=false;clearTimeout(A.t);A.i=Math.max(0,A.i-1)}
else if(a==='rs'){A.play=false;clearTimeout(A.t);A.i=0}else if(a==='md')A.mode=b.dataset.m;else if(a==='hd')A.hide=!A.hide;else if(a==='rm')A.rm=b.checked;
else if(a==='bm'){const l=S.bm[p.id]=S.bm[p.id]||[];const k=l.indexOf(A.i);k<0?l.push(A.i):l.splice(k,1);save()}
else if(a==='st'){A.play=false;clearTimeout(A.t);const L=srcL(p),s=b.dataset.s;A.i=s==='Start'?0:s==='End'?N-1:Math.max(0,TR[p.id].findIndex(x=>stg(L[x.l-1])===s))}
paint()});
document.addEventListener('input',e=>{if(e.target.id==='sc'&&tab==='anim'){A.play=false;clearTimeout(A.t);A.i=+e.target.value;paint()}});
document.addEventListener('change',e=>{if(e.target.id==='sp'){A.sp=+e.target.value;paint()}});

view();
