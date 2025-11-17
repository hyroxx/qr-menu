// Global State
let state = {
  restaurant: null,
  categories: [],
  subcategories: [],
  items: [],
  currentLang: 'en',
  selectedCategory: null,
  selectedSubcategory: null,
};

const LANG_FLAGS = {
  tr: '🇹🇷',
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
};

// Initialize App
async function init() {
  const path = window.location.pathname;
  const urlParams = new URLSearchParams(window.location.search);
  
  // Get language
  const urlLang = urlParams.get('lang');
  const savedLang = localStorage.getItem('preferredLanguage');
  state.currentLang = urlLang || savedLang || 'en';
  
  updateLanguageSwitcher();
  
  // Get slug
  const pathParts = path.split('/').filter(p => p);
  if (pathParts.length === 0) {
    showError();
    return;
  }
  
  const slug = pathParts[0];
  const isMenuPage = pathParts[1] === 'menu';
  
  // Get category/subcategory from URL
  state.selectedCategory = urlParams.get('category') ? parseInt(urlParams.get('category')) : null;
  state.selectedSubcategory = urlParams.get('subcategory') ? parseInt(urlParams.get('subcategory')) : null;
  
  // Fetch data
  await fetchRestaurantData(slug);
  
  // Show appropriate page
  if (isMenuPage) {
    showMenuPage();
  } else {
    showHomepage();
  }
}

// Fetch Restaurant Data
async function fetchRestaurantData(slug) {
  try {
    showLoading();
    const response = await fetch(`/api/restaurant/${slug}?lang=${state.currentLang}`);
    
    if (!response.ok) {
      throw new Error('Restaurant not found');
    }
    
    const data = await response.json();
    state.restaurant = data.restaurant;
    state.categories = data.categories;
    state.subcategories = data.subcategories;
    state.items = data.items;
    
    hideLoading();
  } catch (error) {
    console.error('Error fetching data:', error);
    hideLoading();
    showError();
  }
}

// Show/Hide Elements
function showLoading() {
  document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading').classList.add('hidden');
}

function showHomepage() {
  hideAllPages();
  const homepage = document.getElementById('homepage');
  homepage.classList.remove('hidden');
  
  renderHomepage();
}

function showMenuPage() {
  hideAllPages();
  const menuPage = document.getElementById('menu-page');
  menuPage.classList.remove('hidden');
  
  renderMenuPage();
}

function showError() {
  hideAllPages();
  document.getElementById('error-page').classList.remove('hidden');
}

function hideAllPages() {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.add('hidden');
  });
}

// Render Homepage
function renderHomepage() {
  const { restaurant, categories } = state;
  
  // Restaurant info
  document.getElementById('restaurant-name').textContent = restaurant.name;
  document.getElementById('restaurant-about').textContent = restaurant.about_text || '';
  
  if (restaurant.logo_url) {
    const logo = document.getElementById('restaurant-logo');
    logo.src = restaurant.logo_url;
    logo.classList.remove('hidden');
  }
  
  // Categories grid
  const grid = document.getElementById('categories-grid');
  grid.innerHTML = '';
  
  if (categories.length > 0) {
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = 'Browse Our Menu';
    grid.appendChild(title);
    
    const container = document.createElement('div');
    container.className = 'categories-container';
    
    categories.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'category-card';
      card.innerHTML = `
        <div class="category-icon">🍽️</div>
        <div class="category-name">${cat.translatedName || cat.name}</div>
      `;
      card.onclick = () => navigateToMenu(cat.id);
      container.appendChild(card);
    });
    
    grid.appendChild(container);
  }
  
  // Footer
  renderFooter('footer');
  
  // View Menu button
  document.getElementById('view-menu-btn').onclick = () => {
    const slug = state.restaurant.slug;
    window.location.href = `/${slug}/menu?lang=${state.currentLang}`;
  };
}

// Render Menu Page
function renderMenuPage() {
  const { restaurant, categories, subcategories, items } = state;
  
  document.getElementById('header-restaurant-name').textContent = restaurant.name;
  
  // Back button
  document.getElementById('back-home-btn').onclick = () => {
    window.location.href = `/${restaurant.slug}?lang=${state.currentLang}`;
  };
  
  // Breadcrumbs
  renderBreadcrumbs();
  
  // Category filters
  if (!state.selectedCategory) {
    renderCategoryFilters();
    document.getElementById('subcategory-filters').classList.add('hidden');
  } else {
    document.getElementById('category-filters').innerHTML = '';
    
    // Subcategory filters
    const subs = subcategories.filter(s => s.category_id === state.selectedCategory);
    if (subs.length > 0 && !state.selectedSubcategory) {
      renderSubcategoryFilters(subs);
    } else {
      document.getElementById('subcategory-filters').classList.add('hidden');
    }
  }
  
  // Menu items
  renderMenuItems();
  
  // Footer
  renderFooter('menu-footer');
}

