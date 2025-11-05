(function () {
  const qs = new URLSearchParams(location.search);
  const path = location.pathname.split('/').filter(Boolean);
  const isMenuPage = path.length >= 2 && path[1] === 'menu';
  const slug = path[0] || null;

  const allowedLangs = ['tr','en','es','fr'];
  const currentLang = (qs.get('lang') || 'en').toLowerCase();
  const lang = allowedLangs.includes(currentLang) ? currentLang : 'en';

  const langWrap = document.getElementById('lang-switch');
  langWrap.querySelectorAll('button').forEach(btn => {
    const target = btn.dataset.lang;
    if (target === lang) btn.classList.add('active');
    btn.addEventListener('click', () => {
      const url = new URL(location.href);
      url.searchParams.set('lang', target);
      location.href = url.toString();
    });
  });

  const brandNameEl = document.getElementById('brandName');
  const brandLogoEl = document.getElementById('brandLogo');
  const root = document.getElementById('appRoot');

  if (!slug) {
    root.innerHTML = `<p style="color:#b00">Invalid URL. Use /{slug} or /{slug}/menu</p>`;
    return;
  }

  if (isMenuPage) loadMenu(slug, lang);
  else loadRestaurant(slug, lang);

  function loadRestaurant(slug, lang) {
    fetch(`/restaurant/${slug}?lang=${lang}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setBrand(data.restaurant);
        renderHome(data);
      })
      .catch(showError);
  }

  function loadMenu(slug, lang) {
    fetch(`/menu/${slug}?lang=${lang}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setBrand(data.restaurant);
        renderMenu(data);
      })
      .catch(showError);
  }

  function setBrand(r) {
    brandNameEl.textContent = r.name || 'QR Menu';
    if (r.logo_url) { brandLogoEl.src = r.logo_url; brandLogoEl.style.display = 'block'; }
    else { brandLogoEl.style.display = 'none'; }
  }

  // ==== HOMEPAGE ====
  function renderHome(data) {
    const r = data.restaurant;
    const cats = data.categories || [];
    root.innerHTML = `
      <section style="display:grid; gap:10px;">
        ${r.logo_url ? `<img src="${r.logo_url}" alt="logo" style="width:120px;height:120px;border-radius:14px;object-fit:cover;background:#f3f3f3;" />` : ''}
        <h2>${escapeHtml(r.name || '')}</h2>
        ${r.about_text ? `<p class="muted">${escapeHtml(r.about_text)}</p>` : ''}
      </section>

      <section>
        <h3>${t('categories')}</h3>
        <div class="chips">
          ${cats.map(c => `<a class="chip" href="/${r.slug}/menu?lang=${data.lang}#cat-${c.id}">${escapeHtml(c.name)}</a>`).join('')}
        </div>
        <div style="margin-top:10px;">
          <a class="chip" style="border-color:#111" href="/${r.slug}/menu?lang=${data.lang}">${t('view_menu')}</a>
        </div>
      </section>

      <footer>
        ${r.address ? `<div><strong>${t('address')}:</strong> ${escapeHtml(r.address)}</div>` : ''}
        ${r.phone ? `<div><strong>${t('phone')}:</strong> ${escapeHtml(r.phone)}</div>` : ''}
        ${r.opening_hours ? `<div><strong>${t('hours')}:</strong> ${escapeHtml(r.opening_hours)}</div>` : ''}
        <div style="display:flex;gap:10px;margin-top:8px;">
          ${r.website_url ? `<a href="${r.website_url}" target="_blank" rel="noopener">Website</a>` : ''}
          ${r.instagram_url ? `<a href="${r.instagram_url}" target="_blank" rel="noopener">Instagram</a>` : ''}
          ${r.facebook_url ? `<a href="${r.facebook_url}" target="_blank" rel="noopener">Facebook</a>` : ''}
        </div>
      </footer>
    `;
  }

  // ==== MENU ====
  function renderMenu(data) {
    const cats = data.categories || [];
    const items = data.items || [];
    root.innerHTML = '';

    const chips = document.createElement('div');
    chips.className = 'chips';
    chips.innerHTML = cats.map(c => `<button class="chip" data-cat="${c.id}">${escapeHtml(c.name)}</button>`).join('');
    root.appendChild(chips);

    chips.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-cat');
        scrollTo(`#cat-${id}`);
      });
    });

    const byCat = group(items, x => x.category_id);
    cats.forEach(c => {
      const sec = document.createElement('section');
      sec.id = `cat-${c.id}`;
      sec.innerHTML = `<h3>${escapeHtml(c.name)}</h3>`;
      root.appendChild(sec);

      if (c.subcategories && c.subcategories.length) {
        c.subcategories.forEach(sc => {
          const sub = document.createElement('div');
          sub.innerHTML = `<h4>${escapeHtml(sc.name)}</h4>`;
          sec.appendChild(sub);
          const list = (byCat[c.id] || []).filter(it => it.subcategory_id === sc.id);
          sub.appendChild(renderItems(list));
        });
      } else {
        const list = byCat[c.id] || [];
        sec.appendChild(renderItems(list));
      }
    });

    if (location.hash) setTimeout(() => scrollTo(location.hash), 100);
  }

  function renderItems(arr) {
    const grid = document.createElement('div');
    grid.className = 'grid';

    arr.forEach(it => {
      const card = document.createElement('article');
      card.className = 'card';

      const imgId = `img-${it.id}`;
      card.innerHTML = `
        ${it.image_url ? `<img id="${imgId}" data-src="${it.image_url}" alt="">` : ''}
        <div class="row">
          <strong>${escapeHtml(it.name)}</strong>
          <span>${formatPrice(it.price, it.currency)}</span>
        </div>
        <div class="muted" style="margin-top:4px;">
          ${it.is_new ? `<span class="badge">🆕 ${t('new')}</span>` : ''}
        </div>
        ${it.description ? `<p class="muted" style="margin-top:6px">${escapeHtml(it.description)}</p>` : ''}
      `;
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => openModal(it));
      grid.appendChild(card);

      const img = card.querySelector('img');
      if (img) observeLazy(img);
    });

    return grid;
  }

  // ===== MODAL =====
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalClose = document.getElementById('modalClose');
  const modalTitle = document.getElementById('modalTitle');
  const modalImg = document.getElementById('modalImg');
  const modalPrice = document.getElementById('modalPrice');
  const modalDesc = document.getElementById('modalDesc');
  const modalAllergens = document.getElementById('modalAllergens');

  modalClose.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });

  function openModal(item) {
    modalTitle.textContent = item.name || '';
    if (item.image_url) { modalImg.src = item.image_url; modalImg.style.display = 'block'; }
    else { modalImg.style.display = 'none'; }
    modalPrice.innerHTML = `<div><strong>${formatPrice(item.price, item.currency)}</strong></div>
                            ${item.is_new ? `<span class="badge">🆕 ${t('new')}</span>` : ''}`;
    modalDesc.textContent = item.description || '';
    modalAllergens.textContent = item.allergens ? `${t('allergens')}: ${item.allergens}` : '';
    modalBackdrop.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalBackdrop.style.display = 'none';
    document.body.style.overflow = '';
  }

  // ===== UTILS =====
  function t(key) {
    const tr = { categories:'Kategoriler', view_menu:'Menüyü Gör', address:'Adres', phone:'Telefon', hours:'Çalışma Saatleri', new:'Yeni', allergens:'Alerjenler' };
    const en = { categories:'Categories', view_menu:'View Menu', address:'Address', phone:'Phone', hours:'Opening Hours', new:'New', allergens:'Allergens' };
    const es = { categories:'Categorías', view_menu:'Ver menú', address:'Dirección', phone:'Teléfono', hours:'Horario', new:'Nuevo', allergens:'Alérgenos' };
    const fr = { categories:'Catégories', view_menu:'Voir le menu', address:'Adresse', phone:'Téléphone', hours:'Horaires', new:'Nouveau', allergens:'Allergènes' };
    const dict = { tr, en, es, fr }[lang] || en; return dict[key] || key;
  }
  function escapeHtml(s){ if(s==null)return''; return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;"); }
  function group(arr, getKey){ const m={}; arr.forEach(x=>{ const k=getKey(x); if(!m[k]) m[k]=[]; m[k].push(x); }); return m; }
  function formatPrice(price, cur){ if(price==null)return''; try{ return new Intl.NumberFormat(undefined,{style:'currency',currency:(cur||'EUR')}).format(price);}catch{ return `${price} ${cur||''}`; } }
  function scrollTo(sel){ const el=document.querySelector(sel); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); }

  // Lazy load images
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const img=e.target; const src=img.getAttribute('data-src');
        if(src){ img.src=src; img.removeAttribute('data-src'); }
        io.unobserve(img);
      }
    });
  },{ rootMargin:'200px' });
  function observeLazy(img){ io.observe(img); }
})();
