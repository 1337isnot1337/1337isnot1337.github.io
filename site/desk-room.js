import * as T from './vendor/three/three.module.min.js';
import { furnishRoomObjects } from './room-objects.js?v=4';
import { buildRoomShell } from './room-shell.js?v=4';

// Atlas order: name, source aspect ratio, wall x/y, physical width, rotation.
const artwork = [
  ['fairy-metal', 1, -2.48, 2.65, 1.46, -.025],
  ['sirencore', 1, -.88, 2.73, 1.54, .013],
  ['fables', 1, .82, 2.72, 1.64, -.010],
  ['luka', 1, -2.48, 1.07, 1.51, .017],
  ['till', 1, -.88, 1.07, 1.53, -.014],
  ['ivan', 1, .82, 1.06, 1.62, -.017],
  ['korra', 2732/2048, -2.03, -.66, 2.44, .010],
  ['seven-havens', 2/3, 2.89, 1.72, 2.31, -.012],
  ['openai', 700/982, 2.4, 2.31, 1.47, .015],
  ['anthropic', 16/9, .21, 2.83, 2.62, -.014],
  ['neuralink', 1200/630, -.22, .15, 1.80, .008],
  ['musk', 1666/2500, -2.30, 1.88, 2.08, .016],
  ['spacex', 1041/1564, 2.38, .28, 1.20, -.011],
  ['aubrey', 500/695, -2.37, -.60, 1.15, -.019],
  ['fermilab', 1479/688, .22, 1.38, 2.62, .013],
  ['tux', 300/356, 1.25, -.10, 1.00, -.036],
  ['atla', 2732/2048, .46, -.67, 2.33, .016],
];
const leafColors = [0x58724a, 0x3b6244, 0x446e4b, 0x638757, 0x81945e];
const ivyLeaf = new T.BufferGeometry();
ivyLeaf.setAttribute('position', new T.Float32BufferAttribute([
  0,0,.022, -.146,.114,0, -.149,.238,0, -.077,.30,.007, 0,.42,.022,
  .077,.30,.007, .149,.238,0, .146,.114,0, 0,.211,.060,
], 3));
ivyLeaf.setIndex([0,1,8, 1,2,8, 2,3,8, 3,4,8, 4,5,8, 5,6,8, 6,7,8, 7,0,8]);
ivyLeaf.setAttribute('uv', new T.Float32BufferAttribute([
  .5,0, 0,.27, 0,.57, .25,.72, .5,1, .75,.72, 1,.57, 1,.27, .5,.5,
], 2));
ivyLeaf.computeVertexNormals();

