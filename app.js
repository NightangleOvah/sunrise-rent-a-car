import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const WA = 'https://wa.me/94776380753';
const USD_LKR = 305;
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const vehicles = [
  { id:'magnite', name:'Nissan Magnite', group:'suv', className:'Compact SUV', capacity:5, color:0xd8d8d8, image:'assets/fleet/magnite.svg' },
  { id:'yaris-cross', name:'Toyota Yaris Cross', group:'suv', className:'Hybrid SUV', capacity:5, color:0xe6e6e6, image:'assets/fleet/yaris-cross.svg' },
  { id:'alto', name:'Suzuki Alto', group:'small', className:'Economy City', capacity:4, color:0xf1f1f1, image:'assets/fleet/alto.svg' },
  { id:'axio', name:'Toyota Axio', group:'sedan', className:'Executive Sedan', capacity:5, color:0xd9d9d9, image:'assets/fleet/axio.svg' },
  { id:'prius', name:'Toyota Prius', group:'sedan', className:'Hybrid Elite', capacity:5, color:0xe7e7e7, image:'assets/fleet/prius.svg' },
  { id:'vitz', name:'Toyota Vitz', group:'hatch', className:'Urban Compact', capacity:5, color:0xc8c8c8, image:'assets/fleet/vitz.svg' },
  { id:'kdh', name:'Toyota KDH High Roof', group:'van', className:'Group Transit Van', capacity:11, color:0xe4e4e4, image:'assets/fleet/kdh.svg' },
  { id:'xpander', name:'Mitsubishi Xpander', group:'suv', className:'7-Seater MPV', capacity:7, color:0xc5c5c5, image:'assets/fleet/xpander.svg' }
];

const rates = {
  small:{ extra:40, hour:300, local:'20,000–50,000', abroad:'50,000–100,000', rows:[
    ['Alto K / Alto C / Alto Auto',['3,000–5,000','4,000–6,000','5,500–7,500','7,500–9,500']],
    ['Passo / Wagon R',['6,000–7,500','7,000–8,500','8,500–10,000','10,500–12,000']]
  ]},
  hatch:{ extra:50, hour:500, local:'30,000–40,000', abroad:'60,000–80,000', rows:[
    ['Vitz / Nissan Leaf / Aqua / Vitz New / GP5 / Yaris',['6,500–7,500','8,500–9,000','10,500–11,500','13,000–14,500']]
  ]},
  sedan:{ extra:55, hour:500, local:'40,000', abroad:'80,000', rows:[
    ['Insight / Shuttle / Prius / Premio / Axio Hybrid',['7,000–9,000','8,500–11,000','10,500–13,500','13,000–16,500']]
  ]},
  suv:{ extra:90, hour:1000, local:'30,000–150,000', abroad:'60,000–200,000', rows:[
    ['Magnite / Vezel / Raize / CHR / Yaris Cross / VEZEL RS / Outlander / DFSK 580 / XPander',['7,000–11,500','9,000–14,000','11,000–17,000','13,500–20,000']]
  ]},
  van:{ extra:70, hour:550, local:'25,000–150,000', abroad:'50,000–200,000', rows:[
    ['Daihatsu Hijet / Every Buddy / DFSK 7 Mini / KDH 10–11 Seater / KDH 222–14 Seater',['6,000–15,000','7,000–18,000','8,500–22,000','10,500–26,000']]
  ]}
};

const packs = [50,100,200,300];
const routes = [
  ['CMB AIRPORT → KANDY',115],['CMB AIRPORT → COLOMBO',32],['COLOMBO → GALLE',126],
  ['KANDY → ELLA',135],['KANDY → NUWARA ELIYA',77],['SIGIRIYA CULTURAL TRIANGLE',150]
];

const state = { vehicle:vehicles[6], service:'chauffeur', currency:'LKR', days:1, pack:100, distance:115, hours:0, gallery:0, exploded:false };
let bgRenderer, bgScene, bgMaterial, renderer, scene, camera, vehicleRoot, rock, rings, resizeObserver, animationFrame=0, lastFrame=0, pixelRatio=1, slowFrames=0, audioContext;
const pointer = { x:0, y:0, tx:0, ty:0, vx:0, vy:0 };
const touch = { down:false, x:0, y:0, vx:0, vy:0 };

