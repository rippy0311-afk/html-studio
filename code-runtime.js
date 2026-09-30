// Worker-isolated user programs. No access to the editor DOM or its storage.
function studioWorker(){
 let commands=[],running=false,update=null,draw=null,click=null,keyCallback=null,keys={},pressed={},pointer={x:0,y:0,down:false},entities=[],buttons={},events={},timers=[],elapsed=0,score=0,scene='',assets=0,particles=[];
 const keep=f=>{if(!f?.copy)return f;const retained=f.copy();return (...args)=>retained(...args)},plain=o=>o?.toJs?o.toJs({dict_converter:Object.fromEntries}):o;
 const send=(type,data={})=>postMessage({type,...data});
 function error(e){running=false;const detail=String(e.stack||e);const py=[...detail.matchAll(/File "game\.py", line (\d+)/g)];const js=detail.match(/game\.js:(\d+):(\d+)/);send('error',{message:py.length?detail.trim().split('\n').at(-1):String(e.message||e),detail,line:py.length?Number(py.at(-1)[1]):js?Math.max(1,Number(js[1])-2):null})}
 const command=(op,...args)=>{if(commands.length<10000)commands.push([op,...args])};
 const game={width:800,height:500,dt:0,time:0,mouse:pointer,
 clear:(color='#151b32')=>command('clear',color),rect:(x,y,w,h,color='#8cf0cf')=>command('rect',x,y,w,h,color),circle:(x,y,r,color='#ffd36b')=>command('circle',x,y,r,color),
 line:(x,y,x2,y2,color='#fff',width=2)=>command('line',x,y,x2,y2,color,width),text:(value,x,y,size=24,color='#fff')=>command('text',String(value),x,y,size,color),
 image:(url,x,y,w,h)=>command('image',String(url),x,y,w,h),background:(color)=>game.clear(color),
 sprite:(options={})=>{options=plain(options);const e={id:++assets,x:0,y:0,w:40,h:40,vx:0,vy:0,gravity:0,color:'#80f0d0',visible:true,tag:'',...options};entities.push(e);return e},
 remove:e=>{entities=entities.filter(x=>x!==e)},sprites:()=>entities,
 move:(e,dx,dy)=>{e.x+=dx;e.y+=dy},drawSprite:e=>{if(e.visible){if(e.image)game.image(e.image,e.x,e.y,e.w,e.h);else game.rect(e.x,e.y,e.w,e.h,e.color)}},
 drawSprites:()=>entities.forEach(game.drawSprite),physics:(dt=game.dt)=>entities.forEach(e=>{e.vy+=e.gravity*dt;e.x+=e.vx*dt;e.y+=e.vy*dt}),
 bounds:(e,bounce=false)=>{if(e.x<0||e.x+e.w>game.width){e.x=game.clamp(e.x,0,Math.max(0,game.width-e.w));if(bounce)e.vx*=-1}if(e.y<0||e.y+e.h>game.height){e.y=game.clamp(e.y,0,Math.max(0,game.height-e.h));if(bounce)e.vy*=-1}},
  collides:(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y,
  circleHit:(x,y,r,x2,y2,r2)=>Math.hypot(x2-x,y2-y)<=r+r2,
 hit:(x,y,e)=>x>=e.x&&x<=e.x+e.w&&y>=e.y&&y<=e.y+e.h,
 distance:(x,y,x2,y2)=>Math.hypot(x2-x,y2-y),clamp:(v,min,max)=>Math.max(min,Math.min(max,v)),lerp:(a,b,t)=>a+(b-a)*t,
 random:(min=0,max=1)=>min+Math.random()*(max-min),randomInt:(min,max)=>Math.floor(game.random(min,max+1)),choice:items=>{items=plain(items);return items[Math.floor(Math.random()*items.length)]},
  key:k=>!!keys[k],keyPressed:k=>!!pressed[k],onKey:f=>keyCallback=keep(f),onUpdate:f=>update=keep(f),onDraw:f=>draw=keep(f),onClick:f=>click=keep(f),
  burst:(x,y,count=20,color='#ffd36b')=>{for(let i=0;i<Math.min(200,count);i++)if(particles.length<2000)particles.push({x,y,vx:game.random(-150,150),vy:game.random(-180,80),life:1,color})},
  drawParticles:(dt=game.dt)=>{particles=particles.filter(p=>p.life>0);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;p.life-=dt;game.circle(p.x,p.y,Math.max(0,3*p.life),p.color)}},
  tween:(object,property,to,seconds)=>{const from=object[property],start=elapsed;const t=game.every(.016,()=>{const ratio=game.clamp((elapsed-start)/Math.max(.001,seconds),0,1);object[property]=game.lerp(from,to,ratio);if(ratio>=1)game.cancel(t)});return t},
 after:(seconds,f)=>{const t={at:elapsed+seconds,fn:keep(f),repeat:0};timers.push(t);return t},every:(seconds,f)=>{const t={at:elapsed+seconds,fn:keep(f),repeat:Math.max(.016,seconds)};timers.push(t);return t},cancel:t=>timers=timers.filter(x=>x!==t),
 setScore:v=>score=v,addScore:(n=1)=>score+=n,getScore:()=>score,
 button:(id,label,f)=>{buttons[id]=keep(f);send('button',{id:String(id),label:String(label)})},
 sound:(frequency=440,seconds=.12)=>send('sound',{frequency,seconds}),
 log:(...args)=>send('log',{message:args.map(String).join(' ')}),
 scene:(name,f)=>{if(f)events['scene:'+name]=keep(f);else{scene=name;if(events['scene:'+name])events['scene:'+name]()}},getScene:()=>scene,
 end:(text='ゲーム終了')=>{react.stop();send('log',{message:text})}
 };
 const react={start:(id)=>{if(id){send('control',{action:'start',target:String(id)});return}running=true;send('status',{message:'実行中'})},stop:(id)=>{if(id){send('control',{action:'stop',target:String(id)});return}running=false;send('status',{message:'停止中'})},on:(name,f)=>events[name]=keep(f),emit:name=>{if(events[name])events[name]()},isRunning:()=>running};
 self.game=game;self.react=react;
 let python=null,busy=false;
 async function init(data){game.width=data.width;game.height=data.height;running=true;try{
  if(data.language==='python'){
   send('loading',{message:'Pythonを準備中（初回は時間がかかります）'});
   importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');
   python=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'});
   python.setStdout({batched:message=>send('log',{message})});
   await python.runPythonAsync('from js import game, react\n');
   await python.runPythonAsync(data.code,{filename:'game.py'});
  }else{new Function('game','react',data.code+'\n//# sourceURL=game.js')(game,react)}
  send('ready',{running});send('frame',{commands});commands=[];
 }catch(e){error(e)}}
 self.onmessage=async({data})=>{try{
  if(data.type==='init'){await init(data);return}
  if(data.type==='input'){for(const k of Object.keys(data.keys))if(data.keys[k]&&!keys[k]){pressed[k]=true;if(keyCallback)keyCallback(k)}keys=data.keys;Object.assign(pointer,data.pointer);return}
  if(data.type==='click'){Object.assign(pointer,data.pointer);if(click)click(pointer.x,pointer.y);return}
  if(data.type==='button'){if(buttons[data.id])buttons[data.id]();send('frame',{commands});commands=[];return}
  if(data.type==='action'){if(data.action==='start')react.start();else if(data.action==='stop')react.stop();else react.emit(data.name);return}
  if(data.type==='tick'){
   if(running&&!busy){busy=true;const dt=Math.min(.05,data.dt);game.dt=dt;elapsed+=dt;game.time=elapsed;for(const t of [...timers])if(elapsed>=t.at){if(t.repeat)t.at=elapsed+t.repeat;else game.cancel(t);t.fn()}if(update)update(dt);if(draw)draw();send('frame',{commands});commands=[];busy=false}
   pressed={};send('alive');
  }
 }catch(e){busy=false;error(e);send('alive')}};
}

