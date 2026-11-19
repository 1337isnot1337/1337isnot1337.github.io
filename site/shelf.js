const carousel = document.querySelector(".swiper");
const prints = [...carousel.querySelectorAll(".print")];
const openButton = document.querySelector("#open-print");
const actions = {
  flyover: "Listen to a flyover",
  conjectures: "Deal a round of War",
  factoring: "Split a number",
  cpu: "Train a branch predictor",
  schedule: "Try a schedule",
  conway: "Move a rook",
};
const dialog = document.querySelector(".open-project");
const slot = document.querySelector("#detail-slot");
const catalog = document.querySelector(".project-details");
const projectIndex = document.querySelector(".index");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const articles = new Map(
  [...catalog.children].map((article) => [article.id, article]),
);
const shop = document.querySelector(".shop");
let opener = null;
let activeArticle = null;
let returningToShelf = false;

// Adapted from Swiper's Coverflow demo. Keep an ordinary scrollable shelf if
// the enhancement is unavailable, and keep every print addressable by a link.
let shelf = null;
let coastFrame = 0;
function stopCoast() {
  cancelAnimationFrame(coastFrame);
  coastFrame = 0;
}
if (window.Swiper) {
  // A wide shelf shows five prints at once. A second run gives Swiper room to
  // move paper around the back without exposing an empty end of the ledge.
  const track = carousel.querySelector(".swiper-wrapper");
  for (const slide of [...track.children]) track.append(slide.cloneNode(true));
  let blurTimer;
  let caughtGlide = false;
  function showMotion(duration) {
    if (!duration || reducedMotion.matches) return;
    carousel.classList.add("moving");
    clearTimeout(blurTimer);
    blurTimer = setTimeout(() => carousel.classList.remove("moving"), duration);
  }
  function coast(instance, event) {
    if (reducedMotion.matches || event.type.includes("cancel")) return;
    const samples = instance.touchEventsData.velocities;
    const last = samples.at(-1);
    if (!last || Date.now() - last.time > 100) return;
    const first = samples.find((sample) => last.time - sample.time <= 100);
    if (first.time === last.time) return;
    let speed = (last.position - first.position) / (last.time - first.time);
    speed = Math.max(-5, Math.min(5, speed));
    if (Math.abs(speed) < 0.08) return;
    const direction = speed < 0 ? "next" : "prev";
    let previous = performance.now();

    // Move the same looping track that the finger dragged. A single CSS
    // transition would hit the end of the physical slides during a long fling.
    function glide(now) {
      const decay = Math.exp(-Math.min(now - previous, 64) / 380);
      previous = now;
      instance.setTranslate(instance.translate + speed * 380 * (1 - decay));
      speed *= decay;
      instance.updateActiveIndex();
      instance.updateSlidesClasses();
      instance.loopFix({ direction, byMousewheel: true });
      instance.updateActiveIndex();
      instance.updateSlidesClasses();
      if (Math.abs(speed) > 0.4) showMotion(75);
      coastFrame = Math.abs(speed) > 0.025 ? requestAnimationFrame(glide) : 0;
    }
    coastFrame = requestAnimationFrame(glide);
  }
  shelf = new Swiper(carousel, {
    effect: "coverflow",
    grabCursor: true,
    touchEventsTarget: "container",
    centeredSlides: true,
    slidesPerView: "auto",
    initialSlide: prints.findIndex(
      (print) => print.dataset.project === "flyover",
    ),
    loop: true,
    freeMode: {
      enabled: true,
      momentum: false,
      sticky: false,
    },
    mousewheel: {
      enabled: true,
      forceToAxis: true,
      eventsTarget: ".display-case",
    },
    a11y: { scrollOnFocus: false, slideLabelMessage: "" },
    spaceBetween: 0,
    breakpoints: { 900: { spaceBetween: 28 } },
    speed: reducedMotion.matches ? 0 : 380,
    coverflowEffect: {
      rotate: 13,
      stretch: -2,
      depth: 68,
      modifier: 1,
      slideShadows: false,
    },
    on: {
      touchStart(instance) {
        caughtGlide = Boolean(coastFrame);
        stopCoast();
        instance.touchEventsData.velocities.length = 0;
      },
      beforeTransitionStart: stopCoast,
      sliderMove() {
        showMotion(75);
      },
      scroll(instance) {
        stopCoast();
        // Free scrolling can move slides around the loop after the wheel
        // module has already chosen a center print. Read its final position.
        instance.updateActiveIndex();
        instance.updateSlidesClasses();
        showMotion(70);
      },
      setTransition(instance, duration) {
        if (instance.initialized) showMotion(Math.min(duration * 0.55, 320));
      },
      sliderFirstMove() {
        carousel.classList.add("handling");
      },
      touchEnd(instance, event) {
        if (carousel.classList.contains("handling")) {
          carousel.classList.remove("handling");
          coast(instance, event);
        }
      },
      slideChange(instance) {
        const print = prints[instance.realIndex % prints.length];
        const key = print.dataset.project;
        const activeSlide = instance.slides[instance.activeIndex];
        activeSlide.removeAttribute("aria-hidden");
        if (carousel.contains(document.activeElement)) {
          activeSlide.querySelector(".print").focus({ preventScroll: true });
        }
        for (const [i, slide] of instance.slides.entries()) {
          const selected = i === instance.activeIndex;
          slide.setAttribute("aria-hidden", String(!selected));
          slide.querySelector(".print").tabIndex = selected ? 0 : -1;
        }
        shop.dataset.selection = key;
        for (const link of projectIndex.querySelectorAll("a[data-project]")) {
          if (link.dataset.project === key)
            link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        }
        openButton.dataset.project = key;
        openButton.href = "#" + key;
        openButton.textContent = actions[key];
        document.querySelector("#shelf-status").textContent =
          print.querySelector("strong").textContent;
      },
    },
  });
  // The first tap on a moving print catches the shelf. A fresh tap opens it.
  carousel.addEventListener("click", (event) => {
    if (caughtGlide && event.detail > 0) {
      event.preventDefault();
      event.stopPropagation();
      caughtGlide = false;
    }
  }, true);
  reducedMotion.addEventListener("change", () => {
    stopCoast();
    shelf.params.speed = reducedMotion.matches ? 0 : 380;
  });
  document.addEventListener("visibilitychange", stopCoast);
  function stepPrint(direction) {
    stopCoast();
    const total = shelf.slides.length;
    shelf.slideToLoop((shelf.realIndex + direction + total) % total);
  }
  document
    .querySelector("#prev")
    .addEventListener("click", () => stepPrint(-1));
  document
    .querySelector("#next")
    .addEventListener("click", () => stepPrint(1));
  document.querySelector(".shop").addEventListener("keydown", (event) => {
    if (
      projectIndex.open ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      !["ArrowLeft", "ArrowRight"].includes(event.key)
    )
      return;
    event.preventDefault();
    stepPrint(event.key === "ArrowLeft" ? -1 : 1);
    if (event.target.classList.contains("print"))
      shelf.slides[shelf.activeIndex]
        .querySelector(".print")
        .focus({ preventScroll: true });
  });
} else {
  document.querySelector(".shelf-controls").hidden = true;
}

