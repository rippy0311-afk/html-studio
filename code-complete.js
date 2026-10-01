const completions=[
 ['clear','color','#151b32','背景を塗る'],['background','color','#151b32','背景色'],['rect','x,y,w,h,color','40,40,80,50,"#80f0d0"','四角形'],['circle','x,y,r,color','100,100,25,"#ffd36b"','円'],['line','x,y,x2,y2,color,width','0,0,100,100,"#fff",2','線'],['text','text,x,y,size,color','"Hello",20,40,24,"#fff"','文字'],['image','url,x,y,w,h','"https://",0,0,100,100','画像'],
 ['sprite','options','','キャラクターを作成'],['remove','sprite','player','キャラクターを削除'],['move','sprite,dx,dy','player,10,0','移動'],['drawSprite','sprite','player','キャラクター描画'],['drawSprites','','','全キャラクター描画'],['sprites','','','キャラクター一覧'],['physics','dt','game.dt','速度と重力を更新'],['bounds','sprite,bounce','player','枠内に収める'],['collides','a,b','player,enemy','矩形の当たり判定'],['circleHit','x,y,r,x2,y2,r2','0,0,10,20,20,10','円の当たり判定'],['hit','x,y,sprite','game.mouse.x,game.mouse.y,player','点の当たり判定'],
 ['key','key','"ArrowLeft"','押されているキー'],['keyPressed','key','" "','押した瞬間のキー'],['onKey','callback','','キーイベント'],['onClick','callback','','クリックイベント'],['onUpdate','callback','','毎フレーム更新'],['onDraw','callback','','毎フレーム描画'],['after','seconds,callback','','指定秒後に実行'],['every','seconds,callback','','繰り返し実行'],['cancel','timer','timer','タイマー解除'],['setScore','value','0','スコア設定'],['addScore','value','1','スコア加算'],['getScore','','','スコア取得'],['sound','frequency,seconds','660,0.1','電子音'],['button','id,label,callback','','ボタン作成'],['scene','name,callback','"title"','シーン切り替え'],['getScene','','','現在のシーン'],['end','message','"ゲーム終了"','ゲーム終了'],['log','value','"Hello"','ログ出力'],['random','min,max','0,100','乱数'],['randomInt','min,max','1,6','整数乱数'],['choice','list','[1,2,3]','ランダム選択'],['clamp','value,min,max','value,0,100','範囲制限'],['lerp','a,b,t','0,100,0.5','補間'],['distance','x,y,x2,y2','0,0,100,100','距離'],['burst','x,y,count,color','100,100,20,"#ffd36b"','粒子を発生'],['drawParticles','dt','game.dt','粒子を更新・描画'],['tween','sprite,property,to,seconds','player,"x",300,1','アニメーション'],
 ...['width','height','dt','time','mouse'].map(n=>[n,null,'',{width:'画面幅',height:'画面高さ',dt:'フレーム間の秒数',time:'経過秒',mouse:'ポインター座標と状態'}[n]])
].map(([name,args,value,description])=>({owner:'game',name,args,value,description}));
completions.push(...[['start','id','"game1"','指定IDを開始・再開（省略は自分）'],['stop','id','"game1"','指定IDを停止（省略は自分）'],['isRunning','','','実行状態'],['on','name,callback','','イベント登録'],['emit','name','"boost"','イベント発火']].map(([name,args,value,description])=>({owner:'react',name,args,value,description})),...['x','y','down'].map(name=>({owner:'game.mouse',name,args:null,value:'',description:'ポインターの'+name})));
const suggest=document.createElement('div');suggest.id='codeSuggestions';suggest.hidden=true;suggest.setAttribute('role','listbox');suggest.setAttribute('aria-label','コード入力候補');$('codeSource').parentElement.append(suggest);$('codeSource').setAttribute('aria-autocomplete','list');$('codeSource').setAttribute('aria-controls','codeSuggestions');
let choices=[],choiceIndex=0,replaceStart=0,replaceEnd=0;
function hideSuggestions(){suggest.hidden=true;$('codeSource').removeAttribute('aria-activedescendant')}
const languageCompletions={
 javascript:[['const','const value = 0;','定数を宣言'],['let','let value = 0;','変数を宣言'],['function','function update(dt) {\n  \n}','関数を定義'],['if','if (condition) {\n  \n}','条件分岐'],['else','else {\n  \n}','それ以外'],['for','for (let i = 0; i < 10; i++) {\n  \n}','繰り返し'],['while','while (condition) {\n  \n}','条件付き繰り返し'],['return','return ','戻り値'],['true','true','真'],['false','false','偽'],['Math.random','Math.random()','0以上1未満の乱数'],['Math.floor','Math.floor(value)','切り捨て'],['Math.sin','Math.sin(angle)','サイン'],['console.log','console.log(value)','ログ出力']],
 python:[['def','def update(dt):\n    pass','関数を定義'],['if','if condition:\n    pass','条件分岐'],['elif','elif condition:\n    pass','追加の条件'],['else','else:\n    pass','それ以外'],['for','for i in range(10):\n    pass','繰り返し'],['while','while condition:\n    pass','条件付き繰り返し'],['return','return ','戻り値'],['lambda','lambda: None','短い関数'],['True','True','真'],['False','False','偽'],['None','None','値なし'],['print','print(value)','ログ出力'],['range','range(10)','連番'],['len','len(items)','長さ'],['int','int(value)','整数に変換'],['str','str(value)','文字列に変換'],['list','list(items)','リストに変換']]
};
function completionText(c){if(c.insert!==undefined)return c.insert;const py=$('codeLanguage').value==='python';if(c.args===null)return c.name;let value=c.value;
 if(c.name==='clear'||c.name==='background')value='"#151b32"';
 if(c.name==='sprite')value=py?'{"x": 100, "y": 100, "w": 40, "h": 40}':'{x: 100, y: 100, w: 40, h: 40}';
 if(c.args.includes('callback')){
  const callback=py?'lambda: None':'() => {\n  \n}';
  if(c.name==='onUpdate')value=py?'update':'(dt) => {\n  \n}';
  else if(c.name==='onDraw')value=py?'draw':callback;
  else if(c.name==='onClick')value=py?'on_click':'(x, y) => {\n  \n}';
  else if(c.name==='onKey')value=py?'on_key':'(key) => {\n  \n}';
  else if(['after','every'].includes(c.name))value='1, '+callback;
  else if(c.name==='button')value=py?'"start", "開始", lambda: react.start("game1")':'"start", "開始", () => react.start("game1")';
  else if(c.name==='on')value='"boost", '+callback;
 }
 return c.name+'('+value+')';
}
function acceptSuggestion(){const c=choices[choiceIndex];if(!c)return;const t=$('codeSource');t.focus();t.setRangeText(completionText(c),replaceStart,replaceEnd,'end');hideSuggestions();t.dispatchEvent(new Event('input'));hideSuggestions()}
function paintSuggestions(){suggest.replaceChildren();choices.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.id='codeChoice'+i;b.setAttribute('role','option');b.setAttribute('aria-selected',String(i===choiceIndex));b.className=i===choiceIndex?'active':'';const strong=document.createElement('strong');strong.textContent=c.name+(c.args===null?'':'('+c.args+')');const description=document.createElement('span');description.textContent=c.description;b.append(strong,description);b.onmousedown=ev=>ev.preventDefault();b.onclick=()=>{choiceIndex=i;acceptSuggestion()};suggest.append(b)});$('codeSource').setAttribute('aria-activedescendant','codeChoice'+choiceIndex);suggest.children[choiceIndex]?.scrollIntoView({block:'nearest'})}
function showSuggestions(force=false){
 const t=$('codeSource');if(t.selectionStart!==t.selectionEnd){hideSuggestions();return}
 const before=t.value.slice(0,t.selectionStart),props=(typeof pythonImportSuggestions==='function'?pythonImportSuggestions(t.value,t.selectionStart):null)|| (typeof propertySuggestions==='function'?propertySuggestions(t.value,t.selectionStart):null);
 if(!props&&typeof scanArguments==='function'){const context=scanArguments(before);if(context.quote||context.comment){hideSuggestions();return}}
 const match=before.match(/\b(game\.mouse|game|react)\.([a-zA-Z]*)$/);let prefix='';
 if(props){choices=props.choices;replaceStart=props.start;replaceEnd=props.end}
 else{
  if(match){prefix=match[2];choices=completions.filter(c=>c.owner===match[1])}
  else{const word=before.match(/(?:^|[^\w.])([a-zA-Z_][\w.]*)$/);if(!word&&!force){hideSuggestions();return}prefix=word?.[1]||'';choices=languageCompletions[$('codeLanguage').value].map(([name,insert,description])=>({name,insert,description,args:null}));choices.push(...['game','react'].map(name=>({name,insert:name+'.',description:'ゲーム用API',args:null})));const declared=$('codeLanguage').value==='python'?/\b(?:def\s+([a-zA-Z_]\w*)|([a-zA-Z_]\w*)\s*=(?!=))/g:/\b(?:const|let|var|function)\s+([a-zA-Z_$][\w$]*)/g;for(const item of t.value.matchAll(declared)){const name=item[1]||item[2];if(!choices.some(c=>c.name===name))choices.push({name,insert:name,description:'このコードで定義',args:null})}}
  choices=choices.filter(c=>c.name.toLowerCase().startsWith(prefix.toLowerCase()));replaceStart=t.selectionStart-prefix.length;replaceEnd=t.selectionStart;
 }
 if(!choices.length){hideSuggestions();return}choiceIndex=0;suggest.hidden=false;const line=before.split('\n').length-1;const y=(line+1)*22-t.scrollTop;suggest.style.top=Math.max(0,Math.min(t.clientHeight-150,y))+'px';paintSuggestions();
}
$('codeSource').addEventListener('input',ev=>{if(!ev.isComposing)showSuggestions()});$('codeSource').addEventListener('compositionend',()=>showSuggestions());
$('codeSource').addEventListener('keydown',ev=>{if(ev.isComposing)return;if((ev.ctrlKey||ev.metaKey)&&ev.code==='Space'){ev.preventDefault();ev.stopImmediatePropagation();showSuggestions(true);return}if(suggest.hidden||ev.ctrlKey||ev.metaKey||ev.altKey)return;if(['ArrowDown','ArrowUp','Enter','Tab','Escape'].includes(ev.key)){ev.preventDefault();ev.stopImmediatePropagation();if(ev.key==='Escape')hideSuggestions();else if(ev.key==='Enter'||ev.key==='Tab')acceptSuggestion();else{choiceIndex=(choiceIndex+(ev.key==='ArrowDown'?1:-1)+choices.length)%choices.length;paintSuggestions()}}},true);
$('codeSource').addEventListener('click',()=>showSuggestions());$('codeSource').addEventListener('scroll',hideSuggestions);$('codeSource').addEventListener('blur',()=>setTimeout(hideSuggestions,150));$('codeDialog').addEventListener('close',hideSuggestions);
