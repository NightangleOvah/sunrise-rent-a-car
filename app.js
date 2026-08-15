import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const $=(selector)=>document.querySelector(selector);
const $$=(selector)=>Array.from(document.querySelectorAll(selector));
const WHATSAPP='https://wa.me/94776380753';
const USD_LKR=305;

const vehicles=[
 {id:'magnite',name:'Nissan Magnite',className:'Compact SUV',group:'suv',image:'assets/fleet/magnite.jpg',color:0xc8c8c8,capacity:5},
 {id:'yaris-cross',name:'Toyota Yaris Cross',className:'Hybrid SUV',group:'suv',image:'assets/fleet/yaris-cross.jpg',color:0xe8e8e8,capacity:5},
 {id:'alto',name:'Suzuki Alto',className:'Economy City',group:'small',image:'assets/fleet/alto.jpg',color:0xf0f0f0,capacity:4},
 {id:'axio',name:'Toyota Axio',className:'Executive Sedan',group:'sedan',image:'assets/fleet/axio.jpg',color:0xd7d7d7,capacity:5},
 {id:'prius',name:'Toyota Prius',className:'Hybrid Elite',group:'sedan',image:'assets/fleet/prius.jpg',color:0xe2e2e2,capacity:5},
 {id:'vitz',name:'Toyota Vitz',className:'Urban Compact',group:'hatch',image:'assets/fleet/vitz.jpg',color:0xbebebe,capacity:5},
 {id:'kdh',name:'Toyota KDH High Roof',className:'Group Transit Van',group:'van',image:'assets/fleet/kdh.jpg',color:0xe5e5e5,capacity:11},
 {id:'xpander',name:'Mitsubishi Xpander',className:'7-Seater MPV',group:'suv',image:'assets/fleet/xpander.jpg',color:0xbdbdbd,capacity:7}
];

const rates={
 small:{name:'SMALL CARS',extra:40,hour:300,local:'20,000–50,000',abroad:'50,000–100,000',rows:[['Alto K / Alto C / Alto Auto',['3,000–5,000','4,000–6,000','5,500–7,500','7,500–9,500']],['Passo / Wagon R',['6,000–7,500','7,000–8,500','8,500–10,000','10,500–12,000']]]},
 hatch:{name:'HATCHBACK / MINI SUV',extra:50,hour:500,local:'30,000–40,000',abroad:'60,000–80,000',rows:[['Vitz / Nissan Leaf / Aqua / Vitz New / GP5 / Yaris',['6,500–7,500','8,500–9,000','10,500–11,500','13,000–14,500']]]},
 sedan:{name:'SEDAN / HYBRID',extra:55,hour:500,local:'40,000',abroad:'80,000',rows:[['Insight / Shuttle / Prius / Premio / Axio Hybrid',['7,000–9,000','8,500–11,000','10,500–13,500','13,000–16,500']]]},
 suv:{name:'SUV / MINI SUV',extra:90,hour:1000,local:'30,000–150,000',abroad:'60,000–200,000',rows:[['Magnite / Vezel / Raize / CHR / Yaris Cross / VEZEL RS / Outlander / DFSK 580 / XPander',['7,000–11,500','9,000–14,000','11,000–17,000','13,500–20,000']]]},
 van:{name:'VANS / GROUP TRANSIT',extra:70,hour:550,local:'25,000–150,000',abroad:'50,000–200,000',rows:[['Daihatsu Hijet / Every Buddy / DFSK 7 Mini / KDH 10–11 Seater / KDH 222–14 Seater',['6,000–15,000','7,000–18,000','8,500–22,000','10,500–26,000']]]}
};
const packages=[50,100,200,300];
const routes=[
 ['CMB AIRPORT → KANDY',115],['CMB AIRPORT → COLOMBO',32],['COLOMBO → GALLE',126],['KANDY → ELLA',135],['KANDY → NUWARA ELIYA',77],['SIGIRIYA CULTURAL TRIANGLE',150]
];
let selected=vehicles.find(v=>v.id==='kdh');
let service='chauffeur';
let currency='LKR';
let tier=1;
let exploded=false;
let scene,camera,renderer,vehicleGroup,texturePlane,clock;
let targetX=0,targetY=0,rotX=0,rotY=0;
let currentTexture=null;

function formatLKR(value){return 'LKR '+Math.round(value).toLocaleString('en-LK')}
function midpoint(range){const nums=range.replace(/,/g,'').split('–').map(Number);return nums.length===2?(nums[0]+nums[1])/2:nums[0]}
function rateFor(group,pack){const idx=packages.indexOf(Number(pack));return idx<0?null:rates[group].rows[0][1][idx]}
function setActiveButton(selector,value){$$(selector).forEach(b=>b.classList.toggle('active',b.dataset.value===value))}

