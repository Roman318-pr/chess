
const G={P:'♟\uFE0E',N:'♞\uFE0E',B:'♝\uFE0E',R:'♜\uFE0E',Q:'♛\uFE0E',K:'♚\uFE0E'};
const CARDS={
double:{n:'Двойной ход',d:'Два хода подряд',t:null},
freeze:{n:'Заморозка',d:'Вражеская фигура (не король) не ходит 2 хода',t:'e'},
shield:{n:'Щит',d:'Ваша фигура неуязвима до вашего следующего хода',t:'o'},
mutate:{n:'Мутация',d:'Ваша пешка становится конём или слоном',t:'p'},
tornado:{n:'Торнадо',d:'Две случайные фигуры (без королей и пешек) меняются местами',t:null},
revive:{n:'Воскрешение',d:'Ваша съеденная фигура возвращается на случайную свободную клетку в вашем тылу',t:null},
steal:{n:'Кража',d:'Заберите случайную карту из руки соперника',t:null},
wisdom:{n:'Мудрость',d:'Возьмите 2 карты (максимум 3 в руке)',t:null},
recruit:{n:'Вербовка',d:'Вражеская пешка переходит на вашу сторону',t:'v'},
demote:{n:'Ослабление',d:'Вражеский ферзь или ладья становится конём или слоном',t:'d'},
thaw:{n:'Оттепель',d:'Снимает заморозку со всех ваших фигур',t:null},
reinforce:{n:'Подкрепление',d:'Новая пешка на свободной клетке вашего ряда пешек',t:null},
blizzard:{n:'Метель',d:'До 3 случайных вражеских фигур (без короля) не ходят на следующем ходу',t:null},
gamble:{n:'Азарт',d:'50%: два хода подряд, 50%: вы теряете ход',t:null}};
const KEYS=Object.keys(CARDS),NM={w:'Белые',b:'Чёрные'};
let S;const CFG={min:5,inc:3,lvl:3,col:'r'};const LV=[null,{d:1,n:250,r:.45,c:.1},{d:1,n:120,r:.25,c:.15},{d:1,n:50,r:.1,c:.25},{d:2,n:60,r:.06,c:.3},{d:2,n:20,r:.02,c:.35},{d:3,n:25,r:.02,c:.4},{d:3,n:8,r:0,c:.4},{d:3,n:0,r:0,c:.4}];
function init(me){
 const row='RNBQKBNR',b=[];
 for(let r=0;r<8;r++)b.push(Array(8).fill(null));
 for(let c=0;c<8;c++){b[0][c]={t:row[c],c:'b',f:0,s:0};b[1][c]={t:'P',c:'b',f:0,s:0};b[6][c]={t:'P',c:'w',f:0,s:0};b[7][c]={t:row[c],c:'w',f:0,s:0}}
 S={b,me:me||null,ep:null,cap:{w:[],b:[]},time:{w:CFG.min*60,b:CFG.min*60},inc:CFG.inc,lvl:CFG.lvl,rr:{w:3,b:3},t0:Date.now(),turn:'w',left:1,played:false,sel:null,mv:[],tg:null,over:null,hand:{w:[],b:[]},log:['Партия началась']};
 draw();render();
}
function draw(){const h=S.hand[S.turn];if(h.length<3)h.push(KEYS[Math.floor(Math.random()*KEYS.length)])}
function moves(r,c){
 const p=S.b[r][c],out=[];if(p.f)return out;
 const add=(y,x,m)=>{if(y<0||y>7||x<0||x>7)return false;const q=S.b[y][x];
  if(!q){if(m!=='c')out.push([y,x]);return true}
  if(q.c!==p.c&&!q.s&&q.t!=='K'&&m!=='m')out.push([y,x]);return false};
 if(p.t==='P'){const d=p.c==='w'?-1:1,st=p.c==='w'?6:1;
  if(add(r+d,c,'m')&&r===st)add(r+2*d,c,'m');add(r+d,c-1,'c');add(r+d,c+1,'c');if(S.ep&&S.ep[0]===r+d&&Math.abs(S.ep[1]-c)===1){const v=S.b[r][S.ep[1]];if(v&&v.t==='P'&&v.c!==p.c&&!v.s)out.push([r+d,S.ep[1],'ep'])}}
 else if(p.t==='N')[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(([a,e])=>add(r+a,c+e));
 else{const D=[];if(p.t!=='B')D.push([1,0],[-1,0],[0,1],[0,-1]);if(p.t!=='R')D.push([1,1],[1,-1],[-1,1],[-1,-1]);
  D.forEach(([a,e])=>{let y=r+a,x=c+e;while(add(y,x)){if(p.t==='K')break;y+=a;x+=e}})}
 if(p.t==='K'&&!p.m&&c===4&&r===(p.c==='w'?7:0)){const e=p.c==='w'?'b':'w',R=x=>{const q=S.b[r][x];return q&&q.t==='R'&&q.c===p.c&&!q.m&&!q.f};
  if(!attacked(r,4,e)){
   if(R(7)&&!S.b[r][5]&&!S.b[r][6]&&!attacked(r,5,e)&&!attacked(r,6,e))out.push([r,6,'cs']);
   if(R(0)&&!S.b[r][1]&&!S.b[r][2]&&!S.b[r][3]&&!attacked(r,2,e)&&!attacked(r,3,e))out.push([r,2,'cl'])}}
 return out}
function attacked(r,c,col){
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){const p=S.b[y][x];if(!p||p.c!==col||p.f)continue;
  const dy=r-y,dx=c-x,ay=Math.abs(dy),ax=Math.abs(dx);
  if(p.t==='P'){if(dy===(col==='w'?-1:1)&&ax===1)return true}
  else if(p.t==='N'){if(ay*ax===2)return true}
  else if(p.t==='K'){if(Math.max(ay,ax)===1)return true}
  else{const dg=ay===ax&&ay>0,st=(ay===0)!==(ax===0);
   if((dg&&p.t!=='R')||(st&&p.t!=='B')){const sy=Math.sign(dy),sx=Math.sign(dx);let a=y+sy,b=x+sx;while((a!==r||b!==c)&&!S.b[a][b]){a+=sy;b+=sx}if(a===r&&b===c)return true}}}
 return false}
