// public/app.js
document.addEventListener("DOMContentLoaded", function () {
  const url = new URL(window.location.href);
  let lang = (url.searchParams.get("lang") || "en").toLowerCase();

  const parts = window.location.pathname.split("/").filter(Boolean);
  const slug = parts[0] || null;
  const isMenuPath = parts[1] === "menu";

  if (!slug) {
    const h = document.getElementById("homepage");
    if (h) h.innerHTML = "<h2>QR Menü</h2><p>Geçersiz restoran bağlantısı.</p>";
    return;
  }

  // Elements
  const els = {
    langSwitcher: document.getElementById("language-switcher"),
    homepage: document.getElementById("homepage"),
    name: document.getElementById("restaurant-name"),
    photo: document.getElementById("restaurant-photo"),
    desc: document.getElementById("restaurant-description"),
    goMenu: document.getElementById("go-to-menu-btn"),
    notes: document.getElementById("notifications"),
    catWrap: document.getElementById("category-buttons"),
    subWrap: document.getElementById("subcategory-buttons"),
    menu: document.getElementById("menu-container"),
    navWrap: document.getElementById("nav-back-wrapper"),
    btnBackHome: document.getElementById("btn-back-home"),
    btnBackMenu: document.getElementById("btn-back-menu"),
    btnBackCat: document.getElementById("btn-back-category"),
    backCatName: document.getElementById("back-category-name"),
    modal: document.getElementById("item-modal"),
    modalClose: document.getElementById("modal-close"),
    modalImg: document.getElementById("modal-image"),
    modalTitle: document.getElementById("modal-title"),
    modalDesc: document.getElementById("modal-description"),
    modalPrice: document.getElementById("modal-price"),
    modalAll: document.getElementById("modal-allergens"),
    modalBackHome: document.getElementById("modal-back-home"),
    modalBackMenu: document.getElementById("modal-back-menu"),
    modalBackCat: document.getElementById("modal-back-category"),
    modalBackCatName: document.getElementById("modal-back-category-name"),
    footerContact: document.getElementById("footer-contact"),
    footerFollow: document.getElementById("footer-follow"),
  };

  // Fix language switcher links
  if (els.langSwitcher) {
    els.langSwitcher.querySelectorAll("a").forEach((a) => {
      const code = (a.getAttribute("href") || "").replace("?lang=", "").toLowerCase();
      if (!code) return;
      const u = new URL(window.location.href);
      u.searchParams.set("lang", code);
      u.pathname = `/${slug}${isMenuPath ? "/menu" : ""}`;
      a.href = u.pathname + u.search;
    });
  }

  const state = {
    data: null,
    activeCatId: null,
    activeSubId: null,
  };

  // Fetch data
  async function load() {
    try {
      const res = await fetch(`/restaurant/${slug}?lang=${lang}`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = await res.json();
      state.data = json;
      renderAll();
      if (isMenuPath && json.categories && json.categories[0]) {
        state.activeCatId = json.categories[0].id;
        renderMenu();
      }
    } catch (e) {
      console.error("Menu load failed", e);
      if (els.homepage) {
        els.homepage.innerHTML =
          "<h2>Menü yüklenemedi</h2><p>Lütfen daha sonra tekrar deneyin.</p>";
      }
    }
  }

  function renderAll() {
    if (!state.data || !els.homepage) return;
    const { restaurant, categories } = state.data;

    if (els.name) els.name.textContent = (restaurant && restaurant.name) || "Restaurant";
    if (els.photo) {
      if (restaurant && restaurant.logo_url) {
        els.photo.src = restaurant.logo_url;
        els.photo.style.display = "block";
      } else {
        els.photo.style.display = "none";
      }
    }
    if (els.desc) {
      els.desc.textContent =
        (restaurant && restaurant.about_text) ||
        "We prepare our dishes with care, using fresh and local ingredients. Enjoy your dining experience!";
    }

    // Footer contact
    if (els.footerContact) {
      const parts = [];
      if (restaurant.phone) parts.push(`📞 ${restaurant.phone}`);
      if (restaurant.address) parts.push(`📍 ${restaurant.address}`);
      els.footerContact.textContent = parts.join(" | ");
    }

    // Footer socials
    if (els.footerFollow) {
      const links = [];
      if (restaurant.instagram_url)
        links.push(`<a href="${restaurant.instagram_url}" target="_blank">Instagram</a>`);
      if (restaurant.facebook_url)
        links.push(`<a href="${restaurant.facebook_url}" target="_blank">Facebook</a>`);
      if (restaurant.website_url)
        links.push(`<a href="${restaurant.website_url}" target="_blank">Website</a>`);
      els.footerFollow.innerHTML = links.length ? "Follow us: " + links.join(" | ") : "";
    }

    // Category buttons
    if (els.catWrap) {
      els.catWrap.innerHTML = "";
      if (categories && categories.length) {
        categories.forEach((c) => {
          const b = document.createElement("button");
          b.className = "category-btn";
          b.textContent = c.name;
          b.onclick = () => {
            state.activeCatId = c.id;
            state.activeSubId = null;
            renderMenu();
          };
          els.catWrap.appendChild(b);
        });
        els.catWrap.style.display = "flex";
      } else {
        els.catWrap.style.display = "none";
      }
    }

    if (els.goMenu && categories && categories[0]) {
      els.goMenu.onclick = () => {
        state.activeCatId = categories[0].id;
        state.activeSubId = null;
        renderMenu();
      };
    }

    showHomepage();
  }

  function showHomepage() {
    if (els.homepage) els.homepage.style.display = "block";
    if (els.menu) els.menu.style.display = "none";
    if (els.subWrap) els.subWrap.style.display = "none";
    if (els.navWrap) els.navWrap.style.display = "none";
  }

  function showMenu() {
    if (els.homepage) els.homepage.style.display = "none";
    if (els.menu) els.menu.style.display = "flex";
    if (els.navWrap) els.navWrap.style.display = "block";
  }

  function renderMenu() {
    const data = state.data;
    if (!data || !els.menu) return;
    const { categories, subcategories = [] } = data;
    const activeCat = categories.find((c) => c.id === state.activeCatId);
    if (!activeCat) return;

    // highlight
    if (els.catWrap) {
      Array.from(els.catWrap.children).forEach((btn) => {
        if (btn.textContent === activeCat.name) btn.classList.add("active");
        else btn.classList.remove("active");
      });
    }

    // subcategories
    const subs = subcategories.filter((s) => s.category_id === activeCat.id);
    if (els.subWrap) {
      els.subWrap.innerHTML = "";
      if (subs.length) {
        subs.forEach((sc) => {
          const b = document.createElement("button");
          b.className = "subcategory-btn";
          b.textContent = sc.name;
          b.onclick = () => {
            state.activeSubId = sc.id;
            renderItems();
          };
          els.subWrap.appendChild(b);
        });
        els.subWrap.style.display = "flex";
      } else {
        els.subWrap.style.display = "none";
        state.activeSubId = null;
      }
    }

    // back buttons
    if (els.btnBackHome) {
      els.btnBackHome.onclick = () => {
        showHomepage();
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
    }
    if (els.btnBackMenu) {
      els.btnBackMenu.onclick = () => {
        state.activeSubId = null;
        renderItems();
      };
    }
    if (els.btnBackCat && els.backCatName) {
      els.backCatName.textContent = activeCat.name;
      els.btnBackCat.onclick = () => {
        state.activeSubId = null;
        renderItems();
      };
    }

    renderItems();
    showMenu();
  }

  function renderItems() {
    const data = state.data;
    if (!data || !els.menu) return;
    const { items } = data;
    const catId = state.activeCatId;
    const subId = state.activeSubId;

    els.menu.innerHTML = "";
    const filtered = items.filter((i) => {
      if (i.category_id !== catId) return false;
      if (subId && i.subcategory_id !== subId) return false;
      return true;
    });

    filtered.forEach((i) => {
      const card = document.createElement("div");
      card.className = "menu-item";

      if (i.image_url) {
        const img = document.createElement("img");
        img.src = i.image_url;
        img.alt = i.name;
        card.appendChild(img);
      }

      const title = document.createElement("h3");
      title.textContent = i.name;
      if (i.is_new) {
        const span = document.createElement("span");
        span.className = "new-label";
        span.textContent = "🆕";
        title.appendChild(span);
      }
      card.appendChild(title);

      if (i.description) {
        const d = document.createElement("p");
        d.textContent = i.description;
        card.appendChild(d);
      }

      if (i.price != null) {
        const p = document.createElement("p");
        p.className = "price-label";
        p.textContent = `${i.price} ${i.currency || ""}`;
        card.appendChild(p);
      }

      card.onclick = () => openModal(i, activeCategoryName(catId));
      els.menu.appendChild(card);
    });
  }

  function activeCategoryName(catId) {
    if (!state.data) return "";
    const c = state.data.categories.find((x) => x.id === catId);
    return c ? c.name : "";
  }

  function openModal(item, catName) {
    if (!els.modal) return;
    els.modalTitle.textContent = item.name || "";
    els.modalDesc.textContent = item.description || "";
    els.modalPrice.textContent =
      item.price != null ? `${item.price} ${item.currency || ""}` : "";
    els.modalAll.textContent = item.allergens
      ? `Allergens: ${item.allergens}`
      : "";

    if (item.image_url) {
      els.modalImg.src = item.image_url;
      els.modalImg.style.display = "block";
    } else {
      els.modalImg.style.display = "none";
    }

    if (els.modalBackCatName) {
      els.modalBackCatName.textContent = catName || "";
    }

    els.modal.style.display = "block";

    if (els.modalClose) els.modalClose.onclick = closeModal;
    els.modal.onclick = (e) => {
      if (e.target === els.modal) closeModal();
    };

    if (els.modalBackHome) {
      els.modalBackHome.onclick = () => {
        closeModal();
        showHomepage();
      };
    }
    if (els.modalBackMenu) {
      els.modalBackMenu.onclick = () => {
        closeModal();
        showMenu();
      };
    }
    if (els.modalBackCat) {
      els.modalBackCat.onclick = () => {
        closeModal();
        showMenu();
      };
    }
  }

  function closeModal() {
    if (els.modal) {
      els.modal.style.display = "none";
    }
  }

  load();
});
