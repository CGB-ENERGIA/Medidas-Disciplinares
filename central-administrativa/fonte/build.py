import json
s=open('app.html',encoding='utf-8').read()
D=json.load(open('dados/dados.json')); D['cct']=json.load(open('dados/cct.json')); D['metas']=json.load(open('dados/metas.json'))
D['alim']=json.load(open('dados/alim.json')); D['metasRef']=json.load(open('dados/metas_ref.json')); D['pat']=json.load(open('dados/pat.json')); D['fc']=json.load(open('dados/fc.json')); D['ti']=json.load(open('dados/ti.json')); D['loc']=json.load(open('dados/loc.json'))
js=json.dumps(D,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
s=s.replace('%%CSS%%',open('dados/model.css').read()).replace('%%LOGO%%',open('dados/logo.txt').read()).replace('%%DATA%%',js)
s=s.replace('%%H2I%%',open('dados/html2img.js',encoding='utf-8').read())
s=s.replace('%%PDFJSW%%',open('dados/pdfjs_worker.js',encoding='utf-8').read()).replace('%%PDFJSM%%',open('dados/pdfjs_main.js',encoding='utf-8').read())
import base64
s=s.replace('%%FCBANNER%%',base64.b64encode(open('fc_banner.jpg','rb').read()).decode())
open('central-hospedagem.html','w',encoding='utf-8').write(s);print(len(s))
