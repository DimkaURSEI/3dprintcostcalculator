// Default values for different filament types
const filamentDefaults = {
    pla: { cost: 2000, wattage: 300 },
    abs: { cost: 2500, wattage: 350 },
    petg: { cost: 2800, wattage: 330 },
    tpu: { cost: 3500, wattage: 320 },
    custom: { cost: 2000, wattage: 300 }
};

// JSONBin.io sync functions
async function saveToCloud() {
    const apiKey = localStorage.getItem('jsonbinApiKey') || '';
    const binId = localStorage.getItem('jsonbinBinId') || '';
    
    if (!apiKey || !binId) {
        alert('Сначала настройте JSONBin.io:\n1. Зарегистрируйтесь на jsonbin.io\n2. Создайте новый bin\n3. Введите API Key и Bin ID в настройках');
        return;
    }

    const settings = {};
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            settings[input.id] = input.checked;
        } else if (input.type !== 'button') {
            settings[input.id] = input.value;
        }
    });

    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': apiKey,
            },
            body: JSON.stringify(settings),
        });

        if (response.ok) {
            alert('Настройки сохранены в облаке!');
        } else {
            alert('Ошибка сохранения: ' + response.statusText);
        }
    } catch (error) {
        alert('Ошибка сети: ' + error.message);
    }
}

async function loadFromCloud() {
    const apiKey = localStorage.getItem('jsonbinApiKey') || '';
    const binId = localStorage.getItem('jsonbinBinId') || '';
    
    if (!apiKey || !binId) {
        alert('Сначала настройте JSONBin.io:\n1. Зарегистрируйтесь на jsonbin.io\n2. Создайте новый bin\n3. Введите API Key и Bin ID в настройках');
        return;
    }

    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: {
                'X-Master-Key': apiKey,
            },
        });

        if (response.ok) {
            const data = await response.json();
            const settings = data.record;
            
            Object.entries(settings).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = value;
                    } else {
                        element.value = value;
                    }
                }
            });
            
            // Trigger UI updates
            togglePrintType();
            
            const paintingEnabled = document.getElementById('paintingEnabled');
            if (paintingEnabled && paintingEnabled.checked) {
                togglePainting();
            }
            
            calculateCost();
            alert('Настройки загружены из облака!');
        } else {
            alert('Ошибка загрузки: ' + response.statusText);
        }
    } catch (error) {
        alert('Ошибка сети: ' + error.message);
    }
}

function showCloudConfig() {
    const apiKey = localStorage.getItem('jsonbinApiKey') || '';
    const binId = localStorage.getItem('jsonbinBinId') || '';
    
    const newApiKey = prompt('Введите API Key из JSONBin.io:', apiKey);
    const newBinId = prompt('Введите Bin ID из JSONBin.io:', binId);
    
    if (newApiKey !== null) {
        localStorage.setItem('jsonbinApiKey', newApiKey);
    }
    if (newBinId !== null) {
        localStorage.setItem('jsonbinBinId', newBinId);
    }
    
    if (newApiKey || newBinId) {
        alert('Конфигурация JSONBin.io сохранена!');
    }
}

// Dremel wear level costs
const dremelWearCosts = {
    light: 50,
    medium: 150,
    heavy: 300
};

// Paint size costs
const paintSizeCosts = {
    small: 100,
    medium: 250,
    large: 500
};

