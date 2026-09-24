/**
 * Office Script — Boletim Sell Out | Hypera Pharma
 *
 * Lê a BASE TRANSACIONAL de vendas e devolve o e-mail pronto.
 * Nenhum número é digitado: variações, representatividades, top 5 de marcas
 * e destaques são todos calculados a partir da base.
 *
 * Abas esperadas na planilha
 *   Vendas      DATA | BU | MARCA | SKU | CANAL | CLIENTE | REAL          (realizado diário)
 *   Vendas AA   DATA | BU | MARCA | SKU | CANAL | CLIENTE | REAL          (mesmo grão, ano anterior)
 *   Projeções   BU | MARCA | SKU | CANAL | CLIENTE | PROJ_INICIAL | PROJ_ATUAL
 *   Orçamento   BU | MARCA | SKU | CANAL | CLIENTE | ORCAMENTO | FORECAST
 *               (ambas sem data — valores do mês cheio)
 *
 *   BU aceita CH, PP, SC e as três sublinhas de SG: "SG - GENÉRICOS", "SG - SMART (EX-VIT)" e
 *   "VIT NEO QUÍMICA". O script consolida: SG = as três somadas · SG - SIMILARES = SMART + VIT NQ.
 *   Meta        campo | valor                                            (parâmetros, textos e links: hub, executivos, deck, pdf)
 *
 * Onde colar: Excel na web > Automatizar > Novo script > Salvar como "BoletimSellOut-GerarEmail".
 *
 * Fluxo diário no Power Automate (grava direto na pasta do portal):
 *   1. Obter conteúdo do arquivo  ->  <portal>/historico-boletim.json   (404 permitido: "Configurar execução após")
 *   2. Executar script            ->  indiceAtual = conteúdo do passo 1 (vazio na 1ª vez)
 *                                     pastaPortal = "edicoes"
 *   3. Condição                   ->  enviar = true, senão pare e registre "motivo"
 *   4. Criar arquivo              ->  {arquivoEmail}   = html    (grupo comercial)
 *   5. Criar arquivo              ->  {arquivoEmail2}  = html2   (grupo gestão orçamentária, com forecast)
 *   6. Criar arquivo              ->  {arquivoPdf} e {arquivoPdf2} = PDFs dos dois decks
 *   7. Criar arquivo              ->  {arquivoBase}    = cópia da planilha do dia
 *   8. Criar arquivo (sobrescrever) -> <portal>/historico-boletim.json = indice
 *   9. Enviar e-mail              ->  destinatarios + assunto + html
 *  10. Enviar e-mail              ->  destinatarios2 + assunto2 + html2
 *   Os passos 4-8 usam os caminhos que o script devolve; nada precisa ser montado no fluxo.
 * Quem chama: Power Automate, ação "Executar script" (Excel Online Business).
 */

/** Sublinhas de SG aceitas na coluna BU das abas de venda. */
const SUB_SG = ['SG - GENÉRICOS', 'SG - GENERICOS', 'SG - SMART (EX-VIT)', 'VIT NEO QUÍMICA', 'VIT NEO QUIMICA'];

interface Saida {
  enviar: boolean;
  motivo: string;
  assunto: string;
  nomeArquivo: string;
  html: string;
  referencia: string;
  dataCorte: string;
  destinatarios: string;
  /** Pasta do dia dentro do portal: edicoes/2026/09/04 */
  pastaDia: string;
  /** Caminhos completos que o fluxo deve gravar. */
  arquivoEmail: string;
  arquivoPdf: string;
  arquivoBase: string;
  /** historico-boletim.json já mesclado — grave na raiz do portal. */
  indice: string;
  /** Grupo 2 — gestão orçamentária: mesmo boletim com forecast do ciclo. */
  html2: string;
  assunto2: string;
  destinatarios2: string;
  arquivoEmail2: string;
  arquivoPdf2: string;
}

/** Uma linha da base transacional já normalizada. */
interface Venda {
  data: number;          // serial do Excel
  bu: string;            // BU consolidada (CH | PP | SC | SG | COBERTURA)
  sub: string;           // BU como veio da planilha (sublinha de SG, quando for o caso)
  marca: string;
  sku: string;
  canal: string;         // VD | VI
  cliente: string;
  real: number;
  projIni: number;
  proj: number;
  orc: number;
  forecast: number;
}

/** Bloco de medidas agregado (BU, marca, canal ou cliente). */
interface Agg {
  realAA: number;        // realizado do mês fechado do ano anterior
  realAAmtd: number;     // realizado AA até a data de corte equivalente
  realAAmtdVD: number;   // idem, aberto por canal
  realAAmtdVI: number;
  real: number;          // realizado do mês corrente até a data de corte
  proj: number;          // projetado atual (mês cheio)
  projIni: number;       // projetado inicial (mês cheio)
  orc: number;           // orçamento (mês cheio)
  forecast: number;      // orçamento reprojetado no ciclo (rolling forecast)
  projVD: number;
  projVI: number;
  realVD: number;
  realVI: number;
  realAAVD: number;
  realAAVI: number;
}

/**
 * @param indiceAtual conteúdo do historico-boletim.json que já está no portal
 *                    (o fluxo lê o arquivo e passa como texto; vazio na primeira execução).
 * @param pastaPortal prefixo das edições dentro do portal. Padrão "edicoes".
 */
