// The mesh and the caterpillar share this exact surface. "Along" is the
// distance from the stem and "across" runs from the left edge to the right.
export function leafPoint(along,across){
  const edge=Math.abs(across);
  const width=Math.pow(Math.max(.0001,Math.sin(Math.PI*along)),.67)*(1.55-.98*along);
  const fold=.026*width*(1-edge)-.008*width*Math.sin(edge*Math.PI);
  return [
    across*width*.123,
    fold-.065*along*along+.007*Math.sin(9*along+across)*edge,
    .34*along-.033*width*edge
  ];
}

export const caterpillarRadii=[.0135,.0128,.0125,.0118,.0112,.0104,.0091];

export function caterpillarPoint(progress,index,time){
  // Each segment follows the bent blade, even when the head reaches the edge.
  const t=.50+.23*progress-index*.063;
  const pulse=Math.sin(time/158-index*.64)*.007;
  const across=.06+Math.max(0,t-.54)*3.75+pulse;
  const [x,y,z]=leafPoint(t,across);
  return [x,y-caterpillarRadii[index]*.72,z];
}
