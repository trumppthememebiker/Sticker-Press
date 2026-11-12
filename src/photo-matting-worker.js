import { removeBackground } from '@imgly/background-removal';
self.onmessage = async ({data}) => {
 const {id,blob,publicPath} = data;
 try {
  const result = await removeBackground(blob,{model:'isnet_fp16',device:'cpu',publicPath,output:{format:'image/png',quality:1},progress:(key,current,total)=>self.postMessage({id,progress:{key,current,total}})});
  self.postMessage({id,blob:result});
 }catch(error){self.postMessage({id,error:error.message||String(error)});}
};
