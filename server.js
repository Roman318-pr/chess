const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {WebSocketServer}=require('ws'),H=require('./game-host');
const html=fs.readFileSync(path.join(__dirname,'public','index.html'));
const srv=http.createServer((q,r)=>{if(q.url==='/health')return r.end('ok');r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});
const wss=new WebSocketServer({server:srv}),rooms=new Map();
const send=(ws,o)=>{if(ws&&ws.readyState===1)ws.send(JSON.stringify(o))};
const rnd=n=>Math.floor(Math.random()*n),tok=()=>crypto.randomBytes(8).toString('hex');
const other=c=>c==='w'?'b':'w',NAME={w:'Белые',b:'Чёрные'};
function newCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ';let c;do{c=Array.from({length:4},()=>A[rnd(A.length)]).join('')}while(rooms.has(c));return c}
// состояние каждому игроку (рука соперника скрыта) + счёт, предложения
function push(rm){if(!rm.g)return;['w','b'].forEach(c=>{const p=rm.p[c];if(!p)return;const q=rm.p[other(c)],s=H.stateFor(rm.g,c);
 s.net={sc:{me:rm.sc[p.id],opp:q?rm.sc[q.id]:0,d:rm.sc.d},dr:rm.draw,rq:rm.rq};send(p.ws,{t:'state',me:c,s})})}
const opp=(rm,c,on)=>{const p=rm.p[other(c)];if(p)send(p.ws,{t:'opp',on})};
function seat(ws,rm,c,token,wait){const p=rm.p[c];p.ws=ws;ws.rm=rm;ws.c=c;ws.pid=p.id;
 send(ws,{t:'room',code:rm.code,token,color:c,wait,id:p.id});send(ws,{t:'chatlog',log:rm.chat})}
// фиксируем результат партии один раз и обновляем счёт
function fin(rm){if(rm.over||!H.over(rm.g))return;rm.over=true;rm.draw=null;const r=H.result(rm.g);if(r==='draw')rm.sc.d++;else rm.sc[rm.p[r].id]++}
function handle(ws,m){
 if(m.t==='create'){
  const min=Math.min(30,Math.max(1,(m.min|0)||5)),inc=Math.min(30,Math.max(0,m.inc|0));
  const c=m.col==='w'||m.col==='b'?m.col:(rnd(2)?'w':'b'),code=newCode(),token=tok();
  const rm={code,min,inc,alko:!!m.alko,g:null,p:{w:null,b:null},last:Date.now(),over:false,sc:{1:0,2:0,d:0},chat:[],draw:null,rq:null,cool:{w:false,b:false}};
  rooms.set(code,rm);rm.p[c]={token,ws:null,id:'1'};seat(ws,rm,c,token,true)}
 else if(m.t==='join'){
  const rm=rooms.get(String(m.code||'').toUpperCase());
  if(!rm)return send(ws,{t:'err',m:'Комната не найдена',fatal:1});
  const c=!rm.p.w?'w':!rm.p.b?'b':null;
  if(!c)return send(ws,{t:'err',m:'Комната занята',fatal:1});
  const token=tok();rm.p[c]={token,ws:null,id:'2'};seat(ws,rm,c,token,false);
  rm.g=H.create(rm.min,rm.inc,rm.alko);push(rm);opp(rm,c,true)}   // часы стартуют только здесь, когда зашёл второй игрок
 else if(m.t==='resume'){
  const rm=rooms.get(String(m.code||'')),c=rm&&['w','b'].find(x=>rm.p[x]&&rm.p[x].token===m.token);
  if(!c)return send(ws,{t:'err',m:'Сессия не найдена',fatal:1});
  seat(ws,rm,c,m.token,!rm.g);push(rm);opp(rm,c,true)}
 else if(ws.rm){
  const rm=ws.rm,c=ws.c;rm.last=Date.now();
  if(m.t==='chat'){
   const t=String(m.text||'').trim().slice(0,300);if(!t||Date.now()-(ws.lc||0)<300)return;ws.lc=Date.now();
   const e={id:rm.p[c].id,text:t};rm.chat.push(e);if(rm.chat.length>60)rm.chat.shift();
   return ['w','b'].forEach(x=>rm.p[x]&&send(rm.p[x].ws,{t:'chat',...e}))}
  if(!rm.g)return send(ws,{t:'err',m:'Соперник ещё не подключился'});
  if(m.t==='rematch'){
   if(!rm.over)return;
   if(rm.rq&&rm.rq!==ws.pid){            // оба согласны: меняем цвета и стартуем заново
    rm.p={w:rm.p.b,b:rm.p.w};['w','b'].forEach(x=>{if(rm.p[x].ws)rm.p[x].ws.c=x});
    rm.g=H.create(rm.min,rm.inc,rm.alko);rm.over=false;rm.rq=null;rm.draw=null;rm.cool={w:false,b:false}}
   else rm.rq=ws.pid;
   return push(rm)}
  if(rm.over)return;
  if(m.t==='draw'){if(!rm.draw&&!rm.cool[c]){rm.draw=c;push(rm)}return}
  if(m.t==='drawyes'||m.t==='drawno'){
   if(rm.draw&&rm.draw!==c){
    if(m.t==='drawyes'){H.end(rm.g,'draw','Ничья по согласию');fin(rm)}else{rm.cool[rm.draw]=true;rm.draw=null}
    push(rm)}
   return}
  if(m.t==='resign'){H.end(rm.g,other(c),NAME[c]+' сдались — победили '+NAME[other(c)]+' 🎉');fin(rm);return push(rm)}
  const e=H.act(rm.g,c,m);
  if(e)send(ws,{t:'err',m:e});
  else{if(rm.draw&&rm.draw!==c){rm.cool[rm.draw]=true;rm.draw=null}rm.cool[c]=false}   // ход соперника = отказ от ничьей
  fin(rm);push(rm)}}
wss.on('connection',ws=>{
 ws.isAlive=true;ws.on('pong',()=>{ws.isAlive=true});
 ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch(e){return}
  try{handle(ws,m)}catch(e){console.error(e);send(ws,{t:'err',m:'Ошибка сервера'})}});
 ws.on('close',()=>{const rm=ws.rm;if(rm&&rm.p[ws.c]&&rm.p[ws.c].ws===ws){rm.p[ws.c].ws=null;opp(rm,ws.c,false)}})});
setInterval(()=>rooms.forEach((rm,code)=>{
 if(Date.now()-rm.last>3*3600e3){rooms.delete(code);return}
 if(!rm.g||rm.over)return;H.tick(rm.g);if(H.over(rm.g)){fin(rm);push(rm)}}),250);
setInterval(()=>rooms.forEach(rm=>{if(rm.g&&!rm.over){const t=H.time(rm.g);['w','b'].forEach(c=>rm.p[c]&&send(rm.p[c].ws,{t:'clk',time:t}))}}),2000);
setInterval(()=>wss.clients.forEach(w=>{if(!w.isAlive)return w.terminate();w.isAlive=false;w.ping()}),30000);
const PORT=process.env.PORT||3000;srv.listen(PORT,()=>console.log('http://localhost:'+PORT));

