/* Estrutura empresarial de Mogi Mirim — dados agregados em empresas-data.js */
(function () {
  "use strict";
  var D = window.EMPRESAS_DATA, root = document.getElementById("empresas");
  if (!D || !root) return;

  var CATS = [
    { k: "MEI e empresário individual (estimado)", s: "MEI/EI", color: "#129138" },
    { k: "Microempresa", s: "Micro", color: "#d9a000" },
    { k: "Pequena empresa", s: "Pequena", color: "#db1225" },
    { k: "Média/grande (conforme a base)", s: "Média/grande", color: "#14181a" },
    { k: "Produtor rural pessoa física", s: "Produtor rural", color: "#8fbf9f" }
  ];
  var nf = new Intl.NumberFormat("pt-BR");
  var nfp = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var $ = function (id) { return document.getElementById(id); };
  var el = { kpis: $("em-kpis"), tabs: root.querySelectorAll("[data-em-tab]"), chart: $("em-chart"), title: $("em-title"), legend: $("em-legend"), ind: $("em-ind"), indWrap: $("em-ind-wrap"), note: $("em-note") };
  var state = { tab: "secoes", onlyInd: false };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }

  var T = D.total, TT = sum(T);
  el.kpis.innerHTML = [["Registros na base", nf.format(TT), "green"]].concat(CATS.map(function (c, i) {
    return [["MEI e empresários indiv.*","Microempresa","Pequena empresa","Média/grande","Produtor rural PF"][i], nf.format(T[i]) + " · " + nfp.format(T[i] / TT * 100) + "%", ["green", "yellow", "red", "green", "yellow"][i]];
  })).map(function (x) {
    return '<div class="comex-kpi" data-tone="' + x[2] + '"><span>' + x[0] + "</span><strong>" + x[1] + "</strong></div>";
  }).join("");

  el.legend.innerHTML = CATS.map(function (c) {
    return '<span><i style="background:' + c.color + '"></i>' + c.k + "</span>";
  }).join("");

  var VIEWS = {
    secoes: { title: "Setores produtivos — registros por porte", data: function () { return D.secoes.slice(0, 10); }, label: function (x) { return x.n; } },
    industria: { title: "Setores industriais — registros por porte", data: function () { return D.industria.slice(0, 10); }, label: function (x) { return x.n; } },
    atividades: {
      title: "Atividades mais frequentes (CNAE principal) — registros por porte",
      data: function () {
        return D.atividades.filter(function (x) { return !state.onlyInd || x.i; }).slice(0, 10);
      },
      label: function (x) { return x.n.length > 62 ? x.n.slice(0, 61).trim() + "…" : x.n; }
    }
  };

  function render() {
    var v = VIEWS[state.tab], rows = v.data();
    el.title.textContent = v.title;
    el.indWrap.hidden = state.tab !== "atividades";
    var max = Math.max.apply(null, rows.map(function (r) { return sum(r.c); }));
    el.chart.innerHTML = rows.map(function (r) {
      var t = sum(r.c);
      var segs = r.c.map(function (n, i) {
        return n ? '<span class="em-seg" style="width:' + (n / max * 100) + "%;background:" + CATS[i].color + '" data-tip="' +
          esc(v.label(r) + "\n" + CATS[i].k + ": " + nf.format(n) + " (" + nfp.format(n / t * 100) + "% do grupo)\nTotal do grupo: " + nf.format(t) + " registros") + '" tabindex="0"></span>' : "";
      }).join("");
      var parts = r.c.map(function (n, i) { return n ? CATS[i].s + " " + nf.format(n) : ""; }).filter(Boolean).join(" · ");
      return '<li><span class="em-name">' + esc(v.label(r)) + (r.k ? ' <small>CNAE ' + r.k.slice(0, 4) + "-" + r.k.slice(4, 5) + "/" + r.k.slice(5) + "</small>" : "") +
        '</span><span class="em-bar">' + segs + '</span><span class="em-total">' + nf.format(t) + '</span><span class="em-detail">' + esc(parts) + "</span></li>";
    }).join("");
    Array.prototype.forEach.call(el.tabs, function (b) {
      var on = b.getAttribute("data-em-tab") === state.tab;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.classList.toggle("is-active", on);
    });
  }

  Array.prototype.forEach.call(el.tabs, function (b) {
    b.addEventListener("click", function () { state.tab = b.getAttribute("data-em-tab"); render(); });
  });
  el.ind.addEventListener("change", function () { state.onlyInd = el.ind.checked; render(); });
  render();
})();
