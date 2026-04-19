async function loadERPData() {
  if (!currentUser) return;
  
  const { db } = await getFirebase();
  
  // Load orders
  const ordersSnapshot = await db.ref(`users/${currentUser.uid}/orders`).once('value');
  const orders = ordersSnapshot.val();
  renderOrdersSidebar(orders);
  
  // Load orders and parts
  const ordersSnapshot2 = await db.ref(`users/${currentUser.uid}/orders`).once('value');
  const orders2 = ordersSnapshot2.val();
  
  // Collect all parts from all orders
  let allParts = [];
  if (orders2) {
    for (const [orderId, order] of Object.entries(orders2)) {
      const partsSnapshot = await db.ref(`users/${currentUser.uid}/orders/${orderId}/parts`).once('value');
      const parts = partsSnapshot.val();
      if (parts) {
        Object.entries(parts).forEach(([partId, part]) => {
          allParts.push({
            id: partId,
            orderId: orderId,
            orderName: order.name,
            ...part
          });
        });
      }
    }
  }
  renderPartsList(allParts);
  
  // Load printers
  const printersSnapshot = await db.ref(`users/${currentUser.uid}/equipment`).once('value');
  const printers = printersSnapshot.val();
  renderPrintersList(printers);
  
  // Load post-processing stations (default 1)
  renderPostProcessingStations();
  
  // Load painting stations (default 1)
  renderPaintingStations();
}

function renderOrdersSidebar(orders) {
  const container = document.getElementById('ordersList');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!orders || Object.keys(orders).length === 0) {
    container.innerHTML = '<p style="color: #666;">Нет заказов</p>';
    return;
  }
  
  Object.entries(orders).forEach(([orderId, order]) => {
    const div = document.createElement('div');
    div.className = 'order-sidebar-item';
    div.dataset.orderId = orderId;
    div.innerHTML = `
      <strong>${order.name}</strong>
      ${order.clientName ? `<small>${order.clientName}</small>` : ''}
      <small>₽${order.totalCost || 0}</small>
    `;
    div.addEventListener('click', () => filterPartsByOrder(orderId));
    container.appendChild(div);
  });
}

let currentFilterOrderId = null;

function filterPartsByOrder(orderId) {
  currentFilterOrderId = orderId;
  loadERPData(); // Reload with filter
  
  // Show clear filter button
  const clearBtn = document.querySelector('.clear-filter-btn');
  if (clearBtn) clearBtn.style.display = 'block';
}

function clearOrderFilter() {
  currentFilterOrderId = null;
  loadERPData();
  
  // Hide clear filter button
  const clearBtn = document.querySelector('.clear-filter-btn');
  if (clearBtn) clearBtn.style.display = 'none';
}

window.showCreateOrderModal = function() {
  document.getElementById('orderModal').style.display = 'block';
  document.getElementById('modalOrderName').value = '';
  document.getElementById('modalClientName').value = '';
};

window.hideCreateOrderModal = function() {
  document.getElementById('orderModal').style.display = 'none';
};

window.createOrder = async function() {
  const orderName = document.getElementById('modalOrderName').value;
  const clientName = document.getElementById('modalClientName').value;
  
  if (!orderName) {
    alert('Введите название заказа');
    return;
  }
  
  const { db } = await getFirebase();
  
  const orderId = db.ref(`users/${currentUser.uid}/orders`).push().key;
  const orderData = {
    name: orderName,
    clientName: clientName || '',
    createdAt: Date.now(),
    status: 'pending',
    totalCost: 0
  };
  
  await db.ref(`users/${currentUser.uid}/orders/${orderId}`).set(orderData);
  
  hideCreateOrderModal();
  loadERPData();
  alert('Заказ создан!');
};

