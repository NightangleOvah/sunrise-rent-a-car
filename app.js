import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const WHATSAPP = 'https://wa.me/94776380753';
const USD_LKR = 305;

const vehicles = [
  {id:'magnite',name:'Nissan Magnite',className:'Compact SUV',group:'suv',image:'assets/fleet/magnite.jpg',color:0xc8c8c8,capacity:5},
  {id:'yaris-cross',name:'Toyota Yaris Cross',className:'Hybrid SUV',group:'suv',image:'assets/fleet/yaris-cross.jpg',color:0xe8e8e8,capacity:5},
  {id:'alto',name:'Suzuki Alto',className:'Economy City',group:'small',image:'assets/fleet/alto.jpg',color:0xf0f0f0,capacity:4},
  {id:'axio',name:'Toyota Axio',className:'Executive Sedan',group:'sedan',image:'assets/fleet/axio.jpg',color:0xd7d7d7,capacity:5},
  {id:'prius',name:'Toyota Prius',className:'Hybrid Elite',group:'sedan',image:'assets/fleet/prius.jpg',color:0xe2e2e2,capacity:5},
  {id:'vitz',name:'Toyota Vitz',className:'Urban Compact',group:'hatch',image:'assets/fleet/vitz.jpg',color:0xbebebe,capacity:5},
  {id:'kdh',name:'Toyota KDH High Roof',className:'Group Transit Van',group:'van',image:'assets/fleet/kdh.jpg',color:0xe5e5e5,capacity:11},
  {id:'xpander',name:'Mitsubishi Xpander',className:'7-Seater MPV',group:'suv',image:'assets/fleet/xpander.jpg',color:0xbdbdbd,capacity:7}
];

