// Static editing helpers: never execute source to discover fields or values.
const spriteProperties=[
 ['x','number','0','横の位置'],['y','number','0','縦の位置'],['w','number','40','幅'],['h','number','40','高さ'],
 ['vx','number','0','横の速度（px/秒）'],['vy','number','0','縦の速度（px/秒）'],['gravity','number','0','重力（px/秒²）'],
 ['color','text','#80f0d0','色（色名・カラーコード）'],['image','text','','画像URL'],['tag','text','','識別用の名前'],['visible','boolean','true','表示するか']
].map(([name,type,value,description])=>({name,type,value,description,...argumentHelp(name,'sprite')}));

function argumentHelp(name,method,owner='game'){
 const properties={
  x:['ゲーム画面の左端からの横位置（px）。大きくすると右へ移動します。','100'],
  y:['ゲーム画面の上端からの縦位置（px）。大きくすると下へ移動します。','80'],
  w:['四角形・画像・キャラクターの横幅（px）。','40'],h:['四角形・画像・キャラクターの高さ（px）。','60'],
  vx:['横方向の速度（px/秒）。正は右、負は左。毎フレーム game.physics(dt) を呼ぶと移動します。','120 → 1秒で右へ120px'],
  vy:['縦方向の速度（px/秒）。正は下、負は上。毎フレーム game.physics(dt) を呼ぶと移動します。','-200 → 上向きに移動'],
  gravity:['縦の速度 vy を1秒ごとに変える量（px/秒²）。正は下向き、0は重力なし。game.physics(dt) で反映します。','600 → 下向きに加速'],
  color:['描画に使う色。色名や # から始まるカラーコードを入力します。','red / #80f0d0'],
  image:['キャラクターに表示する画像のURL。空欄なら color の四角形で描画します。','https://example.com/hero.png'],
  tag:['キャラクターを見分けるための名前。自分のコードで分類に使えます。名前だけで動作は変わりません。','player / enemy'],
  visible:['true（PythonはTrue）で描画、false（False）で非表示。非表示でも移動計算や当たり判定は続きます。','true / false'],
  x2:['2つ目の点の横位置（px）。画面の左端から測ります。','300'],y2:['2つ目の点の縦位置（px）。画面の上端から測ります。','200'],
  r:['円の中心から端までの距離（半径、px）。直径はこの2倍です。','25 → 直径50px'],r2:['2つ目の円の半径（px）。','20'],
  dx:['この呼び出しで横へ動かす距離（px）。正は右、負は左です。','10 → 右へ10px'],dy:['この呼び出しで縦へ動かす距離（px）。正は下、負は上です。','-10 → 上へ10px'],
  width:['線の太さ（px）。','2'],size:['描く文字の大きさ（px）。','24'],
  text:['ゲーム画面に描く文字。引用符は入力欄側で自動的に付きます。','スコア: 10'],url:['表示する画像のURL。HTTPSの画像URLなどを指定します。','https://example.com/bg.png'],
  sprite:['操作するキャラクター。game.sprite(...) の戻り値を保存した変数名を「式」で指定します。','player'],
  dt:['前回のフレームから経過した秒数。速度をフレーム間隔に合わせるために使います。','game.dt または更新関数の dt'],
  bounce:['trueで画面端に当たったとき速度を反転。falseでは端の位置に収めるだけです。','true → 跳ね返る'],
  key:['調べるキーの名前。左右上下は ArrowLeft など、スペースは半角空白1文字です。','ArrowLeft / ArrowRight / a'],
  timer:['止めたいタイマー。game.after / every / tween の戻り値を保存した変数です。','timer'],
  frequency:['音の高さ（Hz）。大きいほど高い音になります。','440'],
  label:['ゲーム下に作るボタンに表示する文字です。','スタート'],
  message:['ゲーム終了時にログと状態欄へ表示するメッセージです。','ゲームクリア！'],
  list:['選ぶ候補の一覧を「式」で入力。リストから1つをランダムに選びます。','[1, 2, 3]'],
  property:['アニメーションで変えるプロパティ名。x、y、w、hなど数値の項目を指定します。','x'],
  to:['アニメーションの終了時に、そのプロパティが到達する値です。','300'],
  t:['aからbへ進む割合。0でa、1でb、0.5で中間になります。','0.5'],
  count:['発生させる粒子の数。1回あたり最大200個です。','20']
 };
 let entry=properties[name];
 if(name==='x'||name==='y'){
  const base=properties[name][0];const position=['circle','circleHit'].includes(method)?'円の中心':method==='text'?(name==='x'?'文字の描画開始位置':'文字のベースライン（文字の下側の基準線）'):['line','distance'].includes(method)?'1つ目の点':method==='hit'?'判定する点':method==='burst'?'粒子の発生位置':'左上の位置';entry=[base+' この関数では'+position+'を指定します。',properties[name][1]];
 }
 if(name==='a'||name==='b')entry=method==='collides'?[(name==='a'?'1つ目':'2つ目')+'のキャラクター。2つの四角い範囲が重なるか判定します。',name==='a'?'player':'enemy']:[name==='a'?'補間の開始値。tが0のときの値です。':'補間の終了値。tが1のときの値です。',name==='a'?'0':'100'];
 if(name==='id')entry=owner==='react'?['開始・停止するプログラムのID。右パネルの「プログラムID」と一致させます。引数省略なら自分自身です。','game1']:['ボタンを識別する名前。同じIDで登録すると、そのボタンの処理が置き換わります。','start'];
 if(name==='name')entry=method==='scene'?['シーンの名前。callbackと一緒に渡すと登録、名前だけならそのシーンへ切り替えます。','title / play']:['イベントの名前。react.onで登録した名前とreact.emitで呼ぶ名前を合わせます。','boost'];
 if(name==='seconds')entry=[method==='sound'?'音を鳴らす長さ（秒）。':method==='every'?'繰り返す間隔（秒）。':method==='after'?'処理を実行するまでの待ち時間（秒）。':'アニメーションが完了するまでの時間（秒）。',method==='sound'?'0.1':'1.5'];
 if(name==='min'||name==='max')entry=[method==='clamp'?(name==='min'?'値が下回らないようにする下限です。':'値が超えないようにする上限です。'):(name==='min'?'乱数の下限。この値を含みます。':method==='randomInt'?'整数乱数の上限。この値を含みます。':'乱数の上限。この値は含みません。'),name==='min'?'0':'100'];
 if(name==='value')entry=method==='setScore'?['スコアをこの値に設定します。','0']:method==='addScore'?['スコアに加える点数。負の数なら減点です。','10']:method==='clamp'?['上下限の範囲内に収めたい数値です。','150']:['実行ログに表示する内容。計算結果や変数は「式」で指定できます。','動作確認'];
 if(name==='callback'){
  const timing={onUpdate:'毎フレームの更新時に呼ばれ、経過秒 dt を受け取ります。',onDraw:'毎フレームの描画時に呼ばれます。引数はありません。',onClick:'ゲーム画面のクリック時に呼ばれ、xとyを受け取ります。',onKey:'キーを押した瞬間に呼ばれ、キーの名前を受け取ります。',button:'ボタンを押したときに呼ばれます。',after:'指定した秒数の後に1回呼ばれます。',every:'指定した間隔で繰り返し呼ばれます。',scene:'そのシーンへ切り替えたときに呼ばれます。',on:'同じ名前のイベントが発火したときに呼ばれます。'}[method]||'指定したタイミングで呼ばれます。';entry=['実行したい関数を「式」で指定。'+timing,'自分で定義した関数名（例: update）'];
 }
 return{detail:entry?.[0]||'この処理に渡す値です。',example:entry?.[1]||''};
}

