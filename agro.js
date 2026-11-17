/* Produção agrícola de Mogi Mirim, 2016–2025 (toneladas) e variações percentuais */
(function () {
  "use strict";
  var D = window.AGRO_DATA, root = document.getElementById("agro");
  if (!D || !root) return;

  var A = D.anos, N = A.length;
  /* Culturas sem produção em 2025 (série zerada ou encerrada) ficam fora */
  var P = D.produtos.filter(function (p) { return p.v[D.anos.length - 1] > 0; });
  var $ = function (id) { return document.getElementById(id) || document.createElement("select"); };
  var el = { sel: $("ag-prod"), kpis: $("ag-kpis"), chart: $("ag-chart"), title: $("ag-title") };
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
      out += (h > 0 ? '<rect x="' + (cx - bw / 2) + '" y="' + y + '" width="' + bw + '" height="' + h + '" rx="3" fill="#0f7a36"/>' : "") +
        (has(x) && x > 0 ? '<text class="cx-axis ag-val" x="' + cx + '" y="' + (y - 6) + '" text-anchor="middle">' + short(x) + "</text>" : "") +
        '<text class="cx-axis" x="' + cx + '" y="' + (H - 26) + '" text-anchor="middle">' + A[k] + "</text>" +
        '<text class="ag-yoy ' + cls(yy) + '" x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + (k === 0 ? "" : fp(yy)) + "</text>" +
        '<rect class="cx-hit" x="' + (L + gw * k) + '" y="' + T + '" width="' + gw + '" height="' + (ih + B) + '" data-tip="' + esc(tip) + '" tabindex="0"></rect>';
    });
    out += "</svg>";
    el.chart.innerHTML = out;
  }

  function select(n) {
    cur = P.filter(function (p) { return p.n === n; })[0] || P[0];
    el.sel.value = cur.n;
    renderKpis(); renderChart();
  }
  el.sel.addEventListener("change", function () { select(el.sel.value); });
  renderKpis(); renderChart();

  /* Panorama 2025: indicadores e ranking das culturas (página Agricultura) */
  var rank = document.getElementById("ag-rank"), pan = document.getElementById("ag-panorama");
  if (pan) {
    var CIT = ["Laranja", "Limão", "Tangerina"];
    var cit = function (k) { return D.produtos.filter(function (p) { return CIT.indexOf(p.n) >= 0; }).reduce(function (s, p) { return s + (p.v[k] || 0); }, 0); };
    var top1 = P.slice().sort(function (a, b) { return b.v[N - 1] - a.v[N - 1]; })[0];
    var alta = P.filter(function (p) { var x = tot(p); return x !== null && x > 0; }).length;
    var items = [
      ["Culturas com produção em " + A[N - 1], String(P.length)],
      ["Maior cultura", top1.n + "<small>" + short(top1.v[N - 1]) + " t</small>"],
      ["Citros (laranja, limão, tangerina)", short(cit(N - 1)) + " t<small>" + fp(pct(cit(N - 1), cit(0))) + " desde " + A[0] + "</small>"],
      ["Culturas em alta desde " + A[0], alta + " de " + P.filter(function (p) { return tot(p) !== null; }).length]
    ];
    pan.innerHTML = items.map(function (x) { return '<div class="comex-kpi"><span>' + x[0] + "</span><strong>" + x[1] + "</strong></div>"; }).join("");
  }
  if (rank) {
    var R = P.slice().sort(function (a, b) { return b.v[N - 1] - a.v[N - 1]; }), mx = R[0].v[N - 1];
    rank.innerHTML = R.map(function (p, k) {
      var v = p.v[N - 1], tt = tot(p);
      var tip = p.n + "\nProdução em " + A[N - 1] + ": " + nf.format(v) + " t\nVariação desde " + A[0] + ": " + fp(tt);
      return '<li data-tip="' + esc(tip) + '"><button type="button" class="ag-rank-btn" data-prod="' + esc(p.n) + '"><span class="comex-dest-row">' +
        '<span class="comex-dest-rank">' + (k + 1) + '</span><span class="comex-dest-name">' + esc(p.n) + "</span>" +
        '<span class="bar-track"><span class="bar-fill" data-tone="green" style="--value:' + Math.max(0.6, v / mx * 100) + '%"></span></span>' +
        '<span class="comex-dest-val">' + short(v) + ' t <em class="' + cls(tt) + '">' + fp(tt) + "</em></span></span></button></li>";
    }).join("");
    rank.addEventListener("click", function (ev) {
      var b = ev.target.closest("button[data-prod]"); if (!b) return;
      select(b.getAttribute("data-prod"));
      document.getElementById("por-cultura").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
})();