function renderPartsList(parts) {
  const container = document.getElementById('partsList');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!parts || parts.length === 0) {
    container.innerHTML = '<p style="color: #666;">Нет деталей</p>';
    return;
  }
  
  // Filter by order if filter is set
  const filteredParts = currentFilterOrderId 
    ? parts.filter(p => p.orderId === currentFilterOrderId)
    : parts;
  
  if (filteredParts.length === 0) {
    container.innerHTML = '<p style="color: #666;">Нет деталей</p>';
    return;
  }
  
  filteredParts.forEach(part => {
    const div = document.createElement('div');
    div.className = 'order-card';
    div.draggable = true;
    div.dataset.partId = part.id;
    div.dataset.orderId = part.orderId;
    div.dataset.totalQuantity = part.quantity;
    div.dataset.assignedQuantity = part.assignedQuantity || 0;
    
    const remaining = part.quantity - (part.assignedQuantity || 0);
    
    div.innerHTML = `
      <div class="order-info">
        <strong>${part.orderName}</strong>
        <div>${part.name}</div>
        <div>Всего: ${part.quantity} | Назначено: ${part.assignedQuantity || 0} | Осталось: ${remaining}</div>
        <div>${part.filamentType || part.materialType}</div>
      </div>
    `;
    
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragend', handleDragEnd);
    
    container.appendChild(div);
  });
}

async function renderPrintersList(printers) {
  const container = document.getElementById('printersList');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!printers || Object.keys(printers).length === 0) {
    container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Нет принтеров.<br>Добавьте принтеры в настройках.</p>';
    return;
  }
  
  // Load assignments to show on each printer
  const assignments = await loadAssignments();
  
  Object.entries(printers).forEach(([id, item]) => {
    const div = document.createElement('div');
    div.className = 'station-card printer-card';
    div.dataset.printerId = id;
    
    // Find assignments for this printer
    const printerAssignments = Object.entries(assignments)
      .filter(([_, assignment]) => assignment.printerId === id)
      .map(([assignmentId, assignment]) => ({ assignmentId, ...assignment }));
    
    const assignmentsHtml = printerAssignments.length > 0 
      ? printerAssignments.map(a => `<div class="assigned-part">×${a.quantity} детали</div>`).join('')
      : '<div class="no-assignments">Нет назначений</div>';
    
    div.innerHTML = `
      <strong>${item.name}</strong>
      <small>Статус: available</small>
      <div class="assignments-list">${assignmentsHtml}</div>
      <div class="drop-zone" data-station-type="printer" data-station-id="${id}">📥 Перетащите деталь</div>
    `;
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('drop', handleDrop);
    div.addEventListener('dragleave', handleDragLeave);
    container.appendChild(div);
  });
}

function renderPostProcessingStations() {
  const container = document.getElementById('postProcessingList');
  if (!container) return;
  
  container.innerHTML = `
    <div class="station-card post-processing-card">
      <strong>Постобработка 1</strong>
      <small>Статус: available</small>
      <div class="drop-zone" data-station-type="post-processing" data-station-id="1">📥 Перетащите заказ</div>
    </div>
  `;
  
  // Add drop event listeners
  const dropZone = container.querySelector('.drop-zone');
  if (dropZone) {
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('drop', handleDrop);
    dropZone.addEventListener('dragleave', handleDragLeave);
  }
}

function renderPaintingStations() {
  const container = document.getElementById('paintingList');
  if (!container) return;
  
  container.innerHTML = `
    <div class="station-card painting-card">
      <strong>Покраска 1</strong>
      <small>Статус: available</small>
      <div class="drop-zone" data-station-type="painting" data-station-id="1">📥 Перетащите заказ</div>
    </div>
  `;
  
  // Add drop event listeners
  const dropZone = container.querySelector('.drop-zone');
  if (dropZone) {
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('drop', handleDrop);
    dropZone.addEventListener('dragleave', handleDragLeave);
  }
}

