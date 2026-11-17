/* Mercado de trabalho — Novo CAGED (dados em caged-data.js) */
(function () {
  "use strict";
  var D = window.CAGED_DATA, root = document.getElementById("caged");
  if (!D || !root) return;
  var MES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  var MESL = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  var nf = new Intl.NumberFormat("pt-BR");
  var nd = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var $ = function (id) { return document.getElementById(id); };
  function sg(n) { return (n > 0 ? "+" : n < 0 ? "−" : "") + nf.format(Math.abs(n)); }
  function cls(n) { return n > 0 ? "pos" : n < 0 ? "neg" : ""; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }

  var anos = D.saldo.map(function (_, i) { return D.inicio + i; });
  var anual = D.saldo.map(sum);
  var state = { modo: "mensal", ano: "todos" };

  var i25 = anos.indexOf(2025), i26 = anos.indexOf(2026);
  var tot = sum(anual);
  var k = [
    ["Saldo em 2025", sg(anual[i25]), "green"],
    ["Saldo jan–set/2026", sg(anual[i26]), "yellow"],
    ["Saldo acumulado desde 2020", sg(tot), "green"],
    ["Estoque de empregos formais (" + D.ref + ")", nf.format(D.estoque), "red"]
  ];
  $("cg-kpis").innerHTML = k.map(function (x) {
    return '<div class="comex-kpi" data-tone="' + x[2] + '"><span>' + x[0] + "</span><strong>" + x[1] + "</strong></div>";
  }).join("");

  function pts() {
    var out = [];
    if (state.modo === "anual") {
      anual.forEach(function (v, i) {
        var parcial = i === i26;
        out.push({ v: v, l: String(anos[i]) + (parcial ? "*" : ""), tip: "Ano " + anos[i] + (parcial ? " (jan–set)" : "") + "\nSaldo: " + sg(v) + " vínculos" });
      });
    } else {
      D.saldo.forEach(function (arr, i) {
        if (state.ano !== "todos" && +state.ano !== anos[i]) return;
        arr.forEach(function (v, m) {
          out.push({ v: v, l: m === 0 || state.ano !== "todos" ? MES[m] + (m === 0 ? "/" + String(anos[i]).slice(2) : "") : "", tip: MESL[m].charAt(0).toUpperCase() + MESL[m].slice(1) + " de " + anos[i] + "\nSaldo: " + sg(v) + " vínculos" });
        });
      });
    }
    return out;
  }

  function draw() {
    var P = pts(), W = 760, H = 270, L = 46, R = 8, T = 18, B = 30, iw = W - L - R, ih = H - T - B;
    var mx = Math.max.apply(null, P.map(function (p) { return p.v; }).concat([0]));
    var mn = Math.min.apply(null, P.map(function (p) { return p.v; }).concat([0]));
    var step = state.modo === "anual" ? 500 : 200;
    mx = Math.ceil(mx / step) * step; mn = Math.floor(mn / step) * step;
    var y = function (v) { return T + (mx - v) / (mx - mn) * ih; };
    var gw = iw / P.length, bw = Math.max(2, Math.min(34, gw * 0.7));
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Saldo de empregos formais">';
    for (var t = mn; t <= mx; t += step) {
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(t) + '" y2="' + y(t) + '" class="' + (t === 0 ? "cg-zero" : "cg-grid") + '"/><text x="' + (L - 6) + '" y="' + (y(t) + 4) + '" text-anchor="end" class="cg-axis">' + nf.format(t) + "</text>";
    }
    P.forEach(function (p, i) {
      var x = L + gw * i + (gw - bw) / 2, y0 = y(0), y1 = y(p.v);
      s += '<rect x="' + x + '" y="' + Math.min(y0, y1) + '" width="' + bw + '" height="' + Math.max(1, Math.abs(y1 - y0)) + '" class="' + (p.v < 0 ? "cg-neg" : "cg-pos") + '"/>';
      if (state.modo === "anual" || state.ano !== "todos") {
        s += '<text x="' + (x + bw / 2) + '" y="' + (p.v >= 0 ? y1 - 4 : y1 + 12) + '" text-anchor="middle" class="cg-val">' + nf.format(p.v) + "</text>";
      }
      if (p.l) s += '<text x="' + (x + bw / 2) + '" y="' + (H - 10) + '" text-anchor="middle" class="cg-axis">' + p.l + "</text>";
      s += '<rect class="cx-hit" x="' + (L + gw * i) + '" y="' + T + '" width="' + gw + '" height="' + ih + '" data-tip="' + esc(p.tip) + '" tabindex="0"></rect>';
    });
    $("cg-chart").innerHTML = s + "</svg>";
    $("cg-title").textContent = state.modo === "anual" ? "Saldo anual de empregos formais" : "Saldo mensal de empregos formais" + (state.ano === "todos" ? ", 2020 a set/2026" : " em " + state.ano);
    $("cg-ano-wrap").hidden = state.modo === "anual";
  }

  var sel = $("cg-ano");
  sel.innerHTML = '<option value="todos">Todos os anos</option>' + anos.map(function (a) { return '<option value="' + a + '">' + a + "</option>"; }).join("");
  sel.addEventListener("change", function () { state.ano = sel.value; draw(); });
  root.querySelectorAll("[data-cg-modo]").forEach(function (b) {
    b.addEventListener("click", function () {
      state.modo = b.getAttribute("data-cg-modo");
      root.querySelectorAll("[data-cg-modo]").forEach(function (o) {
        var on = o === b; o.classList.toggle("is-active", on); o.setAttribute("aria-pressed", on);
      });
      draw();
    });
  });
  draw();

  /* Retrato do mês de referência */
  function bars(arr, id) {
    var m = Math.max.apply(null, arr.map(function (a) { return Math.abs(a[1]); })) || 1;
    $(id).innerHTML = arr.map(function (a) {
      var w = Math.abs(a[1]) / m * 50;
      var tip = a[0] + "\nSaldo em " + D.ref + ": " + sg(a[1]);
      return '<li data-tip="' + esc(tip) + '" tabindex="0"><span class="cg-lab">' + a[0] + '</span><span class="cg-track"><i class="' + (a[1] < 0 ? "cg-neg" : "cg-pos") + '" style="width:' + w + "%;" + (a[1] < 0 ? "right:50%" : "left:50%") + '"></i></span><b class="' + cls(a[1]) + '">' + sg(a[1]) + "</b></li>";
    }).join("");
  }
  bars(D.escolaridade, "cg-esc"); bars(D.faixa, "cg-fx"); bars(D.sexo, "cg-sx");

  function table(rows, id, tempoIdx, head) {
    $(id).innerHTML = "<thead><tr>" + head.map(function (h, i) { return "<th" + (i ? ' class="num"' : "") + ">" + h + "</th>"; }).join("") + "</tr></thead><tbody>" + rows.map(function (r, ri) {
      var total = r[0] === "Total";
      return "<tr" + (total ? ' class="cg-total"' : "") + "><td>" + r[0] + '</td><td class="num">' + nf.format(r[1]) + '</td><td class="num">' + nf.format(r[2]) + '</td><td class="num ' + cls(r[3]) + '">' + sg(r[3]) + '</td><td class="num">' + (r[4] == null ? "—" : nd.format(r[4])) + "</td></tr>";
    }).join("") + "</tbody>";
  }
  var H = ["", "Admissões", "Desligamentos", "Saldo", "Tempo médio no emprego (meses)"];
  table(D.setores, "cg-setores", 4, ["Grande setor"].concat(H.slice(1)));
  table(D.ocupacoes, "cg-ocup", 4, ["Grande grupo de ocupação"].concat(H.slice(1)));
})();
