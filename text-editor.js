(() => {
  const sample = '{class{hello{\n  <changeTo(\'"こんにちは！"\\n[戻る<changeTo(\\\'"HELLO WORLD"\\\')>]\')>\n}}}\n"HELLO WORLD"\n"ボタンを押すと、画面全体が切り替わります。"\n[HELLO<hello()>]';
  const selector = document.createElement('select');
  selector.id = 'studioMode';
  selector.setAttribute('aria-label', '制作モード');
  selector.innerHTML = '<option value="layout">レイアウトモード</option><option value="text">テキストモード</option>';
  document.querySelector('header .brand').after(selector);
  const layout = document.querySelector('body > main');
  const panel = document.createElement('section');
  panel.id = 'textWorkspace';
  panel.hidden = true;
  panel.innerHTML = `<div class="text-toolbar"><b>TEXT STUDIO</b><span>記号で書いて、画面をつくる</span><button id="textRun">実行 / 最初から</button><button id="textStop">停止</button><button id="textSave">クラウドに保存</button><button id="textLoad">保存した作品</button></div>
  <div class="text-columns"><section class="text-writing"><label for="textSource">ソース</label><textarea id="textSource" spellcheck="false" aria-describedby="textHelp" placeholder='"表示する文字"'></textarea><p id="textIssue" role="status"></p></section><section class="text-preview"><b>プレビュー</b><iframe id="textLive" title="テキストモードのプレビュー" sandbox="allow-scripts"></iframe></section></div>
  <details id="textHelp" open><summary>書き方</summary><p><code>"文字"</code> → テキスト　 <code>[HELLO]</code> → ボタン　 <code>&lt;スクリプト&gt;</code> → JavaScript</p><p><code>[HELLO&lt;changeTo('\"こんにちは\"')&gt;]</code> → 押すと画面全体を「こんにちは」に切り替えます。<code>changeTo("")</code> は画面を空にします。</p><p><code>{class{hello{&lt;changeTo('\"こんにちは\"')&gt;}}}</code> で処理を定義し、<code>[HELLO&lt;hello()&gt;]</code> で呼び出せます。定義しただけでは実行されません。</p><p>切り替え先にも同じ記法を使います。改行はそのまま表示。文字中の引用符は <code>\\"</code>、改行は <code>\\n</code>。ボタン内のスクリプトはクリック時、それ以外は画面表示時に実行します。比較演算の &gt; は括弧内で使ってください。</p></details>`;
  layout.after(panel);
  const input = $('textSource');
  let timer, token = '', lastSource, editing = false;
  function run() {
    clearTimeout(timer);
    if (state.mode !== 'text') return;
    token = crypto.randomUUID();
    $('textIssue').textContent = '';
    try {
      const nodes = parseTextMode(state.textSource || '');
      for (const node of nodes) {
        for (const script of node.type === 'script' ? [node] : node.scripts || []) {
          try { acorn.parse(script.code, {ecmaVersion:'latest', allowReturnOutsideFunction:true}); }
          catch (error) { error.line = script.line + (error.loc?.line || 1) - 1; throw error; }
        }
      }
      // Create the browsing context after the panel becomes visible. Reusing an
      // iframe first loaded under a hidden panel can leave Chromium's layout stale.
      const frame = $('textLive').cloneNode(false);
      frame.srcdoc = textModeDocument(state.textSource || '', state.name, token);
      $('textLive').replaceWith(frame);
    } catch (error) {
      $('textLive').srcdoc = '<body style="background:#000;color:#fff"></body>';
      $('textIssue').textContent = (error.line ? '行 ' + error.line + '：' : '') + error.message;
    }
  }
  const oldRender = render;
  render = function () {
    oldRender();
    const active = state.mode === 'text';
    document.body.classList.toggle('text-mode', active);
    selector.value = active ? 'text' : 'layout';
    layout.hidden = active;
    panel.hidden = !active;
    if (active) {
      input.value = state.textSource || '';
      if (lastSource !== input.value) run();
      lastSource = input.value;
    } else { clearTimeout(timer); $('textLive').srcdoc = ''; lastSource = undefined; }
  };
  selector.onchange = () => {
    checkpoint();
    state.mode = selector.value;
    if (state.mode === 'text' && typeof state.textSource !== 'string') state.textSource = sample;
    editing = false;
    render();
  };
  input.addEventListener('input', () => {
    if (!editing) { checkpoint(); editing = true; }
    state.textSource = input.value;
    lastSource = input.value;
    clearTimeout(timer);
    timer = setTimeout(run, 650);
  });
  input.addEventListener('blur', () => { editing = false; });
  input.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); run(); }
    if (event.key === 'Tab') { event.preventDefault(); input.setRangeText('  ', input.selectionStart, input.selectionEnd, 'end'); input.dispatchEvent(new Event('input', {bubbles:true})); }
  });
  window.addEventListener('message', event => {
    if (event.source !== $('textLive').contentWindow || !event.data?.studioText || event.data.token !== token) return;
    $('textIssue').textContent = (event.data.line ? '行 ' + event.data.line + '：' : '') + event.data.message;
  });
  $('textRun').onclick = run;
  $('textStop').onclick = () => { clearTimeout(timer); token = ''; $('textLive').srcdoc = ''; $('textIssue').textContent = '停止中'; };
  $('textSave').onclick = () => $('save').click();
  $('textLoad').onclick = () => $('load').click();
  render();
})();
