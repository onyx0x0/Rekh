// Unit Converter Tool Implementation
let unitConverterBooted = false;
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('unit-converter-button');
  if (!btn) return;
  btn.addEventListener('click', (event) => {
    if (unitConverterBooted) return;
    unitConverterBooted = true;
    event.preventDefault();
    bootUnitConverter();
    openUnitConverterModal();
  }, { once: true });
});

function bootUnitConverter() {
  console.log('Unit Converter: Initializing...');
  
  // Create unit converter modal
  createUnitConverterModal();
  enhanceConverterSelects();
  enhanceConverterInputs();
  
  // Add Unit Converter button to the header (if it doesn't already exist)
  if (!document.getElementById('unit-converter-button')) {
    addUnitConverterButton();
  } else {
    // Add event listener to existing button
    document.getElementById('unit-converter-button').addEventListener('click', openUnitConverterModal);
  }
}

/**
 * Creates and appends the Unit Converter button to the header navigation
 */
function addUnitConverterButton() {
  const navLeft = document.querySelector('.nav-left');
  
  if (navLeft) {
    const unitConverterLi = document.createElement('li');
    const unitConverterButton = document.createElement('button');
    
    unitConverterButton.id = 'unit-converter-button';
    unitConverterButton.className = 'unit-converter-button';
    unitConverterButton.textContent = 'Unit Converter';
    unitConverterButton.setAttribute('aria-label', 'Open Unit Converter');
    
    unitConverterButton.addEventListener('click', openUnitConverterModal);
    
    unitConverterLi.appendChild(unitConverterButton);
    navLeft.appendChild(unitConverterLi);
    
    console.log('Unit Converter: Button added to header');
  } else {
    console.error('Unit Converter: Could not find .nav-left element');
  }
}

// Custom dropdowns matching nuclide color map style
const converterDropdownRegistry = [];

function enhanceConverterSelects() {
  const modal = document.getElementById('unit-converter-modal');
  if (!modal) return;
  const selects = modal.querySelectorAll('select.converter-select:not(.converter-select-hidden)');
  selects.forEach((select) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'converter-dropdown';

    select.classList.add('converter-select-hidden');
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'converter-dropdown-toggle';

    const label = document.createElement('span');
    label.textContent = select.options[select.selectedIndex]?.textContent || '';

    const chevron = document.createElement('span');
    chevron.className = 'converter-chevron';
    chevron.innerHTML = `
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
        <path d="M3.5 6.5 8 11l4.5-4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    toggle.appendChild(label);
    toggle.appendChild(chevron);

    const options = document.createElement('div');
    options.className = 'converter-dropdown-options';

    Array.from(select.options).forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'converter-dropdown-option';
      if (opt.selected) btn.classList.add('active');
      btn.dataset.value = opt.value;
      btn.textContent = opt.textContent;
      btn.addEventListener('click', () => {
        select.value = opt.value;
        label.textContent = opt.textContent;
        options.querySelectorAll('.converter-dropdown-option').forEach(o => o.classList.remove('active'));
        btn.classList.add('active');
        closeAllConverterDropdowns();
        // Trigger change for existing logic
        const evt = new Event('change', { bubbles: true });
        select.dispatchEvent(evt);
      });
      options.appendChild(btn);
    });

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = wrapper.classList.contains('open');
      closeAllConverterDropdowns();
      if (!isOpen) {
        // Position the options relative to viewport to escape modal scroll
        const rect = toggle.getBoundingClientRect();
        options.style.minWidth = `${rect.width}px`;
        options.style.left = `${rect.left}px`;
        options.style.top = `${rect.bottom + 6}px`;
        wrapper.classList.add('open');
      }
    });

    // Keep label in sync if changed programmatically
    select.addEventListener('change', () => {
      label.textContent = select.options[select.selectedIndex]?.textContent || '';
      options.querySelectorAll('.converter-dropdown-option').forEach(o => {
        o.classList.toggle('active', o.dataset.value === select.value);
      });
    });

    const parent = select.parentNode;
    parent.insertBefore(wrapper, select);
    wrapper.appendChild(toggle);
    wrapper.appendChild(options);
    wrapper.appendChild(select);

    converterDropdownRegistry.push(wrapper);
  });

  document.addEventListener('click', handleConverterDropdownOutside);
  document.addEventListener('touchstart', handleConverterDropdownOutside);
}

function closeAllConverterDropdowns() {
  converterDropdownRegistry.forEach(drop => drop.classList.remove('open'));
}

function handleConverterDropdownOutside(e) {
  if (!e.target.closest('.converter-dropdown')) {
    closeAllConverterDropdowns();
  }
}

// Integrated steppers on left inputs only
function enhanceConverterInputs() {
  const modal = document.getElementById('unit-converter-modal');
  if (!modal) return;
  const inputs = modal.querySelectorAll('.converter-input');
  inputs.forEach((input) => {
    if (!input.id.endsWith('-from')) return; // only left inputs
    if (input.dataset.steppersAttached) return;
    input.dataset.steppersAttached = '1';

    const wrapper = document.createElement('div');
    wrapper.className = 'converter-input-wrapper';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const panel = document.createElement('div');
    panel.className = 'converter-stepper-panel';

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'converter-stepper-btn';
    upBtn.innerHTML = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 9.5 8 5.5l4 4" /></svg>`;

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'converter-stepper-btn';
    downBtn.innerHTML = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 6.5 8 10.5l4-4" /></svg>`;

    const adjust = (dir) => {
      const step = parseFloat(input.step) || 1;
      const min = input.min !== '' ? parseFloat(input.min) : -Infinity;
      const max = input.max !== '' ? parseFloat(input.max) : Infinity;
      let value = parseFloat(input.value);
      if (Number.isNaN(value)) value = 0;
      value += dir * step;
      value = Math.max(min, Math.min(max, value));
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    upBtn.addEventListener('click', () => adjust(1));
    downBtn.addEventListener('click', () => adjust(-1));

    panel.appendChild(upBtn);
    panel.appendChild(downBtn);
    wrapper.appendChild(panel);
  });
}

/**
 * Creates the unit converter modal HTML structure and appends it to the body
 */
