// Premium UI JavaScript for 3D Print ERP Calculator

// Toggle settings sidebar/drawer
function toggleSettings() {
  const sidebar = document.getElementById('settingsSidebar');
  const mobileDrawer = document.getElementById('mobileSettingsDrawer');
  
  if (window.innerWidth >= 992) {
    // Desktop: toggle sidebar
    if (sidebar.style.display === 'none') {
      sidebar.style.display = 'flex';
    } else {
      sidebar.style.display = 'none';
    }
  } else {
    // Mobile: toggle drawer
    mobileDrawer.classList.toggle('open');
  }
}

// Close mobile drawer
function closeMobileDrawer() {
  const mobileDrawer = document.getElementById('mobileSettingsDrawer');
  mobileDrawer.classList.remove('open');
}

// Initialize premium UI
function initPremiumUI() {
  // Check auth state
  const authSection = document.getElementById('authModal');
  const mainApp = document.getElementById('mainApp');

  // Show/hide settings sidebar based on screen size
  function updateLayout() {
    const sidebar = document.getElementById('settingsSidebar');
    if (window.innerWidth >= 992) {
      sidebar.style.display = 'flex';
    } else {
      sidebar.style.display = 'none';
    }
  }

  // Initial layout
  updateLayout();

  // Update on resize
  window.addEventListener('resize', updateLayout);

  // Close drawer on overlay click
  const drawerOverlay = document.querySelector('.drawer-overlay');
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeMobileDrawer);
  }

  // Initialize calculator
  if (typeof initCalculator === 'function') {
    initCalculator();
  }

  // Load global settings from Firebase (called after auth state changes in calculator-erp.js)
  // Note: loadGlobalSettings() is called in auth.onAuthStateChanged callback in calculator-erp.js

  // Populate printer dropdown from equipment/
  populatePrinterDropdown();

  // Populate materials dropdown
  populateMaterials();

  // Add auto-save for tariffs and post-processing
  const tariffInputs = document.querySelectorAll('#monthlyRent, #monthlyHours, #electricityCost, #laborHourlyRate, #paintingLaborRate');
  tariffInputs.forEach(input => {
    if (input) {
      input.addEventListener('change', saveGlobalSettings);
    }
  });

  // Post-processing table will be added in Task 6
  const postProcessingInputs = document.querySelectorAll('.post-processing-table input');
  postProcessingInputs.forEach(input => {
    input.addEventListener('change', saveGlobalSettings);
  });
}

// Override updateAuthUI for premium layout
function updateAuthUI() {
  const authModal = document.getElementById('authModal');
  const mainApp = document.getElementById('mainApp');
  const userInfo = document.getElementById('userInfo');
  
  if (currentUser) {
    authModal.style.display = 'none';
    mainApp.style.display = 'flex';
    if (userInfo) {
      userInfo.textContent = currentUser.email;
    }
  } else {
    authModal.style.display = 'flex';
    mainApp.style.display = 'none';
  }
}

// Override equipment/consumables rendering for premium layout
function renderEquipmentList(equipment) {
  const container = document.getElementById('equipmentList');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!equipment || Object.keys(equipment).length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.875rem;">Нет добавленного оборудования</p>';
    return;
  }
  
  Object.entries(equipment).forEach(([id, item]) => {
    const div = document.createElement('div');
    div.className = 'settings-item';
    div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-tertiary); border-radius: 8px; margin-bottom: 8px;';
    div.innerHTML = `
      <span style="font-size: 0.875rem; color: var(--text-secondary);">${item.name}</span>
      <div style="display: flex; gap: 8px;">
        <button onclick="editEquipment('${id}')" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px;"><i class="fas fa-edit"></i></button>
        <button onclick="deleteEquipment('${id}')" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px;"><i class="fas fa-trash"></i></button>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderConsumablesList(consumables) {
  const container = document.getElementById('consumablesList');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!consumables || Object.keys(consumables).length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.875rem;">Нет добавленных расходников</p>';
    return;
  }
  
  Object.entries(consumables).forEach(([id, item]) => {
    const div = document.createElement('div');
    div.className = 'settings-item';
    div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-tertiary); border-radius: 8px; margin-bottom: 8px;';
    div.innerHTML = `
      <span style="font-size: 0.875rem; color: var(--text-secondary);">${item.name}</span>
      <div style="display: flex; gap: 8px;">
        <button onclick="editConsumable('${id}')" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px;"><i class="fas fa-edit"></i></button>
        <button onclick="deleteConsumable('${id}')" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px;"><i class="fas fa-trash"></i></button>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderProjectsList(projects) {
  const container = document.getElementById('projectsList');
  const projectSelect = document.getElementById('projectSelect');
  
  if (container) {
    container.innerHTML = '';
    
    if (!projects || Object.keys(projects).length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.875rem;">Нет проектов</p>';
    } else {
      Object.entries(projects).forEach(([id, item]) => {
        const div = document.createElement('div');
        div.className = 'settings-item';
        div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-tertiary); border-radius: 8px; margin-bottom: 8px;';
        div.innerHTML = `
          <span style="font-size: 0.875rem; color: var(--text-secondary);">${item.name}</span>
          <div style="display: flex; gap: 8px;">
            <button onclick="loadProject('${id}')" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px;" title="Загрузить"><i class="fas fa-folder-open"></i></button>
            <button onclick="editProject('${id}')" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px;" title="Редактировать"><i class="fas fa-edit"></i></button>
            <button onclick="deleteProject('${id}')" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px;" title="Удалить"><i class="fas fa-trash"></i></button>
          </div>
        `;
        container.appendChild(div);
      });
    }
  }
  
  // Update project select dropdown
  if (projectSelect) {
    projectSelect.innerHTML = '<option value="">Выберите проект</option>';
    if (projects) {
      Object.entries(projects).forEach(([id, item]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = item.name;
        projectSelect.appendChild(option);
      });
      
      // Add change event
      projectSelect.onchange = function() {
        if (this.value) {
          loadProject(this.value);
        }
      };
    }
  }
}

