// Cart drawer shared by the homepage and the shop: add, remove, quantity, subtotal.
// Kept in localStorage when the browser allows it. Checkout is not connected (demo shop, fictional business).
(function () {
  'use strict';
  var PRODUCTS = {
    tee:    { name: 'Skip Stop tee', detail: 'White, printed front', price: 32, img: 'img/shop-tee.webp' },
    hoodie: { name: 'Crew hoodie', detail: 'Oat, embroidered chest', price: 64, img: 'img/shop-hoodie.webp' },
    print:  { name: 'Fire Escape Summer poster', detail: '18 x 24 in print', price: 28, img: 'img/shop-print.webp' },
    cap:    { name: 'Skip Stop cap', detail: 'Black, embroidered, one size', price: 30, img: 'img/shop-cap.webp' },
    signed: { name: 'Signed one-sheet', detail: '27 x 40 in, signed, framed', price: 140, img: 'img/shop-signed.webp' }
  };
  var KEY = 'skip-stop-cart';
  var items = [];
  try { items = JSON.parse(localStorage.getItem(KEY) || '[]').filter(function (i) { return PRODUCTS[i.id] && i.qty > 0; }); } catch (e) { items = []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* private mode: cart lives for this page view */ } }
  var money = function (n, cents) { return '$' + (cents ? n.toFixed(2) : String(n)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // Drawer markup lives here so both pages share it.
  var d = document.createElement('dialog');
  d.className = 'drawer'; d.id = 'cart'; d.setAttribute('aria-labelledby', 'cartTitle');
  d.innerHTML =
    '<header><h2 id="cartTitle">Your cart</h2><button class="lb-close" type="button" data-cart-close><svg aria-hidden="true"><use href="#i-x"/></svg>Close</button></header>' +
    '<ul class="cart-items" aria-live="polite"></ul>' +
    '<div class="cart-empty" hidden><p>Your cart is empty. Shirts, hoodies, caps and posters are in the shop.</p><a class="btn btn-ink" href="shop.html">Go to the shop</a></div>' +
    '<div class="cart-foot">' +
      '<div class="subtotal"><span>Subtotal</span><strong data-subtotal>$0.00</strong></div>' +
      '<p class="note">Shipping and tax are added at checkout.</p>' +
      '<button class="btn btn-ink checkout" type="button"><svg aria-hidden="true"><use href="#i-lock"/></svg>Checkout (secure, Stripe)</button>' +
      '<p class="checkout-msg" role="status" hidden></p>' +
    '</div>';
  document.body.appendChild(d);
  var list = d.querySelector('.cart-items'), empty = d.querySelector('.cart-empty'), foot = d.querySelector('.cart-foot');
  var msg = d.querySelector('.checkout-msg'), opener = null;

  function render() {
    var count = 0, sub = 0;
    list.innerHTML = items.map(function (i, n) {
      var p = PRODUCTS[i.id]; count += i.qty; sub += i.qty * p.price;
      var label = esc(p.name) + (i.size ? ', size ' + esc(i.size) : '');
      return '<li class="cart-item">' +
        '<img src="' + p.img + '" width="84" height="84" alt="">' +
        '<div><h3>' + esc(p.name) + '</h3><p>' + esc(p.detail) + (i.size ? '. Size ' + esc(i.size) : '') + '</p>' +
        '<div class="qty"><button type="button" data-dec="' + n + '" aria-label="One less ' + label + '">&minus;</button>' +
        '<output aria-label="Quantity">' + i.qty + '</output>' +
        '<button type="button" data-inc="' + n + '" aria-label="One more ' + label + '">+</button></div></div>' +
        '<div class="right"><span class="line">' + money(i.qty * p.price, true) + '</span>' +
        '<button class="remove" type="button" data-remove="' + n + '" aria-label="Remove ' + label + '">Remove</button></div></li>';
    }).join('');
    empty.hidden = items.length > 0; list.hidden = items.length === 0; foot.hidden = items.length === 0;
    d.querySelector('[data-subtotal]').textContent = money(sub, true);
    document.querySelectorAll('[data-cart-count]').forEach(function (el) { el.textContent = count; });
    document.querySelectorAll('[data-cart-open]').forEach(function (b) { b.setAttribute('aria-label', 'Open cart, ' + count + (count === 1 ? ' item' : ' items')); });
    msg.hidden = true;
  }

  function add(id, size, qty) {
    var hit = items.filter(function (i) { return i.id === id && (i.size || '') === (size || ''); })[0];
    if (hit) hit.qty += qty || 1; else items.push({ id: id, size: size || '', qty: qty || 1 });
    save(); render();
  }
  function open(from) { opener = from || null; if (!d.open) { d.showModal ? d.showModal() : d.setAttribute('open', ''); } }
  function close() { if (d.open) d.close ? d.close() : d.removeAttribute('open'); }

  d.addEventListener('click', function (e) {
    if (e.target === d) return close();
    var t = e.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-cart-close')) return close();
    if (t.classList.contains('checkout')) {
      msg.textContent = 'This is a demo shop, so nothing was charged. On a real shop this button opens Stripe Checkout.';
      msg.hidden = false; return;
    }
    var n;
    if ((n = t.getAttribute('data-inc')) !== null) items[n].qty++;
    else if ((n = t.getAttribute('data-dec')) !== null) { items[n].qty--; if (items[n].qty < 1) items.splice(n, 1); }
    else if ((n = t.getAttribute('data-remove')) !== null) items.splice(n, 1);
    else return;
    save(); render();
    var again = d.querySelector('[data-' + (t.getAttribute('data-inc') !== null ? 'inc' : 'dec') + '="' + n + '"]');
    (again || d.querySelector('[data-cart-close]')).focus();
  });
  d.addEventListener('close', function () { if (opener) opener.focus(); });

  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-cart-open]'); if (o) return open(o);
    var b = e.target.closest('[data-add]'); if (!b) return;
    var card = b.closest('[data-product]'), checked = card && card.querySelector('.sizes input:checked');
    add(b.getAttribute('data-add'), checked ? checked.value : '', 1);
    b.setAttribute('data-added', ''); var was = b.textContent; b.textContent = 'Added';
    setTimeout(function () { b.removeAttribute('data-added'); b.textContent = was; }, 1400);
    open(b);
  });

  // Test hook for screenshots only: window.__cart.add('tee', 'M', 2)
  window.__cart = { add: add, open: open };
  render();
})();