function inCheck(col){for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=S.b[r][c];if(p&&p.t==='K'&&p.c===col)return attacked(r,c,col==='w'?'b':'w')}return false}
function safe(r,c,m){const p=S.b[r][c],t=S.b[m[0]][m[1]];let ep=null;S.b[m[0]][m[1]]=p;S.b[r][c]=null;
 if(m[2]==='ep'){ep=S.b[r][m[1]];S.b[r][m[1]]=null}
 const ok=!inCheck(p.c);S.b[r][c]=p;S.b[m[0]][m[1]]=t;if(ep)S.b[r][m[1]]=ep;return ok}
function legal(r,c){return moves(r,c).filter(m=>safe(r,c,m))}
function canMove(){for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=S.b[r][c];if(p&&p.c===S.turn&&legal(r,c).length)return true}return false}
function endTurn(){S.time[S.turn]+=S.inc||0;
 S.b.flat().forEach(p=>{if(p&&p.c===S.turn){if(p.f)p.f--;if(p.s)p.s--}});
 S.turn=S.turn==='w'?'b':'w';S.left=1;S.played=false;S.sel=null;S.mv=[];S.tg=null;draw();
 if(!canMove()){if(inCheck(S.turn)){S.over=S.turn==='w'?'b':'w';S.log.push('Мат!')}else{S.over='draw';S.log.push('Пат')}}
}
function fin(){S.left--;if(S.left<=0||!canMove())endTurn()}
function promote(t){if(!S.pr)return;S.b[S.pr[0]][S.pr[1]].t=t;S.pr=null;fin();render()}
function usable(k){const t=CARDS[k].t,a=S.b.flat().filter(Boolean);
 if(inCheck(S.turn)&&k!=='double')return false;
 if(t==='p')return a.some(p=>p.c===S.turn&&p.t==='P');
 if(t==='o')return a.some(p=>p.c===S.turn&&p.t!=='K');
 if(t==='e')return a.some(p=>p.c!==S.turn&&p.t!=='K');
 if(t==='v')return a.some(p=>p.c!==S.turn&&p.t==='P'&&!p.s);
 if(t==='d')return a.some(p=>p.c!==S.turn&&(p.t==='Q'||p.t==='R'));
 if(k==='tornado')return a.filter(p=>p.t!=='K'&&p.t!=='P').length>1;
 if(k==='revive')return S.cap[S.turn].some(x=>home(S.turn,x).length>0);
 if(k==='steal')return S.hand[S.turn==='w'?'b':'w'].length>0;
 if(k==='thaw')return a.some(p=>p.c===S.turn&&p.f);
 if(k==='reinforce')return home(S.turn,'P').length>0;
 if(k==='blizzard')return a.some(p=>p.c!==S.turn&&p.t!=='K');
 return true}