function buildRoutes(){
 const host=$('#routebar');
 routes.forEach(([name,distance])=>{const b=document.createElement('button');b.className='pill';b.textContent='[ '+name+' ]';b.onclick=()=>{$('#distance').value=distance;$('#pickup').value=name.replaceAll(' → ',' → ');updateQuote()};host.appendChild(b)});
}

function buildFleetList(){
 const host=$('#fleetlist');
 vehicles.forEach(v=>{const button=document.createElement('button');button.className='fleet-item';button.dataset.vehicle=v.id;button.innerHTML=`<img src="${v.image}" alt="${v.name}" loading="lazy"><span><strong>${v.name}</strong><span>[ ${v.className} ] · ${v.capacity} SEATS</span></span>`;button.onclick=()=>selectVehicle(v.id);host.appendChild(button)});
}

function buildGallery(){
 const host=$('#fleetGallery');
 vehicles.forEach((v,i)=>{
  const figure=document.createElement('figure');figure.className='gallery-card';figure.dataset.vehicle=v.id;
  figure.innerHTML=`<img src="${v.image}" alt="${v.name} — Sunrise Cabs Sri Lanka" loading="lazy"><figcaption><div class="mono">[ 0${i+1} / 08 ] · ${v.group.toUpperCase()}</div><div class="vehicle-name">${v.name}</div><div class="vehicle-meta mono">${v.className} · ${v.capacity} SEATS</div></figcaption>`;
  const img=figure.querySelector('img');
  img.addEventListener('error',()=>{figure.classList.add('is-broken');img.remove()});
  figure.addEventListener('pointerenter',()=>figure.classList.add('is-active'));
  figure.addEventListener('pointerleave',()=>figure.classList.remove('is-active'));
  figure.addEventListener('click',()=>{selectVehicle(v.id);openLightbox(i);document.querySelector('#fleet').scrollIntoView({behavior:'smooth'})});
  host.appendChild(figure);
 });
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)entry.target.classList.add('is-active')}),{threshold:.35});
 $$('.gallery-card').forEach(card=>observer.observe(card));
}

function openLightbox(index){
 const v=vehicles[(index+vehicles.length)%vehicles.length];
 $('#lightboxImage').src=v.image;$('#lightboxImage').alt=v.name;$('#lightboxTitle').textContent=v.name;$('#lightboxMeta').textContent=`[ ${v.className.toUpperCase()} ] · [ ${v.capacity} SEATS ]`;
 $('#lightbox').classList.add('open');$('#lightbox').setAttribute('aria-hidden','false');
 $('#lightbox').dataset.index=String(index);
}
function closeLightbox(){$('#lightbox').classList.remove('open');$('#lightbox').setAttribute('aria-hidden','true')}
function stepLightbox(direction){const i=(Number($('#lightbox').dataset.index||0)+direction+vehicles.length)%vehicles.length;openLightbox(i)}

function updateQuote(){
 const group=selected.group;
 const pack=Number($('#pkg').value||100);
 const days=Math.max(1,Number($('#days').value||1));
 const distance=Math.max(0,Number($('#distance').value||0));
 const baseText=rateFor(group,pack);
 const groupRate=rates[group];
 if(!baseText){$('#total').textContent='CONTACT';return}
 const base=midpoint(baseText);
 const extraKm=Math.max(0,distance-pack)*groupRate.extra;
 const mileageDays=base*days;
 const serviceFactor=service==='chauffeur'?1.08:1;
 const documentFee=300;
 const total=Math.round((mileageDays+extraKm+documentFee)*serviceFactor);
 $('#total').textContent=currency==='LKR'?formatLKR(total):'USD '+Math.round(total/USD_LKR).toLocaleString('en-US');
 $('#quote').textContent=`[ ${pack} KM/DAY ] [ EXTRA ${groupRate.extra} LKR/KM ] [ ${groupRate.hour} LKR/HOUR ] [ DOC 300 LKR ]`;
 $('#localDeposit').textContent='DEPOSIT LKR '+groupRate.local;
 $('#abroadDeposit').textContent='DEPOSIT LKR '+groupRate.abroad;
 $('#selectedVehicle').textContent=`[ ${selected.name.toUpperCase()} ]`;
}

function selectVehicle(id){
 selected=vehicles.find(v=>v.id===id)||selected;
 $$('.fleet-item').forEach(b=>b.classList.toggle('active',b.dataset.vehicle===selected.id));
 $('#class').value=selected.group;
 $('#hud').textContent=`[ ${selected.name.toUpperCase()} ] · [ ${selected.className.toUpperCase()} ]`;
 updateQuote();
 loadVehicleTexture(selected.image);
 buildVehicleModel();
}

