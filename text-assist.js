function createTextAssist(input, onStatus) {
  const wrap = document.createElement('div'); wrap.id = 'textSourceWrap';
  input.before(wrap); wrap.append(input); input.wrap = 'off';
  const overlay = document.createElement('div'); overlay.id = 'textInlineErrors'; overlay.setAttribute('aria-hidden','true');
  const popup = document.createElement('div'); popup.id = 'textPredictions'; popup.hidden = true; popup.setAttribute('role','listbox'); popup.setAttribute('aria-label','入力候補');
  const mirror = document.createElement('div'); mirror.id = 'textCaretMirror'; mirror.setAttribute('aria-hidden','true');
  wrap.append(overlay,popup); document.body.append(mirror);
  input.setAttribute('aria-autocomplete','list'); input.setAttribute('aria-controls',popup.id); input.setAttribute('aria-expanded','false');
  input.setAttribute('aria-errormessage','textIssue');
  let errors = [], current = null, index = 0, composing = false, timer;
  function position(offset) {
    const style = getComputedStyle(input);
    for (const property of ['fontFamily','fontSize','fontWeight','fontStyle','letterSpacing','lineHeight','tabSize']) mirror.style[property] = style[property];
    mirror.textContent = input.value.slice(0,offset);
    const marker = document.createElement('span'); marker.textContent = '\u200b'; mirror.append(marker);
    const bounds = marker.getBoundingClientRect(), base = mirror.getBoundingClientRect();
    return {x:bounds.left-base.left + parseFloat(style.paddingLeft) - input.scrollLeft, y:bounds.top-base.top + parseFloat(style.paddingTop) - input.scrollTop, height:parseFloat(style.lineHeight)};
  }
  function paintErrors() {
    overlay.replaceChildren();
    const lines = input.value.split('\n'), style = getComputedStyle(input), height = parseFloat(style.lineHeight);
    const grouped = new Map();
    for (const error of errors) grouped.set(error.line, grouped.has(error.line) ? grouped.get(error.line) + ' / ' + error.message : error.message);
    for (const [line,message] of grouped) {
      const error = {line,message};
      if (!Number.isInteger(error.line) || error.line < 1 || error.line > lines.length) continue;
      const offset = lines.slice(0,error.line).join('\n').length;
      const point = position(offset), top = parseFloat(style.paddingTop)+(error.line-1)*height-input.scrollTop;
      if (top + height < 0 || top > input.clientHeight) continue;
      const badge = document.createElement('span'); badge.className = 'text-line-error'; badge.dataset.line = error.line;
      badge.textContent = '⚠ ' + error.message; badge.title = error.message;
      const left = Math.max(0,Math.min(point.x+12,input.clientWidth-28));
      badge.style.left = left+'px'; badge.style.maxWidth = Math.max(24,input.clientWidth-left-4)+'px'; badge.style.top = top+'px'; badge.style.height = height+'px';
      overlay.append(badge);
    }
    input.setAttribute('aria-invalid', String(errors.length > 0));
  }
  function hide() { popup.hidden = true; current = null; input.removeAttribute('aria-activedescendant'); input.setAttribute('aria-expanded','false'); }
  function placePopup() {
    if (!current) return;
    const point = position(input.selectionStart), width = Math.min(370,wrap.clientWidth-16);
    popup.style.width = width+'px';
    const left = Math.max(8,Math.min(point.x,wrap.clientWidth-width-8));
    const height = Math.min(popup.scrollHeight,190);
    let top = point.y + point.height + 4;
    if (top + height > wrap.clientHeight) top = Math.max(4,point.y-height-6);
    popup.style.left = left+'px'; popup.style.top = Math.max(4,top)+'px';
  }
  function paintChoices() {
    popup.replaceChildren();
    current.choices.forEach((choice,i)=>{
      const button = document.createElement('button'); button.type = 'button'; button.id = 'textPrediction'+i;
      button.setAttribute('role','option'); button.setAttribute('aria-selected',String(i===index));
      const name = document.createElement('strong'), detail = document.createElement('span');
      name.textContent = choice.signature || choice.name; detail.textContent = choice.description;
      button.append(name,detail); button.onmousedown = event => event.preventDefault(); button.onclick = () => accept(i); popup.append(button);
    });
    input.setAttribute('aria-activedescendant','textPrediction'+index);
    const selected = popup.children[index];
    if (selected.offsetTop < popup.scrollTop) popup.scrollTop = selected.offsetTop;
    else if (selected.offsetTop+selected.offsetHeight > popup.scrollTop+popup.clientHeight) popup.scrollTop = selected.offsetTop+selected.offsetHeight-popup.clientHeight;
    placePopup();
  }
  function suggest(force = false) {
    if (composing || document.activeElement !== input || input.selectionStart !== input.selectionEnd) { hide(); return; }
    current = textPredictions(input.value,input.selectionStart,force); index = 0;
    if (!current) { hide(); return; }
    popup.hidden = false; input.setAttribute('aria-expanded','true'); paintChoices();
  }
  function accept(choiceIndex = index) {
    if (!current) return;
    const choice = current.choices[choiceIndex], start = current.start;
    input.focus(); input.setRangeText(choice.insert,start,current.end,'end');
    const caret = start + (choice.caret ?? choice.insert.length); input.setSelectionRange(caret,caret);
    hide(); input.dispatchEvent(new Event('input',{bubbles:true})); hide();
  }
  function check() {
    clearTimeout(timer); errors = textDiagnostics(input.value); paintErrors(); onStatus(errors[0] || null); return errors;
  }
  input.addEventListener('input',event=>{
    clearTimeout(timer); errors = []; paintErrors();
    if (event.isComposing || composing) return;
    timer = setTimeout(check,120); suggest();
  });
  input.addEventListener('compositionstart',()=>{composing=true;clearTimeout(timer);hide();});
  input.addEventListener('compositionend',()=>{composing=false;check();suggest();});
  input.addEventListener('keydown',event=>{
    if (event.isComposing || composing) return;
    if ((event.ctrlKey||event.metaKey) && event.code==='Space') { event.preventDefault();event.stopImmediatePropagation();suggest(true);return; }
    if (popup.hidden || event.ctrlKey || event.metaKey || event.altKey) return;
    if (['ArrowDown','ArrowUp','Enter','Tab','Escape'].includes(event.key)) {
      event.preventDefault();event.stopImmediatePropagation();
      if(event.key==='Escape')hide();
      else if(event.key==='Enter'||event.key==='Tab')accept();
      else { index=(index+(event.key==='ArrowDown'?1:-1)+current.choices.length)%current.choices.length;paintChoices(); }
    }
  },true);
  input.addEventListener('keyup',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key))suggest();});
  input.addEventListener('click',()=>suggest());
  input.addEventListener('scroll',()=>{paintErrors();placePopup();});
  input.addEventListener('blur',hide);
  new ResizeObserver(()=>{paintErrors();placePopup();}).observe(wrap);
  return {check,hide, runtime(error) { if (composing) return; errors = error?.message && error.line ? [error] : []; paintErrors(); onStatus(error?.message ? error : null); }};
}
