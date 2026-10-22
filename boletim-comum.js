/* Boletim Sell Out — métodos comuns às duas apresentações (comercial e gestão orçamentária).
 * Carregado pelas páginas e incorporado à instância em _wait() via _mixin().
 * Métodos definidos na própria página têm prioridade sobre os daqui. */
window.BoletimComum = class {
  // ---------- acesso à base ----------
  _get(bu, marca, rede) { return this._idx[bu + '|' + marca + '|' + rede] || null; }

  _fmt(v, d) { return v == null ? '-' : v.toFixed(d == null ? 1 : d).replace('.', ','); }

  _pct(v) { return v == null ? '-' : (v > 0 ? '' : '') + v.toFixed(1).replace('.', ',') + '%'; }

  _cor(v) { return v == null ? '#8A8C8E' : (v < 0 ? '#B32B23' : '#17734A'); }

  // % publicado no boletim quando existe; senão deriva de realizado AA
  _cres(r, campo) {
    if (!r) return null;
    const pub = { proj: 'pProj', projIni: 'pIni', orcAbs: 'pOrc' }[campo];
    if (pub && r[pub] != null) return r[pub];
    const a = r.realAA, b = r[campo];
    return (a && b != null && a !== 0) ? (b / a - 1) * 100 : null;
  }

  _cell(v, d) { return { t: this._fmt(v, d) }; }

  _cellP(v) { return { t: this._pct(v), cor: this._cor(v) }; }

  _render() {
    const B = window.BASE_BOLETIM, M = B.META, C = B.COLUNAS;
    // realizado acima do projetado: projeção passa a ser o realizado
    { const iR = C.indexOf('real'), iP = C.indexOf('proj'), iA = C.indexOf('realAA'), iV = C.indexOf('pProj');
      B.FATOS.forEach(r => { if (r[iR] != null && r[iP] != null && r[iR] > r[iP]) { r[iP] = r[iR]; if (iV >= 0 && r[iA] > 0) r[iV] = Math.round((r[iR] / r[iA] - 1) * 1000) / 10; } }); }
    this._idx = {};
    B.FATOS.forEach(f => { const o = {}; C.forEach((c, i) => o[c] = f[i]); this._idx[o.bu + '|' + o.marca + '|' + o.rede] = o; });
    const F = B.FATOS.map(f => { const o = {}; C.forEach((c, i) => o[c] = f[i]); return o; });
    const $ = id => document.getElementById(id);

    $('capaRef').textContent = M.referencia;
    $('capaSelo').textContent = 'Dados até ' + M.dataCorte + ' · ' + M.diasUteis + ' dias úteis';
    { const p = $('capaPub'); if (p) p.textContent = 'Publicado em ' + (M.atualizadoEm || new Date().toLocaleDateString('pt-BR')); }
    document.querySelectorAll('.hy-fonte').forEach(e => { e.textContent = 'Fonte: ' + M.fonte + '. Realizado atual: ' + M.diasUteis + ' dias úteis · MTD ano anterior: ' + M.diasUteisAA + ' dias úteis.'; });
    $('rodape2').textContent = 'Fonte: ' + M.fonte + '. Valores em ' + M.moeda + '.';
    this._sumario(F, M);

    document.querySelectorAll('[data-tbl]').forEach(el => {
      const spec = el.getAttribute('data-tbl'), bu = spec.split(':')[1];
      if (spec === 'bu') this._tblBU(el, F);
      else if (spec === 'canal') this._tblCanal(el, F);
      else if (spec.startsWith('pb:')) this._tblPB(el, F, bu);
      else if (spec.startsWith('mx:')) this._tblMx(el, F, bu);
      else if (spec.startsWith('hm:')) this._tblHeat(el, F, bu);
    });

    document.querySelectorAll('[data-cards="bu"]').forEach(el => this._cardsBU(el, F));
    document.querySelectorAll('[data-cards="canal"]').forEach(el => this._cardsCanal(el));
  }

  /** Highlights da slide de canais. */
  _cardsCanal(el) {
    const nomes = ['DROGASIL', 'DELIVERY', 'PAGUE MENOS', 'DROGARIA SAO PAULO', 'RAIA', 'SAO JOAO', 'PANVEL', 'PACHECO', 'DROGAL', 'ARAUJO'];
    const lista = nomes.map(k => ({ k, r: this._get('TOTAL', 'TOTAL', k) })).filter(x => x.r);
    const porMtd = lista.filter(x => x.k !== 'DELIVERY').sort((a, b) => (b.r.cresc || -999) - (a.r.cresc || -999));
    const porProj = lista.slice().sort((a, b) => (b.r.proj || 0) - (a.r.proj || 0));
    const vd = this._get('TOTAL', 'TOTAL', 'VD') || {}, vi = this._get('TOTAL', 'TOTAL', 'VI') || {};
    const curto = k => k === 'DROGARIA SAO PAULO' ? 'DROGARIA SP' : k;
    const alta = porMtd[0], baixa = porMtd[porMtd.length - 1], lider = porProj[0];
    const gapR = lista.map(x => ({ k: x.k, v: x.r.realAA != null && x.r.proj != null ? x.r.proj - x.r.realAA : null }))
      .filter(x => x.v != null).sort((a, b) => a.v - b.v)[0];
    this._cards(el, [
      { rot: 'Maior crescimento', val: this._pct(alta.r.cresc), un: 'MTD', sub: curto(alta.k), corSub: this._cor(alta.r.cresc), leg: '' },
      { rot: 'Maior queda', val: this._pct(baixa.r.cresc), un: 'MTD', sub: curto(baixa.k), corSub: this._cor(baixa.r.cresc), leg: '' },
      { rot: 'Rede líder', val: this._fmt(lider.r.proj), un: 'R$ mi', sub: curto(lider.k), corSub: '#0062AA', leg: '' },
      { rot: 'Maior gap', val: gapR ? (gapR.v > 0 ? '+' : '') + this._fmt(gapR.v) : '-', un: 'R$ mi', sub: gapR ? curto(gapR.k) : '', corSub: gapR ? this._cor(gapR.v) : '#0062AA', leg: '' }
    ], 200);
  }

  /** Card padrão de highlight. */
  _cards(el, cards, alt) {
    const den = alt && alt < 220;
    const gap = den ? 9 : 14, pad = den ? '18px 24px 16px' : '24px 26px 22px', legFs = 24;
    el.innerHTML = cards.map(c =>
      '<div style="background:#F7FBFE; border:1px solid #DCEAF6; border-top:4px solid #00BFDF; border-radius:14px; padding:' + pad + '; display:flex; flex-direction:column; gap:' + gap + 'px; min-height:' + (alt || 300) + 'px; box-sizing:border-box;">'
      + '<div style="font-size:24px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#0062AA; line-height:1.15;">' + c.rot + '</div>'
      + '<div style="display:flex; align-items:baseline; gap:10px;">'
      + '<span style="font-size:' + (String(c.val).length > 11 ? 34 : 46) + 'px; font-weight:700; color:#292A2B; line-height:1.05; font-variant-numeric:tabular-nums;">' + c.val + '</span>'
      + (c.un ? '<span style="font-size:24px; font-weight:600; color:#5D5F61;">' + c.un + '</span>' : '') + '</div>'
      + '<div style="font-size:30px; font-weight:700; color:' + c.corSub + '; line-height:1; font-variant-numeric:tabular-nums;">' + c.sub + '</div>'
      + '<div style="margin-top:auto; font-size:' + legFs + 'px; line-height:1.28; color:#5D5F61;">' + c.leg + '</div>'
      + '</div>').join('');
  }

  _tblCanal(el, F) {
    const redes = ['DROGASIL', 'PAGUE MENOS', 'DROGARIA SAO PAULO', 'RAIA', 'SAO JOAO', 'PANVEL', 'PACHECO', 'DROGAL', 'ARAUJO', 'DELIVERY', 'OUTROS', 'VD', 'VI', 'TOTAL'];
    const rows = redes.map(k => {
      const r = this._get('TOTAL', 'TOTAL', k); if (!r) return null;
      const tot = k === 'VD' || k === 'VI' || k === 'TOTAL';
      return {
        style: { rule: k === 'OUTROS' || k === 'VI', bold: tot },
        cells: [{ t: k === 'VD' ? 'TOTAL VD' : (k === 'VI' ? 'INDEPENDENTES' : (k === 'DROGARIA SAO PAULO' ? 'DROGARIA SP' : k)), cor: tot ? '#292A2B' : '#0062AA' },
          this._cell(r.realAA), this._cell(r.real), this._cell(r.proj), this._cellP(this._cres(r, 'proj')), this._cellP(r.cresc),
          ...['CH', 'PP', 'SC', 'SG'].map(b => { const x = this._get(b, 'TOTAL', k); return this._cellP(x ? (k === 'TOTAL' ? this._cres(x, 'proj') : x.cresc) : null); })]
      };
    }).filter(Boolean);
    this._tbl(el, ['REDE', 'REAL. AA', 'REALIZADO', 'PROJETADO', '% PROJ', 'MTD 26/25', 'CH', 'PP', 'SC', 'SG'], rows);
  }

  _tblPB(el, F, bu) {
    const rows = F.filter(x => x.bu === bu && x.rede === 'TOTAL' && x.marca !== 'TOTAL' && x.marca !== 'TOTAL PB')
      .concat(F.filter(x => x.bu === bu && x.rede === 'TOTAL' && x.marca === 'TOTAL PB'))
      .map(r => ({
        style: { bold: r.marca === 'TOTAL PB', rule: r.marca === 'DEMAIS' },
        cells: [{ t: r.marca === 'TOTAL PB' ? 'TOTAL' : (r.marca === 'DEMAIS' ? 'DEMAIS MARCAS' : r.marca), cor: r.marca === 'TOTAL PB' ? '#292A2B' : '#0062AA' },
          this._cell(r.realAA), this._cell(r.real), this._cell(r.proj), this._cellP(this._cres(r, 'proj')), this._cellP(r.cresc),
          { t: this._pct(r.vd) }, { t: this._pct(r.vi) }]
      }));
    this._tbl(el, ['MARCA', 'REAL. AA', 'REALIZADO', 'PROJETADO', '% PROJ', 'MTD 26/25', 'VD', 'VI'], rows);
  }

  _faixas() {
    return [
      { lim: -20, bg: '#F6D9D4', rot: 'abaixo de -20%' },
      { lim: -5, bg: '#FBEBE8', rot: '-20% a -5%' },
      { lim: 5, bg: '#F2F4F5', rot: '-5% a 5%' },
      { lim: 20, bg: '#E7F5EC', rot: '5% a 20%' },
      { lim: Infinity, bg: '#CFEBDA', rot: 'acima de 20%' }
    ];
  }

  _faixa(v) {
    if (v == null) return '#FFFFFF';
    return this._faixas().find(f => v < f.lim || f.lim === Infinity).bg;
  }

  /** Heatmap marca × rede: uma linha por marca, uma coluna por rede. */
  _tblHeat(el, F, bu) {
    const marcas = F.filter(x => x.bu === bu && x.rede === 'TOTAL' && x.marca !== 'TOTAL'
      && x.marca !== 'TOTAL PB' && x.marca !== 'DEMAIS' && x.marca !== 'OUTROS').map(x => x.marca);
    const peso = k => {
      const b = this._get(bu, 'TOTAL', k), t = this._get('TOTAL', 'TOTAL', k);
      return (b && b.proj) || (t && t.proj) || 0;
    };
    const abrev = { 'DROGARIA SAO PAULO': 'DROG. SP', 'PAGUE MENOS': 'PAGUE M.', DELIVERY: 'DELIV.',
      'SAO JOAO': 'S. JOAO', VD: 'TOTAL VD', VI: 'INDEP.' };
    const redes = ['DROGASIL', 'DELIVERY', 'PAGUE MENOS', 'DROGARIA SAO PAULO', 'RAIA', 'SAO JOAO',
      'PANVEL', 'PACHECO', 'DROGAL', 'ARAUJO'].filter(k => this._get(bu, 'TOTAL', k) || this._get('TOTAL', 'TOTAL', k))
      .sort((a, b) => (a === 'DELIVERY' ? -1e9 : peso(a)) < (b === 'DELIVERY' ? -1e9 : peso(b)) ? 1 : -1);
    const cols = redes.concat(['VD', 'VI']);
    const w0 = 15, wr = ((100 - w0) / cols.length).toFixed(3) + '%';
    const th = ['MARCA', ...cols.map(k => abrev[k] || k)].map((h, i) =>
      '<th style="width:' + (i === 0 ? w0 + '%' : wr) + '; font-size:20px; font-weight:700; color:#0062AA; text-transform:uppercase;'
      + ' padding:0 4px 12px; text-align:' + (i === 0 ? 'left' : 'center') + '; white-space:nowrap;">' + h + '</th>').join('');
    const linha = (rot, marca, forte) => {
      const vals = cols.map(k => {
        const r = this._get(bu, marca, k === 'TOTAL' ? 'TOTAL' : k);
        return r ? (k === 'TOTAL' ? this._cres(r, 'proj') : r.cresc) : null;
      });
      if (!vals.some(v => v != null)) return '';
      return '<tr><td style="font-size:21px; font-weight:700; color:' + (forte ? '#292A2B' : '#0062AA')
        + '; padding:17px 10px 17px 0; white-space:nowrap;">' + rot + '</td>'
        + vals.map((v, i) => '<td style="font-size:24px; font-weight:' + (forte || i >= cols.length - 2 ? '700' : '400') + '; color:#292A2B; text-align:center;'
          + ' padding:17px 4px; border-radius:6px; font-variant-numeric:tabular-nums; background:' + this._faixa(v) + ';">'
          + this._pct(v) + '</td>').join('') + '</tr>';
    };
    const temDemais = !!this._get(bu, 'DEMAIS', 'TOTAL');
    el.innerHTML = '<thead><tr>' + th + '</tr></thead><tbody>'
      + marcas.map(m => linha(m, m, false)).join('')
      + (temDemais ? linha('DEMAIS MARCAS', 'DEMAIS', false) : '')
      + linha('TOTAL BU', 'TOTAL', true) + '</tbody>';
  }

  _tblMx(el, F, bu) {
    const redes = ['DROGASIL', 'DELIVERY', 'PAGUE MENOS', 'DROGARIA SAO PAULO', 'RAIA', 'SAO JOAO', 'PANVEL', 'PACHECO', 'DROGAL', 'ARAUJO', 'VD', 'VI', 'TOTAL'];
    const marcas = F.filter(x => x.bu === bu && x.rede === 'TOTAL' && x.marca !== 'TOTAL' && x.marca !== 'TOTAL PB' && x.marca !== 'DEMAIS' && x.marca !== 'OUTROS').map(x => x.marca);
    const rows = redes.map(k => {
      const tot = k === 'VD' || k === 'VI' || k === 'TOTAL';
      const totRow = this._get(bu, 'TOTAL', k === 'TOTAL' ? 'TOTAL' : k);
      return {
        style: { bold: tot, rule: k === 'ARAUJO' || k === 'VI' },
        cells: [{ t: k === 'VD' ? 'TOTAL VD' : (k === 'VI' ? 'INDEPENDENTES' : k), cor: tot ? '#292A2B' : '#0062AA' },
          ...marcas.map(m => {
            const r = this._get(bu, m, k === 'TOTAL' ? 'TOTAL' : k);
            return this._cellP(r ? (k === 'TOTAL' ? this._cres(r, 'proj') : r.cresc) : null);
          }),
          this._cellP(totRow ? (k === 'TOTAL' ? this._cres(totRow, 'proj') : totRow.cresc) : null)]
      };
    });
    this._tbl(el, ['REDE', ...marcas, 'Total'], rows);
  }
};
