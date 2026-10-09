// Serializable command library: the editor and exported HTML use the same API.
function createTextCommands(send, invoke) {
  const values = new Map(), variables = new Map(), clicks = new Map(), inputs = new Map(), keys = new Map(), timers = new Map();
  let sequence = 0;
  const id = value => { if (typeof value !== 'string' || !value.trim()) throw Error('IDは空でない文字列にしてください。'); return value; };
  const numeric = value => { const n = Number(value); if (!Number.isFinite(n)) throw Error('有限の数値を指定してください。'); return n; };
  const callback = value => { if (typeof value !== 'function') throw Error('処理には関数を渡してください。例：() => print("HELLO")'); return value; };
  const list = value => { if (!Array.isArray(value)) throw Error('配列を指定してください。例：[1, 2, 3]'); return value; };
  const command = (op, ...args) => send({type:'command', op, args});
  const style = (property, value, target = '') => command('style', target ? id(target) : '', property, value);
  const display = value => typeof value === 'string' ? value : JSON.stringify(value) ?? String(value);
  const random = (min = 0, max = 1) => { min = numeric(min); max = numeric(max); if (min > max) throw Error('最小値は最大値以下にしてください。'); return min + Math.random() * (max - min); };
  const schedule = (seconds, fn, repeating) => {
    seconds = numeric(seconds); callback(fn);
    if (seconds < 0 || seconds > 86400) throw Error('時間は0〜86400秒にしてください。');
    const key = ++sequence;
    const fire = () => { if (!repeating) timers.delete(key); invoke(fn); };
    timers.set(key, (repeating ? setInterval : setTimeout)(fire, Math.max(repeating ? 16 : 0, seconds * 1000)));
    return key;
  };
  const api = {
    changeTo(source) { if (typeof source !== 'string') throw Error('changeTo には文字列を渡してください。'); send({type:'navigate', source}); },
    restart() { send({type:'restart'}); },
    back() { send({type:'back'}); },
    clear() { clicks.clear(); inputs.clear(); values.clear(); command('clear'); },
    title(value) { command('title', String(value)); },
    print(value, target = 'text-auto-' + ++sequence) { id(target); command('text', target, display(value), false); return target; },
    println(value = '', target = 'text-auto-' + ++sequence) { id(target); command('text', target, display(value), true); return target; },
    newline(count = 1) { count = Math.floor(numeric(count)); if (count < 0 || count > 1000) throw Error('改行数は0〜1000です。'); command('newline', count); },
    setText(target, value) { command('setText', id(target), display(value)); },
    appendText(target, value) { command('appendText', id(target), display(value)); },
    button(target, label, fn) { id(target); clicks.set(target, callback(fn)); command('button', target, String(label)); return target; },
    input(target, placeholder = '', value = '') { id(target); values.set(target, String(value)); command('input', target, String(placeholder), String(value)); return target; },
    getInput(target) { return values.get(id(target)) ?? ''; },
    setInput(target, value) { id(target); if (!values.has(target)) throw Error('入力欄がありません：' + target); values.set(target, String(value)); command('setInput', target, String(value)); },
    onInput(target, fn) { inputs.set(id(target), callback(fn)); },
    onClick(target, fn) { clicks.set(id(target), callback(fn)); },
    remove(target) { id(target); clicks.delete(target); inputs.delete(target); values.delete(target); command('remove', target); },
    hide(target) { command('hide', id(target)); },
    show(target) { command('show', id(target)); },
    toggle(target) { command('toggle', id(target)); },
    enable(target) { command('enable', id(target)); },
    disable(target) { command('disable', id(target)); },
    focus(target) { command('focus', id(target)); },
    color(value, target = '') { style('color', String(value), target); },
    background(value, target = '') { style('backgroundColor', String(value), target); },
    fontSize(value, target = '') { value = numeric(value); if (value < 8 || value > 200) throw Error('文字サイズは8〜200pxです。'); style('fontSize', value + 'px', target); },
    align(value, target = '') { if (!['left','center','right'].includes(value)) throw Error('揃え方は left / center / right です。'); style('textAlign', value, target); },
    bold(value = true, target = '') { style('fontWeight', value ? '700' : '400', target); },
    border(value, target) { style('border', String(value), id(target)); },
    setVar(name, value) { variables.set(id(name), value); return value; },
    getVar(name, fallback = 0) { return variables.has(id(name)) ? variables.get(name) : fallback; },
    addVar(name, amount = 1) { const value = numeric(api.getVar(name)) + numeric(amount); variables.set(name, value); return value; },
    toggleVar(name) { const value = !api.getVar(name, false); variables.set(name, value); return value; },
    hasVar(name) { return variables.has(id(name)); },
    removeVar(name) { return variables.delete(id(name)); },
    when(condition, yes, no = () => {}) { return callback(condition ? yes : no)(); },
    repeat(count, fn) { count = numeric(count); callback(fn); if (!Number.isInteger(count) || count < 0 || count > 10000) throw Error('繰り返し回数は0〜10000の整数です。'); for (let i = 0; i < count; i++) fn(i); },
    after(seconds, fn) { return schedule(seconds, fn, false); },
    every(seconds, fn) { return schedule(seconds, fn, true); },
    cancel(key) { const timer = timers.get(key); if (timer !== undefined) { clearTimeout(timer); clearInterval(timer); timers.delete(key); } },
    onKey(key, fn) { keys.set(String(key), callback(fn)); },
    offKey(key) { keys.delete(String(key)); },
    random,
    randomInt(min, max) { min = Math.ceil(numeric(min)); max = Math.floor(numeric(max)); if (min > max) throw Error('整数の範囲を確認してください。'); return Math.floor(random(min, max + 1)); },
    choose(items) { list(items); if (!items.length) throw Error('空の配列からは選べません。'); return items[Math.floor(Math.random() * items.length)]; },
    clamp(value, min, max) { value = numeric(value); min = numeric(min); max = numeric(max); if (min > max) throw Error('最小値は最大値以下にしてください。'); return Math.max(min, Math.min(max, value)); },
    round(value, digits = 0) { digits = numeric(digits); if (!Number.isInteger(digits) || digits < 0 || digits > 10) throw Error('小数桁数は0〜10です。'); const factor = 10 ** digits; return Math.round(numeric(value) * factor) / factor; },
    floor(value) { return Math.floor(numeric(value)); },
    ceil(value) { return Math.ceil(numeric(value)); },
    abs(value) { return Math.abs(numeric(value)); },
    min(...items) { if (!items.length) throw Error('数値を指定してください。'); return Math.min(...items.map(numeric)); },
    max(...items) { if (!items.length) throw Error('数値を指定してください。'); return Math.max(...items.map(numeric)); },
    length(value) { return Array.isArray(value) ? value.length : Array.from(String(value)).length; },
    upper(value) { return String(value).toUpperCase(); },
    lower(value) { return String(value).toLowerCase(); },
    trim(value) { return String(value).trim(); },
    includes(value, search) { return Array.isArray(value) ? value.includes(search) : String(value).includes(String(search)); },
    replace(value, search, replacement) { return String(value).replaceAll(String(search), String(replacement)); },
    split(value, separator = ',') { return String(value).split(String(separator)); },
    join(items, separator = ',') { return list(items).join(String(separator)); },
    number(value) { return numeric(value); },
    string(value) { return String(value); },
    now() { return Date.now(); },
    log(...items) { send({type:'log', message:items.map(display).join(' ')}); },
    assert(condition, message = '条件を満たしていません。') { if (!condition) throw Error(String(message)); },
    stop() { send({type:'stop'}); }
  };
  return {api, event(data) {
    if (data.kind === 'input') { values.set(data.id, String(data.value)); inputs.get(data.id)?.(String(data.value)); }
    else if (data.kind === 'click') clicks.get(data.id)?.();
    else if (data.kind === 'key') keys.get(data.key)?.(data.key);
  }};
}