function createMaterial(color,metalness=.75,roughness=.18){return new THREE.MeshPhysicalMaterial({color,metalness,roughness,clearcoat:.9,clearcoatRoughness:.08})}
function buildVehicleModel(){
 if(!vehicleGroup)return;
 while(vehicleGroup.children.length)vehicleGroup.remove(vehicleGroup.children[0]);
 const scale=selected.id==='kdh'?1.25:selected.id==='xpander'?1.08:1;
 const body=new THREE.Mesh(new THREE.BoxGeometry(selected.id==='kdh'?3.5:3.05,selected.id==='kdh'?1.25:1.0,selected.id==='kdh'?5.0:4.4,8,3,8),createMaterial(selected.color,.92,.12));
 body.position.y=.9;body.scale.set(scale,scale,scale);vehicleGroup.add(body);
 const cabin=new THREE.Mesh(new THREE.BoxGeometry(selected.id==='kdh'?3.0:2.55,.78,selected.id==='kdh'?3.1:2.65,8,3,8),createMaterial(0x11151b,.65,.08));
 cabin.position.y=1.68;vehicleGroup.add(cabin);
 const bumper=new THREE.Mesh(new THREE.BoxGeometry(selected.id==='kdh'?3.25:2.9,.28,.35,8,2,4),createMaterial(0x0a0a0a,.8,.2));bumper.position.set(0,.45,selected.id==='kdh'?2.55:2.2);vehicleGroup.add(bumper);
 for(const x of[-1.25,1.25])for(const z of[-1.7,1.7]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.3,28),createMaterial(0x080808,.95,.2));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.42,z);vehicleGroup.add(wheel)}
 if(exploded)vehicleGroup.children.forEach((object,index)=>{if(index>0)object.position.y+=.13+index*.035});
}

function loadVehicleTexture(path){
 if(!texturePlane)return;
 const loader=new THREE.TextureLoader();
 loader.load(path,texture=>{if(currentTexture)currentTexture.dispose();currentTexture=texture;texture.colorSpace=THREE.SRGBColorSpace;texturePlane.material.map=texture;texturePlane.material.needsUpdate=true},undefined,()=>{texturePlane.material.map=null;texturePlane.material.needsUpdate=true});
}

function initThree(){
 const mount=$('#stage');
 try{
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.setSize(mount.clientWidth,mount.clientHeight,false);renderer.setClearColor(0x000000,1);renderer.outputColorSpace=THREE.SRGBColorSpace;mount.prepend(renderer.domElement);
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(34,mount.clientWidth/mount.clientHeight,.1,100);camera.position.set(0,1.6,8.2);
  scene.add(new THREE.HemisphereLight(0x312e81,0x000000,1.7));
  const key=new THREE.SpotLight(0xffffff,9,40,Math.PI/5,.45,1.4);key.position.set(4,8,6);scene.add(key);
  const rim=new THREE.DirectionalLight(0xc084fc,5);rim.position.set(-5,4,-6);scene.add(rim);
  vehicleGroup=new THREE.Group();scene.add(vehicleGroup);buildVehicleModel();
  texturePlane=new THREE.Mesh(new THREE.PlaneGeometry(4.8,3.0),new THREE.MeshBasicMaterial({transparent:true,opacity:.18,side:THREE.DoubleSide}));texturePlane.position.set(0,2.7,-2.3);scene.add(texturePlane);loadVehicleTexture(selected.image);
  clock=new THREE.Clock();
  const resize=()=>{const w=mount.clientWidth,h=Math.max(1,mount.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)};new ResizeObserver(resize).observe(mount);
  const move=(x,y)=>{targetX=(x/innerWidth-.5)*1.2;targetY=-(y/innerHeight-.5)*.7};addEventListener('pointermove',e=>move(e.clientX,e.clientY),{passive:true});addEventListener('touchmove',e=>{if(e.touches[0])move(e.touches[0].clientX,e.touches[0].clientY)},{passive:true});
  const animate=(time)=>{requestAnimationFrame(animate);const elapsed=clock.getElapsedTime();rotY+=(targetX-rotY)*.045;rotX+=(targetY-rotX)*.045;vehicleGroup.rotation.y+=.003;vehicleGroup.rotation.y+=rotY*.006;vehicleGroup.rotation.x=rotX*.35;vehicleGroup.position.y=Math.sin(elapsed*1.2)*.07;texturePlane.rotation.y=Math.sin(elapsed*.35)*.05;renderer.render(scene,camera)};requestAnimationFrame(animate);
 }catch(error){$('#hud').textContent='[ WEBGL_FALLBACK :: FLEET_UI_ACTIVE ]'}
}

