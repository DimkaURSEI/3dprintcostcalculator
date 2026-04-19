async function loadERPData() {
  if (!currentUser) return;
  
  const { db } = await getFirebase();
  
  // Load orders
  const ordersSnapshot = await db.ref(`users/${currentUser.uid}/projects`).once('value');
  const orders = ordersSnapshot.val();
  renderOrdersList(orders);
  
  // Load printers
  const printersSnapshot = await db.ref(`users/${currentUser.uid}/equipment`).once('value');
  const printers = printersSnapshot.val();
  renderPrintersList(printers);
  
  // Load post-processing stations (default 1)
  renderPostProcessingStations();
  
  // Load painting stations (default 1)
  renderPaintingStations();
}

function renderOrdersList(orders) {
  const container = document.getElementById('ordersList');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!orders || Object.keys(orders).length === 0) {
    container.innerHTML = '<p style="color: #666;">Нет заказов</p>';
    return;
  }
  
  Object.entries(orders).forEach(([id, item]) => {
    const div = document.createElement('div');
    div.className = 'order-card';
    div.draggable = true;
    div.dataset.orderId = id;
    div.innerHTML = `
      <strong>${item.name}</strong>
      <small>Статус: ${item.status || 'pending'}</small>
    `;
    div.addEventListener('dragstart', handleDragStart);
    container.appendChild(div);
  });
}
