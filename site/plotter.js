// Each joint follows a torus knot. A circular section swept along its tangent
// turns the curve into a solid, and its section lines become the plotted ink.
(() => {
  const canvas = document.getElementById("plot");
  const context = canvas?.getContext("2d");
  if (!context) return;

  const knots = [
    {
      name: "Trefoil",
      p: 2,
      q: 3,
      tube: 0.32,
      pitch: -0.6,
      yaw: 0.22,
      description:
        "Two turns around the torus, three through its central hole.",
    },
    {
      name: "Cinquefoil",
      p: 2,
      q: 5,
      tube: 0.23,
      pitch: -0.45,
      yaw: -0.17,
      description: "Two turns around the torus, five through its central hole.",
    },
    {
      name: "T(3, 4)",
      p: 3,
      q: 4,
      tube: 0.23,
      pitch: -0.38,
      yaw: 0.26,
      description:
        "Three turns around the torus, four through its central hole.",
    },
  ];
  const tau = 2 * Math.PI;
  const sides = 24;
  let selected = 0;
  let pitch, yaw, vertices, rings, drag;
  let requested = false;

  function unit([x, y, z]) {
    const length = Math.hypot(x, y, z);
    return [x / length, y / length, z / length];
  }

  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  function makeMesh({ p, q, tube }) {
    rings = 72 * q;
    vertices = [];
    for (let i = 0; i < rings; i++) {
      const t = (tau * i) / rings;
      const a = Math.cos(p * t),
        b = Math.sin(p * t);
      const c = Math.cos(q * t),
        d = Math.sin(q * t);
      const radius = 1.68 + 0.82 * c;
      const center = [radius * a, radius * b, 0.87 * d];
      const tangent = unit([
        -0.82 * q * d * a - p * radius * b,
        -0.82 * q * d * b + p * radius * a,
        0.87 * q * c,
      ]);
      // A torus surface normal and its perpendicular define the section plane.
      const bitangent = unit(cross(tangent, [a * c, b * c, d]));
      const normal = cross(bitangent, tangent);
      for (let j = 0; j < sides; j++) {
        const cosine = Math.cos((tau * j) / sides),
          sine = Math.sin((tau * j) / sides);
        const n = normal.map((v, k) => v * cosine + bitangent[k] * sine);
        vertices.push({
          point: center.map((v, k) => v + tube * n[k]),
          normal: n,
        });
      }
    }
  }

  function paint() {
    requested = false;
    const width = canvas.clientWidth,
      height = canvas.clientHeight;
    if (!width || !height) return;
    const density = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(width * density),
      h = Math.round(height * density);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    context.setTransform(density, 0, 0, density, 0, 0);
    context.clearRect(0, 0, width, height);

    const cx = Math.cos(pitch),
      sx = Math.sin(pitch);
    const cy = Math.cos(yaw),
      sy = Math.sin(yaw);
    const cz = 0.982,
      sz = -0.189;
    function camera([x, y, z]) {
      const a = cy * x + sy * z;
      const b = -sy * x + cy * z;
      const c = cx * y - sx * b;
      return [a * cz - c * sz, a * sz + c * cz, sx * y + cx * b];
    }
    let xmin = Infinity,
      xmax = -Infinity,
      ymin = Infinity,
      ymax = -Infinity;
    const points = vertices.map(({ point, normal }) => {
      const [a, b, z] = camera(point);
      const perspective = 12 / (12 - z);
      const x = a * perspective,
        y = -b * perspective;
      xmin = Math.min(xmin, x);
      xmax = Math.max(xmax, x);
      ymin = Math.min(ymin, y);
      ymax = Math.max(ymax, y);
      return { x, y, z, n: camera(normal) };
    });
    const scale = Math.min(
      (width * 0.92) / (xmax - xmin),
      (height * 0.91) / (ymax - ymin),
    );
    for (const point of points) {
      point.x = width / 2 + scale * (point.x - (xmax + xmin) / 2);
      point.y = height / 2 + scale * (point.y - (ymax + ymin) / 2);
    }

    const faces = [];
    for (let i = 0; i < rings; i++) {
      const next = (i + 1) % rings;
      for (let j = 0; j < sides; j++) {
        const k = (j + 1) % sides;
        const a = points[i * sides + j],
          b = points[i * sides + k];
        const c = points[next * sides + k],
          d = points[next * sides + j];
        // Ignore back-facing polygons using the projected winding.
        if ((b.x - a.x) * (d.y - a.y) - (b.y - a.y) * (d.x - a.x) >= 0)
          continue;
        faces.push({ a, b, c, d, i, j, z: (a.z + b.z + c.z + d.z) / 4 });
      }
    }
    faces.sort((a, b) => a.z - b.z);
    context.lineJoin = "round";
    const line = Math.max(0.7, Math.min(1.35, width / 460));
    for (const { a, b, c, d, i, j, z } of faces) {
      const nx = (a.n[0] + c.n[0]) / 2,
        ny = (a.n[1] + c.n[1]) / 2;
      const nz = (a.n[2] + c.n[2]) / 2;
      const light = Math.max(0, -0.35 * nx + 0.68 * ny + 0.63 * nz);
      const depth = Math.max(0.1, Math.min(1, (z + 2.5) / 4));
      const tone = light * (0.54 + depth * 0.46);
      const body =
        "rgb(" +
        Math.round(16 + 57 * tone) +
        "," +
        Math.round(40 + 73 * tone) +
        "," +
        Math.round(21 + 8 * tone) +
        ")";
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.lineTo(c.x, c.y);
      context.lineTo(d.x, d.y);
      context.closePath();
      context.fillStyle = context.strokeStyle = body;
      context.lineWidth = 0.7;
      context.stroke();
      context.fill();

      const lit = Math.min(
        1,
        0.37 + 0.54 * tone + 0.09 * depth + 0.16 * (1 - Math.abs(nz)) ** 4,
      );
      const ink =
        "rgb(" +
        Math.round(40 + 172 * lit) +
        "," +
        Math.round(85 + 163 * lit) +
        "," +
        Math.round(35 + 80 * lit) +
        ")";
      context.strokeStyle = ink;
      context.lineWidth = line * (i % 6 === 0 ? 1.18 : 0.72);
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.moveTo(d.x, d.y);
      context.lineTo(c.x, c.y);
      context.stroke();
      if (j % 2 === 0) {
        context.globalAlpha = j % 8 === 0 ? 0.9 : 0.58;
        context.lineWidth = line * (j % 8 === 0 ? 1.05 : 0.7);
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(d.x, d.y);
        context.stroke();
        context.globalAlpha = 1;
      }
    }
    canvas.dataset.ready = "true";
    canvas.closest(".plot-stage")?.classList.add("plot-ready");
  }

  function redraw() {
    if (!requested) {
      requested = true;
      requestAnimationFrame(paint);
    }
  }

  function select(index) {
    selected = (index + knots.length) % knots.length;
    const knot = knots[selected];
    pitch = knot.pitch;
    yaw = knot.yaw;
    makeMesh(knot);
    document.getElementById("plot-name").textContent = knot.name;
    document.getElementById("plot-count").textContent =
      String(selected + 1).padStart(2, "0") + " / 03";
    document.getElementById("plot-description").textContent = knot.description;
    canvas.setAttribute(
      "aria-label",
      "Three-dimensional " +
        knot.name +
        " knot. Drag or use arrow keys to rotate.",
    );
    redraw();
  }

  document
    .getElementById("prev-plot")
    .addEventListener("click", () => select(selected - 1));
  document
    .getElementById("next-plot")
    .addEventListener("click", () => select(selected + 1));
  canvas.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    drag = {
      x: event.clientX,
      y: event.clientY,
      pitch,
      yaw,
      id: event.pointerId,
    };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (drag?.id !== event.pointerId) return;
    yaw = drag.yaw + (event.clientX - drag.x) * 0.011;
    pitch = drag.pitch + (event.clientY - drag.y) * 0.011;
    redraw();
  });
  canvas.addEventListener("lostpointercapture", () => {
    drag = null;
  });
  canvas.addEventListener("keydown", (event) => {
    const delta = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];
    if (!delta) return;
    event.preventDefault();
    yaw += delta[0] * 0.15;
    pitch += delta[1] * 0.15;
    redraw();
  });
  select(0);
  new ResizeObserver(redraw).observe(canvas);
})();