function rnd(a){return a[Math.floor(Math.random()*a.length)]}
function home(c,t){const rw=t==='P'?[c==='w'?6:1]:[c==='w'?7:0],o=[];rw.forEach(r=>{for(let x=0;x<8;x++)if(!S.b[r][x])o.push([r,x])});return o}
function extra(k){const c=S.turn,o=c==='w'?'b':'w',a=S.b.flat().filter(Boolean);
 if(k==='wisdom'){draw();draw()}
 else if(k==='steal'){const h=S.hand[o];if(h.length)S.hand[c].push(h.splice(Math.floor(Math.random()*h.length),1)[0])}
 else if(k==='thaw')a.forEach(p=>{if(p.c===c)p.f=0});
 else if(k==='reinforce'){const s=rnd(home(c,'P'));S.b[s[0]][s[1]]={t:'P',c,f:0,s:0}}
 else if(k==='blizzard'){const e=a.filter(p=>p.c===o&&p.t!=='K');for(let n=0;n<3&&e.length;n++)e.splice(Math.floor(Math.random()*e.length),1)[0].f=1}
 else if(k==='revive'){const t=rnd(S.cap[c].filter(x=>home(c,x).length)),s=rnd(home(c,t));S.cap[c].splice(S.cap[c].indexOf(t),1);S.b[s[0]][s[1]]={t,c,f:0,s:0,m:1}}
 else if(k==='gamble'){if(Math.random()<.5){S.left=2;S.log.push('Азарт: повезло! Два хода')}else{S.log.push('Азарт: не повезло, ход потерян');endTurn()}}}
function okT(q){if(S.tg===null||!q)return false;const t=CARDS[S.hand[S.turn][S.tg]].t;
 return t==='e'?q.c!==S.turn&&q.t!=='K':t==='o'?q.c===S.turn&&q.t!=='K':t==='p'?q.c===S.turn&&q.t==='P':t==='v'?q.c!==S.turn&&q.t==='P'&&!q.s:t==='d'?q.c!==S.turn&&(q.t==='Q'||q.t==='R'):false}
function click(r,c){
 if(S.over||S.pr||S.menu||bt())return;const q=S.b[r][c];
 if(S.tg!==null){if(!okT(q))return;
  const k=S.hand[S.turn][S.tg];
  if(k==='freeze'){q.f=2}else if(k==='shield'){q.s=2}else if(k==='mutate'){q.t=Math.random()<.5?'N':'B'}else if(k==='recruit'){q.c=S.turn;q.f=0;q.s=0}else if(k==='demote'){const od=q.t;q.t=Math.random()<.5?'N':'B';if(inCheck(S.turn)){q.t=od;S.log.push('Ослабление открыло бы шах вашему королю — выберите другую цель');return render()}}
  S.log.push(NM[S.turn]+': '+CARDS[k].n);S.hand[S.turn].splice(S.tg,1);S.tg=null;S.played=true;endTurn();return render()}
 if(S.sel&&S.mv.some(m=>m[0]===r&&m[1]===c)){
  const [r0,c0]=S.sel,p=S.b[r0][c0],mv=S.mv.find(m=>m[0]===r&&m[1]===c);S.ep=null;
  if(q)S.cap[q.c].push(q.t);if(mv[2]==='ep'){S.cap[S.b[r0][c].c].push('P');S.b[r0][c]=null}
  if(mv[2]==='cs'){S.b[r][5]=S.b[r][7];S.b[r][7]=null;S.b[r][5].m=1}
  if(mv[2]==='cl'){S.b[r][3]=S.b[r][0];S.b[r][0]=null;S.b[r][3].m=1}
  S.b[r][c]=p;S.b[r0][c0]=null;p.m=1;
  if(p.t==='P'&&Math.abs(r-r0)===2)S.ep=[(r+r0)/2,c0];
  if(p.t==='P'&&(r===0||r===7)){S.sel=null;S.mv=[];S.pr=[r,c];return render()}
  S.sel=null;S.mv=[];
  fin();
  return render()}
 if(q&&q.c===S.turn){S.sel=[r,c];S.mv=legal(r,c)}else{S.sel=null;S.mv=[]}
 render()}
