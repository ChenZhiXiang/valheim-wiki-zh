
// 正文、界面、目录和提示同步切换；所有资源均为本地文件。
// 使用原网站图标；旧页面和子目录入口也能加载本地图标。
for(const [rel,file,type] of [['icon','Favicon.ico','image/x-icon'],['apple-touch-icon','Apple-touch-icon.png','image/png']]){
 let icon=document.head.querySelector('link[rel="'+rel+'"]');
 if(!icon){icon=document.createElement('link');icon.rel=rel;document.head.append(icon);}
 icon.type=type;icon.href=(document.documentElement.dataset.wikiRoot||'.')+'/assets/theme/'+file+(document.documentElement.dataset.siteVersion?'?v='+encodeURIComponent(document.documentElement.dataset.siteVersion):'');
}
let english=false;
const toggle=document.querySelector('#sample-language');
// 快捷按钮独立于置顶工具栏，所有页面均固定在视口右下角。
let floatingTools=document.querySelector('.sample-floating-tools');
if(!floatingTools){floatingTools=document.createElement('div');floatingTools.className='sample-floating-tools';document.body.append(floatingTools);}
let backTop=document.querySelector('#sample-back-top');
if(!backTop){backTop=document.createElement('button');backTop.id='sample-back-top';backTop.type='button';backTop.dataset.uiZh='回到顶部';backTop.dataset.uiEn='Back to top';floatingTools.append(backTop);}
let homeControl=document.querySelector('#sample-home');
if(!homeControl){homeControl=document.createElement('a');homeControl.id='sample-home';homeControl.dataset.uiZh='回到主页';homeControl.dataset.uiEn='Home';floatingTools.append(homeControl);}
if(toggle)floatingTools.append(toggle);
// 回到顶部时清除章节片段，并保留页面路径与当前语言参数。
backTop.addEventListener('click',()=>{
 if(location.hash)history.replaceState(null,'',location.pathname+location.search);
 window.scrollTo({top:0,left:0,behavior:'instant'});
});
const controls=[];
// 左上角站点图标链接到本地首页，并沿用正文的语言切换逻辑。
const brand=document.querySelector('.sample-toolbar > strong');
if(brand){
 const home=document.createElement('a');
 home.className='sample-brand';
 home.href=(document.documentElement.dataset.wikiRoot||'.')+'/index.html';
 for(const attribute of brand.attributes)home.setAttribute(attribute.name,attribute.value);
 home.textContent=brand.textContent;
 brand.replaceWith(home);
}
// 旧页面的署名移到搜索右侧；增量更新保留的页面也使用相同位置。
const searchForm=document.querySelector('#sample-search-form');
if(searchForm&&!document.querySelector('.sample-authors')){
 const authors=document.createElement('div');authors.className='sample-authors';
 for(const author of document.querySelectorAll('footer .sample-author')){
  const locale=author.closest('footer').dataset.language;
  author.dataset.language=locale;author.hidden=locale==='en';
  author.firstChild.textContent=locale==='zh'?'汉化与整理':'Translation & compilation';
  author.querySelector('a').textContent=locale==='zh'?'狼色幽默·B站主页':'狼色幽默·Bilibili profile';
  authors.append(author);
 }
 if(authors.childElementCount)searchForm.after(authors);
}
// 格式错误的 URL 片段不参与定位，避免打断阅读控件初始化。
function decodeFragment(fragment){
 try{return decodeURIComponent(fragment);}catch{return '';}
}
function collapseLabel(control){const closed=control.dataset.closed==='true';control.textContent=english?(closed?'Expand':'Collapse'):(closed?'展开':'收起');}
function language(value,updateHash=true){
 english=value;document.documentElement.lang=english?'en':'zh-CN';
 for(const n of document.querySelectorAll('[data-language]'))n.hidden=n.dataset.language!==(english?'en':'zh');
 for(const n of document.querySelectorAll('[data-ui-zh]'))n.textContent=english?n.dataset.uiEn:n.dataset.uiZh;
 for(const n of document.querySelectorAll('[data-placeholder-zh]'))n.placeholder=english?n.dataset.placeholderEn:n.dataset.placeholderZh;
 toggle.textContent=english?'Chinese':'切换英文';toggle.setAttribute('aria-pressed',String(english));
 document.title=document.querySelector('#sample-title').textContent+(english?' · Valheim Wiki':' · 英灵神殿维基');
  // 按当前站点根目录返回首页，并保留阅读语言，兼容子目录部署和本地浏览。
 const homeUrl=new URL((document.documentElement.dataset.wikiRoot||'.')+'/index.html',location.href);
 if(english)homeUrl.searchParams.set('lang','en');
 homeControl.href=homeUrl.href;
 for(const n of controls)collapseLabel(n);
 // 跳到其他本地页面时保留阅读语言。
 for(const a of document.querySelectorAll('a[href]')){
  const raw=a.getAttribute('href');if(!/^(?:\.\.\/|pages\/)?[a-z0-9-]+\.html(?:[?#]|$)/.test(raw))continue;
  const u=new URL(raw,location.href);if(english)u.searchParams.set('lang','en');else u.searchParams.delete('lang');
  if(u.hash){const fragment=decodeFragment(u.hash.slice(1));if(fragment)u.hash='#'+(english?'en-':'')+fragment.replace(/^en-/,'');}
  a.setAttribute('href',raw.split(/[?#]/)[0]+u.search+u.hash);
 }
 document.documentElement.style.scrollPaddingTop=(document.querySelector('.sample-toolbar').offsetHeight+12)+'px';
 const hash=decodeFragment(location.hash.slice(1));
 if(updateHash&&hash&&hash!=='sample-toc'){
  const target=(english?'en-':'')+hash.replace(/^en-/,'');
  if(document.getElementById(target))history.replaceState(null,'','#'+target);
 }
 const parameters=new URLSearchParams(location.search);if(english)parameters.set('lang','en');else parameters.delete('lang');
 history.replaceState(null,'',location.pathname+(parameters.size?'?'+parameters.toString():'')+location.hash);
 document.dispatchEvent(new Event('sample-language-change'));
}
toggle.addEventListener('click',()=>language(!english));
// 按原站标记初始化；表格保留标题行，区块只切换其自身内容，嵌套控件互不干扰。
const collapsibleSelector='.mw-collapsible,.collapsible';
for(const block of document.querySelectorAll('#sample-zh .mw-collapsible,#sample-zh .collapsible,#sample-en .mw-collapsible,#sample-en .collapsible')){
 const initiallyClosed=block.classList.contains('mw-collapsed')||block.classList.contains('collapsed');
 const control=document.createElement('button');control.type='button';control.className='sample-collapse';
 let content=[],header=null;
 if(block.tagName==='TABLE'){
  const rows=Array.from(block.rows);header=rows[0];content=rows.slice(1);
  // 有独立表格标题时按钮放在标题旁，否则放在首行末格；标题始终可见。
  if(block.caption)block.caption.append(control);
  else if(header&&header.cells.length)header.cells[header.cells.length-1].append(control);
  else block.before(control);
 }else{
  content=Array.from(block.querySelectorAll('.mw-collapsible-content')).filter(n=>n.closest(collapsibleSelector)===block);
  if(!content.length){
   const wrap=document.createElement('div');wrap.className='mw-collapsible-content';
   while(block.firstChild)wrap.append(block.firstChild);block.append(wrap);content=[wrap];
  }
  block.prepend(control);
 }
 // 已保存网页的折叠内容可能带 hidden 或 display:none；展开时只清除本控件管理的隐藏。
 const baseline=content.map(n=>({node:n,hidden:initiallyClosed?false:n.hidden,display:initiallyClosed&&n.style.display==='none'?'':n.style.display}));
 function setClosed(closed){
  block.classList.toggle('mw-collapsed',closed);block.classList.remove('collapsed');
  block.dataset.sampleClosed=String(closed);
  for(const item of baseline){item.node.hidden=closed||item.hidden;item.node.style.display=item.display;}
  control.dataset.closed=String(closed);control.setAttribute('aria-expanded',String(!closed));collapseLabel(control);
 }
 controls.push(control);setClosed(initiallyClosed);
 control.addEventListener('click',()=>setClosed(control.dataset.closed!=='true'));
}
language(new URLSearchParams(location.search).get('lang')==='en'||location.hash.startsWith('#en-'),false);

// 恢复原站的所有页签组：等级、星级、外观和物品变体共用同一套交互。
(function () {
 const labels = {
  Appearance:'外观',Icon:'图标',Trophy:'战利品',Cooked:'熟食',Raw:'生食',Uncooked:'未烹饪',
  Baked:'已烘烤',Unbaked:'未烘烤',Grilled:'已烧烤',Mead:'蜜酒','Mead base':'蜜酒基底',
  Wine:'葡萄酒','Wine base':'葡萄酒基底',Weapon:'武器',Armor:'护甲',Head:'头部',Chest:'胸部',
  Legs:'腿部',Cape:'披风',Hood:'兜帽',Tunic:'上衣',Trousers:'裤子',Mask:'面具',Harnesk:'胸甲',Leggings:'护腿',
  Cast:'铸件',Mould:'模具','Head Cast':'头部铸件','Chest Cast':'胸部铸件','Leg Cast':'腿部铸件',
  'Head Mould':'头部模具','Chest Mould':'胸部模具','Leg Mould':'腿部模具',
  Small:'小型',Medium:'中型',Large:'大型',Fire:'火焰',Ice:'冰霜',Support:'支援',
  Both:'两者',Baby:'幼体',Seal:'海豹',Structure:'建筑',Item:'物品',Items:'物品',Creatures:'生物',
  'Phase 1':'阶段 1','Phase 2':'阶段 2','Phase 3':'阶段 3',Female:'雌性',Male:'雄性',
  Vertical:'垂直',Horizontal:'水平',Brass:'黄铜',Silver:'银',Bronze:'青铜',Staff:'法杖',Root:'树根',
  Full:'完整',Top:'上部',Bottom:'下部',Bear:'熊',Moose:'驼鹿',Wolf:'狼',Boar:'鬓猪',
  'Dead Raiser':'亡者召唤杖',Skelett:'骷髅',Trollstav:'巨魔召唤杖','Summoned Troll':'召唤巨魔',
  Key:'钥匙','Early Axes':'早期斧头','Curious Head':'奇特头颅','Mysterious Head':'神秘头颅',
  Rustic:'乡村式',Timberwood:'木框式',Zil:'吉尔',Thungr:'吞格'
 };
 const groups = [], owners = new WeakMap(), partners = new Map();
 for (const [number, container] of Array.from(document.querySelectorAll('#sample-zh .tabber,#sample-en .tabber')).entries()) {
  const panels = Array.from(container.children).filter(n => n.classList.contains('tabbertab'));
  if (!panels.length || container.classList.contains('sample-tabs-ready')) continue;
  const section = container.closest('[data-language]'), locale = section.dataset.language;
  const nav = document.createElement('div');nav.className = 'sample-tab-list';nav.setAttribute('role','tablist');
  nav.setAttribute('aria-label',locale === 'zh' ? '内容页签' : 'Content tabs');
  const buttons = panels.map((panel, index) => {
   const button = document.createElement('button'), title = panel.dataset.title || String(index + 1);
   button.type = 'button';button.className = 'sample-tab';button.id = `sample-tab-${number}-${index}`;
   button.textContent = locale === 'zh' ? (labels[title] || title) : title;
   if (!panel.id) panel.id = `sample-tab-panel-${number}-${index}`;
   panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);
   button.setAttribute('role','tab');button.setAttribute('aria-controls',panel.id);nav.append(button);
   return button;
  });
  const group = {container,panels,buttons,nav,active:0,locale,partner:null};
  function select(index, focus = false, sync = true) {
   group.active = index;
   panels.forEach((panel, i) => {
    panel.hidden = i !== index;
    buttons[i].setAttribute('aria-selected',String(i === index));buttons[i].tabIndex = i === index ? 0 : -1;
   });
   if (focus) {buttons[index].focus();buttons[index].scrollIntoView({block:'nearest',inline:'nearest'});}
   if (sync && group.partner) group.partner.select(index,false,false);
  }
  group.select = select;
  panels.forEach(panel => owners.set(panel,group));
  buttons.forEach((button, index) => {
   button.addEventListener('click',() => select(index));
   button.addEventListener('keydown',event => {
    let target;
    if (event.key === 'ArrowRight') target = (index + 1) % panels.length;
    else if (event.key === 'ArrowLeft') target = (index + panels.length - 1) % panels.length;
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = panels.length - 1;
    else return;
    event.preventDefault();select(target,true);
   });
  });
  container.prepend(nav);container.classList.add('tabberlive','sample-tabs-ready');select(0);
  // 中英文页签按原站组 ID 配对，切换语言时保留正在查看的等级或变体。
  const key = container.id.replace(/^en-/,'');
  const partner = key && partners.get(key);
  if (partner && partner.locale !== locale && partner.panels.length === panels.length &&
      panels.every((panel,i) => panel.dataset.title === partner.panels[i].dataset.title)) {
   group.partner = partner;partner.partner = group;select(partner.active);
  } else if (key) partners.set(key,group);
  groups.push(group);
 }
 // 从目录或正文链接进入隐藏内容时，同时打开它所属的内外层页签。
 function revealHash() {
  let id;try {id = decodeURIComponent(location.hash.slice(1));} catch {return;}
  const target = id && document.getElementById(id);if (!target) return;
  let node = target;
  while (node) {
   if (owners.has(node)) {const group = owners.get(node);group.select(group.panels.indexOf(node));}
   node = node.parentElement;
  }
 }
 window.addEventListener('hashchange',revealHash);
 document.addEventListener('sample-language-change',revealHash);
 revealHash();
})();

// 离线恢复排序、引用预览和图片查看器，不加载原站的联网脚本。
(function () {
 const english = () => document.documentElement.lang === 'en';
 const text = (zh,en) => english() ? en : zh;
 const collator = new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});

 // 展开 rowspan/colspan 的逻辑网格，排序时把跨行单元格所属行作为整体移动。
 function grid(rows) {
  const matrix = rows.map(() => []);
  rows.forEach((row,r) => {
   let column = 0;
   for (const cell of row.cells) {
    while (matrix[r][column]) column++;
    const height = cell.rowSpan || rows.length-r;
    for (let y=r;y<Math.min(rows.length,r+height);y++)
     for (let x=column;x<column+cell.colSpan;x++) matrix[y][x]=cell;
    column+=cell.colSpan;
   }
  });
  return matrix;
 }
 function value(cell,type) {
  if (!cell) return {empty:true};
  let raw=cell.getAttribute('data-sort-value');
  if (raw===null) {
   const copy=cell.cloneNode(true);copy.querySelectorAll('.reference,.sample-collapse,.sample-sort-button').forEach(n=>n.remove());
   raw=copy.textContent;
  }
  raw=raw.normalize('NFKC').replace(/\u2212/g,'-').trim();
  if (!raw || /^[—–-]+$/.test(raw)) return {empty:true};
  if (type!=='string') {
   if (/^\d+(?::\d{1,2}){1,2}$/.test(raw)) return {number:raw.split(':').reduce((n,x)=>n*60+Number(x),0),raw};
   const match=raw.match(/^[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/);
   if (match) return {number:Number(match[0].replace(/,/g,'')),raw};
  }
  return {raw};
 }
 let sortedTables=0;
 for (const table of document.querySelectorAll('#sample-zh table.sortable,#sample-en table.sortable')) {
  const rows=Array.from(table.rows);if (!rows.length) continue;
  const headerRows=table.tHead ? Array.from(table.tHead.rows) : [rows[0]];
  if (!table.tHead) {
   let depth=Math.max(1,...Array.from(rows[0].cells,c=>c.rowSpan));
   // 单独的跨列表格标题不作为排序列，接下来的标题行仍须初始化。
   if (rows[0].cells.length===1 && rows[0].cells[0].colSpan>1 && rows[1] && Array.from(rows[1].cells).every(c=>c.tagName==='TH')) depth=Math.max(depth,2);
   for(let i=1;i<Math.min(rows.length,depth);i++)headerRows.push(rows[i]);
  }
  const headerSet=new Set(headerRows),headerGrid=grid(headerRows),seen=new Set();
  let active=null,direction=1;
  const columns=[];
  for (let r=0;r<headerGrid.length;r++) for(let column=0;column<headerGrid[r].length;column++) {
   const cell=headerGrid[r][column];
   if (!cell || seen.has(cell)) continue;seen.add(cell);
   if (cell.tagName!=='TH' || cell.colSpan!==1 || cell.classList.contains('unsortable')) continue;
   const label=cell.cloneNode(true);label.querySelectorAll('.reference,button').forEach(n=>n.remove());
   // 图标沿用原站 SVG，并固定在表头右侧，不占用标题的行内空间。
   const button=document.createElement('button');button.type='button';button.className='sample-sort-button';
   const title=label.textContent.trim().replace(/\s+/g,' ');
   const item={cell,column,button,title};columns.push(item);
   cell.append(button);cell.classList.add('sample-sort-header');cell.setAttribute('role','columnheader');cell.removeAttribute('tabindex');
   function updateLabel() {
    button.setAttribute('aria-label',text('按“'+title+'”排序','Sort by '+title));cell.title=text('点击切换升序／降序','Click to toggle ascending/descending');
    // 中英文收起按钮宽度不同，按实际宽度预留空间，避免两个控件相互遮挡。
    const collapse=cell.querySelector(':scope > .sample-collapse'),width=collapse?.getBoundingClientRect().width;
    if(width)cell.style.setProperty('--sample-collapse-width',width+'px');
   }
   updateLabel();document.addEventListener('sample-language-change',updateLabel);
   const collapseControl=cell.querySelector(':scope > .sample-collapse');
   if(collapseControl)new MutationObserver(updateLabel).observe(collapseControl,{childList:true,characterData:true,subtree:true});
   cell.addEventListener('click',event => {
    if (event.target.closest('a,.sample-collapse,.reference')) return;
    direction=active===cell ? -direction : 1;active=cell;
    for(const other of columns) {
     other.cell.setAttribute('aria-sort',other.cell===cell ? (direction===1?'ascending':'descending') : 'none');
    }
    for(const body of table.tBodies) {
     const bodyRows=Array.from(body.rows),matrix=grid(bodyRows),blocks=[];
     for(let start=0;start<bodyRows.length;) {
      let end=start+1;
      for(let r=start;r<end;r++) for(const c of bodyRows[r].cells) end=Math.min(bodyRows.length,Math.max(end,r+(c.rowSpan||bodyRows.length-r)));
      const blockRows=bodyRows.slice(start,end),first=bodyRows[start];
      blocks.push({rows:blockRows,key:value(matrix[start][column],cell.dataset.sortType),
       pinned:blockRows.some(row=>headerSet.has(row)||row.classList.contains('sorttop')||row.classList.contains('sortbottom')) || !Array.from(first.cells).some(c=>c.tagName==='TD')});
      start=end;
     }
     const output=[];
     for(let start=0;start<blocks.length;) {
      if(blocks[start].pinned){output.push(blocks[start++]);continue;}
      let end=start;while(end<blocks.length&&!blocks[end].pinned)end++;
      const run=blocks.slice(start,end).map((block,index)=>({...block,index}));
      run.sort((a,b)=>{
       if(a.key.empty||b.key.empty)return a.key.empty===b.key.empty ? a.index-b.index : a.key.empty?1:-1;
       const order=a.key.number!==undefined&&b.key.number!==undefined ? a.key.number-b.key.number : collator.compare(a.key.raw,b.key.raw);
       return order*direction || a.index-b.index;
      });
      output.push(...run);start=end;
     }
     const fragment=document.createDocumentFragment();for(const block of output)for(const row of block.rows)fragment.append(row);body.append(fragment);
    }
   });
  }
  if(columns.length)sortedTables++;
 }

 // 引用预览使用当前语言的本地注释；保留原链接的点击跳转和弹窗内链接。
 const tooltip=document.createElement('div');tooltip.id='sample-reference-preview';tooltip.setAttribute('role','tooltip');tooltip.hidden=true;
 document.body.append(tooltip);
 let reference=null,hideTimer,previousDescription;
 function hideReference() {
  clearTimeout(hideTimer);tooltip.hidden=true;
  if(reference){if(previousDescription===null)reference.removeAttribute('aria-describedby');else reference.setAttribute('aria-describedby',previousDescription);}
  reference=null;
 }
 document.addEventListener('sample-page-preview-show',hideReference);
 document.addEventListener('sample-preview-settings-change',hideReference);
 function scheduleHide(){clearTimeout(hideTimer);hideTimer=setTimeout(hideReference,180);}
 function showReference(link) {
  if(window.ValheimPreviewSettings?.references===false)return;
  let url,id;try{url=new URL(link.href);id=decodeURIComponent(url.hash.slice(1));}catch{return;}
  if(url.protocol!==location.protocol || url.host!==location.host || url.pathname!==location.pathname)return;
  const note=document.getElementById(id);if(!note)return;
  hideReference();const content=(note.querySelector('.reference-text')||note).cloneNode(true);
  content.querySelectorAll('.mw-cite-backlink,.cite-backlink,.reference,a[href*="#cite_ref"]').forEach(n=>n.remove());
  content.querySelectorAll('sup').forEach(n=>{if(/返回引用|Jump up|^[\d.\s]+$/.test(n.textContent))n.remove();});
  if(content.firstChild?.nodeType===Node.TEXT_NODE)content.firstChild.textContent=content.firstChild.textContent.replace(/^\s*[↑^]\s*/, '');
  for(const n of [content,...content.querySelectorAll('[id]')])n.removeAttribute('id');
  tooltip.replaceChildren(content);reference=link;previousDescription=link.getAttribute('aria-describedby');
  link.setAttribute('aria-describedby',(previousDescription?previousDescription+' ':'')+tooltip.id);tooltip.hidden=false;
  document.dispatchEvent(new CustomEvent('sample-reference-preview-show',{detail:tooltip}));
  placeReference();
 }
 function placeReference() {
  if(!reference||tooltip.hidden)return;
  const anchor=reference.getBoundingClientRect(),box=tooltip.getBoundingClientRect();
  if(anchor.bottom<0||anchor.top>innerHeight){hideReference();return;}
  const left=Math.max(12,Math.min(innerWidth-box.width-12,anchor.left));
  let top=anchor.bottom+8;if(top+box.height>innerHeight-12)top=anchor.top-box.height-8;
  tooltip.style.left=left+'px';tooltip.style.top=Math.max(12,Math.min(innerHeight-box.height-12,top))+'px';
 }
 for(const link of document.querySelectorAll('#sample-zh .reference a,#sample-en .reference a')) {
  link.addEventListener('mouseenter',()=>showReference(link));link.addEventListener('mouseleave',scheduleHide);
  link.addEventListener('focus',()=>showReference(link));link.addEventListener('blur',scheduleHide);link.addEventListener('click',hideReference);
 }
 tooltip.addEventListener('mouseenter',()=>clearTimeout(hideTimer));tooltip.addEventListener('mouseleave',scheduleHide);
 tooltip.addEventListener('focusin',()=>clearTimeout(hideTimer));tooltip.addEventListener('focusout',scheduleHide);
 window.addEventListener('scroll',placeReference,{passive:true});window.addEventListener('resize',placeReference);

 // 仅拦截指向本地图片的普通点击，物品页面链接及 Ctrl/中键打开保持原行为。
 const dialog=document.createElement('dialog');dialog.id='sample-image-viewer';dialog.setAttribute('aria-labelledby','sample-image-title');
 const title=document.createElement('h2');title.id='sample-image-title';
 const bar=document.createElement('div');bar.className='sample-viewer-bar';
 const counter=document.createElement('span');counter.className='sample-viewer-counter';counter.setAttribute('aria-live','polite');
 function control(action){const button=document.createElement('button');button.type='button';button.dataset.viewerAction=action;bar.append(button);return button;}
 const previous=control('previous'),next=control('next'),zoom=control('zoom'),close=control('close');bar.prepend(title,counter);
 const figure=document.createElement('figure'),canvas=document.createElement('div'),image=document.createElement('img'),caption=document.createElement('figcaption');
 canvas.className='sample-viewer-canvas';canvas.append(image);figure.append(canvas,caption);dialog.append(bar,figure);document.body.append(dialog);
 let gallery=[],index=0,opener=null,savedOverflow='',zoomed=false;
 function imageUrl(link){
  try{const url=new URL(link.href);return url.protocol===location.protocol&&url.host===location.host&&/\.(?:png|jpe?g|gif|svg|webp|bmp|avif)$/i.test(url.pathname)?url.href:null;}catch{return null;}
 }
 function describe(link){
  const block=link.closest('figure,.gallerybox,.thumbinner');
  return block?.querySelector('figcaption,.gallerytext,.thumbcaption')?.textContent.trim() || link.querySelector('img')?.alt || link.title ||
   link.closest('.infobox-root')?.querySelector('.infobox-title')?.textContent.trim() || decodeURIComponent(new URL(link.href).pathname.split('/').pop());
 }
 function renderImage(){
  const link=gallery[index],description=describe(link);image.src=imageUrl(link);image.alt=description;caption.textContent=description;
  title.textContent=text('图片查看','Image viewer');counter.textContent=(index+1)+' / '+gallery.length;
  previous.textContent=text('上一张','Previous');next.textContent=text('下一张','Next');close.textContent=text('关闭','Close');
  previous.disabled=next.disabled=gallery.length<2;
  zoomed=false;canvas.classList.remove('sample-viewer-zoomed');zoom.textContent=text('放大','Zoom in');zoom.setAttribute('aria-pressed','false');
 }
 function move(step){index=(index+step+gallery.length)%gallery.length;renderImage();}
 previous.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));close.addEventListener('click',()=>dialog.close());
 zoom.addEventListener('click',()=>{zoomed=!zoomed;canvas.classList.toggle('sample-viewer-zoomed',zoomed);zoom.textContent=zoomed?text('适应窗口','Fit to window'):text('放大','Zoom in');zoom.setAttribute('aria-pressed',String(zoomed));});
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
 dialog.addEventListener('close',()=>{document.documentElement.style.overflow=savedOverflow;image.removeAttribute('src');opener?.focus({preventScroll:true});});
 document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest('a[href]');if(!link||!link.querySelector('img')||!imageUrl(link))return;
  const section=link.closest('#sample-zh,#sample-en');if(!section)return;
  const scope=link.closest('.gallery')||section,seen=new Set();
  gallery=Array.from(scope.querySelectorAll('a[href]')).filter(a=>{
   const url=imageUrl(a);if(!url||!a.querySelector('img')||!a.getClientRects().length||seen.has(url))return false;seen.add(url);return true;
  });
  index=gallery.findIndex(a=>imageUrl(a)===imageUrl(link));if(index<0)return;
  event.preventDefault();hideReference();opener=link;savedOverflow=document.documentElement.style.overflow;
  renderImage();dialog.showModal();document.documentElement.style.overflow='hidden';close.focus();
 });
 document.addEventListener('keydown',event=>{
  if(dialog.open){
   if(event.key==='Escape'){event.preventDefault();dialog.close();}
   else if(event.key==='ArrowRight'){event.preventDefault();move(1);}
   else if(event.key==='ArrowLeft'){event.preventDefault();move(-1);}
  }else if(event.key==='Escape')hideReference();
 });
 document.addEventListener('sample-language-change',()=>{hideReference();if(dialog.open)dialog.close();});
})();

