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

const contactForm = document.querySelector(".contact-form");
const formError = document.querySelector(".form-error");

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      if (formError) {
        formError.textContent = "Preencha todos os campos obrigatórios antes de enviar.";
        formError.hidden = false;
      }
      contactForm.reportValidity();
      return;
    }

    if (formError) {
      formError.hidden = true;
    }

    alert(
      "Mensagem registrada para demonstração. Para envio real, será necessário integrar o formulário a um serviço de e-mail ou backend."
    );

    contactForm.reset();
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
