/* 离线索引通过本地 script 加载，file:// 下也无需请求服务器。 */
(function(){
 const fold=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[_\s]+/g,' ').trim();
 const prepared=new WeakMap();
 // 每次加载索引只规范化一次正文；别名同时帮助定位条目和正文中的同一物品。
 function prepare(docs){
  if(prepared.has(docs))return prepared.get(docs);
  const synonyms=new Map(),items=docs.map(doc=>{
   const titles=[fold(doc.zh),fold(doc.en)],aliases=(doc.aliases||[]).map(fold);
   const names=[...new Set([...titles,...aliases].filter(Boolean))];
   for(const name of names){const variants=synonyms.get(name)||new Set();names.forEach(n=>variants.add(n));synonyms.set(name,variants);}
   return {doc,titles,aliases,body:fold(doc.textZh)+' '+fold(doc.textEn),names};
  });
  const result={items,synonyms};prepared.set(docs,result);return result;
 }
 function rank(docs,query,limit=20){
  const q=fold(query);if(!q)return [];
  const {items,synonyms}=prepare(docs),words=synonyms.has(q)?[q]:q.split(/\s+/).filter(Boolean);
  const groups=words.map(word=>[...(synonyms.get(word)||[word])]),matches=[];
  for(const {doc,titles,aliases,body,names} of items){
   const text=names.join(' ')+' '+body;
   if(!groups.every(group=>group.some(word=>text.includes(word))))continue;
   const titleTerms=groups.filter(group=>group.some(word=>titles.some(title=>title.includes(word)))).length;
   const score=titles.includes(q)?1000:aliases.includes(q)?900:titles.some(t=>t.startsWith(q))?800:titles.some(t=>t.includes(q))?700:
    titleTerms===groups.length?600:aliases.some(t=>t.includes(q))?500:100+titleTerms*100;
   matches.push({...doc,score,matchedTerms:[...new Set(groups.flat())]});
  }
  return matches.sort((a,b)=>b.score-a.score||a.file.localeCompare(b.file)).slice(0,limit);
 }
 // 通过本地 script 按需加载，避免 file:// 的 fetch 限制；并发搜索共用一次加载。
 function createIndexLoader(doc,host,url){
  let pending=null;
  return function load(){
   if(Array.isArray(host.VALHEIM_SEARCH))return Promise.resolve(host.VALHEIM_SEARCH);
   if(pending)return pending;
   pending=new Promise((resolve,reject)=>{
    const script=doc.createElement('script');script.src=url;script.async=true;
    function fail(){pending=null;script.remove();reject(new Error('Search index unavailable'));}
    script.onerror=fail;
    script.onload=()=>{if(Array.isArray(host.VALHEIM_SEARCH))resolve(host.VALHEIM_SEARCH);else fail();};
    doc.head.append(script);
   });
   return pending;
  };
 }
 if(typeof module!=='undefined')module.exports={rank,createIndexLoader};
 if(typeof document==='undefined')return;
 const input=document.querySelector('#sample-search'),panel=document.querySelector('#sample-search-results'),form=document.querySelector('#sample-search-form');
 if(!input||!panel||!form)return;
 const indexUrl=new URL('search-data.js',document.currentScript.src).href;
 const loadIndex=createIndexLoader(document,window,indexUrl);
 let generation=0;
 function highlighted(parent,value,terms){
  const escaped=[...new Set(terms.filter(Boolean))].sort((a,b)=>b.length-a.length).map(term=>term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  if(!escaped.length){parent.textContent=value;return;}
  const pattern=new RegExp(escaped.join('|'),'giu');let start=0;
  for(const match of value.matchAll(pattern)){
   parent.append(document.createTextNode(value.slice(start,match.index)));
   const mark=document.createElement('mark');mark.textContent=match[0];parent.append(mark);start=match.index+match[0].length;
  }
  parent.append(document.createTextNode(value.slice(start)));
 }
 async function render(){
  const current=++generation;
  const q=input.value.trim(),en=document.documentElement.lang==='en';panel.replaceChildren();panel.hidden=!q;
  if(!q)return;
  const loading=document.createElement('p');loading.textContent=en?'Loading search index…':'正在加载搜索索引…';panel.append(loading);
  let docs;
  try{docs=await loadIndex();}catch(error){
   if(current!==generation)return;
   panel.replaceChildren();const message=document.createElement('p');message.textContent=en?'Search index could not be loaded. Check assets/search-data.js and search again to retry.':'搜索索引加载失败。请检查 assets/search-data.js，重新搜索可重试。';panel.append(message);return;
  }
  // 加载期间可能清空输入、修改关键词或切换语言，旧结果不得覆盖新状态。
  if(current!==generation)return;
  panel.replaceChildren();
  const results=rank(docs,q,Infinity),summary=document.createElement('p');panel.append(summary);
  let shown=0;
  const more=document.createElement('button');more.type='button';more.className='sample-search-more';more.textContent=en?'Show more results':'显示更多结果';
  function addBatch(){
   more.remove();const end=Math.min(shown+20,results.length);
   for(const result of results.slice(shown,end)){
   const item=document.createElement('article'),link=document.createElement('a'),snippet=document.createElement('p');
   link.href=(document.documentElement.dataset.wikiRoot||'.')+'/'+result.file+(en?'?lang=en':'');highlighted(link,en?result.en:result.zh,result.matchedTerms);link.dataset.localPage='true';
   const body=(en?result.textEn:result.textZh)||'',positions=result.matchedTerms.map(term=>fold(body).indexOf(term)).filter(pos=>pos>=0);
   const pos=positions.length?Math.min(...positions):0,start=Math.max(0,pos-40);
   highlighted(snippet,(start?'…':'')+body.slice(start,start+160)+(body.length>start+160?'…':''),result.matchedTerms);item.append(link,snippet);panel.append(item);
   }
   shown=end;summary.textContent=results.length?(en?`${results.length} matching pages · showing ${shown}`:`找到 ${results.length} 个页面，已显示 ${shown} 条`):(en?'No matching pages. Try an item name or alias.':'没有匹配的页面，可尝试物品名称、别名或英文名称。');
   if(shown<results.length)panel.append(more);
  }
  more.addEventListener('click',addBatch);addBatch();
 }
 let timer;input.addEventListener('input',()=>{generation++;clearTimeout(timer);timer=setTimeout(render,120);});
 form.addEventListener('submit',e=>{e.preventDefault();clearTimeout(timer);render();});
 document.addEventListener('sample-language-change',render);
 input.addEventListener('keydown',e=>{if(e.key==='Escape'){input.value='';render();}});
})();