const hoverPointer = window.matchMedia("(hover: hover) and (pointer: fine)");
for (const print of carousel.querySelectorAll(".print")) {
  print.addEventListener("pointermove", (event) => {
    if (
      reducedMotion.matches ||
      !hoverPointer.matches ||
      event.buttons ||
      event.pointerType === "touch"
    )
      return;
    const box = print.parentElement.getBoundingClientRect();
    const x = Math.max(
      -1,
      Math.min(1, (2 * (event.clientX - box.left)) / box.width - 1),
    );
    print.style.setProperty("--lean", (x * 4).toFixed(2) + "deg");
    print.style.setProperty("--shadow-x", (3 - x * 4).toFixed(1) + "px");
  });
  print.addEventListener("pointerleave", () => {
    print.style.removeProperty("--lean");
    print.style.removeProperty("--shadow-x");
  });
}

function loadArticleMedia(article) {
  for (const media of article.querySelectorAll('img[data-src], audio[data-src]')) {
    media.src = media.dataset.src;
    media.hidden = false;
    delete media.dataset.src;
  }
}
function updateReaderScrollPadding() {
  if (dialog.open) {
    // Native hash navigation and focused elements must clear the sticky controls.
    dialog.style.scrollPaddingTop = dialog.querySelector('.modal-top').offsetHeight + 'px';
  }
}
function displayFromHash() {
  returningToShelf = false;
  const article = articles.get(location.hash.slice(1));
  if (!article) {
    if (dialog.open) dialog.close();
    return;
  }
  if (activeArticle === article && dialog.open) return;
  stopCoast();
  const turning = dialog.open;
  if (activeArticle) {
    activeArticle.querySelector("audio")?.pause();
    catalog.append(activeArticle);
  }
  activeArticle = article;
  const print = prints.find((link) => link.dataset.project === article.id);
  const index = prints.indexOf(print);
  if (shelf && shelf.realIndex % prints.length !== index) {
    // Pick the nearest occurrence, including when the reader crosses the seam.
    let offset = index - (shelf.realIndex % prints.length);
    if (Math.abs(offset) > prints.length / 2)
      offset -= Math.sign(offset) * prints.length;
    const total = shelf.slides.length;
    shelf.slideToLoop((shelf.realIndex + offset + total) % total, 0);
  }
  document.querySelector("#print-position").textContent =
    index + 1 + " / " + prints.length;
  loadArticleMedia(article);
  const recording = article.querySelector("audio");
  if (recording) recording.preload = "metadata";
  const art = print.querySelector("img").cloneNode();
  art.className = "detail-art";
  slot.replaceChildren(art, article);
  dialog.setAttribute("aria-labelledby", article.id + "-title");
  if (!dialog.open) dialog.showModal();
  updateReaderScrollPadding();
  document.body.classList.add("modal-open");
  dialog.scrollTop = 0;
  if (!turning || !dialog.contains(document.activeElement))
    document.querySelector("#close-dialog").focus({ preventScroll: true });
  if (turning && !reducedMotion.matches) {
    slot.animate(
      [
        { opacity: 0.5, transform: "translateY(4px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 175, easing: "ease-out" },
    );
  }
}
function returnToShelf() {
  // Repeated Escape/clicks must not walk past our own history entry.
  if (returningToShelf) return;
  returningToShelf = true;
  if (history.state?.fromShelf) history.back();
  else {
    history.replaceState(
      null,
      "",
      location.pathname + location.search + "#projects",
    );
    displayFromHash();
  }
}
if (typeof dialog.showModal === "function") {
  document.body.classList.add("enhanced");
  if (typeof ResizeObserver === 'function')
    new ResizeObserver(updateReaderScrollPadding).observe(dialog.querySelector('.modal-top'));
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-project]");
    if (
      !link ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      return;
    event.preventDefault();
    opener = projectIndex.contains(link)
      ? projectIndex.querySelector("summary")
      : link;
    projectIndex.open = false;
    const id = link.dataset.project;
    history.pushState({ fromShelf: true }, "", "#" + id);
    displayFromHash();
  });
  let printReaderState = null;
  window.addEventListener('beforeprint', () => {
    if (!dialog.open || printReaderState) return;
    printReaderState = { focus: document.activeElement, scrollTop: dialog.scrollTop };
    // Top-layer dialogs can be clipped or painted blank by PDF renderers.
    // Use the same live article in normal document flow while printing.
    dialog.close();
    dialog.show();
  });
  window.addEventListener('afterprint', () => {
    if (!printReaderState) return;
    const state = printReaderState;
    printReaderState = null;
    dialog.close();
    dialog.showModal();
    state.focus?.focus({ preventScroll: true });
    dialog.scrollTop = state.scrollTop;
  });
  dialog.addEventListener("close", () => {
    // A new hash can reopen the reader before the queued close event fires.
    if (dialog.open) return;
    if (activeArticle) {
      activeArticle.querySelector("audio")?.pause();
      catalog.append(activeArticle);
      activeArticle = null;
    }
    document.body.classList.remove("modal-open");
    const focusTarget =
      opener?.classList.contains("print") && shelf
        ? shelf.slides[shelf.activeIndex].querySelector(".print")
        : opener || openButton;
    focusTarget.focus({ preventScroll: true });
  });
  function turnPrint(direction) {
    const current = prints.findIndex(
      (print) => print.dataset.project === activeArticle.id,
    );
    const next = prints[(current + direction + prints.length) % prints.length];
    if (opener?.classList.contains("print")) opener = next;
    history.replaceState(history.state, "", "#" + next.dataset.project);
    displayFromHash();
  }
  document
    .querySelector("#previous-detail")
    .addEventListener("click", () => turnPrint(-1));
  document
    .querySelector("#next-detail")
    .addEventListener("click", () => turnPrint(1));
  dialog.addEventListener("keydown", (event) => {
    if (
      !["ArrowLeft", "ArrowRight"].includes(event.key) ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.target.closest("input, audio, .toy")
    )
      return;
    event.preventDefault();
    turnPrint(event.key === "ArrowLeft" ? -1 : 1);
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    returnToShelf();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      returnToShelf();
  });
  document
    .querySelector("#close-dialog")
    .addEventListener("click", returnToShelf);
  window.addEventListener("popstate", displayFromHash);
  window.addEventListener("hashchange", displayFromHash);
  displayFromHash();
}
// Older browsers without modal support still read ordinary inline articles.
if (!document.body.classList.contains('enhanced')) {
  for (const article of articles.values()) loadArticleMedia(article);
}
document.addEventListener("click", (event) => {
  if (!projectIndex.contains(event.target)) projectIndex.open = false;
});
projectIndex.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    projectIndex.open = false;
    projectIndex.querySelector("summary").focus();
  }
});
const audio = document.querySelector("#recording");
const head = document.querySelector(".playhead");
const seek = document.querySelector("#spectrum-seek");
const hint = document.querySelector(".seek-hint");
const timestamp = (time) =>
  Math.floor(time / 60) + ":" + String(Math.floor(time % 60)).padStart(2, "0");