function renderBreadcrumbs() {
  const breadcrumbs = document.getElementById('breadcrumbs');
  
  if (!state.selectedCategory && !state.selectedSubcategory) {
    breadcrumbs.classList.add('hidden');
    return;
  }
  
  breadcrumbs.classList.remove('hidden');
  breadcrumbs.innerHTML = '';
  
  const backBtn = document.createElement('button');
  backBtn.className = 'btn-breadcrumb';
  backBtn.textContent = '← All Categories';
  backBtn.onclick = () => {
    state.selectedCategory = null;
    state.selectedSubcategory = null;
    updateURL();
    renderMenuPage();
  };
  breadcrumbs.appendChild(backBtn);
  
  if (state.selectedSubcategory) {
    const cat = state.categories.find(c => c.id === state.selectedCategory);
    const backCatBtn = document.createElement('button');
    backCatBtn.className = 'btn-breadcrumb';
    backCatBtn.textContent = `← ${cat?.translatedName || cat?.name}`;
    backCatBtn.onclick = () => {
      state.selectedSubcategory = null;
      updateURL();
      renderMenuPage();
    };
    breadcrumbs.appendChild(backCatBtn);
  }
}

function renderCategoryFilters() {
  const container = document.getElementById('category-filters');
  container.innerHTML = '<h2 class="section-title">Categories</h2>';
  
  const btnsContainer = document.createElement('div');
  btnsContainer.className = 'filter-buttons';
  
  state.categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'btn-filter';
    btn.textContent = cat.translatedName || cat.name;
    btn.onclick = () => {
      state.selectedCategory = cat.id;
      state.selectedSubcategory = null;
      updateURL();
      renderMenuPage();
    };
    btnsContainer.appendChild(btn);
  });
  
  container.appendChild(btnsContainer);
}

function renderSubcategoryFilters(subs) {
  const container = document.getElementById('subcategory-filters');
  container.classList.remove('hidden');
  
  const cat = state.categories.find(c => c.id === state.selectedCategory);
  container.innerHTML = `<h2 class="section-title">${cat?.translatedName || cat?.name}</h2>`;
  
  const btnsContainer = document.createElement('div');
  btnsContainer.className = 'filter-buttons';
  
  subs.forEach(sub => {
    const btn = document.createElement('button');
    btn.className = 'btn-filter btn-filter-secondary';
    btn.textContent = sub.translatedName || sub.name;
    btn.onclick = () => {
      state.selectedSubcategory = sub.id;
      updateURL();
      renderMenuPage();
    };
    btnsContainer.appendChild(btn);
  });
  
  container.appendChild(btnsContainer);
}

function renderMenuItems() {
  const container = document.getElementById('menu-items');
  
  let filteredItems = state.items;
  
  if (state.selectedSubcategory) {
    filteredItems = state.items.filter(i => i.subcategory_id === state.selectedSubcategory);
  } else if (state.selectedCategory) {
    filteredItems = state.items.filter(i => i.category_id === state.selectedCategory);
  }
  
  if (filteredItems.length === 0) {
    container.innerHTML = '<p class="no-items">No items found in this category.</p>';
    return;
  }
  
  container.innerHTML = '';
  
  filteredItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'menu-item-card';
    
    const displayName = item.translatedName || item.name;
    const displayDesc = item.translatedDescription || item.description;
    
    card.innerHTML = `
      ${item.image_url ? `
        <div class="item-image-container">
          <img src="${item.image_url}" alt="${displayName}" class="item-image">
          ${item.is_new ? '<span class="new-badge">🆕 NEW</span>' : ''}
        </div>
      ` : ''}
      <div class="item-content">
        <div class="item-header">
          <h3 class="item-name">
            ${displayName}
            ${item.is_new && !item.image_url ? '<span class="new-badge-inline">🆕</span>' : ''}
          </h3>
          <span class="item-price">${parseFloat(item.price).toFixed(2)} ${item.currency}</span>
        </div>
        ${displayDesc ? `<p class="item-description">${displayDesc}</p>` : ''}
        ${item.allergens ? `
          <div class="item-allergens">
            ${item.allergens.split(',').slice(0, 3).map(a => 
              `<span class="allergen-badge">${a.trim()}</span>`
            ).join('')}
          </div>
        ` : ''}
      </div>
    `;
    
    card.onclick = () => showModal(item);
    container.appendChild(card);
  });
}

