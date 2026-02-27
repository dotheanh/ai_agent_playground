(async function(){
  const host = document.getElementById('version-menu');
  if(!host) return;

  let versions = [];
  try{
    const res = await fetch('/gunny/shared/versions.json', {cache:'no-store'});
    versions = await res.json();
  }catch(e){
    versions = [
      {label:'Latest', href:'/gunny/', ts:'latest'},
      {label:'Version 2', href:'/gunny/v2/', ts:'2026-02-27'},
      {label:'Version 1', href:'/gunny/v1/', ts:'2026-02-27'}
    ];
  }

  const cur = location.pathname.replace(/\/+$/,'/') || '/';

  // sort: latest first, then by ts desc
  versions.sort((a,b)=>{
    const al = a.ts==='latest', bl=b.ts==='latest';
    if(al && !bl) return -1;
    if(!al && bl) return 1;
    return String(b.ts).localeCompare(String(a.ts));
  });

  const wrap = document.createElement('div');
  wrap.className = 'versions';

  for(const v of versions){
    const a = document.createElement('a');
    a.className = 'pill';
    a.href = v.href;
    a.textContent = v.label;
    if(v.href.replace(/\/+$/,'/') === cur) {
      a.style.borderColor = 'rgba(255,45,45,.55)';
      a.style.color = 'rgba(255,255,255,.95)';
    }
    wrap.appendChild(a);
  }

  host.innerHTML = '';
  host.appendChild(wrap);
})();