function main(workbook: ExcelScript.Workbook, indiceAtual: string = '', pastaPortal: string = 'edicoes'): Saida {
  const vazio = (motivo: string): Saida => ({
    enviar: false, motivo, assunto: '', nomeArquivo: '', html: '',
    referencia: '', dataCorte: '', destinatarios: '',
    pastaDia: '', arquivoEmail: '', arquivoPdf: '', arquivoBase: '', indice: '',
    html2: '', assunto2: '', destinatarios2: '', arquivoEmail2: '', arquivoPdf2: ''
  });

  // ---------------- abas ----------------
  const shVendas = aba(workbook, ['Vendas', 'VENDAS', 'Base', 'Fatos']);
  const shAA = aba(workbook, ['Vendas AA', 'VENDAS AA', 'VendasAA', 'Base AA']);
  const shProj = aba(workbook, ['Projeções', 'Projecoes', 'PROJEÇÕES', 'PROJECOES', 'Projeção', 'Projecao']);
  const shOrc = aba(workbook, ['Orçamento', 'Orcamento', 'ORÇAMENTO', 'ORCAMENTO']);
  const shMeta = aba(workbook, ['Meta', 'META']);
  if (!shVendas) return vazio('aba "Vendas" não encontrada na planilha.');
  if (!shMeta) return vazio('aba "Meta" não encontrada na planilha.');

  const M: { [k: string]: string } = {};
  shMeta.getUsedRange().getValues().forEach(l => {
    const k = String(l[0]).trim();
    if (k && k.toLowerCase() !== 'campo') M[k] = l[1] === null ? '' : String(l[1]).trim();
  });

  const flag = (M['prontoParaEnvio'] || '').toUpperCase();
  if (flag !== 'SIM' && flag !== 'S' && flag !== 'TRUE') {
    return vazio('célula prontoParaEnvio da aba Meta não está em "SIM".');
  }
  if (!M['referencia'] || !M['dataCorte']) return vazio('referencia ou dataCorte não preenchidos na aba Meta.');

  const divisor = M['divisor'] ? Number(M['divisor']) : 1000000;   // base em R$ -> R$ milhões
  const topN = M['topMarcas'] ? Number(M['topMarcas']) : 5;
  const destMin = M['destaqueMinimo'] ? Number(M['destaqueMinimo']) : 2;   // R$ mi de projetado
  const destQtd = M['destaqueQtd'] ? Number(M['destaqueQtd']) : 8;
  const corte = serial(M['dataCorte']);
  const corteAA = M['dataCorteAA'] ? serial(M['dataCorteAA']) : 0;

  // ---------------- leitura da base ----------------
  const vendas = lerVendas(shVendas, divisor);
  if (!vendas.length) return vazio('a aba "Vendas" não tem linhas de venda.');
  const plano = shProj ? lerVendas(shProj, divisor) : vendas;   // sem a aba, cai no formato antigo
  if (shProj && !plano.length) return vazio('a aba "Projeções" está vazia — sem projeção não há % proj.');
  const cota = shOrc ? lerVendas(shOrc, divisor) : [];
  if (shOrc && !cota.length) return vazio('a aba "Orçamento" está vazia — sem orçamento não há % da cota.');
  const vendasAA = shAA ? lerVendas(shAA, divisor) : [];
  if (!vendasAA.length) return vazio('a aba "Vendas AA" está vazia — sem ano anterior não há variação.');
  if (!corteAA) return vazio('dataCorteAA não preenchida na aba Meta (dia de corte equivalente no ano anterior).');

  // ---------------- agregações ----------------
  const zero = (): Agg => ({
    realAA: 0, realAAmtd: 0, realAAmtdVD: 0, realAAmtdVI: 0, real: 0, proj: 0, projIni: 0, orc: 0, forecast: 0,
    projVD: 0, projVI: 0, realVD: 0, realVI: 0, realAAVD: 0, realAAVI: 0
  });
  const mapa: { [chave: string]: Agg } = {};
  const pega = (chave: string): Agg => {
    if (!mapa[chave]) mapa[chave] = zero();
    return mapa[chave];
  };
  /** Acumula a linha em todos os níveis que o boletim usa. */
  const chavesDe = (v: Venda): string[] => ['T', 'BU|' + v.bu, 'SUB|' + v.sub, 'MARCA|' + v.bu + '|' + v.marca,
    'CANAL|' + v.canal, 'CANAL|' + v.bu + '|' + v.canal,
    'CLI|' + v.cliente, 'CLI|' + v.bu + '|' + v.cliente];
  const somaAtual = (v: Venda): void => {
    const vd = v.canal.toUpperCase().indexOf('VD') === 0;
    chavesDe(v).forEach(k => {
      const a = pega(k);
      a.real += v.real;
      if (vd) a.realVD += v.real; else a.realVI += v.real;
    });
  };
  /** Aba Projeções: projeção inicial e projeção atual do mês cheio. */
  const somaPlano = (v: Venda): void => {
    const vd = v.canal.toUpperCase().indexOf('VD') === 0;
    chavesDe(v).forEach(k => {
      const a = pega(k);
      a.proj += v.proj; a.projIni += v.projIni;
      if (!shOrc) { a.orc += v.orc; a.forecast += v.forecast; }   // formato antigo: tudo na mesma aba
      if (vd) a.projVD += v.proj; else a.projVI += v.proj;
    });
  };
  /** Aba Orçamento: orçamento absoluto do mês cheio. */
  const somaOrc = (v: Venda): void => {
    chavesDe(v).forEach(k => { const a = pega(k); a.orc += v.orc; a.forecast += v.forecast; });
  };
  const somaAA = (v: Venda): void => {
    const vd = v.canal.toUpperCase().indexOf('VD') === 0;
    const mtd = v.data <= corteAA;
    chavesDe(v).forEach(k => {
      const a = pega(k);
      a.realAA += v.real;
      if (mtd) {
        a.realAAmtd += v.real;
        if (vd) a.realAAmtdVD += v.real; else a.realAAmtdVI += v.real;
      }
      if (vd) a.realAAVD += v.real; else a.realAAVI += v.real;
    });
  };
  vendas.forEach(v => { if (!corte || v.data <= corte) somaAtual(v); });
  if (shProj) plano.forEach(somaPlano); else vendas.forEach(somaPlano);
  if (shOrc) cota.forEach(somaOrc);
  vendasAA.forEach(somaAA);

  // BUs presentes na base, na ordem oficial do boletim
  const ordBU = ['CH', 'PP', 'SC', 'SG'];
  const busBase: string[] = [];
  vendas.concat(plano).forEach(v => { if (busBase.indexOf(v.bu) < 0) busBase.push(v.bu); });
  const bus = ordBU.filter(b => busBase.indexOf(b) >= 0);
  const semBU = ordBU.filter(b => busBase.indexOf(b) < 0);
  if (semBU.length) return vazio('BU sem venda na base: ' + semBU.join(', ') + '.');
  const temCobertura = busBase.indexOf('COBERTURA') >= 0;

  // total do boletim = BUs comerciais (a cobertura entra só na linha "Total")
  const totalSC = zero();
  bus.forEach(b => acumula(totalSC, mapa['BU|' + b]));
  const totalGeral = zero();
  acumula(totalGeral, totalSC);
  if (temCobertura) acumula(totalGeral, mapa['BU|COBERTURA']);

  // top N marcas por PROJETADO ATUAL + "Demais"
  const marcasPorBU: { [bu: string]: { nome: string; a: Agg }[] } = {};
  bus.forEach(bu => {
    const nomes: string[] = [];
    vendas.concat(plano).forEach(v => { if (v.bu === bu && nomes.indexOf(v.marca) < 0) nomes.push(v.marca); });
    const lista = nomes.map(n => ({ nome: n, a: mapa['MARCA|' + bu + '|' + n] || zero() }));
    lista.sort((x, y) => y.a.proj - x.a.proj);
    const topo = lista.slice(0, topN);
    const cauda = lista.slice(topN);
    if (cauda.length) {
      const d = zero();
      cauda.forEach(c => acumula(d, c.a));
      topo.push({ nome: 'Demais marcas', a: d });
    }
    marcasPorBU[bu] = topo;
  });

  // destaques automáticos: maior crescimento % entre marcas acima do valor mínimo
  const cand: { nome: string; cres: number }[] = [];
  bus.forEach(bu => {
    const nomes: string[] = [];
    vendas.concat(plano).forEach(v => { if (v.bu === bu && nomes.indexOf(v.marca) < 0) nomes.push(v.marca); });
    nomes.forEach(n => {
      const a = mapa['MARCA|' + bu + '|' + n];
      if (!a || a.proj < destMin || a.realAA <= 0) return;
      cand.push({ nome: n, cres: (a.proj / a.realAA - 1) * 100 });
    });
  });
  cand.sort((x, y) => y.cres - x.cres);
  const destaques: [string, number][] = cand.slice(0, destQtd).map(c => [c.nome, c.cres] as [string, number]);

  // ---------------- validação ----------------
  if (totalSC.proj <= 0) return vazio('a soma do PROJ_ATUAL das BUs ficou em zero — confira a aba Projeções.');
  if (totalSC.real <= 0) return vazio('a soma do REAL das BUs ficou em zero — confira a coluna REAL e a dataCorte.');
  const semAA = bus.filter(b => !mapa['BU|' + b] || mapa['BU|' + b].realAA <= 0);
  if (semAA.length) return vazio('BU sem realizado do ano anterior: ' + semAA.join(', ') + '.');
  const semCanal = ['VD', 'VI'].filter(c => !mapa['CANAL|' + c]);
  if (semCanal.length) return vazio('canal ausente na base: ' + semCanal.join(', ') + ' (esperado VD e VI na coluna CANAL).');

  // ---------------- e-mail ----------------
  const html = montarEmail(M, mapa, bus, temCobertura, totalSC, totalGeral, marcasPorBU, destaques, sublinhasSG(mapa, zero));
  const html2 = montarEmail(M, mapa, bus, temCobertura, totalSC, totalGeral, marcasPorBU, destaques, sublinhasSG(mapa, zero), true);
  const dc = String(M['dataCorte']);
  const p = dc.split('/');
  const ano = p[2] && p[2].length === 2 ? '20' + p[2] : (p[2] || '');
  const nomeArquivo = 'Boletim_Sell_Out_' + ano + (p[1] || '') + (p[0] || '') + '.pdf';

  // ---- histórico do portal: pasta ano/mês/dia + índice mesclado
  const mm = ('0' + Number(p[1] || 0)).slice(-2);
  const dd = ('0' + Number(p[0] || 0)).slice(-2);
  const raiz = (pastaPortal || 'edicoes').replace(/\/+$/, '');
  const pastaDia = raiz + '/' + ano + '/' + mm + '/' + dd;
  const id = ano + '-' + mm + '-' + dd;
  const arquivoEmail = pastaDia + '/email.html';
  const arquivoPdf = pastaDia + '/apresentacao.pdf';
  const arquivoBase = pastaDia + '/base.xlsx';
  const arquivoEmail2 = pastaDia + '/email-gestao-orcamentaria.html';
  const arquivoPdf2 = pastaDia + '/apresentacao-gestao-orcamentaria.pdf';
  const assunto = 'Boletim Sell Out | ' + M['referencia'] + ' — dados até ' + (p[0] || '') + '/' + (p[1] || '');

  return {
    enviar: true,
    motivo: '',
    assunto,
    nomeArquivo,
    html,
    referencia: String(M['referencia']),
    dataCorte: dc,
    destinatarios: M['destinatarios'] || '',
    pastaDia,
    arquivoEmail,
    arquivoPdf,
    arquivoBase,
    indice: mesclarIndice(indiceAtual, {
      id,
      data: dd + '/' + mm + '/' + ano.slice(2),
      referencia: String(M['referencia']),
      dataCorte: dc,
      enviadoEm: dd + '/' + mm + '/' + ano,
      email: arquivoEmail,
      pdf: arquivoPdf,
      base: arquivoBase,
      email2: arquivoEmail2,
      pdf2: arquivoPdf2,
      destinatarios: M['destinatarios'] || ''
    }),
    html2,
    assunto2: assunto + ' · Gestão Orçamentária',
    destinatarios2: M['destinatariosGO'] || M['destinatarios'] || '',
    arquivoEmail2,
    arquivoPdf2
  };
}

