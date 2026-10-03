const codeSamples={javascript:`const player = game.sprite({x: 360, y: 220, w: 40, h: 40});

game.onUpdate((dt) => {
  if (game.key("ArrowLeft")) player.x -= 240 * dt;
  if (game.key("ArrowRight")) player.x += 240 * dt;
  if (game.key("ArrowUp")) player.y -= 240 * dt;
  if (game.key("ArrowDown")) player.y += 240 * dt;
  game.bounds(player);
});

game.onDraw(() => {
  game.clear("#151b32");
  game.text("画面をクリック → 矢印キーで移動", 24, 40, 24);
  game.drawSprites();
  game.text("スコア: " + game.getScore(), 24, 80);
});

game.onClick((x, y) => {
  game.addScore(1);
  game.sound(660, 0.1);
});
game.button("pause", "停止", () => react.stop());
game.button("play", "開始", () => react.start());
react.on("boost", () => { player.x += 30; });`,python:`player = game.sprite({"x": 360, "y": 220, "w": 40, "h": 40})

def update(dt):
    if game.key("ArrowLeft"):
        player.x -= 240 * dt
    if game.key("ArrowRight"):
        player.x += 240 * dt
    if game.key("ArrowUp"):
        player.y -= 240 * dt
    if game.key("ArrowDown"):
        player.y += 240 * dt
    game.bounds(player)

def draw():
    game.clear("#151b32")
    game.text("画面をクリック → 矢印キーで移動", 24, 40, 24)
    game.drawSprites()
    game.text("スコア: " + str(game.getScore()), 24, 80)

def clicked(x, y):
    game.addScore(1)
    game.sound(660, 0.1)

game.onUpdate(update)
game.onDraw(draw)
game.onClick(clicked)
game.button("pause", "停止", lambda: react.stop())
game.button("play", "開始", lambda: react.start())
react.on("boost", lambda: game.move(player, 30, 0))`};