const audioCues = document.querySelector('.audio-cues');
const audioStatus = document.querySelector('#audio-status');
audioCues.hidden = false;
let audioCueRequest = 0;
for (const cue of audioCues.querySelectorAll('button')) {
  cue.addEventListener('click', async () => {
    audioStatus.hidden = true;
    try {
      const requestedTime = Number(cue.dataset.audioCue);
      const request = ++audioCueRequest;
      const seekWhenReady = () => {
        if (request === audioCueRequest) audio.currentTime = requestedTime;
      };
      // A first click may precede metadata; do not let media initialization
      // discard the requested offset. Play now to preserve user activation.
      if (audio.readyState === 0)
        audio.addEventListener('loadedmetadata', seekWhenReady, { once: true });
      else seekWhenReady();
      await audio.play();
    } catch (error) {
      // Closing the reader or pausing cancels playback intentionally.
      if (error?.name === 'AbortError') return;
      audioStatus.hidden = false;
      audioStatus.textContent = 'The recording could not start. Try the audio player below.';
    }
  });
}
let seekableCopy = null;
function enableSeeking() {
  const ranges = audio.seekable;
  if (
    !Number.isFinite(audio.duration) ||
    !ranges.length ||
    ranges.end(ranges.length - 1) <= 0
  )
    return;
  seek.max = audio.duration;
  seek.hidden = false;
  seek.setAttribute("aria-valuetext", timestamp(audio.currentTime));
}
audio.addEventListener("loadedmetadata", enableSeeking);
audio.addEventListener("canplay", async () => {
  enableSeeking();
  if (!seek.hidden || seekableCopy || !audio.paused) return;
  // A basic static preview server may send the MP3 without byte-range support.
  // In that case a local blob lets the browser seek the same complete recording.
  seekableCopy = fetch(audio.currentSrc)
    .then((response) => (response.ok ? response.blob() : null))
    .then((blob) => {
      if (blob && audio.paused) audio.src = URL.createObjectURL(blob);
    })
    .catch(() => {});
  await seekableCopy;
});
audio.addEventListener("timeupdate", () => {
  head.hidden = !audio.duration || audio.currentTime === 0;
  head.style.left =
    Math.min(99.8, (100 * audio.currentTime) / (audio.duration || 1)) + "%";
  seek.value = audio.currentTime;
  seek.setAttribute("aria-valuetext", timestamp(audio.currentTime));
});
function showSeekTime(fraction) {
  hint.textContent = timestamp(fraction * Number(seek.max));
  hint.style.left = "clamp(24px," + fraction * 100 + "%, calc(100% - 24px))";
}
seek.addEventListener("pointermove", (event) => {
  const rect = seek.getBoundingClientRect();
  showSeekTime(
    Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
  );
});
seek.addEventListener("focus", () =>
  showSeekTime(seek.valueAsNumber / Number(seek.max)),
);
seek.addEventListener("input", () => {
  audio.currentTime = seek.valueAsNumber;
  showSeekTime(seek.valueAsNumber / Number(seek.max));
});