/** Registro de um dia no índice do portal. */
interface Registro {
  id: string;
  data: string;
  referencia: string;
  dataCorte: string;
  enviadoEm: string;
  email: string;
  pdf: string;
  base: string;
  email2: string;
  pdf2: string;
  destinatarios: string;
}

/**
 * Insere (ou substitui) o dia no índice do portal e devolve o JSON pronto para gravar.
 * Mais recente primeiro; um id por dia, então reexecutar o mesmo dia sobrescreve o registro.
 */
function mesclarIndice(atual: string, reg: Registro): string {
  let lista: Registro[] = [];
  const txt = (atual || '').trim();
  if (txt) {
    try {
      const bruto = JSON.parse(txt) as Registro[] | { edicoes: Registro[] };
      const arr = Array.isArray(bruto) ? bruto : (bruto && bruto.edicoes ? bruto.edicoes : []);
      lista = arr.filter(e => e && e.id && e.id !== reg.id);
    } catch (e) {
      lista = [];   // índice corrompido: reinicia com o dia atual em vez de travar o envio
    }
  }
  lista.push(reg);
  lista.sort((a, b) => a.id < b.id ? 1 : (a.id > b.id ? -1 : 0));
  return JSON.stringify({ atualizadoEm: reg.enviadoEm, edicoes: lista }, null, 2);
}

