const importDescriptions={string:'英字・数字・記号の一覧と文字列処理',math:'三角関数・平方根などの数学',random:'乱数・ランダム選択',json:'JSONの読み書き',datetime:'日付と時刻',collections:'カウンター・便利なデータ構造',numpy:'配列・数値計算',pandas:'表形式のデータ処理',matplotlib:'グラフの作成',PIL:'画像処理（Pillow）',scipy:'科学技術計算',sympy:'数式・記号計算',re:'正規表現',asyncio:'非同期処理',os:'ブラウザー内の仮想ファイル操作。PCのOS操作には制限あり',socket:'ブラウザーでは通常のソケット通信に制限あり',threading:'ブラウザーではスレッド機能に制限あり',subprocess:'ブラウザーでは外部プロセス起動不可',multiprocessing:'ブラウザーではプロセス起動不可',js:'JavaScriptとの連携',pyodide:'Pythonとブラウザーの連携'};
const importModules=[...new Map(pythonImportCatalog.map(item=>[item.name,item])).values()].sort((a,b)=>a.name.localeCompare(b.name));
function pythonImportSuggestions(source,caret){
 if($('codeLanguage').value!=='python')return null;
 const line=source.slice(0,caret).split('\n').at(-1);let prefix,base='',match;
 if(match=line.match(/^\s*from\s+([\w.]*)$/))prefix=match[1];
 else if(match=line.match(/^\s*import\s+(?:[\w.]+(?:\s+as\s+\w+)?\s*,\s*)*([\w.]*)$/))prefix=match[1];
 else if(match=line.match(/^\s*from\s+([\w.]+)\s+import\s+([\w.]*)$/)){base=match[1]+'.';prefix=match[2]}
 else return null;
 const full=base+prefix;
 return{start:caret-prefix.length,end:caret,choices:importModules.filter(m=>m.name.startsWith(full)&&(!base||!m.name.slice(base.length).includes('.'))).map(m=>{const name=m.name.slice(base.length);return{name,args:null,insert:name,description:(m.kind==='package'?'追加パッケージ・実行時に自動取得（ネット接続必要）':'組み込み・標準ライブラリー')+' — '+(importDescriptions[m.name]||importDescriptions[m.name.split('.')[0]]||m.name)+(m.kind==='package'?' / '+m.package:'')}})};
}