document.querySelector("#factor-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#composite");
  const value = input.valueAsNumber;
  if (!input.checkValidity() || !Number.isSafeInteger(value)) {
    input.reportValidity();
    return;
  }
  let remainder = value;
  const factors = [];
  const steps = [];
  const ledger = document.querySelector('#factor-steps');
  ledger.replaceChildren();
  for (let divisor = 2; divisor * divisor <= remainder; divisor++) {
    while (remainder % divisor === 0) {
      factors.push(divisor);
      steps.push([remainder, divisor, remainder / divisor]);
      remainder /= divisor;
    }
  }
  if (remainder > 1) factors.push(remainder);
  for (const [before, divisor, after] of steps) {
    const row = document.createElement('li');
    for (const [tag, value] of [['span', before], ['span', `÷ ${divisor} →`], ['strong', after]]) {
      const cell = document.createElement(tag);
      cell.textContent = value;
      row.append(cell);
    }
    ledger.append(row);
  }
  document.querySelector('#factor-ending').textContent =
    factors.length === 1 ? `${value} is already prime.` :
    remainder > 1 ? `${remainder} is prime, so it is the last factor.` : 'Nothing left to split.';
  document.querySelector("#factors").value =
    factors.length === 1
      ? value + " is prime."
      : value + " = " + factors.join(" × ");
});
// One PHT entry in the Hack CPU starts at 01. It saturates at either end.
let counter = 1;
const predictions = [
  "Strongly predicts not taken.",
  "Weakly predicts not taken.",
  "Weakly predicts taken.",
  "Strongly predicts taken.",
];
const track = document.querySelector(".counter-track");
track.style.setProperty("--state", counter);
for (const button of document.querySelectorAll("[data-taken]")) {
  button.addEventListener("click", () => {
    const taken = button.dataset.taken === "true";
    const predictedTaken = counter >= 2;
    document.querySelector("#prediction-result").textContent =
      "Predicted " + (predictedTaken ? "taken" : "not taken") +
      "; actual jump " + (taken ? "taken" : "not taken") +
      ". " + (predictedTaken === taken ? "Correct." : "Missed this one.");
    counter = Math.max(0, Math.min(3, counter + (taken ? 1 : -1)));
    track.style.setProperty("--state", counter);
    document.querySelector("#forecast").textContent =
      counter.toString(2).padStart(2, "0") + " · " + predictions[counter];
  });
}

