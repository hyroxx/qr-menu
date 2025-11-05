// public/app.js
(() => {
  // ---------- Helpers ----------
  const root = document.getElementById('app') || document.body;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  const escapeHtml = (s) =>
    (s ?? '')
      .toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const url = new URL(window.location.href);
  let lang = (url.searchParams.get('lang') || 'en').toLowerCase();
  if (!['tr','en','es','fr'].includes(lang)) lang = 'en';

  function setLang(newLang) {
    const u = new URL(window.location.href);
    u.searchParams.set('lang', newLang);
    window.location.href = u.toString();
  }

  function joinUrl(parts) {
    return parts
      .map(p => (p || '').toString().replace(/^\/+|\/+$/g, ''))
      .filter(Boolean)
      .join('/');
  }

  // ---------- i18n ----------
  function t(key) {
    const tr = {
      view_menu: 'Menüyü Gör',
      categories: 'Kategoriler',
      new: 'Yeni',
      allergens: 'Alerjenler',
      address: 'Adres',
      phone: 'Telefon',
      hours: 'Çalışma Saatleri',
      contact: 'İletişim',
      follow_us: 'Bizi takip edin:',
      welcome_title: 'Restoranımıza Hoş Geldiniz',
      welcome_desc:
        'Yemeklerimizi özenle, taze ve yerel malzemelerle hazırlıyoruz. Afiyet olsun!',
      no_items: 'Bu kategoride ürün yok.',
      price: 'Fiyat'
    };
    const en = {
      view_menu: 'View Menu',
      categories: 'Categories',
      new: 'New',
      allergens: 'Allergens',
      address: 'Address',
      phone: 'Phone',
      hours: 'Opening Hours',
      contact: 'Contact',
      follow_us: 'Follow us:',
      welcome_title: 'Welcome to Our Restaurant',
      welcome_desc:
        'We prepare our dishes with care, using fresh and local ingredients. Enjoy your dining experience!',
      no_items: 'No items in this category.',
      price: 'Price'
    };
    const es = {
      view_menu: 'Ver menú',
      categories: 'Categorías',
      new: 'Nuevo',
      allergens: 'Alérgenos',
      address: 'Dirección',
      phone: 'Teléfono',
      hours: 'Horario',
      contact: 'Contacto',
      follow_us: 'Síguenos:',
      welcome_title: 'Bienvenidos a Nuestro Restaurante',
      welcome_desc:
        'Preparamos nuestros platos con cuidado, usando ingredientes frescos y locales. ¡Disfruta tu experiencia!',
      no_items: 'No hay artículos en esta categoría.',
      price: 'Precio'
    };
    const fr = {
      view_menu: 'Voir le menu',
      categories: 'Catégories',
      new: 'Nouveau',
      allergens: 'Allergènes',
      address: 'Adresse',
      phone: 'Téléphone',
      hours: 'Horaires',
      contact: 'Contact',
      follow_us: 'Suivez-nous :',
      welcome_title: 'Bienvenue dans Notre Restaurant',
      welcome_desc:
        "Nous préparons nos plats avec soin, avec des ingrédients frais et locaux. Bon appétit !",
      no_items: "Aucun produit dans cette catégorie.",
      price: 'Prix'
    };
    const dict = { tr, en, es, fr }[lang] || en;
    return dict[key] ?? key;
  }

  // ---------- API ----------
  async function fetchJSON(path, params = {}) {
    const u = new URL(window.location.origin + '/' + joinUrl([path]));
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) u.searchParams.set(k, v);
    });
    const res = await fetch(u.toString(), { credentials: 'include' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  // We support both:
  //  • /{slug} (homepage)     -> GET /restaurant/:slug?lang=xx
  //  • /{slug}/menu           -> GET /menu?slug={slug}&lang=xx
  function parseSlug() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return null;
    if (parts[0] === '__migrate') return null; // not customer-facing
    return parts[0]; // slug
  }

  function isMenuPage() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts.length >= 2 && parts[1] === 'menu';
  }

  // ---------- UI: Language flags ----------
  function renderLangBar(slug) {
    const flags = [
      { code: 'tr', emoji: '🇹🇷' },
      { code: 'en', emoji: '🇬🇧' },
      { code: 'es', emoji: '🇪🇸' },
      { code: 'fr', emoji: '🇫🇷' }
    ];
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;left:12px;top:10px;display:flex;gap:8px;z-index:50;';
    for (const f of flags) {
      const a = document.createElement('button');
      a.type = 'button';
      a.textContent = f.emoji;
      a.title = f.code.toUpperCase();
      a.style.cssText =
        'background:#fff;border:1px solid #ddd;border-radius:8px;padding:4px 6px;cursor:pointer;line-height:1;';
      if (f.code === lang) a.style.borderColor = '#111';
      a.addEventListener('click', () => setLang(f.code));
      bar.appendChild(a);
    }
    document.body.appendChild(bar);
  }

  // ---------- UI: Modal ----------
  function openModal(html) {
    closeModal();
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;';
    overlay.addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') closeModal();
    });

    const card = document.createElement('div');
    card.style.cssText =
      'background:#fff;max-width:720px;width:100%;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.25);overflow:hidden;';
    card.innerHTML = html;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    document.addEventListener('keydown', escClose, { once: true });
    function escClose(e) {
      if (e.key === 'Escape') closeModal();
    }
  }

  function closeModal() {
    const el = $('#modal-overlay');
    if (el) el.remove();
  }

  // ---------- Render: Home ----------
  function renderHome(data) {
    const r = data.restaurant || {};
    const cats = data.categories || [];
    root.innerHTML = `
      <section style="display:grid; gap:10px; text-align:center; padding:28px 12px 8px;">
        ${r.logo_url ? `<img src="${escapeHtml(r.logo_url)}" alt="logo" style="width:120px;height:120px;border-radius:14px;object-fit:cover;background:#f3f3f3;margin:0 auto;" loading="lazy" />` : ''}
        <h2 style="font-size:28px;margin:10px 0 6px;">${escapeHtml(r.name) || t('welcome_title')}</h2>
        <div style="margin-top:6px;">
          <a class="chip" style="border-color:#111" href="/${escapeHtml(r.slug)}/menu?lang=${lang}">${t('view_menu')}</a>
        </div>
        <p class="muted" style="max-width:760px;margin:12px auto 0;line-height:1.5;">
          ${escapeHtml(r.about_text) || t('welcome_desc')}
        </p>
      </section>

      <section style="padding:16px 12px;">
        <h3 style="margin:10px 0 8px;">${t('categories')}</h3>
        <div class="chips">
          ${cats.map(c => `<a class="chip" href="/${escapeHtml(r.slug)}/menu?lang=${lang}#cat-${c.id}">${escapeHtml(c.name)}</a>`).join('')}
        </div>
      </section>

      <footer>
        ${(r.phone || r.address) ? `<div><strong>${t('contact')}:</strong> ${r.phone ? escapeHtml(r.phone) : ''}${(r.phone && r.address) ? ' | ' : ''}${r.address ? escapeHtml(r.address) : ''}</div>` : ''}
        <div style="display:flex;gap:12px;margin-top:8px;align-items:center;flex-wrap:wrap;">
          <span class="muted">${t('follow_us')}</span>
          ${r.website_url ? `<a href="${escapeHtml(r.website_url)}" target="_blank" rel="noopener">Website</a>` : ''}
          ${r.instagram_url ? `<a href="${escapeHtml(r.instagram_url)}" target="_blank" rel="noopener">Instagram</a>` : ''}
          ${r.facebook_url ? `<a href="${escapeHtml(r.facebook_url)}" target="_blank" rel="noopener">Facebook</a>` : ''}
        </div>
        ${r.opening_hours ? `<div style="margin-top:8px;"><strong>${t('hours')}:</strong> ${escapeHtml(r.opening_hours)}</div>` : ''}
      </footer>
    `;
  }

  // ---------- Render: Menu ----------
  function isNew(item) {
    if (item.is_new) return true;
    if (!item.created_at) return false;
    const created = new Date(item.created_at);
    const days = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return days <= 14; // son 14 gün
    // (istersen bunu .env veya query ile parametrik yaparız)
  }

  function renderMenu(data) {
    const r = data.restaurant || {};
    const categories = data.categories || [];
    const itemsByCat = data.itemsByCat || {};  // { [catId]: MenuItem[] }
    const subcats = data.subcategoriesByCat || {}; // { [catId]: Subcat[] }

    root.innerHTML = `
      <header style="display:flex;align-items:center;gap:12px;padding:16px 12px;">
        ${r.logo_url ? `<img src="${escapeHtml(r.logo_url)}" alt="logo" style="width:44px;height:44px;border-radius:10px;object-fit:cover;background:#f3f3f3;" loading="lazy" />` : ''}
        <div style="font-weight:600;font-size:18px;">${escapeHtml(r.name || '')}</div>
      </header>

      <section style="padding:0 12px 12px;">
        <h3 style="margin:6px 0 10px;">${t('categories')}</h3>
        <div class="chips">
          ${categories.map(c => `<a class="chip" href="#cat-${c.id}">${escapeHtml(c.name)}</a>`).join('')}
        </div>
      </section>

      <main style="padding:0 12px 40px;">
        ${categories.map(c => {
          const sc = subcats[c.id] || [];
          const items = itemsByCat[c.id] || [];
          return `
            <section id="cat-${c.id}" style="scroll-margin-top:70px;">
              <h3 style="margin:18px 0 8px;">${escapeHtml(c.name)}</h3>
              ${sc.length ? `
                <div class="chips" style="margin-bottom:10px;">
                  ${sc.map(s => `<a class="chip" href="#sub-${s.id}">${escapeHtml(s.name)}</a>`).join('')}
                </div>` : ''}

              <div class="grid">
                ${items.length ? items.map(cardTemplate).join('') : `<div class="muted" style="padding:8px 2px;">${t('no_items')}</div>`}
              </div>

              ${sc.length ? sc.map(s => {
                const itemsOfSub = (data.itemsBySub || {})[s.id] || [];
                return `
                  <h4 id="sub-${s.id}" style="margin:20px 0 8px;">${escapeHtml(s.name)}</h4>
                  <div class="grid">
                    ${itemsOfSub.length ? itemsOfSub.map(cardTemplate).join('') : `<div class="muted" style="padding:8px 2px;">${t('no_items')}</div>`}
                  </div>
                `;
              }).join('') : ''}
            </section>
          `;
        }).join('')}
      </main>
    `;

    // Ürün kartı tıklama → modal
    root.addEventListener('click', (e) => {
      const card = e.target.closest('[data-item]');
      if (!card) return;
      const raw = card.getAttribute('data-item');
      if (!raw) return;
      const item = JSON.parse(raw);

      const price = item.price != null ? `${Number(item.price).toFixed(2)} ${escapeHtml(item.currency || '€')}` : '';
      const allergens = item.allergens ? `<div class="muted" style="margin-top:6px;"><strong>${t('allergens')}:</strong> ${escapeHtml(item.allergens)}</div>` : '';

      openModal(`
        <div style="position:relative;">
          <button onclick="document.getElementById('modal-overlay')?.remove()" aria-label="Close" style="position:absolute;right:8px;top:8px;border:none;background:transparent;font-size:22px;cursor:pointer;">×</button>
          ${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" style="width:100%;height:260px;object-fit:cover;" loading="lazy" />` : ''}
          <div style="padding:16px 16px 20px;">
            <h3 style="margin:0 0 6px;">${escapeHtml(item.name)}</h3>
            ${price ? `<div class="muted" style="margin-bottom:8px;"><strong>${t('price')}:</strong> ${escapeHtml(price)}</div>` : ''}
            ${item.description ? `<p style="line-height:1.5;">${escapeHtml(item.description)}</p>` : ''}
            ${allergens}
          </div>
        </div>
      `);
    });
  }

  function cardTemplate(item) {
    const badge = isNew(item)
      ? `<span class="badge">${t('new')}</span>`
      : '';
    const price = item.price != null ? `${Number(item.price).toFixed(2)} ${escapeHtml(item.currency || '€')}` : '';
    const payload = escapeHtml(JSON.stringify(item));
    return `
      <div class="card" data-item='${payload}'>
        ${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" loading="lazy" />` : `<div style="width:100%;height:140px;background:#f3f3f3;border-radius:12px 12px 0 0;"></div>`}
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">
            <h4 class="title">${escapeHtml(item.name)}</h4>
            ${badge}
          </div>
          ${item.description ? `<p class="desc">${escapeHtml(item.description)}</p>` : ''}
          ${price ? `<div class="price">${escapeHtml(price)}</div>` : ''}
        </div>
      </div>
    `;
  }

  // ---------- Boot ----------
  async function boot() {
    const slug = parseSlug();
    renderLangBar(slug || '');

    // Basit CSS (görünüm)
    injectStyles();

    try {
      if (!slug || slug === 'index.html') {
        // domain/  -> Show a neutral landing if needed
        root.innerHTML = `<div style="padding:40px 16px;text-align:center;">${t('welcome_title')}</div>`;
        return;
      }

      if (!isMenuPage()) {
        // Home
        const data = await fetchJSON(`restaurant/${encodeURIComponent(slug)}`, { lang });
        data.lang = lang;
        renderHome(data);
      } else {
        // Menu
        const data = await fetchJSON('menu', { slug, lang });
        data.lang = lang;
        renderMenu(data);

        // hash anchor scroll fix (after render)
        if (window.location.hash) {
          const target = $(window.location.hash);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } catch (err) {
      console.error(err);
      root.innerHTML = `<div style="padding:28px 12px;color:#b00020;">Error: ${escapeHtml(err.message || err)}</div>`;
    }
  }

  function injectStyles() {
    const css = `
      .chips{display:flex;flex-wrap:wrap;gap:8px}
      .chip{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border:1px solid #ddd;border-radius:999px;text-decoration:none;color:#111;background:#fff;transition:.15s}
      .chip:hover{transform:translateY(-1px);box-shadow:0 4px 10px rgba(0,0,0,.08)}
      .grid{display:grid;grid-template-columns:repeat(1,minmax(0,1fr));gap:12px}
      @media(min-width:560px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(min-width:900px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
      .card{border:1px solid #eee;border-radius:12px;overflow:hidden;background:#fff;cursor:pointer;transition:box-shadow .15s, transform .15s}
      .card:hover{box-shadow:0 10px 30px rgba(0,0,0,.10);transform:translateY(-1px)}
      .card img{width:100%;height:140px;object-fit:cover;display:block}
      .card-body{padding:10px 12px 12px}
      .title{margin:0 0 4px;font-size:16px}
      .desc{margin:0 0 8px;color:#666;line-height:1.4}
      .price{font-weight:600}
      .muted{color:#666}
      .badge{display:inline-block;background:#111;color:#fff;border-radius:8px;padding:2px 6px;font-size:12px;line-height:1}
      footer{margin:28px auto 20px;padding:16px 12px;background:#1f1f1f;color:#fff;border-radius:12px;max-width:920px}
      footer a{color:#fff;text-decoration:underline}
    `;
    const s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  // go
  boot();
})();
