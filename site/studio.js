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
  let opener = null;
  let returnY = null;
  let liftTimer = 0;
  let sceneNearby=false, sceneStarted=false;
  function showFurniture() {
    if (!sceneNearby || sceneStarted || studio.dataset.open || document.querySelector(".open-project[open]")) return;
    sceneStarted=true;
    import("./furniture.js?v=4").then(module => module.mountFurniture(stage)).catch(() => {
      stage.querySelector(".graphics-warning").hidden = false;
    });
  }
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

  const stops = new Map([
    ["desk", "The workbench"], ["catalogue", "The project files"], ["about", "Robot code"],
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
    list.replaceChildren(...route.map(id => {
      const item = document.createElement("li");
      item.textContent = stops.get(id);
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
      if (!audio.paused) audio.pause();
    }
    if (room) {
      remember(activeLeaf?.dataset.leaf || deskStops[target.dataset.deskPanel] || room.id);
      if (room.id === "elsewhere") addressPostcard();
    }
    if (move) {
      const turning = activeLeaf && previous === notebook;
      const focus = turning ? activeLeaf.querySelector("h3") : room?.querySelector("h2")
        || opener || overview.querySelector("h2");
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
    clearTimeout(liftTimer);
    const target = document.getElementById(location.hash.slice(1));
    if (target && studio.contains(target)) reveal(target, move);
    else if (!target || target.id === "projects") reveal(studio, Boolean(move && current && returnY !== null));
    // A project reader floats above the open object until its Back button is used.
  }
  document.addEventListener("click", event => {
    const link = event.target.closest("a");
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey
        || event.altKey || event.shiftKey || !link?.getAttribute("href")?.startsWith("#")) return;
    const target = document.getElementById(link.hash.slice(1));
    if (!target || !studio.contains(target) || link.matches(".desk-permalink")) return;
    event.preventDefault();
    clearTimeout(liftTimer);
    if (location.hash !== link.hash) history.pushState(null, "", link.hash);
    if (overview.contains(link) && link.dataset.object) {
      returnY = window.scrollY;
      opener = link;
      const position = Math.max(0, -studio.getBoundingClientRect().top);
      studio.style.setProperty("--opening", Math.round(Math.min(overview.offsetHeight * .66, position + innerHeight * .24)) + "px");
      if (stage.classList.contains("is-rendered") && !reducedMotion.matches) {
        studio.dispatchEvent(new CustomEvent("desk-room", {detail:target.closest("[data-room]")?.id}));
        liftTimer = setTimeout(() => reveal(target, true), 270);
        return;
      }
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

  const postcard = studio.querySelector(".postcard");
  const back = postcard.querySelector(".postcard-back");
  const flip = studio.querySelector("#flip-post");
  flip.addEventListener("click", () => {
    back.hidden = !back.hidden;
    nightMail.hidden = !back.hidden;
    flip.textContent = back.hidden ? "Turn it over ↻" : "See the front ↺";
    if (!back.hidden) addressPostcard();
    if (!reducedMotion.matches) postcard.animate([
      {transform:"perspective(900px) rotateY(-17deg) rotate(-1deg)",opacity:.75},
      {transform:"perspective(900px) rotateY(0) rotate(-1deg)",opacity:1}
    ], {duration:230, easing:"ease-out"});
  });
  const save = studio.querySelector("#save-post");
  save.addEventListener("click", async () => {
    save.disabled = true;
    const status = studio.querySelector("#post-status");
    status.textContent = "";
    try {
      addressPostcard();
      await Promise.all([nightMail.decode(), stamp.decode(), document.fonts.ready]);
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
      route.forEach((id, index) => {
        const y = 1099 + index * 75;
        ctx.fillText(stops.get(id), 66, y, 620);
        ctx.fillRect(66, y + 15, 590, 1);
      });
      const side = Math.min(stamp.naturalWidth, stamp.naturalHeight);
      ctx.drawImage(stamp, (stamp.naturalWidth-side)/2, (stamp.naturalHeight-side)/2, side, side, 971, 864, 160, 160);
      ctx.font = '42px "Bricolage Grotesque", sans-serif';
      ctx.fillText("To whoever", 786, 1175);
      ctx.fillText("picked this up.", 786, 1236);
      ctx.font = '21px "IBM Plex Mono", monospace';
      ctx.fillText("1337isnot1337.github.io", 786, 1490);
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