// Initialize the calculator
function initCalculator() {
    // Load saved settings from LocalStorage
    loadSettings();
    
    // Set up event listeners for all input fields to auto-calculate on change
    const allInputs = document.querySelectorAll('input, select');
    allInputs.forEach(input => {
        // Auto-calculate on input change
        input.addEventListener('input', calculateCost);
        
        // For mobile: blur the input after entering a value
        input.addEventListener('change', function() {
            if (window.innerWidth < 768) {
                setTimeout(() => this.blur(), 100);
            }
        });
        
        // Add keyboard event handling for Enter key
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                calculateCost();
                e.preventDefault();
                
                // Find the next input to focus
                const form = Array.from(allInputs);
                const currentIndex = form.indexOf(e.target);
                const nextElement = form[currentIndex + 1];
                
                if (nextElement) {
                    nextElement.focus();
                } else {
                    // If last element, focus on the calculate button
                    document.querySelector('.calculate-btn').focus();
                }
            }
        });
    });
    
    // Fix for iOS numeric keyboard
    const numericInputs = document.querySelectorAll('input[type="number"]');
    numericInputs.forEach(input => {
        input.addEventListener('focus', function() {
            // Add slight delay to ensure keyboard is shown
            setTimeout(() => {
                input.setAttribute('inputmode', 'decimal');
            }, 100);
        });
    });
    
    // Set up the filament type selector
    const filamentTypeSelect = document.getElementById('filamentType');
    if (filamentTypeSelect) {
        filamentTypeSelect.addEventListener('change', updateDefaultValues);
    }
    
    // Add click event for "Calculate" button
    const calculateBtn = document.querySelector('.calculate-btn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function(event) {
            calculateCost();
            
            // Add haptic feedback for mobile devices if available
            if (navigator.vibrate && window.innerWidth < 768) {
                navigator.vibrate(15);
            }
            
            // Add a visual feedback animation to the button
            this.classList.add('clicked');
            setTimeout(() => this.classList.remove('clicked'), 200);
            
            // Show a ripple effect on the button
            createRipple(this, event);
        });
    }
    
    // Add click event for "Save Settings" button
    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function(event) {
            saveSettings();
            
            // Add haptic feedback for mobile devices if available
            if (navigator.vibrate && window.innerWidth < 768) {
                navigator.vibrate(15);
            }
            
            // Add a visual feedback animation to the button
            this.classList.add('clicked');
            setTimeout(() => this.classList.remove('clicked'), 200);
            
            // Show a ripple effect on the button
            createRipple(this, event);
        });
    }
    
    // Add click event for "Reset" button
    const resetBtn = document.querySelector('.reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function(event) {
            resetForm();
            
            // Add haptic feedback for mobile devices if available
            if (navigator.vibrate && window.innerWidth < 768) {
                navigator.vibrate(15);
            }
            
            // Add a visual feedback animation to the button
            this.classList.add('clicked');
            setTimeout(() => this.classList.remove('clicked'), 200);
            
            // Show a ripple effect on the button
            createRipple(this, event);
        });
    }
    
    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(updateLayout, 300);
    });
    
    // Initialize calculator with default values
    updateDefaultValues();
    calculateCost();
    updateLayout();
}

// Toggle between FDM and SLA print types
function togglePrintType() {
    const printType = document.getElementById('printType').value;
    const fdmElements = document.querySelectorAll('.fdm-only');
    const slaElements = document.querySelectorAll('.sla-only');
    
    if (printType === 'fdm') {
        fdmElements.forEach(el => el.style.display = '');
        slaElements.forEach(el => el.style.display = 'none');
    } else {
        fdmElements.forEach(el => el.style.display = 'none');
        slaElements.forEach(el => el.style.display = '');
    }
    
    calculateCost();
}

// Toggle painting section
function togglePainting() {
    const paintingEnabled = document.getElementById('paintingEnabled').checked;
    const paintingSection = document.getElementById('paintingSection');
    
    paintingSection.style.display = paintingEnabled ? 'block' : 'none';
    
    calculateCost();
}

// Update paint cost based on size selection
function updatePaintCost() {
    calculateCost();
}

// Save settings to LocalStorage
function saveSettings() {
    const settings = {};
    
    // Get all input values
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            settings[input.id] = input.checked;
        } else if (input.type !== 'button') {
            settings[input.id] = input.value;
        }
    });
    
    // Save to LocalStorage
    localStorage.setItem('erpCalculatorSettings', JSON.stringify(settings));
    
    // Show feedback
    alert('Настройки сохранены!');
}

// Load settings from LocalStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('erpCalculatorSettings');
    
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        // Restore all input values
        Object.entries(settings).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        });
        
        // Trigger UI updates
        togglePrintType();
        
        const paintingEnabled = document.getElementById('paintingEnabled');
        if (paintingEnabled && paintingEnabled.checked) {
            togglePainting();
        }
    }
}

// Create a ripple effect for buttons
function createRipple(button, e) {
    const rect = button.getBoundingClientRect();
    const circle = document.createElement('span');
    
    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;
    
    // Position relative to button
    let x = e ? e.clientX - rect.left - radius : rect.width / 2;
    let y = e ? e.clientY - rect.top - radius : rect.height / 2;
    
    // Create the ripple effect
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;
    circle.classList.add('ripple');
    
    // Remove existing ripples
    const ripple = button.querySelector('.ripple');
    if (ripple) {
        ripple.remove();
    }
    
    button.appendChild(circle);
    
    // Remove the ripple after animation
    setTimeout(() => {
        if (circle) {
            circle.remove();
        }
    }, 600);
}

