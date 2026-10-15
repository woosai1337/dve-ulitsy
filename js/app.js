/* «Две улицы» — сборка страницы и логика квеста. Без зависимостей. */
(function () {
  "use strict";

  var PASSED_KEY = "dve-ulitsy-passed-v1";
  var stops = (DATA.quest && DATA.quest.stops) || [];
  var totalStops = stops.length;
  var passed = loadPassed();

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function frag() { return document.createDocumentFragment(); }

  function loadPassed() {
    try {
      var raw = window.localStorage.getItem(PASSED_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function savePassed() {
    try { window.localStorage.setItem(PASSED_KEY, JSON.stringify(passed)); } catch (e) {}
  }
  function isPassed(n) { return passed.indexOf(n) !== -1; }
  function markPassed(n) { if (!isPassed(n)) { passed.push(n); savePassed(); } }

  /* ——— герой ——— */
  function renderHero() {
    qs("#heroKicker").textContent = DATA.meta.kicker;
    qs("#heroTitle").textContent = DATA.meta.title;
    qs("#heroSub").textContent = DATA.meta.subtitle;
    qs("#heroLead").textContent = DATA.meta.lead;

    var box = qs("#stats");
    DATA.stats.forEach(function (s) {
      var d = node("div");
      d.appendChild(node("b", null, s.value));
      d.appendChild(node("span", null, s.label));
      box.appendChild(d);
    });
  }

  /* ——— героини ——— */
  function renderHeroines() {
    var box = qs("#heroinesGrid");
    DATA.heroines.forEach(function (h) {
      var card = node("article", "heroine");
      var fig = node("figure", "heroine__photo heroine__photo--" + h.id);
      var img = node("img");
      img.src = h.photo;
      img.alt = h.photoAlt || h.name;
      img.loading = "lazy";
      fig.appendChild(img);
      fig.appendChild(node("span", "heroine__tag", h.tag));
      card.appendChild(fig);

      var body = node("div", "heroine__body");
      body.appendChild(node("h3", "heroine__name", h.name));
      body.appendChild(node("p", "heroine__years", h.years));
      body.appendChild(node("p", "heroine__role", h.role));
      var ul = node("ul", "heroine__facts");
      h.facts.forEach(function (f) { ul.appendChild(node("li", null, f)); });
      body.appendChild(ul);
      body.appendChild(node("p", "credit", h.credit));
      card.appendChild(body);
      box.appendChild(card);
    });
  }

  /* ——— квест ——— */
  function renderQuest() {
    qs("#questTitle").textContent = DATA.quest.title;
    qs("#questIntro").textContent = DATA.quest.intro;

    var list = qs("#route");
    stops.forEach(function (stop) {
      var li = node("li", "stop");
      li.setAttribute("data-n", String(stop.n));

      li.appendChild(node("span", "stop__dot", String(stop.n)));

      var card = node("div", "stop__card");
      var head = node("button", "stop__head");
      head.type = "button";
      head.setAttribute("aria-expanded", "false");
      head.appendChild(node("span", "stop__title", stop.title));
      head.appendChild(node("span", "stop__years", stop.years));
      head.appendChild(node("span", "stop__place", stop.place));
      card.appendChild(head);

      var body = node("div", "stop__body");
      body.appendChild(node("p", "stop__text", stop.text));

      var q = node("div", "q");
      q.appendChild(node("p", "q__label", "Проверь себя"));
      q.appendChild(node("p", "q__text", stop.question.q));
      var opts = node("div", "opts");
      stop.question.options.forEach(function (optText, i) {
        var b = node("button", "opt", optText);
        b.type = "button";
        b.addEventListener("click", function () { answer(stop, i, b, opts, q); });
        opts.appendChild(b);
      });
      q.appendChild(opts);
      var explain = node("p", "q__explain");
      explain.hidden = true;
      q.appendChild(explain);
      body.appendChild(q);
      card.appendChild(body);
      li.appendChild(card);

      head.addEventListener("click", function () {
        var open = li.classList.toggle("is-open");
        head.setAttribute("aria-expanded", open ? "true" : "false");
      });

      if (isPassed(stop.n)) applyPassed(li, opts, explain, stop);
      list.appendChild(li);
    });

    qs("#questReset").addEventListener("click", function () {
      passed = [];
      savePassed();
      stops.forEach(function (stop) {
        var li = qs('.stop[data-n="' + stop.n + '"]');
        li.classList.remove("is-passed", "is-open");
        var opts = qs(".opts", li);
        [].forEach.call(opts.querySelectorAll(".opt"), function (b) {
          b.disabled = false;
          b.classList.remove("is-right", "is-wrong");
        });
        var explain = qs(".q__explain", li);
        explain.hidden = true;
        explain.textContent = "";
      });
      qs("#finale").hidden = true;
      qs("#questReset").hidden = true;
      updateProgress();
    });

    updateProgress();
  }

  function applyPassed(li, opts, explain, stop) {
    li.classList.add("is-passed");
    [].forEach.call(opts.querySelectorAll(".opt"), function (b, i) {
      b.disabled = true;
      if (i === stop.question.answer) b.classList.add("is-right");
    });
    explain.hidden = false;
    explain.textContent = stop.question.explain;
  }

  function answer(stop, index, btn, opts, qBox) {
    if (btn.disabled) return;
    var explain = qs(".q__explain", qBox);
    if (index === stop.question.answer) {
      markPassed(stop.n);
      var li = qs('.stop[data-n="' + stop.n + '"]');
      applyPassed(li, opts, explain, stop);
      updateProgress();
    } else {
      btn.classList.add("is-wrong");
      btn.disabled = true;
      explain.hidden = false;
      explain.textContent = "Не совсем. Попробуйте другой вариант — история сама подскажет ответ.";
    }
  }

  function updateProgress() {
    var done = passed.filter(function (n) { return n >= 1 && n <= totalStops; }).length;
    var fill = qs("#progressFill");
    var text = qs("#progressText");
    if (fill) fill.style.width = Math.round((done / totalStops) * 100) + "%";
    if (text) text.textContent = "Пройдено " + done + " из " + totalStops + " остановок";
    var finale = qs("#finale");
    if (finale) finale.hidden = done !== totalStops;
    var reset = qs("#questReset");
    if (reset) reset.hidden = done === 0;
  }

  /* ——— полк, хроника, память ——— */
  function renderRegiment() {
    qs("#regimentTitle").textContent = DATA.regiment.title;
    qs("#regimentText").textContent = DATA.regiment.text;
    var box = qs("#gallery");
    DATA.regiment.photos.forEach(function (p) {
      var fig = node("figure", "shot");
      var img = node("img");
      img.src = p.src;
      img.alt = p.alt;
      img.loading = "lazy";
      fig.appendChild(img);
      fig.appendChild(node("figcaption", null, p.caption));
      box.appendChild(fig);
    });
  }

  function renderChronicle() {
    var list = qs("#chronicleList");
    DATA.chronicle.forEach(function (c) {
      var li = node("li");
      li.appendChild(node("time", null, c.date));
      var box = node("div");
      box.appendChild(node("b", null, c.title));
      box.appendChild(node("p", null, c.text));
      li.appendChild(box);
      list.appendChild(li);
    });
  }

  function renderMemory() {
    var box = qs("#memoryGrid");
    DATA.memory.forEach(function (m) {
      var card = node("article", "card");
      card.appendChild(node("p", "meta", m.meta));
      card.appendChild(node("h3", null, m.title));
      card.appendChild(node("p", null, m.text));
      box.appendChild(card);
    });
  }

  function renderYear() {
    qs("#yearTitle").textContent = DATA.year.title;
    qs("#yearText").textContent = DATA.year.text;
    var box = qs("#yearFacts");
    DATA.year.facts.forEach(function (f) {
      var d = node("div", "number");
      d.appendChild(node("b", null, f.value));
      d.appendChild(node("span", null, f.label));
      box.appendChild(d);
    });
  }

  function renderWork() {
    qs("#workTitle").textContent = DATA.work.title;
    qs("#workText").textContent = DATA.work.text;
    var dl = qs("#workItems");
    DATA.work.items.forEach(function (it) {
      var wrap = node("div");
      wrap.appendChild(node("dt", null, it.k));
      wrap.appendChild(node("dd", null, it.v));
      dl.appendChild(wrap);
    });
    var ul = qs("#workTech");
    DATA.work.tech.forEach(function (t) { ul.appendChild(node("li", null, t)); });
  }

  function renderSources() {
    var list = qs("#sourcesList");
    DATA.sources.forEach(function (s) {
      var li = node("li");
      var box = node("div");
      var a = node("a", null, s.title);
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener";
      box.appendChild(a);
      box.appendChild(node("span", null, s.publisher));
      li.appendChild(box);
      list.appendChild(li);
    });
  }

  function renderHashtags() {
    var box = qs("#hashtags");
    DATA.meta.hashtags.forEach(function (h) { box.appendChild(node("span", null, h)); });
  }

  /* ——— поделиться ——— */
  function buildShare(box) {
    var url = window.location.href;
    var text = DATA.meta.title + " — " + DATA.meta.subtitle;

    if (navigator.share) {
      var native = node("button", null, "Поделиться");
      native.type = "button";
      native.addEventListener("click", function () {
        navigator.share({ title: DATA.meta.title, text: text, url: url }).catch(function () {});
      });
      box.appendChild(native);
    }

    var links = [
      { label: "Telegram", href: "https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(text + " " + DATA.meta.hashtags.join(" ")) },
      { label: "ВКонтакте", href: "https://vk.com/share.php?url=" + encodeURIComponent(url) + "&title=" + encodeURIComponent(text) },
      { label: "Одноклассники", href: "https://connect.ok.ru/offer?url=" + encodeURIComponent(url) + "&title=" + encodeURIComponent(text) }
    ];
    links.forEach(function (l) {
      var a = node("a", null, l.label);
      a.href = l.href;
      a.target = "_blank";
      a.rel = "noopener";
      box.appendChild(a);
    });

    var copy = node("button", null, "Скопировать ссылку");
    copy.type = "button";
    copy.addEventListener("click", function () {
      var done = function () { copy.textContent = "Ссылка скопирована"; setTimeout(function () { copy.textContent = "Скопировать ссылку"; }, 2200); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url + " " + DATA.meta.hashtags.join(" ")).then(done, function () {});
      }
    });
    box.appendChild(copy);
  }

  /* ——— меню ——— */
  function initMenu() {
    var burger = qs("#burger");
    var menu = qs("#menu");
    if (!burger || !menu) return;
    burger.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    [].forEach.call(menu.querySelectorAll("a"), function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  function init() {
    renderHero();
    renderHeroines();
    renderQuest();
    renderRegiment();
    renderChronicle();
    renderMemory();
    renderYear();
    renderWork();
    renderSources();
    renderHashtags();
    buildShare(qs("#shareFooter"));
    buildShare(qs("#shareFinale"));
    initMenu();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();