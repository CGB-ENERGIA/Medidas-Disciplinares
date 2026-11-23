// Nome padrão das bases. As abas do cadastro escrevem a mesma base de jeitos diferentes: "Pessoas alocadas" traz o nome por extenso
// (BACABAL, PRES DUTRA) e "Indiretos" / "Pessoas não alocadas" trazem a sigla (BCB, PDS). Tudo é padronizado ao gravar.
const ALIAS = {
  "BCB": "BACABAL", "PDT": "PEDREIRAS", "PDS": "PRESIDENTE DUTRA", "PRES DUTRA": "PRESIDENTE DUTRA",
  "STI": "SANTA INES", "ITM": "ITAPECURU", "BDC": "BARRA DO CORDA",
};
const chave = s => String(s ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toUpperCase();
export const padronizarBase = b => { const k = chave(b); return ALIAS[k] || String(b ?? "").trim(); };
