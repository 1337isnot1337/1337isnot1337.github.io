const recording = document.querySelector("#flyover");
const listen = document.querySelector("#listen");
const label = document.querySelector("#audio-label");
const symbol = document.querySelector("#audio-symbol");
const elapsed = document.querySelector("#elapsed");
const playhead = document.querySelector(".playhead");

function clock(seconds) {
  const whole = Math.floor(seconds);
  return Math.floor(whole / 60) + ":" + String(whole % 60).padStart(2, "0");
}

function showPlayback() {
  const playing = !recording.paused && !recording.ended;
  label.textContent = playing ? "Pause flyover" : "Play flyover";
  symbol.textContent = playing ? "Ⅱ" : "▶";
  elapsed.textContent =
    clock(recording.currentTime) + " / " + clock(recording.duration || 85.23);
  playhead.hidden = recording.currentTime === 0;
  playhead.style.left =
    (100 * recording.currentTime) / (recording.duration || 85.23) + "%";
}

listen.hidden = false;
recording.controls = false;
listen.addEventListener("click", async () => {
  if (!recording.paused) {
    recording.pause();
    return;
  }
  try {
    await recording.play();
  } catch {
    label.textContent = "Retry recording";
    recording.controls = true;
  }
});
for (const event of [
  "loadedmetadata",
  "play",
  "pause",
  "ended",
  "timeupdate",
]) {
  recording.addEventListener(event, showPlayback);
}

// Keep the visitor's chosen knot and viewing angle on a printable field plate.
document.querySelector("#save-print").addEventListener("click", async () => {
  await document.fonts.ready;
  const plot = document.querySelector("#plot");
  const plate = document.createElement("canvas");
  plate.width = 1200;
  plate.height = 1400;
  const ink = plate.getContext("2d");
  ink.fillStyle = "#f4f1e8";
  ink.fillRect(0, 0, 1200, 1400);
  ink.fillStyle = "#151917";
  ink.fillRect(50, 135, 1100, 900);
  ink.strokeStyle = "#303a2f";
  ink.lineWidth = 1;
  ink.beginPath();
  for (let x = 80; x < 1150; x += 40) {
    ink.moveTo(x, 135);
    ink.lineTo(x, 1035);
  }
  for (let y = 165; y < 1035; y += 40) {
    ink.moveTo(50, y);
    ink.lineTo(1150, y);
  }
  ink.stroke();
  // The renderer fits the mesh tightly in at least one dimension.
  // Crop the canvas's transparent margins to preserve that scale in print.
  const data = plot
    .getContext("2d")
    .getImageData(0, 0, plot.width, plot.height).data;
  let left = plot.width,
    top = plot.height,
    right = 0,
    bottom = 0;
  for (let y = 0; y < plot.height; y++) {
    for (let x = 0; x < plot.width; x++) {
      if (data[(y * plot.width + x) * 4 + 3] < 10) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  const w = right - left + 1,
    h = bottom - top + 1;
  if (w <= 0 || h <= 0) return;
  const scale = Math.min(940 / w, 780 / h);
  ink.drawImage(
    plot,
    left,
    top,
    w,
    h,
    600 - (w * scale) / 2,
    585 - (h * scale) / 2,
    w * scale,
    h * scale,
  );
  ink.fillStyle = "#202720";
  ink.font = "26px Mono";
  ink.fillText("CINNA DAVIS  /  FIELD NOTEBOOK", 55, 90);
  ink.textAlign = "right";
  ink.fillText(
    "FIG. " + document.querySelector("#plot-count").textContent,
    1145,
    90,
  );
  ink.textAlign = "left";
  const name = document.querySelector("#plot-name").textContent;
  ink.font = "italic 118px Signature";
  ink.fillText(name, 50, 1180);
  ink.font = "30px Body";
  ink.fillText(
    document.querySelector("#plot-description").textContent,
    55,
    1242,
    1080,
  );
  ink.font = "22px Mono";
  ink.fillText("1337isnot1337.github.io", 55, 1345);
  plate.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "Cinna-Davis-" + name.replace(/[^a-z0-9]+/gi, "-") + ".png";
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }, "image/png");
});