const rates = {
  small:{name:'SMALL CARS',extra:40,hour:300,local:'20,000–50,000',abroad:'50,000–100,000',rows:[['Alto K / Alto C / Alto Auto',['3,000–5,000','4,000–6,000','5,500–7,500','7,500–9,500']],['Passo / Wagon R',['6,000–7,500','7,000–8,500','8,500–10,000','10,500–12,000']]]},
  hatch:{name:'HATCHBACK / MINI SUV',extra:50,hour:500,local:'30,000–40,000',abroad:'60,000–80,000',rows:[['Vitz / Nissan Leaf / Aqua / Vitz New / GP5 / Yaris',['6,500–7,500','8,500–9,000','10,500–11,500','13,000–14,500']]]},
  sedan:{name:'SEDAN / HYBRID',extra:55,hour:500,local:'40,000',abroad:'80,000',rows:[['Insight / Shuttle / Prius / Premio / Axio Hybrid',['7,000–9,000','8,500–11,000','10,500–13,500','13,000–16,500']]]},
  suv:{name:'SUV / MINI SUV',extra:90,hour:1000,local:'30,000–150,000',abroad:'60,000–200,000',rows:[['Magnite / Vezel / Raize / CHR / Yaris Cross / VEZEL RS / Outlander / DFSK 580 / XPander',['7,000–11,500','9,000–14,000','11,000–17,000','13,500–20,000']]]},
  van:{name:'VANS / GROUP TRANSIT',extra:70,hour:550,local:'25,000–150,000',abroad:'50,000–200,000',rows:[['Daihatsu Hijet / Every Buddy / DFSK 7 Mini / KDH 10–11 Seater / KDH 222–14 Seater',['6,000–15,000','7,000–18,000','8,500–22,000','10,500–26,000']]}
};
const packages = [50,100,200,300];
const routes = [['CMB AIRPORT → KANDY',115],['CMB AIRPORT → COLOMBO',32],['COLOMBO → GALLE',126],['KANDY → ELLA',135],['KANDY → NUWARA ELIYA',77],['SIGIRIYA CULTURAL TRIANGLE',150]];

let selected = vehicles.find(v=>v.id==='kdh');
let service = 'chauffeur', currency = 'LKR', exploded = false;
let scene, camera, renderer, vehicleGroup, texturePlane, clock, currentTexture;
let targetX=0,targetY=0,rotX=0,rotY=0;
let booted = false;

function formatLKR(v){ return 'LKR '+Math.round(v).toLocaleString('en-LK'); }
function midpoint(range){ const n=range.replace(/,/g,'').split('–').map(Number); return n.length===2 ? (n[0]+n[1])/2 : n[0]; }
function rateFor(group, pack){ const i=packages.indexOf(Number(pack)); return i<0 ? null : rates[group].rows[0][1][i]; }

function fallbackData(v){
  const label = encodeURIComponent(v.name.toUpperCase());
  const sub = encodeURIComponent(v.className.toUpperCase());
  return `data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700"><rect width="1200" height="700" fill="%23000000"/><path d="M70 565H1130M130 500L260 390H800L1040 500" fill="none" stroke="%23fef08a" stroke-width="3" opacity=".7"/><path d="M270 390L340 290H740L805 390" fill="none" stroke="%23ffffff" stroke-width="3"/><circle cx="330" cy="505" r="62" fill="none" stroke="%23ffffff" stroke-width="5"/><circle cx="870" cy="505" r="62" fill="none" stroke="%23ffffff" stroke-width="5"/><text x="70" y="100" fill="%23fef08a" font-family="monospace" font-size="30">SUNRISE CABS / FLEET FALLBACK</text><text x="70" y="160" fill="%23ffffff" font-family="Arial" font-size="54" font-weight="900">${label}</text><text x="70" y="205" fill="%23888888" font-family="monospace" font-size="24">[ ${sub} ]</text></svg>`;
}

function safeImage(img,v){
  if(!img || img.dataset.fallbackApplied==='1') return;
  img.dataset.fallbackApplied='1';
  img.src=fallbackData(v);
  img.classList.add('asset-fallback');
  img.removeAttribute('srcset');
}
function wireImageFallback(img,v){
  if(!img) return;
  img.addEventListener('error',()=>safeImage(img,v),{once:true});
  img.addEventListener('load',()=>img.classList.remove('asset-fallback'),{passive:true});
}

function buildRoutes(){
  const host=$('#routebar'); if(!host) return;
  host.replaceChildren();
  routes.forEach(([name,distance])=>{
    const b=document.createElement('button'); b.className='pill'; b.textContent='[ '+name+' ]';
    b.onclick=()=>{$('#distance').value=distance;$('#pickup').value=name;updateQuote();document.querySelector('#routes')?.scrollIntoView({behavior:'smooth'});};
    host.appendChild(b);
  });
}

function buildFleetList(){
  const host=$('#fleetlist'); if(!host) return;
  host.replaceChildren();
  vehicles.forEach(v=>{
    const b=document.createElement('button'); b.className='fleet-item'; b.dataset.vehicle=v.id;
    b.innerHTML=`<img src="${v.image}" alt="${v.name}" loading="lazy"><span><strong>${v.name}</strong><span>[ ${v.className} ] · ${v.capacity} SEATS</span></span>`;
    wireImageFallback($('img',b),v);
    b.onclick=()=>selectVehicle(v.id);
    host.appendChild(b);
  });
}

function buildGallery(){
  const host=$('#fleetGallery'); if(!host) return;
  host.replaceChildren();
  vehicles.forEach((v,i)=>{
    const f=document.createElement('figure'); f.className='gallery-card'; f.dataset.vehicle=v.id;
    f.innerHTML=`<img src="${v.image}" alt="${v.name} — Sunrise Cabs Sri Lanka" loading="lazy"><figcaption><div class="mono">[ 0${i+1} / 08 ] · ${v.group.toUpperCase()}</div><div class="vehicle-name">${v.name}</div><div class="vehicle-meta mono">${v.className} · ${v.capacity} SEATS</div></figcaption>`;
    wireImageFallback($('img',f),v);
    f.addEventListener('pointerenter',()=>f.classList.add('is-active'));
    f.addEventListener('pointerleave',()=>f.classList.remove('is-active'));
    f.addEventListener('click',()=>{selectVehicle(v.id);openLightbox(i);document.querySelector('#fleet')?.scrollIntoView({behavior:'smooth'});});
    host.appendChild(f);
  });
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('is-active')),{threshold:.35});
    $$('.gallery-card').forEach(c=>observer.observe(c));
  }
}

