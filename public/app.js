document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const restoranId = params.get('restoran_id');

  if (!restoranId) {
    document.getElementById('menu-container').innerHTML = '<p>Restoran ID bulunamadı.</p>';
    return;
  }

  try {
    // 👉 1. Duyuruları getir
    const notificationsRes = await fetch(`/notifications/${restoranId}`);
    const notifications = await notificationsRes.json();

    const notificationBar = document.getElementById('notifications');
    if (notifications.length > 0) {
      notificationBar.textContent = notifications[0].content;
    }

    // 👉 2. Menü öğelerini getir
    const response = await fetch(`/menu/items/${restoranId}`);
    const menuItems = await response.json();

    const container = document.getElementById('menu-container');

    if (menuItems.length === 0) {
      container.innerHTML = '<p>Bu restorana ait menü bulunamadı.</p>';
      return;
    }

    // 👉 3. Menü kartlarını oluştur
    menuItems.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('menu-item');

      const imageUrl = item.photo_url ? item.photo_url : 'https://via.placeholder.com/200x150?text=Yemek';

      itemDiv.innerHTML = `
        <img src="${imageUrl}" alt="${item.name}" />
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <p><strong>${item.price}₺</strong></p>
      `;

      container.appendChild(itemDiv);
    });

  } catch (error) {
    console.error('Veri yüklenirken hata oluştu:', error);
    document.getElementById('menu-container').innerHTML = '<p>Menü yüklenemedi.</p>';
  }
});
