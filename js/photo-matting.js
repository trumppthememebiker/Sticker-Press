(() => {
 let worker,serial=0;const jobs=new Map();
 function getWorker(){
  if(worker)return worker;
  worker=new Worker('/js/photo-matting-worker.bundle.js',{type:'module'});
  worker.onmessage=({data})=>{const job=jobs.get(data.id);if(!job)return;if(data.progress){job.progress?.(data.progress);return;}jobs.delete(data.id);if(data.error){job.reject(Error(data.error));worker.terminate();worker=null;}else job.resolve(data.blob);};
  worker.onerror=e=>{for(const job of jobs.values())job.reject(Error(e.message||'Photo matting worker failed'));jobs.clear();worker.terminate();worker=null;};
  return worker;
 }
 window.PhotoMatting={async extract(canvas,progress){
  const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));
  const result=await new Promise((resolve,reject)=>{const id=++serial;jobs.set(id,{resolve,reject,progress:p=>{const msg=p.key.startsWith('fetch:')?'Loading photo cutout model…':'Separating foreground from background…';progress?.({message:msg,ratio:p.total?p.current/p.total:null});}});getWorker().postMessage({id,blob,publicPath:new URL('/vendor/matting/',location.href).href});});
  const bitmap=await createImageBitmap(result);const c=document.createElement('canvas');c.width=canvas.width;c.height=canvas.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(bitmap,0,0,c.width,c.height);bitmap.close();const rgba=x.getImageData(0,0,c.width,c.height).data,mask=new Float32Array(c.width*c.height);for(let i=0;i<mask.length;i++)mask[i]=rgba[i*4+3]/255;return mask;
 }};
})();