function setText(selector,value){const element=$(selector);if(element)element.textContent=value;}
function rangeMid(value){const numbers=value.replace(/,/g,'').split('–').map(Number);return numbers.length===2?(numbers[0]+numbers[1])/2:numbers[0];}
function fallback(vehicle){return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><rect width="1600" height="1000" fill="#000"/><g fill="none" stroke="#fff"><ellipse cx="800" cy="540" rx="650" ry="250" stroke="#fef08a" opacity=".2"/><path d="M180 650h1240M270 580l210-150h640l210 150M500 430l90-125h420l90 125" stroke-width="9"/><circle cx="460" cy="650" r="105" stroke-width="10"/><circle cx="1140" cy="650" r="105" stroke-width="10"/><circle cx="460" cy="650" r="42" stroke="#fef08a" stroke-width="8"/><circle cx="1140" cy="650" r="42" stroke="#fef08a" stroke-width="8"/></g><text x="90" y="120" fill="#fef08a" font-family="monospace" font-size="32">[ SUNRISE / FLEET ARCHIVE ]</text><text x="90" y="195" fill="#fff" font-family="Arial" font-size="74" font-weight="900">${vehicle.name.toUpperCase()}</text><text x="90" y="240" fill="#777" font-family="monospace" font-size="24">[ ${vehicle.className.toUpperCase()} ] · [ ${vehicle.capacity} SEATS ]</text></svg>`)}`;}

function estimate(){
  const rate=rates[state.vehicle.group];
  const row=rate.rows[0][1][packs.indexOf(state.pack)];
  if(!row)return 300;
  const base=rangeMid(row)*state.days;
  const extraKm=Math.max(0,state.distance-state.pack*state.days)*rate.extra;
  const extraHours=Math.max(0,state.hours)*rate.hour;
  const chauffeur=state.service==='chauffeur'?base*.08:0;
  return Math.round(base+extraKm+extraHours+300+chauffeur);
}

function quote(){
  state.pack=+$('#packageKm').value; state.days=Math.max(1,+$('#days').value||1); state.distance=Math.max(0,+$('#distance').value||0); state.hours=Math.max(0,+$('#extraHours').value||0);
  const total=estimate(), rate=rates[state.vehicle.group];
  setText('#quoteTotal',state.currency==='LKR'?`LKR ${total.toLocaleString('en-LK')}`:`USD ${Math.round(total/USD_LKR).toLocaleString()}`);
  setText('#quoteMeta',`[ ${state.pack} KM/DAY ] [ ${rate.extra} LKR/KM EXTRA ] [ ${rate.hour} LKR/HOUR ] [ DOC 300 LKR ]`);
  setText('#depositLocal','LKR '+rate.local); setText('#depositAbroad','LKR '+rate.abroad); setText('#selectedVehicle','[ '+state.vehicle.name.toUpperCase()+' ]');
}

function selectVehicle(id){
  const vehicle=vehicles.find(item=>item.id===id); if(!vehicle)return;
  state.vehicle=vehicle;
  const select=$('#vehicleSelect'); if(select)select.value=id;
  $$('.fleet-card').forEach(card=>card.classList.toggle('selected',card.dataset.id===id));
  setText('#showroomVehicle',vehicle.name.toUpperCase()); setText('#showroomClass',vehicle.className.toUpperCase()); setText('#showroomSeats',vehicle.capacity+' SEATS');
  setText('#calculatorVehicle',vehicle.name.toUpperCase()); setText('#calculatorClass',vehicle.className.toUpperCase()); quote(); buildVehicleModel(); loadShowroomImage(vehicle); chime(660);
}

function buildRoutes(){
  const holder=$('#routePresets'); if(!holder)return;
  routes.forEach(([name,km],index)=>{const button=document.createElement('button');button.className='route-chip'+(index?'':' active');button.innerHTML=`<span>0${index+1}</span><strong>${name}</strong><em>${km} KM*</em>`;button.onclick=()=>{$('#distance').value=km;$('#pickup').value=name;$$('.route-chip').forEach(item=>item.classList.remove('active'));button.classList.add('active');quote();chime(720)};holder.appendChild(button);});
}

function buildFleet(){
  const holder=$('#fleetCards'); if(!holder)return;
  vehicles.forEach((vehicle,index)=>{const card=document.createElement('button');card.className='fleet-card';card.dataset.id=vehicle.id;card.innerHTML=`<div class="fleet-image"><img src="${vehicle.image}" alt="${vehicle.name} — Sunrise Cabs" loading="lazy"><span class="image-index mono">0${index+1}</span></div><div class="fleet-card-body"><div class="mono">[ ${vehicle.className} ]</div><h3>${vehicle.name}</h3><div class="fleet-meta"><span>${vehicle.capacity} PASSENGERS</span><span>SELECT →</span></div></div>`;const image=$('img',card);image.onerror=()=>{image.onerror=null;image.src=fallback(vehicle);};card.onclick=()=>selectVehicle(vehicle.id);holder.appendChild(card);});
  selectVehicle(state.vehicle.id);
}

