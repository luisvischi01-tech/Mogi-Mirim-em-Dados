/* Tabela consultiva de comércio exterior — Mogi Mirim (SP)
   Dados: comex-data.js (Comex Stat / Siscomex, MDIC). Sem dependências externas. */
(function () {
  "use strict";

  var D = window.COMEX_DATA;
  var root = document.getElementById("comex");
  if (!D || !root) return;

  var YEARS = D.meta.anos;
  var NY = YEARS.length;
  var PAGE_SIZE = 8;
  var COLOR_EXP = "#129138";
  var COLOR_IMP = "#d9a000";

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    fluxo: $("cx-fluxo"), setor: $("cx-setor"), de: $("cx-de"), ate: $("cx-ate"), sh2: $("cx-sh2"),
    pais: $("cx-pais"), busca: $("cx-busca"), grupo: $("cx-grupo"), limpar: $("cx-limpar"),
    kpis: $("cx-kpis"), dest: $("cx-dest"), destTitle: $("cx-dest-title"), destNote: $("cx-dest-note"), annual: $("cx-annual"), top: $("cx-top"), topTitle: $("cx-top-title"),
    thead: $("cx-thead"), tbody: $("cx-tbody"), resumo: $("cx-resumo"),
    prev: $("cx-prev"), next: $("cx-next"), pagina: $("cx-pagina"), csv: $("cx-csv")
  };

  var nfInt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  var nfDec = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

  function usd(v) { return nfInt.format(Math.round(v)); }
  function compact(v) {
    var a = Math.abs(v), s = v < 0 ? "−" : "";
    if (a >= 1e9) return s + "US$ " + nfDec.format(a / 1e9) + " bi";
    if (a >= 1e6) return s + "US$ " + nfDec.format(a / 1e6) + " mi";
    if (a >= 1e3) return s + "US$ " + nfDec.format(a / 1e3) + " mil";
    return s + "US$ " + nfInt.format(a);
  }
  function norm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function short(s, n) { return s.length > n ? s.slice(0, n - 1).trim() + "…" : s; }

  /* Setores (agrupamento simplificado dos capítulos SH2) */
  function setorDe(c) {
    var n = +c;
    if (n <= 24) return "Agropecuária e alimentos";
    if (n <= 27) return "Minerais e combustíveis";
    if (n === 31) return "Fertilizantes";
    if (n <= 38) return "Química e farmacêutica";
    if (n <= 40) return "Plásticos e borracha";
    if (n <= 43) return "Couro e artefatos";
    if (n <= 49) return "Madeira, papel e celulose";
    if (n <= 67) return "Têxteis, vestuário e calçados";
    if (n <= 71) return "Cerâmica, vidro e pedras";
    if (n <= 83) return "Metalurgia e produtos de metal";
    if (n === 84) return "Máquinas e equipamentos";
    if (n === 85) return "Material elétrico e eletrônico";
    if (n <= 89) return "Veículos e autopeças";
    if (n <= 92) return "Instrumentos de precisão e médicos";
    return "Outros produtos";
  }
  var SETORES = [];

  /* Pré-processamento das linhas */
  var rows = D.linhas.map(function (l) {
    var code = l[1];
    var e = l.slice(2, 2 + NY), i = l.slice(2 + NY, 2 + 2 * NY);
    var pais = D.paises[l[0]], sh2 = code.slice(0, 2);
    return {
      pais: pais, sh4: code, sh2: sh2, d4: D.sh4n[code], d2: D.sh2n[sh2], setor: setorDe(sh2), e: e, i: i,
      txt: norm([code, D.sh4n[code], D.sh4[code], sh2, D.sh2n[sh2], D.sh2[sh2], setorDe(sh2), pais].join(" "))
    };
  });

  rows.forEach(function (r) { if (SETORES.indexOf(r.setor) < 0) SETORES.push(r.setor); });
  SETORES.sort(function (a, b) { return a.localeCompare(b, "pt-BR"); });

  /* Controles */
  YEARS.forEach(function (y) {
    var label = y === D.meta.parcial ? y + " (parcial)" : String(y);
    el.de.add(new Option(label, y));
    el.ate.add(new Option(label, y));
  });
  el.de.value = YEARS[0];
  el.ate.value = YEARS[NY - 1];

  el.setor.add(new Option("Todos os setores", ""));
  SETORES.forEach(function (x) { el.setor.add(new Option(x, x)); });
  el.sh2.add(new Option("Todos os capítulos (SH2)", ""));
  Object.keys(D.sh2).forEach(function (c) {
    el.sh2.add(new Option(c + " — " + D.sh2n[c], c));
  });
  el.pais.add(new Option("Todos os países", ""));
  D.paises.forEach(function (p, idx) { el.pais.add(new Option(p, p)); });

  /* Estado */
  var state = { page: 0, sortKey: null, sortDir: -1 };

  var GROUPS = {
    setor: {
      cols: [["setor", "Setor"]],
      key: function (r) { return r.setor; },
      label: function (r) { return { setor: r.setor }; },
      top: function (a) { return a.setor; },
      topTitle: "Principais setores"
    },
    detalhe: {
      cols: [["sh4", "SH4"], ["d4", "Produto"], ["pais", "País"]],
      key: function (r) { return r.sh4 + "|" + r.pais; },
      label: function (r) { return { sh4: r.sh4, d4: r.d4, pais: r.pais }; },
      top: function (a) { return a.d4 + " · " + a.pais; },
      topTitle: "Maiores combinações produto × país"
    },
    sh4: {
      cols: [["sh4", "SH4"], ["d4", "Produto"], ["setor", "Setor"]],
      key: function (r) { return r.sh4; },
      label: function (r) { return { sh4: r.sh4, d4: r.d4, setor: r.setor }; },
      top: function (a) { return a.d4; },
      topTitle: "Principais produtos (SH4)"
    },
    sh2: {
      cols: [["sh2", "SH2"], ["d2", "Grupo de produtos"], ["setor", "Setor"]],
      key: function (r) { return r.sh2; },
      label: function (r) { return { sh2: r.sh2, d2: r.d2, setor: r.setor }; },
      top: function (a) { return a.d2; },
      topTitle: "Principais capítulos (SH2)"
    },
    pais: {
      cols: [["pais", "País"]],
      key: function (r) { return r.pais; },
      label: function (r) { return { pais: r.pais }; },
      top: function (a) { return a.pais; },
      topTitle: "Principais países"
    }
  };

  function readFilters() {
    var de = +el.de.value, ate = +el.ate.value;
    if (de > ate) { var t = de; de = ate; ate = t; }
    return {
      fluxo: el.fluxo.value, setor: el.setor.value, de: de, ate: ate, sh2: el.sh2.value, pais: el.pais.value,
      q: norm(el.busca.value.trim()), grupo: el.grupo.value
    };
  }

  function sumRange(arr, a, b) {
    var s = 0;
    for (var k = a; k <= b; k++) s += arr[k];
    return s;
  }

  function compute() {
    var f = readFilters();
    var a = YEARS.indexOf(f.de), b = YEARS.indexOf(f.ate);
    var showE = f.fluxo !== "imp", showI = f.fluxo !== "exp";
    var terms = f.q ? f.q.split(/\s+/) : [];

    var base = rows.filter(function (r) {
      if (f.sh2 && r.sh2 !== f.sh2) return false;
      if (f.setor && r.setor !== f.setor) return false;
      if (f.pais && r.pais !== f.pais) return false;
      for (var t = 0; t < terms.length; t++) if (r.txt.indexOf(terms[t]) < 0) return false;
      return true;
    });

    /* série anual (ignora o período, respeita os demais filtros) */
    var annual = YEARS.map(function () { return { e: 0, i: 0 }; });
    base.forEach(function (r) {
      for (var k = 0; k < NY; k++) {
        if (showE) annual[k].e += r.e[k];
        if (showI) annual[k].i += r.i[k];
      }
    });

    /* agrupamento no período */
    var G = GROUPS[f.grupo], map = {}, list = [];
    var nProd = {}, nPais = {};
    var totE = 0, totI = 0;
    base.forEach(function (r) {
      var e = showE ? sumRange(r.e, a, b) : 0;
      var i = showI ? sumRange(r.i, a, b) : 0;
      if (e + i === 0) return;
      totE += e; totI += i;
      nProd[r.sh4] = 1; nPais[r.pais] = 1;
      var k = G.key(r), g = map[k];
      if (!g) { g = map[k] = Object.assign(G.label(r), { e: 0, i: 0 }); list.push(g); }
      g.e += e; g.i += i;
    });
    list.forEach(function (g) { g.t = g.e + g.i; g.s = g.e - g.i; });

    return {
      f: f, G: G, list: list, showE: showE, showI: showI, annual: annual, a: a, b: b,
      totE: totE, totI: totI, nProd: Object.keys(nProd).length, nPais: Object.keys(nPais).length
    };
  }

  function columns(c) {
    var cols = c.G.cols.map(function (x) { return { key: x[0], label: x[1], num: false }; });
    if (c.showE) cols.push({ key: "e", label: "Exportação (US$ FOB)", num: true });
    if (c.showI) cols.push({ key: "i", label: "Importação (US$ FOB)", num: true });
    if (c.showE && c.showI) cols.push({ key: "s", label: "Saldo (US$ FOB)", num: true });
    return cols;
  }

  function periodLabel(c) {
    return c.f.de === c.f.ate ? String(c.f.de) : c.f.de + "–" + c.f.ate;
  }

  /* KPIs */
  function renderKpis(c) {
    var items = [
      ["Exportações", c.showE ? compact(c.totE) : "—", "green"],
      ["Importações", c.showI ? compact(c.totI) : "—", "yellow"],
      ["Saldo comercial", c.showE && c.showI ? compact(c.totE - c.totI) : "—", "red"],
      ["Produtos (SH4)", nfInt.format(c.nProd), "green"],
      ["Países", nfInt.format(c.nPais), "yellow"]
    ];
    el.kpis.innerHTML = items.map(function (x) {
      return '<div class="comex-kpi" data-tone="' + x[2] + '"><span>' + x[0] +
        '</span><strong>' + x[1] + "</strong></div>";
    }).join("");
  }

  /* Gráfico anual (SVG) */
  function niceMax(v) {
    if (v <= 0) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p;
    var m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return m * p;
  }
  function axisLabel(v) {
    if (v >= 1e6) return nfInt.format(v / 1e6) + " mi";
    if (v >= 1e3) return nfInt.format(v / 1e3) + " mil";
    return nfInt.format(v);
  }
  function annualTip(c, k) {
    var d = c.annual[k], l = [YEARS[k] + (YEARS[k] === D.meta.parcial ? " (parcial)" : "")];
    if (c.showE) l.push("Exportação: US$ " + usd(d.e));
    if (c.showI) l.push("Importação: US$ " + usd(d.i));
    if (c.showE && c.showI) l.push("Saldo: " + (d.e - d.i < 0 ? "−" : "") + "US$ " + usd(Math.abs(d.e - d.i)));
    return l.join("\n");
  }
  function pairTip(c, name, a) {
    var l = [name];
    if (c.showE) l.push("Exportação: US$ " + usd(a.e));
    if (c.showI) l.push("Importação: US$ " + usd(a.i));
    if (c.showE && c.showI) {
      l.push("Total: US$ " + usd(a.t));
      l.push("Saldo: " + (a.s < 0 ? "−" : "") + "US$ " + usd(Math.abs(a.s)));
    }
    return l.join("\n");
  }
  function renderAnnual(c) {
    var W = 520, H = 220, L = 54, R = 10, T = 14, B = 34;
    var max = 0;
    c.annual.forEach(function (d) { max = Math.max(max, d.e, d.i); });
    var top = niceMax(max), iw = W - L - R, ih = H - T - B;
    var gw = iw / NY, bw = Math.min(16, (gw - 6) / 2);
    var out = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Exportações e importações por ano, em US$ FOB">';
    for (var t = 0; t <= 4; t++) {
      var v = top * t / 4, y = T + ih - (v / top) * ih;
      out += '<line class="cx-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '"/>' +
        '<text class="cx-axis" x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + axisLabel(v) + "</text>";
    }
    c.annual.forEach(function (d, k) {
      var cx = L + gw * k + gw / 2;
      var inRange = k >= c.a && k <= c.b;
      var op = inRange ? 1 : 0.3;
      var he = (d.e / top) * ih, hi = (d.i / top) * ih;
      out += '<rect x="' + (cx - bw - 1) + '" y="' + (T + ih - he) + '" width="' + bw + '" height="' + he +
        '" fill="' + COLOR_EXP + '" opacity="' + op + '"></rect>' +
        '<rect x="' + (cx + 1) + '" y="' + (T + ih - hi) + '" width="' + bw + '" height="' + hi +
        '" fill="' + COLOR_IMP + '" opacity="' + op + '"></rect>' +
        '<rect class="cx-hit" x="' + (L + gw * k) + '" y="' + T + '" width="' + gw + '" height="' + (ih + B) +
        '" data-tip="' + esc(annualTip(c, k)) + '" tabindex="0"></rect>' +
        '<text class="cx-axis" x="' + cx + '" y="' + (H - 14) + '" text-anchor="middle">' + YEARS[k] +
        (YEARS[k] === D.meta.parcial ? "*" : "") + "</text>";
    });
    out += "</svg>";
    el.annual.innerHTML = out;
  }

  /* Ranking */
  function renderTop(c) {
    el.topTitle.textContent = c.G.topTitle + " — " + periodLabel(c);
    var arr = c.list.slice().sort(function (x, y) { return y.t - x.t; }).slice(0, 6);
    var max = arr.length ? arr[0].t : 1;
    if (!arr.length) { el.top.innerHTML = '<p class="comex-empty">Sem dados para os filtros selecionados.</p>'; return; }
    el.top.innerHTML = arr.map(function (a) {
      var we = (a.e / max) * 100, wi = (a.i / max) * 100;
      return '<li data-tip="' + esc(pairTip(c, c.G.top(a), a)) + '" tabindex="0"><span class="bar-label">' + esc(c.G.top(a)) + " · " + compact(a.t) + "</span>" +
        '<span class="bar-track"><span class="cx-seg" style="width:' + we + '%;background:' + COLOR_EXP + '"></span>' +
        '<span class="cx-seg" style="width:' + wi + '%;background:' + COLOR_IMP + '"></span></span></li>';
    }).join("");
  }

  /* Tabela */
  function sorted(c) {
    var cols = columns(c);
    var key = state.sortKey;
    if (!key || !cols.some(function (x) { return x.key === key; })) {
      key = c.showE && c.showI ? "t" : c.showE ? "e" : "i";
    }
    var dir = state.sortDir;
    return c.list.slice().sort(function (x, y) {
      var a = x[key], b = y[key];
      if (typeof a === "number") return (a - b) * dir || (y.t - x.t);
      return String(a).localeCompare(String(b), "pt-BR") * dir;
    });
  }

  function renderTable(c) {
    var cols = columns(c);
    var list = sorted(c);
    var activeKey = state.sortKey && cols.some(function (x) { return x.key === state.sortKey; }) ? state.sortKey : null;
    el.thead.innerHTML = "<tr>" + cols.map(function (x) {
      var s = x.key === activeKey ? (state.sortDir > 0 ? "ascending" : "descending") : "none";
      var arrow = x.key === activeKey ? (state.sortDir > 0 ? " ▲" : " ▼") : "";
      return '<th scope="col" aria-sort="' + s + '"' + (x.num ? ' class="num"' : "") + '><button type="button" data-sort="' +
        x.key + '">' + x.label + arrow + "</button></th>";
    }).join("") + "</tr>";

    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (state.page >= pages) state.page = pages - 1;
    var start = state.page * PAGE_SIZE, slice = list.slice(start, start + PAGE_SIZE);

    if (!slice.length) {
      el.tbody.innerHTML = '<tr><td colspan="' + cols.length + '" class="comex-empty">Nenhum registro para os filtros selecionados.</td></tr>';
    } else {
      el.tbody.innerHTML = slice.map(function (g) {
        return "<tr>" + cols.map(function (x) {
          if (x.num) {
            var v = g[x.key];
            var cls = "num" + (x.key === "s" ? (v < 0 ? " neg" : v > 0 ? " pos" : "") : "");
            return '<td class="' + cls + '">' + (x.key === "s" && v < 0 ? "−" + usd(-v) : usd(v)) + "</td>";
          }
          var full = x.key === "d4" ? D.sh4[g.sh4] : x.key === "d2" ? D.sh2[g.sh2] : "";
          return "<td" + (full ? ' title="' + esc(full) + '"' : "") + ">" + esc(g[x.key]) + "</td>";
        }).join("") + "</tr>";
      }).join("");
    }

    el.pagina.textContent = "Página " + (state.page + 1) + " de " + pages;
    el.prev.disabled = state.page === 0;
    el.next.disabled = state.page >= pages - 1;
    el.resumo.textContent = list.length
      ? "Mostrando " + (start + 1) + "–" + (start + slice.length) + " de " + nfInt.format(list.length) +
        " registros · período " + periodLabel(c) + " · valores em US$ FOB"
      : "Nenhum registro para os filtros selecionados.";
    return list;
  }

  /* Principais destinos das exportações (respeita período, setor, capítulo, país e busca; ignora o filtro de fluxo) */
  function renderDestinos(c) {
    var f = c.f, terms = f.q ? f.q.split(/\s+/) : [], acc = {}, total = 0;
    rows.forEach(function (r) {
      if (f.sh2 && r.sh2 !== f.sh2) return;
      if (f.setor && r.setor !== f.setor) return;
      if (f.pais && r.pais !== f.pais) return;
      for (var t = 0; t < terms.length; t++) if (r.txt.indexOf(terms[t]) < 0) return;
      var v = sumRange(r.e, c.a, c.b);
      if (v <= 0) return;
      acc[r.pais] = (acc[r.pais] || 0) + v;
      total += v;
    });
    var arr = Object.keys(acc).map(function (k) { return { p: k, v: acc[k] }; })
      .sort(function (x, y) { return y.v - x.v; });
    var n = arr.length, top = arr.slice(0, 8);
    el.destTitle.textContent = "Principais destinos das exportações — " + periodLabel(c);
    if (!top.length) { el.dest.innerHTML = '<li class="comex-empty">Sem exportações para os filtros selecionados.</li>'; el.destNote.textContent = ""; return; }
    var max = top[0].v, acum = 0;
    top.forEach(function (x) { acum += x.v; });
    el.dest.innerHTML = top.map(function (x, k) {
      return '<li data-tip="' + esc(x.p + "\n" + (k + 1) + "º destino\nExportação: US$ " + usd(x.v) + "\nParticipação: " + nfDec.format(x.v / total * 100) + "% do recorte") + '" tabindex="0"><span class="comex-dest-row"><span class="comex-dest-rank">' + (k + 1) + '</span>' +
        '<span class="comex-dest-name">' + esc(x.p) + '</span>' +
        '<span class="bar-track"><span class="bar-fill" data-tone="green" style="--value:' + (x.v / max * 100) + '%"></span></span>' +
        '<span class="comex-dest-val">' + compact(x.v) + ' <em>' + nfDec.format(x.v / total * 100) + '%</em></span></span></li>';
    }).join("");
    el.destNote.textContent = "Os " + top.length + " principais destinos somam " + nfDec.format(acum / total * 100) +
      "% das exportações do recorte, de um total de " + nfInt.format(n) + " países de destino (" + compact(total) + ").";
  }

  var lastList = [], lastCtx = null;

  function render(resetPage) {
    if (resetPage) state.page = 0;
    var c = compute();
    lastCtx = c;
    renderKpis(c);
    renderAnnual(c);
    renderTop(c);
    renderDestinos(c);
    lastList = renderTable(c);
  }

  /* Eventos */
  [el.fluxo, el.de, el.ate, el.setor, el.sh2, el.pais, el.grupo].forEach(function (n) {
    n.addEventListener("change", function () { state.sortKey = null; state.sortDir = -1; render(true); });
  });
  var timer;
  el.busca.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(function () { render(true); }, 180);
  });
  el.limpar.addEventListener("click", function () {
    el.fluxo.value = "ambos"; el.de.value = YEARS[0]; el.ate.value = YEARS[NY - 1];
    el.sh2.value = ""; el.setor.value = ""; el.pais.value = ""; el.busca.value = ""; el.grupo.value = "setor";
    state.sortKey = null; state.sortDir = -1; render(true);
  });
  el.prev.addEventListener("click", function () { state.page--; render(false); });
  el.next.addEventListener("click", function () { state.page++; render(false); });
  el.thead.addEventListener("click", function (ev) {
    var btn = ev.target.closest("button[data-sort]");
    if (!btn) return;
    var k = btn.getAttribute("data-sort");
    if (state.sortKey === k) state.sortDir = -state.sortDir;
    else { state.sortKey = k; state.sortDir = (k === "e" || k === "i" || k === "s") ? -1 : 1; }
    render(true);
  });

  el.csv.addEventListener("click", function () {
    if (!lastCtx) return;
    var cols = columns(lastCtx);
    var list = sorted(lastCtx);
    var q = function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; };
    var lines = [cols.map(function (x) { return q(x.label); }).join(";")];
    list.forEach(function (g) {
      lines.push(cols.map(function (x) { return x.num ? Math.round(g[x.key]) : q(g[x.key]); }).join(";"));
    });
    var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mogi-mirim-comercio-exterior-" + lastCtx.f.de + "-" + lastCtx.f.ate + ".csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });

  render(true);
})();
