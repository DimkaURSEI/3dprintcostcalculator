let calendar = null;

async function initCalendar() {
  const calendarEl = document.getElementById('calendar');
  
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'resourceTimelineDay',
    schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
    resources: [],
    events: [],
    editable: true,
    selectable: true,
    droppable: true,
    resourceAreaWidth: '20%',
    resourceGroupField: 'group',
    headerToolbar: {
      left: 'today prev,next',
      center: 'title',
      right: 'resourceTimelineDay,resourceTimelineWeek'
    },
    slotDuration: '01:00',
    slotLabelInterval: '01:00',
    slotMinTime: '00:00',
    slotMaxTime: '24:00',
    height: '100%'
  });
  
  calendar.render();
  
  // Initialize drop handling
  initCalendarDrop();
}

async function loadERPData() {
  if (!currentUser) return;
  
  const { db } = await getFirebase();
  
  // Initialize calendar if not already done
  if (!calendar) {
    await initCalendar();
  }
  
  // Load orders for dropdown
  const ordersSnapshot = await db.ref(`users/${currentUser.uid}/orders`).once('value');
  const orders = ordersSnapshot.val();
  renderOrderDropdown(orders);
  
  // Load resources (stations)
  const resources = [];
  
  // Load printers
  const printersSnapshot = await db.ref(`users/${currentUser.uid}/equipment`).once('value');
  const printers = printersSnapshot.val();
  if (printers) {
    Object.entries(printers).forEach(([id, item]) => {
      resources.push({
        id: `printer-${id}`,
        group: 'Принтеры',
        title: item.name,
        type: 'printer',
        stationId: id
      });
    });
  }
  
  // Post-processing stations
  resources.push({
    id: 'post-processing-1',
    group: 'Постобработка',
    title: 'Постобработка 1',
    type: 'post-processing',
    stationId: '1'
  });
  
  // Painting stations
  resources.push({
    id: 'painting-1',
    group: 'Покраска',
    title: 'Покраска 1',
    type: 'painting',
    stationId: '1'
  });
  
  calendar.setOption('resources', resources);
  
  // Load assignments as events
  const assignments = await loadAssignments();
  const events = [];
  
  if (assignments) {
    Object.entries(assignments).forEach(([assignmentId, assignment]) => {
      const resourceId = assignment.printerId 
        ? `printer-${assignment.printerId}`
        : assignment.stationType === 'post-processing'
          ? `post-processing-${assignment.stationId}`
          : `painting-${assignment.stationId}`;
      
      // Calculate duration based on part parameters
      const startTime = new Date(assignment.assignedAt);
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours
      
      events.push({
        id: assignmentId,
        resourceId: resourceId,
        title: `${assignment.quantity} деталей`,
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        extendedProps: {
          orderId: assignment.orderId,
          partId: assignment.partId,
          quantity: assignment.quantity
        }
      });
    });
  }
  
  calendar.setOption('events', events);
  
  // Render stations list (for reference)
  renderPrintersList(printers);
  renderPostProcessingStations();
  renderPaintingStations();
}

function renderOrderDropdown(orders) {
  const select = document.getElementById('orderSelect');
  if (!select) return;
  
  select.innerHTML = '<option value="">Выберите заказ</option>';
  
  if (!orders || Object.keys(orders).length === 0) {
    return;
  }
  
  Object.entries(orders).forEach(([id, order]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = order.name;
    select.appendChild(option);
  });
}

async function loadOrderParts() {
  const orderId = document.getElementById('orderSelect').value;
  if (!orderId) {
    document.getElementById('selectedOrderInfo').style.display = 'none';
    renderPartsList([]);
    return;
  }
  
  const { db } = await getFirebase();
  
  // Load order info
  const orderSnapshot = await db.ref(`users/${currentUser.uid}/orders/${orderId}`).once('value');
  const order = orderSnapshot.val();
  
  if (order) {
    document.getElementById('selectedOrderInfo').style.display = 'block';
    document.getElementById('selectedOrderName').textContent = order.name;
    document.getElementById('selectedOrderClient').textContent = order.clientName ? `Клиент: ${order.clientName}` : '';
    document.getElementById('selectedOrderComment').textContent = order.comment || '';
  }
  
  // Load parts
  const partsSnapshot = await db.ref(`users/${currentUser.uid}/orders/${orderId}/parts`).once('value');
  const parts = partsSnapshot.val();
  
  const partsList = [];
  if (parts) {
    Object.entries(parts).forEach(([partId, part]) => {
      partsList.push({
        id: partId,
        orderId: orderId,
        orderName: order.name,
        ...part
      });
    });
  }
  
  renderPartsList(partsList);
}