function buildGallery(){
  const holder=$('#galleryGrid'); if(!holder)return;
  vehicles.forEach((vehicle,index)=>{const figure=document.createElement('figure');figure.className='archive-card';figure.innerHTML=`<div class="archive-media"><img src="${vehicle.image}" alt="${vehicle.name} — Sunrise Cabs" loading="lazy"><div class="archive-scan"></div><div class="archive-label mono">[ 0${index+1} / 08 ] · ${vehicle.group}</div></div><figcaption><div><h3>${vehicle.name}</h3><p class="mono">${vehicle.className} · ${vehicle.capacity} SEATS</p></div><span class="archive-arrow">↗</span></figcaption>`;const image=$('img',figure);image.onerror=()=>{image.onerror=null;image.src=fallback(vehicle);};figure.onclick=()=>openLightbox(index);holder.appendChild(figure);});
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)entry.target.classList.add('in-view');}),{threshold:.35});$$('.archive-card').forEach(card=>observer.observe(card));}
}

function buildRates(){
  const holder=$('#rateRows'); if(!holder)return;
  Object.values(rates).forEach(rate=>rate.rows.forEach(row=>{const element=document.createElement('div');element.className='rate-row';element.innerHTML=`<div class="rate-name"><span class="mono">[ RATE CLASS ]</span><strong>${row[0]}</strong></div>${row[1].map(value=>`<span>${value}</span>`).join('')}<span>${rate.extra} LKR/KM<br>${rate.hour} LKR/HOUR</span>`;holder.appendChild(element);}));
}

function disposeObject(object){object.traverse(child=>{if(child.geometry)child.geometry.dispose();if(child.material){const materials=Array.isArray(child.material)?child.material:[child.material];materials.forEach(material=>{if(material.map)material.map.dispose();material.dispose();});}});}

function buildVehicleModel(){
  if(!vehicleRoot)return;
  vehicleRoot.clear();
  const vehicle=state.vehicle, van=vehicle.id==='kdh', mpv=vehicle.id==='xpander', width=van?3.7:mpv?3.35:3.15, length=van?5.2:mpv?4.7:['alto','vitz'].includes(vehicle.id)?4.15:4.55, height=van?1.45:1.05;
  const bodyMaterial=new THREE.MeshPhysicalMaterial({color:vehicle.color,metalness:.92,roughness:.13,clearcoat:1,clearcoatRoughness:.04});
  const body=new THREE.Mesh(new THREE.BoxGeometry(width,height,length,16,7,20),bodyMaterial);body.position.y=.95;vehicleRoot.add(body);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(width*.84,van?1.15:.7,length*.55,12,6,14),new THREE.MeshPhysicalMaterial({color:0x11161b,metalness:.5,roughness:.08,clearcoat:1,transmission:.05}));roof.position.y=1.65;vehicleRoot.add(roof);
  for(const x of[-width*.38,width*.38])for(const z of[-length*.34,length*.34]){const tyre=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.34,32),new THREE.MeshStandardMaterial({color:0x050505,roughness:.3,metalness:.5}));tyre.rotation.z=Math.PI/2;tyre.position.set(x,.43,z);vehicleRoot.add(tyre);const rim=new THREE.Mesh(new THREE.CylinderGeometry(.23,.23,.36,24),new THREE.MeshStandardMaterial({color:0xbdbdbd,metalness:1,roughness:.12});rim.rotation.z=Math.PI/2;rim.position.set(x,.43,z);vehicleRoot.add(rim);}
  const lightMaterial=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xfef08a,emissiveIntensity:3});for(const x of[-width*.27,width*.27]){const light=new THREE.Mesh(new THREE.BoxGeometry(width*.18,.13,.08),lightMaterial);light.position.set(x,1.08,length*.505);vehicleRoot.add(light);}
  if(state.exploded)vehicleRoot.children.forEach((child,index)=>{child.position.y+=(index+1)*.055;child.rotation.z+=(index%2?1:-1)*.035;});
}

const backgroundVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}`;
const backgroundFragment=`precision highp float;varying vec2 vUv;uniform float uTime;uniform vec2 uPointer;uniform float uVelocity;float hash(vec3 p){p=fract(p*.3183+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}void main(){vec2 uv=vUv-.5;uv.x*=1.65;float t=uTime*.055;float field=0.0;for(int i=0;i<6;i++){float f=float(i);vec2 center=.34*vec2(sin(t*(.45+f*.09)+f*1.8),cos(t*(.36+f*.07)+f*1.4));float ripple=noise(vec3(uv*2.3,t+f))*0.07;field+=smoothstep(.24,0.0,length(uv-center+ripple));}float pointerGlow=.035/(.12+length(uv-uPointer*.18));float edge=smoothstep(.8,.15,length(uv))*.025;float value=clamp(field*.035+pointerGlow*.012+edge+uVelocity*.004,0.0,.12);gl_FragColor=vec4(vec3(value),1.0);}`;

function initBackground(){
  const canvas=$('#bgCanvas'); if(!canvas)return;
  bgScene=new THREE.Scene();const camera2=new THREE.Camera();bgRenderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance',alpha:false});bgRenderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));bgRenderer.setClearColor(0x000000,1);bgMaterial=new THREE.ShaderMaterial({vertexShader:backgroundVertex,fragmentShader:backgroundFragment,uniforms:{uTime:{value:0},uPointer:{value:new THREE.Vector2()},uVelocity:{value:0}}});bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),bgMaterial));
  const resize=()=>{const height=visualViewport?.height||innerHeight;bgRenderer.setSize(innerWidth,height,false);};resize();addEventListener('resize',resize,{passive:true});visualViewport?.addEventListener('resize',resize,{passive:true});
  const loop=time=>{bgMaterial.uniforms.uTime.value=time*.001;bgMaterial.uniforms.uPointer.value.lerp(new THREE.Vector2(pointer.x,pointer.y),.06);bgMaterial.uniforms.uVelocity.value+=(Math.abs(pointer.vx)+Math.abs(pointer.vy)-bgMaterial.uniforms.uVelocity.value)*.08;bgRenderer.render(bgScene,camera2);requestAnimationFrame(loop);};requestAnimationFrame(loop);
}

function initShowroom(){
  const mount=$('#showroom'); if(!mount)return;
  const bounds=mount.getBoundingClientRect(); if(bounds.width<2||bounds.height<2){requestAnimationFrame(initShowroom);return;}
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:false});pixelRatio=Math.min(devicePixelRatio||1,1.5);renderer.setPixelRatio(pixelRatio);renderer.setSize(bounds.width,bounds.height,false);renderer.setClearColor(0x000000,1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;mount.appendChild(renderer.domElement);
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(36,bounds.width/bounds.height,.1,100);camera.position.set(0,2.15,8.8);
  scene.add(new THREE.HemisphereLight(0x312e81,0x000000,1.2));const key=new THREE.SpotLight(0xffffff,7,30,Math.PI/5,.35,1.2);key.position.set(4,7,6);key.castShadow=false;scene.add(key);const rim=new THREE.DirectionalLight(0xc084fc,4);rim.position.set(-4,3,-6);scene.add(rim);const gold=new THREE.PointLight(0xfef08a,18,18,2);gold.position.set(-4,2,-3);scene.add(gold);
  vehicleRoot=new THREE.Group();scene.add(vehicleRoot);buildVehicleModel();
  rock=new THREE.Mesh(new THREE.IcosahedronGeometry(2.25,4),new THREE.MeshPhysicalMaterial({color:0x14271b,roughness:.88,metalness:.05,clearcoat:.15}));rock.position.set(-4.1,2.4,-3.6);rock.scale.set(1.15,.9,1.1);scene.add(rock);
  rings=new THREE.Group();for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(2.6+i*.42,.018,8,96),new THREE.MeshBasicMaterial({color:i===1?0xfef08a:0xffffff,transparent:true,opacity:.35});ring.rotation.x=Math.PI/2+i*.3;ring.rotation.z=i*.45;rings.add(ring);}rings.position.set(0,1.2,-2.8);scene.add(rings);
  resizeObserver=new ResizeObserver(entries=>{for(const entry of entries){const width=entry.contentRect.width,height=entry.contentRect.height;if(width>2&&height>2){camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);}}});resizeObserver.observe(mount);
  mount.addEventListener('pointermove',event=>{const rect=mount.getBoundingClientRect();const nx=(event.clientX-rect.left)/rect.width*2-1,ny=-((event.clientY-rect.top)/rect.height*2-1);pointer.vx=nx-pointer.tx;pointer.vy=ny-pointer.ty;pointer.tx=nx;pointer.ty=ny;});
  mount.addEventListener('pointerdown',event=>{touch.down=true;touch.x=event.clientX;touch.y=event.clientY;});window.addEventListener('pointerup',()=>touch.down=false,{passive:true});
  const loop=time=>{const delta=Math.min(.05,(time-lastFrame)/1000||.016);lastFrame=time;if(delta>.0166)slowFrames++;else slowFrames=Math.max(0,slowFrames-2);if(slowFrames>=45&&pixelRatio>1){pixelRatio=Math.max(1,pixelRatio-.25);renderer.setPixelRatio(pixelRatio);slowFrames=0;setText('#tier','TIER-2 ADAPTIVE');}setText('#fps',Math.round(1/Math.max(delta,.001))+' FPS');pointer.x+=(pointer.tx-pointer.x)*.08;pointer.y+=(pointer.ty-pointer.y)*.08;vehicleRoot.rotation.y+=(pointer.x*.55+touch.vx*.002-vehicleRoot.rotation.y)*.055;vehicleRoot.rotation.x+=(pointer.y*.18-vehicleRoot.rotation.x)*.055;vehicleRoot.position.y=Math.sin(time*.0012)*.08;rock.rotation.x+=delta*.05;rock.rotation.y+=delta*.08;rock.position.y=2.4+Math.sin(time*.0007)*.2;rings.rotation.y+=delta*.15;renderer.render(scene,camera);animationFrame=requestAnimationFrame(loop);};animationFrame=requestAnimationFrame(loop);
}

function loadShowroomImage(vehicle){
  const existing=scene?.getObjectByName('vehicleImage'); if(existing){scene.remove(existing);existing.geometry.dispose();existing.material.dispose();}
  if(!scene)return;
  const texture=new THREE.TextureLoader().load(vehicle.image);texture.colorSpace=THREE.SRGBColorSpace;const plane=new THREE.Mesh(new THREE.PlaneGeometry(4.4,2.75),new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.075,depthWrite:false}));plane.name='vehicleImage';plane.position.set(0,2.8,-2.4);scene.add(plane);
}

function viewport(){const update=()=>document.documentElement.style.setProperty('--vh',(visualViewport?.height||innerHeight)+'px');update();visualViewport?.addEventListener('resize',update,{passive:true});new ResizeObserver(update).observe(document.documentElement);}
function navigation(){$$('[data-go]').forEach(button=>button.addEventListener('click',()=>{document.getElementById(button.dataset.go)?.scrollIntoView({behavior:'smooth'});$('#mobileSheet')?.classList.remove('open');}));$('#menuButton')?.addEventListener('click',()=>$('#mobileSheet')?.classList.toggle('open'));}
function calculator(){
  const select=$('#vehicleSelect');vehicles.forEach(vehicle=>{const option=document.createElement('option');option.value=vehicle.id;option.textContent=vehicle.name;select.appendChild(option);});select.value=state.vehicle.id;['distance','days','packageKm','extraHours'].forEach(id=>$('#'+id)?.addEventListener('input',quote));select.addEventListener('change',event=>selectVehicle(event.target.value));
  $$('#serviceToggle button').forEach(button=>button.addEventListener('click',()=>{state.service=button.dataset.value;$$('#serviceToggle button').forEach(item=>item.classList.toggle('active',item===button));quote();chime(540);}));
  $$('#currencyToggle button').forEach(button=>button.addEventListener('click',()=>{state.currency=button.dataset.value;$$('#currencyToggle button').forEach(item=>item.classList.toggle('active',item===button));quote();chime(780);}));
  $('#chauffeurInfo')?.addEventListener('click',()=>$('#serviceInfo')?.classList.add('open'));$('#closeServiceInfo')?.addEventListener('click',()=>$('#serviceInfo')?.classList.remove('open'));$('#explode')?.addEventListener('click',()=>{state.exploded=!state.exploded;$('#explode').classList.toggle('active',state.exploded);buildVehicleModel();chime(900);});
}

function dispatch(){
  const total=estimate();
  const message=`SUNRISE CABS — BOOKING INQUIRY\n\nName: ${$('#name').value||'Not provided'}\nTravel date / flight: ${$('#date').value||'Not provided'}\nVehicle: ${state.vehicle.name}\nClass: ${state.vehicle.className}\nPassengers: ${$('#passengers').value||2}\nService: ${state.service==='chauffeur'?'With chauffeur':'Self-drive'}\nRoute: ${$('#pickup').value||'Not provided'}\nDays: ${state.days}\nPackage: ${state.pack} km/day\nDistance: ${state.distance} km\nExtra hours: ${state.hours}\nEstimated total: ${state.currency==='LKR'?`LKR ${total.toLocaleString('en-LK')}`:`USD ${Math.round(total/USD_LKR)}`}\nNotes: ${$('#notes').value||'None'}\n\nPlease confirm availability and final quotation.`;
  window.open(WA+'?text='+encodeURIComponent(message),'_blank','noopener');
}

function chime(frequency=620){try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),now=audioContext.currentTime;oscillator.frequency.setValueAtTime(frequency,now);oscillator.frequency.exponentialRampToValueAtTime(frequency*1.6,now+.18);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.035,now+.02);gain.gain.exponentialRampToValueAtTime(.0001,now+.25);oscillator.connect(gain).connect(audioContext.destination);oscillator.start(now);oscillator.stop(now+.26);}catch{}}

function openLightbox(index){state.gallery=(index+vehicles.length)%vehicles.length;const vehicle=vehicles[state.gallery],box=$('#lightbox'),image=$('#lightboxImage');image.src=vehicle.image;image.onerror=()=>{image.onerror=null;image.src=fallback(vehicle);};$('#lightboxTitle').textContent=vehicle.name;$('#lightboxMeta').textContent=`[ ${vehicle.className.toUpperCase()} ] · [ ${vehicle.capacity} SEATS ] · [ SRI LANKA ]`;box.classList.add('open');box.setAttribute('aria-hidden','false');chime(880);}
function lightbox(){
  $('#lbClose')?.addEventListener('click',()=>{$('#lightbox').classList.remove('open');$('#lightbox').setAttribute('aria-hidden','true');});$('#lbPrev')?.addEventListener('click',()=>openLightbox(state.gallery-1));$('#lbNext')?.addEventListener('click',()=>openLightbox(state.gallery+1));$('#lightbox')?.addEventListener('click',event=>{if(event.target.id==='lightbox')$('#lbClose').click();});addEventListener('keydown',event=>{if(event.key==='Escape')$('#lbClose')?.click();if(event.key==='ArrowLeft'&&$('#lightbox').classList.contains('open'))openLightbox(state.gallery-1);if(event.key==='ArrowRight'&&$('#lightbox').classList.contains('open'))openLightbox(state.gallery+1);});
}

function cursor(){const element=$('#cursor');if(!element||matchMedia('(pointer:coarse)').matches){element?.remove();return;}let x=0,y=0,tx=0,ty=0;addEventListener('pointermove',event=>{tx=event.clientX;ty=event.clientY;});$$('a,button,.archive-card,.fleet-card').forEach(target=>{target.addEventListener('mouseenter',()=>element.classList.add('large'));target.addEventListener('mouseleave',()=>element.classList.remove('large'));});const loop=()=>{x+=(tx-x)*.18;y+=(ty-y)*.18;element.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%)`;requestAnimationFrame(loop);};loop();}