document.querySelector("#reset-predictor").addEventListener("click", () => {
  counter = 1;
  track.style.setProperty("--state", counter);
  document.querySelector("#forecast").textContent = "01 · " + predictions[counter];
  document.querySelector("#prediction-result").textContent =
    "Reset to 01. Try a few taken jumps, then switch.";
});

const address = document.querySelector("#address");
function renderInstruction() {
  const result = document.querySelector("#instruction");
  const register = document.querySelector('#binary-register');
  const sum = document.querySelector('#binary-sum');
  register.replaceChildren();
  if (!address.validity.valid) {
    result.value = "Enter a whole number from 0 to 32,767.";
    sum.textContent = '';
    return;
  }
  const bits = address.valueAsNumber.toString(2).padStart(16, "0");
  result.value = bits.match(/.{4}/g).join(" ");
  const places = [];
  [...bits].forEach((bit, index) => {
    const cell = document.createElement('span');
    cell.className = 'binary-cell' + (bit === '1' ? ' is-one' : '') + (index === 0 ? ' instruction-type' : '');
    const position = document.createElement('small');
    position.textContent = index === 0 ? 'type' : String(15-index);
    const value = document.createElement('strong');
    value.textContent = bit;
    cell.append(position,value);
    register.append(cell);
    if (bit === '1') places.push(2 ** (15-index));
  });
  sum.textContent = (places.length ? places.join(' + ') : '0') + ' = ' + address.valueAsNumber;
}
address.addEventListener("input", renderInstruction);
renderInstruction();
const board = document.querySelector("#rook-board");
const squares = ["A3", "B3", "C3", "A2", "B2", "C2", "A1", "B1", "C1"];
function placeRook(position) {
  const neighbors = [];
  for (const button of board.children) {
    const square = button.textContent;
    const reachable =
      square !== position &&
      (position[0] === square[0] || position[1] === square[1]);
    if (reachable) neighbors.push(square);
    button.classList.toggle("neighbor", reachable);
    button.setAttribute("aria-pressed", String(square === position));
  }
  document.querySelector("#rook-caption").value =
    "From " + position + " → " + neighbors.join(", ");
}
for (const square of squares) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = square;
  button.addEventListener("click", () => placeRook(square));
  board.append(button);
}
function compareRooks(first, second) {
  const shared = [];
  for (const button of board.children) {
    const square = button.textContent;
    const selected = square === first || square === second;
    const common = !selected && [first, second].every(position =>
      position[0] === square[0] || position[1] === square[1]);
    button.classList.toggle('neighbor', common);
    button.setAttribute('aria-pressed', String(selected));
    if (common) shared.push(square);
  }
  const adjacent = first[0] === second[0] || first[1] === second[1];
  document.querySelector('#rook-caption').value =
    `${first} + ${second} · ${adjacent ? 'Adjacent' : 'Nonadjacent'} · ` +
    `${shared.length} shared neighbor${shared.length === 1 ? '' : 's'}: ${shared.join(', ')}.`;
}
for (const button of document.querySelectorAll('[data-rook-pair]')) {
  button.addEventListener('click', () => compareRooks(...button.dataset.rookPair.split(',')));
}
placeRook("B2");