function initBackground(){
 const canvas=$('#bg');const ctx=canvas.getContext('2d');let w=0,h=0;
 const resize=()=>{w=canvas.width=innerWidth*devicePixelRatio;h=canvas.height=innerHeight*devicePixelRatio;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px'};addEventListener('resize',resize);resize();
 const draw=(time)=>{ctx.clearRect(0,0,w,h);ctx.save();ctx.scale(devicePixelRatio,devicePixelRatio);const width=innerWidth,height=innerHeight;const glow=ctx.createRadialGradient(width*.5,height*.48,0,width*.5,height*.48,width*.7);glow.addColorStop(0,'rgba(254,240,138,.055)');glow.addColorStop(.45,'rgba(120,90,20,.018)');glow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);ctx.restore();requestAnimationFrame(draw)};requestAnimationFrame(draw);
}

function initBooking(){
 $('#class').addEventListener('change',e=>{const match=vehicles.find(v=>v.group===e.target.value);if(match)selectVehicle(match.id);else updateQuote()});
 $('#pkg').addEventListener('change',updateQuote);$('#days').addEventListener('input',updateQuote);$('#distance').addEventListener('input',updateQuote);
 $('#chauffeur').onclick=()=>{service='chauffeur';$('#chauffeur').classList.add('active');$('#selfdrive').classList.remove('active');updateQuote()};
 $('#selfdrive').onclick=()=>{service='selfdrive';$('#selfdrive').classList.add('active');$('#chauffeur').classList.remove('active');updateQuote()};
 $('#lkr').onclick=()=>{currency='LKR';$('#lkr').classList.add('active');$('#usd').classList.remove('active');updateQuote()};
 $('#usd').onclick=()=>{currency='USD';$('#usd').classList.add('active');$('#lkr').classList.remove('active');updateQuote()};
 $('#dispatch').onclick=()=>{updateQuote();const message=[
 'SUNRISE CABS BOOKING INQUIRY','',
 `[ VEHICLE ] ${selected.name}`,
 `[ CLASS ] ${selected.className}`,
 `[ SERVICE ] ${service==='chauffeur'?'WITH CHAUFFEUR':'SELF DRIVE'}`,
 `[ PACKAGE ] ${$('#pkg').value} KM/DAY`,
 `[ DURATION ] ${$('#days').value} DAY(S)`,
 `[ ROUTE / PICKUP ] ${$('#pickup').value||'Not specified'}`,
 `[ PASSENGERS ] ${$('#passengers').value||'Not specified'}`,
 `[ CUSTOMER ] ${$('#name').value||'Not specified'}`,
 `[ FLIGHT / DATE ] ${$('#date').value||'Not specified'}`,
 `[ QUOTE ] ${$('#total').textContent}`,
 `[ NOTES ] ${$('#notes').value||'None'}`,
 '', 'Please confirm availability, deposit and final rate.'
 ].join('\n');window.open(WHATSAPP+'?text='+encodeURIComponent(message),'_blank','noopener,noreferrer')};
 updateQuote();
}

function initNavigation(){
 $$('[data-go]').forEach(button=>button.addEventListener('click',()=>{const target=document.getElementById(button.dataset.go);if(target)target.scrollIntoView({behavior:'smooth',block:'start'});$('#sheet')?.classList.remove('open')}));
 $('#menu')?.addEventListener('click',()=>$('#sheet').classList.toggle('open'));
 $('#explode').onclick=()=>{exploded=!exploded;buildVehicleModel();$('#explode').textContent=exploded?'[ COLLAPSE_VIEW ]':'[ EXPLODED_VIEW ]'};
 $('#lbClose').onclick=closeLightbox;$('#lbPrev').onclick=()=>stepLightbox(-1);$('#lbNext').onclick=()=>stepLightbox(1);addEventListener('keydown',e=>{if(e.key==='Escape')closeLightbox();if(e.key==='ArrowLeft')stepLightbox(-1);if(e.key==='ArrowRight')stepLightbox(1)});
}

function initCursor(){const cursor=$('#cursor');if(!cursor)return;addEventListener('pointermove',e=>{cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px'},{passive:true})}
function initViewport(){const apply=()=>document.documentElement.style.setProperty('--vh',(visualViewport?.height||innerHeight)+'px');new ResizeObserver(apply).observe(document.documentElement);visualViewport?.addEventListener('resize',apply);addEventListener('resize',apply);apply()}

buildRoutes();buildFleetList();buildGallery();initThree();initBackground();initBooking();initNavigation();initCursor();initViewport();
