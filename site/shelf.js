const carousel = document.querySelector(".swiper");
const prints = [...carousel.querySelectorAll(".print")];
const openButton = document.querySelector("#open-print");
const actions = {
  flyover: "Listen to a flyover",
  factoring: "Split a number",
  cpu: "Encode an instruction",
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
let opener = null;
let activeArticle = null;

// Adapted from Swiper's Coverflow demo. Keep an ordinary scrollable shelf if
// the enhancement is unavailable, and keep every print addressable by a link.
let shelf = null;
if (window.Swiper) {
  shelf = new Swiper(carousel, {
    effect: "coverflow",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    initialSlide: prints.findIndex(
      (print) => print.dataset.project === "flyover",
    ),
    rewind: true,
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
      slideChange(instance) {
        const key = prints[instance.activeIndex].dataset.project;
        openButton.dataset.project = key;
        openButton.href = "#" + key;
        openButton.textContent = actions[key];
        document.querySelector("#shelf-status").textContent =
          prints[instance.activeIndex].querySelector("strong").textContent;
      },
    },
  });
  carousel.addEventListener("focusin", (event) => {
    const link = event.target.closest(".print");
    if (link && link.matches(":focus-visible"))
      shelf.slideTo(prints.indexOf(link));
  });
  document
    .querySelector("#prev")
    .addEventListener("click", () => shelf.slidePrev());
  document
    .querySelector("#next")
    .addEventListener("click", () => shelf.slideNext());
  document.querySelector(".shop").addEventListener("keydown", (event) => {
    if (projectIndex.open || !["ArrowLeft", "ArrowRight"].includes(event.key))
      return;
    event.preventDefault();
    if (event.key === "ArrowLeft") shelf.slidePrev();
    else shelf.slideNext();
    if (event.target.classList.contains("print"))
      prints[shelf.activeIndex].focus({ preventScroll: true });
  });
} else {
  document.querySelector(".shelf-controls").hidden = true;
}

function displayFromHash() {
  const article = articles.get(location.hash.slice(1));
  if (!article) {
    if (dialog.open) dialog.close();
    return;
  }
  if (activeArticle === article && dialog.open) return;
  if (activeArticle) {
    activeArticle.querySelector("audio")?.pause();
    catalog.append(activeArticle);
  }
  activeArticle = article;
  const print = prints.find((link) => link.dataset.project === article.id);
  const art = print.querySelector("img").cloneNode();
  art.className = "detail-art";
  slot.replaceChildren(art, article);
  dialog.setAttribute("aria-labelledby", article.id + "-title");
  if (!dialog.open) dialog.showModal();
  document.body.classList.add("modal-open");
  document.querySelector("#close-dialog").focus({ preventScroll: true });
}
function returnToShelf() {
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
    shelf?.slideTo(prints.findIndex((print) => print.dataset.project === id));
    history.pushState({ fromShelf: true }, "", "#" + id);
    displayFromHash();
  });
  dialog.addEventListener("close", () => {
    if (activeArticle) {
      activeArticle.querySelector("audio")?.pause();
      catalog.append(activeArticle);
      activeArticle = null;
    }
    document.body.classList.remove("modal-open");
    (opener || openButton).focus({ preventScroll: true });
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
audio.addEventListener("timeupdate", () => {
  head.hidden = !audio.duration || audio.currentTime === 0;
  head.style.left =
    Math.min(99.8, (100 * audio.currentTime) / (audio.duration || 1)) + "%";
});

document.querySelector("#factor-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const value = document.querySelector("#composite").valueAsNumber;
  let remainder = value;
  const factors = [];
  for (let divisor = 2; divisor * divisor <= remainder; divisor++) {
    while (remainder % divisor === 0) {
      factors.push(divisor);
      remainder /= divisor;
    }
  }
  if (remainder > 1) factors.push(remainder);
  document.querySelector("#factors").value =
    factors.length === 1
      ? value + " is prime."
      : value + " = " + factors.join(" × ");
});
const address = document.querySelector("#address");
address.addEventListener("input", () => {
  const result = document.querySelector("#instruction");
  if (!address.validity.valid) {
    result.value = "Enter a whole number from 0 to 32,767.";
    return;
  }
  result.value = address.valueAsNumber
    .toString(2)
    .padStart(16, "0")
    .match(/.{4}/g)
    .join(" ");
});
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
placeRook("B2");
