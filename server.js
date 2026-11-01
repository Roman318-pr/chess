const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {WebSocketServer}=require('ws'),H=require('./game-host');
const html=fs.readFileSync(path.join(__dirname,'public','index.html'));
const srv=http.createServer((q,r)=>{if(q.url==='/health')return r.end('ok');r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});
const wss=new WebSocketServer({server:srv}),rooms=new Map();
const send=(ws,o)=>{if(ws&&ws.readyState===1)ws.send(JSON.stringify(o))};
const rnd=n=>Math.floor(Math.random()*n),tok=()=>crypto.randomBytes(8).toString('hex');
function newCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ';let c;do{c=Array.from({length:4},()=>A[rnd(A.length)]).join('')}while(rooms.has(c));return c}
const push=rm=>['w','b'].forEach(c=>{const p=rm.p[c];if(p)send(p.ws,{t:'state',me:c,s:H.stateFor(rm.g,c)})});
const opp=(rm,c,on)=>{const p=rm.p[c==='w'?'b':'w'];if(p)send(p.ws,{t:'opp',on})};
function seat(ws,rm,c,token,wait){rm.p[c].ws=ws;ws.rm=rm;ws.c=c;send(ws,{t:'room',code:rm.code,token,color:c,wait})}
function handle(ws,m){
 if(m.t==='create'){
  const min=Math.min(30,Math.max(1,(m.min|0)||5)),inc=Math.min(30,Math.max(0,m.inc|0));
  const c=m.col==='w'||m.col==='b'?m.col:(rnd(2)?'w':'b'),code=newCode(),token=tok();
  const rm={code,min,inc,g:null,p:{w:null,b:null},last:Date.now(),over:false};
  rooms.set(code,rm);rm.p[c]={token,ws:null};seat(ws,rm,c,token,true)}
 else if(m.t==='join'){
  const rm=rooms.get(String(m.code||'').toUpperCase());
  if(!rm)return send(ws,{t:'err',m:'Комната не найдена',fatal:1});
  const c=!rm.p.w?'w':!rm.p.b?'b':null;
  if(!c)return send(ws,{t:'err',m:'Комната занята',fatal:1});
  const token=tok();rm.p[c]={token,ws:null};seat(ws,rm,c,token,false);
  rm.g=H.create(rm.min,rm.inc);push(rm);opp(rm,c,true)}
 else if(m.t==='resume'){
  const rm=rooms.get(String(m.code||'')),c=rm&&['w','b'].find(x=>rm.p[x]&&rm.p[x].token===m.token);
  if(!c)return send(ws,{t:'err',m:'Сессия не найдена',fatal:1});
  seat(ws,rm,c,m.token,!rm.g);if(rm.g)push(rm);opp(rm,c,true)}
 else if(ws.rm){
  const rm=ws.rm;rm.last=Date.now();
  if(!rm.g)return send(ws,{t:'err',m:'Соперник ещё не подключился'});
  const e=H.act(rm.g,ws.c,m);if(e)send(ws,{t:'err',m:e});push(rm)}}
wss.on('connection',ws=>{
 ws.isAlive=true;ws.on('pong',()=>{ws.isAlive=true});
 ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch(e){return}
  try{handle(ws,m)}catch(e){console.error(e);send(ws,{t:'err',m:'Ошибка сервера'})}});
 ws.on('close',()=>{const rm=ws.rm;if(rm&&rm.p[ws.c]&&rm.p[ws.c].ws===ws){rm.p[ws.c].ws=null;opp(rm,ws.c,false)}})});
setInterval(()=>rooms.forEach((rm,code)=>{
 if(Date.now()-rm.last>3*3600e3){rooms.delete(code);return}
 if(!rm.g||rm.over)return;H.tick(rm.g);if(H.over(rm.g)){rm.over=true;push(rm)}}),250);
setInterval(()=>rooms.forEach(rm=>{if(rm.g&&!rm.over){const t=H.time(rm.g);['w','b'].forEach(c=>rm.p[c]&&send(rm.p[c].ws,{t:'clk',time:t}))}}),2000);
setInterval(()=>wss.clients.forEach(w=>{if(!w.isAlive)return w.terminate();w.isAlive=false;w.ping()}),30000);
const PORT=process.env.PORT||3000;srv.listen(PORT,()=>console.log('http://localhost:'+PORT));