export function decorateRoom(world, { narrow, half, group, box, bead, cylinder, wire, finish, photo, tag, drawn, weave, wood, trim, floorMat }) {
  const walls=buildRoomShell(world,{group,box,bead,cylinder,finish,photo,weave,wood,trim,floorMat});
  const atlas = photo('/assets/furniture/room-atlas.webp?v=4');
  const ink = new T.MeshStandardMaterial({ map: atlas, roughness: .93, alphaTest: .28 });
  const cutout = ink.clone();
  cutout.side = T.DoubleSide;
  const paper = new T.MeshStandardMaterial({ color: 0xe8dfce, roughness: .97, side: T.BackSide });
  const stem = finish(0x506741);
  const foliage = leafColors.map(color => new T.MeshStandardMaterial({ color, roughness: .88, side: T.DoubleSide }));

  function poster(wall, index) {
    const [id, aspect, x, y, w, tilt] = artwork[index];
    const height = w / aspect;
    const offset = index >= 8 && index < 16 ? -.48 : 0;
    const frame = tag(group(wall, x + offset, y, .071), 'room-' + id, [0, 0, 0], w, height);
    frame.userData.roomPoster = true;
    frame.rotation.z = tilt;
    const plane = new T.PlaneGeometry(w, height);
    const uv = plane.attributes.uv;
    const column = index % 4, row = Math.floor(index / 4);
    // Avoid mip-map bleeding from the next print along the atlas edge.
    const pad = .02;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (column + pad + uv.getX(i) * (1 - 2 * pad)) / 4,
        (4 - row + pad + uv.getY(i) * (1 - 2 * pad)) / 5);
    }
    const print = new T.Mesh(plane, id === 'tux' ? cutout : ink);
    print.receiveShadow = true;
    frame.add(print);
    if (id !== 'tux') {
      const back = new T.Mesh(plane.clone(), paper);
      back.position.z = -.004;
      frame.add(back);
    }
  }

  function leaf(branch, position, size, angle, index) {
    const blade = new T.Mesh(ivyLeaf, foliage[index % foliage.length]);
    blade.position.set(...position);
    blade.scale.setScalar(size);
    blade.rotation.z = angle;
    blade.rotation.y = .45 * Math.sin(index * 1.71);
    blade.receiveShadow = true;
    branch.add(blade);
  }

  function vine(parent, x, y, z, length, phase, lead = []) {
    const branch = group(parent, x, y, z);
    const points = Array.from({ length: 15 }, (_, i) => [
      Math.sin(i * .62 + phase) * .20 + i * .010, -i * length / 14, Math.sin(i * .39) * .056,
    ]);
    wire(branch, [...lead, ...points], .014, stem).castShadow = false;
    points.slice(1).forEach((point, i) => {
      leaf(branch, point, .70 + .25 * Math.sin(i * 1.4 + phase), (i % 2 ? -1 : 1) * (1.18 + .25 * Math.sin(i)), i);
    });
  }

  function flowers(wall, x, y, color) {
    const vase = group(wall, x, y, .36);
    const ceramic = finish(color, .55);
    cylinder(vase, .144, .115, .32, ceramic, 0, .16, 0, 20);
    cylinder(vase, .151, .151, .048, ceramic, 0, .322, 0, 20);
    cylinder(vase, .122, .122, .004, finish(0x5d483c), 0, .347, 0, 20);
    const petals = [finish(0xe5b4bb), finish(0xe2b97e), finish(0xe8dbc5)];
    for (let i = 0; i < 5; i++) {
      const end = [(i - 2) * .11, .74 + .15 * Math.sin(i * 1.7), (i % 3 - 1) * .090];
      wire(vase, [[(i - 2) * .023, .33, 0], [end[0] * .45, .57, end[2]], end], .011, stem);
      leaf(vase, [end[0] * .53, .49, end[2] + .015], .57, i % 2 ? -.8 : .82, i);
      for (let j = 0; j < 5; j++) {
        const angle = j * 2 * Math.PI / 5;
        bead(vase, end[0] + Math.cos(angle) * .041, end[1] + Math.sin(angle) * .041, end[2],
          .044, .038, .024, petals[i % petals.length]);
      }
      bead(vase, end[0], end[1], end[2] + .027, .027, .027, .017, finish(0xc18244));
    }
  }

  for (const [side, offset, wall] of [[-1,0,walls.music],[1,8,walls.science]]) {
    box(wall,9.55,.10,.09,finish(0xa38a71),0,3.72,.04,.010);
    const glow = side < 0 ? '#f3bb8f' : '#d9b1d7';
    drawn(wall, 9.36, .71, (context, w, h) => {
      const fall = context.createLinearGradient(0, 0, 0, h);
      fall.addColorStop(0, glow + '94');
      fall.addColorStop(.31, glow + '3a');
      fall.addColorStop(1, glow + '00');
      context.fillStyle = fall;
      context.fillRect(0, 0, w, h);
    }, 0, 3.33, .018);
    const diffuser = new T.MeshStandardMaterial({ color: glow, emissive: glow, emissiveIntensity: .83, transparent: true });
    box(wall, 9.37, .033, .018, diffuser, 0, 3.682, .092, .006).castShadow = false;

    for (let i = 0; i < 8; i++) poster(wall, offset + i);
    if(side<0)poster(wall,16);
    const shelfX = side < 0 ? -4.02 : 3.2;
    const shelfY = side < 0 ? -.62 : -.76;
    box(wall, 1.12, .092, .63, trim, shelfX, shelfY, .325, .021);
    flowers(wall, shelfX, shelfY + .047, side < 0 ? 0x738376 : 0xb78d84);
    vine(wall, 4.32, 3.72, .088, 2.87, 2 + side);
    vine(wall, -4.19, 3.71, .088, 1.82, .4 + side);
  }

  furnishRoomObjects({walls,world,half,narrow,group,box,bead,cylinder,wire,finish,drawn,tag,weave,wood,trim});

  // Smaller vines on the end of the hutch connect it to the rest of the room.
  for (const side of [-1, 1]) {
    const pot = group(world, side * (half - .25), 3.25, -1.78);
    cylinder(pot, .17, .132, .23, finish(0xa86f52), 0, .12, 0, 20);
    cylinder(pot, .155, .155, .003, finish(0x5e4c38), 0, .239, 0, 20);
    // The stem clears the top and rolls over the front edge before it drops.
    vine(world, side * (half - .22), 3.41, -1.01, narrow ? .92 : 1.45, side + 1.4,
      [[-side * .03, .081, -.75], [0, .157, -.57], [0, .119, -.22]]);
  }
}
