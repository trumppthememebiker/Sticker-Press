(() => {
  'use strict';
  const $ = s => document.querySelector(s), app = window.stickerApp;
  let material = 'Holographic', shine = .65, loading = false;
  const ready = () => app.selected && app.selected.mask && app.scene.get(app.selected.id)?.phase === 'ready';
  const current = () => app.selected || [...app.records.values()][0];
  function applyMaterial() {
    const rec = current(); if (!rec) return;
    const border = rec.settings.borderWidth, color = rec.settings.borderColor;
    StickerUI.applyPreset(rec.settings, ['Matte vinyl','Holographic'].includes(material)?material:'Holographic');
    Object.assign(rec.settings, { borderWidth:border, borderColor:color, background:app.sceneSettings.background, shimmer:0, idleSway:0 });
    const s = rec.settings;
    // Keep the subject's colours: the material rides over the printed artwork.
    s.inkBrightness = 1; s.inkSaturation = 1;
    s.finishMode = {'Matte vinyl':-1,'Holographic':0,'Mosaic foil':1}[material];
    s.finishAmount = shine;
    s.grain = 0; s.flake = 0; s.glitter = 0;
    s.specular *= .3 + shine * 1.4;
    s.holoIntensity *= .35 + shine;
    s.glitter *= .025 * shine;
    s.flake = Math.min(s.flake,.08); s.grain = Math.min(s.grain,.035);
    s.shadowOpacity = .25; s.shadowBlur = 22;
    app.rememberLook(rec);
    document.querySelectorAll('[data-material]').forEach(b => { const active = b.dataset.material === material; b.classList.toggle('active',active); b.setAttribute('aria-pressed',active); });
  }
  document.querySelectorAll('[data-material]').forEach(b => b.onclick = () => { material = b.dataset.material; applyMaterial(); });
  $('#border').oninput = e => { $('#borderValue').textContent = e.target.value + ' px'; const r = current(); if(r) {r.settings.borderWidth = +e.target.value;app.rememberLook(r);} };
  $('#borderColor').oninput = e => {const r = current();if(r){r.settings.borderColor=e.target.value;app.rememberLook(r);} };
  $('#shine').oninput = e => { shine = e.target.value / 100; $('#shineValue').textContent = e.target.value + '%'; applyMaterial(); };
  document.querySelectorAll('[data-bg]').forEach(b => b.onclick = () => { app.sceneSettings.background = b.dataset.bg;app.applyScene(); document.querySelectorAll('[data-bg]').forEach(x=>{const on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',on);}); });
  $('#resetPose').onclick = () => {const r=current();if(!r)return;const e=app.scene.get(r.id);e.restX=app.scene.stageW/2;e.restY=app.scene.stageH/2;app.scene.pointer.inside=false;};
  function download(blob, name) {const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  $('#savePNG').onclick = async () => {const r=current();if(!r?.mask)return;try{const c=app.scene.snapshot(app.scene.get(r.id),{scale:2,shadow:false});const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!blob)throw Error('Could not create PNG');download(blob,'sticker-press.png');$('#exportFeedback').textContent='PNG downloaded.';}catch(e){$('#exportFeedback').textContent=e.message;}};
  $('#saveClip').onclick = async () => {if(loading)return;loading=true;$('#saveClip').disabled=true;$('#exportFeedback').textContent='Recording 4 seconds…';try{const blob=await app.scene.record(4,app.sceneSettings.background);download(blob,'sticker-press.'+(blob.type.includes('mp4')?'mp4':'webm'));$('#exportFeedback').textContent='Video downloaded.';}catch(e){$('#exportFeedback').textContent=e.message;}finally{loading=false;}};
  const cat = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900"><path fill="#f15d3e" d="M447 72C513 74 538 134 596 137C667 120 705 160 702 227C713 285 786 304 785 370C784 429 730 457 742 518C769 590 726 640 657 643C604 654 596 736 533 751C475 767 439 714 385 737C315 772 259 737 253 675C235 620 159 630 139 573C116 512 167 469 148 416C112 350 143 294 210 281C267 261 252 180 312 153C372 127 391 76 447 72Z"/><path fill="#252720" d="M247 467C243 411 263 361 292 329L286 214Q288 190 310 207L399 280Q451 267 497 281L576 209Q599 192 600 220L596 335C627 376 645 426 640 474C635 561 562 621 443 621C329 621 252 563 247 467Z"/><path fill="#f7f0d9" d="M316 416Q350 394 387 419Q354 463 320 444Z M499 417Q534 397 572 418Q541 465 504 445Z"/><ellipse cx="351" cy="428" rx="8" ry="24" fill="#252720"/><ellipse cx="535" cy="428" rx="8" ry="24" fill="#252720"/><path fill="#f15d3e" d="M425 478Q444 468 463 478L446 494Z"/><path fill="none" stroke="#f7f0d9" stroke-width="7" stroke-linecap="round" d="M445 496Q424 518 406 503M445 496Q466 518 484 502M264 470L208 458M268 491L209 502M614 471L670 458M612 492L670 503"/><g fill="#f7f0d9"><path d="M200 213L210 235L234 239L213 251L209 274L195 255L172 253L190 238Z"/><path d="M678 585L686 604L707 609L689 620L683 641L672 622L650 616L670 606Z"/></g></svg>`;
  async function example(kind) {
    const blob=new Blob([cat],{type:'image/svg+xml'});
    const r=await app.addSticker(blob,kind+'-sticker');if(r){r.settings.borderWidth=+$('#border').value;r.settings.borderColor=$('#borderColor').value;applyMaterial();}
    document.querySelectorAll('[data-sample]').forEach(b=>{b.classList.toggle('active',b.dataset.sample===kind);b.setAttribute('aria-pressed',b.dataset.sample===kind);});
  }
  document.querySelectorAll('[data-sample]').forEach(b=>b.onclick=()=>example(b.dataset.sample));
  let lastId=null;
  setInterval(()=>{const r=current();if(r&&r.id!==lastId){lastId=r.id;r.settings.borderWidth=+$('#border').value;r.settings.borderColor=$('#borderColor').value;applyMaterial();}const can=!!r?.mask&&app.scene.get(r.id)?.phase==='ready';$('#savePNG').disabled=!can;$('#saveClip').disabled=!can||loading;},150);
  app.scene.revealDuration=1.35;
  // A single centered object has no selection bounding box or remove badge.
  app.scene.onFrame=()=>{};
  example('cat');
})();