function renderFooter(containerId) {
  const footer = document.getElementById(containerId);
  const { restaurant } = state;
  
  footer.innerHTML = `
    <div class="footer-content">
      <div class="footer-section">
        <h3>Contact</h3>
        ${restaurant.phone ? `<p>📞 <a href="tel:${restaurant.phone}">${restaurant.phone}</a></p>` : ''}
        ${restaurant.address ? `<p>📍 ${restaurant.address}</p>` : ''}
        ${restaurant.opening_hours ? `<p>🕐 ${restaurant.opening_hours}</p>` : ''}
      </div>
      <div class="footer-section">
        <h3>About</h3>
        <p>${restaurant.about_text || `Welcome to ${restaurant.name}`}</p>
      </div>
      <div class="footer-section">
        <h3>Follow Us</h3>
        <div class="social-links">
          ${restaurant.instagram_url ? `<a href="${restaurant.instagram_url}" target="_blank">Instagram</a>` : ''}
          ${restaurant.facebook_url ? `<a href="${restaurant.facebook_url}" target="_blank">Facebook</a>` : ''}
          ${restaurant.website_url ? `<a href="${restaurant.website_url}" target="_blank">Website</a>` : ''}
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© ${new Date().getFullYear()} ${restaurant.name}. All rights reserved.</p>
    </div>
  `;
}

// Modal
function showModal(item) {
  const modal = document.getElementById('modal');
  const displayName = item.translatedName || item.name;
  const displayDesc = item.translatedDescription || item.description;
  
  document.getElementById('modal-title').textContent = displayName;
  document.getElementById('modal-description').textContent = displayDesc || 'No description available.';
  document.getElementById('modal-price').textContent = `${parseFloat(item.price).toFixed(2)} ${item.currency}`;
  
  const modalImage = document.getElementById('modal-image');
  if (item.image_url) {
    modalImage.src = item.image_url;
    modalImage.classList.remove('hidden');
  } else {
    modalImage.classList.add('hidden');
  }
  
  const allergensDiv = document.getElementById('modal-allergens');
  if (item.allergens) {
    const allergensList = item.allergens.split(',').map(a => a.trim());
    allergensDiv.innerHTML = `
      <span class="allergens-label">Allergens:</span>
      ${allergensList.map(a => `<span class="allergen-badge">${a}</span>`).join('')}
    `;
    allergensDiv.classList.remove('hidden');
  } else {
    allergensDiv.classList.add('hidden');
  }
  
  modal.classList.remove('hidden');
}

function hideModal() {
  document.getElementById('modal').classList.add('hidden');
}

document.getElementById('modal-close').onclick = hideModal;
document.querySelector('.modal-overlay').onclick = hideModal;

// Language Switcher
function updateLanguageSwitcher() {
  document.getElementById('current-lang-flag').textContent = LANG_FLAGS[state.currentLang];
  document.getElementById('current-lang-code').textContent = state.currentLang.toUpperCase();
}

document.getElementById('lang-btn').onclick = () => {
  document.getElementById('lang-dropdown').classList.toggle('hidden');
};

document.querySelectorAll('.lang-option').forEach(btn => {
  btn.onclick = () => {
    const lang = btn.dataset.lang;
    state.currentLang = lang;
    localStorage.setItem('preferredLanguage', lang);
    updateLanguageSwitcher();
    document.getElementById('lang-dropdown').classList.add('hidden');
    
    // Update URL and reload
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);
    
    // Reload data
    const slug = window.location.pathname.split('/')[1];
    fetchRestaurantData(slug).then(() => {
      const isMenuPage = window.location.pathname.includes('/menu');
      if (isMenuPage) {
        renderMenuPage();
      } else {
        renderHomepage();
      }
    });
  };
});

// Utility Functions
function navigateToMenu(categoryId = null) {
  const slug = state.restaurant.slug;
  let url = `/${slug}/menu?lang=${state.currentLang}`;
  if (categoryId) {
    url += `&category=${categoryId}`;
  }
  window.location.href = url;
}

function updateURL() {
  const slug = state.restaurant.slug;
  const url = new URL(window.location.href);
  url.searchParams.set('lang', state.currentLang);
  
  if (state.selectedCategory) {
    url.searchParams.set('category', state.selectedCategory);
  } else {
    url.searchParams.delete('category');
  }
  
  if (state.selectedSubcategory) {
    url.searchParams.set('subcategory', state.selectedSubcategory);
  } else {
    url.searchParams.delete('subcategory');
  }
  
  window.history.replaceState({}, '', url);
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const switcher = document.getElementById('language-switcher');
  const dropdown = document.getElementById('lang-dropdown');
  
  if (!switcher.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
});

// Initialize on load
window.addEventListener('DOMContentLoaded', init);