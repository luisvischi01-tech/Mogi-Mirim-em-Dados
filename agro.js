/* Produção agrícola de Mogi Mirim, 2016–2025 (toneladas) e variações percentuais */
(function () {
  "use strict";
  var D = window.AGRO_DATA, root = document.getElementById("agro");
  if (!D || !root) return;

  var A = D.anos, N = A.length;
  /* Culturas sem produção em 2025 (série zerada ou encerrada) ficam fora */
  var P = D.produtos.filter(function (p) { return p.v[D.anos.length - 1] > 0; });
  var $ = function (id) { return document.getElementById(id); };
  var el = { sel: $("ag-prod"), kpis: $("ag-kpis"), chart: $("ag-chart"), title: $("ag-title"), tipo: $("ag-tipo"), busca: $("ag-busca"),
    modo: $("ag-modo"), thead: $("ag-thead"), tbody: $("ag-tbody"), resumo: $("ag-resumo"), csv: $("ag-csv") };
  var nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  var nfd = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function norm(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function has(v) { return v !== null && v !== undefined; }
  function pct(a, b) { return has(a) && has(b) && b > 0 ? (a - b) / b * 100 : null; }
  function fp(p) { return p === null ? "—" : (p > 0 ? "+" : p < 0 ? "−" : "") + nfd.format(Math.abs(p)) + "%"; }
  function cls(p) { return p === null ? "" : p > 0.05 ? "pos" : p < -0.05 ? "neg" : ""; }
  function t(v) { return v ? nf.format(v) : "—"; }
  function short(v) {
    if (!has(v)) return "";
    if (v >= 1e6) return nfd.format(v / 1e6) + " mi";
    if (v >= 1e3) return nfd.format(v / 1e3) + " mil";
    return nf.format(v);
  }
  function yoy(p, k) { return k > 0 ? pct(p.v[k], p.v[k - 1]) : null; }
  function tot(p) { return pct(p.v[N - 1], p.v[0]); }

  P.forEach(function (p) { el.sel.add(new Option(p.n, p.n)); });
  var cur = P[0];
  el.sel.value = cur.n;

  function renderKpis() {
    var last = cur.v[N - 1], peak = -1, pk = 0;
    cur.v.forEach(function (x, k) { if (has(x) && x > peak) { peak = x; pk = k; } });
    var items = [
      ["Produção em " + A[N - 1], has(last) ? nf.format(last) + " t" : "—", "green"],
      ["Variação " + A[N - 1] + "/" + A[N - 2], fp(yoy(cur, N - 1)), "yellow"],
      ["Variação " + A[0] + "–" + A[N - 1], fp(tot(cur)), "red"],
      ["Maior produção da série", peak > 0 ? nf.format(peak) + " t · " + A[pk] : "—", "green"]
    ];
    el.kpis.innerHTML = items.map(function (x) {
      return '<div class="comex-kpi" data-tone="' + x[2] + '"><span>' + x[0] + "</span><strong>" + x[1] + "</strong></div>";
    }).join("");
  }

  function renderChart() {
    el.title.textContent = cur.n + " — produção anual (toneladas), " + A[0] + "–" + A[N - 1];
    var W = 560, H = 230, L = 54, R = 10, T = 26, B = 44, iw = W - L - R, ih = H - T - B;
    var max = Math.max.apply(null, cur.v.map(function (x) { return x || 0; })) || 1;
    var p10 = Math.pow(10, Math.floor(Math.log10(max))), nn = max / p10;
    var top = (nn <= 1 ? 1 : nn <= 2 ? 2 : nn <= 5 ? 5 : 10) * p10;
    var gw = iw / N, bw = Math.min(34, gw - 12);
    var out = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Produção anual de ' + esc(cur.n) + ' em toneladas">';
    for (var g = 0; g <= 4; g++) {
      var val = top * g / 4, y = T + ih - val / top * ih;
      out += '<line class="cx-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '"/><text class="cx-axis" x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + short(val) + "</text>";
    }
    cur.v.forEach(function (x, k) {
      var cx = L + gw * k + gw / 2, h = has(x) ? x / top * ih : 0, y = T + ih - h, yy = yoy(cur, k);
      var tip = A[k] + "\n" + (has(x) ? "Produção: " + nf.format(x) + " t" : "Produção: não disponível") +
        "\nVariação sobre " + A[k - 1 < 0 ? 0 : k - 1] + ": " + (k === 0 ? "—" : fp(yy)) + "\nVariação sobre " + A[0] + ": " + (k === 0 ? "—" : fp(pct(x, cur.v[0])));
      out += (h > 0 ? '<rect x="' + (cx - bw / 2) + '" y="' + y + '" width="' + bw + '" height="' + h + '" rx="3" fill="#129138"/>' : "") +
        (has(x) && x > 0 ? '<text class="cx-axis ag-val" x="' + cx + '" y="' + (y - 6) + '" text-anchor="middle">' + short(x) + "</text>" : "") +
        '<text class="cx-axis" x="' + cx + '" y="' + (H - 26) + '" text-anchor="middle">' + A[k] + "</text>" +
        '<text class="ag-yoy ' + cls(yy) + '" x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + (k === 0 ? "" : fp(yy)) + "</text>" +
        '<rect class="cx-hit" x="' + (L + gw * k) + '" y="' + T + '" width="' + gw + '" height="' + (ih + B) + '" data-tip="' + esc(tip) + '" tabindex="0"></rect>';
    });
    out += "</svg>";
    el.chart.innerHTML = out;
  }

  /* Tabela */
  var state = { sortKey: "ult", dir: -1, modo: "ton" };
  function value(p, key) {
    if (key === "n") return p.n;
    if (key === "t") return p.t;
    if (key === "tot") return tot(p);
    if (key === "ult") return has(p.v[N - 1]) ? p.v[N - 1] : -1;
    var k = +key;
    return state.modo === "ton" ? (has(p.v[k]) ? p.v[k] : -1) : yoy(p, k);
  }
  function list() {
    var q = norm(el.busca.value.trim()), tipo = el.tipo.value;
    var l = P.filter(function (p) { return (!tipo || p.t === tipo) && (!q || norm(p.n).indexOf(q) >= 0); });
    var key = state.sortKey, d = state.dir;
    l.sort(function (a, b) {
      var x = value(a, key), y = value(b, key);
      if (x === null && y === null) return 0;
      if (x === null) return 1;
      if (y === null) return -1;
      if (typeof x === "string") return x.localeCompare(y, "pt-BR") * d;
      return (x - y) * d;
    });
    return l;
  }
  function renderTable() {
    var heads = [["n", "Produto"], ["t", "Tipo"]].concat(A.map(function (a, k) { return [String(k), String(a)]; })).concat([["tot", "Var. " + A[0] + "–" + A[N - 1]]]);
    el.thead.innerHTML = "<tr>" + heads.map(function (h) {
      var on = state.sortKey === h[0], num = h[0] !== "n" && h[0] !== "t";
      return '<th scope="col" aria-sort="' + (on ? (state.dir > 0 ? "ascending" : "descending") : "none") + '"' + (num ? ' class="num"' : "") + '><button type="button" data-sort="' + h[0] + '">' + h[1] + (on ? (state.dir > 0 ? " ▲" : " ▼") : "") + "</button></th>";
    }).join("") + "</tr>";
    var l = list();
    el.tbody.innerHTML = l.length ? l.map(function (p) {
      var cells = A.map(function (a, k) {
        var x = p.v[k], y = yoy(p, k);
        var tip = p.n + " — " + a + "\nProdução: " + (has(x) ? nf.format(x) + " t" : "não disponível") + (k > 0 ? "\nVariação anual: " + fp(y) : "");
        if (state.modo === "ton") return '<td class="num" data-tip="' + esc(tip) + '">' + t(x) + "</td>";
        return '<td class="num ' + cls(y) + '" data-tip="' + esc(tip) + '">' + (k === 0 ? t(x) : fp(y)) + "</td>";
      }).join("");
      var tt = tot(p);
      return '<tr><td><button type="button" class="ag-link" data-prod="' + esc(p.n) + '">' + esc(p.n) + "</button></td><td>" + p.t + "</td>" + cells +
        '<td class="num ' + cls(tt) + '"><strong>' + fp(tt) + "</strong></td></tr>";
    }).join("") : '<tr><td colspan="' + (A.length + 3) + '" class="comex-empty">Nenhum produto para os filtros selecionados.</td></tr>';
    el.resumo.textContent = l.length + " produtos · " + (state.modo === "ton" ? "quantidade produzida, em toneladas" : "variação percentual sobre o ano anterior (2016 em toneladas)");
  }

  function select(n) {
    cur = P.filter(function (p) { return p.n === n; })[0] || P[0];
    el.sel.value = cur.n;
    renderKpis(); renderChart();
  }
  el.sel.addEventListener("change", function () { select(el.sel.value); });
  el.tipo.addEventListener("change", renderTable);
  el.busca.addEventListener("input", renderTable);
  el.modo.addEventListener("change", function () { state.modo = el.modo.value; if (/^\d+$/.test(state.sortKey)) state.sortKey = "ult"; renderTable(); });
  el.thead.addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-sort]"); if (!b) return;
    var k = b.getAttribute("data-sort");
    if (state.sortKey === k) state.dir = -state.dir; else { state.sortKey = k; state.dir = (k === "n" || k === "t") ? 1 : -1; }
    renderTable();
  });
  el.tbody.addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-prod]"); if (!b) return;
    select(b.getAttribute("data-prod"));
    el.sel.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  el.csv.addEventListener("click", function () {
    var q = function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; };
    var lines = [["Produto", "Tipo"].concat(A.map(function (a) { return a + " (t)"; })).concat(A.slice(1).map(function (a) { return "Var. " + a + " (%)"; })).concat(["Var. " + A[0] + "–" + A[N - 1] + " (%)"]).map(q).join(";")];
    list().forEach(function (p) {
      var row = [q(p.n), q(p.t)].concat(p.v.map(function (x) { return x ? x : ""; }));
      for (var k = 1; k < N; k++) { var y = yoy(p, k); row.push(y === null ? "" : y.toFixed(1).replace(".", ",")); }
      var tt = tot(p); row.push(tt === null ? "" : tt.toFixed(1).replace(".", ","));
      lines.push(row.join(";"));
    });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    a.download = "mogi-mirim-producao-agricola-2016-2025.csv";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });

  renderKpis(); renderChart(); renderTable();
})();
