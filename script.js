const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("active");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* Tooltip global: qualquer elemento com data-tip mostra os valores ao passar o cursor, focar ou tocar */
(function () {
  var tip = document.createElement("div");
  tip.className = "chart-tip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  document.body.appendChild(tip);

  function show(target, x, y) {
    tip.textContent = target.getAttribute("data-tip");
    tip.hidden = false;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.min(Math.max(8, x + 14), window.innerWidth - w - 8);
    var top = y + 18 + h > window.innerHeight ? y - h - 14 : y + 18;
    tip.style.left = left + "px";
    tip.style.top = Math.max(8, top) + "px";
  }
  function hide() { tip.hidden = true; }

  document.addEventListener("mousemove", function (ev) {
    var t = ev.target.closest && ev.target.closest("[data-tip]");
    if (t) show(t, ev.clientX, ev.clientY); else hide();
  });
  document.addEventListener("mouseleave", hide);
  document.addEventListener("click", function (ev) {
    var t = ev.target.closest && ev.target.closest("[data-tip]");
    if (t) show(t, ev.clientX, ev.clientY); else hide();
  });
  document.addEventListener("focusin", function (ev) {
    var t = ev.target.closest && ev.target.closest("[data-tip]");
    if (!t) return;
    var r = t.getBoundingClientRect();
    show(t, r.left + r.width / 2, r.top);
  });
  document.addEventListener("focusout", hide);
  window.addEventListener("scroll", hide, { passive: true });
})();

/* Tabelas empilhadas no celular: copia o título da coluna para cada célula */
(function () {
  function label(table) {
    var heads = Array.prototype.map.call(table.querySelectorAll("thead th"), function (th) {
      return th.textContent.replace(/[▲▼]/g, "").replace(/\s*\(US\$ FOB\)/, "").trim();
    });
    table.querySelectorAll("tbody tr").forEach(function (tr) {
      Array.prototype.forEach.call(tr.children, function (td, i) {
        if (heads[i] && td.getAttribute("data-label") !== heads[i]) td.setAttribute("data-label", heads[i]);
      });
    });
  }
  document.querySelectorAll("table.stack").forEach(function (t) {
    label(t);
    new MutationObserver(function () { label(t); }).observe(t, { childList: true, subtree: true });
  });

  /* Blocos recolhíveis começam fechados no celular */
  if (window.matchMedia("(max-width: 700px)").matches) {
    document.querySelectorAll("details[data-collapse-mobile]").forEach(function (d) { d.open = false; });
  }
})();

/* No celular, gráficos rolados começam pelos anos mais recentes */
window.addEventListener("load", function () {
  if (!window.matchMedia("(max-width: 700px)").matches) return;
  setTimeout(function () {
    document.querySelectorAll(".comex-chart, .cg-chart").forEach(function (c) { c.scrollLeft = c.scrollWidth; });
  }, 300);
});