window.showCreateOrderModal = function() {
  document.getElementById('orderModal').style.display = 'block';
  document.getElementById('modalOrderName').value = '';
  document.getElementById('modalClientName').value = '';
  document.getElementById('modalOrderComment').value = '';
};

window.hideCreateOrderModal = function() {
  document.getElementById('orderModal').style.display = 'none';
};

window.createOrder = async function() {
  const orderName = document.getElementById('modalOrderName').value;
  const clientName = document.getElementById('modalClientName').value;
  const orderComment = document.getElementById('modalOrderComment').value;
  
  if (!orderName) {
    alert('Введите название заказа');
    return;
  }
  
  const { db } = await getFirebase();
  
  const orderId = db.ref(`users/${currentUser.uid}/orders`).push().key;
  const orderData = {
    name: orderName,
    clientName: clientName || '',
    comment: orderComment || '',
    createdAt: Date.now(),
    status: 'pending',
    totalCost: 0
  };
  
  await db.ref(`users/${currentUser.uid}/orders/${orderId}`).set(orderData);
  
  hideCreateOrderModal();
  
  // Refresh order dropdown
  const ordersSnapshot = await db.ref(`users/${currentUser.uid}/orders`).once('value');
  const orders = ordersSnapshot.val();
  renderOrderDropdown(orders);
  
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
  
  parts.forEach(part => {
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
        <strong>${part.name}</strong>
        <div>× ${part.quantity}</div>
        <div>Назначено: ${part.assignedQuantity || 0} | Осталось: ${remaining}</div>
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

// FullCalendar drop handling
function initCalendarDrop() {
  if (!calendar) return;
  
  calendar.on('drop', async function(info) {
    const partId = info.draggedEl.dataset.partId;
    const orderId = info.draggedEl.dataset.orderId;
    const resourceId = info.resource.id;
    
    // Extract station info from resourceId
    const resource = calendar.getResourceById(resourceId);
    const stationType = resource.extendedProps.type;
    const stationId = resource.extendedProps.stationId;
    
    // Get part data
    const { db } = await getFirebase();
    const partSnapshot = await db.ref(`users/${currentUser.uid}/orders/${orderId}/parts/${partId}`).once('value');
    const part = partSnapshot.val();
    
    if (!part) {
      alert('Деталь не найдена');
      info.revert();
      return;
    }
    
    // If quantity is 1, assign automatically
    if (part.quantity === 1) {
      await saveAssignment(orderId, partId, stationType, stationId, 1);
      loadERPData();
      alert(`Назначено: 1 деталь на ${resource.title}`);
      return;
    }
    
    // Prompt for quantity
    const quantity = prompt(`Сколько деталей "${part.name}" (доступно: ${part.quantity}) на ${resource.title}?`, part.quantity);
    
    if (quantity === null) {
      info.revert();
      return;
    }
    
    let qty;
    if (quantity.toLowerCase() === 'все' || quantity.toLowerCase() === 'all') {
      qty = part.quantity;
    } else {
      qty = parseInt(quantity);
    }
    
    if (isNaN(qty) || qty <= 0) {
      alert('Некорректное количество');
      info.revert();
      return;
    }
    
    if (qty > part.quantity) {
      alert(`Недостаточно деталей. Доступно: ${part.quantity}`);
      info.revert();
      return;
    }
    
    // Save assignment
    await saveAssignment(orderId, partId, stationType, stationId, qty);
    
    // Update event on calendar
    const startTime = new Date(info.dateStr);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours
    
    calendar.addEvent({
      resourceId: resourceId,
      title: `${qty} деталей`,
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      extendedProps: {
        orderId: orderId,
        partId: partId,
        quantity: qty
      }
    });
    
    loadERPData();
    alert(`Назначено: ${qty} деталей на ${resource.title}`);
  });
}