function scanArguments(text){
 const stack=[],calls=[],commas=[],lambdas=[];let quote='',triple=false,comment='',escaped=false;
 for(let i=0;i<text.length;i++){
  const c=text[i],next=text[i+1];
  if(comment==='line'){if(c==='\n')comment='';continue}
  if(comment==='block'){if(c==='*'&&next==='/'){comment='';i++}continue}
  if(quote){if(escaped){escaped=false;continue}if(c==='\\'){escaped=true;continue}if(c===quote){if(!triple)quote='';else if(text.slice(i,i+3)===quote.repeat(3)){quote='';i+=2}}continue}
  if(c==='"'||c==="'"||c==='`'){quote=c;triple=c!=='`'&&text.slice(i,i+3)===c.repeat(3);if(triple)i+=2;continue}
  if(c==='#'&&$('codeLanguage').value==='python'){comment='line';continue}
  if(c==='/'&&next==='/'&&$('codeLanguage').value!=='python'){comment='line';i++;continue}
  if(c==='/'&&next==='*'&&$('codeLanguage').value!=='python'){comment='block';i++;continue}
  if($('codeLanguage').value==='python'&&text.slice(i,i+6)==='lambda'&&!/[\w]/.test(text[i-1]||'')&&!/[\w]/.test(text[i+6]||''))lambdas.push(stack.length);
  if(c===':'&&lambdas.at(-1)===stack.length)lambdas.pop();
  if('([{'.includes(c)){const frame={char:c,open:i,close:null,parent:stack.at(-1)};if(c==='('){const m=text.slice(0,i).match(/\b(game|react)\.([A-Za-z]+)\s*$/);if(m){frame.owner=m[1];frame.name=m[2];calls.push(frame)}}stack.push(frame)}
  else if(')]}'.includes(c)){const frame=stack.at(-1);if(frame&&'([{'.indexOf(frame.char)===')]}'.indexOf(c)){frame.close=i;stack.pop()}}
  else if(c===','&&lambdas.at(-1)!==stack.length)commas.push({index:i,depth:stack.length});
 }
 return{stack,calls,commas,quote,comment};
}
function splitArguments(text){const separators=scanArguments(text).commas.filter(c=>c.depth===0).map(c=>c.index),parts=[];let start=0;for(const end of [...separators,text.length]){parts.push(text.slice(start,end).trim());start=end+1}return parts}
function findArgumentCall(text,caret){return scanArguments(text).calls.filter(c=>c.open<caret&&(c.close===null||caret<=c.close+1)).at(-1)}
function propertySuggestions(text,caret){
 const before=text.slice(0,caret),scan=scanArguments(before),frame=scan.stack.at(-1),py=$('codeLanguage').value==='python';
 if(frame?.char==='{'&&frame.parent?.owner==='game'&&frame.parent.name==='sprite'){
  const comma=scan.commas.filter(c=>c.depth===scan.stack.length&&c.index>frame.open).at(-1),start=(comma?.index??frame.open)+1;
  const segment=before.slice(start),m=segment.match(/^(\s*)(["']?)([A-Za-z_]\w*)?["']?$/);
  if(m){const prefix=m[3]||'',keyStart=start+m[1].length,tail=text.slice(caret).match(/^[\w]*["']?/)[0],hasColon=/^\s*:/.test(text.slice(caret+tail.length));
   const used=new Set(splitArguments(text.slice(frame.open+1,start-1)).map(p=>p.match(/^["']?(\w+)["']?\s*:/)?.[1]));
   return{start:keyStart,end:caret+tail.length,choices:spriteProperties.filter(p=>!used.has(p.name)&&p.name.startsWith(prefix)).map(p=>({name:p.name,args:null,description:p.description+' — '+p.detail+' 例: '+p.example,insert:(py?JSON.stringify(p.name):p.name)+(hasColon?'':': '+literalValue(p.value,p.type,py))}))};
  }
 }
 const dot=before.match(/\b([A-Za-z_]\w*)\.([A-Za-z_]*)$/);
 if(dot&&!scan.quote&&!scan.comment){const declared=[...text.matchAll(/\b([A-Za-z_]\w*)\s*=\s*game\.sprite\s*\(/g)].map(m=>m[1]);if(declared.includes(dot[1]))return{start:caret-dot[2].length,end:caret,choices:spriteProperties.filter(p=>p.name.startsWith(dot[2])).map(p=>({name:p.name,args:null,description:p.description+' — '+p.detail+' 例: '+p.example,insert:p.name}))}}
 return null;
}
function literalValue(value,type,py){if(type==='text')return JSON.stringify(value);if(type==='boolean')return value==='true'?(py?'True':'true'):(py?'False':'false');if(type==='number')return String(Number(value));return value}
function readLiteral(raw){
 if(/^(?:true|True|false|False)$/.test(raw))return{type:'boolean',value:/^(true|True)$/.test(raw)?'true':'false'};
 if(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw))return{type:'number',value:String(Number(raw))};
 if(raw.startsWith('"')&&raw.endsWith('"')){try{return{type:'text',value:JSON.parse(raw)}}catch{}}
 if(raw.startsWith("'")&&raw.endsWith("'")&&!raw.slice(1,-1).includes('\n')){try{return{type:'text',value:JSON.parse('"'+raw.slice(1,-1).replace(/\\'/g,"'").replace(/(?<!\\)"/g,'\\"')+'"')}}catch{}}
 return{type:'expression',value:raw};
}
function parameterInfo(name,method){
 const known=spriteProperties.find(p=>p.name===name);if(known)return{...known};
 const texts={text:'Hello',url:'https://',key:'ArrowLeft',label:'開始',name:'boost',message:'ゲーム終了',property:'x',id:method==='button'?'start':'game1'};
 if(Object.hasOwn(texts,name))return{name,type:'text',value:texts[name],description:'文字列'};
 if(name==='bounce')return{name,type:'boolean',value:'false',description:'端で跳ね返る'};
 if(name==='callback'){const args={onUpdate:'dt',onClick:'x, y',onKey:'key'}[method]||'';return{name,type:'expression',value:$('codeLanguage').value==='python'?'lambda'+(args?' '+args:'')+': None':'('+args+') => {}',description:'呼び出す関数・式'}}
 if(['sprite','timer','list'].includes(name)||(method==='collides'&&['a','b'].includes(name)))return{name,type:'expression',value:name==='list'?'[1, 2, 3]':name==='sprite'||name==='a'?'player':name==='b'?'enemy':'timer',description:'変数・関数・式'};
 if(name==='value'&&method==='log')return{name,type:'text',value:'Hello',description:'表示する内容'};
 const defaults={dt:'game.dt',seconds:'1',frequency:'660',size:'24',count:'20',r:'25',r2:'25',width:'2',max:'100',t:'0.5',to:'300'};
 return{name,type:name==='dt'?'expression':'number',value:defaults[name]||'0',description:name==='dt'?'フレーム間の秒数':'数値'};
}

const argumentPanel=document.createElement('section');argumentPanel.id='codeArguments';argumentPanel.hidden=true;argumentPanel.setAttribute('aria-label','引数を入力');$('codeIssue').before(argumentPanel);
let argumentSession=null,applyingArguments=false;
function refreshArguments(){
 if(applyingArguments)return;const source=$('codeSource'),call=findArgumentCall(source.value,source.selectionStart),meta=call&&completions.find(c=>c.owner===call.owner&&c.name===call.name);
 if(!call||!meta?.args){argumentPanel.hidden=true;argumentSession=null;return}
 const end=call.close??source.value.length,raw=source.value.slice(call.open+1,end).trim(),sprite=call.owner==='game'&&call.name==='sprite';
 const fields=[],unknown=[];let editable=true;
 if(sprite){
  if(raw&&!raw.startsWith('{'))editable=false;
  const object=raw.replace(/^\{\s*/,'').replace(/\}\s*$/,''),values=new Map();
  for(const part of splitArguments(object)){if(!part)continue;const m=part.match(/^["']?(\w+)["']?\s*:\s*([\s\S]*)$/);if(m&&spriteProperties.some(p=>p.name===m[1]))values.set(m[1],m[2]);else unknown.push(part)}
  for(const p of spriteProperties){const original=values.get(p.name);fields.push({...p,...(original===undefined?{}:readLiteral(original)),original,touched:false})}
 }else{
  const values=splitArguments(raw),params=meta.args.split(',');params.forEach((name,i)=>{const p=parameterInfo(name,call.name),original=values[i]||undefined;fields.push({...p,...argumentHelp(name,call.name,call.owner),...(original===undefined?{}:readLiteral(original)),original,touched:false})});unknown.push(...values.slice(params.length));
 }
 argumentSession={call,end,snapshot:source.value,fields,unknown,sprite,editable};argumentPanel.hidden=false;argumentPanel.replaceChildren();
 const title=document.createElement('strong');title.textContent=call.owner+'.'+call.name+' — 引数を入力';const note=document.createElement('p');note.className='argument-note';note.textContent=editable?'数値・テキストだけ入力。引用符・カンマは自動で付き、プレビューに反映されます。変数や関数は「式」を選択。':'この引数は変数・式です。直接コードで編集してください。';argumentPanel.append(title,note);if(!editable)return;
 const grid=document.createElement('div');grid.className='argument-grid';argumentPanel.append(grid);
 for(const field of fields){
  const cell=document.createElement('div');cell.className='argument-field';const label=document.createElement('label');label.textContent=field.name+' · '+field.description;const help=document.createElement('p');help.className='argument-help';help.id='argument-help-'+field.name;help.textContent=field.detail;const example=document.createElement('small');example.className='argument-example';example.textContent='例: '+field.example;
  const mode=document.createElement('select');mode.setAttribute('aria-label',field.name+' の入力形式');for(const [value,text] of [['number','数値'],['text','テキスト'],['boolean','真偽'],['expression','式']]){const option=document.createElement('option');option.value=value;option.textContent=text;mode.append(option)}mode.value=field.type;
  const holder=document.createElement('div');function inputControl(){holder.replaceChildren();const input=field.type==='boolean'?document.createElement('select'):field.type==='expression'?document.createElement('textarea'):document.createElement('input');input.setAttribute('aria-label','引数 '+field.name);if(field.type==='boolean'){for(const [value,text] of [['true','表示・有効（true）'],['false','非表示・無効（false）']]){const option=document.createElement('option');option.value=value;option.textContent=text;input.append(option)}}else if(field.type==='number'){input.type='number';input.step='any'}else if(field.type==='expression')input.rows=2;
   input.setAttribute('aria-describedby',help.id);input.value=field.value;input.addEventListener('input',()=>{field.value=input.value;field.touched=true;applyArguments()});holder.append(input)}
  mode.onchange=()=>{field.type=mode.value;if(field.type==='boolean')field.value=field.value==='false'?'false':'true';field.touched=true;inputControl();applyArguments()};cell.append(label,help,example,mode,holder);grid.append(cell);inputControl();
 }
 const status=document.createElement('p');status.id='argumentStatus';status.className='argument-note';status.setAttribute('role','status');argumentPanel.append(status);
 const apply=document.createElement('button');apply.type='button';apply.textContent='この内容をコードに反映';apply.onclick=()=>{fields.forEach(f=>{if(!(call.name==='scene'&&f.name==='callback'&&f.original===undefined))f.touched=true});applyArguments()};argumentPanel.append(apply);
}
function applyArguments(){
 const session=argumentSession,source=$('codeSource');if(!session||source.value!==session.snapshot){$('argumentStatus').textContent='コードが変更されました。対象の括弧内をクリックして開き直してください。';return}
 const required={rect:4,circle:3,line:4,text:3,image:5,remove:1,move:3,drawSprite:1,bounds:1,collides:2,circleHit:6,hit:3,onKey:1,onClick:1,onUpdate:1,onDraw:1,after:2,every:2,cancel:1,setScore:1,button:3,scene:1,randomInt:2,choice:1,clamp:3,lerp:3,distance:4,burst:2,tween:4,on:2,emit:1,key:1,keyPressed:1};
 const py=$('codeLanguage').value==='python',values=[],last=Math.max((required[session.call.name]||0)-1,session.fields.findLastIndex(f=>f.touched||f.original!==undefined));
 for(const [index,field] of session.fields.entries()){
  if(!session.sprite&&index>last)continue;
  if(field.touched&&field.type==='number'&&(!field.value.trim()||!Number.isFinite(Number(field.value)))){$('argumentStatus').textContent=field.name+' に数値を入力してください。';return}
  if(field.touched&&field.type==='expression'&&!field.value.trim()){$('argumentStatus').textContent=field.name+' に変数名・関数名・式を入力してください。';return}
  if(session.sprite&&field.original===undefined&&!field.touched)continue;
  const value=!field.touched&&field.original!==undefined?field.original:literalValue(field.value,field.type,py);
  values.push(session.sprite?(py?JSON.stringify(field.name):field.name)+': '+value:value);
 }
 values.push(...session.unknown);const args=session.sprite?'{'+values.join(', ')+'}':values.join(', '),replacement=args+(session.call.close===null?')':'');
 applyingArguments=true;source.setRangeText(replacement,session.call.open+1,session.end,'end');session.end=session.call.open+1+args.length;session.call.close=session.end;session.snapshot=source.value;source.dispatchEvent(new Event('input'));hideSuggestions();applyingArguments=false;$('argumentStatus').textContent='コードに反映しました';
}
for(const event of ['input','click','keyup'])$('codeSource').addEventListener(event,refreshArguments);
$('codeLanguage').addEventListener('change',()=>{argumentPanel.hidden=true;argumentSession=null});$('codeDialog').addEventListener('close',()=>{argumentPanel.hidden=true;argumentSession=null});