function createUnitConverterModal() {
  const unitConverterModal = document.createElement('div');
  unitConverterModal.id = 'unit-converter-modal';
  unitConverterModal.className = 'unit-converter-modal';
  unitConverterModal.setAttribute('role', 'dialog');
  unitConverterModal.setAttribute('aria-labelledby', 'unit-converter-title');
  unitConverterModal.setAttribute('aria-modal', 'true');
  
  unitConverterModal.innerHTML = `
    <div class="unit-converter-content">
      <div class="unit-converter-header">
        <h2 id="unit-converter-title" class="unit-converter-title">Unit Converter</h2>
        <span class="unit-converter-close" id="unit-converter-close" aria-label="Close unit converter">&times;</span>
      </div>
      <div class="unit-converter-body">
        <!-- Tabs for different unit types -->
        <div class="converter-tabs" id="converter-tabs">
          <button class="converter-tab-btn active" data-tab="length">Length</button>
          <button class="converter-tab-btn" data-tab="area">Area</button>
          <button class="converter-tab-btn" data-tab="mass">Mass</button>
          <button class="converter-tab-btn" data-tab="volume">Volume</button>
          <button class="converter-tab-btn" data-tab="temperature">Temperature</button>
          <button class="converter-tab-btn" data-tab="time">Time</button>
          <button class="converter-tab-btn" data-tab="speed">Speed</button>
          <button class="converter-tab-btn" data-tab="pressure">Pressure</button>
          <button class="converter-tab-btn" data-tab="energy">Energy</button>
        </div>
        
        <!-- Converter pages for each unit type -->
        <div class="converter-pages" id="converter-pages">
          <!-- Length Converter -->
          <div class="converter-page active" id="length-page">
            <div class="converter-controls">
              <div class="converter-input-group">
                <div class="converter-input-container">
                  <label for="length-input-from">From:</label>
                  <div class="converter-input-with-select">
                    <input type="number" id="length-input-from" class="converter-input" value="1" aria-label="From value">
                    <select id="length-unit-from" class="converter-select" aria-label="From unit">
                      <option value="meters">Meters</option>
                      <option value="kilometers">Kilometers</option>
                      <option value="centimeters">Centimeters</option>
                      <option value="millimeters">Millimeters</option>
                      <option value="micrometers">Micrometers</option>
                      <option value="nanometers">Nanometers</option>
                      <option value="astronomical_unit">Astronomical Unit</option>
                      <option value="light_year">Light Year</option>
                      <option value="happy_carbon_atom">Happy Carbon Atom</option>
                      <option value="miles">Miles</option>
                      <option value="yards">Yards</option>
                      <option value="feet">Feet</option>
                      <option value="inches">Inches</option>
                      <option value="nautical_miles">Nautical Miles</option>
                    </select>
                  </div>
                </div>
                
                <button class="swap-units-btn" id="length-swap-btn" aria-label="Swap units">
                  <svg viewBox="0 0 24 24">
                    <path d="M16,17.01V10h-2v7.01h-3L15,21l4-3.99H16z M9,3L5,6.99h3V14h2V6.99h3L9,3z"/>
                  </svg>
                </button>
                
                <div class="converter-input-container">
                  <label for="length-input-to">To:</label>
                  <div class="converter-input-with-select">
                    <input type="number" id="length-input-to" class="converter-input" disabled aria-label="To value">
                    <select id="length-unit-to" class="converter-select" aria-label="To unit">
                      <option value="meters">Meters</option>
                      <option value="kilometers">Kilometers</option>
                      <option value="centimeters">Centimeters</option>
                      <option value="millimeters">Millimeters</option>
                      <option value="micrometers">Micrometers</option>
                      <option value="nanometers">Nanometers</option>
                      <option value="astronomical_unit">Astronomical Unit</option>
                      <option value="light_year">Light Year</option>
                      <option value="happy_carbon_atom">Happy Carbon Atom</option>
                      <option value="miles" selected>Miles</option>
                      <option value="yards">Yards</option>
                      <option value="feet">Feet</option>
                      <option value="inches">Inches</option>
                      <option value="nautical_miles">Nautical Miles</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="common-units-container">
                <div class="common-units-title">Common Conversions</div>
                <div class="common-units-grid" id="length-common-units">
                  <!-- Common conversions will be populated here -->
                </div>
              </div>
            </div>
          </div>
          
          <!-- Area Converter -->
          <div class="converter-page" id="area-page">
            <div class="converter-controls">
              <div class="converter-input-group">
                <div class="converter-input-container">
                  <label for="area-input-from">From:</label>
                  <div class="converter-input-with-select">
                    <input type="number" id="area-input-from" class="converter-input" value="1" aria-label="From value">
                    <select id="area-unit-from" class="converter-select" aria-label="From unit">
                      <option value="square_meters">Square Meters</option>
                      <option value="square_kilometers">Square Kilometers</option>
                      <option value="square_miles">Square Miles</option>
                      <option value="square_yards">Square Yards</option>
                      <option value="square_feet">Square Feet</option>
                      <option value="square_inches">Square Inches</option>
                      <option value="hectares">Hectares</option>
                      <option value="acres">Acres</option>
                      <option value="earth">Earth</option>
                    </select>
                  </div>
                </div>
                
                <button class="swap-units-btn" id="area-swap-btn" aria-label="Swap units">
                  <svg viewBox="0 0 24 24">
                    <path d="M16,17.01V10h-2v7.01h-3L15,21l4-3.99H16z M9,3L5,6.99h3V14h2V6.99h3L9,3z"/>
                  </svg>
                </button>
                
                <div class="converter-input-container">
                  <label for="area-input-to">To:</label>
                  <div class="converter-input-with-select">
                    <input type="number" id="area-input-to" class="converter-input" disabled aria-label="To value">
                    <select id="area-unit-to" class="converter-select" aria-label="To unit">
                      <option value="square_meters">Square Meters</option>
                      <option value="square_kilometers">Square Kilometers</option>
                      <option value="square_miles">Square Miles</option>
                      <option value="square_yards">Square Yards</option>
                      <option value="square_feet" selected>Square Feet</option>
                      <option value="square_inches">Square Inches</option>
                      <option value="hectares">Hectares</option>
                      <option value="acres">Acres</option>
                      <option value="earth">Earth</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="common-units-container">
                <div class="common-units-title">Common Conversions</div>
                <div class="common-units-grid" id="area-common-units">
                  <!-- Common conversions will be populated here -->
                </div>
              </div>
            </div>
          </div>
          
          <!-- Mass Converter -->
          <div class="converter-page" id="mass-page">
            <div class="converter-controls">
              <div class="converter-input-group">
                <div class="converter-input-container">
                  <label for="mass-input-from">From:</label>
                  <div class="converter-input-with-select">
                    <input type="number" id="mass-input-from" class="converter-input" value="1" aria-label="From value">
                    <select id="mass-unit-from" class="converter-select" aria-label="From unit">
                      <option value="kilograms">Kilograms</option>
                      <option value="grams">Grams</option>
                      <option value="milligrams">Milligrams</option>
                      <option value="metric_tons">Metric Tons</option>
                      <option value="pounds">Pounds</option>
                      <option value="ounces">Ounces</option>
                      <option value="stones">Stones</option>
                      <option value="short_tons">Short Tons</option>
                      <option value="long_tons">Long Tons</option>
                      <option value="happy_carbon_atom">Happy Carbon Atom</option>
                      <option value="earth">Earth</option>
                      <option value="sun">Sun</option>
                      <option value="sagittarius_black_hole">Sagittarius A* Black Hole</option>
                    </select>
                  </div>
                </div>
                
                <button class="swap-units-btn" id="mass-swap-btn" aria-label="Swap units">
                  <svg viewBox="0 0 24 24">
                    <path d="M16,17.01V10h-2v7.01h-3L15,21l4-3.99H16z M9,3L5,6.99h3V14h2V6.99h3L9,3z"/>
                  </svg>
                </button>
                
                <div class="converter-input-container">
                  <label for="mass-input-to">To:</label>
                  <div class="converter-input-with-select">
                    <input type="number" id="mass-input-to" class="converter-input" disabled aria-label="To value">
                    <select id="mass-unit-to" class="converter-select" aria-label="To unit">
                      <option value="kilograms">Kilograms</option>
                      <option value="grams">Grams</option>
                      <option value="milligrams">Milligrams</option>
                      <option value="metric_tons">Metric Tons</option>
                      <option value="pounds" selected>Pounds</option>
                      <option value="ounces">Ounces</option>
                      <option value="stones">Stones</option>
                      <option value="short_tons">Short Tons</option>
                      <option value="long_tons">Long Tons</option>
                      <option value="happy_carbon_atom">Happy Carbon Atom</option>
                      <option value="earth">Earth</option>
                      <option value="sun">Sun</option>
                      <option value="sagittarius_black_hole">Sagittarius A* Black Hole</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="common-units-container">
                <div class="common-units-title">Common Conversions</div>
                <div class="common-units-grid" id="mass-common-units">
                  <!-- Common conversions will be populated here -->
                </div>
              </div>
            </div>
          </div>
          
          <!-- Volume Converter -->
          <div class="converter-page" id="volume-page">
            <div class="converter-controls">
              <div class="converter-input-group">
                <div class="converter-input-container">
                  <label for="volume-input-from">From:</label>
                  <div class="converter-input-with-select">
                    <input type="number" id="volume-input-from" class="converter-input" value="1" aria-label="From value">
                    <select id="volume-unit-from" class="converter-select" aria-label="From unit">
                      <option value="liters">Liters</option>
                      <option value="milliliters">Milliliters</option>
                      <option value="cubic_meters">Cubic Meters</option>
                      <option value="cubic_feet">Cubic Feet</option>
                      <option value="cubic_inches">Cubic Inches</option>
                      <option value="us_gallons">US Gallons</option>
                      <option value="us_quarts">US Quarts</option>
                      <option value="us_pints">US Pints</option>
                      <option value="us_cups">US Cups</option>
                      <option value="us_fluid_ounces">US Fluid Ounces</option>
                      <option value="us_tablespoons">US Tablespoons</option>
                      <option value="us_teaspoons">US Teaspoons</option>
                      <option value="imperial_gallons">Imperial Gallons</option>
                      <option value="imperial_quarts">Imperial Quarts</option>
                      <option value="imperial_pints">Imperial Pints</option>
                      <option value="imperial_fluid_ounces">Imperial Fluid Ounces</option>
                      <option value="happy_carbon_atom">Happy Carbon Atom</option>
                      <option value="earth">Earth</option>
                      <option value="sun">Sun</option>
                      <option value="sagittarius_black_hole">Sagittarius A* Black Hole</option>
                    </select>
                  </div>
                </div>
                
                <button class="swap-units-btn" id="volume-swap-btn" aria-label="Swap units">
                  <svg viewBox="0 0 24 24">
                    <path d="M16,17.01V10h-2v7.01h-3L15,21l4-3.99H16z M9,3L5,6.99h3V14h2V6.99h3L9,3z"/>
                  </svg>
                </button>
                
                <div class="converter-input-container">
                  <label for="volume-input-to">To:</label>
                  <div class="converter-input-with-select">
                    <input type="number" id="volume-input-to" class="converter-input" disabled aria-label="To value">
                    <select id="volume-unit-to" class="converter-select" aria-label="To unit">
                      <option value="liters">Liters</option>
                      <option value="milliliters">Milliliters</option>
                      <option value="cubic_meters">Cubic Meters</option>
                      <option value="cubic_feet">Cubic Feet</option>
                      <option value="cubic_inches">Cubic Inches</option>
                      <option value="us_gallons" selected>US Gallons</option>
                      <option value="us_quarts">US Quarts</option>
                      <option value="us_pints">US Pints</option>
                      <option value="us_cups">US Cups</option>
                      <option value="us_fluid_ounces">US Fluid Ounces</option>
                      <option value="us_tablespoons">US Tablespoons</option>
                      <option value="us_teaspoons">US Teaspoons</option>
                      <option value="imperial_gallons">Imperial Gallons</option>
                      <option value="imperial_quarts">Imperial Quarts</option>
                      <option value="imperial_pints">Imperial Pints</option>
                      <option value="imperial_fluid_ounces">Imperial Fluid Ounces</option>
                      <option value="happy_carbon_atom">Happy Carbon Atom</option>
                      <option value="earth">Earth</option>
                      <option value="sun">Sun</option>
                      <option value="sagittarius_black_hole">Sagittarius A* Black Hole</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="common-units-container">
                <div class="common-units-title">Common Conversions</div>
                <div class="common-units-grid" id="volume-common-units">
                  <!-- Common conversions will be populated here -->
                </div>
              </div>
            </div>
          </div>
          
          <!-- Temperature Converter -->
          <div class="converter-page" id="temperature-page">
            <div class="converter-controls">
              <div class="converter-input-group">
                <div class="converter-input-container">
                  <label for="temperature-input-from">From:</label>
                  <div class="converter-input-with-select">
                    <input type="number" id="temperature-input-from" class="converter-input" value="0" aria-label="From value">
                    <select id="temperature-unit-from" class="converter-select" aria-label="From unit">
                      <option value="celsius">Celsius</option>
                      <option value="fahrenheit">Fahrenheit</option>
                      <option value="kelvin">Kelvin</option>
                    </select>
                  </div>
                </div>
                
                <button class="swap-units-btn" id="temperature-swap-btn" aria-label="Swap units">
                  <svg viewBox="0 0 24 24">
                    <path d="M16,17.01V10h-2v7.01h-3L15,21l4-3.99H16z M9,3L5,6.99h3V14h2V6.99h3L9,3z"/>
                  </svg>
                </button>
                
                <div class="converter-input-container">
                  <label for="temperature-input-to">To:</label>
                  <div class="converter-input-with-select">
                    <input type="number" id="temperature-input-to" class="converter-input" disabled aria-label="To value">
                    <select id="temperature-unit-to" class="converter-select" aria-label="To unit">
                      <option value="celsius">Celsius</option>
                      <option value="fahrenheit" selected>Fahrenheit</option>
                      <option value="kelvin">Kelvin</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="common-units-container">
                <div class="common-units-title">Common Conversions</div>
                <div class="common-units-grid" id="temperature-common-units">
                  <!-- Common conversions will be populated here -->
                </div>
              </div>
            </div>
          </div>
          
          <!-- Time Converter -->
          <div class="converter-page" id="time-page">
            <div class="converter-controls">
              <div class="converter-input-group">
                <div class="converter-input-container">
                  <label for="time-input-from">From:</label>
                  <div class="converter-input-with-select">
                    <input type="number" id="time-input-from" class="converter-input" value="1" aria-label="From value">
                    <select id="time-unit-from" class="converter-select" aria-label="From unit">
                      <option value="seconds">Seconds</option>
                      <option value="milliseconds">Milliseconds</option>
                      <option value="microseconds">Microseconds</option>
                      <option value="nanoseconds">Nanoseconds</option>
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                      <option value="age_of_universe">Age of The Universe</option>
                    </select>
                  </div>
                </div>
                
                <button class="swap-units-btn" id="time-swap-btn" aria-label="Swap units">
                  <svg viewBox="0 0 24 24">
                    <path d="M16,17.01V10h-2v7.01h-3L15,21l4-3.99H16z M9,3L5,6.99h3V14h2V6.99h3L9,3z"/>
                  </svg>
                </button>
                
                <div class="converter-input-container">
                  <label for="time-input-to">To:</label>
                  <div class="converter-input-with-select">
                    <input type="number" id="time-input-to" class="converter-input" disabled aria-label="To value">
                    <select id="time-unit-to" class="converter-select" aria-label="To unit">
                      <option value="seconds">Seconds</option>
                      <option value="milliseconds">Milliseconds</option>
                      <option value="microseconds">Microseconds</option>
                      <option value="nanoseconds">Nanoseconds</option>
                      <option value="minutes">Minutes</option>
                      <option value="hours" selected>Hours</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                      <option value="age_of_universe">Age of The Universe</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="common-units-container">
                <div class="common-units-title">Common Conversions</div>
                <div class="common-units-grid" id="time-common-units">
                  <!-- Common conversions will be populated here -->
                </div>
              </div>
            </div>
          </div>
          
          <!-- Speed Converter -->
          <div class="converter-page" id="speed-page">
            <div class="converter-controls">
              <div class="converter-input-group">
                <div class="converter-input-container">
                  <label for="speed-input-from">From:</label>
                  <div class="converter-input-with-select">
                    <input type="number" id="speed-input-from" class="converter-input" value="1" aria-label="From value">
                    <select id="speed-unit-from" class="converter-select" aria-label="From unit">
                      <option value="meters_per_second">Meters per Second</option>
                      <option value="kilometers_per_hour">Kilometers per Hour</option>
                      <option value="miles_per_hour">Miles per Hour</option>
                      <option value="feet_per_second">Feet per Second</option>
                      <option value="knots">Knots</option>
                      <option value="light_speed">Light Speed</option>
                    </select>
                  </div>
                </div>
                
                <button class="swap-units-btn" id="speed-swap-btn" aria-label="Swap units">
                  <svg viewBox="0 0 24 24">
                    <path d="M16,17.01V10h-2v7.01h-3L15,21l4-3.99H16z M9,3L5,6.99h3V14h2V6.99h3L9,3z"/>
                  </svg>
                </button>
                
                <div class="converter-input-container">
                  <label for="speed-input-to">To:</label>
                  <div class="converter-input-with-select">
                    <input type="number" id="speed-input-to" class="converter-input" disabled aria-label="To value">
                    <select id="speed-unit-to" class="converter-select" aria-label="To unit">
                      <option value="meters_per_second">Meters per Second</option>
                      <option value="kilometers_per_hour">Kilometers per Hour</option>
                      <option value="miles_per_hour" selected>Miles per Hour</option>
                      <option value="feet_per_second">Feet per Second</option>
                      <option value="knots">Knots</option>
                      <option value="light_speed">Light Speed</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="common-units-container">
                <div class="common-units-title">Common Conversions</div>
                <div class="common-units-grid" id="speed-common-units">
                  <!-- Common conversions will be populated here -->
                </div>
              </div>
            </div>
          </div>
          
          <!-- Pressure Converter -->
          <div class="converter-page" id="pressure-page">
            <div class="converter-controls">
              <div class="converter-input-group">
                <div class="converter-input-container">
                  <label for="pressure-input-from">From:</label>
                  <div class="converter-input-with-select">
                    <input type="number" id="pressure-input-from" class="converter-input" value="1" aria-label="From value">
                    <select id="pressure-unit-from" class="converter-select" aria-label="From unit">
                      <option value="pascals">Pascals</option>
                      <option value="kilopascals">Kilopascals</option>
                      <option value="megapascals">Megapascals</option>
                      <option value="bars">Bars</option>
                      <option value="psi">PSI</option>
                      <option value="atmospheres">Atmospheres</option>
                      <option value="torr">Torr</option>
                      <option value="millimeters_mercury">Millimeters of Mercury</option>
                      <option value="surface_earth">Surface of Earth</option>
                      <option value="surface_venus">Surface of Venus</option>
                      <option value="surface_mars">Surface of Mars</option>
                    </select>
                  </div>
                </div>
                
                <button class="swap-units-btn" id="pressure-swap-btn" aria-label="Swap units">
                  <svg viewBox="0 0 24 24">
                    <path d="M16,17.01V10h-2v7.01h-3L15,21l4-3.99H16z M9,3L5,6.99h3V14h2V6.99h3L9,3z"/>
                  </svg>
                </button>
                
                <div class="converter-input-container">
                  <label for="pressure-input-to">To:</label>
                  <div class="converter-input-with-select">
                    <input type="number" id="pressure-input-to" class="converter-input" disabled aria-label="To value">
                    <select id="pressure-unit-to" class="converter-select" aria-label="To unit">
                      <option value="pascals">Pascals</option>
                      <option value="kilopascals">Kilopascals</option>
                      <option value="megapascals">Megapascals</option>
                      <option value="bars">Bars</option>
                      <option value="psi" selected>PSI</option>
                      <option value="atmospheres">Atmospheres</option>
                      <option value="torr">Torr</option>
                      <option value="millimeters_mercury">Millimeters of Mercury</option>
                      <option value="surface_earth">Surface of Earth</option>
                      <option value="surface_venus">Surface of Venus</option>
                      <option value="surface_mars">Surface of Mars</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="common-units-container">
                <div class="common-units-title">Common Conversions</div>
                <div class="common-units-grid" id="pressure-common-units">
                  <!-- Common conversions will be populated here -->
                </div>
              </div>
            </div>
          </div>
          
          <!-- Energy Converter -->
          <div class="converter-page" id="energy-page">
            <div class="converter-controls">
              <div class="converter-input-group">
                <div class="converter-input-container">
                  <label for="energy-input-from">From:</label>
                  <div class="converter-input-with-select">
                    <input type="number" id="energy-input-from" class="converter-input" value="1" aria-label="From value">
                    <select id="energy-unit-from" class="converter-select" aria-label="From unit">
                      <option value="joules">Joules</option>
                      <option value="kilojoules">Kilojoules</option>
                      <option value="calories">Calories</option>
                      <option value="kilocalories">Kilocalories</option>
                      <option value="watt_hours">Watt Hours</option>
                      <option value="kilowatt_hours">Kilowatt Hours</option>
                      <option value="electron_volts">Electron Volts</option>
                      <option value="british_thermal_units">BTU</option>
                      <option value="foot_pounds">Foot Pounds</option>
                      <option value="type_a_supernova">Type A Supernova</option>
                      <option value="observable_universe">The Observable Universe</option>
                    </select>
                  </div>
                </div>
                
                <button class="swap-units-btn" id="energy-swap-btn" aria-label="Swap units">
                  <svg viewBox="0 0 24 24">
                    <path d="M16,17.01V10h-2v7.01h-3L15,21l4-3.99H16z M9,3L5,6.99h3V14h2V6.99h3L9,3z"/>
                  </svg>
                </button>
                
                <div class="converter-input-container">
                  <label for="energy-input-to">To:</label>
                  <div class="converter-input-with-select">
                    <input type="number" id="energy-input-to" class="converter-input" disabled aria-label="To value">
                    <select id="energy-unit-to" class="converter-select" aria-label="To unit">
                      <option value="joules">Joules</option>
                      <option value="kilojoules">Kilojoules</option>
                      <option value="calories">Calories</option>
                      <option value="kilocalories" selected>Kilocalories</option>
                      <option value="watt_hours">Watt Hours</option>
                      <option value="kilowatt_hours">Kilowatt Hours</option>
                      <option value="electron_volts">Electron Volts</option>
                      <option value="british_thermal_units">BTU</option>
                      <option value="foot_pounds">Foot Pounds</option>
                      <option value="type_a_supernova">Type A Supernova</option>
                      <option value="observable_universe">The Observable Universe</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="common-units-container">
                <div class="common-units-title">Common Conversions</div>
                <div class="common-units-grid" id="energy-common-units">
                  <!-- Common conversions will be populated here -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(unitConverterModal);
  
  // Add event listeners to the modal
  document.getElementById('unit-converter-close').addEventListener('click', closeUnitConverterModal);
  
  // Initialize the tabs
  initTabs();
  
  console.log('Unit Converter: Modal created');
}

/**
 * Opens the unit converter modal
 */
function openUnitConverterModal() {
  console.log('Unit Converter: Opening modal');
  
  const modal = document.getElementById('unit-converter-modal');
  const unitConverterButton = document.getElementById('unit-converter-button');
  
  if (modal && unitConverterButton) {
    // Remove any closing animation class first
    modal.classList.remove('closing');
    
    // Get button position relative to the viewport
    const buttonRect = unitConverterButton.getBoundingClientRect();
    const buttonCenterX = buttonRect.left + buttonRect.width / 2;
    const buttonCenterY = buttonRect.top + buttonRect.height / 2;
    
    // Set transform origin for the modal based on button position
    modal.style.transformOrigin = `${buttonCenterX}px ${buttonCenterY}px`;
    
    // Find the unit converter content and set its transform origin
    const unitConverterContent = modal.querySelector('.unit-converter-content');
    if (unitConverterContent) {
      // Calculate the position relative to the content
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Convert button position to percentage of viewport
      const originX = (buttonCenterX / viewportWidth) * 100;
      const originY = (buttonCenterY / viewportHeight) * 100;
      
      unitConverterContent.style.transformOrigin = `${originX}% ${originY}%`;
    }
    
    // Add visible class to display the modal
    modal.classList.add('visible');
    // Lock content overflow until animation ends to prevent scroll flash
    if (unitConverterContent) {
      unitConverterContent.classList.add('animating');
      setTimeout(() => unitConverterContent.classList.remove('animating'), 400);
    }
    
    // Add event listener to close the modal when clicking outside
    modal.addEventListener('click', function(event) {
      // Check if the click was directly on the modal background (not on its children)
      if (event.target === modal) {
        closeUnitConverterModal();
      }
    });
    
    // Focus first input for accessibility
    setTimeout(function() {
      const activeTabId = document.querySelector('.converter-tab-btn.active').dataset.tab;
      if (activeTabId) {
        const inputId = `${activeTabId}-input-from`;
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
          inputElement.focus();
        }
      }
    }, 300);
    
    // Initialize unit converters
    initUnitConverters();
    
    // Add body class to prevent background scrolling
    document.body.classList.add('unit-converter-modal-open');
    
    // Add escape key listener
    document.addEventListener('keydown', handleEscapeKey);
  }
}

/**
 * Closes the unit converter modal
 */
function closeUnitConverterModal() {
  console.log('Unit Converter: Closing modal');
  
  const modal = document.getElementById('unit-converter-modal');
  const unitConverterButton = document.getElementById('unit-converter-button');
  
  if (modal) {
    // Add closing class for animation
    modal.classList.add('closing');
    
    // Get button position for closing animation
    if (unitConverterButton) {
      const buttonRect = unitConverterButton.getBoundingClientRect();
      const buttonCenterX = buttonRect.left + buttonRect.width / 2;
      const buttonCenterY = buttonRect.top + buttonRect.height / 2;
      
      // Set transform origin for the modal based on button position
      modal.style.transformOrigin = `${buttonCenterX}px ${buttonCenterY}px`;
      
      // Find the unit converter content and set its transform origin
      const unitConverterContent = modal.querySelector('.unit-converter-content');
      if (unitConverterContent) {
        // Calculate the position relative to the content
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Convert button position to percentage of viewport
        const originX = (buttonCenterX / viewportWidth) * 100;
        const originY = (buttonCenterY / viewportHeight) * 100;
        
        unitConverterContent.style.transformOrigin = `${originX}% ${originY}%`;
      }
    }
    
    // Wait for animation to complete before fully hiding
    setTimeout(function() {
      modal.classList.remove('visible');
      modal.classList.remove('closing');
      
      // Remove body class
      document.body.classList.remove('unit-converter-modal-open');
    }, 300);
    
    // Remove escape key listener
    document.removeEventListener('keydown', handleEscapeKey);
  }
}

/**
 * Handle escape key press to close the modal
 */
function handleEscapeKey(e) {
  if (e.key === 'Escape') {
    closeUnitConverterModal();
  }
}

/**
 * Initialize tabs for the unit converter
 */
function initTabs() {
  const tabButtons = document.querySelectorAll('.converter-tab-btn');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked tab
      this.classList.add('active');
      
      // Hide all pages
      const pages = document.querySelectorAll('.converter-page');
      pages.forEach(page => page.classList.remove('active'));
      
      // Show selected page
      const tabId = this.getAttribute('data-tab');
      const selectedPage = document.getElementById(`${tabId}-page`);
      if (selectedPage) {
        selectedPage.classList.add('active');
        
        // Focus the input field
        const inputField = document.getElementById(`${tabId}-input-from`);
        if (inputField) {
          inputField.focus();
        }
        
        // Update conversions
        convertUnit(tabId);
      }
    });
  });
  
  // Add swap button event listeners
  const swapButtons = document.querySelectorAll('.swap-units-btn');
  swapButtons.forEach(button => {
    button.addEventListener('click', function() {
      const type = this.id.split('-')[0]; // Extract type from button id
      swapUnits(type);
    });
  });
}

/**
 * Swap the from and to units for a specific converter
 */
function swapUnits(type) {
  const fromUnitSelect = document.getElementById(`${type}-unit-from`);
  const toUnitSelect = document.getElementById(`${type}-unit-to`);
  
  if (fromUnitSelect && toUnitSelect) {
    const fromValue = fromUnitSelect.value;
    const fromIndex = fromUnitSelect.selectedIndex;
    const toValue = toUnitSelect.value;
    const toIndex = toUnitSelect.selectedIndex;
    
    fromUnitSelect.value = toValue;
    fromUnitSelect.selectedIndex = toIndex;
    toUnitSelect.value = fromValue;
    toUnitSelect.selectedIndex = fromIndex;
    
    // Update the conversion
    convertUnit(type);
  }
}

/**
 * Initialize the unit converters
 */
function initUnitConverters() {
  // Initialize all converter types
  const converterTypes = ['length', 'area', 'mass', 'volume', 'temperature', 'time', 'speed', 'pressure', 'energy'];
  
  converterTypes.forEach(type => {
    // Add input event listeners
    const fromInput = document.getElementById(`${type}-input-from`);
    const fromUnit = document.getElementById(`${type}-unit-from`);
    const toUnit = document.getElementById(`${type}-unit-to`);
    
    if (fromInput && fromUnit && toUnit) {
      fromInput.addEventListener('input', () => convertUnit(type));
      fromUnit.addEventListener('change', () => convertUnit(type));
      toUnit.addEventListener('change', () => convertUnit(type));
    }
    
    // Update initial conversion
    convertUnit(type);
    
    // Generate common units
    updateCommonUnits(type);
  });
}

/**
 * Convert units for a specific type
 */
function convertUnit(type) {
  const fromInput = document.getElementById(`${type}-input-from`);
  const fromUnit = document.getElementById(`${type}-unit-from`);
  const toInput = document.getElementById(`${type}-input-to`);
  const toUnit = document.getElementById(`${type}-unit-to`);
  
  if (!fromInput || !fromUnit || !toInput || !toUnit) {
    console.error(`Unit Converter: Missing elements for ${type} converter`);
    return;
  }
  
  const fromValue = parseFloat(fromInput.value);
  if (isNaN(fromValue)) {
    toInput.value = '';
    return;
  }
  
  const fromUnitValue = fromUnit.value;
  const toUnitValue = toUnit.value;
  
  // Convert to standard unit first, then to target unit
  let result;
  
  switch (type) {
    case 'length':
      result = convertLength(fromValue, fromUnitValue, toUnitValue);
      break;
    case 'area':
      result = convertArea(fromValue, fromUnitValue, toUnitValue);
      break;
    case 'mass':
      result = convertMass(fromValue, fromUnitValue, toUnitValue);
      break;
    case 'volume':
      result = convertVolume(fromValue, fromUnitValue, toUnitValue);
      break;
    case 'temperature':
      result = convertTemperature(fromValue, fromUnitValue, toUnitValue);
      break;
    case 'time':
      result = convertTime(fromValue, fromUnitValue, toUnitValue);
      break;
    case 'speed':
      result = convertSpeed(fromValue, fromUnitValue, toUnitValue);
      break;
    case 'pressure':
      result = convertPressure(fromValue, fromUnitValue, toUnitValue);
      break;
    case 'energy':
      result = convertEnergy(fromValue, fromUnitValue, toUnitValue);
      break;
    default:
      console.error(`Unit Converter: Unknown converter type ${type}`);
      return;
  }
  
  // Format the result based on magnitude
  let formattedResult;
  
  // Use scientific notation for very large or very small numbers
  if (Math.abs(result) >= 1e15 || (Math.abs(result) < 0.0001 && result !== 0)) {
    formattedResult = result.toExponential(10); // Increased precision
  } else if (Math.abs(result) < 0.01) {
    formattedResult = result.toFixed(10); // Increased precision
  } else if (Math.abs(result) < 1) {
    formattedResult = result.toFixed(10); // Increased precision
  } else {
    // For larger numbers, show more digits (up to 12)
    const decimalPlaces = Math.min(10, Math.max(0, 12 - Math.floor(Math.log10(Math.abs(result)))));
    formattedResult = result.toFixed(decimalPlaces);
  }
  
  // Remove trailing zeros
  formattedResult = formattedResult.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  
  // Update the result field
  toInput.value = formattedResult;
  
  // Add title attribute for easier viewing of very large numbers
  if (formattedResult.includes('e')) {
    toInput.title = result.toString();
  } else {
    toInput.removeAttribute('title');
  }
  
  // Update common units
  updateCommonUnits(type);
}

/**
 * Convert length units
 */
function convertLength(value, fromUnit, toUnit) {
  // Conversion rates to meters (standard unit)
  const toStandard = {
    meters: 1,
    kilometers: 1000,
    centimeters: 0.01,
    millimeters: 0.001,
    micrometers: 0.000001,
    nanometers: 0.000000001,
    astronomical_unit: 149597870700,
    light_year: 9460730472580800,
    happy_carbon_atom: 0.00000000007, // 70 picometers
    miles: 1609.344,
    yards: 0.9144,
    feet: 0.3048,
    inches: 0.0254,
    nautical_miles: 1852
  };
  
  // Convert from input unit to meters
  const valueInMeters = value * toStandard[fromUnit];
  
  // Convert from meters to output unit
  return valueInMeters / toStandard[toUnit];
}

/**
 * Convert area units
 */
function convertArea(value, fromUnit, toUnit) {
  // Conversion rates to square meters (standard unit)
  const toStandard = {
    square_meters: 1,
    square_kilometers: 1000000,
    square_miles: 2589988.11,
    square_yards: 0.83612736,
    square_feet: 0.09290304,
    square_inches: 0.00064516,
    hectares: 10000,
    acres: 4046.8564224,
    earth: 5.1e14         // Area of Earth in square meters
  };
  
  // Convert from input unit to square meters
  const valueInSquareMeters = value * toStandard[fromUnit];
  
  // Convert from square meters to output unit
  return valueInSquareMeters / toStandard[toUnit];
}

/**
 * Convert mass units
 */
function convertMass(value, fromUnit, toUnit) {
  // Conversion rates to kilograms (standard unit)
  const toStandard = {
    kilograms: 1,
    grams: 0.001,
    milligrams: 0.000001,
    metric_tons: 1000,
    pounds: 0.45359237,
    ounces: 0.028349523125,
    stones: 6.35029318,
    short_tons: 907.18474,
    long_tons: 1016.0469088,
    happy_carbon_atom: 2e-26,       // Carbon atom mass in kg
    earth: 5.97e24,                 // Earth mass in kg
    sun: 1.99e30,                   // Sun mass in kg
    sagittarius_black_hole: 8e36    // Sagittarius A* Black Hole mass in kg
  };
  
  // Convert from input unit to kilograms
  const valueInKilograms = value * toStandard[fromUnit];
  
  // Convert from kilograms to output unit
  return valueInKilograms / toStandard[toUnit];
}

/**
 * Convert volume units
 */
function convertVolume(value, fromUnit, toUnit) {
  // Conversion rates to liters (standard unit)
  const toStandard = {
    liters: 1,
    milliliters: 0.001,
    cubic_meters: 1000,
    cubic_feet: 28.316846592,
    cubic_inches: 0.016387064,
    us_gallons: 3.785411784,
    us_quarts: 0.946352946,
    us_pints: 0.473176473,
    us_cups: 0.2365882365,
    us_fluid_ounces: 0.0295735295625,
    us_tablespoons: 0.01478676478125,
    us_teaspoons: 0.00492892159375,
    imperial_gallons: 4.54609,
    imperial_quarts: 1.1365225,
    imperial_pints: 0.56826125,
    imperial_fluid_ounces: 0.0284130625,
    happy_carbon_atom: 10e-33,       // 10e-30 cubic meters converted to liters
    earth: 1.08e24,                  // 1.08e21 cubic meters converted to liters
    sun: 1.4e30,                     // 1.4e27 cubic meters converted to liters
    sagittarius_black_hole: 10e35    // 10e32 cubic meters converted to liters
  };
  
  // Convert from input unit to liters
  const valueInLiters = value * toStandard[fromUnit];
  
  // Convert from liters to output unit
  return valueInLiters / toStandard[toUnit];
}

/**
 * Convert temperature units
 */
function convertTemperature(value, fromUnit, toUnit) {
  // Temperature conversions require special formulas
  let celsius;
  
  // Convert from input unit to Celsius
  switch (fromUnit) {
    case 'celsius':
      celsius = value;
      break;
    case 'fahrenheit':
      celsius = (value - 32) * (5/9);
      break;
    case 'kelvin':
      celsius = value - 273.15;
      break;
  }
  
  // Convert from Celsius to output unit
  switch (toUnit) {
    case 'celsius':
      return celsius;
    case 'fahrenheit':
      return (celsius * (9/5)) + 32;
    case 'kelvin':
      return celsius + 273.15;
  }
}

/**
 * Convert time units
 */
function convertTime(value, fromUnit, toUnit) {
  // Conversion rates to seconds (standard unit)
  const toStandard = {
    seconds: 1,
    milliseconds: 0.001,
    microseconds: 0.000001,
    nanoseconds: 0.000000001,
    minutes: 60,
    hours: 3600,
    days: 86400,
    weeks: 604800,
    months: 2592000, // 30-day month
    years: 31536000, // 365-day year
    age_of_universe: 4.3554e17 // 13.8 billion years in seconds
  };
  
  // Convert from input unit to seconds
  const valueInSeconds = value * toStandard[fromUnit];
  
  // Convert from seconds to output unit
  return valueInSeconds / toStandard[toUnit];
}

/**
 * Convert speed units
 */
function convertSpeed(value, fromUnit, toUnit) {
  // Conversion rates to meters per second (standard unit)
  const toStandard = {
    meters_per_second: 1,
    kilometers_per_hour: 0.2777777778,
    miles_per_hour: 0.44704,
    feet_per_second: 0.3048,
    knots: 0.5144444444,
    light_speed: 299792458 // Speed of light in meters per second
  };
  
  // Convert from input unit to meters per second
  const valueInMetersPerSecond = value * toStandard[fromUnit];
  
  // Convert from meters per second to output unit
  return valueInMetersPerSecond / toStandard[toUnit];
}

/**
 * Convert pressure units
 */
function convertPressure(value, fromUnit, toUnit) {
  // Conversion rates to pascals (standard unit)
  const toStandard = {
    pascals: 1,
    kilopascals: 1000,
    megapascals: 1000000,
    bars: 100000,
    psi: 6894.7572932,
    atmospheres: 101325,
    torr: 133.3223684,
    millimeters_mercury: 133.3223684,
    surface_earth: 101325,     // Average surface pressure of Earth in pascals (1.013e5)
    surface_venus: 9200000,    // Surface pressure of Venus in pascals (9.2e6)
    surface_mars: 600          // Surface pressure of Mars in pascals
  };
  
  // Convert from input unit to pascals
  const valueInPascals = value * toStandard[fromUnit];
  
  // Convert from pascals to output unit
  return valueInPascals / toStandard[toUnit];
}

/**
 * Convert energy units
 */
function convertEnergy(value, fromUnit, toUnit) {
  // Conversion rates to joules (standard unit)
  const toStandard = {
    joules: 1,
    kilojoules: 1000,
    calories: 4.184,
    kilocalories: 4184,
    watt_hours: 3600,
    kilowatt_hours: 3600000,
    electron_volts: 1.602176634e-19,
    british_thermal_units: 1055.05585262,
    foot_pounds: 1.3558179483,
    type_a_supernova: 1e44,        // 10^44 J for Type A Supernova
    observable_universe: 1e70      // 10^70 J for The Observable Universe
  };
  
  // Convert from input unit to joules
  const valueInJoules = value * toStandard[fromUnit];
  
  // Convert from joules to output unit
  return valueInJoules / toStandard[toUnit];
}

/**
 * Update common conversion units display
 */
function updateCommonUnits(type) {
  const fromInput = document.getElementById(`${type}-input-from`);
  const fromUnit = document.getElementById(`${type}-unit-from`);
  const fromValue = parseFloat(fromInput.value);
  
  if (isNaN(fromValue)) {
    return;
  }
  
  const fromUnitValue = fromUnit.value;
  const commonUnitsContainer = document.getElementById(`${type}-common-units`);
  
  if (!commonUnitsContainer) {
    return;
  }
  
  // Clear existing common units
  commonUnitsContainer.innerHTML = '';
  
  // Get common units based on type
  let commonUnits = [];
  
  switch (type) {
    case 'length':
      commonUnits = getCommonLengthUnits(fromValue, fromUnitValue);
      break;
    case 'area':
      commonUnits = getCommonAreaUnits(fromValue, fromUnitValue);
      break;
    case 'mass':
      commonUnits = getCommonMassUnits(fromValue, fromUnitValue);
      break;
    case 'temperature':
      commonUnits = getCommonTemperatureUnits(fromValue, fromUnitValue);
      break;
    case 'time':
      commonUnits = getCommonTimeUnits(fromValue, fromUnitValue);
      break;
    // For other types, we'll create generic common units
    default:
      commonUnits = getGenericCommonUnits(type, fromValue, fromUnitValue);
      break;
  }
  
  // Create and append common unit elements
  commonUnits.forEach(unit => {
    const unitElement = document.createElement('div');
    unitElement.className = 'common-unit-item';
    unitElement.innerHTML = `
      <div class="common-unit-value">${unit.value}</div>
      <div class="common-unit-name">${unit.name}</div>
    `;
    
    // Add click event to apply this conversion
    unitElement.addEventListener('click', () => {
      const toUnitSelect = document.getElementById(`${type}-unit-to`);
      if (toUnitSelect) {
        toUnitSelect.value = unit.unit;
        convertUnit(type);
      }
    });
    
    commonUnitsContainer.appendChild(unitElement);
  });
}

/**
 * Get common length units for display
 */
function getCommonLengthUnits(value, fromUnit) {
  const units = [
    { unit: 'meters', name: 'Meters' },
    { unit: 'kilometers', name: 'Kilometers' },
    { unit: 'centimeters', name: 'Centimeters' },
    { unit: 'millimeters', name: 'Millimeters' },
    { unit: 'miles', name: 'Miles' },
    { unit: 'feet', name: 'Feet' },
    { unit: 'inches', name: 'Inches' }
  ];
  
  // Filter out the current unit
  const filteredUnits = units.filter(u => u.unit !== fromUnit);
  
  // Calculate conversions
  return filteredUnits.map(u => {
    const convertedValue = convertLength(value, fromUnit, u.unit);
    let formattedValue;
    
    // Limit to 10 digits max
    if (Math.abs(convertedValue) >= 1e10) {
      formattedValue = convertedValue.toExponential(4);
    } else if (Math.abs(convertedValue) < 0.01) {
      formattedValue = convertedValue.toFixed(4);
    } else if (Math.abs(convertedValue) < 1) {
      formattedValue = convertedValue.toFixed(4);
    } else {
      formattedValue = convertedValue.toFixed(Math.min(4, Math.max(0, 10 - Math.floor(Math.log10(Math.abs(convertedValue))) - 1)));
    }
    
    // Remove trailing zeros
    formattedValue = formattedValue.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    
    return {
      unit: u.unit,
      name: u.name,
      value: formattedValue
    };
  });
}

/**
 * Get common area units for display
 */
function getCommonAreaUnits(value, fromUnit) {
  const units = [
    { unit: 'square_meters', name: 'Square Meters' },
    { unit: 'square_kilometers', name: 'Square Kilometers' },
    { unit: 'square_feet', name: 'Square Feet' },
    { unit: 'square_miles', name: 'Square Miles' },
    { unit: 'acres', name: 'Acres' },
    { unit: 'hectares', name: 'Hectares' }
  ];
  
  // Filter out the current unit
  const filteredUnits = units.filter(u => u.unit !== fromUnit);
  
  // Calculate conversions
  return filteredUnits.map(u => {
    const convertedValue = convertArea(value, fromUnit, u.unit);
    let formattedValue;
    
    // Limit to 10 digits max
    if (Math.abs(convertedValue) >= 1e10) {
      formattedValue = convertedValue.toExponential(4);
    } else if (Math.abs(convertedValue) < 0.01) {
      formattedValue = convertedValue.toFixed(4);
    } else if (Math.abs(convertedValue) < 1) {
      formattedValue = convertedValue.toFixed(4);
    } else {
      formattedValue = convertedValue.toFixed(Math.min(4, Math.max(0, 10 - Math.floor(Math.log10(Math.abs(convertedValue))) - 1)));
    }
    
    // Remove trailing zeros
    formattedValue = formattedValue.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    
    return {
      unit: u.unit,
      name: u.name,
      value: formattedValue
    };
  });
}

/**
 * Get common time units for display
 */
function getCommonTimeUnits(value, fromUnit) {
  const units = [
    { unit: 'seconds', name: 'Seconds' },
    { unit: 'minutes', name: 'Minutes' },
    { unit: 'hours', name: 'Hours' },
    { unit: 'days', name: 'Days' },
    { unit: 'weeks', name: 'Weeks' }
  ];
  
  // Filter out the current unit
  const filteredUnits = units.filter(u => u.unit !== fromUnit);
  
  // Calculate conversions
  return filteredUnits.map(u => {
    const convertedValue = convertTime(value, fromUnit, u.unit);
    let formattedValue;
    
    // Limit to 10 digits max
    if (Math.abs(convertedValue) >= 1e10) {
      formattedValue = convertedValue.toExponential(4);
    } else if (Math.abs(convertedValue) < 0.01) {
      formattedValue = convertedValue.toFixed(4);
    } else if (Math.abs(convertedValue) < 1) {
      formattedValue = convertedValue.toFixed(4);
    } else {
      formattedValue = convertedValue.toFixed(Math.min(4, Math.max(0, 10 - Math.floor(Math.log10(Math.abs(convertedValue))) - 1)));
    }
    
    // Remove trailing zeros
    formattedValue = formattedValue.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    
    return {
      unit: u.unit,
      name: u.name,
      value: formattedValue
    };
  });
}

/**
 * Get common mass units for display
 */
function getCommonMassUnits(value, fromUnit) {
  const units = [
    { unit: 'kilograms', name: 'Kilograms' },
    { unit: 'grams', name: 'Grams' },
    { unit: 'pounds', name: 'Pounds' },
    { unit: 'ounces', name: 'Ounces' },
    { unit: 'metric_tons', name: 'Metric Tons' }
  ];
  
  // Filter out the current unit
  const filteredUnits = units.filter(u => u.unit !== fromUnit);
  
  // Calculate conversions
  return filteredUnits.map(u => {
    const convertedValue = convertMass(value, fromUnit, u.unit);
    let formattedValue;
    
    // Limit to 10 digits max
    if (Math.abs(convertedValue) >= 1e10) {
      formattedValue = convertedValue.toExponential(4);
    } else if (Math.abs(convertedValue) < 0.01) {
      formattedValue = convertedValue.toFixed(4);
    } else if (Math.abs(convertedValue) < 1) {
      formattedValue = convertedValue.toFixed(4);
    } else {
      formattedValue = convertedValue.toFixed(Math.min(4, Math.max(0, 10 - Math.floor(Math.log10(Math.abs(convertedValue))) - 1)));
    }
    
    // Remove trailing zeros
    formattedValue = formattedValue.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    
    return {
      unit: u.unit,
      name: u.name,
      value: formattedValue
    };
  });
}

/**
 * Get common temperature units for display
 */
function getCommonTemperatureUnits(value, fromUnit) {
  const units = [
    { unit: 'celsius', name: 'Celsius' },
    { unit: 'fahrenheit', name: 'Fahrenheit' },
    { unit: 'kelvin', name: 'Kelvin' }
  ];
  
  // Filter out the current unit
  const filteredUnits = units.filter(u => u.unit !== fromUnit);
  
  // Calculate conversions
  return filteredUnits.map(u => {
    const convertedValue = convertTemperature(value, fromUnit, u.unit);
    let formattedValue;
    
    // Limit to 10 digits max, but temperature typically doesn't need as many decimal places
    if (Math.abs(convertedValue) >= 1e10) {
      formattedValue = convertedValue.toExponential(4);
    } else {
      formattedValue = convertedValue.toFixed(2);
    }
    
    // Remove trailing zeros
    formattedValue = formattedValue.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    
    return {
      unit: u.unit,
      name: u.name,
      value: formattedValue
    };
  });
}

/**
 * Get generic common units for types without specific implementation
 */
function getGenericCommonUnits(type, value, fromUnit) {
  // Get all options from the select box except the current one
  const selectElement = document.getElementById(`${type}-unit-from`);
  const units = [];
  
  if (selectElement) {
    for (let i = 0; i < selectElement.options.length; i++) {
      const option = selectElement.options[i];
      if (option.value !== fromUnit) {
        units.push({
          unit: option.value,
          name: option.text
        });
      }
    }
  }
  
  // Calculate conversions
  return units.map(u => {
    let convertedValue;
    
    switch (type) {
      case 'volume':
        convertedValue = convertVolume(value, fromUnit, u.unit);
        break;
      case 'speed':
        convertedValue = convertSpeed(value, fromUnit, u.unit);
        break;
      case 'pressure':
        convertedValue = convertPressure(value, fromUnit, u.unit);
        break;
      case 'energy':
        convertedValue = convertEnergy(value, fromUnit, u.unit);
        break;
      default:
        return {
          unit: u.unit,
          name: u.name,
          value: "Error"
        };
    }
    
    let formattedValue;
    
    // Limit to 10 digits max
    if (Math.abs(convertedValue) >= 1e10) {
      formattedValue = convertedValue.toExponential(4);
    } else if (Math.abs(convertedValue) < 0.01) {
      formattedValue = convertedValue.toFixed(4);
    } else if (Math.abs(convertedValue) < 1) {
      formattedValue = convertedValue.toFixed(4);
    } else {
      formattedValue = convertedValue.toFixed(Math.min(4, Math.max(0, 10 - Math.floor(Math.log10(Math.abs(convertedValue))) - 1)));
    }
    
    // Remove trailing zeros
    formattedValue = formattedValue.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    
    return {
      unit: u.unit,
      name: u.name,
      value: formattedValue
    };
  });
} 