function play(i){
 if(S.over||S.played||S.pr||S.menu||bt()||!usable(S.hand[S.turn][i]))return;
 if(S.tg===i){S.tg=null;return render()}
 const k=S.hand[S.turn][i],cd=CARDS[k];S.sel=null;S.mv=[];
 if(cd.t){S.tg=i;S.log.push('Выберите цель на доске');return render()}
 if(k==='double')S.left=2;
 if(k==='tornado'){const a=[];S.b.forEach((row,r)=>row.forEach((p,c)=>{if(p&&p.t!=='K'&&p.t!=='P')a.push([r,c])}));
  let ok=false;
  for(let n=0;n<40&&a.length>1&&!ok;n++){const i=Math.floor(Math.random()*a.length),j=Math.floor(Math.random()*a.length);if(i===j)continue;const x=a[i],y=a[j],sw=()=>{[S.b[x[0]][x[1]],S.b[y[0]][y[1]]]=[S.b[y[0]][y[1]],S.b[x[0]][x[1]]]};sw();if(inCheck(S.turn))sw();else{ok=true;S.b[x[0]][x[1]].m=1;S.b[y[0]][y[1]].m=1}}
  if(!ok){S.log.push('Торнадо не нашёл безопасной перестановки');return render()}}
 S.log.push(NM[S.turn]+': '+cd.n);S.hand[S.turn].splice(i,1);S.played=true;extra(k);if(k!=='double'&&k!=='gamble')endTurn();render()}
function render(){
 const B=document.getElementById('b');B.innerHTML='';const F=S.me==='b';
 for(let i=0;i<8;i++)for(let j=0;j<8;j++){const r=F?7-i:i,c=F?7-j:j;
  const q=S.b[r][c],d=document.createElement('div');d.className='sq '+((r+c)%2?'dk':'lt');
  if(S.sel&&S.sel[0]===r&&S.sel[1]===c)d.classList.add('sel');
  if(S.mv.some(m=>m[0]===r&&m[1]===c))d.classList.add(q?'cap':'mv');
  if(okT(q))d.classList.add('tg');
  if(q)d.innerHTML='<span class="'+q.c+'">'+G[q.t]+'</span>'+(q.f?'<i>❄</i>':'')+(q.s?'<i class="r">🛡</i>':'');
  d.onclick=()=>click(r,c);B.appendChild(d)}
 document.getElementById('st').textContent=S.over==='draw'?'Пат — ничья':S.over?(S.tm?'Время вышло! ':'Мат! ')+'Победили: '+NM[S.over]+' 🎉':'Ход: '+NM[S.turn]+(inCheck(S.turn)?' · ШАХ!':'')+' · ходов осталось: '+S.left;
 const V=S.me||S.turn,o=V==='w'?'b':'w';
 document.getElementById('hs').innerHTML=S.hand[V].map((k,i)=>'<button class="card'+(S.tg===i?' on':'')+'" '+(S.played||S.over||S.pr||bt()||!usable(k)?'disabled':'')+' onclick="play('+i+')"><b>'+CARDS[k].n+'</b><small>'+CARDS[k].d+(bt()||usable(k)?'':inCheck(S.turn)&&k!=='double'?' — недоступно под шахом':' — нет подходящей цели')+'</small></button>').join('')+'<button class="n rr" onclick="reroll()" '+(bt()||S.over||S.pr||!S.rr[V]||!S.hand[V].length?'disabled':'')+'>Заменить все карты ('+S.rr[V]+' из 3)</button><div class="rl">Карт у соперника: '+S.hand[o].length+'</div>';
 clk();document.getElementById('mn').innerHTML=S.menu?menuHTML():'';mSync();document.getElementById('pr').innerHTML=S.pr?'<div class="rl">Превращение пешки — выберите фигуру:</div><div class="pc">'+['Q','R','B','N'].map(t=>'<button class="n pb" onclick="promote(\''+t+'\')"><span class="'+S.turn+'">'+G[t]+'</span></button>').join('')+'</div>':'';
 document.getElementById('log').innerHTML=S.log.slice(-4).map(x=>'• '+x).join('<br>')}