// 词条与引用预览共用设置；摘要按需从本站载入，兼容 file:// 和子目录部署。
(function () {
 const english=()=>document.documentElement.lang==='en';
 const text=(zh,en)=>english()?en:zh;
 const root=new URL((document.documentElement.dataset.wikiRoot||'.')+'/',location.href);
 // 移除正文链接的原生 title 提示，避免白色小框与深色预览重叠。
 // 无文字的图标链接保留无障碍名称；中英文正文同时处理，关闭预览也不恢复旧提示。
 for(const node of document.querySelectorAll('#sample-zh a[title],#sample-en a[title],#sample-zh a [title],#sample-en a [title]')){
  if(node.title&&!node.hasAttribute('aria-label')&&!node.textContent.trim())node.setAttribute('aria-label',node.title);
  node.removeAttribute('title');
 }
 const storageKey='valheim-previews:'+root.pathname;
 let preferences={pages:true,references:true};
 try {
  const saved=JSON.parse(localStorage.getItem(storageKey)||'null');
  for(const key of ['pages','references'])if(typeof saved?.[key]==='boolean')preferences[key]=saved[key];
 } catch { /* 存储不可用或旧数据损坏时继续使用默认设置。 */ }
 window.ValheimPreviewSettings=preferences;
 const popup=document.createElement('div');popup.id='sample-page-preview';popup.setAttribute('role','tooltip');popup.hidden=true;
 const excerpt=document.createElement('a');excerpt.className='sample-preview-excerpt';
 const settings=document.createElement('dialog');settings.id='sample-preview-settings';settings.setAttribute('aria-labelledby','sample-preview-settings-title');
 const header=document.createElement('div');header.className='sample-preview-settings-header';
 const close=document.createElement('button');close.type='button';close.className='sample-preview-close';close.textContent='×';
 const heading=document.createElement('h2');heading.id='sample-preview-settings-title';
 const save=document.createElement('button');save.type='button';save.className='sample-preview-save';header.append(close,heading,save);
 const body=document.createElement('div');body.className='sample-preview-settings-body';
 const fields={};
 for(const key of ['pages','references']){
  const label=document.createElement('label'),checkbox=document.createElement('input'),copy=document.createElement('span'),name=document.createElement('strong'),description=document.createElement('span');
  checkbox.type='checkbox';checkbox.name=key;copy.append(name,description);label.append(checkbox,copy);body.append(label);fields[key]={checkbox,name,description};
 }
 const status=document.createElement('p');status.setAttribute('role','status');status.hidden=true;body.append(status);settings.append(header,body);
 const entry=document.createElement('button');entry.id='sample-preview-options';entry.type='button';entry.setAttribute('aria-haspopup','dialog');
 (document.querySelector('.sample-floating-tools')||document.body).append(entry);
 document.body.append(popup,settings);
 let active=null,descriptionBefore=null,showTimer,hideTimer,request=0,loading=null,settingsOpener=null;
 function hide(){
  clearTimeout(showTimer);clearTimeout(hideTimer);request++;popup.hidden=true;
  if(active){if(descriptionBefore===null)active.removeAttribute('aria-describedby');else active.setAttribute('aria-describedby',descriptionBefore);}
  active=null;
 }
 function scheduleHide(){clearTimeout(hideTimer);clearTimeout(showTimer);hideTimer=setTimeout(hide,180);}
 function place(){
  if(!active||popup.hidden)return;
  const anchor=active.getBoundingClientRect(),box=popup.getBoundingClientRect();
  if(anchor.bottom<0||anchor.top>innerHeight){hide();return;}
  const left=Math.max(12,Math.min(innerWidth-box.width-12,anchor.left));
  let top=anchor.bottom+8;if(top+box.height>innerHeight-12)top=anchor.top-box.height-8;
  popup.style.left=left+'px';popup.style.top=Math.max(12,Math.min(innerHeight-box.height-12,top))+'px';
 }
 function load(){
  if(window.VALHEIM_PAGE_PREVIEWS)return Promise.resolve(window.VALHEIM_PAGE_PREVIEWS);
  if(loading)return loading;
  loading=new Promise((resolve,reject)=>{
   const script=document.createElement('script'),url=new URL('assets/page-previews.js',root);
   if(document.documentElement.dataset.siteVersion)url.searchParams.set('v',document.documentElement.dataset.siteVersion);
   script.src=url.href;
   const timer=setTimeout(failed,12000);
   function failed(){clearTimeout(timer);script.remove();loading=null;reject(new Error('Preview index unavailable'));}
   script.onerror=failed;script.onload=()=>{clearTimeout(timer);if(window.VALHEIM_PAGE_PREVIEWS)resolve(window.VALHEIM_PAGE_PREVIEWS);else failed();};document.head.append(script);
  });
  return loading;
 }
 function target(node){
  const link=node.closest?.('#sample-zh a[href],#sample-en a[href]');
  if(!link||link.closest('.reference')||link.querySelector('img')||!link.getClientRects().length)return null;
  const raw=link.getAttribute('href');if(!raw||raw.startsWith('#')||link.hasAttribute('download'))return null;
  try {
   const url=new URL(link.href),file=decodeURIComponent(url.pathname.split('/').pop());
   if(url.protocol!==root.protocol||url.host!==root.host||!url.pathname.startsWith(root.pathname)||!file.endsWith('.html'))return null;
   // 只接受本站根目录或 pages 下的页面，不把同名外部页面当作本站条目。
   const relative=url.pathname.slice(root.pathname.length);
   if(relative!==file&&relative!=='pages/'+file)return null;
   return {link,file};
  } catch {return null;}
 }
 async function show(item){
  if(!preferences.pages||settings.open||document.querySelector('#sample-image-viewer[open]'))return;
  if(active===item.link&&!popup.hidden){clearTimeout(hideTimer);return;}
  hide();active=item.link;descriptionBefore=active.getAttribute('aria-describedby');const token=++request;
  let docs;try{docs=await load();}catch{if(token===request)hide();return;}
  if(token!==request||!preferences.pages||settings.open)return;
  const record=Object.hasOwn(docs,item.file)?docs[item.file]:null,summary=record?.[english()?'en':'zh'];
  if(!summary){hide();return;}
  document.dispatchEvent(new Event('sample-page-preview-show'));
  excerpt.href=active.href;excerpt.replaceChildren();
  const title=record[english()?'titleEn':'titleZh'];
  if(title&&summary.startsWith(title)){
   const strong=document.createElement('strong');strong.textContent=title;excerpt.append(strong,document.createTextNode(summary.slice(title.length)));
  }else excerpt.textContent=summary;
  popup.replaceChildren(excerpt,gear());
  active.setAttribute('aria-describedby',(descriptionBefore?descriptionBefore+' ':'')+popup.id);popup.hidden=false;place();
 }
 function openSettings(opener){
  settingsOpener=opener;hide();document.dispatchEvent(new Event('sample-page-preview-show'));
  for(const key of ['pages','references'])fields[key].checkbox.checked=preferences[key];
  status.hidden=true;updateLabels();settings.showModal();close.focus();
 }
 function gear(){
  const button=document.createElement('button');button.type='button';button.className='sample-preview-gear';button.textContent='⚙';
  button.setAttribute('aria-label',text('预览设置','Preview settings'));button.setAttribute('aria-haspopup','dialog');
  button.addEventListener('click',()=>openSettings(button));return button;
 }
 function updateLabels(){
  heading.textContent=text('预览','Previews');save.textContent=text('保存','Save');close.setAttribute('aria-label',text('关闭','Close'));entry.textContent=text('预览设置','Preview settings');
  fields.pages.name.textContent=text('页面预览','Page previews');fields.pages.description.textContent=text('阅读页面时，快速预览词条介绍。','Get quick previews of a topic while reading a page.');
  fields.references.name.textContent=text('引用预览','Reference previews');fields.references.description.textContent=text('阅读页面时，快速预览引用内容。','Get quick previews of a reference while reading a page.');
  for(const button of document.querySelectorAll('.sample-preview-gear')){button.setAttribute('aria-label',text('预览设置','Preview settings'));}
 }
 entry.addEventListener('click',()=>openSettings(entry));close.addEventListener('click',()=>settings.close());
 save.addEventListener('click',()=>{
  for(const key of ['pages','references'])preferences[key]=fields[key].checkbox.checked;
  hide();document.dispatchEvent(new Event('sample-preview-settings-change'));
  try{localStorage.setItem(storageKey,JSON.stringify(preferences));settings.close();}
  catch{status.textContent=text('设置已在当前页面生效；浏览器禁止保存，下次打开将恢复默认。','Applied for this page. Browser storage is unavailable; settings will reset next time.');status.hidden=false;}
 });
 settings.addEventListener('click',event=>{if(event.target!==settings)return;const box=settings.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)settings.close();});
 settings.addEventListener('close',()=>{const opener=settingsOpener;settingsOpener=null;(opener?.getClientRects().length?opener:entry).focus({preventScroll:true});});
 document.addEventListener('mouseover',event=>{
  const item=target(event.target);if(!item||item.link.contains(event.relatedTarget))return;
  clearTimeout(hideTimer);clearTimeout(showTimer);showTimer=setTimeout(()=>show(item),300);
 });
 document.addEventListener('mouseout',event=>{const item=target(event.target);if(item&&!item.link.contains(event.relatedTarget))scheduleHide();});
 document.addEventListener('focusin',event=>{const item=target(event.target);if(item)show(item);});
 document.addEventListener('focusout',event=>{if(target(event.target))scheduleHide();});
 document.addEventListener('click',event=>{if(target(event.target))hide();});
 popup.addEventListener('mouseenter',()=>clearTimeout(hideTimer));popup.addEventListener('mouseleave',scheduleHide);
 popup.addEventListener('focusin',()=>clearTimeout(hideTimer));popup.addEventListener('focusout',scheduleHide);
 document.addEventListener('sample-reference-preview-show',event=>{hide();event.detail.append(gear());});
 document.addEventListener('sample-language-change',()=>{hide();updateLabels();if(settings.open)settings.close();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});
 window.addEventListener('scroll',place,{passive:true});window.addEventListener('resize',place);
 updateLabels();
})();