function studioPlayer(config,workerSource){
 const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),status=document.querySelector('#runtimeStatus'),controls=document.querySelector('#runtimeButtons');
 canvas.width=config.width;canvas.height=config.height;let worker,blobUrl,timeout,watchdog,pending=false,ready=false,last=performance.now(),keys={},pointer={x:0,y:0,down:false},images=new Map(),audio;
 const report=data=>{parent.postMessage({studioCode:true,token:config.token,...data},'*');if(data.message)status.textContent=data.message};
 function stop(){clearTimeout(timeout);clearTimeout(watchdog);if(worker)worker.terminate();worker=null;ready=false;if(blobUrl)URL.revokeObjectURL(blobUrl);pending=false}
 function launch(){stop();controls.replaceChildren();ctx.clearRect(0,0,canvas.width,canvas.height);blobUrl=URL.createObjectURL(new Blob(['('+workerSource+')()'],{type:'text/javascript'}));worker=new Worker(blobUrl);report({type:'status',message:'準備中'});
  timeout=setTimeout(()=>{stop();report({type:'error',message:'実行が完了しませんでした。無限ループ、またはPythonの読み込みを確認してください。',line:null})},config.language==='python'?90000:2500);
  worker.onmessage=({data})=>{
   if(data.type==='ready'){ready=true;clearTimeout(timeout);pending=false;last=performance.now();report({type:'ready',message:data.running?'実行中':'停止中'});return}
   if(data.type==='alive'){pending=false;clearTimeout(watchdog);return}
   if(data.type==='frame'){render(data.commands);return}
   if(data.type==='button'){let b=document.createElement('button');b.textContent=data.label;b.onclick=()=>{unlockAudio();worker?.postMessage({type:'button',id:data.id})};controls.append(b);return}
   if(data.type==='control'){if(data.target===config.programId){worker?.postMessage({type:'action',action:data.action})}else report(data);return}
   if(data.type==='sound'){if(audio){const osc=audio.createOscillator(),gain=audio.createGain();osc.frequency.value=Math.max(20,Math.min(18000,data.frequency));gain.gain.value=.07;osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+Math.max(.01,Math.min(3,data.seconds)))}return}
   if(data.type==='error'){clearTimeout(timeout);clearTimeout(watchdog)}report(data);
  };worker.onerror=e=>{stop();report({type:'error',message:e.message,line:null})};worker.postMessage({type:'init',...config});
 }
 function unlockAudio(){try{audio??=new AudioContext();audio.resume()}catch{}}
 function render(commands){for(const [op,...a] of commands){try{switch(op){case'clear':ctx.fillStyle=a[0];ctx.fillRect(0,0,canvas.width,canvas.height);break;case'rect':ctx.fillStyle=a[4];ctx.fillRect(...a.slice(0,4));break;case'circle':ctx.fillStyle=a[3];ctx.beginPath();ctx.arc(a[0],a[1],Math.max(0,a[2]),0,Math.PI*2);ctx.fill();break;case'line':ctx.strokeStyle=a[4];ctx.lineWidth=a[5];ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(a[2],a[3]);ctx.stroke();break;case'text':ctx.fillStyle=a[4];ctx.font=a[3]+'px system-ui';ctx.fillText(a[0],a[1],a[2]);break;case'image':{const url=a[0];if(!/^(https?:|data:image\/(png|jpeg|webp|gif);base64,)/i.test(url))break;let img=images.get(url);if(!img){img=new Image();img.src=url;images.set(url,img)}if(img.complete&&img.naturalWidth)ctx.drawImage(img,...a.slice(1));break}}}catch(e){report({type:'error',message:'描画エラー: '+e.message,line:null})}}}
 function input(){worker?.postMessage({type:'input',keys,pointer})}
 canvas.onpointerdown=e=>{unlockAudio();canvas.focus();canvas.setPointerCapture(e.pointerId);const r=canvas.getBoundingClientRect();pointer={x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height,down:true};input();worker?.postMessage({type:'click',pointer})};canvas.onpointermove=e=>{const r=canvas.getBoundingClientRect();pointer.x=(e.clientX-r.left)*canvas.width/r.width;pointer.y=(e.clientY-r.top)*canvas.height/r.height;input()};canvas.onpointerup=canvas.onpointercancel=()=>{pointer.down=false;input()};
 canvas.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();keys[e.key]=true;input()};canvas.onkeyup=e=>{keys[e.key]=false;input()};window.onblur=()=>{keys={};pointer.down=false;input()};
 document.querySelector('#runtimeStart').onclick=()=>launch();document.querySelector('#runtimeStop').onclick=()=>{stop();report({type:'status',message:'停止中'})};
 window.addEventListener('message',e=>{if(e.source!==parent||!e.data?.studioAction)return;if(e.data.target&&e.data.target!==config.programId)return;worker?.postMessage({type:'action',action:e.data.action,name:e.data.name})});
 function frame(now){if(worker&&ready&&!pending){pending=true;worker.postMessage({type:'tick',dt:(now-last)/1000});watchdog=setTimeout(()=>{stop();report({type:'error',message:'処理が2秒以上応答しません。whileループなどを確認してください。',line:null})},2500)}last=now;requestAnimationFrame(frame)}
 window.addEventListener('pagehide',stop);launch();requestAnimationFrame(frame);
}