function openLightbox(i){
  const v=vehicles[(i+vehicles.length)%vehicles.length], box=$('#lightbox'),img=$('#lightboxImage');
  if(!box||!img) return;
  img.dataset.vehicle=v.id; img.src=v.image; img.alt=v.name; wireImageFallback(img,v);
  $('#lightboxTitle').textContent=v.name; $('#lightboxMeta').textContent=`[ ${v.className.toUpperCase()} ] · [ ${v.capacity} SEATS ]`;
  box.classList.add('open'); box.setAttribute('aria-hidden','false'); box.dataset.index=String(i);
}
function closeLightbox(){ $('#lightbox')?.classList.remove('open'); $('#lightbox')?.setAttribute('aria-hidden','true'); }
function stepLightbox(d){ openLightbox((Number($('#lightbox')?.dataset.index||0)+d+vehicles.length)%vehicles.length); }

function buildRatesTable(){
  const host=$('#ratesTable'); if(!host) return;
  host.innerHTML='<div class="rate-row header"><b>CLASS / VEHICLES</b><b>50 KM</b><b>100 KM</b><b>200 KM</b><b>300 KM</b><b>EXTRA</b></div>';
  Object.values(rates).forEach(group=>group.rows.forEach(row=>{
    const el=document.createElement('div'); el.className='rate-row';
    el.innerHTML=`<b>${row[0]}</b>${row[1].map(x=>`<span>${x}</span>`).join('')}<span>${group.extra} LKR/KM · ${group.hour} LKR/HOUR</span>`;
    host.appendChild(el);
  }));
}

function updateQuote(){
  const pack=Number($('#pkg')?.value||100),days=Math.max(1,Number($('#days')?.value||1)),distance=Math.max(0,Number($('#distance')?.value||0));
  const text=rateFor(selected.group,pack),group=rates[selected.group];
  if(!text){if($('#total'))$('#total').textContent='CONTACT';return;}
  const base=midpoint(text),extraKm=Math.max(0,distance-pack)*group.extra,serviceFactor=service==='chauffeur'?1.08:1;
  const total=Math.round((base*days+extraKm+300)*serviceFactor);
  $('#total').textContent=currency==='LKR'?formatLKR(total):'USD '+Math.round(total/USD_LKR).toLocaleString('en-US');
  $('#quote').textContent=`[ ${pack} KM/DAY ] [ EXTRA ${group.extra} LKR/KM ] [ ${group.hour} LKR/HOUR ] [ DOC 300 LKR ]`;
  $('#localDeposit').textContent='DEPOSIT LKR '+group.local;
  $('#abroadDeposit').textContent='DEPOSIT LKR '+group.abroad;
  $('#selectedVehicle').textContent=`[ ${selected.name.toUpperCase()} ]`;
}

function selectVehicle(id){
  selected=vehicles.find(v=>v.id===id)||selected;
  $$('.fleet-item').forEach(b=>b.classList.toggle('active',b.dataset.vehicle===selected.id));
  if($('#class'))$('#class').value=selected.group;
  if($('#hud'))$('#hud').textContent=`[ ${selected.name.toUpperCase()} ] · [ ${selected.className.toUpperCase()} ]`;
  updateQuote(); loadVehicleTexture(selected.image,selected); buildVehicleModel();
}

function createMaterial(color,metalness=.75,roughness=.18){return new THREE.MeshPhysicalMaterial({color,metalness,roughness,clearcoat:.9,clearcoatRoughness:.08});}
function buildVehicleModel(){
  if(!vehicleGroup)return;
  vehicleGroup.clear();
  const van=selected.id==='kdh';
  const body=new THREE.Mesh(new THREE.BoxGeometry(van?3.5:3.05,van?1.25:1,van?5:4.4,8,3,8),createMaterial(selected.color,.92,.12)); body.position.y=.9; vehicleGroup.add(body);
  const cabin=new THREE.Mesh(new THREE.BoxGeometry(van?3:2.55,.78,van?3.1:2.65,8,3,8),createMaterial(0x11151b,.65,.08)); cabin.position.y=1.68; vehicleGroup.add(cabin);
  const bumper=new THREE.Mesh(new THREE.BoxGeometry(van?3.25:2.9,.28,.35,8,2,4),createMaterial(0x0a0a0a,.8,.2)); bumper.position.set(0,.45,van?2.55:2.2); vehicleGroup.add(bumper);
  for(const x of[-1.25,1.25])for(const z of[-1.7,1.7]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.3,28),createMaterial(0x080808,.95,.2));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.42,z);vehicleGroup.add(wheel);}
  if(exploded)vehicleGroup.children.forEach((o,i)=>{if(i)o.position.y+=.13+i*.035;});
}

