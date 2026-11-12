/* Conservative consensus for large foreground losses. Small gaps, facial detail,
 * hair/fur and ordinary edges remain under the high-resolution matting model. */
window.SubjectGuard = {
 reconcile(primary, semantic, w, h) {
  const n=w*h, inside=MaskOps.innerDistance(MaskOps.threshold(semantic,.5),w,h);
  const support=new Float32Array(n),missing=new Uint8Array(n);
  const clamp=x=>Math.min(1,Math.max(0,x));
  for(let i=0;i<n;i++){
   support[i]=clamp((semantic[i]-.7)/.25)*clamp((inside[i]-2)/5);
   missing[i]=support[i]>.5&&primary[i]<.5?1:0;
  }
  const {labels,sizes}=MaskOps.components(missing,w,h);
  const keep=new Uint8Array(sizes.length);
  let restoredPixels=0;
  // Repair only substantial, connected omissions. Tiny disagreements are normal
  // in coarse semantic masks and must not fill real openings or change good edges.
  for(let l=1;l<sizes.length;l++)if(sizes[l]>=n*.008){keep[l]=1;restoredPixels+=sizes[l];}
  if(!restoredPixels)return {mask:primary,restoredPixels:0};
  const patch=new Float32Array(n);
  for(let i=0;i<n;i++)if(keep[labels[i]])patch[i]=1;
  const feather=MaskOps.gaussianBlur(patch,w,h,1.5*Math.max(w,h)/1024);
  const mask=Float32Array.from(primary);
  for(let i=0;i<n;i++)mask[i]=Math.max(mask[i],feather[i]*support[i]);
  return {mask,restoredPixels};
 }
};