// ================= leitura =================

function aba(wb: ExcelScript.Workbook, nomes: string[]): ExcelScript.Worksheet | undefined {
  for (const n of nomes) {
    const s = wb.getWorksheet(n);
    if (s) return s;
  }
  return undefined;
}

/** Lê uma aba transacional pelos nomes de coluna do cabeçalho (ordem livre). */
function lerVendas(sh: ExcelScript.Worksheet, divisor: number): Venda[] {
  const grade = sh.getUsedRange().getValues();
  if (grade.length < 2) return [];
  const head = grade[0].map(c => String(c).trim().toUpperCase().replace(/\s+/g, '_'));
  const col = (...alt: string[]): number => {
    for (const a of alt) {
      const i = head.indexOf(a);
      if (i >= 0) return i;
    }
    return -1;
  };
  const iData = col('DATA', 'DIA');
  const iBU = col('BU');
  const iMarca = col('MARCA');
  const iSku = col('SKU');
  const iCanal = col('CANAL');
  const iCli = col('CLIENTE', 'REDE');
  const iReal = col('VALOR_REAL', 'REAL');
  const iIni = col('VALOR_PROJETADO_INICIAL', 'PROJ_INICIAL', 'PROJETADO_INICIAL');
  const iProj = col('VALOR_PROJETADO_ATUAL', 'PROJ_ATUAL', 'PROJETADO_ATUAL');
  const iOrc = col('ORCAMENTO', 'ORÇAMENTO', 'ORC');
  const iFcst = col('FORECAST', 'FCST', 'ORCAMENTO_REPROJETADO');
  const out: Venda[] = [];
  for (let i = 1; i < grade.length; i++) {
    const l = grade[i];
    const bu = iBU >= 0 ? String(l[iBU]).trim().toUpperCase() : '';
    if (!bu) continue;
    out.push({
      data: iData >= 0 && typeof l[iData] === 'number' ? l[iData] as number : 0,
      bu: buConsolidada(bu),
      sub: subCanon(bu),
      marca: iMarca >= 0 ? String(l[iMarca]).trim().toUpperCase() : 'NÃO INFORMADA',
      sku: iSku >= 0 ? String(l[iSku]).trim() : '',
      canal: iCanal >= 0 ? String(l[iCanal]).trim().toUpperCase() : 'VD',
      cliente: iCli >= 0 ? String(l[iCli]).trim().toUpperCase() : 'OUTROS',
      real: val(l, iReal, divisor),
      projIni: val(l, iIni, divisor),
      proj: val(l, iProj, divisor),
      orc: val(l, iOrc, divisor),
      forecast: val(l, iFcst, divisor)
    });
  }
  return out;
}

/** Aceita a sublinha com ou sem acento e devolve o rótulo publicado no boletim. */
function subCanon(bu: string): string {
  if (bu === 'SG - GENERICOS') return 'SG - GENÉRICOS';
  if (bu === 'VIT NEO QUIMICA') return 'VIT NEO QUÍMICA';
  return bu;
}

/** SG chega quebrada em três BUs na planilha; o boletim publica SG consolidada. */
function buConsolidada(bu: string): string {
  return SUB_SG.indexOf(bu) >= 0 ? 'SG' : bu;
}

/** Linhas de detalhe de SG, derivadas das próprias vendas (não há mais aba Sublinhas). */
function sublinhasSG(mapa: { [k: string]: Agg }, zero: () => Agg): { rotulo: string; a: Agg }[] {
  const soma = (rots: string[]): Agg => {
    const a = zero();
    rots.forEach(r => acumula(a, mapa['SUB|' + r]));
    return a;
  };
  const out: { rotulo: string; a: Agg }[] = [];
  const add = (rot: string, a: Agg): void => { if (a.realAA > 0 || a.proj > 0 || a.real > 0) out.push({ rotulo: rot, a }); };
  add('SG - GENÉRICOS', soma(['SG - GENÉRICOS']));
  add('SG - SIMILARES', soma(['SG - SMART (EX-VIT)', 'VIT NEO QUÍMICA']));
  add('SMART (EX-VIT)', soma(['SG - SMART (EX-VIT)']));
  add('VIT NEO QUÍMICA', soma(['VIT NEO QUÍMICA']));
  return out;
}

function val(l: (string | number | boolean)[], i: number, divisor: number): number {
  if (i < 0) return 0;
  const v = l[i];
  return typeof v === 'number' ? v / divisor : 0;
}