function loadVehicleTexture(path,v){
  if(!texturePlane)return;
  const loader=new THREE.TextureLoader();
  loader.load(path,t=>{if(currentTexture)currentTexture.dispose();currentTexture=t;t.colorSpace=THREE.SRGBColorSpace;texturePlane.material.map=t;texturePlane.material.opacity=.24;texturePlane.material.needsUpdate=true;},undefined,()=>{
    const texture=new THREE.TextureLoader().load(fallbackData(v)); texture.colorSpace=THREE.SRGBColorSpace; texturePlane.material.map=texture; texturePlane.material.opacity=.18; texturePlane.material.needsUpdate=true;
  });
}

function initThree(){
  const mount=$('#stage'); if(!mount) return;
  try{
    const rect=mount.getBoundingClientRect(),w=Math.max(1,Math.floor(rect.width)),h=Math.max(1,Math.floor(rect.height));
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75)); renderer.setSize(w,h,false); renderer.setClearColor(0x000000,1); renderer.outputColorSpace=THREE.SRGBColorSpace; mount.prepend(renderer.domElement);
    scene=new THREE.Scene(); camera=new THREE.PerspectiveCamera(34,w/h,.1,100); camera.position.set(0,1.6,8.2);
    scene.add(new THREE.HemisphereLight(0x312e81,0x000000,1.7)); const key=new THREE.SpotLight(0xffffff,9,40,Math.PI/5,.45,1.4); key.position.set(4,8,6); scene.add(key); const rim=new THREE.DirectionalLight(0xc084fc,5); rim.position.set(-5,4,-6); scene.add(rim);
    vehicleGroup=new THREE.Group(); scene.add(vehicleGroup);
    texturePlane=new THREE.Mesh(new THREE.PlaneGeometry(4.8,3),new THREE.MeshBasicMaterial({transparent:true,opacity:.18,side:THREE.DoubleSide})); texturePlane.position.set(0,2.7,-2.3); scene.add(texturePlane);
    buildVehicleModel(); loadVehicleTexture(selected.image,selected); clock=new THREE.Clock();
    const resize=()=>{const r=mount.getBoundingClientRect(),nw=Math.max(1,Math.floor(r.width)),nh=Math.max(1,Math.floor(r.height));camera.aspect=nw/nh;camera.updateProjectionMatrix();renderer.setSize(nw,nh,false);};
    if('ResizeObserver' in window)new ResizeObserver(resize).observe(mount); else addEventListener('resize',resize,{passive:true});
    const move=(x,y)=>{targetX=(x/innerWidth-.5)*1.2;targetY=-(y/innerHeight-.5)*.7;};
    addEventListener('pointermove',e=>move(e.clientX,e.clientY),{passive:true}); addEventListener('touchmove',e=>e.touches[0]&&move(e.touches[0].clientX,e.touches[0].clientY),{passive:true});
    const animate=()=>{requestAnimationFrame(animate);const t=clock.getElapsedTime();rotY+=(targetX-rotY)*.045;rotX+=(targetY-rotX)*.045;vehicleGroup.rotation.y+=.003+rotY*.006;vehicleGroup.rotation.x=rotX*.35;vehicleGroup.position.y=Math.sin(t*1.2)*.07;texturePlane.rotation.y=Math.sin(t*.35)*.05;renderer.render(scene,camera);};
    animate();
  }catch(e){console.warn('WebGL fallback',e);if($('#hud'))$('#hud').textContent='[ WEBGL_FALLBACK :: FLEET_UI_ACTIVE ]';}
}