async function loadGlobalSettings() {
  if (!currentUser) return;

  const { db } = await getFirebase();

  try {
    // Load tariffs
    const tariffsSnapshot = await db.ref(`users/${currentUser.uid}/tariffs`).once('value');
    const tariffs = tariffsSnapshot.val();

    if (tariffs) {
      const monthlyRentEl = document.getElementById('monthlyRent');
      const monthlyHoursEl = document.getElementById('monthlyHours');
      const electricityCostEl = document.getElementById('electricityCost');
      const laborHourlyRateEl = document.getElementById('laborHourlyRate');
      const paintingLaborRateEl = document.getElementById('paintingLaborRate');

      if (monthlyRentEl) monthlyRentEl.value = tariffs.monthlyRent || 15000;
      if (monthlyHoursEl) monthlyHoursEl.value = tariffs.monthlyHours || 160;
      if (electricityCostEl) electricityCostEl.value = tariffs.electricityCost || 5.47;
      if (laborHourlyRateEl) laborHourlyRateEl.value = tariffs.laborRate || 500;
      if (paintingLaborRateEl) paintingLaborRateEl.value = tariffs.paintingLaborRate || 600;
    }

    // Load post-processing
    const postProcessingSnapshot = await db.ref(`users/${currentUser.uid}/postProcessing`).once('value');
    const postProcessing = postProcessingSnapshot.val();

    if (postProcessing) {
      if (postProcessing.sharpening) {
        const sharpeningLightEl = document.getElementById('sharpeningLight');
        const sharpeningMediumEl = document.getElementById('sharpeningMedium');
        const sharpeningHeavyEl = document.getElementById('sharpeningHeavy');

        if (sharpeningLightEl) sharpeningLightEl.value = postProcessing.sharpening.light || 50;
        if (sharpeningMediumEl) sharpeningMediumEl.value = postProcessing.sharpening.medium || 150;
        if (sharpeningHeavyEl) sharpeningHeavyEl.value = postProcessing.sharpening.heavy || 300;
      }
      if (postProcessing.abrasives) {
        const abrasivesLightEl = document.getElementById('abrasivesLight');
        const abrasivesMediumEl = document.getElementById('abrasivesMedium');
        const abrasivesHeavyEl = document.getElementById('abrasivesHeavy');

        if (abrasivesLightEl) abrasivesLightEl.value = postProcessing.abrasives.light || 30;
        if (abrasivesMediumEl) abrasivesMediumEl.value = postProcessing.abrasives.medium || 80;
        if (abrasivesHeavyEl) abrasivesHeavyEl.value = postProcessing.abrasives.heavy || 150;
      }
    }

    // Recalculate after loading settings
    if (typeof calculateCost === 'function') {
      calculateCost();
    }
  } catch (error) {
    console.error('Error loading global settings:', error);
  }
}