function updateLayout() {
    // Adjust UI based on viewport height
    const vh = window.innerHeight;
    const calculator = document.querySelector('.calculator-box');
    
    if (vh < 600) {
        // For very small screens (like landscape on phone)
        calculator.classList.add('compact-view');
    } else {
        calculator.classList.remove('compact-view');
    }
}

function updateDefaultValues() {
    const filamentType = document.getElementById('filamentType');
    if (!filamentType) return;
    
    const defaults = filamentDefaults[filamentType.value];
    
    if (filamentType.value !== 'custom') {
        const filamentCostInput = document.getElementById('filamentCost');
        const printerWattageInput = document.getElementById('printerWattage');
        
        if (filamentCostInput) filamentCostInput.value = defaults.cost;
        if (printerWattageInput) printerWattageInput.value = defaults.wattage;
    }
    
    calculateCost();
}

function resetForm() {
    // Reset to default filament type
    const filamentType = document.getElementById('filamentType');
    const printType = document.getElementById('printType');
    if (filamentType) filamentType.value = 'pla';
    if (printType) printType.value = 'fdm';
    
    // Reset all input fields to default values
    const inputs = {
        'equipmentCost': 100000,
        'equipmentLifespan': 10000,
        'monthlyRent': 15000,
        'filamentCost': filamentDefaults.pla.cost,
        'printWeight': 100,
        'resinCost': 3000,
        'printVolume': 50,
        'printHours': 3,
        'printMinutes': 0,
        'electricityCost': 5.47,
        'printerWattage': filamentDefaults.pla.wattage,
        'laborHourlyRate': 500,
        'postProcessingHours': 1,
        'dremelWearLevel': 'light',
        'dremelConsumables': 0,
        'paintingEnabled': false,
        'paintingTime': 1,
        'compressorPower': 500,
        'paintChemistry': 50,
        'paintSize': 'small',
        'failureRate': 10
    };
    
    // Set each input value if element exists
    Object.entries(inputs).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = value;
            } else {
                input.value = value;
            }
        }
    });
    
    // Reset result displays with fade effect
    const resultElements = ['materialCost', 'depreciationCost', 'rentCost', 'powerCost', 'laborCostResult', 'dremelWearCost', 'paintingCostResult', 'riskCost', 'totalCost'];
    resultElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('update-animation');
            element.textContent = '₽0.00';
            setTimeout(() => {
                if (element) element.classList.remove('update-animation');
            }, 400);
        }
    });
    
    // Trigger UI updates
    togglePrintType();
    
    // Focus on the first input field
    if (printType) printType.focus();
}