function codeDocument(e,token=''){
 const config={code:e.code||'',language:e.language==='python'?'python':'javascript',programId:e.programId||'game1',width:800,height:500,token};
 const json=JSON.stringify(config).replace(/</g,'\\u003c');
 return '<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#111629;color:#eef;font:14px system-ui}header{display:flex;gap:8px;align-items:center;padding:8px;flex-wrap:wrap}button{padding:7px 12px;border:0;border-radius:5px;cursor:pointer}#runtimeStatus{font-size:12px;flex:1}canvas{display:block;width:100%;height:auto;touch-action:none}#runtimeButtons{display:flex;gap:8px;padding:8px;flex-wrap:wrap}</style><header><button id="runtimeStart">再実行</button><button id="runtimeStop">停止</button><span id="runtimeStatus">準備中</span></header><canvas tabindex="0" aria-label="コードゲーム"></canvas><div id="runtimeButtons"></div><script>('+studioPlayer.toString()+')('+json+','+JSON.stringify(studioWorker.toString()).replace(/</g,'\\u003c')+');<\/script></html>';
}

function routePrograms(){
 const frames=[...document.querySelectorAll('.code-game-frame')];
 function route(action,target,name){for(const frame of frames)frame.contentWindow.postMessage({studioAction:true,action,target,name},'*')}
 document.querySelectorAll('[data-studio-action]').forEach(button=>button.addEventListener('click',()=>{const action=button.dataset.studioAction,target=button.dataset.studioTarget;route(action,action==='event'?'':target,action==='event'?target:'')}));
 window.addEventListener('message',e=>{if(!frames.some(f=>f.contentWindow===e.source)||!e.data?.studioCode||e.data.type!=='control')return;if(['start','stop'].includes(e.data.action))route(e.data.action,String(e.data.target),'')});
}