// Distinct ranks and descending collection order from the three-player War proof.
const initialHands = [
  [15, 7, 16, 8, 1, 22, 17, 9],
  [10, 2, 23, 18, 11, 19, 12, 3],
  [4, 20, 13, 5, 21, 14, 6],
];
const startingDeal = JSON.stringify(initialHands);
let hands = initialHands.map((hand) => [...hand]);
let turn = 0;
const cards = [...document.querySelectorAll(".war-hands b")];
const report = document.querySelector("#war-report");
function dealTurn() {
  const exposed = hands.map((hand) => hand.shift());
  const winner = exposed.indexOf(Math.max(...exposed));
  hands[winner].push(...exposed.sort((a, b) => b - a));
  turn++;
  return "ABC"[winner];
}
// Trace the same deterministic deal, independently of the visitor's current turn.
const cycleHands = initialHands.map(hand => [...hand]);
const cycleCounts = [cycleHands.map(hand => hand.length)];
for (let step = 0; step < 90; step++) {
  const exposed = cycleHands.map(hand => hand.shift());
  const winner = exposed.indexOf(Math.max(...exposed));
  cycleHands[winner].push(...exposed.sort((a,b) => b-a));
  cycleCounts.push(cycleHands.map(hand => hand.length));
}
for (let player = 0; player < 3; player++) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  line.setAttribute('points', cycleCounts.map((counts, step) =>
    `${30 + step * 428 / 90},${108 - counts[player] * 7.5}`).join(' '));
  document.querySelector('#war-lines').append(line);
}
document.querySelector('.war-cycle').hidden = false;
const turnSlider = document.querySelector('#war-turn');
turnSlider.addEventListener('input', () => {
  hands = initialHands.map(hand => [...hand]);
  turn = 0;
  let winner;
  const requested = Number(turnSlider.value);
  while (turn < requested) winner = dealTurn();
  showDeal(winner);
});
function showDeal(winner) {
  const cycleTurn = turn > 0 && turn % 90 === 0 ? 90 : turn % 90;
  turnSlider.value = cycleTurn;
  document.querySelector('#war-turn-label').value = cycleTurn;
  const x = 30 + cycleTurn * 428 / 90;
  document.querySelector('#war-cursor').setAttribute('d', `M${x} 14V113`);
  const queues = document.querySelector("#war-queues");
  queues.replaceChildren();
  hands.forEach((hand, i) => {
    const label = document.createElement("dt");
    label.textContent = "Player " + "ABC"[i] + " · " + hand.length + " cards";
    const queue = document.createElement("dd");
    queue.textContent = hand.join(" → ");
    queues.append(label, queue);
  });
  cards.forEach((card, i) => {
    card.textContent = hands[i][0];
    if (turn && !reducedMotion.matches)
      card.animate(
        [
          { transform: "translateY(-4px)", opacity: 0.25 },
          { transform: "translateY(0)", opacity: 1 },
        ],
        { duration: 160, delay: i * 28, fill: "backwards", easing: "ease-out" },
      );
  });
  if (!turn) {
    report.value = "Starting deal. The next three cards are face up.";
  } else if (JSON.stringify(hands) === startingDeal) {
    report.value =
      "Turn " +
      turn +
      ". All three hands are back in their original order. The game repeats.";
  } else {
    report.value =
      "Turn " +
      turn +
      ". Player " +
      winner +
      " won. The cards above are up next.";
  }
}
document
  .querySelector("#deal-war")
  .addEventListener("click", () => showDeal(dealTurn()));
