/* ===== Funciona sem internet: Excel (gravação) e print local ===== */
const XLSX_LOCAL=(function(){
  const crcT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
  const crc=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=crcT[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0};
  const enc=s=>new TextEncoder().encode(s);
  function zip(files){const parts=[],cen=[];let off=0;
    for(const [nome,txt] of files){const d=enc(txt),n=enc(nome),c=crc(d),h=new DataView(new ArrayBuffer(30));
      h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint32(14,c,true);h.setUint32(18,d.length,true);h.setUint32(22,d.length,true);h.setUint16(26,n.length,true);
      parts.push(new Uint8Array(h.buffer),n,d);
      const ce=new DataView(new ArrayBuffer(46));ce.setUint32(0,0x02014b50,true);ce.setUint16(4,20,true);ce.setUint16(6,20,true);ce.setUint16(8,0x0800,true);ce.setUint32(16,c,true);ce.setUint32(20,d.length,true);ce.setUint32(24,d.length,true);ce.setUint16(28,n.length,true);ce.setUint32(42,off,true);
      cen.push(new Uint8Array(ce.buffer),n);off+=30+n.length+d.length}
    const cs=cen.reduce((s,a)=>s+a.length,0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
    const all=[...parts,...cen,new Uint8Array(e.buffer)],out=new Uint8Array(all.reduce((s,a)=>s+a.length,0));let p=0;for(const a of all){out.set(a,p);p+=a.length}return out}
  const x=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
  const col=i=>{let s='';i++;while(i){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s};
  function sheetXml(rows){const hs=[];rows.forEach(r=>Object.keys(r).forEach(k=>{if(!hs.includes(k))hs.push(k)}));
    const cel=(v,r,c)=>{const ref=col(c)+(r+1);if(v==null||v==='')return '';if(typeof v==='number'&&isFinite(v))return '<c r="'+ref+'"><v>'+v+'</v></c>';return '<c r="'+ref+'" t="inlineStr"><is><t xml:space="preserve">'+x(v)+'</t></is></c>'};
    let xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
    xml+='<row r="1">'+hs.map((h,c)=>cel(h,0,c)).join('')+'</row>';rows.forEach((r,i)=>{xml+='<row r="'+(i+2)+'">'+hs.map((h,c)=>cel(r[h],i+1,c)).join('')+'</row>'});
    return xml+'</sheetData></worksheet>'}
  return {local:true,utils:{json_to_sheet:rows=>({rows}),book_new:()=>({abas:[]}),book_append_sheet:(wb,ws,nome)=>{wb.abas.push([String(nome||'Planilha').slice(0,31).replace(/[\\/?*\[\]:]/g,' '),ws.rows])},
      sheet_to_json:()=>{throw new Error('Para ler planilhas é preciso internet (biblioteca de Excel).')}},
    read:()=>{throw new Error('Para ler planilhas do Excel é preciso estar com internet. Conecte e tente de novo.')},
    write:(wb)=>{const ab=wb.abas.length?wb.abas:[['Planilha',[]]];
      const f=[['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+ab.map((a,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>'],
        ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
        ['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+ab.map((a,i)=>'<sheet name="'+x(a[0])+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>'],
        ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+ab.map((a,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'</Relationships>']];
      ab.forEach((a,i)=>f.push(['xl/worksheets/sheet'+(i+1)+'.xml',sheetXml(a[1])]));return zip(f)}}})();
(function(){const orig=lib;lib=function(url){const p=orig(url);if(url!==XLSX_URL)return p;return p.catch(()=>{if(!window.XLSX)window.XLSX=XLSX_LOCAL})}})();