async function saveAssignment(orderId, partId, stationType, stationId, quantity) {
  const { db } = await getFirebase();
  
  const assignmentId = db.ref(`users/${currentUser.uid}/assignments`).push().key;
  const assignmentData = {
    orderId,
    partId,
    printerId: stationType === 'printer' ? stationId : null,
    stationId: stationType !== 'printer' ? stationId : null,
    stationType,
    quantity,
    status: 'pending',
    assignedAt: Date.now(),
    completedAt: null
  };
  
  await db.ref(`users/${currentUser.uid}/assignments/${assignmentId}`).set(assignmentData);
  
  // Update part's assigned quantity
  const partSnapshot = await db.ref(`users/${currentUser.uid}/orders/${orderId}/parts/${partId}`).once('value');
  const part = partSnapshot.val();
  const currentAssigned = part.assignedQuantity || 0;
  await db.ref(`users/${currentUser.uid}/orders/${orderId}/parts/${partId}`).update({
    assignedQuantity: currentAssigned + quantity
  });
  
  return assignmentId;
}

async function loadAssignments() {
  const { db } = await getFirebase();
  
  const snapshot = await db.ref(`users/${currentUser.uid}/assignments`).once('value');
  const assignments = snapshot.val();
  
  return assignments || {};
}

// Drag and drop handlers
let draggedPartId = null;
let draggedOrderId = null;

function handleDragStart(e) {
  draggedPartId = e.target.dataset.partId;
  draggedOrderId = e.target.dataset.orderId;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify({ partId: draggedPartId, orderId: draggedOrderId }));
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  const dropZone = e.target.closest('.drop-zone');
  if (dropZone) {
    dropZone.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  const dropZone = e.target.closest('.drop-zone');
  if (dropZone) {
    dropZone.classList.remove('drag-over');
  }
}

async function handleDrop(e) {
  e.preventDefault();
  
  const dropZone = e.target.closest('.drop-zone');
  if (!dropZone) return;
  
  dropZone.classList.remove('drag-over');
  
  const stationType = dropZone.dataset.stationType;
  const stationId = dropZone.dataset.stationId;
  const data = e.dataTransfer.getData('text/plain');
  
  if (!data) return;
  
  try {
    const { partId, orderId } = JSON.parse(data);
    
    // Get part data to show available quantity
    const { db } = await getFirebase();
    const partSnapshot = await db.ref(`users/${currentUser.uid}/orders/${orderId}/parts/${partId}`).once('value');
    const part = partSnapshot.val();
    
    if (!part) {
      alert('Деталь не найдена');
      return;
    }
    
    // If quantity is 1, assign automatically without prompt
    if (part.quantity === 1) {
      await saveAssignment(orderId, partId, stationType, stationId, 1);
      loadERPData();
      alert(`Назначено: 1 деталь на ${stationType} ${stationId}`);
      return;
    }
    
    // Prompt for quantity with "all" option
    const quantity = prompt(`Сколько деталей "${part.name}" (доступно: ${part.quantity}) на этом станке?\n\nВведите число или "все" для всех деталей:`, part.quantity);
    
    if (quantity === null) return; // User cancelled
    
    let qty;
    if (quantity.toLowerCase() === 'все' || quantity.toLowerCase() === 'all') {
      qty = part.quantity;
    } else {
      qty = parseInt(quantity);
    }
    
    if (isNaN(qty) || qty <= 0) {
      alert('Некорректное количество');
      return;
    }
    
    if (qty > part.quantity) {
      alert(`Недостаточно деталей. Доступно: ${part.quantity}`);
      return;
    }
    
    // Save assignment
    await saveAssignment(orderId, partId, stationType, stationId, qty);
    
    // Reload data to show updated assigned quantities
    loadERPData();
    
    alert(`Назначено: ${qty} деталей на ${stationType} ${stationId}`);
    
  } catch (error) {
    console.error('Error in handleDrop:', error);
    alert('Ошибка: ' + error.message);
  }
}