/** dd/mm/aa ou dd/mm/aaaa -> serial do Excel (base 1899-12-30). */
function serial(txt: string): number {
  const p = String(txt).split('/');
  if (p.length < 3) return 0;
  const d = Number(p[0]), m = Number(p[1]);
  let y = Number(p[2]);
  if (y < 100) y += 2000;
  const ms = Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30);
  return Math.round(ms / 86400000);
}

function acumula(alvo: Agg, fonte: Agg | undefined): void {
  if (!fonte) return;
  alvo.realAA += fonte.realAA; alvo.realAAmtd += fonte.realAAmtd; alvo.real += fonte.real;
  alvo.realAAmtdVD += fonte.realAAmtdVD; alvo.realAAmtdVI += fonte.realAAmtdVI;
  alvo.proj += fonte.proj; alvo.projIni += fonte.projIni; alvo.orc += fonte.orc; alvo.forecast += fonte.forecast;
  alvo.projVD += fonte.projVD; alvo.projVI += fonte.projVI;
  alvo.realVD += fonte.realVD; alvo.realVI += fonte.realVI;
  alvo.realAAVD += fonte.realAAVD; alvo.realAAVI += fonte.realAAVI;
}

// ================= formatação =================

function fmt(v: number | null): string {
  return typeof v === 'number' && isFinite(v) ? v.toFixed(1).replace('.', ',') : '-';
}

function pct(v: number | null): string {
  return typeof v === 'number' && isFinite(v) ? v.toFixed(1).replace('.', ',') + '%' : '-';
}

function cor(v: number | null): string {
  if (typeof v !== 'number' || !isFinite(v)) return '#8A8C8E';
  return v < 0 ? '#B32B23' : '#17734A';
}

/** variação % de a base b; null quando a base é zero. */
function varia(valor: number, base: number): number | null {
  return base > 0 ? (valor / base - 1) * 100 : null;
}

function share(parte: number, todo: number): number | null {
  return todo > 0 ? (parte / todo) * 100 : null;
}

