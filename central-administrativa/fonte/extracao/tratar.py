# Tratamento completo, na ordem: grafias e datas -> contrato pelo histórico -> duplicados.
import runpy
for s in ['normalizar.py','contrato.py','dedup.py']: print('==',s);runpy.run_path(s)
