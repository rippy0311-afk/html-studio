// Rebuild formatting markup with a small, inert tag/attribute allowlist.
function formattedText(source){
 const parsed=new DOMParser().parseFromString(String(source),'text/html'),output=document.createElement('div');
 const tags=new Set('b strong i em u s del strike mark small sub sup br span p div h1 h2 h3 h4 h5 h6 ul ol li blockquote pre code hr'.split(' '));
 const styles=new Set('color background-color font-size font-weight font-style text-decoration text-align line-height letter-spacing'.split(' '));
 function append(node,parent){
  if(node.nodeType===3){parent.append(document.createTextNode(node.textContent));return}
  if(node.nodeType!==1)return;const tag=node.localName;
  if(['script','style','iframe','object','embed','svg','math','template','link','meta','base'].includes(tag))return;
  if(!tags.has(tag)){for(const child of node.childNodes)append(child,parent);return}
  const clean=document.createElement(tag);
  for(const property of node.style){const value=node.style.getPropertyValue(property);if(styles.has(property)&&!/(url\s*\(|expression\s*\(|var\s*\()/i.test(value))clean.style.setProperty(property,value)}
  for(const child of node.childNodes)append(child,clean);parent.append(clean);
 }
 for(const node of parsed.body.childNodes)append(node,output);return output.innerHTML;
}