function calculateCost() {
    try {
        // Get input values and handle potential empty values
        const getValue = (id) => {
            const element = document.getElementById(id);
            return element ? (parseFloat(element.value) || 0) : 0;
        };
        
        const getString = (id) => {
            const element = document.getElementById(id);
            return element ? element.value : '';
        };
        
        const getChecked = (id) => {
            const element = document.getElementById(id);
            return element ? element.checked : false;
        };
        
        // Get print type
        const printType = getString('printType');
        
        // Equipment costs
        const equipmentCost = getValue('equipmentCost');
        const equipmentLifespan = getValue('equipmentLifespan');
        const monthlyRent = getValue('monthlyRent');
        
        // Material costs
        let materialCost = 0;
        if (printType === 'fdm') {
            const filamentCost = getValue('filamentCost');
            const printWeight = getValue('printWeight');
            materialCost = (filamentCost * printWeight) / 1000;
        } else {
            const resinCost = getValue('resinCost');
            const printVolume = getValue('printVolume');
            materialCost = (resinCost * printVolume) / 1000;
            
            // Auto-calculate alcohol cost for SLA (approximately 10% of resin cost)
            const alcoholCost = materialCost * 0.1;
            const alcoholInput = document.getElementById('alcoholCost');
            if (alcoholInput) {
                alcoholInput.value = alcoholCost.toFixed(2);
                materialCost += alcoholCost;
            }
        }
        
        // Time & Power
        const printHours = getValue('printHours');
        const printMinutes = getValue('printMinutes');
        const electricityCost = getValue('electricityCost');
        const printerWattage = getValue('printerWattage');
        
        // Calculate total print time in hours
        const printTime = printHours + (printMinutes / 60);
        
        // Equipment depreciation
        const depreciationCost = (equipmentCost / equipmentLifespan) * printTime;
        
        // Rent cost (hourly rate)
        const hoursPerMonth = 30 * 24;
        const hourlyRent = monthlyRent / hoursPerMonth;
        const rentCost = hourlyRent * printTime;
        
        // Electricity cost
        const powerCost = (printerWattage * printTime * electricityCost) / 1000;
        
        // Work & Post-processing
        const laborHourlyRate = getValue('laborHourlyRate');
        const postProcessingHours = getValue('postProcessingHours');
        const laborCostTotal = laborHourlyRate * (printTime + postProcessingHours);
        
        // Dremel wear cost
        const dremelWearLevel = getString('dremelWearLevel');
        const dremelWearCost = dremelWearCosts[dremelWearLevel] || 0;
        const dremelConsumables = getValue('dremelConsumables');
        const totalDremelCost = dremelWearCost + dremelConsumables;
        
        // Painting costs
        let paintingCostTotal = 0;
        const paintingEnabled = getChecked('paintingEnabled');
        if (paintingEnabled) {
            const paintingTime = getValue('paintingTime');
            const compressorPower = getValue('compressorPower');
            const paintChemistry = getValue('paintChemistry');
            const paintSize = getString('paintSize');
            
            // Painting electricity (compressor)
            const paintingPowerCost = (compressorPower * paintingTime * electricityCost) / 1000;
            
            // Painting labor
            const paintingLaborCost = laborHourlyRate * paintingTime;
            
            // Paint size cost
            const paintSizeCost = paintSizeCosts[paintSize] || 0;
            
            paintingCostTotal = paintingPowerCost + paintingLaborCost + paintChemistry + paintSizeCost;
        }
        
        // Calculate subtotal
        const subtotal = materialCost + depreciationCost + rentCost + powerCost + laborCostTotal + totalDremelCost + paintingCostTotal;
        
        // Risk cost
        const failureRate = getValue('failureRate');
        const riskCost = subtotal * (failureRate / 100);
        
        // Total cost
        const totalCost = subtotal + riskCost;

        // Update results with animations
        updateCostDisplay('materialCost', materialCost);
        updateCostDisplay('depreciationCost', depreciationCost);
        updateCostDisplay('rentCost', rentCost);
        updateCostDisplay('powerCost', powerCost);
        updateCostDisplay('laborCostResult', laborCostTotal);
        updateCostDisplay('dremelWearCost', totalDremelCost);
        updateCostDisplay('paintingCostResult', paintingCostTotal);
        updateCostDisplay('riskCost', riskCost);
        updateCostDisplay('totalCost', totalCost);
        
        // Scroll to results if they're not visible
        // Only on small screens and only if calculation was triggered by button
        if (window.innerWidth < 768 && document.activeElement === document.querySelector('.calculate-btn')) {
            const resultsElement = document.getElementById('results');
            if (resultsElement) {
                const rect = resultsElement.getBoundingClientRect();
                
                if (rect.bottom > window.innerHeight) {
                    resultsElement.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'nearest',
                        inline: 'nearest'
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error calculating cost:", error);
    }
}

function updateCostDisplay(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Format with 2 decimal places and include ruble sign
    const formattedValue = `₽${formatNumber(value)}`;
    
    // Only animate if the value has changed
    if (element.textContent !== formattedValue) {
        // Add animation class
        element.classList.add('update-animation');
        element.textContent = formattedValue;
        
        // Remove animation class after animation completes
        setTimeout(() => {
            if (element) element.classList.remove('update-animation');
        }, 400);
    }
}

// Helper to format number with proper decimal places
function formatNumber(value) {
    // For values less than 0.1, show 3 decimal places
    if (value < 0.1 && value > 0) {
        return value.toFixed(3);
    } 
    // For values less than 100, show 2 decimal places
    else if (value < 100) {
        return value.toFixed(2);
    } 
    // For larger values, only show 1 decimal place
    else {
        return value.toFixed(1);
    }
}
