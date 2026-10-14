/* 在线检查只读取本站版本；本地文件浏览不发起请求，也不会自动打断阅读。 */
(function(){
 const valid=value=>typeof value==='string'&&/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(value);
 function newer(candidate,current){
  if(!valid(candidate)||!valid(current))return false;
  const a=candidate.split('.').map(BigInt),b=current.split('.').map(BigInt);
  for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i];}
  return false;
 }
 function versionUrl(pageUrl,root,stamp){
  const page=new URL(pageUrl),url=new URL((root||'.')+'/version.json',page);
  if(!/^https?:$/.test(page.protocol)||url.origin!==page.origin)return null;
  url.searchParams.set('_',String(stamp));return url.href;
 }
 function reloadUrl(pageUrl,version){
  if(!valid(version))throw new Error('Invalid release version');
  const url=new URL(pageUrl);url.searchParams.set('v',version);return url.href;
 }
 async function checkRelease(fetcher,url,current,signal){
  if(!url||!valid(current))return null;
  const response=await fetcher(url,{cache:'no-store',credentials:'same-origin',signal});
  if(!response.ok)return null;
  const data=await response.json();return newer(data.version,current)?data.version:null;
 }
 if(typeof module!=='undefined')module.exports={valid,newer,versionUrl,reloadUrl,checkRelease};
 if(typeof document==='undefined'||!/^https?:$/.test(location.protocol))return;
 const current=document.documentElement.dataset.siteVersion;
 if(!valid(current)||typeof fetch!=='function')return;
 let pending=false,lastCheck=0,latest=null,dismissed=null,banner=null;
 const en=()=>document.documentElement.lang==='en';
 function labels(){
  if(!banner)return;
  banner.querySelector('span').textContent=en()?`Version ${latest} is available.`:`网站已更新至 ${latest}。`;
  const buttons=banner.querySelectorAll('button');
  buttons[0].textContent=en()?'Refresh to update':'刷新到新版';
  buttons[1].textContent=en()?'Later':'稍后';
 }
 function show(version){
  latest=version;if(dismissed===version)return;
  if(!banner){
   banner=document.createElement('aside');banner.className='sample-update-notice';banner.setAttribute('role','status');
   const message=document.createElement('span'),refresh=document.createElement('button'),close=document.createElement('button');
   refresh.type=close.type='button';banner.append(message,refresh,close);document.body.append(banner);
   refresh.addEventListener('click',()=>location.assign(reloadUrl(location.href,latest)));
   close.addEventListener('click',()=>{dismissed=latest;banner.hidden=true;});
  }
  banner.hidden=false;labels();
 }
 async function check(){
  const now=Date.now();if(pending||document.hidden||now-lastCheck<300000)return;
  lastCheck=now;pending=true;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{
   const version=await checkRelease(fetch,versionUrl(location.href,document.documentElement.dataset.wikiRoot,now),current,controller.signal);
   if(version)show(version);
  }catch{/* 网络失败不影响阅读；下一次检查可以重试。 */}
  finally{clearTimeout(timer);pending=false;}
 }
 document.addEventListener('sample-language-change',labels);
 document.addEventListener('visibilitychange',check);
 window.addEventListener('pageshow',check);
 setInterval(check,300000);check();
})();
