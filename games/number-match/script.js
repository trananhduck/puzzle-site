const $=id=>document.getElementById(id);
const D=[[0,1],[1,0],[0,-1],[-1,0]],MAXT=2;
const NAMES={easy:'Easy',medium:'Medium',hard:'Hard'},ORDER=['easy','medium','hard'];
const gcd=(a,b)=>b?gcd(b,a%b):a;
const mk=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const ri=(a,b,R)=>a+Math.floor(R()*(b-a+1));
function shuf(a,R){for(let i=a.length-1;i>0;i--){const j=ri(0,i,R);[a[i],a[j]]=[a[j],a[i]]}return a}
const copy=G=>G.map(r=>r.slice());
const cellsOf=G=>{const a=[];for(let r=1;r<9;r++)for(let c=1;c<9;c++)if(G[r][c])a.push([r,c]);return a};

function path(G,a,b){
  const best=new Array(400).fill(99),par=new Array(400).fill(-1),q=[];
  const pos=k=>[Math.floor(k/40),Math.floor(k/4)%10];
  for(let d=0;d<4;d++){const k=(a[0]*10+a[1])*4+d;best[k]=0;q.push(k)}
  for(let h=0;h<q.length;h++){
    const s=q[h],[r,c]=pos(s),d=s%4,t=best[s],nr=r+D[d][0],nc=c+D[d][1];
    if(nr<0||nr>9||nc<0||nc>9)continue;
    if(nr===b[0]&&nc===b[1]){const pts=[[nr,nc]];let k=s;while(k!==-1){pts.push(pos(k));k=par[k]}return pts.reverse()}
    if(G[nr][nc])continue;
    for(let nd=0;nd<4;nd++){
      const nt=t+(nd!==d?1:0);if(nt>MAXT)continue;
      const nk=(nr*10+nc)*4+nd;
      if(nt<best[nk]){best[nk]=nt;par[nk]=s;q.push(nk)}
    }
  }
  return null;
}
// một ván chơi thử: ưu tiên nước làm biến mất nhiều số nhất
function playout(G0,R){
  const G=copy(G0);
  for(;;){
    const a=cellsOf(G);if(!a.length)return true;
    const cand=[[],[],[]];
    for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){
      const x=G[a[i][0]][a[i][1]],y=G[a[j][0]][a[j][1]],k=gcd(x,y);
      if(k>1)cand[(x===k)+(y===k)].push([a[i],a[j]]);
    }
    let done=false;
    for(let s=2;s>=0&&!done;s--){
      const L=cand[s];
      while(L.length){
        const i=Math.floor(R()*L.length),m=L[i];L[i]=L[L.length-1];L.pop();
        if(path(G,m[0],m[1])){
          const x=G[m[0][0]][m[0][1]],y=G[m[1][0]][m[1][1]],k=gcd(x,y);
          G[m[0][0]][m[0][1]]=x===k?0:x/k;G[m[1][0]][m[1][1]]=y===k?0:y/k;
          done=true;break;
        }
      }
    }
    if(!done)return false;
  }
}
function solvable(G,R,plays,ms){
  const t0=performance.now();
  for(let i=0;i<plays;i++){if(playout(G,R))return true;if(performance.now()-t0>ms)break}
  return false;
}
function gen(diff,R){
  const v=[];
  const p4={easy:.3,medium:.5,hard:.6}[diff];
  const pairVal=()=>diff==='easy'?ri(10,99,R):diff==='hard'?ri(100,999,R):(R()<.5?ri(10,99,R):ri(100,999,R));
  while(v.length<64){
    if(v.length<=60&&R()<p4){
      const lo=diff==='hard'?100:10,hi=diff==='easy'?99:diff==='hard'?999:(R()<.5?99:999);
      let ok=false;
      for(let k=0;k<60&&!ok;k++){
        const p=ri(2,12,R),q=ri(2,12,R);
        if(p===q||gcd(p,q)!==1)continue;
        const xl=Math.max(2,Math.ceil(lo/Math.min(p,q))),xh=Math.floor(hi/Math.max(p,q));
        if(xl>xh)continue;
        const x=ri(xl,xh,R);v.push(p*x,q*x,p,q);ok=true;
      }
      if(ok)continue;
    }
    const x=pairVal();v.push(x,x);
  }
  shuf(v,R);
  const G=Array.from({length:10},()=>Array(10).fill(0));
  let i=0;for(let r=1;r<9;r++)for(let c=1;c<9;c++)G[r][c]=v[i++];
  return G;
}
function buildLevel(diff,lv){
  const R=mk({easy:1000,medium:2000,hard:3000}[diff]+lv*7919);
  for(;;){const G=gen(diff,R);if(solvable(G,R,300,1e9))return G}
}