function fmt(t){t=Math.max(0,Math.ceil(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')}
function clk(){document.getElementById('clk').innerHTML=['w','b'].map(c=>'<div class="ck'+(S.turn===c&&!S.over?' on':'')+(S.time[c]<10?' lo':'')+'">'+NM[c]+(S.me&&c!==S.me?' (бот)':'')+'<b>'+fmt(S.time[c])+'</b></div>').join('')}
function tick(){if(!S||S.over||S.menu)return;const n=Date.now(),d=(n-S.t0)/1000;S.t0=n;S.time[S.turn]-=d;if(S.time[S.turn]<=0){S.time[S.turn]=0;S.over=S.turn==='w'?'b':'w';S.tm=1;S.log.push('Время вышло у: '+NM[S.turn]);return render()}clk()}
const VAL={P:100,N:320,B:330,R:500,Q:900,K:0};
function bt(){return !S.bz&&!!S.me&&S.turn!==S.me&&!S.over}
function ev(me){let s=0;for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=S.b[r][c];if(!p)continue;let v=VAL[p.t]*(p.f?.6:1);if(p.t==='P')v+=(p.c==='w'?6-r:r-1)*6;else if(p.t!=='K'&&p.t!=='R')v+=12-Math.abs(3.5-r)*2-Math.abs(3.5-c)*2;s+=p.c===me?v:-v}return s}
function allM(col){const o=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=S.b[r][c];if(p&&p.c===col)legal(r,c).forEach(m=>o.push([r,c,m]))}return o}
function ap(r,c,m){const p=S.b[r][c],t=S.b[m[0]][m[1]],pr=p.t;let x=null,ro=null;
 if(m[2]==='ep'){x=S.b[r][m[1]];S.b[r][m[1]]=null}
 S.b[m[0]][m[1]]=p;S.b[r][c]=null;
 if(m[2]==='cs'){ro=S.b[m[0]][7];S.b[m[0]][5]=ro;S.b[m[0]][7]=null}
 if(m[2]==='cl'){ro=S.b[m[0]][0];S.b[m[0]][3]=ro;S.b[m[0]][0]=null}
 if(p.t==='P'&&(m[0]===0||m[0]===7))p.t='Q';
 return [r,c,m,p,t,x,pr,ro]}
function un(u){const [r,c,m,p,t,x,pr]=u;p.t=pr;S.b[r][c]=p;S.b[m[0]][m[1]]=t;if(x)S.b[r][m[1]]=x;
 if(m[2]==='cs'){S.b[m[0]][7]=S.b[m[0]][5];S.b[m[0]][5]=null}
 if(m[2]==='cl'){S.b[m[0]][0]=S.b[m[0]][3];S.b[m[0]][3]=null}}
function cv(x){const t=S.b[x[2][0]][x[2][1]];return t?VAL[t.t]:0}
function srch(col,d,me,a,b){
 if(d===0)return ev(me);
 const ms=allM(col),o=col==='w'?'b':'w';
 if(!ms.length)return inCheck(col)?(col===me?-1e5-d:1e5+d):0;
 ms.sort((x,y)=>cv(y)-cv(x));
 let best=col===me?-1e9:1e9;
 for(const [r,c,m] of ms){const u=ap(r,c,m),v=srch(o,d-1,me,a,b);un(u);
  if(col===me){if(v>best)best=v;if(best>a)a=best}else{if(v<best)best=v;if(best<b)b=best}
  if(a>=b)break}
 return best}
function LVL(){return LV[S.lvl||3]}
function botMove(){const c=S.turn,o=c==='w'?'b':'w',ep0=S.ep,ms=allM(c),L=LVL();if(!ms.length)return;
 let bm;
 if(Math.random()<L.r)bm=rnd(ms);
 else{let best=-1e9;ms.forEach(([r,cc,m])=>{S.ep=null;const u=ap(r,cc,m),v=srch(o,L.d-1,c,-1e9,1e9)+(Math.random()-.5)*2*L.n;un(u);if(v>best){best=v;bm=[r,cc,m]}})}
 S.ep=ep0;
 click(bm[0],bm[1]);click(bm[2][0],bm[2][1]);if(S.pr)promote('Q')}
function botCard(){const h=S.hand[S.turn],ix=[];h.forEach((k,i)=>{if(usable(k))ix.push(i)});if(!ix.length)return false;
 const i=rnd(ix),k=h[i];play(i);
 if(S.tg!==null){const t=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++){const q=S.b[r][c];if(okT(q))t.push([r,c,q])}
  if(!t.length){S.tg=null;return false}
  let pk;if(k==='mutate'||k==='recruit')pk=rnd(t);else{t.sort((a,b)=>VAL[b[2].t]-VAL[a[2].t]);pk=t[0]}
  click(pk[0],pk[1])}
 return true}