// [category, name, signature, explanation, insertable example]
const textCommandGuide = [
  ['画面','changeTo','changeTo(source)','同じ記法のソースへ画面全体を切り替える。変数・定義・タイマーはリセット。',`changeTo('"次の画面"')`],
  ['画面','restart','restart()','最初のソースから再実行。', 'restart()'],
  ['画面','back','back()','直前の画面のソースを再実行。履歴がなければ何もしない。','back()'],
  ['画面','clear','clear()','表示中の部品を消す。変数・定義・タイマーは維持。','clear()'],
  ['画面','title','title(text)','書き出したページのタイトルを変更。','title("マイ作品")'],
  ['文字','print','print(value, id?)','文字を追加してIDを返す。同じIDは更新。','print("HELLO", "message")'],
  ['文字','println','println(value?, id?)','文字を追加し、その後で改行。','println("HELLO")'],
  ['文字','newline','newline(count = 1)','改行を追加。','newline()'],
  ['文字','setText','setText(id, value)','指定した文字・ボタンの内容を置き換える。','setText("text1", "新しい文字")'],
  ['文字','appendText','appendText(id, value)','指定した文字・ボタンの末尾に追加。','appendText("text1", "！")'],
  ['部品','button','button(id, label, callback)','ボタンを追加。押すと処理を実行。','button("hello", "HELLO", () => print("こんにちは！"))'],
  ['部品','input','input(id, placeholder?, value?)','入力欄を追加。値は常に文字列。','input("name", "名前を入力")'],
  ['部品','getInput','getInput(id)','入力欄の現在の文字列を取得。','print(getInput("name"))'],
  ['部品','setInput','setInput(id, value)','入力値を変更（onInputは呼び出さない）。','setInput("name", "太郎")'],
  ['部品','onInput','onInput(id, callback)','入力するたびに現在の文字列を渡す。','onInput("name", value => log(value))'],
  ['部品','onClick','onClick(id, callback)','指定した部品のクリック処理を設定・置換。','onClick("button1", () => print("押しました"))'],
  ['部品','remove','remove(id)','指定した部品を削除。','remove("text1")'],
  ['部品','hide','hide(id)','指定した部品を隠す。','hide("text1")'],
  ['部品','show','show(id)','隠した部品を表示。','show("text1")'],
  ['部品','toggle','toggle(id)','表示と非表示を切り替える。','toggle("text1")'],
  ['部品','enable','enable(id)','ボタン・入力欄を有効化。','enable("button1")'],
  ['部品','disable','disable(id)','ボタン・入力欄を無効化。','disable("button1")'],
  ['部品','focus','focus(id)','ボタン・入力欄にフォーカス。','focus("name")'],
  ['見た目','color','color(value, id?)','文字色。ID省略でページ全体。','color("#ffffff")'],
  ['見た目','background','background(value, id?)','背景色。ID省略でページ全体。','background("#000000")'],
  ['見た目','fontSize','fontSize(px, id?)','文字サイズ（8〜200px）。ID省略で全体。','fontSize(24)'],
  ['見た目','align','align(value, id?)','left / center / right。ID省略で全体。','align("center")'],
  ['見た目','bold','bold(enabled = true, id?)','太字にする・戻す。ID省略で全体。','bold(true)'],
  ['見た目','border','border(value, id)','枠線の太さ・種類・色を指定。','border("2px solid white", "button1")'],
  ['変数','setVar','setVar(name, value)','名前付き変数を保存し、その値を返す。','setVar("score", 0)'],
  ['変数','getVar','getVar(name, fallback = 0)','変数を取得。未定義ならfallback。','print(getVar("score"))'],
  ['変数','addVar','addVar(name, amount = 1)','数値を加算し、結果を返す。','addVar("score", 1)'],
  ['変数','toggleVar','toggleVar(name)','trueとfalseを切り替え、結果を返す。','toggleVar("visible")'],
  ['変数','hasVar','hasVar(name)','変数が存在するかを返す。','log(hasVar("score"))'],
  ['変数','removeVar','removeVar(name)','変数を削除。','removeVar("score")'],
  ['制御','when','when(condition, yes, no?)','条件で処理を選ぶ。通常のifも使用可能。','when(getVar("score") >= 10, () => print("クリア"), () => print("あと少し"))'],
  ['制御','repeat','repeat(count, callback)','指定回数実行。0から始まる番号を渡す。','repeat(3, i => println(i + 1))'],
  ['時間','after','after(seconds, callback)','指定秒後に1回実行。cancel用IDを返す。','after(1, () => print("1秒たちました"))'],
  ['時間','every','every(seconds, callback)','指定秒ごとに実行。cancel用IDを返す。','setVar("timer", every(1, () => println("tick")))'],
  ['時間','cancel','cancel(timerId)','after / everyを解除。','cancel(getVar("timer"))'],
  ['操作','onKey','onKey(key, callback)','キーを押した瞬間に実行。入力欄の編集中は発火しない。プレビューをクリックしてから操作。','onKey("ArrowRight", () => print("右"))'],
  ['操作','offKey','offKey(key)','キーの処理を解除。','offKey("ArrowRight")'],
  ['計算','random','random(min = 0, max = 1)','min以上max未満の乱数。','print(random(0, 100))'],
  ['計算','randomInt','randomInt(min, max)','両端を含む整数の乱数。','print(randomInt(1, 6))'],
  ['計算','choose','choose(array)','配列からランダムに1つ選ぶ。','print(choose(["大吉", "吉", "小吉"]))'],
  ['計算','clamp','clamp(value, min, max)','数値を範囲内に収める。','print(clamp(120, 0, 100))'],
  ['計算','round','round(value, digits = 0)','四捨五入。digitsは小数桁数。','print(round(3.14159, 2))'],
  ['計算','floor','floor(value)','切り捨て。','print(floor(3.8))'],
  ['計算','ceil','ceil(value)','切り上げ。','print(ceil(3.2))'],
  ['計算','abs','abs(value)','絶対値。','print(abs(-10))'],
  ['計算','min','min(...values)','最小値。','print(min(3, 1, 5))'],
  ['計算','max','max(...values)','最大値。','print(max(3, 1, 5))'],
  ['文字列','length','length(value)','文字数（Unicodeコードポイント）または配列の長さ。','print(length("こんにちは"))'],
  ['文字列','upper','upper(value)','英字を大文字にする。','print(upper("hello"))'],
  ['文字列','lower','lower(value)','英字を小文字にする。','print(lower("HELLO"))'],
  ['文字列','trim','trim(value)','前後の空白を除く。','print(trim("  HELLO  "))'],
  ['文字列','includes','includes(value, search)','文字列・配列に指定値が含まれるか。','print(includes("HELLO", "HE"))'],
  ['文字列','replace','replace(value, search, replacement)','一致する文字列をすべて置換。','print(replace("a-b-c", "-", "/"))'],
  ['文字列','split','split(value, separator = ",")','文字列を区切って配列にする。','log(split("a,b,c", ","))'],
  ['文字列','join','join(array, separator = ",")','配列を文字列につなげる。','print(join(["a", "b"], " / "))'],
  ['変換','number','number(value)','数値に変換。不正な値はエラー。','print(number("123") + 1)'],
  ['変換','string','string(value)','文字列に変換。','print(string(123))'],
  ['時間','now','now()','現在時刻をミリ秒で取得。','log(now())'],
  ['確認','log','log(...values)','プレビュー下のログに表示。','log("確認", 123)'],
  ['確認','assert','assert(condition, message?)','条件がfalseならエラーで停止。','assert(getVar("score") >= 0, "スコアが負です")'],
  ['制御','stop','stop()','スクリプトとタイマーを停止。画面は残す。','stop()']
];
