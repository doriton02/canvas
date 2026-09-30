(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header: scrolled state ---------- */
  var header = document.querySelector(".site-header");
  var toTop = document.querySelector(".to-top");
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 20);
    if (toTop) toTop.classList.toggle("is-show", y > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".menu-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    });
    document.querySelectorAll(".gnav a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) toggle.click();
    });
  }

  /* ---------- Current page in nav ---------- */
  var section = document.body.getAttribute("data-section");
  if (section) {
    document.querySelectorAll('.gnav a[data-nav="' + section + '"]').forEach(function (a) {
      a.setAttribute("aria-current", "page");
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Count-up numbers ---------- */
  var counters = document.querySelectorAll("[data-count]");
  function runCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (reduceMotion) { el.textContent = target; return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: .5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- Hero: paint on the canvas ---------- */
  var cv = document.querySelector(".hero__paint");
  if (cv && cv.getContext && !reduceMotion) {
    var ctx = cv.getContext("2d");
    var colors = ["#2e56e6", "#e5432a", "#f4b400", "#1e9e6a"];
    var strokes = [];
    var last = null, hue = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      var r = cv.getBoundingClientRect();
      cv.width = r.width * dpr;
      cv.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function pos(e) {
      var r = cv.getBoundingClientRect();
      var p = e.touches ? e.touches[0] : e;
      return { x: p.clientX - r.left, y: p.clientY - r.top };
    }
    function add(e) {
      var p = pos(e);
      if (last) {
        var dx = p.x - last.x, dy = p.y - last.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 4) return;
        strokes.push({
          x1: last.x, y1: last.y, x2: p.x, y2: p.y,
          w: Math.max(6, 34 - dist * .4),
          c: colors[Math.floor(hue) % colors.length],
          life: 1
        });
        hue += .04;
      }
      last = p;
    }
    var hero = cv.parentElement;
    hero.addEventListener("pointermove", add);
    hero.addEventListener("pointerleave", function () { last = null; });
    hero.addEventListener("touchmove", add, { passive: true });
    hero.addEventListener("touchend", function () { last = null; });

    (function loop() {
      var w = cv.width / dpr, h = cv.height / dpr;
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      for (var i = strokes.length - 1; i >= 0; i--) {
        var s = strokes[i];
        s.life -= .006;
        if (s.life <= 0) { strokes.splice(i, 1); continue; }
        ctx.globalAlpha = s.life * .55;
        ctx.strokeStyle = s.c;
        ctx.lineWidth = s.w;
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Tabs (News) ---------- */
  document.querySelectorAll("[data-tabs]").forEach(function (wrap) {
    var buttons = wrap.querySelectorAll('[role="tab"]');
    var items = document.querySelectorAll("[data-cat]");
    function select(btn) {
      buttons.forEach(function (b) { b.setAttribute("aria-selected", String(b === btn)); });
      var f = btn.getAttribute("data-filter");
      items.forEach(function (it) {
        it.hidden = !(f === "all" || it.getAttribute("data-cat") === f);
      });
      if (history.replaceState) history.replaceState(null, "", f === "all" ? location.pathname : "#" + f);
    }
    buttons.forEach(function (b) { b.addEventListener("click", function () { select(b); }); });
    var hash = location.hash.slice(1);
    buttons.forEach(function (b) { if (b.getAttribute("data-filter") === hash) select(b); });
  });

  /* ---------- Email (assembled to avoid simple scraping) ---------- */
  var mailUser = document.body.getAttribute("data-mail-user") || "info";
  var mailHost = document.body.getAttribute("data-mail-host") || "";
  document.querySelectorAll("[data-mail]").forEach(function (el) {
    var addr = mailUser + "@" + mailHost;
    el.textContent = addr;
    if (el.tagName === "A") el.href = "mailto:" + addr;
  });

  /* ---------- Contact form ---------- */
  var form = document.querySelector("#contact-form");
  if (form) {
    form.setAttribute("novalidate", "");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (f) {
        var err = form.querySelector('[data-error-for="' + f.id + '"]');
        var valid = f.checkValidity();
        f.setAttribute("aria-invalid", String(!valid));
        if (err) err.textContent = valid ? "" : (f.type === "email" && f.value ? "メールアドレスの形式をご確認ください" : "入力してください");
        if (!valid && ok) { f.focus(); ok = false; }
      });
      if (!ok) return;

      var data = new FormData(form);
      var lines = [
        "お名前: " + data.get("name"),
        "メールアドレス: " + data.get("email"),
        "電話番号: " + data.get("tel"),
        "年齢: " + data.get("age"),
        "お住まい: " + data.get("pref"),
        "お問い合わせ種別: " + data.get("type"),
        "",
        "ご希望日・ご質問:",
        data.get("message") || ""
      ];
      var subject = "【Webサイト】" + data.get("type") + "（" + data.get("name") + " 様）";
      var href = "mailto:" + mailUser + "@" + mailHost +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\n"));
      var status = form.querySelector(".form__status");
      if (status) {
        status.classList.add("is-show");
        status.focus();
      }
      window.location.href = href;
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