function esc(s: string | number | null | undefined): string {
  return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

// ================= e-mail =================

function montarEmail(
  M: { [k: string]: string },
  mapa: { [k: string]: Agg },
  bus: string[],
  temCobertura: boolean,
  totalSC: Agg,
  totalGeral: Agg,
  marcasPorBU: { [bu: string]: { nome: string; a: Agg }[] },
  destaques: [string, number][],
  sublinhas: { rotulo: string; a: Agg }[],
  g2?: boolean
): string {
  const moeda = M['moeda'] || 'R$ milhões (PX)';
  const fonte = M['fonte'] || 'Dados IQVIA | Base MDTR Diário';

  const cel = (t: string, o?: { a?: string; fs?: number; c?: string; b?: boolean; p?: string; bd?: string; bg?: string }): string => {
    const q = o || {};
    return '<td align="' + (q.a || 'center') + '" style="font-size:' + (q.fs || 14) + 'px;line-height:20px;'
      + 'mso-line-height-rule:exactly;color:' + (q.c || '#292A2B') + ';font-weight:' + (q.b ? 'bold' : 'normal')
      + ';padding:' + (q.p || '5px 4px') + ';' + (q.bg ? 'background-color:' + q.bg + ';' : '')
      + (q.bd || 'border-bottom:1px solid #EFEFEF;') + '">' + t + '</td>';
  };
  const th = (t: string): string =>
    '<th align="center" style="font-size:11px;line-height:17px;mso-line-height-rule:exactly;font-weight:bold;'
    + 'color:#0062AA;padding:4px 4px 6px;border-bottom:1.5px solid #00BFDF;">' + t + '</th>';

  /** linha de BU (agregada) + as linhas de marca abaixo dela */
  const linhaNivel = (rotulo: string, a: Agg, o: { cBase: string; forte?: boolean; fs?: number; bd?: string; bg?: string; recuo?: boolean; rep?: number | null }): string => {
    const q = o;
    const pProj = varia(a.proj, a.realAA);
    const pIni = varia(a.projIni, a.realAA);
    const pOrc = a.orc > 0 ? varia(a.orc, a.realAA) : null;
    const vsFcst = a.forecast > 0 ? (a.proj / a.forecast - 1) * 100 : null;
    const base = { c: q.cBase, b: q.forte, fs: q.fs, bd: q.bd, bg: q.bg };
    const nome = q.recuo
      ? '&#8226; ' + esc(rotulo) + (q.rep !== null && q.rep !== undefined ? ' <span style="color:#8A8C8E;">' + pct(q.rep) + '</span>' : '')
      : '<strong>' + esc(rotulo) + '</strong>';
    return '<tr>'
      + cel(nome, { a: 'left', c: q.recuo ? '#434445' : q.cBase, b: !q.recuo, fs: q.fs, bd: q.bd, bg: q.bg, p: q.recuo ? '4px 4px 4px 14px' : '5px 4px 5px 0' })
      + cel(fmt(a.realAA), base)
      + cel(fmt(a.real), base)
      + cel(fmt(a.proj), base)
      + cel(pct(pProj), { c: cor(pProj), b: true, fs: q.fs, bd: q.bd, bg: q.bg })
      + cel(a.projIni > 0 ? fmt(a.projIni) : '-', base)
      + cel(pct(pIni), { c: cor(pIni), b: true, fs: q.fs, bd: q.bd, bg: q.bg })
      + cel(a.orc > 0 ? fmt(a.orc) : '-', base)
      + cel(pct(pOrc), { c: cor(pOrc), b: true, fs: q.fs, bd: q.bd, bg: q.bg })
      + (g2
        ? cel(a.forecast > 0 ? fmt(a.forecast) : '-', base)
          + cel(pct(vsFcst), { c: cor(vsFcst), b: true, fs: q.fs, bd: q.bd, bg: q.bg })
        : '')
      + cel(pct(share(a.projVD, a.proj)), base)
      + cel(pct(share(a.projVI, a.proj)), { c: q.cBase, b: q.forte, fs: q.fs, bd: q.bd, bg: q.bg, p: '5px 0 5px 4px' })
      + '</tr>';
  };

  let linhas = '';
  bus.forEach(bu => {
    const a = mapa['BU|' + bu];
    linhas += linhaNivel(bu, a, { cBase: '#0062AA', forte: true });
    (marcasPorBU[bu] || []).forEach(m => {
      linhas += linhaNivel(m.nome, m.a, {
        cBase: '#5D5F61', fs: 13, bd: 'border-bottom:1px solid #F2F7FB;', bg: '#F7FBFE',
        recuo: true, rep: share(m.a.proj, a.proj)
      });
    });
  });
  if (temCobertura) {
    linhas += linhaNivel('COBERTURA*', mapa['BU|COBERTURA'], { cBase: '#5D5F61' });
  }
  sublinhas.forEach(s => {
    linhas += linhaNivel(s.rotulo, s.a, { cBase: '#5D5F61' });
  });
  linhas += linhaNivel('Total', totalGeral, { cBase: '#292A2B', forte: true, bd: 'border-bottom:1px solid #EFEFEF;' });
  linhas += linhaNivel('Total s/ Cobertura', totalSC, { cBase: '#292A2B', forte: true, bd: 'border-bottom:1.5px solid #00BFDF;' });

  const celulas = destaques.map(d =>
    '<td width="33%" style="width:33%;padding:5px 12px 5px 0;font-size:14px;line-height:20px;'
    + 'mso-line-height-rule:exactly;color:#292A2B;border-bottom:1px solid #EFEFEF;">' + esc(d[0])
    + ' <span style="font-weight:bold;color:' + cor(d[1]) + ';">' + pct(d[1]) + '</span></td>');
  const linhasDest: string[] = [];
  for (let i = 0; i < celulas.length; i += 3) linhasDest.push('<tr>' + celulas.slice(i, i + 3).join('') + '</tr>');

  const botao = (href: string, texto: string, primario: boolean): string =>
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:'
    + (primario ? '#0062AA' : '#FFFFFF') + ';border:1px solid ' + (primario ? '#0062AA' : '#A9D0EE')
    + ';border-radius:8px;"><tr><td align="center" valign="middle" height="56" style="height:56px;padding:0 18px;'
    + 'font-family:Calibri,Arial,Helvetica,sans-serif;"><a href="' + esc(href) + '" style="display:block;font-size:18px;'
    + 'line-height:26px;mso-line-height-rule:exactly;font-weight:bold;color:' + (primario ? '#FFFFFF' : '#0062AA')
    + ';text-decoration:none;text-align:center;">' + texto + '</a></td></tr></table>';

  const pMTD = varia(totalSC.real, totalSC.realAAmtd);
  const pMes = varia(totalSC.proj, totalSC.realAA);
  // mesmas medidas dos cartões da apresentação
  const ating = totalSC.orc > 0 ? (totalSC.proj / totalSC.orc) * 100 : null;      // % da cota
  const gapOrc = totalSC.orc > 0 ? totalSC.proj - totalSC.orc : null;             // R$ mi vs. orçamento
  const revProj = totalSC.projIni > 0 ? totalSC.proj - totalSC.projIni : null;    // R$ mi vs. projeção inicial

  // cartões idênticos aos do modelo aprovado (boletim-sell-out-email.html / Atualizador)
  const coluna = (rot: string, total: number, vi: number, vd: number, esc1: number): string => {
    const h = (v: number): number => Math.max(18, Math.round(v * esc1));
    return '<td width="56" valign="bottom" style="width:56px;padding:0 7px;">'
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="56" style="width:56px;">'
      + '<tr><td align="center" style="font-family:Calibri,Arial,sans-serif;font-size:14px;line-height:19px;font-weight:bold;color:#074878;padding-bottom:4px;">' + fmt(total) + '</td></tr>'
      + '<tr><td height="' + h(vi) + '" align="center" bgcolor="#074878" style="height:' + h(vi) + 'px;font-family:Calibri,Arial,sans-serif;font-size:13px;line-height:' + h(vi) + 'px;mso-line-height-rule:exactly;font-weight:bold;color:#FFFFFF;">' + fmt(vi) + '</td></tr>'
      + '<tr><td height="' + h(vd) + '" align="center" bgcolor="#A9D0EE" style="height:' + h(vd) + 'px;font-family:Calibri,Arial,sans-serif;font-size:13px;line-height:' + h(vd) + 'px;mso-line-height-rule:exactly;font-weight:bold;color:#074878;">' + fmt(vd) + '</td></tr>'
      + '<tr><td align="center" style="font-family:Calibri,Arial,sans-serif;font-size:11px;line-height:17px;color:#5D5F61;padding-top:4px;">' + rot + '</td></tr>'
      + '</table></td>';
  };
  const cartao = (rot: string, val: number, sub: string, p: number | null, aa: { t: number; vi: number; vd: number },
    at: { t: number; vi: number; vd: number }, rotAA: string, rotAt: string, rodape: string): string => {
    const escala = 62 / Math.max(aa.vi, aa.vd, at.vi, at.vd, 1);
    return '<td class="kpi" width="33%" valign="top" bgcolor="#EDF6FC" style="width:33%;background-color:#EDF6FC;border-radius:8px;'
      + 'padding:16px 16px 14px;border-left:6px solid #FFFFFF;border-right:6px solid #FFFFFF;font-family:Calibri,Arial,sans-serif;">'
      + '<div style="font-size:13px;line-height:18px;letter-spacing:1px;text-transform:uppercase;color:#5D5F61;font-weight:bold;">' + rot + '</div>'
      + '<div style="font-size:36px;line-height:42px;mso-line-height-rule:exactly;font-weight:bold;color:#074878;padding-top:4px;">' + fmt(val) + '</div>'
      + '<div style="font-size:14px;line-height:19px;color:#5D5F61;">' + sub + '</div>'
      + '<div style="font-size:16px;line-height:22px;font-weight:bold;color:' + cor(p) + ';padding:6px 0 12px;">' + pct(p) + ' vs AA</div>'
      + '<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>'
      + coluna(rotAA, aa.t, aa.vi, aa.vd, escala) + coluna(rotAt, at.t, at.vi, at.vd, escala)
      + '</tr></table>'
      + '<div style="font-size:13px;line-height:19px;color:#5D5F61;padding-top:8px;">' + rodape + '</div></td>';
  };

  const mtgAA = totalSC.realAA - totalSC.realAAmtd;
  const mtg = totalSC.proj - totalSC.real;
  const pMtg = varia(mtg, mtgAA);
  const cartoes = '<tr><td class="pad" style="padding:22px 18px 0;font-family:Calibri,Arial,Helvetica,sans-serif;">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>'
    + cartao('Projeção do mês', totalSC.proj, esc(moeda) + ', s/ cobertura', pMes,
      { t: totalSC.realAA, vi: totalSC.realAAVI, vd: totalSC.realAAVD },
      { t: totalSC.proj, vi: totalSC.projVI, vd: totalSC.projVD }, 'AA', 'Projetado',
      'VD ' + pct(varia(totalSC.projVD, totalSC.realAAVD)) + ' &#183; VI ' + pct(varia(totalSC.projVI, totalSC.realAAVI)))
    + cartao('Realizado', totalSC.real, esc(moeda) + ', até ' + esc(M['dataCorte']), pMTD,
      { t: totalSC.realAAmtd, vi: totalSC.realAAmtdVI, vd: totalSC.realAAmtdVD },
      { t: totalSC.real, vi: totalSC.realVI, vd: totalSC.realVD }, 'MTD AA', 'Realizado',
      esc(M['diasUteis']) + ' dias úteis &#183; MTD AA: ' + esc(M['diasUteisAA']) + ' dias úteis')
    + cartao('MTG', mtg, esc(moeda) + ', Projetado &#8722; Realizado', pMtg,
      { t: mtgAA, vi: totalSC.realAAVI - totalSC.realAAmtdVI, vd: totalSC.realAAVD - totalSC.realAAmtdVD },
      { t: mtg, vi: totalSC.projVI - totalSC.realVI, vd: totalSC.projVD - totalSC.realVD }, 'MTG AA', 'MTG',
      'Cota: <strong>' + (ating === null ? '-' : fmt(ating) + '%') + '</strong> &#183; gap '
      + (gapOrc === null ? '-' : (gapOrc > 0 ? '+' : '') + fmt(gapOrc)) + ' &#183; revisão '
      + (revProj === null ? '-' : (revProj > 0 ? '+' : '') + fmt(revProj)) + ' vs. inicial')
    + '</tr></table></td></tr>\n';

  return '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
    + '<title>Boletim Sell Out - ' + esc(M['dataCorte']) + '</title>\n'
    + '<style>@media only screen and (max-width:620px){.wrap{width:100% !important}'
    + '.pad{padding-left:16px !important;padding-right:16px !important}'
    + '.tbl td,.tbl th{font-size:10px !important;padding:4px 2px !important}}</style>\n</head>\n'
    + '<body style="margin:0;padding:0;background-color:#FFFFFF;">\n'
    + '<span style="display:none;font-size:1px;color:#FFF;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">'
    + 'Boletim Sell Out de ' + esc(M['referencia']) + ' atualizado com dados até ' + esc(M['dataCorte']) + '.</span>\n'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="left">\n'
    + '<table role="presentation" class="wrap" cellpadding="0" cellspacing="0" border="0" width="980" style="width:980px;max-width:980px;">\n'
    + '<tr><td height="26" style="height:26px;line-height:26px;font-size:0;background-color:#0A3D80;'
    + 'background-image:linear-gradient(90deg,#0A3D80 0%,#0B4C97 35%,#0062AA 60%,#08356E 100%);'
    + 'border-bottom:2px solid #00BFDF;">&nbsp;</td></tr>\n'
    + '<tr><td class="pad" style="padding:22px 24px 0;font-family:Calibri,Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#292A2B;">'
    + '<p style="margin:0 0 14px;">Prezados,<br>Tudo bem?</p>'
    + '<p style="margin:0 0 14px;">O link do Boletim Sell Out de <strong>' + esc(M['referencia'])
    + '</strong> atualizado com dados até <strong>' + esc(M['dataCorte'])
    + '</strong> está disponível no HUB na área Corp. Clique aqui para acessar: <a href="' + esc(M['hub'])
    + '" style="color:#0062AA;text-decoration:underline;font-weight:bold;">HUB ' + esc(M['referencia']) + ' &#8211; PX</a></p>'
    + '<p style="margin:0 0 18px;">Aproveito para compartilhar o link dos <strong>novos relatórios executivos</strong> '
    + 'para acompanhamento integrado da performance de Sell-Out e Gestão Orçamentaria. <a href="' + esc(M['executivos'])
    + '" style="color:#0062AA;text-decoration:underline;font-weight:bold;">Clique aqui</a></p>'
    + (M['deck'] || M['pdf']
      ? '<p style="margin:0 0 14px;">A apresentação completa do dia, com o ritmo diário e a abertura por marca e rede, está em '
        + '<a href="' + esc(M['deck'] || M['pdf']) + '" style="color:#0062AA;text-decoration:underline;font-weight:bold;">'
        + 'Boletim Sell Out &#8211; ' + esc(M['referencia']) + '</a>.</p>'
      : '')
    + '<p style="margin:0 0 4px;font-size:15px;line-height:22px;">No mês, o realizado acumulado é de <strong>R$ '
    + fmt(totalSC.real) + ' mi</strong> (' + pct(pMTD) + ' vs. mesmo período do ano anterior) e a projeção fechada do mês é de <strong>R$ '
    + fmt(totalSC.proj) + ' mi</strong> (' + pct(pMes) + ' vs. ano anterior).</p>'
    + '</td></tr>\n'
    + cartoes
    + (M['consideracoes']
      ? '<tr><td class="pad" style="padding:14px 24px 0;font-family:Calibri,Arial,Helvetica,sans-serif;">'
        + '<div style="font-size:18px;line-height:26px;font-weight:bold;color:#0062AA;padding-bottom:6px;">Considerações</div>'
        + '<div style="height:2px;background-color:#00BFDF;font-size:0;line-height:2px;">&nbsp;</div>'
        + '<p style="margin:12px 0 0;font-size:15px;line-height:22px;color:#292A2B;">' + esc(M['consideracoes']) + '</p></td></tr>\n'
      : '')
    + '<tr><td class="pad" style="padding:26px 24px 0;font-family:Calibri,Arial,Helvetica,sans-serif;">'
    + '<div style="font-size:18px;line-height:26px;font-weight:bold;color:#0062AA;">Crescimento BUs '
    + '<span style="font-weight:normal;font-size:14px;color:#5D5F61;">(' + esc(moeda) + ')</span></div>'
    + '<div style="font-size:13px;line-height:18px;color:#5D5F61;padding-top:2px;">Abaixo de cada BU, as '
    + esc(M['topMarcas'] || '5') + ' maiores marcas por projetado atual; as outras aparecem agrupadas em "Demais marcas". '
    + 'O % ao lado da marca é sua representatividade na BU.</div>'
    + '<table role="presentation" class="tbl" cellpadding="0" cellspacing="0" border="0" width="100%" '
    + 'style="width:100%;table-layout:fixed;border-collapse:collapse;font-family:Calibri,Arial,Helvetica,sans-serif;margin-top:12px;">'
    + '<colgroup>' + (g2
      ? ['19%', '7.5%', '7%', '7%', '6%', '7.5%', '6%', '7%', '6.5%', '7%', '6%', '7%', '6.5%']
      : ['22%', '8.5%', '8%', '8%', '6.5%', '8.5%', '6.5%', '7.5%', '7.5%', '8.5%', '8.5%']
      ).map(w => '<col style="width:' + w + '">').join('') + '</colgroup><tr>'
    + ['BU / MARCA', 'REALIZADO AA', 'REALIZADO', 'PROJETADO', '% PROJ', 'PROJ. INICIAL', '% PROJ', 'ORÇ. ABS', '% CRES ORÇ']
      .concat(g2 ? ['FORECAST', '% FCST'] : []).concat(['VD', 'VI']).map(th).join('')
    + '</tr>' + linhas + '</table>'
    + (temCobertura ? '<div style="font-size:12px;line-height:17px;font-weight:bold;color:#0062AA;padding-top:6px;">'
      + '*A cobertura não está incluída no Power BI do Boletim Sell Out.</div>' : '')
    + '<div style="font-size:12px;line-height:17px;color:#5D5F61;padding-top:4px;">Fonte: ' + esc(fonte)
    + '. Realizado atual: ' + esc(M['diasUteis']) + ' dias úteis. MTD ano anterior: ' + esc(M['diasUteisAA']) + ' dias úteis. '
    + 'Todos os números são calculados a partir da base diária de vendas (dia × BU × marca × SKU × canal × cliente).</div>'
    + '</td></tr>\n'
    + (linhasDest.length
      ? '<tr><td class="pad" style="padding:26px 24px 0;font-family:Calibri,Arial,Helvetica,sans-serif;">'
        + '<div style="font-size:18px;line-height:26px;font-weight:bold;color:#0062AA;padding-bottom:4px;">Destaques por marca '
        + '<span style="font-weight:normal;font-size:14px;color:#5D5F61;">(% projetado vs AA · marcas acima de R$ '
        + fmt(M['destaqueMinimo'] ? Number(M['destaqueMinimo']) : 2) + ' mi)</span></div>'
        + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" '
        + 'style="border-collapse:collapse;font-family:Calibri,Arial,Helvetica,sans-serif;">' + linhasDest.join('') + '</table></td></tr>\n'
      : '')
    + '<tr><td class="pad" style="padding:26px 18px 0;font-family:Calibri,Arial,Helvetica,sans-serif;">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>'
    + '<td valign="top" style="padding:0 6px;">' + botao(M['hub'] || '#', 'Acesse o Boletim on-line', true) + '</td>'
    + '<td valign="top" style="padding:0 6px;">' + botao(M['executivos'] || '#', 'Demais relatórios de IM&amp;P', false) + '</td>'
    + (M['pdf'] || M['deck']
      ? '<td valign="top" style="padding:0 6px;">' + botao(M['pdf'] || M['deck'], 'Apresentação do dia (PDF)', false) + '</td>'
      : '')
    + '</tr></table></td></tr>\n'
    + '<tr><td class="pad" style="padding:26px 24px 30px;font-family:Calibri,Arial,Helvetica,sans-serif;">'
    + '<div style="height:1px;background-color:#EFEFEF;font-size:0;line-height:1px;">&nbsp;</div>'
    + '<p style="margin:16px 0 0;font-size:15px;line-height:21px;color:#292A2B;"><strong>' + esc(M['assinaturaNome'])
    + '</strong><br><span style="color:#5D5F61;">' + esc(M['assinaturaArea']) + '</span><br>'
    + '<a href="mailto:' + esc(M['assinaturaEmail']) + '" style="color:#0062AA;text-decoration:underline;">'
    + esc(M['assinaturaEmail']) + '</a></p></td></tr>\n'
    + '</table></td></tr></table>\n</body>\n</html>\n';
}