function botStep(){S.bz=true;
 try{if(S.pr){promote('Q');return}
  S.tg=null;
  {const h=S.hand[S.turn];if(S.rr[S.turn]>0&&h.length>1&&h.filter(k=>!usable(k)).length>=2&&Math.random()<.6){reroll();return}}
  if(!S.played&&Math.random()<LVL().c&&botCard())return;
  botMove()}
 finally{S.bz=false;render()}}
function botTick(){if(!S||S.menu||S.over||!bt()){if(S)S.bdue=0;return}
 const n=Date.now();
 if(!S.bdue){S.bdue=n+Math.min((3500-(S.lvl-1)*485)*(.8+Math.random()*.4),Math.max(100,S.time[S.turn]*80));return}
 if(n<S.bdue)return;S.bdue=0;botStep()}
const LN=['Новичок','Новичок+','Любитель','Любитель+','Клубный','Клубный+','Сильный','Максимум'];
function menuHTML(){
 const P=[[1,0],[2,1],[3,0],[3,2],[5,0],[5,3],[10,0],[10,5],[15,10],[30,0]];
 return `<div><button class="x" onclick="closeMenu()" aria-label="Закрыть">✕</button><h1>Новая партия</h1>
 <div class="mr"><span>Минут на партию</span><b id="vm">${CFG.min}</b></div>
 <input type="range" id="sm" min="1" max="30" value="${CFG.min}" oninput="setCfg('min',+this.value)">
 <div class="mr"><span>Добавление секунд на ход</span><b id="vi">${CFG.inc}</b></div>
 <input type="range" id="si" min="0" max="30" value="${CFG.inc}" oninput="setCfg('inc',+this.value)">
 <div class="pre">${P.map(([m,i])=>`<button id="p${m}_${i}" onclick="setCfg('pre',[${m},${i}])">${m}+${i}</button>`).join('')}</div>
 <div class="lb">Сложность бота</div>
 <div class="seg">${[1,2,3,4,5,6,7,8].map(n=>`<button id="l${n}" onclick="setCfg('lvl',${n})">${n}</button>`).join('')}</div>
 <div class="lb" id="ld" style="font-weight:400;opacity:.75"></div>
 <div class="lb">Сторона</div>
 <div class="tiles">${[['w','Белые'],['r','Случайный цвет'],['b','Чёрные']].map(([c,t])=>`<button class="ct" id="c${c}" onclick="setCfg('col','${c}')"><span class="kg ${c}">${G.K}</span>${t}</button>`).join('')}</div>
 <button class="n" onclick="go(1)">Сыграть с ботом</button>
 <button class="n alt" onclick="go(0)">Играть вдвоём (без бота)</button></div>`}
function setCfg(k,v){if(k==='pre'){CFG.min=v[0];CFG.inc=v[1]}else CFG[k]=v;mSync()}
function mSync(){const $=id=>document.getElementById(id);if(!$('vm'))return;
 $('vm').textContent=CFG.min;$('vi').textContent=CFG.inc;$('sm').value=CFG.min;$('si').value=CFG.inc;
 document.querySelectorAll('.pre button').forEach(b=>b.classList.toggle('on',b.id==='p'+CFG.min+'_'+CFG.inc));
 for(let n=1;n<=8;n++)$('l'+n).classList.toggle('on',n===CFG.lvl);
 ['w','r','b'].forEach(c=>$('c'+c).classList.toggle('on',CFG.col===c));
 $('ld').textContent='Уровень '+CFG.lvl+' — '+LN[CFG.lvl-1]+' · ходит ≈ '+((3500-(CFG.lvl-1)*485)/1000).toFixed(1)+' с'}
function go(bot){const me=!bot?null:CFG.col==='r'?(Math.random()<.5?'w':'b'):CFG.col;init(me)}
function closeMenu(){if(!S||!S.menu)return;S.menu=false;S.t0=Date.now();render()}
function reroll(){const c=S.turn,h=S.hand[c];if(S.over||S.menu||S.pr||bt()||!S.rr[c]||!h.length)return;
 const n=h.length;S.rr[c]--;S.hand[c]=[];for(let i=0;i<n;i++)S.hand[c].push(rnd(KEYS));S.tg=null;S.sel=null;S.mv=[];
 S.log.push(NM[c]+': замена карт (осталось '+S.rr[c]+')');render()}
