import * as T from './vendor/three/three.module.min.js';
import { furnishRoomObjects } from './room-objects.js?v=10';
import { buildRoomShell } from './room-shell.js?v=16';
import { posterSets } from './room-posters.js?v=3';

const leafColors = [0x72925d, 0x4a7147, 0x538254, 0x688254, 0x8a9b66];

function ivyGeometry() {
  const outline = new T.CatmullRomCurve3([
    [0,.022],[-.105,-.012],[-.143,.056],[-.162,.133],[-.201,.221],[-.099,.215],
    [-.073,.289],[.009,.424],[.074,.274],[.103,.217],[.198,.228],[.157,.130],
    [.132,.043],[.094,-.005],
  ].map(([x,y])=>new T.Vector3(x,y,0)),true);
  const points=outline.getPoints(30).slice(0,-1);
  const positions=[0,.153,.053],uv=[.5,.39],indices=[];
  for(const radius of [.38,.73,1]){
    for(const point of points){
      const x=point.x*radius, y=.153+(point.y-.153)*radius;
      const z=.055*(1-radius**2)+.017*Math.sin(y*16+x*12)-.043*y;
      positions.push(x,y,z);uv.push(.5+x/.43,(y+.02)/.45);
    }
  }
  for(let i=0;i<points.length;i++){
    const j=(i+1)%points.length;
    indices.push(0,j+1,i+1);
    for(const ring of [0,1]){
      const a=1+ring*points.length+i,b=1+ring*points.length+j;
      indices.push(a,b,b+points.length,a,b+points.length,a+points.length);
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  return geometry;
}
const ivyLeaf=ivyGeometry();

export function decorateRoom(world, { desk, narrow, half, group, box, bead, cylinder, wire, finish, photo, tag, detail, drawn, weave, wood, trim, floorMat, night }) {
  const {walls,coves,readingBulb}=buildRoomShell(world,{group,box,bead,cylinder,wire,finish,photo,drawn,weave,wood,trim,floorMat,night,tag,detail});
  const prints = new Map();
  const paper = new T.MeshStandardMaterial({ color: 0xe8dfce, roughness: .97, side: T.BackSide });
  const stem = finish(0x5e6e43);
  const leafCanvas=document.createElement('canvas');
  leafCanvas.width=leafCanvas.height=160;
  const inkLeaf=leafCanvas.getContext('2d');
  const leafShade=inkLeaf.createLinearGradient(0,0,160,135);
  leafShade.addColorStop(0,'#9c9e87');
  leafShade.addColorStop(.48,'#e6e9d2');
  leafShade.addColorStop(1,'#bfc6a6');
  inkLeaf.fillStyle=leafShade;inkLeaf.fillRect(0,0,160,160);
  inkLeaf.strokeStyle='#f9f8dc90';inkLeaf.lineWidth=1.4;
  inkLeaf.beginPath();inkLeaf.moveTo(80,153);inkLeaf.quadraticCurveTo(72,75,84,7);inkLeaf.stroke();
  for(const sign of [-1,1])for(let i=0;i<5;i++){
    const y=139-i*20, span=64-i*9;
    inkLeaf.beginPath();inkLeaf.moveTo(79,y);
    inkLeaf.quadraticCurveTo(79+sign*span*.74,y-12,79+sign*span,y-33);inkLeaf.stroke();
    inkLeaf.beginPath();inkLeaf.moveTo(79+sign*span*.50,y-14);
    inkLeaf.quadraticCurveTo(79+sign*span*.64,y-31,79+sign*span*.56,y-40);inkLeaf.stroke();
  }
  const leafGrain=new T.CanvasTexture(leafCanvas);leafGrain.colorSpace=T.SRGBColorSpace;
  const foliage = leafColors.map(color => new T.MeshStandardMaterial({
    color,map:leafGrain,roughness:.57,side:T.DoubleSide,
  }));

  function poster([id, wall, aspect, x, y, w, tilt], index, collection) {
    const { roots, ink, cutout, rows } = collection;
    const height = w / aspect;
    const frame = tag(group(walls[wall], x, y, .071), 'room-' + id, [0, 0, 0], w, height);
    frame.userData.roomPoster = true;
    roots.push(frame);
    frame.rotation.z = tilt;
    const plane = new T.PlaneGeometry(w, height);
    const uv = plane.attributes.uv;
    const column = index % 7, row = Math.floor(index / 7);
    // Avoid mip-map bleeding from the next print along the atlas edge.
    const pad = .02;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (column + pad + uv.getX(i) * (1 - 2 * pad)) / 7,
        (rows - 1 - row + pad + uv.getY(i) * (1 - 2 * pad)) / rows);
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

  for (const [name, artworks] of Object.entries(posterSets)) {
    const atlas = new T.Texture();
    atlas.colorSpace = T.SRGBColorSpace;
    atlas.anisotropy = 4;
    const ink = new T.MeshStandardMaterial({ map: atlas, roughness: .93, alphaTest: .28 });
    const cutout = ink.clone();
    cutout.side = T.DoubleSide;
    const collection = { roots: [], atlas, ink, cutout, rows: Math.ceil(artworks.length / 7) };
    prints.set(name, collection);
    artworks.forEach((art, index) => poster(art, index, collection));
  }
  function showPosters(name) {
    const current = prints.get(name);
    if (!current.requested) {
      current.requested = true;
      const loaded = photo('/assets/furniture/room-atlas-' + name + '.webp?v=3', () => {
        current.atlas.image = loaded.image;
        current.atlas.needsUpdate = true;
      });
    }
    for (const [key, collection] of prints)
      for (const root of collection.roots) root.visible = key === name;
  }
  for (const [side, wall] of [[-1,walls.music],[1,walls.science]]) {
    const shelfX = side < 0 ? -4.02 : 3.2;
    const shelfY = side < 0 ? -.62 : -.76;
    box(wall, 1.12, .092, .63, trim, shelfX, shelfY, .325, .021);
    flowers(wall, shelfX, shelfY + .047, side < 0 ? 0x738376 : 0xb78d84);
    vine(wall, side<0 ? 5.66 : 5.93, 6.45, .125, 5.34, 2 + side);
    vine(wall, side<0 ? -5.85 : -5.89, 6.45, .125, 4.15, .4 + side);
  }

  furnishRoomObjects({walls,world:desk,half,narrow,group,box,bead,cylinder,wire,finish,drawn,tag,detail,weave,wood,trim});

  // Smaller vines on the end of the hutch connect it to the rest of the room.
  for (const side of [-1, 1]) {
    const pot = group(desk, side * (half - .25), 3.25, -1.78);
    cylinder(pot, .17, .132, .23, finish(0xa86f52), 0, .12, 0, 20);
    cylinder(pot, .155, .155, .003, finish(0x5e4c38), 0, .239, 0, 20);
    // The stem clears the top and rolls over the front edge before it drops.
    vine(desk, side * (half - .22), 3.41, -1.01, narrow ? .92 : 1.45, side + 1.4,
      [[-side * .03, .081, -.75], [0, .157, -.57], [0, .119, -.22]]);
  }
  return {coves,walls,showPosters,readingBulb};
}