async function populatePrinterDropdown() {
  if (!currentUser) return;

  const { db } = await getFirebase();

  try {
    const snapshot = await db.ref(`users/${currentUser.uid}/equipment`).once('value');
    const equipment = snapshot.val();

    const select = document.getElementById('printerSelect');
    if (!select) return;

    select.innerHTML = '<option value="">Выберите принтер</option>';

    if (equipment) {
      Object.entries(equipment).forEach(([id, item]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = item.name;
        option.dataset.cost = item.cost;
        option.dataset.lifespan = item.lifespan;
        option.dataset.power = item.power;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading printers:', error);
  }
}

function updatePrinterDefaults() {
  const select = document.getElementById('printerSelect');
  const selectedOption = select.options[select.selectedIndex];

  if (selectedOption && selectedOption.value) {
    document.getElementById('selectedPrinterCost').value = selectedOption.dataset.cost;
    document.getElementById('selectedPrinterLifespan').value = selectedOption.dataset.lifespan;
    document.getElementById('selectedPrinterPower').value = selectedOption.dataset.power;
    if (typeof calculateCost === 'function') {
      calculateCost();
    }
  }
}

async function populateMaterials() {
  if (!currentUser) return;

  const { db } = await getFirebase();

  try {
    const snapshot = await db.ref(`users/${currentUser.uid}/materials`).once('value');
    const materials = snapshot.val();

    const select = document.getElementById('materialSelect');
    if (!select) return;

    select.innerHTML = '<option value="">Выберите материал</option>';

    if (materials) {
      Object.entries(materials).forEach(([id, item]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = `${item.name} (${item.cost}₽/${item.unit})`;
        option.dataset.cost = item.cost;
        option.dataset.power = item.power || 300;
        option.dataset.type = item.type || 'FDM';
        option.dataset.unit = item.unit;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading materials:', error);
  }
}

function updateMaterialDefaults() {
  const select = document.getElementById('materialSelect');
  const selectedOption = select.options[select.selectedIndex];

  const fdmSection = document.getElementById('fdmSection');
  const slaSection = document.getElementById('slaSection');

  if (selectedOption && selectedOption.value) {
    document.getElementById('materialCost').value = selectedOption.dataset.cost;
    document.getElementById('materialPower').value = selectedOption.dataset.power;
    document.getElementById('materialType').value = selectedOption.dataset.type;

    // Toggle FDM/SLA based on material type
    const materialType = selectedOption.dataset.type;
    document.getElementById('printType').value = materialType.toLowerCase();
    if (typeof togglePrintType === 'function') {
      togglePrintType();
    }

    // Hide FDM/SLA sections when material is selected
    if (fdmSection) fdmSection.style.display = 'none';
    if (slaSection) slaSection.style.display = 'none';

    if (typeof calculateCost === 'function') {
      calculateCost();
    }
  } else {
    // Show FDM/SLA sections when no material is selected
    const printType = document.getElementById('printType').value;
    if (printType === 'fdm') {
      if (fdmSection) fdmSection.style.display = 'block';
      if (slaSection) slaSection.style.display = 'none';
    } else {
      if (fdmSection) fdmSection.style.display = 'none';
      if (slaSection) slaSection.style.display = 'block';
    }
  }
}

async function saveGlobalSettings() {
  if (!currentUser) return;

  const { db } = await getFirebase();

  try {
    // Save tariffs
    const tariffs = {
      monthlyRent: parseFloat(document.getElementById('monthlyRent').value) || 15000,
      monthlyHours: parseFloat(document.getElementById('monthlyHours').value) || 160,
      electricityCost: parseFloat(document.getElementById('electricityCost').value) || 5.47,
      laborRate: parseFloat(document.getElementById('laborHourlyRate').value) || 500
    };

    // paintingLaborRate will be added in Task 7
    const paintingLaborRateEl = document.getElementById('paintingLaborRate');
    if (paintingLaborRateEl) {
      tariffs.paintingLaborRate = parseFloat(paintingLaborRateEl.value) || 600;
    }

    await db.ref(`users/${currentUser.uid}/tariffs`).set(tariffs);

    // Save post-processing (table will be added in Task 6)
    const postProcessing = {};

    const sharpeningLightEl = document.getElementById('sharpeningLight');
    const sharpeningMediumEl = document.getElementById('sharpeningMedium');
    const sharpeningHeavyEl = document.getElementById('sharpeningHeavy');

    if (sharpeningLightEl && sharpeningMediumEl && sharpeningHeavyEl) {
      postProcessing.sharpening = {
        light: parseFloat(sharpeningLightEl.value) || 50,
        medium: parseFloat(sharpeningMediumEl.value) || 150,
        heavy: parseFloat(sharpeningHeavyEl.value) || 300
      };
    }

    const abrasivesLightEl = document.getElementById('abrasivesLight');
    const abrasivesMediumEl = document.getElementById('abrasivesMedium');
    const abrasivesHeavyEl = document.getElementById('abrasivesHeavy');

    if (abrasivesLightEl && abrasivesMediumEl && abrasivesHeavyEl) {
      postProcessing.abrasives = {
        light: parseFloat(abrasivesLightEl.value) || 30,
        medium: parseFloat(abrasivesMediumEl.value) || 80,
        heavy: parseFloat(abrasivesHeavyEl.value) || 150
      };
    }

    // Only save postProcessing if we have data
    if (Object.keys(postProcessing).length > 0) {
      await db.ref(`users/${currentUser.uid}/postProcessing`).set(postProcessing);
    }

    console.log('[Premium] Global settings saved');

    // Recalculate after saving settings
    if (typeof calculateCost === 'function') {
      calculateCost();
    }
  } catch (error) {
    console.error('Error saving global settings:', error);
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
  initPremiumUI();
});