const apiGuide=[
 ['入力欄','game.input(id,label,value) / getInput(id)','入力欄を作成。getInputは現在の値を必ず文字列で返します。HTMLページの入力欄も同じIDで取得できます（ページ全体のプレビュー）。'],
 ['入力の変更','game.onInput(id,callback) / setInput(id,value)','入力のたびにcallbackへ最新の文字列を渡します。setInputで値を変更。値は実行中に保持され、再読み込みではリセットされます。'],
 ['描画','game.clear(color) / background(color)','背景を塗る。onDraw内で毎フレーム呼びます。'],
 ['描画','game.rect(x,y,w,h,color) / circle(x,y,r,color)','四角形・円を描く。色はCSS形式。'],
 ['描画','game.text(text,x,y,size=24,color="#fff")','文字を描く。座標は800×500のゲーム内座標。'],
 ['描画','game.line(x,y,x2,y2,color,width) / image(url,x,y,w,h)','線と画像。画像URLはHTTPSまたは画像のdata URL。'],
 ['キャラクター','game.sprite(options)','x,y,w,h,vx,vy,gravity,color,image,tag,visibleを指定。Pythonは辞書を渡せます。'],
 ['キャラクター','game.move(sprite,dx,dy) / remove(sprite)','移動・削除。返されたsprite.xなどを直接変更できます。'],
 ['キャラクター','game.drawSprite(sprite) / drawSprites() / sprites()','描画・全キャラ描画・キャラ一覧。'],
 ['物理','game.physics(dt) / bounds(sprite,bounce=false)','速度・重力の反映／画面端制限。bounce=trueで反射。'],
 ['当たり判定','game.collides(a,b) / hit(x,y,sprite)','矩形同士・点と矩形の当たり判定。'],
 ['当たり判定','game.circleHit(x,y,r,x2,y2,r2)','円同士の当たり判定。'],
 ['入力','game.key("ArrowLeft") / game.mouse.x,y,down','キーの押下状態とポインター。最初にゲーム画面をクリック。'],
 ['入力','game.onClick(callback)','クリック・タッチ時にcallback(x,y)。'],
 ['入力','game.keyPressed(key) / onKey(callback)','押した瞬間だけtrue／新たな押下時にcallback(key)。'],
 ['演出','game.burst(x,y,count=20,color) / drawParticles(dt)','粒子を発生／毎フレーム更新して描画。'],
 ['演出','game.tween(sprite,"x",to,seconds)','指定プロパティを時間をかけて変化。戻り値はcancelで解除可能。'],
 ['時間','game.onUpdate(callback) / onDraw(callback)','毎フレームcallback(dt)で更新／callback()で描画。'],
 ['時間','game.dt / time / width / height','前フレームとの秒差・経過秒・画面幅・高さ。'],
 ['時間','game.after(seconds,callback) / every(seconds,callback)','ゲーム実行中のタイマー。返り値をgame.cancel(timer)で解除。'],
 ['計算','game.random(min,max) / randomInt(min,max) / choice(list)','乱数・整数乱数・ランダム選択。'],
 ['計算','game.clamp(value,min,max) / lerp(a,b,t) / distance(x,y,x2,y2)','範囲制限・補間・距離。'],
 ['スコア','game.setScore(value) / addScore(value=1) / getScore()','得点を設定・加算・取得。'],
 ['音','game.sound(frequency=440,seconds=0.12)','短い電子音。初回のクリック後に鳴ります。'],
 ['ボタン','game.button(id,label,callback)','ゲーム下部にボタンを作成し、クリックでコードを実行。'],
 ['シーン','game.scene(name,callback) / scene(name) / getScene()','シーン初期化を登録・実行・現在の名前を取得。'],
 ['制御','react.start(id?) / stop(id?) / isRunning()','react.start("game1")で指定IDを開始。ID省略は自分自身。停止は一時停止、開始は再開。Reactライブラリとは別の専用API。'],
 ['制御','react.on(name,callback) / emit(name)','イベントを登録・発火。ページのボタンからも呼び出せます。'],
 ['その他','game.log(value) / end(message)','ログを表示／ゲームを停止してメッセージ表示。']
];
let codeTarget=null,codeToken='',liveTimer=null,codeCheckpoint=false;
function openCodeEditor(){const e=current();if(e?.type!=='code')return;codeTarget=e.id;codeCheckpoint=false;$('codeLanguage').value=e.language||'javascript';$('codeSource').value=e.code||'';$('codeDialog').showModal();codeLines();runCode()}
function codeElement(){return state.elements.find(e=>e.id===codeTarget)}
function saveCode(){const e=codeElement();if(!e)return;if(!codeCheckpoint){checkpoint();codeCheckpoint=true}e.code=$('codeSource').value;e.language=$('codeLanguage').value;}
function codeLines(errorLine=null,message=''){
 const lines=$('codeSource').value.split('\n');$('codeNumbers').replaceChildren();
 lines.forEach((text,i)=>{const row=document.createElement('div');row.textContent=i+1;if(i+1===errorLine){row.className='line-error';row.title=message} $('codeNumbers').append(row)});
 $('codeErrorLine').hidden=!errorLine;if(errorLine){$('codeErrorLine').style.top=((errorLine-1)*22)+'px';$('codeErrorLine').title=message;$('codeErrorLine').textContent=message.split('\n').filter(Boolean).at(-1)}
 $('codeIssue').hidden=!message;$('codeIssue').textContent=message?(errorLine?'行 '+errorLine+'：':'')+message:'';
 $('codeIssue').onclick=()=>{if(!errorLine)return;const pos=lines.slice(0,errorLine-1).reduce((n,s)=>n+s.length+1,0);$('codeSource').focus();$('codeSource').setSelectionRange(pos,pos+lines[errorLine-1].length);$('codeSource').scrollTop=Math.max(0,(errorLine-4)*22);syncCodeScroll()};
 syncCodeScroll();
}
function syncCodeScroll(){$('codeNumbers').scrollTop=$('codeSource').scrollTop;$('codeOverlay').style.transform='translateY(-'+$('codeSource').scrollTop+'px)'}
function runCode(){clearTimeout(liveTimer);const e=codeElement();if(!e)return;saveCode();codeToken=crypto.randomUUID();codeLines();$('codeLog').textContent='';
 if(e.language!=='python'){try{acorn.parse(e.code,{ecmaVersion:'latest',allowReturnOutsideFunction:true})}catch(error){$('codeLive').srcdoc='';codeLines(error.loc?.line,error.message);$('codeState').textContent='構文エラー';return}}
 $('codeState').textContent=e.language==='python'?'Pythonを準備中':'実行中';$('codeLive').srcdoc=codeDocument(e,codeToken);
}
window.addEventListener('message',ev=>{if(ev.source!==$('codeLive').contentWindow||!ev.data?.studioCode||ev.data.token!==codeToken)return;const data=ev.data;
 if(data.type==='error'){codeLines(data.line,data.message);$('codeState').textContent='エラー';$('codeLog').textContent=data.detail||data.message}
 else if(data.type==='log'){$('codeLog').textContent=($('codeLog').textContent+'\n'+data.message).slice(-12000)}
 else if(data.message)$('codeState').textContent=data.message;
});
$('codeSource').addEventListener('input',()=>{saveCode();codeLines();clearTimeout(liveTimer);if($('codeAuto').checked)liveTimer=setTimeout(runCode,650)});
$('codeSource').addEventListener('scroll',syncCodeScroll);
$('codeSource').addEventListener('keydown',ev=>{if(ev.key==='Tab'){ev.preventDefault();const t=ev.target;t.setRangeText('    ',t.selectionStart,t.selectionEnd,'end');t.dispatchEvent(new Event('input'))}if((ev.ctrlKey||ev.metaKey)&&ev.key==='Enter'){ev.preventDefault();runCode()}});
$('codeLanguage').onchange=()=>{saveCode();runCode()};$('codeRun').onclick=runCode;
$('codeStop').onclick=()=>{clearTimeout(liveTimer);$('codeLive').srcdoc='';$('codeState').textContent='停止中'};
$('codeAuto').onchange=()=>{clearTimeout(liveTimer);if($('codeAuto').checked)runCode()};
$('codeExample').onclick=()=>{$('codeSource').value=codeSamples[$('codeLanguage').value];saveCode();runCode()};
$('codeClose').onclick=()=>{$('codeDialog').close()};$('codeDialog').addEventListener('close',()=>{clearTimeout(liveTimer);saveCode();$('codeLive').srcdoc='';codeTarget=null;render();inspect()});
$('editCode').onclick=openCodeEditor;
$('codeExport').onclick=()=>{saveCode();download('game.html',codeDocument(codeElement()),'text/html;charset=utf-8')};
for(const [group,signature,description] of apiGuide){const row=document.createElement('div');row.className='api-row';const label=document.createElement('b');label.textContent=group;const code=document.createElement('code');code.textContent=signature;const p=document.createElement('p');p.textContent=description;row.append(label,code,p);$('apiList').append(row)}
$('apiSearch').oninput=()=>{const q=$('apiSearch').value.toLowerCase();$('apiList').querySelectorAll('.api-row').forEach(r=>r.hidden=!r.textContent.toLowerCase().includes(q))};
for(const key of ['buttonAction','buttonEvent'])$(key).onchange=()=>{const e=current();if(e?.type!=='button')return;checkpoint();e[key]=$(key).value;render();inspect()};
$('programId').onchange=()=>{const e=current();if(e?.type!=='code')return;const id=$('programId').value.trim();if(!/^[a-zA-Z0-9_-]{1,40}$/.test(id)||state.elements.some(other=>other!==e&&other.programId===id)){toast('IDは重複しない英数字・ハイフン・_（40文字以内）にしてください');inspect();return}checkpoint();e.programId=id;render();inspect()};
