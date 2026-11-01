// Серверная обёртка над той же игровой логикой, что и в браузере (game.js).
const fs=require('fs'),vm=require('vm'),path=require('path');
const SRC=fs.readFileSync(path.join(__dirname,'game.js'),'utf8');
const st=g=>vm.runInContext('S',g);
exports.create=(min,inc)=>{
 const g=vm.createContext({document:{addEventListener(){},getElementById(){return null},querySelectorAll(){return[]}}});
 vm.runInContext(SRC,g);
 vm.runInContext('render=function(){};clk=function(){};',g);
 vm.runInContext(`CFG.min=${min|0};CFG.inc=${inc|0};init(null);`,g);
 return g};
exports.tick=g=>g.tick();
exports.over=g=>!!st(g).over;
exports.time=g=>({...st(g).time});
// состояние для конкретного игрока: руку соперника скрываем
exports.stateFor=(g,c)=>{const s=JSON.parse(vm.runInContext('JSON.stringify(S)',g)),o=c==='w'?'b':'w';
 s.hand[o]=s.hand[o].map(()=>null);return s};
exports.act=(g,color,m)=>{
 const S=st(g),I=v=>Number.isInteger(v)&&v>=0&&v<8;
 if(S.over)return 'Партия окончена';
 if(S.turn!==color)return 'Сейчас не ваш ход';
 S.sel=null;S.mv=[];S.tg=null;
 try{
  if(S.pr){if(m.t==='promote'&&'QRBN'.includes(m.p)&&m.p.length===1)g.promote(m.p);return null}
  if(m.t==='move'){
   if(!(Array.isArray(m.f)&&Array.isArray(m.to)&&m.f.length===2&&m.to.length===2&&[...m.f,...m.to].every(I)))return 'Неверный ход';
   g.click(m.f[0],m.f[1]);g.click(m.to[0],m.to[1])}
  else if(m.t==='card'){
   const h=S.hand[color];if(!Number.isInteger(m.i)||m.i<0||m.i>=h.length)return 'Нет такой карты';
   g.play(m.i);if(S.tg!==null){if(I(m.r)&&I(m.c))g.click(m.r,m.c);S.tg=null}}
  else if(m.t==='reroll')g.reroll();
 }catch(e){console.error(e);return 'Ошибка хода'}
 S.sel=null;S.mv=[];S.tg=null;return null};
