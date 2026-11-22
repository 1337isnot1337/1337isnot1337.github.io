(() => {
  const studio = document.querySelector("#studio");
  const overview = studio.querySelector(".desk-overview");
  const rail = studio.querySelector(".desk-rail");
  const rooms = [...studio.querySelectorAll("[data-room]")];
  const workbench = studio.querySelector("#desk");
  const notebook = studio.querySelector("#about");
  const leaves = [...notebook.querySelectorAll("[data-leaf]")];
  const bookmarks = notebook.querySelector(".notebook-tabs");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const reader = studio.querySelector(".desk-reading");
  const stage = overview.querySelector(".desktop-picture");
  const sceneCanvas = stage.querySelector("canvas");
  let opener = null;
  let returnY = null;
  const switcher=document.querySelector(".mode-switch");
  const page=document.documentElement;
  const modeAddress = view => (view === "shelf" ? "/boring/" : "/") + location.search;
  let sceneNearby=false, sceneStarted=false;
  function setView(view) {
    const changed=page.dataset.view!==view;
    page.dataset.view=view;
    switcher.href = modeAddress(view === "desk" ? "shelf" : "desk");
    switcher.title=view==="desk" ? "Boring mode" : "Back to the desk";
    switcher.setAttribute("aria-label",switcher.title);
    const back=rail.querySelector(".back-to-desk");
    back.hash=view==="desk" ? "#studio" : "#projects";
    back.querySelector("span").textContent=view==="desk" ? "Put it back" : "Back to shelf";
    if(changed){
      if(view==='shelf'){
        const audio=workbench.querySelector('audio');
        if(!audio.paused && audio.hasAttribute('data-desk-carry'))audio.pause();
      }
      document.dispatchEvent(new Event("portfolio-view"));
    }
  }
  setView(page.dataset.view||"desk");
  if (location.pathname === "/" && page.dataset.view === "shelf") {
    sceneCanvas?.remove();
    document.querySelector('link[href^="/pixelation.css"]')?.remove();
    const fragment=location.hash==="#projects" ? "" : location.hash;
    history.replaceState(history.state, "", modeAddress("shelf")+fragment);
  }
  function showGraphicsFallback(message) {
    stage.classList.remove("is-loading","is-rendered");
    const warning=stage.querySelector(".graphics-warning");
    if(message)warning.textContent=message;
    warning.hidden=false;
  }
  function deskIsReadyToMount() {
    return sceneCanvas?.isConnected && page.dataset.view==='desk' && sceneNearby && !studio.dataset.open && !document.querySelector('.open-project[open]');
  }
  function showFurniture() {
    if (sceneStarted || !deskIsReadyToMount()) return;
    sceneStarted=true;
    import("./furniture.js?v=68").then(module => {
      if (!deskIsReadyToMount()) { sceneStarted=false; return; }
      try { module.mountFurniture(stage,showGraphicsFallback); }
      catch { showGraphicsFallback(); }
    }, () => showGraphicsFallback("The 3D desk couldn’t download. Reload to try again."));
  }
  if (sceneCanvas?.isConnected) {
    import("./desk-moths.js?v=1");
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        sceneNearby=entry.isIntersecting;
        showFurniture();
      }, {rootMargin:"140px"}).observe(overview);
    } else {
      sceneNearby=true;
      showFurniture();
    }
    document.querySelector(".open-project")?.addEventListener("close",showFurniture);
  }

  const stops = new Map([
    ["desk", "The workbench"], ["catalogue", "The project files"], ["about-robotics", "Robot code"],
    ["about-physics", "Particle physics"], ["about-teaching", "Teaching"],
    ["off-the-clock", "Off the clock"], ["elsewhere", "Letters"],
    ["desk-numbers", "The number line"],
  ]);
  const stampImages = new Map();
  for (const link of document.querySelectorAll(".index a[data-project]")) {
    const id = link.dataset.project;
    stops.set(id, link.querySelector("strong").textContent.trim());
    const art = document.querySelector('.print[data-project="' + id + '"] img');
    if (art) stampImages.set(id, art.getAttribute("src"));
  }
  for (const leaf of leaves) {
    stampImages.set(leaf.dataset.leaf, leaf.querySelector(".leaf-art img").getAttribute("src"));
  }
  const deskStops = {sound:"flyover", cards:"conjectures", bits:"cpu", numbers:"desk-numbers"};
  let route = [];
  try {
    const saved = JSON.parse(sessionStorage.getItem("cinna-postcard") || "[]");
    if (Array.isArray(saved)) route = saved.filter(id => stops.has(id)).slice(-5);
  } catch { /* A private window still gets a postcard for this visit. */ }

  const stamp = studio.querySelector(".cat-stamp");
  const nightMail = studio.querySelector(".postcard-front");
  function remember(id) {
    if (!stops.has(id) || route.at(-1) === id) return;
    route = [...route.filter(stop => stop !== id), id].slice(-5);
    try { sessionStorage.setItem("cinna-postcard", JSON.stringify(route)); } catch {}
  }
  function addressPostcard() {
    const list = studio.querySelector("#post-route");
    const labels=route.length ? route.map(id=>stops.get(id)) : ['The desk drawer'];
    list.replaceChildren(...labels.map(label => {
      const item = document.createElement("li");
      item.textContent = label;
      return item;
    }));
    const artwork = route.slice().reverse().find(id => stampImages.has(id));
    stamp.src = stampImages.get(artwork) || nightMail.getAttribute("src");
  }

  function selectLeaf(id) {
    const active = leaves.find(leaf => leaf.dataset.leaf === id) || leaves[0];
    const index = leaves.indexOf(active);
    for (const leaf of leaves) leaf.hidden = leaf !== active;
    for (const link of bookmarks.querySelectorAll("a")) {
      if (link.hash === "#" + active.dataset.leaf) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    notebook.querySelector("#leaf-count").textContent = (index + 1) + " / " + leaves.length;
    notebook.querySelector("#leaf-prev").hash = leaves[(index + leaves.length - 1) % leaves.length].dataset.leaf;
    notebook.querySelector("#leaf-next").hash = leaves[(index + 1) % leaves.length].dataset.leaf;
    return active;
  }

  let current = null;
  function reveal(target, move = false) {
    const room = target.closest("[data-room]");
    const previous = current;
    const activeLeaf = room === notebook ? selectLeaf(target.closest("[data-leaf]")?.dataset.leaf) : null;
    current = room;
    for (const panel of rooms) panel.hidden = panel !== room;
    reader.hidden = !room;
    studio.querySelector(".put-down-surface").hidden = !room;
    overview.inert = Boolean(room);
    studio.dispatchEvent(new CustomEvent("desk-room", {detail: room?.id}));
    rail.hidden = !room;
    if (room) studio.dataset.open = room.id;
    else { delete studio.dataset.open; showFurniture(); }
    for (const link of rail.querySelectorAll("a")) {
      if (link.hash === "#" + room?.id) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    if (previous === workbench && room !== workbench) {
      const audio = workbench.querySelector("audio");
      if (!audio.paused && (room || !audio.hasAttribute('data-desk-carry'))) audio.pause();
    }
    if (room) {
      remember(activeLeaf?.dataset.leaf || deskStops[target.dataset.deskPanel] || room.id);

    }
    if (move) {
      const turning = activeLeaf && previous === notebook;
      const focus = turning ? activeLeaf.querySelector("h3") : room?.querySelector("h2")
        || opener || overview.querySelector("#studio-title");
      if (!focus.matches("a,button")) focus.tabIndex = -1;
      focus.focus({preventScroll:true});
      if (turning) bookmarks.scrollIntoView({behavior:"instant",block:"start"});
      else if (room) reader.scrollIntoView({behavior:"instant",block:"start"});
      else if (returnY !== null) window.scrollTo({top:returnY,behavior:"instant"});
      else overview.scrollIntoView({behavior:"instant"});
      if (!room) { opener = null; returnY = null; }
      if (room && !reducedMotion.matches) {
        (turning ? activeLeaf : reader).animate([
          {opacity:.68, transform:"translateY(15px) rotate(-.35deg)"}, {opacity:1, transform:"none"}
        ], {duration:230, easing:"ease-out"});
      }
    }
  }
  function readAddress(move) {
    const target = document.getElementById(location.hash.slice(1));
    if (!location.hash || location.hash === "#studio") {
      setView(/^\/boring(?:\/|$)/.test(location.pathname) ? "shelf" : "desk");
    }
    else if(location.hash==="#projects")setView("shelf");
    else if(history.state?.view)setView(history.state.view);
    if (target && studio.contains(target)) reveal(target, move);
    else if (!target || target.id === "projects") reveal(studio, Boolean(move && current && returnY !== null));
    // A project reader floats above the open object until its Back button is used.
  }
  document.addEventListener("click", event => {
    const link = event.target.closest("a");
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey
        || event.altKey || event.shiftKey || !link || link.origin!==location.origin
        || link.search!==location.search) return;
    if (link === switcher || !link.hash || link.pathname !== location.pathname) return;
    const target = document.getElementById(link.hash.slice(1));
    if(link.hash==="#projects" || link.hash==="#studio"){
      event.preventDefault();
      const view=link.hash==="#studio" ? "desk" : "shelf";
      const address = modeAddress(view);
      if(page.dataset.view!==view){location.assign(address);return;}
      if (location.pathname + location.search + location.hash !== address) history.pushState(null, "", address);
      const focus=link.classList.contains("back-to-desk") && page.dataset.view==="desk" && opener ? opener : switcher;
      reveal(studio);returnY=null;opener=null;
      window.scrollTo({top:0,behavior:"instant"});
      focus.focus({preventScroll:true});
      return;
    }
    if (!target || !studio.contains(target) || link.matches(".desk-permalink")) return;
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState({view:page.dataset.view}, "", link.hash);
    if ((overview.contains(link) && link.dataset.object) || link.dataset.originObject) {
      returnY = window.scrollY;
      opener = link.dataset.originObject ? overview.querySelector('[data-object="'+link.dataset.originObject+'"]') : link;
    }
    reveal(target, true);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && current && !document.querySelector(".open-project[open]") && reader.contains(document.activeElement)) {
      event.preventDefault();rail.querySelector(".back-to-desk").click();
    }
  });
  window.addEventListener("popstate", () => readAddress(true));
  window.addEventListener("hashchange", () => readAddress(false));
  workbench.addEventListener("open-from-shelf", event => {
    reveal(workbench);
    remember(deskStops[event.detail]);
  }, true);
  workbench.querySelector(".desk-tabs").addEventListener("click", event => {
    const tab = event.target.closest("[data-desk]");
    if (tab) remember(deskStops[tab.dataset.desk]);
  });
  const dialog = document.querySelector(".open-project");
  if (dialog.open) remember(dialog.querySelector("article")?.id);
  new MutationObserver(() => {
    if (dialog.open) remember(dialog.querySelector("article")?.id);
  }).observe(dialog, {attributes:true, attributeFilter:["open", "aria-labelledby"]});

  const recipient=studio.querySelector('.post-recipient');
  const destination=studio.querySelector('.post-location');
  const postmark=studio.querySelector('.postmark');
  const device=studio.querySelector('.post-device');
  const network=studio.querySelector('.post-network');
  let routingLookup;
  async function lookupPostmark(){
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),3500);
    try{
      const response=await fetch('https://api.ipapi.is/',{
        credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal
      });
      if(!response.ok)return;
      const {city,region,country,asn,company}=await response.json();
      const place=[...new Set([city,region,country].filter(Boolean))].join(', ');
      const [,number,operator]=/^\s*(AS\d+)\b\s*(.*)$/i.exec(asn || '') || [];
      return {
        place:city ? 'Near '+place : place,
        route:[company || operator,number].filter(Boolean).join(' · ')
      };
    }catch{
      // The local clock and time zone are already on the paper.
    }finally{
      clearTimeout(timeout);
    }
  }
  function addressVisitor(){
    const ua=navigator.userAgent;
    const browser=(/Edg(e|A|iOS)?\//.test(ua) && 'Edge') ||
      (/OPR\//.test(ua) && 'Opera') || (/SamsungBrowser\//.test(ua) && 'Samsung Internet') ||
      (/Firefox|FxiOS/.test(ua) && 'Firefox') || (/Chrome|CriOS/.test(ua) && 'Chrome') ||
      (/Safari/.test(ua) && 'Safari') || 'a mystery browser';
    const os=(/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints>1)) ? 'iPadOS' :
      (/iPhone|iPod/.test(ua) && 'iOS') || (/Android/.test(ua) && 'Android') || (/CrOS/.test(ua) && 'ChromeOS') ||
      navigator.userAgentData?.platform || (/Windows/.test(ua) && 'Windows') ||
      (/Mac/.test(ua) && 'macOS') || (/Linux/.test(ua) && 'Linux') || 'an unmarked machine';
    const now=new Date(),hour=now.getHours();
    const reader=hour<5 || hour>=22 ? 'the night owl' : hour<9 ? 'the early bird' : 'the desk detective';
    const hourMinute=now.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
    recipient.textContent=hour<5||hour>=23
      ? 'To the person opening drawers at '+hourMinute
      : 'To '+reader;
    device.textContent=browser+' on '+os;
    const zone=Intl.DateTimeFormat().resolvedOptions().timeZone || 'local';
    destination.textContent=zone.split('/').pop().replaceAll('_',' ')+' time';
    const ink=stage.classList.contains('is-rendered') ? 'WebGL 2' : 'paper edition';
    const clock=now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',timeZoneName:'short'});
    postmark.textContent=clock+' · '+ink;

    routingLookup??=lookupPostmark();
    routingLookup.then(address=>{
      if(address?.place)destination.textContent=address.place;
      if(address?.route){
        network.textContent='Via '+address.route;
        network.hidden=false;
      }
    });
  }
  const drawer=stage.querySelector('[data-object="drawer"]');
  const card=stage.querySelector('[data-object="keepsake"]');
  const post=studio.querySelector('.drawer-post');
  drawer.hidden=false;
  stage.addEventListener('drawer-position',event=>{
    const reachable=event.detail>=.54;
    drawer.setAttribute('aria-expanded',String(reachable));
    card.hidden=!reachable;
  });
  drawer.addEventListener('click',()=>{
    const open=drawer.getAttribute('aria-expanded')!=='true';
    drawer.setAttribute('aria-expanded',String(open));card.hidden=!open;
    stage.dispatchEvent(new Event('drawer-change'));
    if(open && drawer.matches(':focus-visible'))card.focus({preventScroll:true});
  });
  card.addEventListener('click',()=>{
    if(card.hidden || drawer.getAttribute('aria-expanded')!=='true')return;
    addressPostcard();addressVisitor();
    post.showModal();post.querySelector('.post-hand').focus({preventScroll:true});
  });
  window.addEventListener('hashchange',()=>{if(post.open)post.close();});
  const save = studio.querySelector("#save-post");
  save.addEventListener("click", async () => {
    save.disabled = true;
    const status = studio.querySelector("#post-status");
    status.textContent = "";
    try {
      addressPostcard();
      await Promise.all([nightMail.decode(), stamp.decode(), document.fonts.ready, routingLookup]);
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff5dd";
      ctx.fillRect(0, 0, 1200, 1600);
      ctx.drawImage(nightMail, 18, 18, 1164, 764);
      ctx.strokeStyle = "#b6a084";
      ctx.setLineDash([8, 7]);
      ctx.beginPath(); ctx.moveTo(0, 800); ctx.lineTo(1200, 800); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(735, 866); ctx.lineTo(735, 1510); ctx.stroke();
      ctx.fillStyle = "#493644";
      ctx.font = '650 52px "Bricolage Grotesque", sans-serif';
      ctx.fillText("From Cinna’s desk", 64, 951);
      ctx.font = '24px "DM Sans", sans-serif';
      ctx.fillText("Your stops on this visit", 66, 1012);
      ctx.font = '36px "DM Sans", sans-serif';
      studio.querySelectorAll("#post-route li").forEach((item, index) => {
        const y = 1099 + index * 75;
        ctx.fillText(item.textContent, 66, y, 620);
        ctx.fillRect(66, y + 15, 590, 1);
      });
      const side = Math.min(stamp.naturalWidth, stamp.naturalHeight);
      ctx.drawImage(stamp, (stamp.naturalWidth-side)/2, (stamp.naturalHeight-side)/2, side, side, 971, 864, 160, 160);
      // Lay out the same address as the paper, including wrapped place and carrier names.
      const lines=[];
      let baseline=0;
      for(const [field,fontSize,family] of [
        [recipient,38,'Bricolage Grotesque'],[device,24,'IBM Plex Mono'],
        [destination,30,'DM Sans'],[network,23,'IBM Plex Mono']
      ]){
        if(!field.textContent)continue;
        const font=fontSize+'px "'+family+'"';
        ctx.font=font;
        let line='';
        for(const word of field.textContent.split(/\s+/)){
          if(line && ctx.measureText(line+' '+word).width>360){
            baseline+=fontSize*1.25;
            lines.push({line,font,baseline});
            line='';
          }
          line=line ? line+' '+word : word;
        }
        baseline+=fontSize*1.25;
        lines.push({line,font,baseline});
        baseline+=10;
      }
      ctx.save();
      ctx.translate(786,1045);
      const scale=Math.min(1,405/baseline);
      ctx.scale(scale,scale);
      for(const row of lines){
        ctx.font=row.font;
        ctx.fillText(row.line,0,row.baseline,360);
      }
      ctx.restore();
      ctx.font='21px "IBM Plex Mono", monospace';
      ctx.fillText(postmark.textContent,786,1490,360);
      studio.dispatchEvent(new CustomEvent('desk-post-export',{detail:{ctx}}));
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Image export failed");
      const url = URL.createObjectURL(blob);
      const download = document.createElement("a");
      download.href = url;
      download.download = "a-postcard-from-cinnas-desk.png";
      document.body.append(download);
      download.click();
      download.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      status.textContent = "Your two-sided postcard is ready.";
    } catch {
      status.textContent = "The postcard could not be saved. Please try again.";
    } finally { save.disabled = false; }
  });

  bookmarks.hidden = false;
  notebook.querySelector(".leaf-pager").hidden = false;
  studio.querySelector(".post-controls").hidden = false;
  // Start from readable, ordinary anchor-linked sections if JS is unavailable.
  studio.classList.add("studio-ready");
  reveal(studio);
  readAddress(false);
})();