let g,hist,hi,sel,busy,over,secs,timer,cur;
function key(d,l){return d+'-'+l}
function parse(){const m=/^(easy|medium|hard)-([1-7])$/.exec(location.hash.slice(1));return m?{d:m[1],l:+m[2]}:{d:'easy',l:1}}
function go(d,l){
  try{location.hash=key(d,l)}catch(e){}
  if(cur!==key(d,l))load(d,l);
}
function load(d,l){
  cur=key(d,l);
  g=buildLevel(d,l);hist=[copy(g)];hi=0;
  clearInterval(timer);secs=0;over=false;busy=false;sel=null;
  timer=setInterval(()=>{if(!over){secs++;stats()}},1000);
  $('ov').classList.remove('on');$('ln').setAttribute('points','');
  $('nx').style.display=(d==='hard'&&l===7)?'none':'';
  say('Màn '+NAMES[d]+' '+l+'. Chọn 2 ô để nối.');
  tabs(d,l);render();stats();
}
function tabs(d,l){
  $('dt').innerHTML='';$('lt').innerHTML='';
  ORDER.forEach(x=>{const b=document.createElement('button');b.textContent=NAMES[x];if(x===d)b.className='on';b.onclick=()=>go(x,1);$('dt').appendChild(b)});
  for(let i=1;i<=7;i++){const b=document.createElement('button');b.textContent=i;if(i===l)b.className='on';b.onclick=()=>go(d,i);$('lt').appendChild(b)}
}
function render(chg=[]){
  const el=$('grid');el.innerHTML='';
  for(let r=0;r<10;r++)for(let c=0;c<10;c++){
    const d=document.createElement('div'),val=g[r][c];
    d.className='c'+(val?' f':'');
    if(val){
      d.textContent=val;
      if(sel&&sel[0]===r&&sel[1]===c)d.classList.add('sel');
      if(chg.some(p=>p[0]===r&&p[1]===c))d.classList.add('chg');
      d.onclick=()=>pick(r,c);
    }
    el.appendChild(d);
  }
}
function stats(){
  $('t').textContent=Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0');
  $('r').textContent=cellsOf(g).length;
  $('undo').disabled=hi<=0||busy;$('redo').disabled=hi>=hist.length-1||busy;
}
function say(t){$('msg').textContent=t}
function restore(){g=copy(hist[hi]);sel=null;over=false;$('ov').classList.remove('on');render();stats()}
function autoShuffle(){
  const a=cellsOf(g),vals=a.map(p=>g[p[0]][p[1]]);
  for(let t=0;t<300;t++){
    shuf(vals,Math.random);
    a.forEach((p,i)=>g[p[0]][p[1]]=vals[i]);
    if(solvable(g,Math.random,25,60))return;
  }
}
function pick(r,c){
  if(busy||over)return;
  if(!sel){sel=[r,c];render();return}
  if(sel[0]===r&&sel[1]===c){sel=null;render();return}
  const a=sel,b=[r,c],p=path(g,a,b);
  if(!p){sel=b;say('Không nối được (quá 3 nét hoặc bị chặn).');render();return}
  busy=true;stats();
  $('ln').setAttribute('points',p.map(x=>(x[1]+.5)+','+(x[0]+.5)).join(' '));
  const va=g[a[0]][a[1]],vb=g[b[0]][b[1]],k=gcd(va,vb);
  setTimeout(()=>{
    $('ln').setAttribute('points','');
    sel=null;busy=false;
    if(k===1){say('ƯCLN('+va+', '+vb+') = 1 → không đổi.');render();stats();return}
    const na=va/k,nb=vb/k,chg=[];
    g[a[0]][a[1]]=na===1?0:na;g[b[0]][b[1]]=nb===1?0:nb;
    if(na>1)chg.push(a);if(nb>1)chg.push(b);
    let t='ƯCLN('+va+', '+vb+') = '+k+' → '+(na===1?'biến mất':na)+' và '+(nb===1?'biến mất':nb)+'.';
    if(cellsOf(g).length===0){
      hist=hist.slice(0,hi+1);hist.push(copy(g));hi++;
      over=true;render(chg);stats();say(t);
      $('ovt').textContent='🎉 Thắng! '+$('t').textContent;$('ov').classList.add('on');return;
    }
    if(!solvable(g,Math.random,25,60)){autoShuffle();t+=' Không còn cách giải nên đã tự xáo các số còn lại.'}
    hist=hist.slice(0,hi+1);hist.push(copy(g));hi++;
    say(t);render(chg);stats();
  },380);
}
$('undo').onclick=()=>{if(hi>0&&!busy){hi--;restore();say('Đã hoàn tác.')}};
$('redo').onclick=()=>{if(hi<hist.length-1&&!busy){hi++;restore();say('Đã làm lại.')}};
$('rs').onclick=()=>{if(busy)return;hist=[copy(hist[0])];hi=0;secs=0;restore();say('Đã bắt đầu lại màn này.')};
$('nx').onclick=()=>{const m=parse();if(m.l<7)go(m.d,m.l+1);else go(ORDER[ORDER.indexOf(m.d)+1],1)};
$('sh').onclick=()=>{
  const u=location.href.split('#')[0]+'#'+cur;
  $('url').value=u;$('shb').classList.toggle('on');
};
$('cp').onclick=()=>{
  const i=$('url');i.select();
  try{navigator.clipboard.writeText(i.value).catch(()=>document.execCommand('copy'))}catch(e){try{document.execCommand('copy')}catch(_){}}
  say('Đã sao chép link màn này.');
};
addEventListener('hashchange',()=>{const m=parse();if(cur!==key(m.d,m.l))load(m.d,m.l)});
{const m=parse();load(m.d,m.l)}
