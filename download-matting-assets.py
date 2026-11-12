import urllib.request,json,shutil
from pathlib import Path
p=Path('vendor/matting');p.mkdir(exist_ok=True)
out=p/'isnet_fp16.onnx'
if not out.exists():
 print('Downloading ISNet FP16 from official IMG.LY model repository',flush=True)
 urllib.request.urlretrieve('https://huggingface.co/imgly/isnet-general-onnx/resolve/main/onnx/model_fp16.onnx',out)
print('Model bytes',out.stat().st_size,flush=True)
resources={}
for key,file,mime in [('/models/isnet_fp16','isnet_fp16.onnx','application/octet-stream'),('/onnxruntime-web/ort-wasm-simd-threaded.wasm','ort-wasm-simd-threaded.wasm','application/wasm'),('/onnxruntime-web/ort-wasm-simd-threaded.mjs','ort-wasm-simd-threaded.mjs','text/javascript')]:
 dest=p/file
 if not dest.exists():shutil.copyfile(Path('node_modules/onnxruntime-web/dist')/file,dest)
 size=dest.stat().st_size
 resources[key]={'size':size,'mime':mime,'chunks':[{'name':file,'offsets':[0,size]}]}
(p/'resources.json').write_text(json.dumps(resources),encoding='utf-8')
shutil.copyfile('node_modules/@imgly/background-removal/LICENSE.md','vendor/IMG-LY-LICENSE.md')
urllib.request.urlretrieve('https://raw.githubusercontent.com/microsoft/onnxruntime/main/LICENSE','vendor/ONNX-RUNTIME-LICENSE')
