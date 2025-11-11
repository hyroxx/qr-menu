// public/app.js
(function () {
  // ---------- URL / LANG / SLUG ----------
  const url = new URL(window.location.href);
  let lang = (url.searchParams.get("lang") || "en").toLowerCase();

  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const slug = pathParts[0] || null;
  const isMenuPath = pathParts.length > 1 && pathParts[1] === "menu";

  if (!slug) {
    const hp = document.getElementById("homepage");
    if (hp) {
      hp.innerHTML =
        "<h1>QR Menü</h1><p>Lütfen geçerli bir restoran QR linki kullanın.</p>";
    }
    return;
  }

  // ---------- ELEMENTLER ----------
  const els = {
    languageSwitcher: document.getElementById("language-switcher"),
    homepage: document.getElementById("homepage"),
    restaurantName: document.getElementById("restaurant-name"),
    restaurantPhoto: document.getElementById("restaurant-photo"),
    restaurantDescription: document.getElementById("restaurant-description"),
    goToMenuBtn: document.getElementById("go-to-menu-btn"),

    notifications: document.getElementById("notifications"),

    categoryButtons: document.getElementById("category-buttons"),
    subcategoryButtons: document.getElementById("subcategory-buttons"),
    menuContainer: document.getElementById("menu-container"),

    navWrapper: document.getElementById("nav-back-wrapper"),
    btnBackHome: document.getElementById("btn-back-home"),
    btnBackMenu: document.getElementById("btn-back-menu"),
    btnBackCategory: document.getElementById("btn-back-category"),
    backCategoryName: document.getElementById("back-category-name"),

    modal: document.getElementById("item-modal"),
    modalClose: document.getElementById("modal-close"),
    modalImage: document.getElementById("modal-image"),
    modalTitle: document.getElementById("modal-title"),
    modalDescription: document.getElementById("modal-description"),
    modalPrice: document.getElementById("modal-price"),
    modalAllergens: document.getElementById("modal-allergens"),
    modalBackHome: document.getElementById("modal-back-home"),
    modalBackMenu: document.getElementById("modal-back-menu"),
    modalBackCategory: document.getElementById("modal-back-category"),
    modalBackCategoryName: document.getElementById("modal-back-category-name"),

    footerContact: document.getElementById("footer-contact"),
    footerFollow: document.getElementById("footer-follow"),
  };

  // ---------- LANGUAGE SWITCHER LINKLERİNİ DÜZELT ----------
  if (els.languageSwitcher) {
    const links = els.languageSwitcher.querySelectorAll("a");
    links.forEach((a) => {
      const code = (a.getAttribute("href") || "")
        .replace("?lang=", "")
        .toLowerCase();
      if (!code) return;

      const u = new URL(window.location.href);
      u.searchParams.set("lang", code);
      u.pathname = `/${slug}${isMenuPath ? "/menu" : ""}`;
      a.setAttribute("href", u.pathname + u.search);
    });
  }

  // ---------- STATE ----------
  const state = {
    data: null,
    activeCategoryId: null,
    activeSubcategoryId: null,
  };

  // ---------- DATA YÜKLE ----------
  async function loadData() {
    try {
      const res = await fetch(`/restaurant/${slug}?lang=${lang}`);
      if (!res.ok) {
        throw new Error(`API error ${res.status}`);
      }
      const json = await res.json();
      state.data = json;
      renderAll();

      // Eğer URL /slug/menu ise direkt menüyü aç
      if (isMenuPath) {
        const firstCat = json.categories && json.categories[0];
        if (firstCat) {
          state.activeCategoryId = firstCat.id;
          renderMenu();
        }
      }
    } catch (err) {
      console.error("Fetch failed:", err);
      if (els.homepage) {
        els.homepage.innerHTML =
          "<h2>Menü yüklenemedi</h2><p>Lütfen daha sonra tekrar deneyin.</p>";
      }
    }
  }

  // ---------- TÜM SAYFAYI RENDER ----------
  function renderAll() {
    const { restaurant, categories } = state.data;

    // Ana başlık
    els.restaurantName.textContent = restaurant.name || "Our Restaurant";

    // Logo / foto
    if (restaurant.logo_url) {
      els.restaurantPhoto.src = restaurant.logo_url;
      els.restaurantPhoto.style.display = "block";
    } else {
      els.restaurantPhoto.style.display = "none";
    }

    // Açıklama
    els.restaurantDescription.textContent =
      restaurant.about_text ||
      "We prepare our dishes with care, using fresh and local ingredients. Enjoy your dining experience!";

    // Footer iletişim
    let contactParts = [];
    if (restaurant.phone) contactParts.push(`📞 ${restaurant.phone}`);
    if (restaurant.address) contactParts.push(`📍 ${restaurant.address}`);
    els.footerContact.textContent = contactParts.join(" | ") || "";

    // Footer sosyal medya
    let socials = [];
    if (restaurant.instagram_url)
      socials.push(
        `<a href="${restaurant.instagram_url}" target="_blank">Instagram</a>`
      );
    if (restaurant.facebook_url)
      socials.push(
        `<a href="${restaurant.facebook_url}" target="_blank">Facebook</a>`
      );
    if (restaurant.website_url)
      socials.push(
        `<a href="${restaurant.website_url}" target="_blank">Website</a>`
      );
    els.footerFollow.innerHTML = socials.length
      ? `Follow us: ${socials.join(" | ")}`
      : "";

    // Kategoriler
    els.categoryButtons.innerHTML = "";
    if (categories && categories.length) {
      categories.forEach((cat) => {
        const btn = document.createElement("button");
        btn.className = "category-btn";
        btn.textContent = cat.name;
        btn.onclick = () => {
          state.activeCategoryId = cat.id;
          state.activeSubcategoryId = null;
          renderMenu();
        };
        els.categoryButtons.appendChild(btn);
      });
      els.categoryButtons.style.display = "flex";
    } else {
      els.categoryButtons.style.display = "none";
    }

    // "View Menu" butonu
    if (els.goToMenuBtn) {
      els.goToMenuBtn.onclick = () => {
        if (categories && categories[0]) {
          state.activeCategoryId = categories[0].id;
          state.activeSubcategoryId = null;
          renderMenu();
        }
      };
    }

    // Başlangıçta: homepage açık, menu kapalı
    showHomepage();
  }

  // ---------- HOMEPAGE / MENU GÖSTERME ----------
  function showHomepage() {
    if (!els.homepage) return;
    els.homepage.style.display = "block";
    els.menuContainer.style.display = "none";
    els.subcategoryButtons.style.display = "none";
    els.navWrapper.style.display = "none";
  }

  function showMenu() {
    els.homepage.style.display = "none";
    els.menuContainer.style.display = "flex";
    els.navWrapper.style.display = "block";
  }

  // ---------- MENU RENDER ----------
  function renderMenu() {
    const { categories, subcategories = [] } = state.data;
    const activeCat = categories.find((c) => c.id === state.activeCategoryId);
    if (!activeCat) return;

    // Kategori buton highlight
    Array.from(els.categoryButtons.querySelectorAll(".category-btn")).forEach(
      (btn) => {
        if (btn.textContent === activeCat.name)
          btn.classList.add("active");
        else btn.classList.remove("active");
      }
    );

    // Alt kategoriler
    const subs = subcategories.filter(
      (s) => s.category_id === activeCat.id
    );
    els.subcategoryButtons.innerHTML = "";
    if (subs.length) {
      subs.forEach((sc) => {
        const b = document.createElement("button");
        b.className = "subcategory-btn";
        b.textContent = sc.name;
        b.onclick = () => {
          state.activeSubcategoryId = sc.id;
          renderItems();
        };
        els.subcategoryButtons.appendChild(b);
      });
      els.subcategoryButtons.style.display = "flex";
    } else {
      els.subcategoryButtons.style.display = "none";
      state.activeSubcategoryId = null;
    }

    // Geri butonları
    if (els.btnBackHome) {
      els.btnBackHome.onclick = () => {
        showHomepage();
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
    }
    if (els.btnBackMenu) {
      els.btnBackMenu.onclick = () => {
        state.activeSubcategoryId = null;
        renderItems();
      };
    }
    if (els.btnBackCategory && els.backCategoryName) {
      els.backCategoryName.textContent = activeCat.name;
      els.btnBackCategory.onclick = () => {
        state.activeSubcategoryId = null;
        renderItems();
      };
    }

    // Ürünler
    renderItems();
    showMenu();
  }

  // ---------- ÜRÜNLERİ RENDER ----------
  function renderItems() {
    const { items } = state.data;
    const catId = state.activeCategoryId;
    const subId = state.activeSubcategoryId;

    els.menuContainer.innerHTML = "";

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
        const desc = document.createElement("p");
        desc.textContent = i.description;
        card.appendChild(desc);
      }

      if (typeof i.price !== "undefined" && i.price !== null) {
        const price = document.createElement("p");
        price.textContent = `${i.price} ${i.currency || ""}`;
        card.appendChild(price);
      }

      card.onclick = () => openModal(i, catId);
      els.menuContainer.appendChild(card);
    });
  }

  // ---------- MODAL ----------
  function openModal(item, catId) {
    if (!els.modal) return;

    els.modalTitle.textContent = item.name || "";
    els.modalDescription.textContent = item.description || "";
    els.modalPrice.textContent =
      item.price != null ? `${item.price} ${item.currency || ""}` : "";
    els.modalAllergens.textContent = item.allergens
      ? `Allergens: ${item.allergens}`
      : "";

    if (item.image_url) {
      els.modalImage.src = item.image_url;
      els.modalImage.style.display = "block";
    } else {
      els.modalImage.style.display = "none";
    }

    const cat = state.data.categories.find((c) => c.id === catId);
    if (cat && els.modalBackCategoryName) {
      els.modalBackCategoryName.textContent = cat.name;
    }

    els.modal.style.display = "block";

    els.modalClose.onclick = closeModal;
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
    if (els.modalBackCategory) {
      els.modalBackCategory.onclick = () => {
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

  // ---------- START ----------
  loadData();
})();
