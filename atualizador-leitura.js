/* Atualizador do Boletim — leitura e agregação da base (VENDAS, AA, projeções, curva, CSV/XLSX).
 * Incorporado à instância do atualizador em _wait() via _mixin(). */
window.AtualizadorLeitura = class {
  /** AOA de uma aba. Aba vinda de CSV já carrega o AOA cru — evita o round-trip por planilha. */
  _aoa(X, ws) {
    if (!ws) return [];
    this._sepAtual = ws.__sep || ';';
    this._decAtual = ws.__dec || null;
    if (ws.__aoa) return ws.__aoa;
    return X.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
  }

  /** Lê uma aba transacional (DIA | BU | MARCA | SKU | CANAL | CLIENTE | valores). */
  /** S, G e VIT NQ são as três sublinhas de SG nos CSVs da extração. */
  get _ALIAS_BU() { return { 'S': 'SG', 'G': 'SG', 'V': 'SG', 'C': 'SG', 'VIT NQ': 'SG', 'VITNQ': 'SG', 'SMART': 'SG', 'GEN': 'SG' }; }

  /**
   * SG chega quebrada em três BUs; aqui ela é consolidada e as sublinhas viram linhas derivadas.
   * Cada extração escreve as sublinhas com um código próprio: a planilha usa nome longo,
   * os CSVs de orçamento e projeção usam S, G e VIT NQ. Os três apontam para a mesma sub-BU.
   */
  get _ALIAS_SUB() {
    return {
      'S': 'SG - SMART (EX-VIT)', 'SMART': 'SG - SMART (EX-VIT)', 'SG - SMART': 'SG - SMART (EX-VIT)',
      'SG - SMART (EX-VIT)': 'SG - SMART (EX-VIT)',
      'G': 'SG - GENÉRICOS', 'GEN': 'SG - GENÉRICOS', 'GENERICOS': 'SG - GENÉRICOS',
      'GENÉRICOS': 'SG - GENÉRICOS', 'SG - GENERICOS': 'SG - GENÉRICOS', 'SG - GENÉRICOS': 'SG - GENÉRICOS',
      'C': 'SG - COBERTURA', 'SG - COBERTURA': 'SG - COBERTURA',
      'V': 'VIT NEO QUÍMICA', 'VIT NQ': 'VIT NEO QUÍMICA', 'VITNQ': 'VIT NEO QUÍMICA', 'VIT': 'VIT NEO QUÍMICA',
      'VIT NEO QUIMICA': 'VIT NEO QUÍMICA', 'VIT NEO QUÍMICA': 'VIT NEO QUÍMICA'
    };
  }

  /** BU no mesmo código que a curva usa: sublinhas de SG colapsam em SG. */
  _buCanon(b) {
    const t = String(b == null ? '' : b).trim().toUpperCase();
    const a = this._ALIAS_BU[t] || t;
    return this._ALIAS_SUB[a] ? 'SG' : a;
  }

  /**
   * Colunas de valor dos seis arquivos diários. Todas vêm em reais, com "." de decimal —
   * o cabeçalho é prova suficiente e dispensa a heurística de separador.
   */
  get _COLS_VALOR() {
    return /^(VALOR_REAL|VALOR_REAL_AA|VALOR_PROJETADO_ATUAL|VALOR_PROJETADO_REAL|ORCAMENTO|OR\u00c7AMENTO|FORECAST|PROJ)$/;
  }

  _decDoCab(cab) {
    const h = (cab || []).map(c => String(c == null ? '' : c).trim().toUpperCase().replace(/\s+/g, '_'));
    return h.some(n => this._COLS_VALOR.test(n)) ? 'dot' : null;
  }

  /**
   * Venda somada por dia do mês, nas três aberturas que a curva pode pedir:
   * BU × canal, BU e total. Valores já saem em R$ mi (vêm divididos de _lerTrans).
   */
  _porDia(arr) {
    const m = {};
    (arr || []).forEach(v => {
      if (!v.data) return;
      const dt = this._dataDe(v.data); if (!dt) return;
      const d = dt.getUTCDate();
      const c0 = String(v.canal || 'VD').toUpperCase();
      const bu = this._buCanon(v.bu), can = c0.indexOf('VD') === 0 ? 'VD' : c0.indexOf('VI') === 0 ? 'VI' : c0;
      // as quatro combinações de BU e CANAL, que na curva são colunas opcionais
      [bu + '|' + can + '|' + d, bu + '||' + d, '|' + can + '|' + d, '||' + d]
        .forEach(k => { m[k] = (m[k] || 0) + (v.real || 0); });
    });
    return m;
  }

  _lerTrans(X, ws, divisor) {
    const g = this._aoa(X, ws);
    if (!g.length) return [];
    const head = g[0].map(c => String(c == null ? '' : c).trim().toUpperCase().replace(/\s+/g, '_'));
    const col = (...alt) => { for (const a of alt) { const i = head.indexOf(a); if (i >= 0) return i; } return -1; };
    const iData = col('DATA', 'DIA'), iBU = col('BU'), iMar = col('MARCA'), iSku = col('SKU'),
      iCan = col('CANAL'), iCli = col('CLIENTE', 'REDE'), iReal = col('VALOR_REAL', 'VALOR_REAL_AA', 'REAL'),
      iIni = col('VALOR_PROJETADO_INICIAL', 'PROJ_INICIAL', 'PROJETADO_INICIAL', 'VALOR_PROJETADO_REAL', 'VALOR_PROJETADO_RATEADO'),
      iPro = col('VALOR_PROJETADO_ATUAL', 'PROJ_ATUAL', 'PROJETADO_ATUAL'),
      iOrc = col('ORCAMENTO', 'ORÇAMENTO', 'ORC'),
      iFcst = col('FORECAST', 'FCST', 'ORCAMENTO_REPROJETADO');
    this._divisor = divisor;
    const v = (r, i) => { const x = i < 0 ? null : this._num(r[i]); return x == null ? 0 : x / divisor; };
    const dim = x => { const t = String(x == null ? '' : x).trim().toUpperCase(); return /^(NULL|NULO|N\/A|NA|#N\/D|-)$/.test(t) ? '' : t; };
    const out = [];
    g.slice(1).forEach(r => {
      const bu = iBU < 0 ? '' : dim(r[iBU]); if (!bu) return;
      out.push({
        data: iData < 0 ? 0 : this._serial(r[iData]), bu,
        marca: dim(iMar < 0 ? '' : r[iMar]) || 'NÃO INFORMADA',
        sku: iSku < 0 ? '' : String(r[iSku] || '').trim(),
        canal: dim(iCan < 0 ? '' : r[iCan]) || 'VD',
        cliente: dim(iCli < 0 ? '' : r[iCli]) || 'OUTROS',
        real: v(r, iReal), projIni: v(r, iIni), proj: v(r, iPro), orc: v(r, iOrc), forecast: v(r, iFcst)
      });
    });
    return out;
  }

  /**
   * Projeção inicial e projeção atual em abas separadas (formato atual) ou numa aba
   * "Projeções" única com as duas colunas (formato antigo). Devolve um plano só, casando
   * as linhas por bu|marca|sku|canal|cliente.
   */
  _abasProjecao(X, wb, divisor) {
    const cand = wb.SheetNames.filter(n => /proje/i.test(n) && !/resumo|m[ée]todo/i.test(n));
    const nIni = cand.find(n => /ini[o]?cial|ratead/i.test(n));
    const nAtu = cand.find(n => /atual|vigente/i.test(n));
    if (!nIni && !nAtu) {
      const unica = cand[0];
      return { nomes: unica ? [unica] : [], linhas: unica ? this._lerTrans(X, wb.Sheets[unica], divisor) : [] };
    }
    const chave = o => [o.bu, o.marca, o.sku, o.canal, o.cliente].join('|');
    const mapa = {}, ordem = [];
    const juntar = (nome, campo) => {
      if (!nome) return;
      this._lerTrans(X, wb.Sheets[nome], divisor).forEach(o => {
        const k = chave(o);
        if (!mapa[k]) { mapa[k] = Object.assign({}, o, { projIni: 0, proj: 0 }); ordem.push(k); }
        // numa aba dedicada o valor pode vir na coluna específica ou na genérica
        const v = o[campo] || o.proj || o.projIni || o.real || 0;
        // a mesma chave aparece uma vez por dia (DATA) — soma, não sobrescreve
        mapa[k][campo] += v;
      });
    };
    juntar(nIni, 'projIni');
    juntar(nAtu, 'proj');
    return { nomes: [nIni, nAtu].filter(Boolean), linhas: ordem.map(k => mapa[k]) };
  }

  /** Aba Curva (venda por dia corrido) -> acumulados do gráfico de ritmo do mês. */
  _lerCurva(X, wb, divisor, vendas, vendasAA) {
    // cada carga recomeça: curva de outra base não pode sobreviver a uma base nova
    this._curva = null; this._curvaBU = null; this._curvaBUCanal = null;
    this._semAAporBU = false; this._baseCarregada = true;
    const nomeCurva = wb.SheetNames.find(n => /curva|ritmo/i.test(n));
    if (nomeCurva) {
      const wsCv = wb.Sheets[nomeCurva];
      const bruto = this._aoa(X, wsCv);
      // CSV da extração vem em reais; curva preenchida à mão no .xlsx já vem em R$ mi
      const dv = (wsCv && wsCv.__aoa) ? (divisor || this._divisor || 1) : 1;
      const q = v => { const x = this._num(v); return x == null ? null : x / dv; };
      const dimCv = x => { const t = String(x == null ? '' : x).trim().toUpperCase(); return /^(NULL|NULO|N\/A|NA|#N\/D|-)$/.test(t) ? '' : t; };
      const buCv = b => { const t = dimCv(b); return this._ALIAS_BU[t] || t; };
      const cab = (bruto[0] || []).map(c => String(c == null ? '' : c).trim().toUpperCase());
      const ci = (...alt) => { for (const a of alt) { const i = cab.indexOf(a); if (i >= 0) return i; } return -1; };
      const iD = Math.max(0, ci('DIA', 'DATA')), iBU = ci('BU'), iCanal = ci('CANAL'),
        iAA = ci('REALAA', 'REAL_AA', 'REAL AA', 'AA'), iR = ci('REAL', 'REALIZADO'), iP = ci('PROJ', 'PROJEÇÃO', 'PROJECAO');
      const cP = iP < 0 ? 3 : iP;
      // CURVA traz só DIA;BU;CANAL;PROJ — realizado e ano anterior saem das vendas por dia
      // coluna presente mas toda vazia ("null") conta como ausente
      const vazia = i => i < 0 || bruto.slice(1).every(r => q(r[i]) == null);
      const semR = vazia(iR), semAA = vazia(iAA);
      const mReal = semR ? this._porDia(vendas) : null;
      const mAA = semAA ? this._porDia(vendasAA) : null;
      const doMapa = (m, bu, canal, d) => {
        if (!m) return null;
        const k = (iBU >= 0 ? bu || '' : '') + '|' + (iCanal >= 0 ? canal || '' : '') + '|' + d;
        return m[k] == null ? null : m[k];
      };
      const cr = bruto.slice(1);
      // DIA pode vir como dia do mês (1..31) ou como data completa (2026-09-01, 01/09/2026, serial do Excel)
      // mês de referência: último dia de venda; sem venda, a data de corte digitada
      let anoRef = 0, mesRef = 0;
      const ultV = (vendas || []).reduce((m, v) => Math.max(m, v.data || 0), 0);
      if (ultV) { const dt = this._dataDe(ultV); anoRef = dt.getUTCFullYear(); mesRef = dt.getUTCMonth() + 1; }
      else { const pc = (this._v('inpCorte') || '').split('/'); if (pc.length >= 3) { anoRef = Number(pc[2]); if (anoRef < 100) anoRef += 2000; mesRef = Number(pc[1]); } }
      const diasNoMes = (anoRef && mesRef) ? new Date(Date.UTC(anoRef, mesRef, 0)).getUTCDate() : 31;
      const diaDe = x => {
        const t = String(x == null ? '' : x).trim();
        const n = /^\d{1,2}$/.test(t) ? Number(t) : 0;
        if (n) return n <= diasNoMes ? n : 0;
        const s = this._serial(x); if (!s) return 0;
        const dt = this._dataDe(s);
        // data de outro mês não entra na quebra diária deste
        if (mesRef && (dt.getUTCMonth() + 1 !== mesRef || dt.getUTCFullYear() !== anoRef)) return 0;
        return dt.getUTCDate();
      };
      const linhas = cr.map(r => {
        const d = diaDe(r[iD]);
        const bu = iBU < 0 ? null : (buCv(r[iBU]) || null);
        const cv0 = iCanal < 0 ? '' : dimCv(r[iCanal]);
        const canal = iCanal < 0 ? null : ((cv0.indexOf('VD') === 0 ? 'VD' : cv0.indexOf('VI') === 0 ? 'VI' : cv0) || null);
        return {
          d, bu, canal,
          aa: !semAA ? q(r[iAA]) : doMapa(mAA, bu, canal, d),
          real: !semR ? q(r[iR]) : doMapa(mReal, bu, canal, d),
          proj: q(r[cP])
        };
      }).filter(x => x.d && x.d <= diasNoMes);
      // A curva dá o formato dos dias; o total do mês é o da projeção. Os dias projetados de cada
      // BU × canal são escalados para que o acumulado do último dia feche com o projetado do quadro.
      const iProj = this.cols.indexOf('proj');
      const alvo = (bu, canal) => {
        const r = (this.fatos || []).find(f => f[0] === (bu || 'TOTAL') && f[1] === 'TOTAL' && f[2] === (canal || 'TOTAL'));
        return r && r[iProj] != null ? r[iProj] : null;
      };
      const grupos = {};
      linhas.forEach(x => { const k = (x.bu || '') + '|' + (x.canal || ''); (grupos[k] = grupos[k] || []).push(x); });
      Object.keys(grupos).forEach(k => {
        const g = grupos[k], [bu, canal] = k.split('|');
        const meta = alvo(bu || null, canal || null); if (meta == null) return;
        const ultR = g.reduce((m, x) => x.real != null ? Math.max(m, x.d) : m, 0);
        const feito = g.filter(x => x.d <= ultR).reduce((a, x) => a + (x.real || 0), 0);
        const resto = g.filter(x => x.d > ultR);
        const somaP = resto.reduce((a, x) => a + (x.proj || 0), 0);
        const falta = meta - feito;
        if (somaP > 0) resto.forEach(x => { x.proj = (x.proj || 0) * falta / somaP; });
        else if (resto.length) resto.forEach(x => { x.proj = falta / resto.length; });
      });
      // com coluna CANAL, guarda também a curva de cada BU por canal
      this._curvaBUCanal = null;
      if (iBU >= 0 && iCanal >= 0 && linhas.some(x => x.bu && x.canal)) {
        const dd0 = [...new Set(linhas.map(x => x.d))].sort((a, b) => a - b);
        const acum0 = arr => { let t = 0; return arr.map(v => Math.round((t += v) * 10) / 10); };
        const porBC = {};
        [...new Set(linhas.filter(x => x.bu && x.canal).map(x => x.bu + '|' + x.canal))].forEach(k => {
          const [bu, canal] = k.split('|');
          const m = {}; linhas.filter(x => x.bu === bu && x.canal === canal).forEach(x => m[x.d] = x);
          const serie = dd0.map(d => m[d] || {});
          const comR = serie.filter(x => x.real != null);
          const iAt = comR.length ? serie.lastIndexOf(comR[comR.length - 1]) : -1;
          porBC[bu] = porBC[bu] || {};
          porBC[bu][canal] = {
            diasMes: dd0.length, diaAtual: iAt + 1,
            aa: acum0(serie.map(x => x.aa || 0)),
            real: acum0(serie.slice(0, iAt + 1).map(x => x.real || 0)),
            proj: (() => { let t = 0; serie.slice(0, iAt + 1).forEach(x => t += x.real || 0);
              return serie.slice(iAt + 1).map(x => Math.round((t += (x.proj || 0)) * 10) / 10); })()
          };
        });
        this._curvaBUCanal = porBC;
        // consolida os canais numa linha por BU e dia
        const chave = {}, ordem = [];
        linhas.forEach(x => {
          const k = x.bu + '|' + x.d;
          if (!chave[k]) { chave[k] = { d: x.d, bu: x.bu, canal: null, aa: null, real: null, proj: null }; ordem.push(chave[k]); }
          ['aa', 'real', 'proj'].forEach(campo => {
            if (x[campo] != null) chave[k][campo] = Math.round(((chave[k][campo] || 0) + x[campo]) * 100) / 100;
          });
        });
        linhas.length = 0; ordem.forEach(o => linhas.push(o));
      }
      const acum = arr => { let t = 0; return arr.map(v => Math.round((t += v) * 10) / 10); };
      // aba com coluna BU: guarda uma curva por BU e consolida o total
      if (iBU >= 0 && linhas.some(x => x.bu)) {
        const bus = [...new Set(linhas.filter(x => x.bu).map(x => x.bu))];
        const dd = [...new Set(linhas.map(x => x.d))].sort((a, b) => a - b);
        const porBU = {};
        bus.forEach(b => {
          const m = {}; linhas.filter(x => x.bu === b).forEach(x => m[x.d] = x);
          const serie = dd.map(d => m[d] || {});
          const comReal = serie.filter(x => x.real != null);
          const diaAtual = comReal.length ? dd[serie.indexOf(comReal[comReal.length - 1])] : 0;
          const idxAtual = dd.indexOf(diaAtual);
          porBU[b] = {
            diasMes: dd.length, diaAtual,
            aa: acum(serie.map(x => x.aa || 0)),
            real: acum(serie.slice(0, idxAtual + 1).map(x => x.real || 0)),
            proj: (() => { let t = 0; serie.slice(0, idxAtual + 1).forEach(x => t += x.real || 0);
              return serie.slice(idxAtual + 1).map(x => Math.round((t += (x.proj || 0)) * 10) / 10); })()
          };
        });
        this._curvaBU = porBU;
        this._semAAporBU = !bus.some(b => (porBU[b].aa || []).some(v => v));
        const tem = campo => dd.map(d => linhas.some(x => x.d === d && x[campo] != null));
        const soma = campo => dd.map(d => linhas.filter(x => x.d === d).reduce((a, x) => a + (x[campo] || 0), 0));
        const sAA = soma('aa'), sR = soma('real'), sP = soma('proj'), tR = tem('real'), tP = tem('proj');
        linhas.length = 0;
        dd.forEach((d, i) => linhas.push({ d, bu: null, aa: sAA[i], real: tR[i] ? sR[i] : null, proj: tP[i] ? sP[i] : null }));
      } else { this._curvaBU = null; this._semAAporBU = false; }
      const dias = linhas.sort((a, b) => a.d - b.d);
      const comReal = dias.filter(x => x.real != null);
      if (dias.length && comReal.length) {
        const diaAtual = comReal[comReal.length - 1].d;
        const p = (this._v('inpCorte') || '').split('/');
        this._curva = {
          ano: anoRef || (p[2] ? (String(p[2]).length === 2 ? 2000 + Number(p[2]) : Number(p[2])) : new Date().getFullYear()),
          mes: mesRef || (p[1] ? Number(p[1]) : new Date().getMonth() + 1),
          diasMes: dias.length,
          diaAtual,
          real: acum(dias.filter(x => x.d <= diaAtual).map(x => x.real || 0)),
          proj: (() => { let t = 0; dias.filter(x => x.d <= diaAtual).forEach(x => t += x.real || 0);
            return dias.filter(x => x.d > diaAtual).map(x => Math.round((t += (x.proj || 0)) * 10) / 10); })(),
          aa: acum(dias.map(x => x.aa || 0))
        };
      }
    }
  }

  /** Abas de apoio: histórico mensal, método da projeção e de/para de cliente. */
  _lerExtras(X, wb) {
    const ler = (re, mapear) => {
      const nome = wb.SheetNames.find(n => re.test(n));
      if (!nome) return null;
      const br = this._aoa(X, wb.Sheets[nome]);
      const cab = (br[0] || []).map(c => String(c == null ? '' : c).trim().toUpperCase());
      const ci = (...alt) => { for (const a of alt) { const i = cab.indexOf(a); if (i >= 0) return i; } return -1; };
      const out = br.slice(1).map(r => mapear(r, ci)).filter(Boolean);
      return out.length ? out : null;
    };
    this._historicoMensal = ler(/hist[oó]rico\s*mensal|mensal/i, (r, ci) => {
      const ano = this._num(r[ci('ANO')]), mes = this._num(r[ci('MES', 'MÊS')]), v = this._num(r[ci('VALOR', 'PX')]);
      if (!ano || !mes || v == null) return null;
      return [ano, mes, String(r[ci('BU')] || '').trim().toUpperCase() || 'TOTAL',
        String(r[ci('CANAL')] || '').trim().toUpperCase() || 'TOTAL', Math.round(v / (this._divisor || 1e6) * 10) / 10];
    });
    this._resumoProj = ler(/resumo\s*proje/i, (r, ci) => {
      const bu = String(r[ci('BU')] || '').trim().toUpperCase();
      if (!bu) return null;
      return { bu, metodo: String(r[ci('METODO', 'MÉTODO')] || '').trim(), dados: String(r[ci('DADOS')] || '').trim(),
        ajuste: String(r[ci('AJUSTE')] || '').trim(), reuniao: String(r[ci('REUNIAO', 'REUNIÃO')] || '').trim() };
    });
    this._clientes = ler(/^clientes?$/i, (r, ci) => {
      const cli = String(r[ci('CLIENTE')] || '').trim().toUpperCase();
      if (!cli) return null;
      return { cliente: cli, rede: String(r[ci('REDE')] || '').trim().toUpperCase(),
        grupo: String(r[ci('GRUPO')] || '').trim(), uf: String(r[ci('UF')] || '').trim().toUpperCase() };
    });
  }

  /** Base transacional -> grade bu × marca × rede que o e-mail e a apresentação consomem. */
  _agregar(vendas, vendasAA, plano, M, topN, cota) {
    // MTD do ano anterior: até o mesmo dia/mês do corte, um ano antes (quando a Meta não traz dataCorteAA)
    let corteAA = this._serial(M.dataCorteAA);
    if (!corteAA) {
      const p = String(M.dataCorte || '').split('/');
      if (p.length >= 3) { let y = Number(p[2]); if (y < 100) y += 2000; corteAA = this._serial(p[0] + '/' + p[1] + '/' + (y - 1)); }
    }
    // SG chega na planilha quebrada em três BUs; aqui ela é consolidada e as sublinhas viram linhas derivadas
    // Cada extração escreve as sublinhas com um código próprio: a planilha usa nome longo,
    // os CSVs de orçamento e projeção usam S, G e VIT NQ. Os três apontam para a mesma sub-BU.
    const ALIAS_SUB = this._ALIAS_SUB;
    const canonSub = b => ALIAS_SUB[b] || b;
    // SG - Cobertura (C) é toda VI e toda do cliente Independente, qualquer que seja o canal/cliente da origem
    const norm = arr => arr.map(v => { const sub = canonSub(v.bu); const o = Object.assign({}, v, { sub: sub, bu: ALIAS_SUB[v.bu] ? 'SG' : v.bu });
      if (sub === 'SG - COBERTURA') { o.canal = 'VI'; o.cliente = 'INDEPENDENTE'; } return o; });
    vendas = norm(vendas); vendasAA = norm(vendasAA); plano = norm(plano || []); cota = norm(cota || []);
    const z = () => ({ realAA: 0, realAAmtd: 0, real: 0, proj: 0, projIni: 0, orc: 0, forecast: 0, projVD: 0, projVI: 0 });
    const mapa = {}, pega = k => (mapa[k] = mapa[k] || z());
    // canal normalizado: "VD - DISTRIBUIDOR" e "VD" caem no mesmo VD
    const cn = c => { const t = String(c || ''); return t.indexOf('VD') === 0 ? 'VD' : t.indexOf('VI') === 0 ? 'VI' : t; };
    const chaves = v => { const c = cn(v.canal); return ['T', 'BU|' + v.bu, 'SUB|' + v.sub, 'MARCA|' + v.bu + '|' + v.marca, 'CANAL|' + c,
      'CANAL|' + v.bu + '|' + c, 'CLI|' + v.cliente, 'CLI|' + v.bu + '|' + v.cliente,
      // grãos de abertura das tabelas: marca × cliente e marca × canal
      'MC|' + v.bu + '|' + v.marca + '|' + v.cliente, 'MC|' + v.bu + '|' + v.marca + '|' + c,
      // grão fino para os filtros do simulador: marca × cliente × canal
      'G|' + v.bu + '\u0001' + v.marca + '\u0001' + v.cliente + '\u0001' + c]; };
    vendas.forEach(v => chaves(v).forEach(k => { pega(k).real += v.real; }));
    plano.forEach(v => chaves(v).forEach(k => {
      const a = pega(k); a.proj += v.proj; a.projIni += v.projIni; if (!cota.length) a.orc += v.orc;
      if (v.canal.indexOf('VD') === 0) a.projVD += v.proj; else a.projVI += v.proj;
    }));
    cota.forEach(v => chaves(v).forEach(k => { const a = pega(k); a.orc += v.orc; a.forecast += v.forecast || 0; }));
    // Orçamento e forecast vêm de um arquivo só. Se o total sai de ordem de grandeza contra a
    // projeção, o problema é de formato numérico na origem — publicar seria pior que omitir.
    this._orcDescartado = null;
    const T0 = mapa['T'];
    if (T0 && T0.proj > 0 && T0.orc > 0) {
      const razao = T0.orc / T0.proj;
      if (razao > 10 || razao < 0.1) {
        const vezes = razao >= 1000
          ? '10^' + Math.round(Math.log10(razao)) + ' vezes'
          : this._fmt(razao) + ' vezes';
        this._orcDescartado = { orc: T0.orc, proj: T0.proj, razao: razao, vezes: vezes };
        Object.keys(mapa).forEach(k => { mapa[k].orc = 0; mapa[k].forecast = 0; });
      }
    }
    vendasAA.forEach(v => chaves(v).forEach(k => {
      const a = pega(k); a.realAA += v.real; if (!corteAA || v.data <= corteAA) a.realAAmtd += v.real;
    }));
    const linhas = vendas.concat(plano);
    const BUS = ['CH', 'PP', 'SC', 'SG'].filter(b => linhas.some(v => v.bu === b));
    const temCob = linhas.some(v => v.bu === 'COBERTURA');
    const soma = (alvo, f) => { if (f) Object.keys(alvo).forEach(k => alvo[k] += f[k]); return alvo; };
    const totSC = z(); BUS.forEach(b => soma(totSC, mapa['BU|' + b]));
    const totG = soma(z(), totSC); if (temCob) soma(totG, mapa['BU|COBERTURA']);
    const r1 = 10, arred = v => v == null ? null : Math.round(v * 10) / 10;
    const varia = (v, b) => b > 0 ? Math.round((v / b - 1) * 1000) / 10 : null;
    const shr = (p, t) => t > 0 ? Math.round((p / t) * 1000) / 10 : null;
    const linha = (bu, marca, rede, a) => {
      const r = new Array(this.cols.length).fill(null);
      const set = (c, v) => r[this.cols.indexOf(c)] = v;
      set('bu', bu); set('marca', marca); set('rede', rede);
      // realizado acima do projetado: projeção passa a ser o realizado
      if (a.real > a.proj) a = Object.assign({}, a, { proj: a.real });
      set('realAA', arred(a.realAA)); set('real', arred(a.real)); set('proj', arred(a.proj));
      set('projIni', a.projIni ? arred(a.projIni) : null); set('orcAbs', a.orc ? arred(a.orc) : null);
      set('forecast', a.forecast ? arred(a.forecast) : null);
      set('pProj', varia(a.proj, a.realAA)); set('pIni', a.projIni ? varia(a.projIni, a.realAA) : null);
      set('pOrc', a.orc ? varia(a.orc, a.realAA) : null);
      set('cresc', varia(a.real, a.realAAmtd));
      set('vd', shr(a.projVD, a.proj)); set('vi', shr(a.projVI, a.proj));
      return r;
    };
    const fatos = [];
    BUS.forEach(b => fatos.push(linha(b, 'TOTAL', 'TOTAL', mapa['BU|' + b])));
    if (temCob) fatos.push(linha('COBERTURA', 'TOTAL', 'TOTAL', mapa['BU|COBERTURA']));
    const somaSub = rots => { const s = z(); rots.forEach(r => soma(s, mapa['SUB|' + r])); return s; };
    [['SG - GENÉRICOS', ['SG - GENÉRICOS']],
      ['SG - COBERTURA', ['SG - COBERTURA']],
      ['SG - SIMILARES', ['SG - SMART (EX-VIT)', 'VIT NEO QUÍMICA']],
      ['Similares (Ex-Vit)', ['SG - SMART (EX-VIT)']],
      ['Vitaminas', ['VIT NEO QUÍMICA']]].forEach(([rot, rots]) => {
      const s = somaSub(rots);
      if (s.realAA || s.proj || s.real) fatos.push(linha(rot, 'TOTAL', 'TOTAL', s));
    });
    // PP abre em Semavy (marcas SEMAVY*) e PP (Ex-Semavy) = PP menos Semavy
    this._semavy = null;
    if (mapa['BU|PP']) {
      const sem = z();
      Object.keys(mapa).filter(k => /^MARCA\|PP\|.*SEMAVY/i.test(k)).forEach(k => soma(sem, mapa[k]));
      const ex = soma(z(), mapa['BU|PP']); Object.keys(ex).forEach(k => ex[k] -= sem[k]);
      if (sem.realAA || sem.proj || sem.real || sem.orc) {
        fatos.push(linha('PP (Ex-Semavy)', 'TOTAL', 'TOTAL', ex));
        fatos.push(linha('Semavy', 'TOTAL', 'TOTAL', sem));
        this._semavy = sem;
      }
    }
    fatos.push(linha('Total', 'TOTAL', 'TOTAL', totG));
    fatos.push(linha('Total s/ Cobertura', 'TOTAL', 'TOTAL', totSC));
    if (this._semavy) { const te = soma(z(), totG); Object.keys(te).forEach(k => te[k] -= this._semavy[k]); fatos.push(linha('Total (Ex-Semavy)', 'TOTAL', 'TOTAL', te)); }
    fatos.push(linha('TOTAL', 'TOTAL', 'TOTAL', totSC));
    ['VD', 'VI'].forEach(c => {
      // total do canal = só as BUs comerciais, para fechar com o Total s/ Cobertura
      const tc = z(); let temC = false;
      BUS.forEach(b => { const a = mapa['CANAL|' + b + '|' + c]; if (a) { soma(tc, a); temC = true; } });
      if (temC) fatos.push(linha('TOTAL', 'TOTAL', c, tc));
      BUS.forEach(b => { if (mapa['CANAL|' + b + '|' + c]) fatos.push(linha(b, 'TOTAL', c, mapa['CANAL|' + b + '|' + c])); });
    });
    const clientes = [...new Set(linhas.map(v => v.cliente))]
      .sort((a, b) => (mapa['CLI|' + b].proj) - (mapa['CLI|' + a].proj));
    clientes.forEach(c => {
      fatos.push(linha('TOTAL', 'TOTAL', c, mapa['CLI|' + c]));
      BUS.forEach(b => { if (mapa['CLI|' + b + '|' + c]) fatos.push(linha(b, 'TOTAL', c, mapa['CLI|' + b + '|' + c])); });
    });
    const destaques = [], grao = {};
    BUS.forEach(bu => {
      const nomes = [...new Set(linhas.filter(v => v.bu === bu).map(v => v.marca))];
      const lista = nomes.map(n => ({ n, a: mapa['MARCA|' + bu + '|' + n] })).sort((x, y) => y.a.proj - x.a.proj);
      // marca no total e aberta por cliente e por canal — grão das tabelas do painel
      const abre = (rotulo, nome) => {
        clientes.forEach(c => { const a = mapa['MC|' + bu + '|' + nome + '|' + c]; if (a) fatos.push(linha(bu, rotulo, c, a)); });
        ['VD', 'VI'].forEach(c => { const a = mapa['MC|' + bu + '|' + nome + '|' + c]; if (a) fatos.push(linha(bu, rotulo, c, a)); });
      };
      lista.slice(0, topN).forEach(m => { fatos.push(linha(bu, m.n, 'TOTAL', m.a)); abre(m.n, m.n); });
      const cauda = lista.slice(topN);
      if (cauda.length) {
        const d = z(); cauda.forEach(c => soma(d, c.a));
        fatos.push(linha(bu, 'DEMAIS', 'TOTAL', d));
        clientes.concat(['VD', 'VI']).forEach(c => {
          const s = z(); let tem = false;
          cauda.forEach(m => { const a = mapa['MC|' + bu + '|' + m.n + '|' + c]; if (a) { soma(s, a); tem = true; } });
          if (tem) fatos.push(linha(bu, 'DEMAIS', c, s));
        });
      }
      // grão do simulador com as mesmas marcas da tabela (top N + DEMAIS): [AA, realizado, projeção]
      const top = new Set(lista.slice(0, topN).map(m => m.n)), r3 = v => Math.round(v * 1000) / 1000;
      Object.keys(mapa).forEach(k => {
        if (k.indexOf('G|' + bu + '\u0001') !== 0) return;
        const pp = k.slice(2).split('\u0001'), a = mapa[k];
        if (!a.realAA && !a.real && !a.proj) return;
        const kk = bu + '|' + (top.has(pp[1]) ? pp[1] : 'DEMAIS') + '|' + pp[2] + '|' + pp[3];
        const g = grao[kk] || (grao[kk] = [0, 0, 0]);
        g[0] = r3(g[0] + a.realAA); g[1] = r3(g[1] + a.real); g[2] = r3(g[2] + a.proj);
      });
      const min = this._num(M.destaqueMinimo) == null ? 2 : this._num(M.destaqueMinimo);
      lista.forEach(m => { if (m.a.proj >= min && m.a.realAA > 0) destaques.push([m.n, varia(m.a.proj, m.a.realAA)]); });
    });
    destaques.sort((a, b) => b[1] - a[1]);
    return {
      fatos, grao, destaques: destaques.slice(0, this._num(M.destaqueQtd) || 8),
      mtdAA: (() => {
        const sc = c => BUS.reduce((s, b) => s + ((mapa['CANAL|' + b + '|' + c] || {}).realAAmtd || 0), 0);
        return { vd: arred(sc('VD')), vi: arred(sc('VI')), total: arred(totSC.realAAmtd) };
      })(),
      resumo: { marcas: [...new Set(linhas.map(v => v.bu + '|' + v.marca))].length, skus: [...new Set(linhas.map(v => v.sku))].length }
    };
  }

  /**
   * CSV -> matriz de texto. Leitura própria (e não pelo leitor de Excel) para que nada seja
   * reinterpretado: data fica "04/08/2026" e não vira 8 de abril, e número com vírgula
   * decimal chega inteiro em _num. Aceita ; ou , como separador e campos entre aspas.
   */
  _parseCSV(txt) {
    const t = String(txt || '');
    const ini = t.charCodeAt(0) === 0xFEFF ? 1 : 0;
    let fim = t.indexOf('\n', ini); if (fim < 0) fim = t.length;
    const prim = t.slice(ini, fim);
    const sep = (prim.split(';').length > prim.split(',').length) ? ';' : ',';
    this._sepAtual = sep;
    const linhas = [];
    let campo = '', linha = [], aspas = false, vazia = true;
    const fecharCampo = () => { const v = campo.trim(); if (v !== '') vazia = false; linha.push(v); campo = ''; };
    const fecharLinha = () => { fecharCampo(); if (!vazia) linhas.push(linha); linha = []; vazia = true; };
    for (let i = ini; i < t.length; i++) {
      const c = t[i];
      if (aspas) {
        if (c === '"') { if (t[i + 1] === '"') { campo += '"'; i++; } else aspas = false; }
        else campo += c;
      } else if (c === '"') aspas = true;
      else if (c === sep) fecharCampo();
      else if (c === '\n') fecharLinha();
      else if (c !== '\r') campo += c;
    }
    if (campo !== '' || linha.length) fecharLinha();
    return linhas;
  }

  /**
   * Um CSV por tabela (vendas.csv, vendas-aa.csv, projecao-atual.csv…), vários de uma vez.
   * Partes numeradas do mesmo nome (vendas-01, vendas-02) são emendadas numa tabela só.
   * Arquivo acima de 15 MB não é carregado inteiro: passa por _csvAgregado, que lê em
   * fatias e já soma no grão BU × marca × canal × cliente. Memória fica constante.
   * Monta a mesma estrutura de pasta de abas que o .xlsx produzia, então o resto do
   * fluxo não muda.
   */
  _wbDeCSVs(X, arqs) {
    const nomeTabela = n => n.replace(/\.[^.]+$/, '')
      .replace(/[ _-]*(parte|part|p)?[ _-]*\d+$/i, '')
      .replace(/[_-]+/g, ' ').trim() || 'vendas';
    const ordenados = arqs.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }));
    const GRANDE = 15 * 1048576;
    const totalMB = arqs.reduce((t, a) => t + (a.size || 0), 0) / 1048576;
    const info = this.$('impInfo');
    const grupos = {}, ordem = [], agregado = {}, seps = {}, decs = {};
    this._datasBase = {};
    this._agregadas = [];
    let lidoMB = 0;

    const passo = i => {
      if (i >= ordenados.length) return Promise.resolve();
      const a = ordenados[i], nome = nomeTabela(a.name), mb = (a.size || 0) / 1048576;
      if (info) {
        info.style.color = '#5D5F61';
        info.textContent = (mb > 15 ? 'Somando ' : 'Lendo ') + a.name
          + ' — ' + lidoMB.toFixed(0) + ' de ' + totalMB.toFixed(0) + ' MB';
      }
      const p = (a.size || 0) > GRANDE
        ? this._csvAgregado(a, nome, (feito) => {
            if (info) info.textContent = 'Somando ' + a.name + ' — '
              + (lidoMB + feito).toFixed(0) + ' de ' + totalMB.toFixed(0) + ' MB';
          })
        : a.text().then(t => {
            const aoa = this._parseCSV(t);
            const am = [];
            for (let li = 1; li < aoa.length; li++)
              for (let ci = 0; ci < aoa[li].length; ci++)
                if (this._ehAmostra(aoa[li][ci])) am.push(aoa[li][ci]);
            return { aoa: aoa, datas: null, sep: this._sepAtual, dec: this._decDoCab(aoa[0]) || this._decimal(am) };
          });
      return p.then(r => {
        lidoMB += mb;
        if (r.datas && r.datas.length) this._datasBase[nome] = r.datas;
        if (r.agregado) { this._agregadas.push(a.name + ' → ' + (r.linhas || 0) + ' linhas'); agregado[nome] = true; }
        if (!grupos[nome]) { grupos[nome] = []; ordem.push(nome); }
        if (r.sep) seps[nome] = r.sep;
        if (r.dec) decs[nome] = r.dec;
        grupos[nome].push(r.aoa);
        return passo(i + 1);
      });
    };

    return passo(0).then(() => {
      const wb = { SheetNames: [], Sheets: {} };
      ordem.forEach(nome => {
        const linhas = [];
        let cab = null;
        grupos[nome].forEach(aoa => {
          if (!aoa || !aoa.length) return;
          const assina = r => r.map(c => String(c == null ? '' : c).trim().toUpperCase()).join('|');
          const ini2 = cab == null ? 0 : (assina(aoa[0]) === cab ? 1 : 0);
          if (cab == null) cab = assina(aoa[0]);
          for (let i = ini2; i < aoa.length; i++) linhas.push(aoa[i]);
        });
        if (!linhas.length) return;
        wb.SheetNames.push(nome);
        wb.Sheets[nome] = { __aoa: linhas, __trans: !!agregado[nome], __sep: seps[nome] || ';', __dec: decs[nome] || null };
      });
      return wb;
    });
  }

  /**
   * Lê um CSV grande em fatias e devolve a tabela já somada no grão
   * BU × marca × canal × cliente. SKU e data saem na soma — a data sobrevive
   * como lista de dias distintos, que é tudo que o cabeçalho precisa dela.
   * Campo entre aspas com separador dentro é tratado; quebra de linha dentro de
   * aspas não (nenhuma extração do boletim produz isso).
   */
  _csvAgregado(arquivo, rotulo, aoAvancar) {
    const FATIA = 6 * 1048576;
    const DIM = { BU: 'BU', MARCA: 'MARCA', CANAL: 'CANAL', CLIENTE: 'CLIENTE', REDE: 'CLIENTE' };
    const IGNORA = { SKU: 1, DATA: 1, DIA: 1, EAN: 1, PRODUTO: 1, DESCRICAO: 1 };
    // DATA entra no grão como serial; SKU é o único eixo que a soma descarta.
    const VALOR_CONHECIDO = /^(VALOR_REAL|VALOR_REAL_AA|REAL|REALIZADO|PROJ|PROJ_INICIAL|PROJETADO_INICIAL|VALOR_PROJETADO_INICIAL|VALOR_PROJETADO_REAL|VALOR_PROJETADO_RATEADO|PROJ_ATUAL|PROJETADO_ATUAL|VALOR_PROJETADO_ATUAL|ORCAMENTO|OR\u00c7AMENTO|ORC|FORECAST|FCST|ORCAMENTO_REPROJETADO)$/;
    const dec = new TextDecoder('utf-8');
    const mapa = new Map(), datas = new Set();
    let resto = '', sep = ';', pronto = false, iData = -1;
    let nomeDim = [], iDim = [], nomeVal = [], iVal = [], cands = [];

    const partir = linha => {
      if (linha.indexOf('"') < 0) return linha.split(sep);
      const out = []; let campo = '', aspas = false;
      for (let i = 0; i < linha.length; i++) {
        const c = linha[i];
        if (aspas) { if (c === '"') { if (linha[i + 1] === '"') { campo += '"'; i++; } else aspas = false; } else campo += c; }
        else if (c === '"') aspas = true;
        else if (c === sep) { out.push(campo); campo = ''; }
        else campo += c;
      }
      out.push(campo);
      return out;
    };

    const lerCabecalho = linha => {
      sep = (linha.split(';').length > linha.split(',').length) ? ';' : ',';
      this._sepAtual = sep;
      const h = partir(linha).map(c => String(c || '').trim().toUpperCase().replace(/\s+/g, '_').replace(/^"|"$/g, ''));
      h.forEach((n, i) => {
        if (DIM[n]) { if (nomeDim.indexOf(DIM[n]) < 0) { nomeDim.push(DIM[n]); iDim.push(i); } }
        else if ((n === 'DATA' || n === 'DIA') && iData < 0) iData = i;
        else if (!IGNORA[n] && n) cands.push({ n: n, i: i });
      });
      if (iData >= 0) { nomeDim.unshift('DATA'); iDim.unshift(iData); }
      if (!nomeDim.length || (nomeDim.length === 1 && nomeDim[0] === 'DATA'))
        throw new Error(rotulo + ': nenhuma coluna de BU, marca, canal ou cliente no cabeçalho');
    };

    const definirValores = campos => {
      cands.forEach(c => {
        if (this._num(campos[c.i]) != null) { nomeVal.push(c.n); iVal.push(c.i); }
      });
      if (!nomeVal.length) throw new Error(rotulo + ': nenhuma coluna de valor numérico encontrada');
      if (nomeVal.length === 1 && !VALOR_CONHECIDO.test(nomeVal[0])) nomeVal[0] = 'REAL';
      pronto = true;
    };

    const trataLinha = linha => {
      if (!linha) return;
      const campos = partir(linha);
      if (!pronto) definirValores(campos);
      let chave = '';
      for (let d = 0; d < iDim.length; d++) {
        let v = String(campos[iDim[d]] || '').trim().toUpperCase();
        if (/^(NULL|NULO|N\/A|NA|#N\/D)$/.test(v)) v = '';
        if (iData >= 0 && d === 0) {
          const sv = this._serial(v);
          v = sv ? String(sv) : '';
          if (sv && datas.size < 2000) datas.add(sv);
        }
        chave += (d ? '\u0001' : '') + v;
      }
      let acc = mapa.get(chave);
      if (!acc) { acc = new Float64Array(iVal.length); mapa.set(chave, acc); }
      for (let v = 0; v < iVal.length; v++) {
        const x = this._num(campos[iVal[v]]);
        if (x != null) acc[v] += x;
      }
    };

    const laco = off => {
      if (off >= arquivo.size) {
        const cauda = resto + dec.decode();
        cauda.split('\n').forEach(l => trataLinha(l.replace(/\r$/, '')));
        return Promise.resolve();
      }
      return arquivo.slice(off, off + FATIA).arrayBuffer().then(buf => {
        let txt = resto + dec.decode(new Uint8Array(buf), { stream: true });
        if (off === 0) txt = txt.replace(/^\uFEFF/, '');
        const linhas = txt.split('\n');
        resto = linhas.pop() || '';
        let ini2 = 0;
        if (off === 0 && linhas.length) { lerCabecalho(linhas[0].replace(/\r$/, '')); ini2 = 1; }
        for (let i = ini2; i < linhas.length; i++) trataLinha(linhas[i].replace(/\r$/, ''));
        if (aoAvancar) aoAvancar(Math.min(off + FATIA, arquivo.size) / 1048576);
        return laco(off + FATIA);
      });
    };

    return arquivo.slice(0, 262144).arrayBuffer().then(buf => {
      const amostra = new TextDecoder('utf-8').decode(new Uint8Array(buf)).replace(/^\uFEFF/, '').split('\n');
      if (amostra.length > 1) {
        lerCabecalho(amostra[0].replace(/\r$/, ''));
        const vals = [];
        for (let i = 1; i < amostra.length - 1; i++) {
          const cs = partir(amostra[i].replace(/\r$/, ''));
          for (let j = 0; j < cs.length; j++) if (this._ehAmostra(cs[j])) vals.push(cs[j]);
        }
        this._decAtual = this._decDoCab(partir(amostra[0].replace(/\r$/, ''))) || this._decimal(vals);
      }
      nomeDim = []; iDim = []; cands = []; iData = -1;
      return laco(0);
    }).then(() => {
      const aoa = [nomeDim.concat(nomeVal)];
      mapa.forEach((acc, chave) => {
        const dims = chave.split('\u0001');
        if (!dims[iData >= 0 ? 1 : 0]) return;
        const linha = dims.slice();
        if (iData >= 0) linha[0] = Number(linha[0]) || 0;
        let algum = false;
        for (let v = 0; v < acc.length; v++) {
          const x = Math.round(acc[v] * 100) / 100;
          if (x !== 0) algum = true;
          linha.push(x);
        }
        if (algum) aoa.push(linha);
      });
      return { aoa: aoa, datas: Array.from(datas), agregado: true, linhas: aoa.length - 1, sep: sep, dec: this._decAtual };
    });
  }

  /** Leitor de planilhas (~900 KB) só é baixado quando o usuário importa ou gera modelo. */
  _xlsx() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return this._xlsxP = this._xlsxP || new Promise((ok, erro) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      s.onload = () => window.XLSX ? ok(window.XLSX) : erro();
      s.onerror = () => { this._xlsxP = null; erro(); };
      document.head.appendChild(s);
    });
  }

  _comXlsx(info, msg, fn) {
    if (window.XLSX) return fn();
    info.style.color = '#5D5F61'; info.textContent = 'Carregando leitor de planilhas…';
    this._xlsx().then(fn, () => { info.style.color = '#B32B23'; info.textContent = msg; });
  }

  _import(entrada) {
    const info = this.$('impInfo');
    if (!window.XLSX) return this._comXlsx(info, 'Leitor da base não carregou. Verifique a conexão e tente de novo.', () => this._import(entrada));
    const X = window.XLSX;
    const arqs = Array.isArray(entrada) ? entrada : [entrada];
    // arquivos novos: corte volta a ser derivado; reprocessamento pelo campo Data de corte mantém o digitado
    if (arqs !== this._ultArqs) this._corteForcado = null;
    this._ultArqs = arqs;
    const csvs = arqs.filter(a => /\.(csv|txt)$/i.test(a.name));
    const rotulo = arqs.length === 1 ? arqs[0].name : arqs.length + ' arquivos';
    const totalMB = arqs.reduce((t, a) => t + (a.size || 0), 0) / 1048576;
    const maior = arqs.slice().sort((a, b) => (b.size || 0) - (a.size || 0))[0];
    const maiorMB = maior ? (maior.size || 0) / 1048576 : 0;
    if (!csvs.length && (totalMB > 60 || maiorMB > 40)) {
      info.style.color = '#B32B23';
      info.innerHTML = 'Base grande demais para o navegador: <b>' + totalMB.toFixed(0) + ' MB</b> no total'
        + (maior ? ', sendo <b>' + maior.name + '</b> com ' + maiorMB.toFixed(0) + ' MB' : '') + '. '
        + 'O leitor de .xlsx carrega a planilha inteira na memória. Exporte como CSV — aí a leitura é feita em fatias e o tamanho deixa de importar. '
        + 'um CSV por tabela no grão <b>BU × marca × cliente × canal</b> fica abaixo de 20 MB. '
        + '<a href="agregacao-power-query.dc.html" style="color:#0062AA;">Passo a passo da agregação</a> · '
        + '<a href="formato-da-base.dc.html" style="color:#0062AA;">Formato da Base</a>.';
      return;
    }
    info.style.color = '#5D5F61';
    info.textContent = 'Lendo ' + rotulo + ' (' + totalMB.toFixed(1) + ' MB)…';
    const fonte = csvs.length
      ? this._wbDeCSVs(X, csvs)
      : arqs[0].arrayBuffer().then(ab => X.read(ab, { type: 'array' }));
    fonte.then(wb => {
      const f = { name: rotulo };
      const nomeVendas = wb.SheetNames.find(n => /^vendas$|venda/i.test(n) && !/aa/i.test(n));
      const cabTrans = nomeVendas
        ? (this._aoa(X, wb.Sheets[nomeVendas])[0] || [])
          .map(c => String(c).trim().toUpperCase()).join('|')
        : '';
      const wsV = nomeVendas ? wb.Sheets[nomeVendas] : null;
      const ehTrans = (wsV && wsV.__trans)
        || (/CANAL/.test(cabTrans) && /(DATA|DIA)/.test(cabTrans))
        || (/BU/.test(cabTrans) && /(CLIENTE|REDE)/.test(cabTrans) && !/REALAA/.test(cabTrans));
      if (nomeVendas && ehTrans) {
        const nomeMetaT = wb.SheetNames.find(n => /meta|cabe/i.test(n));
        const M = {};
        if (nomeMetaT) this._aoa(X, wb.Sheets[nomeMetaT])
          .forEach(r => { const k = String(r[0] || '').trim(); if (k && k !== 'campo') M[k] = r[1]; });
        const divisor = this._num(M.divisor) || 1000000;
        const topN = this._num(M.topMarcas) || 5;
        const vendas = this._lerTrans(X, wb.Sheets[nomeVendas], divisor);
        const nomeAA = wb.SheetNames.find(n => /vendas.*aa|aa.*vendas|anterior/i.test(n));
        const vendasAA = nomeAA ? this._lerTrans(X, wb.Sheets[nomeAA], divisor) : [];
        const pj = this._abasProjecao(X, wb, divisor);
        const nomeProj = pj.nomes.length ? pj.nomes.join(' + ') : null;
        const nomeOrc = wb.SheetNames.find(n => /or(ç|c)amento/i.test(n));
        const plano = pj.linhas.length ? pj.linhas
          : (nomeOrc ? this._lerTrans(X, wb.Sheets[nomeOrc], divisor) : vendas);
        const cota = nomeProj && nomeOrc ? this._lerTrans(X, wb.Sheets[nomeOrc], divisor) : [];
        if (!vendas.length) throw new Error('vendas sem linhas');
        if (!vendasAA.length) throw new Error('"vendas-aa" ausente ou vazio — sem ano anterior não há variação');
        const diasDe = nome => { const d = this._datasBase && nome ? this._datasBase[nome] : null; return d && d.length ? d.map(x => ({ data: x })) : null; };
        this._datasVendas = [...new Set((diasDe(nomeVendas) || vendas).map(v => v.data).filter(d => d > 0))].sort((a, b) => a - b);
        // o cabeçalho da base anterior não vale para a base nova; sem meta.csv, tudo é derivado
        if (!nomeMetaT) { M.dataCorte = ''; M.referencia = ''; M.diasUteis = null; M.diasUteisAA = null; }
        // VENDAS com mais de um mês: o corte digitado manda; sem ele, o mês da CURVA define o corte
        if (this._corteForcado) { M.dataCorte = this._corteForcado; M.referencia = ''; M.diasUteis = null; M.diasUteisAA = null; }
        else if (!M.dataCorte) { const cc = this._corteDaCurva(X, wb, vendas); if (cc) M.dataCorte = cc; }
        this._derivarMeta(M, diasDe(nomeVendas) || vendas, diasDe(nomeAA) || vendasAA);
        if (!plano.length) throw new Error('"projecao-inicial" e "projecao-atual" ausentes ou vazios — sem projeção não há % proj');
        if (nomeProj && !cota.length) throw new Error('"orcamento" ausente ou vazio — sem orçamento não há % do orçamento');
        const corte = this._serial(M.dataCorte);
        // base com vários meses: só o mês do corte entra no realizado, e só o mesmo mês do ano anterior no AA
        let vendasCorte = vendas, vendasAAm = vendasAA;
        if (corte) {
          const dc = this._dataDe(corte), y = dc.getUTCFullYear(), m = dc.getUTCMonth();
          const ser = dt => Math.round((dt - Date.UTC(1899, 11, 30)) / 86400000);
          const ini = ser(Date.UTC(y, m, 1)), iniAA = ser(Date.UTC(y - 1, m, 1)), fimAA = ser(Date.UTC(y - 1, m + 1, 0));
          vendasCorte = vendas.filter(v => !v.data || (v.data >= ini && v.data <= corte));
          vendasAAm = vendasAA.filter(v => !v.data || (v.data >= iniAA && v.data <= fimAA));
        }
        const ag = this._agregar(vendasCorte, vendasAAm, plano, M, topN, cota);
        this.fatos = ag.fatos; this._idx = null; this._grao = ag.grao;
        this._destaques = ag.destaques; this._mtdAA = ag.mtdAA;
        this._lerCurva(X, wb, divisor, vendasCorte, vendasAAm);
      this._lerExtras(X, wb);
        // o cabeçalho reflete a base que acabou de entrar, não a anterior nem a de demonstração
        const put = (id, k) => { const el = this.$(id); if (el && M[k] != null && M[k] !== '') el.value = M[k]; };
        put('inpRef', 'referencia'); put('inpCorte', 'dataCorte'); setTimeout(() => this._pintarCorte(), 0); put('inpDias', 'diasUteis');
        put('inpDiasAA', 'diasUteisAA'); if (M.hub) M.hub = this._link('hub', M.hub); if (M.executivos) M.executivos = this._link('executivos', M.executivos); put('inpHub', 'hub'); put('inpExec', 'executivos');
        info.style.color = '#0a7d34';
        info.innerHTML = '✓ <b>' + f.name + '</b>: ' + vendas.length.toLocaleString('pt-BR') + ' linhas de venda + '
          + vendasAA.length.toLocaleString('pt-BR') + ' do ano anterior · ' + ag.resumo.marcas + ' marcas · '
          + ag.resumo.skus + ' SKUs · agregado em ' + this.fatos.length + ' linhas (top ' + topN + ' marcas por BU + Demais).'
          + ((this._metaDerivada && this._metaDerivada.length)
            ? '<br><span style="color:#5D5F61;">Sem meta.csv para estes campos — deduzidos da base: <b>' + this._metaDerivada.join('</b>, <b>') + '</b>. Confira no cabeçalho abaixo.</span>' : '');
        this._validar();
        this._gerarAlertas();
        this._gerarCons();
        this._guardarFoto();
        this._publicarBase(this._meta());
        this._gerarResumo();
        return;
      }
      const nomeFatos = wb.SheetNames.find(n => /fato|dados|base/i.test(n)) || wb.SheetNames[0];
      const rows = this._aoa(X, wb.Sheets[nomeFatos]);
      if (!rows.length) throw new Error('aba de fatos vazia');
      const head = rows[0].map(c => String(c == null ? '' : c).trim());
      const map = this.cols.map(c => head.findIndex(h => h.toLowerCase() === c.toLowerCase()));
      if (map[0] < 0 || map[1] < 0 || map[2] < 0) throw new Error('faltam as colunas bu, marca e rede');
      const out = [];
      rows.slice(1).forEach(r => {
        const bu = String(r[map[0]] == null ? '' : r[map[0]]).trim(); if (!bu) return;
        out.push(this.cols.map((c, i) => {
          const v = map[i] < 0 ? null : r[map[i]];
          return i < 3 ? String(v == null ? '' : v).trim() : this._num(v);
        }));
      });
      if (!out.length) throw new Error('nenhuma linha de fato lida');
      this.fatos = out; this._idx = null;
      const nomeMeta = wb.SheetNames.find(n => /meta|cabe/i.test(n));
      if (nomeMeta) {
        const mr = this._aoa(X, wb.Sheets[nomeMeta]);
        const M = {}; mr.forEach(r => { const k = String(r[0] || '').trim(); if (k) M[k] = r[1]; });
        // o cabeçalho reflete a base que acabou de entrar, não a anterior nem a de demonstração
        const put = (id, k) => { const el = this.$(id); if (el && M[k] != null && M[k] !== '') el.value = M[k]; };
        put('inpRef', 'referencia'); put('inpCorte', 'dataCorte'); setTimeout(() => this._pintarCorte(), 0); put('inpDias', 'diasUteis');
        put('inpDiasAA', 'diasUteisAA'); if (M.hub) M.hub = this._link('hub', M.hub); if (M.executivos) M.executivos = this._link('executivos', M.executivos); put('inpHub', 'hub'); put('inpExec', 'executivos');
        const n = k => this._num(M[k]);
        if (n('mtdAaTotal') != null) this._mtdAA = { vd: n('mtdAaVD'), vi: n('mtdAaVI'), total: n('mtdAaTotal') };
      }
      this._lerCurva(X, wb);
      this._lerExtras(X, wb);
      const nomeDest = wb.SheetNames.find(n => /destaque/i.test(n));
      if (nomeDest) {
        const dr = this._aoa(X, wb.Sheets[nomeDest]).slice(1);
        const d = dr.map(r => [String(r[0] || '').trim(), this._num(r[1])]).filter(x => x[0]);
        if (d.length) this._destaques = d;
      }
      info.style.color = '#0a7d34';
      info.innerHTML = '✓ <b>' + f.name + '</b>: ' + out.length + ' linhas de fato lidas da aba <b>' + nomeFatos + '</b>' + (nomeMeta ? ' · cabeçalho da aba <b>' + nomeMeta + '</b>' : '') + '.';
      this._validar();
      this._gerarAlertas();
      this._gerarCons();
      this._guardarFoto();
        this._publicarBase(this._meta());
      this._gerarResumo();
    }).catch(e => { info.style.color = '#B32B23'; info.textContent = 'Falha ao ler a base: ' + e.message; });
  }
};