function scrollEffects(){if(window.Lenis&&window.gsap){const lenis=new Lenis({duration:1.05,smoothWheel:true,smoothTouch:false});const tick=time=>{lenis.raf(time);requestAnimationFrame(tick);};requestAnimationFrame(tick);gsap.registerPlugin(ScrollTrigger);gsap.utils.toArray('.reveal').forEach(element=>gsap.fromTo(element,{y:55,opacity:0},{y:0,opacity:1,duration:1,ease:'power4.out',scrollTrigger:{trigger:element,start:'top 88%',once:true}}));gsap.to('#heroTitle',{yPercent:-12,scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:true}});ScrollTrigger.refresh();}}

function cleanup(){cancelAnimationFrame(animationFrame);resizeObserver?.disconnect();if(renderer){renderer.dispose();renderer.forceContextLoss?.();}if(bgRenderer){bgRenderer.dispose();bgRenderer.forceContextLoss?.();}scene?.traverse(object=>{if(object.geometry)object.geometry.dispose();if(object.material){const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>{if(material.map)material.map.dispose();material.dispose();});}});}

window.addEventListener('beforeunload',cleanup);
document.addEventListener('DOMContentLoaded',()=>{
  viewport();navigation();buildRoutes();buildFleet();buildGallery();buildRates();calculator();quote();lightbox();cursor();$('#dispatch')?.addEventListener('click',dispatch);window.addEventListener('pointerdown',()=>{try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();}catch{}},{once:true,passive:true});initBackground();initShowroom();scrollEffects();
});