document.querySelector("#repeat-war").addEventListener("click", () => {
  // This exact published deal returns in 90 turns. Compare the entire queues.
  let winner;
  for (let step = 0; step < 90; step++) {
    winner = dealTurn();
    if (JSON.stringify(hands) === startingDeal) break;
  }
  showDeal(winner);
});
document.querySelector("#reset-war").addEventListener("click", () => {
  hands = initialHands.map((hand) => [...hand]);
  turn = 0;
  showDeal();
});

showDeal();

// Ignore accents and layout whitespace, so “erdos” and multi-word searches
// work just as well as the printed titles.
const searchText = (text) => text.normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const searchBox = document.querySelector("#find-project");
const filterBar = document.querySelector(".catalogue-filters");
const entries = [...document.querySelectorAll(".catalogue-list li")];
const more = document.querySelector("#more-projects");
const count = document.querySelector("#result-count");
let category = "All";
let expanded = false;
function filterCatalogue() {
  const query = searchText(searchBox.value);
  const terms = query.split(" ").filter(Boolean);
  const filtered = entries.filter(
    (entry) =>
      (category === "All" || entry.dataset.category === category) &&
      terms.every((term) => searchText(entry.textContent).includes(term)),
  );
  const compact = !expanded && !query && category === "All";
  const visible = new Set(compact ? filtered.slice(0, 6) : filtered);
  entries.forEach((entry) => {
    entry.hidden = !visible.has(entry);
  });
  count.textContent = compact
    ? visible.size + " of " + filtered.length + " projects"
    : filtered.length + (filtered.length === 1 ? " project" : " projects");
  more.hidden = !!query || category !== "All" || filtered.length <= 6;
  more.textContent = expanded ? "Show fewer" : "Show all " + entries.length;
  more.setAttribute("aria-expanded", String(expanded));
  document.querySelector("#no-projects").hidden = filtered.length !== 0;
}
searchBox.closest("label").hidden = false;
filterBar.hidden = false;
filterBar.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  category = button.textContent;
  expanded = false;
  for (const tab of filterBar.children)
    tab.setAttribute("aria-pressed", String(tab === button));
  filterCatalogue();
});
more.addEventListener("click", () => {
  const firstNewProject = !expanded
    ? entries.find((entry) => entry.hidden)?.querySelector("a")
    : null;
  expanded = !expanded;
  filterCatalogue();
  // Continue reading where the compact list ended instead of leaving keyboard
  // focus below all 25 newly revealed links.
  if (firstNewProject) {
    firstNewProject.focus({ preventScroll: true });
    firstNewProject.scrollIntoView({ block: "nearest" });
  }
  if (!expanded)
    document
      .querySelector("#catalogue-title")
      .scrollIntoView({ block: "start" });
});
document.querySelector("#clear-projects").addEventListener("click", () => {
  searchBox.value = "";
  category = "All";
  expanded = false;
  for (const tab of filterBar.children)
    tab.setAttribute("aria-pressed", String(tab.textContent === category));
  filterCatalogue();
  searchBox.focus();
});
searchBox.addEventListener("input", filterCatalogue);
filterCatalogue();