function initBackground(){
  const canvas=$('#bg'); if(!canvas)return; const ctx=canvas.getContext('2d'); if(!ctx)return;
  let w=0,h=0; const resize=()=>{const d=Math.min(devicePixelRatio||1,1.5);w=canvas.width=innerWidth*d;h=canvas.height=innerHeight*d;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';}; resize(); addEventListener('resize',resize,{passive:true});
  const draw=()=>{ctx.clearRect(0,0,w,h);requestAnimationFrame(draw);}; draw();
}

function initBooking(){
  $('#class')?.addEventListener('change',e=>{const v=vehicles.find(x=>x.group===e.target.value);if(v)selectVehicle(v.id);else updateQuote();});
  ['pkg','days','distance'].forEach(id=>$('#'+id)?.addEventListener('input',updateQuote));
  $('#chauffeur')?.addEventListener('click',()=>{service='chauffeur';$('#chauffeur').classList.add('active');$('#selfdrive').classList.remove('active');updateQuote();});
  $('#selfdrive')?.addEventListener('click',()=>{service='selfdrive';$('#selfdrive').classList.add('active');$('#chauffeur').classList.remove('active');updateQuote();});
  $('#lkr')?.addEventListener('click',()=>{currency='LKR';$('#lkr').classList.add('active');$('#usd').classList.remove('active');updateQuote();});
  $('#usd')?.addEventListener('click',()=>{currency='USD';$('#usd').classList.add('active');$('#lkr').classList.remove('active');updateQuote();});
  $('#dispatch')?.addEventListener('click',()=>{
    updateQuote();
    const message=['SUNRISE CABS BOOKING INQUIRY','',`[ VEHICLE ] ${selected.name}`,`[ CLASS ] ${selected.className}`,`[ SERVICE ] ${service==='chauffeur'?'WITH CHAUFFEUR':'SELF DRIVE'}`,`[ PACKAGE ] ${$('#pkg')?.value} KM/DAY`,`[ DURATION ] ${$('#days')?.value} DAY(S)`,`[ ROUTE / PICKUP ] ${$('#pickup')?.value||'Not specified'}`,`[ PASSENGERS ] ${$('#passengers')?.value||'Not specified'}`,`[ CUSTOMER ] ${$('#name')?.value||'Not specified'}`,`[ FLIGHT / DATE ] ${$('#date')?.value||'Not specified'}`,`[ QUOTE ] ${$('#total')?.textContent||'CONTACT'}`,`[ NOTES ] ${$('#notes')?.value||'None'}`].join('\n');
    window.open(`${WHATSAPP}?text=${encodeURIComponent(message)}`,'_blank','noopener');
  });
}

function initNavigation(){
  $$('[data-go]').forEach(b=>b.addEventListener('click',()=>{document.querySelector('#'+b.dataset.go)?.scrollIntoView({behavior:'smooth'});$('#sheet')?.classList.remove('open');}));
  $('#menu')?.addEventListener('click',()=>$('#sheet')?.classList.toggle('open'));
  $('#explode')?.addEventListener('click',()=>{exploded=!exploded;$('#explode').classList.toggle('active',exploded);buildVehicleModel();});
  $('#lbClose')?.addEventListener('click',closeLightbox); $('#lbPrev')?.addEventListener('click',()=>stepLightbox(-1)); $('#lbNext')?.addEventListener('click',()=>stepLightbox(1));
  $('#lightbox')?.addEventListener('click',e=>{if(e.target.id==='lightbox')closeLightbox();});
  addEventListener('keydown',e=>{if(e.key==='Escape')closeLightbox();if($('#lightbox')?.classList.contains('open')){if(e.key==='ArrowLeft')stepLightbox(-1);if(e.key==='ArrowRight')stepLightbox(1);}});
  const cursor=$('#cursor'); if(cursor)addEventListener('pointermove',e=>{cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px';},{passive:true});
}

function boot(){
  if(booted)return; booted=true;
  buildRoutes(); buildFleetList(); buildGallery(); buildRatesTable(); initBooking(); initNavigation(); initBackground(); updateQuote();
  requestAnimationFrame(()=>requestAnimationFrame(initThree));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
