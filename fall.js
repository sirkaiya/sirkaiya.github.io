// Gravity: a moment after the page loads, every word lets go and falls slowly
// to the bottom of the page, piling up on the others. Links keep working.
// Physics by Matter.js (matter.min.js, MIT licence).
(function () {
  if (!window.Matter) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var M = Matter;
  var doc = document.querySelector('.doc');
  if (!doc) return;

  // Seeded random, so the fall looks a little different on every visit but stays smooth.
  var seed = Date.now() % 2147483647;
  function rand() { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; }

  function splitWords(root) {
    // Turn list bullets into real characters so they can fall too.
    root.querySelectorAll('ul').forEach(function (ul) { ul.style.listStyle = 'none'; });
    root.querySelectorAll('li').forEach(function (li) {
      li.insertBefore(document.createTextNode('• '), li.firstChild);
    });
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (!node.nodeValue.trim()) return;
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var s = document.createElement('span');
        s.className = 'w';
        s.textContent = part;
        frag.appendChild(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
    return Array.prototype.slice.call(root.querySelectorAll('.w'));
  }

  function start() {
    var words = splitWords(doc);
    var pageH = Math.max(document.documentElement.scrollHeight, window.innerHeight);
    var pageW = document.documentElement.clientWidth;

    // Measure every word where it sits, before anything moves.
    var boxes = words.map(function (w) {
      var r = w.getBoundingClientRect();
      return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
    });

    var engine = M.Engine.create();
    engine.gravity.scale = 0.00035; // slower than real life, so you can watch it

    var t = 60;
    M.Composite.add(engine.world, [
      M.Bodies.rectangle(pageW / 2, pageH + t / 2, pageW * 3, t, { isStatic: true }),
      M.Bodies.rectangle(-t / 2, pageH / 2, t, pageH * 4, { isStatic: true }),
      M.Bodies.rectangle(pageW + t / 2, pageH / 2, t, pageH * 4, { isStatic: true })
    ]);

    document.body.style.position = 'relative';
    document.body.style.minHeight = pageH + 'px';
    document.body.style.overflowX = 'hidden';

    var bodies = words.map(function (w, i) {
      var b = boxes[i];
      var body = M.Bodies.rectangle(b.x + b.w / 2, b.y + b.h / 2, b.w, b.h * 0.8, {
        isStatic: true, friction: 0.6, frictionAir: 0.012, restitution: 0.15, chamfer: { radius: 2 }
      });
      w.style.position = 'absolute';
      w.style.left = '0';
      w.style.top = '0';
      w.style.width = b.w + 'px';
      w.style.whiteSpace = 'nowrap';
      w.style.willChange = 'transform';
      M.Composite.add(engine.world, body);
      return { el: w, body: body, w: b.w, h: b.h };
    });

    // Let go of the words a few at a time, lowest lines first, with a little randomness.
    bodies.slice().sort(function (a, b) { return b.body.position.y - a.body.position.y; })
      .forEach(function (item, i) {
        setTimeout(function () {
          M.Body.setStatic(item.body, false);
          M.Body.setAngularVelocity(item.body, (rand() - 0.5) * 0.02);
        }, 400 + i * 90 + rand() * 600);
      });

    function draw() {
      M.Engine.update(engine, 1000 / 60);
      bodies.forEach(function (item) {
        var p = item.body.position;
        item.el.style.transform = 'translate(' + (p.x - item.w / 2) + 'px,' + (p.y - item.h / 2) + 'px) rotate(' + item.body.angle + 'rad)';
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  window.addEventListener('load', function () {
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
      setTimeout(start, 1200);
    });
  });
})();
