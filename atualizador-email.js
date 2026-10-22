/* Atualizador do Boletim — assunto, envio, .eml com PDF anexado e HTML dos e-mails.
 * Incorporado à instância do atualizador em _wait() via _mixin(). */
window.AtualizadorEmail = class {
  /** Alterna a pré-visualização entre os dois grupos. */
  _prevGrupo(g2) {
    this._prevG2 = g2;
    const on = { bg: '#0062AA', bd: '#0062AA', c: '#fff' }, off = { bg: '#fff', bd: '#A9D0EE', c: '#0062AA' };
    [['prevG1', !g2], ['prevG2', g2]].forEach(([id, ativo]) => {
      const st = ativo ? on : off, b = this.$(id);
      b.style.background = st.bg; b.style.borderColor = st.bd; b.style.color = st.c;
    });
    this._preview();
  }

  _envio() {
    return {
      para: this._v('inpPara').trim(),
      para2: this._v('inpPara2').trim(),
      cc: this._v('inpCc').trim(),
      assunto: this._v('inpAssunto').trim() || this._assunto(),
      pronto: this._ck('chkPronto')
    };
  }

  /** Assunto do dia — usa o campo se preenchido, senão monta com a referência e o corte. */
  _assunto(g2) {
    const digitado = (this._v('inpAssunto') || '').trim();
    if (digitado) return digitado;
    // lê o cabeçalho direto, sem passar pela agregação — roda antes dela existir
    const B = (this.base && this.base.META) || {};
    const M = { referencia: this._v('inpRef') || B.referencia || '',
                dataCorte: this._v('inpCorte') || B.dataCorte || '' };
    return 'Boletim Sell Out' + (g2 ? ' · Gestão Orçamentária' : '')
      + (M.referencia ? ' — ' + M.referencia : '')
      + (M.dataCorte ? ' (dados até ' + M.dataCorte + ')' : '');
  }

  /** Cabeçalho MIME com acento vira palavra codificada em base64. */
  _mimeWord(s) {
    if (!/[^\x20-\x7E]/.test(s)) return s;
    return '=?UTF-8?B?' + this._b64(s) + '?=';
  }

  _b64(s) {
    const bytes = new TextEncoder().encode(s);
    let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin);
  }

  _script(win, src) {
    return new Promise((ok, err) => {
      const s = win.document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = () => err(new Error('falha ao carregar ' + src));
      win.document.head.appendChild(s);
    });
  }

  /** Renderiza a apresentação num iframe oculto e devolve o PDF em base64 (uma página por slide). */
  async _pdfDeck(g2, progresso) {
    const url = g2 ? 'boletim-sell-out-gestao-orcamentaria.dc.html' : 'boletim-sell-out.dc.html';
    const espera = ms => new Promise(r => setTimeout(r, ms));
    const fr = document.createElement('iframe');
    fr.setAttribute('aria-hidden', 'true');
    fr.style.cssText = 'position:fixed; left:-30000px; top:0; width:1920px; height:1400px; border:0; opacity:0; pointer-events:none;';
    fr.src = url + '?pdf=' + Date.now();
    document.body.appendChild(fr);
    try {
      await new Promise((ok, err) => { fr.onload = ok; setTimeout(() => err(new Error('tempo esgotado')), 30000); });
      const w = fr.contentWindow, d = w.document;
      let st = null;
      for (let i = 0; i < 100 && !(st && typeof st.goTo === 'function' && st.length); i++) { await espera(150); st = d.querySelector('deck-stage'); }
      if (!st || !st.length) throw new Error('apresentação não carregou');
      const W = +st.getAttribute('width') || 1920, H = +st.getAttribute('height') || 1080;
      fr.style.width = W + 'px'; fr.style.height = H + 'px';
      st.setAttribute('noscale', '');
      const fz = d.createElement('style');
      fz.textContent = '*,*::before,*::after{transition-duration:0s !important; animation-delay:-99s !important; animation-duration:.001s !important; animation-iteration-count:1 !important; animation-fill-mode:both !important;}';
      d.head.appendChild(fz);
      try { await d.fonts.ready; } catch (e) { /* segue */ }
      await espera(1200);
      if (!w.html2canvas) await this._script(w, 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
      if (!window.jspdf) await this._script(window, 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
      const slides = Array.from(st.children).filter(s => s.tagName === 'SECTION' && !s.hasAttribute('data-deck-skip'));
      const pdf = new window.jspdf.jsPDF({ orientation: W >= H ? 'landscape' : 'portrait', unit: 'px', format: [W, H], hotfixes: ['px_scaling'], compress: true });
      for (let i = 0; i < slides.length; i++) {
        progresso(i + 1, slides.length);
        st.goTo(Array.from(st.children).filter(s => s.tagName === 'SECTION').indexOf(slides[i]));
        await espera(350);
        const cv = await w.html2canvas(slides[i], { width: W, height: H, windowWidth: W, windowHeight: H, scale: 1.25, useCORS: true, backgroundColor: '#FFFFFF', logging: false });
        if (i) pdf.addPage([W, H], W >= H ? 'landscape' : 'portrait');
        pdf.addImage(cv.toDataURL('image/jpeg', 0.88), 'JPEG', 0, 0, W, H);
      }
      return pdf.output('datauristring').split(',')[1];
    } finally { fr.remove(); }
  }

  /** Gera um .eml pronto para abrir como rascunho no Outlook, com o PDF da apresentação anexado. */
  async _eml(g2) {
    const info = this.$('envInfo');
    const btns = ['btnEml', 'btnEml2'].map(id => this.$(id)).filter(Boolean);
    const dia = (this._v('inpCorte') || '').replace(/\D/g, '') || 'atual';
    const base = 'boletim-sell-out' + (g2 ? '-gestao-orcamentaria' : '') + '-' + dia;
    let pdf = null;
    btns.forEach(b => { b.dataset.wasDisabled = b.disabled ? '1' : ''; b.disabled = true; });
    try {
      if (typeof this._republicar === 'function') { try { this._republicar(); } catch (e) { /* segue */ } }
      info.style.color = '#5D5F61';
      info.textContent = 'Gerando o PDF da apresentação…';
      try {
        pdf = await this._pdfDeck(g2, (i, n) => { info.textContent = 'Gerando o PDF da apresentação… slide ' + i + ' de ' + n; });
      } catch (e) { pdf = null; }
    } finally {
      btns.forEach(b => { b.disabled = b.dataset.wasDisabled === '1'; });
    }
    try {
      const html = this._emailFile(g2);
      const para = (this._v(g2 ? 'inpPara2' : 'inpPara') || '').trim();
      const cc = g2 ? '' : (this._v('inpCc') || '').trim();
      const assunto = this._assunto(g2);
      const quebra = s => s.replace(/(.{76})/g, '$1\r\n');
      const corpo = quebra(this._b64(html));
      const bnd = '----=_Boletim_' + Date.now().toString(36);
      const h = [
        'To: ' + para,
        cc ? 'Cc: ' + cc : null,
        'Subject: ' + this._mimeWord(assunto),
        'X-Unsent: 1',
        'MIME-Version: 1.0',
        pdf ? 'Content-Type: multipart/mixed; boundary="' + bnd + '"' : 'Content-Type: text/html; charset=utf-8',
        pdf ? null : 'Content-Transfer-Encoding: base64'
      ].filter(Boolean).join('\r\n');
      const msg = pdf
        ? h + '\r\n\r\n--' + bnd + '\r\nContent-Type: text/html; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n' + corpo +
          '\r\n--' + bnd + '\r\nContent-Type: application/pdf; name="' + base + '.pdf"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename="' + base + '.pdf"\r\n\r\n' + quebra(pdf) +
          '\r\n--' + bnd + '--\r\n'
        : h + '\r\n\r\n' + corpo + '\r\n';
      const nome = base + '.eml';
      this._dl(nome, msg, 'message/rfc822');
      info.style.color = pdf ? '#0a7d34' : '#9A6700';
      info.textContent = '✓ ' + nome + ' baixado' + (pdf ? ' com ' + base + '.pdf anexado' : ' sem o PDF (não foi possível gerar — anexe manualmente)') +
        '. Abra o arquivo: o Outlook cria o rascunho com destinatários, assunto e formatação prontos.'
        + (para ? '' : ' O campo "Para" está vazio — preencha no Outlook antes de enviar.');
    } catch (e) {
      info.style.color = '#B32B23';
      info.textContent = 'Não foi possível gerar o arquivo. Use "Copiar corpo" e cole no Outlook.';
    }
  }

  _copiar(g2) {
    const info = this.$('envInfo'), html = this._emailFile(g2);
    const corpo = html.replace(/^[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*$/i, '');
    const ok = () => { info.style.color = '#0a7d34'; info.textContent = '✓ E-mail ' + (g2 ? 'de Gestão Orçamentária' : 'comercial') + ' copiado — cole no Outlook com Ctrl+V.'; };
    const falha = () => { info.style.color = '#B32B23'; info.textContent = 'Não foi possível copiar. Use "Pré-visualizar e-mail", selecione tudo e copie manualmente.'; };
    if (navigator.clipboard && window.ClipboardItem) {
      navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([corpo], { type: 'text/html' }),
        'text/plain': new Blob([this._v('inpAssunto') || this._assunto()], { type: 'text/plain' })
      })]).then(ok).catch(falha);
    } else falha();
  }

  // ---------- e-mail do dia (mesmo layout de "boletim-sell-out-email.html") ----------
  _emailFile(g2) {
    const M = this._meta(), esc = t => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const F = this.fatos.map(f => { const o = {}; this.cols.forEach((c, i) => o[c] = f[i]); return o; });
    const g = (bu, marca, rede) => F.find(o => o.bu === bu && o.marca === marca && o.rede === rede) || null;
    const tot = g('Total s/ Cobertura', 'TOTAL', 'TOTAL') || {};
    const cVD = g('TOTAL', 'TOTAL', 'VD') || {}, cVI = g('TOTAL', 'TOTAL', 'VI') || {};
    const mtdAA = (M.mtd && M.mtd.aa) || {}, mtdAt = (M.mtd && M.mtd.atual) || {};
    const num = v => (typeof v === 'number' ? v : null);
    const menos = (a, b) => (typeof a === 'number' && typeof b === 'number') ? a - b : null;

    // ----- barras empilhadas VD (claro) + VI (escuro) -----
    const barra = (rotulo, vd, vi, escala) => {
      const t = (vd || 0) + (vi || 0);
      const h = v => Math.max(14, Math.round((v || 0) * escala));
      const seg = (v, bg, cor) => '<tr><td height="' + h(v) + '" align="center" bgcolor="' + bg + '" style="height:' + h(v) +
        'px;font-family:Calibri,Arial,sans-serif;font-size:13px;line-height:' + h(v) + 'px;mso-line-height-rule:exactly;font-weight:bold;color:' + cor + ';">' + this._fmt(v) + '</td></tr>';
      return '<td width="56" valign="bottom" style="width:56px;padding:0 7px 0 7px;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="56" style="width:56px;">' +
        '<tr><td align="center" style="font-family:Calibri,Arial,sans-serif;font-size:14px;line-height:19px;font-weight:bold;color:#074878;padding-bottom:4px;">' + this._fmt(t) + '</td></tr>' +
        seg(vi, '#074878', '#FFFFFF') + seg(vd, '#A9D0EE', '#074878') +
        '<tr><td align="center" valign="top" height="38" style="height:38px;font-family:Calibri,Arial,sans-serif;font-size:11px;line-height:15px;color:#5D5F61;padding-top:4px;">' + esc(rotulo) + '</td></tr>' +
        '</table></td>';
    };

    // ----- coluna única (Ex-Semavy): sem quebra VD/VI -----
    const barraX = (rotulo, v, escala) => {
      const hh = Math.max(14, Math.round((v || 0) * escala));
      return '<td width="56" valign="bottom" style="width:56px;padding:0 4px 0 4px;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="56" style="width:56px;">' +
        '<tr><td align="center" style="font-family:Calibri,Arial,sans-serif;font-size:14px;line-height:19px;font-weight:bold;color:#0062AA;padding-bottom:4px;">' + this._fmt(v) + '</td></tr>' +
        '<tr><td height="' + hh + '" bgcolor="#00BFDF" style="height:' + hh + 'px;font-size:1px;line-height:1px;">&nbsp;</td></tr>' +
        '<tr><td align="center" valign="top" height="38" style="height:38px;font-family:Calibri,Arial,sans-serif;font-size:11px;line-height:15px;color:#5D5F61;padding-top:4px;">' + esc(rotulo) + '</td></tr>' +
        '</table></td>';
    };
    const sepX = '<td width="1" valign="bottom" style="width:1px;padding:0 4px;"><div style="width:1px;height:120px;background-color:#A9D0EE;font-size:1px;line-height:1px;">&nbsp;</div></td>';
    const sem = g('Semavy', 'TOTAL', 'TOTAL');
    const semMtdAA = !sem ? null : (sem.real != null && sem.cresc != null) ? sem.real / (1 + sem.cresc / 100) : (sem.realAA ? null : 0);
    const ex = (a, b) => (sem && typeof a === 'number') ? a - (typeof b === 'number' ? b : 0) : null;
    const pctX = (a, b) => (a != null && b) ? (a / b - 1) * 100 : null;
    const notaX = () => '';
    const parX = (r1, v1, r2, v2, e) => sem ? sepX + barraX(r1, v1, e) + barraX(r2, v2, e) : '';

    const cartao = (eyebrow, valor, sub, delta, barras, nota, deltaX) =>
      '<td class="kpi" width="33%" valign="top" bgcolor="#EDF6FC" style="width:33%;background-color:#EDF6FC;border-radius:8px;padding:16px 16px 14px;border-left:6px solid #FFFFFF;border-right:6px solid #FFFFFF;font-family:Calibri,Arial,sans-serif;">' +
      '<div style="font-size:13px;line-height:18px;letter-spacing:1px;text-transform:uppercase;color:#5D5F61;font-weight:bold;">' + esc(eyebrow) + '</div>' +
      '<div style="font-size:36px;line-height:42px;mso-line-height-rule:exactly;font-weight:bold;color:#074878;padding-top:4px;">' + this._fmt(valor) + '</div>' +
      '<div style="font-size:14px;line-height:19px;color:#5D5F61;">' + esc(sub) + '</div>' +
      '<div style="font-size:16px;line-height:22px;font-weight:bold;color:' + this._cor(delta) + ';padding:6px 0 12px;">' + this._pct(delta) + ' vs AA'
        + (sem ? ' <span style="color:#5D5F61;font-weight:normal;">&#183; ex-Semavy</span> <span style="color:' + this._cor(deltaX) + ';">' + this._pct(deltaX) + '</span>' : '') + '</div>' +
      '<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>' + barras + '</tr></table>' +
      '<div style="font-size:13px;line-height:19px;color:#5D5F61;padding-top:8px;">' + nota + '</div></td>';

    const esc114 = t => t ? 114 / t : 0;
    const e1 = esc114(Math.max((M.mes.aa.total || 0), (M.mes.proj.total || 0)));
    const c1 = cartao('Projeção do mês', tot.proj, M.moeda + ', s/ cobertura', this._cres(tot, 'proj'),
      barra('AA', M.mes.aa.vd, M.mes.aa.vi, e1) + barra('Projetado', M.mes.proj.vd, M.mes.proj.vi, e1)
        + parX('AA ex-Sem.', ex(M.mes.aa.total, sem && sem.realAA), 'Proj. ex-Sem.', ex(tot.proj, sem && sem.proj), e1),
      'VD ' + this._pct(num(M.mes.cresVD)) + ' &#183; VI ' + this._pct(num(M.mes.cresVI))
, pctX(ex(tot.proj, sem && sem.proj), ex(M.mes.aa.total, sem && sem.realAA)));

    const mtdAAt = (mtdAA.vd || 0) + (mtdAA.vi || 0), mtdAtt = (mtdAt.vd || 0) + (mtdAt.vi || 0);
    const e2 = esc114(Math.max(mtdAAt, mtdAtt));
    const c2 = cartao('Realizado', tot.real, M.moeda + ', ' + M.diasUteis + ' dias úteis', num(M.mtd.cresc),
      barra('MTD ' + (String(M.referencia).match(/\d{2}$/) ? String(Number(String(M.referencia).slice(-2)) - 1) : 'AA'), mtdAA.vd, mtdAA.vi, e2) +
      barra('Realizado', mtdAt.vd, mtdAt.vi, e2)
        + parX('MTD ex-Sem.', ex(mtdAAt, semMtdAA), 'Real. ex-Sem.', ex(mtdAtt, sem && sem.real), e2),
      'VD ' + this._pct(num(cVD.cresc)) + ' &#183; VI ' + this._pct(num(cVI.cresc))
        + ' &#183; MTD anterior: ' + M.diasUteisAA + ' dias úteis', pctX(ex(mtdAtt, sem && sem.real), ex(mtdAAt, semMtdAA)));

    // mês fechado (corte no último dia): não falta nada a vender, MTG zera
    const completo = (() => { const s0 = this._serial(M.dataCorte); if (!s0) return false;
      const d = this._dataDe(s0); return d.getUTCDate() === new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate(); })();
    const mtgVD = completo ? 0 : menos(M.mes.proj.vd, mtdAt.vd), mtgVI = completo ? 0 : menos(M.mes.proj.vi, mtdAt.vi);
    const mtgAAvd = completo ? 0 : menos(M.mes.aa.vd, mtdAA.vd), mtgAAvi = completo ? 0 : menos(M.mes.aa.vi, mtdAA.vi);
    const mtg = (mtgVD || 0) + (mtgVI || 0), mtgAA = (mtgAAvd || 0) + (mtgAAvi || 0);
    const e3 = esc114(Math.max(mtg, mtgAA));
    const c3 = cartao('MTG', mtg, M.moeda + ', Projetado − Realizado', mtgAA ? (mtg / mtgAA - 1) * 100 : null,
      barra('MTG AA', mtgAAvd, mtgAAvi, e3) + barra('MTG', mtgVD, mtgVI, e3)
        + parX('MTG AA ex-Sem.', (completo ? 0 : ex(mtgAA, sem && semMtdAA != null ? (sem.realAA || 0) - semMtdAA : null)), 'MTG ex-Sem.', (completo ? 0 : ex(mtg, sem && sem.real != null ? sem.proj - sem.real : null)), e3),
      (() => {
        const at = tot.orcAbs ? tot.proj / tot.orcAbs * 100 : null;
        const gap = tot.orcAbs != null ? tot.proj - tot.orcAbs : null;
        const rev = tot.projIni != null ? tot.proj - tot.projIni : null;
        const sn = v => v == null ? '-' : (v > 0 ? '+' : '') + this._fmt(v);
        return 'Orçamento: <strong>' + (at == null ? '-' : this._fmt(at) + '%') + '</strong> &#183; gap ' + sn(gap)
          + ' &#183; revisão ' + sn(rev) + ' vs. inicial';
      })(), pctX((completo ? 0 : ex(mtg, sem && sem.real != null ? sem.proj - sem.real : null)), (completo ? 0 : ex(mtgAA, sem && semMtdAA != null ? (sem.realAA || 0) - semMtdAA : null))));

    // ----- tabela de BUs com marcas retráteis -----
    const th = t => '<th align="center" style="font-size:11px;line-height:17px;mso-line-height-rule:exactly;font-weight:bold;color:#0062AA;padding:4px 4px 6px;border-bottom:1.5px solid #00BFDF;">' + t + '</th>';
    const td = (t, o) => { o = o || {}; return '<td align="' + (o.a || 'center') + '" style="font-size:14px;line-height:20px;mso-line-height-rule:exactly;' + (o.it === false ? '' : 'font-style:italic;') + 'color:' + (o.c || '#292A2B') + ';font-weight:' + (o.b ? 'bold' : 'normal') + ';padding:' + (o.p || '5px 4px') + ';' + (o.bd || 'border-bottom:1px solid #EFEFEF;') + '">' + t + '</td>'; };
    const tdSub = (t, o) => { o = o || {}; return '<td align="' + (o.a || 'center') + '" style="font-size:13px;line-height:19px;mso-line-height-rule:exactly;color:' + (o.c || '#5D5F61') + ';font-weight:' + (o.b ? 'bold' : 'normal') + ';padding:4px 4px;' + (o.pl || '') + 'border-bottom:1px solid #F2F7FB;background-color:#F7FBFE;">' + t + '</td>'; };

    const COM_MARCA = ['CH', 'PP', 'SC', 'SG'];
    const ordBU = ['CH', 'PP', 'PP (Ex-Semavy)', 'Semavy', 'SC', 'SG', 'COBERTURA', 'SG - GENÉRICOS', 'SG - COBERTURA', 'SG - SIMILARES', 'Similares (Ex-Vit)', 'Vitaminas', 'Total', 'Total s/ Cobertura', 'Total (Ex-Semavy)'];
    const linhas = ordBU.map(k => {
      const r = g(k, 'TOTAL', 'TOTAL'); if (!r) return '';
      const NIV = { 'PP (Ex-Semavy)': 1, 'Semavy': 1, COBERTURA: 1, 'SG - GENÉRICOS': 1, 'SG - COBERTURA': 1, 'SG - SIMILARES': 1, 'Similares (Ex-Vit)': 2, 'Vitaminas': 2 };
      const NOME = { COBERTURA: 'Cobertura*', 'SG - GENÉRICOS': 'SG - Genéricos', 'SG - COBERTURA': 'SG - Cobertura', 'SG - SIMILARES': 'SG - Similares' };
      const isTot = k.indexOf('Total') === 0, muted = !!NIV[k];
      const bd = (k === 'PP' || k === 'SG' || k === 'Vitaminas' || k === 'Semavy' || k === 'Total s/ Cobertura') ? 'border-bottom:1.5px solid #00BFDF;' : null;
      const cinza = muted ? '#5D5F61' : '#292A2B';
      const p1 = this._cres(r, 'proj'), p2 = this._cres(r, 'projIni'), p3 = this._cres(r, 'orcAbs');
      const rot = muted ? '<span style="padding-left:' + (NIV[k] * 12) + 'px;font-size:13px;">' + esc(NOME[k] || k) + '</span>' : esc(k);
      let out = '<tr>' + td(rot, { it: false, b: true, c: isTot ? '#292A2B' : (muted ? '#5D5F61' : '#0062AA'), bd: bd, p: '5px 4px 5px 0' }) +
        [r.realAA, r.real, r.proj].map(v => td(this._fmt(v), { c: cinza, b: isTot, bd: bd })).join('') +
        td(this._pct(p1), { c: this._cor(p1), b: true, bd: bd }) +
        td(this._fmt(r.projIni), { c: cinza, b: isTot, bd: bd }) +
        td(this._pct(p2), { c: this._cor(p2), b: true, bd: bd }) +
        td(this._fmt(r.orcAbs), { c: cinza, b: isTot, bd: bd }) +
        td(this._pct(p3), { c: this._cor(p3), b: true, bd: bd }) +
        (g2 ? td(this._fmt(r.forecast), { c: cinza, b: isTot, bd: bd })
          + td(this._pct(this._vsFcst(r)), { c: this._cor(this._vsFcst(r)), b: true, bd: bd }) : '') +
        td(this._pct(r.vd), { c: cinza, b: isTot, bd: bd }) +
        td(this._pct(r.vi), { c: cinza, b: isTot, bd: bd, p: '5px 0 5px 4px' }) + '</tr>';
      return out;
    }).join('');

    const botao = (href, texto, primario) =>
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:' + (primario ? '#0062AA' : '#FFFFFF') +
      ';border:1px solid ' + (primario ? '#0062AA' : '#A9D0EE') + ';border-radius:8px;"><tr><td align="center" valign="middle" height="62" style="height:62px;padding:0 18px;font-family:Calibri,Arial,Helvetica,sans-serif;">' +
      '<a href="' + esc(String(href || '#').trim()).replace(/"/g, '&quot;') + '" style="display:block;font-size:18px;line-height:26px;mso-line-height-rule:exactly;font-weight:bold;color:' + (primario ? '#FFFFFF' : '#0062AA') + ';text-decoration:none;text-align:center;">' + texto + '</a></td></tr></table>';

    const logo = window.LOGO_EMAIL_HYPERA || '';

    // ----- cards: principais marcas de cada BU -----
    const TOPM = 5;
    const cardsBU = COM_MARCA.map(k => {
      const r = g(k, 'TOTAL', 'TOTAL'); if (!r) return '';
      const pk = this._cres(r, 'proj');
      const ms = F.filter(o => o.bu === k && o.rede === 'TOTAL' && ['TOTAL', 'TOTAL PB', 'DEMAIS'].indexOf(o.marca) < 0 && o.proj != null)
        .sort((a, b) => (b.proj || 0) - (a.proj || 0)).slice(0, TOPM);
      const lin = ms.map(o => {
        const p = this._cres(o, 'proj');
        return '<tr><td style="font-size:13px;line-height:18px;color:#292A2B;padding:6px 0;border-top:1px solid #D6E8F5;">' + esc(o.marca) + '</td>' +
          '<td align="right" style="font-size:13px;line-height:18px;color:#5D5F61;padding:6px 0 6px 6px;border-top:1px solid #D6E8F5;white-space:nowrap;">' + this._fmt(o.proj) + '</td>' +
          '<td align="right" style="font-size:13px;line-height:18px;font-weight:bold;color:' + this._cor(p) + ';padding:6px 0 6px 8px;border-top:1px solid #D6E8F5;white-space:nowrap;">' + this._pct(p) + '</td></tr>';
      }).join('');
      return '<td class="kpi" width="25%" valign="top" bgcolor="#EDF6FC" style="width:25%;background-color:#EDF6FC;border-radius:8px;padding:14px 14px 10px;border-left:5px solid #FFFFFF;border-right:5px solid #FFFFFF;font-family:Calibri,Arial,sans-serif;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
        '<tr><td colspan="3" style="padding-bottom:8px;"><span style="font-size:18px;line-height:24px;font-weight:bold;color:#0062AA;">' + k + '</span> ' +
        '<span style="font-size:13px;line-height:18px;color:#5D5F61;">' + this._fmt(r.proj) + ' &#183; </span>' +
        '<span style="font-size:13px;line-height:18px;font-weight:bold;color:' + this._cor(pk) + ';">' + this._pct(pk) + '</span></td></tr>' +
        '<tr><td style="font-size:10px;line-height:14px;letter-spacing:.06em;text-transform:uppercase;color:#5D5F61;padding-bottom:4px;">Marca</td>' +
        '<td align="right" style="font-size:10px;line-height:14px;letter-spacing:.06em;text-transform:uppercase;color:#5D5F61;padding-bottom:4px;">Proj.</td>' +
        '<td align="right" style="font-size:10px;line-height:14px;letter-spacing:.06em;text-transform:uppercase;color:#5D5F61;padding-bottom:4px;">vs AA</td></tr>' +
        lin + '</table></td>';
    }).join('');
    const blocoMarcas = cardsBU ? '<tr><td class="pad" style="padding:26px 19px 0;font-family:Calibri,Arial,Helvetica,sans-serif;">' +
      '<div style="font-size:18px;line-height:26px;font-weight:bold;color:#0062AA;padding:0 5px;">Principais marcas por BU <span style="font-weight:normal;font-size:14px;color:#5D5F61;">(projetado do mês, ' + esc(M.moeda) + ')</span></div>' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:10px;"><tr>' + cardsBU + '</tr></table></td></tr>\n' : '';

    const LARG = g2
      ? ['17%', '8%', '7.5%', '7.5%', '6%', '8%', '6%', '7.5%', '7%', '7.5%', '6.5%', '6%', '5.5%']
      : ['19%', '9%', '8.5%', '8.5%', '6.5%', '9%', '6.5%', '8%', '8%', '8.5%', '8.5%'];
    return '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="color-scheme" content="light dark">\n<title>Boletim Sell Out - ' + esc(M.dataCorte) + '</title>\n' +
      '<!--[if mso]>\n<style>table,td,div,p,a{font-family:Calibri,Arial,sans-serif !important;}</style>\n<![endif]-->\n' +
      '<style>\n' +
      '@media only screen and (max-width:620px){\n' +
      '.wrap{width:100% !important}\n.pad{padding-left:12px !important;padding-right:12px !important}\n' +
      '.hdrcta{display:none !important}\n.hdrlogo{display:block !important;width:auto !important;padding:0 0 10px !important;border-right:0 !important}\n' +
      '.hdrtit{display:block !important;padding-left:0 !important}\n.hdrh1{font-size:21px !important;line-height:27px !important}\n' +
      '.kpi{display:block !important;width:100% !important;box-sizing:border-box !important;border-left:0 !important;border-right:0 !important;margin-bottom:10px !important}\n' +
      '.tbl{table-layout:fixed !important;width:100% !important}\n.tbl colgroup{display:none !important}\n' +
      '.tbl th,.tbl td{white-space:normal !important;word-break:break-word !important;overflow:hidden !important}\n' +
      '.tbl td,.tbl th{font-size:12px !important;line-height:17px !important;padding:6px 3px !important}\n' +
      (() => {
        // no celular só as colunas que cabem: g2 mantém forecast e abre mão de VD/VI
        const esconde = g2 ? [6, 7, 8, 9, 12, 13] : [6, 7, 8, 9];
        return esconde.map(n => '.tbl th:nth-child(' + n + '),.tbl td:nth-child(' + n + ')').join(',') + '{display:none !important}\n';
      })() +
      '.cta2{display:block !important;width:100% !important;padding:0 0 10px !important}\n' +
      // g2 tem duas colunas a mais: aperta padding e corpo para caber em 400px sem cortar
      (g2 ? '.pad{padding-left:6px !important;padding-right:6px !important}\n'
        + '.tbl td,.tbl th{font-size:11px !important;line-height:16px !important;padding:5px 2px !important}\n' : '') +
      '}</style>\n</head>\n' +
      '<body style="margin:0;padding:0;background-color:#FFFFFF;">\n' +
      '<span style="display:none;font-size:1px;color:#FFF;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">Boletim Sell Out de ' + esc(M.referencia) + ' atualizado com dados até ' + esc(M.dataCorte) + ', disponível no HUB na área Corp.</span>\n' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="left">\n' +
      '<table role="presentation" class="wrap" cellpadding="0" cellspacing="0" border="0" width="980" style="width:980px;max-width:980px;">\n' +
      // cabeçalho
      '<tr><td style="background-color:#0A3D80;background-image:linear-gradient(90deg,#0A3D80 0%,#0B4C97 35%,#0062AA 60%,#08356E 100%);border-bottom:2px solid #00BFDF;padding:18px 24px 20px;font-family:Calibri,Arial,Helvetica,sans-serif;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>' +
      '<td class="hdrlogo" width="112" valign="middle" style="width:112px;padding-right:24px;border-right:1px solid rgba(169,208,238,0.45);">' +
      (logo ? '<img src="' + logo + '" width="96" height="33" alt="Hypera" style="display:block;width:96px;height:33px;border:0;outline:none;text-decoration:none;" />' : '') + '</td>' +
      '<td class="hdrtit" valign="middle" style="padding-left:24px;">' +
      '<div class="hdrh1" style="font-size:26px;line-height:32px;mso-line-height-rule:exactly;font-weight:bold;color:#FFFFFF;">Boletim Sell Out'
      + (g2 ? ' &#183; Gestão Orçamentária' : '') + ' &#8211; ' + esc(M.referencia) + '</div>' +
      '<div style="font-size:14px;line-height:21px;mso-line-height-rule:exactly;color:#A9D0EE;padding-top:3px;">Dados até ' + esc(M.dataCorte) + ' &#183; ' + M.diasUteis + ' dias úteis realizados' + (M.atualizadoEm ? ' &#183; publicado em ' + esc(M.atualizadoEm) : '') + '</div></td>' +
      ('' && '<td class="hdrcta" align="right" valign="middle" style="font-family:Calibri,Arial,Helvetica,sans-serif;">' +
      '<a href="' + esc(M.links.deck || 'boletim-sell-out.dc.html') + '" style="display:inline-block;font-size:12px;line-height:16px;mso-line-height-rule:exactly;font-weight:bold;color:#FFFFFF;text-decoration:none;border:1px solid #A9D0EE;border-radius:6px;padding:6px 11px;">Ver apresentação &#8594;</a></td>') +
      '</tr></table></td></tr>\n' +
      // cartões
      '<tr><td class="pad" style="padding:22px 18px 0;font-family:Calibri,Arial,Helvetica,sans-serif;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>' + (completo ? (c1 + c2).replace(/width="33%"/g, 'width="50%"').replace(/width:33%/g, 'width:50%') : c1 + c2 + c3) + '</tr></table>' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="padding:8px 0 0;font-family:Calibri,Arial,sans-serif;font-size:13px;line-height:19px;color:#5D5F61;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="10" height="10" bgcolor="#A9D0EE" style="width:10px;height:10px;line-height:10px;font-size:1px;mso-line-height-rule:exactly;background-color:#A9D0EE;">&nbsp;</td><td style="padding:0 16px 0 6px;font-family:Calibri,Arial,sans-serif;font-size:13px;line-height:19px;mso-line-height-rule:exactly;color:#5D5F61;">VD</td><td width="10" height="10" bgcolor="#074878" style="width:10px;height:10px;line-height:10px;font-size:1px;mso-line-height-rule:exactly;background-color:#074878;">&nbsp;</td><td style="padding:0 0px 0 6px;font-family:Calibri,Arial,sans-serif;font-size:13px;line-height:19px;mso-line-height-rule:exactly;color:#5D5F61;">VI</td></tr></table></td></tr></table></td></tr>\n' +
      // tabela
      '<tr><td class="pad" style="padding:26px 24px 0;font-family:Calibri,Arial,Helvetica,sans-serif;">' +
      '<div style="font-size:18px;line-height:26px;font-weight:bold;color:#0062AA;">Crescimento BUs <span style="font-weight:normal;font-size:14px;color:#5D5F61;">(' + esc(M.moeda) + ')</span></div>' +
      '<table role="presentation" class="tbl" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;table-layout:fixed;border-collapse:collapse;font-family:Calibri,Arial,Helvetica,sans-serif;margin-top:12px;">' +
      '<colgroup>' + LARG.map(w => '<col style="width:' + w + '">').join('') + '</colgroup><tr>' +
      ['BU', 'REAL AA', 'REAL', 'PROJ.', '% PROJ', 'PROJ. INICIAL', '% PROJ', 'ORÇ. ABS', '% CRES ORÇ']
        .concat(g2 ? ['FORECAST', '% FCST'] : []).concat(['VD', 'VI']).map((t, i) => th(t).replace('<th ', '<th width="' + LARG[i] + '" ').replace('style="', 'style="width:' + LARG[i] + ';')).join('') + '</tr>' + linhas + '</table>' +
      '<div style="font-size:13px;line-height:19px;font-weight:bold;color:#0062AA;padding-top:6px;">*A cobertura não está incluída no Power BI do Boletim Sell Out.</div>' +
      '<div style="font-size:13px;line-height:19px;color:#5D5F61;padding-top:4px;">Fonte: ' + esc(M.fonte) + '. Realizado atual: ' + M.diasUteis + ' dias úteis. MTD ano anterior: ' + M.diasUteisAA + ' dias úteis.</div>' +
      '</td></tr>\n' + blocoMarcas +
      // botões
      '<tr><td class="pad" style="padding:26px 18px 0;font-family:Calibri,Arial,Helvetica,sans-serif;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>' +
      '<td class="cta2" width="50%" valign="top" style="width:50%;padding:0 6px;">' + botao(M.links.hub, 'Acesse o Boletim Sell Out', true) + '</td>' +
      '<td class="cta2" width="50%" valign="top" style="width:50%;padding:0 6px;">' + botao(M.links.executivos, 'Demais relatórios de IM&amp;P', false) + '</td>' +
      '</tr></table></td></tr>\n' +
      ('' && '<tr><td class="pad" style="padding:12px 24px 0;font-family:Calibri,Arial,Helvetica,sans-serif;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#FFFFFF;border:1px solid #0062AA;border-radius:8px;">' +
      '<tr><td align="center" valign="middle" height="56" style="height:56px;padding:0 18px;font-family:Calibri,Arial,Helvetica,sans-serif;">' +
      '<a href="' + esc(M.links.pdf || '#') + '" style="display:block;font-size:17px;line-height:24px;mso-line-height-rule:exactly;font-weight:bold;color:#0062AA;text-decoration:none;text-align:center;">Baixar apresentação completa (PDF) &#8594;</a>' +
      '</td></tr></table></td></tr>\n') +
      '<tr><td height="30" style="height:30px;line-height:30px;font-size:0;">&nbsp;</td></tr>\n' +
      '</table></td></tr></table>\n</body>\n</html>\n';
  }
};
