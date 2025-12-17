// Graph Tool Implementation
let graphToolBooted = false;
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('graph-tool-button');
  if (!btn) return;
  btn.addEventListener('click', (event) => {
    if (graphToolBooted) return;
    graphToolBooted = true;
    event.preventDefault();
    bootGraphTool();
    openGraphModal();
  }, { once: true });
});

function bootGraphTool() {
  console.log('Graph Tool: Initializing...');
  
  // Create graph modal
  createGraphModal();
  
  // Add Graph Tool button to the header (if it doesn't already exist)
  if (!document.getElementById('graph-tool-button')) {
    addGraphToolButton();
  } else {
    // Add event listener to existing button
    document.getElementById('graph-tool-button').addEventListener('click', openGraphModal);
  }
  
  // Add transitionend event listener for modal
  document.getElementById('graph-modal').addEventListener('transitionend', function(e) {
    // Only handle transitions on the modal itself or its direct content, not child elements
    if ((e.target === this || e.target.classList.contains('graph-content')) && 
        (e.propertyName === 'opacity' || e.propertyName === 'transform')) {
      
      // If the modal is visible, initialize the graph
      if (this.classList.contains('visible')) {
        initializeGraph();
      }
    }
  });
}

// Store data sets
const dataSets = [
  {
    id: 1,
    name: "Data 1",
    color: "#ff8800",
    points: [
      { id: 1, x: 10, y: 20 },
      { id: 2, x: 30, y: 40 },
      { id: 3, x: 50, y: 60 }
    ],
    nextPointId: 4,
    active: true
  }
];

// Available colors for data sets
const availableColors = [
  "#ff8800", // Orange (default)
  "#4bc0c0", // Teal
  "#9966ff", // Purple
  "#ff6384", // Pink
  "#36a2eb", // Blue
  "#ffcd56", // Yellow
  "#4caf50", // Green
  "#f44336", // Red
  "#9c27b0", // Deep Purple
  "#3f51b5"  // Indigo
];

// Get next available color
function getNextColor() {
  const usedColors = dataSets.map(set => set.color);
  return availableColors.find(color => !usedColors.includes(color)) || availableColors[0];
}

// Get next data set ID
function getNextDataSetId() {
  return Math.max(0, ...dataSets.map(set => set.id)) + 1;
}

/**
 * Creates and appends the Graph Tool button to the header navigation
 */
function addGraphToolButton() {
  const navLeft = document.querySelector('.nav-left');
  
  if (navLeft) {
    const graphToolLi = document.createElement('li');
    const graphToolButton = document.createElement('button');
    
    graphToolButton.id = 'graph-tool-button';
    graphToolButton.className = 'graph-tool-button';
    graphToolButton.textContent = 'Graph Tool';
    graphToolButton.setAttribute('aria-label', 'Open Graph Tool');
    
    graphToolButton.addEventListener('click', openGraphModal);
    
    graphToolLi.appendChild(graphToolButton);
    navLeft.appendChild(graphToolLi);
    
    console.log('Graph Tool: Button added to header');
  } else {
    console.error('Graph Tool: Could not find .nav-left element');
  }
}

/**
 * Creates the graph modal HTML structure and appends it to the body
 */
function createGraphModal() {
  const graphModal = document.createElement('div');
  graphModal.id = 'graph-modal';
  graphModal.className = 'graph-modal';
  graphModal.setAttribute('role', 'dialog');
  graphModal.setAttribute('aria-labelledby', 'graph-title');
  graphModal.setAttribute('aria-modal', 'true');
  
  graphModal.innerHTML = `
    <div class="graph-content">
      <div class="graph-header">
        <h2 id="graph-title" class="graph-title">Graph Tool</h2>
        <span class="graph-close" id="graph-close" aria-label="Close graph tool">&times;</span>
      </div>
      <div class="graph-body">
        <div class="graph-container">
          <canvas id="graph-canvas"></canvas>
          <div id="graph-tooltip" class="graph-tooltip"></div>
        </div>
        <div class="graph-controls">
          <div class="graph-range-controls">
            <div class="range-controls-row">
              <div class="range-control">
                <div class="label-with-button">
                  <label for="x-max">X-final</label>
                  <button id="edit-x-title-btn" class="edit-title-btn" aria-label="Edit X axis title">Edit Title</button>
                </div>
                <input type="number" id="x-max" min="1" value="100" aria-label="X-axis maximum value">
              </div>
              <div class="range-control">
                <div class="label-with-button">
                  <label for="y-max">Y-final</label>
                  <button id="edit-y-title-btn" class="edit-title-btn" aria-label="Edit Y axis title">Edit Title</button>
                </div>
                <input type="number" id="y-max" min="1" value="100" aria-label="Y-axis maximum value">
              </div>
            </div>
          </div>
          
          <div class="data-sets-manager">
            <div class="data-sets-header">
              <div class="data-sets-title">Data Sets</div>
              <button id="add-data-set-btn" class="add-data-set-btn" aria-label="Add new data set">Add Data Set</button>
            </div>
            <div class="data-sets-container" id="data-sets-container">
              <!-- Data sets will be added here dynamically -->
            </div>
          </div>
          
          <div class="graph-data-table">
            <div class="table-header">
              <div class="table-title">Data Points <span id="active-data-set-name" class="active-data-set-name">(Data 1)</span></div>
              <button id="add-point-btn" class="add-point-btn" aria-label="Add new data point">Add Point</button>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>X</th>
                    <th>Y</th>
                    <th>
                      <button id="clear-points-btn" class="clear-points-btn" aria-label="Clear all data points">Clear</button>
                    </th>
                  </tr>
                </thead>
                <tbody id="data-table-body">
                  <!-- Data points will be added here dynamically -->
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="graph-options">
            <div class="option-group">
              <label class="toggle-switch">
                <input type="checkbox" id="connect-lines" checked aria-label="Connect points with lines">
                <span class="toggle-slider"></span>
              </label>
              <label for="connect-lines">Connect Points with Lines</label>
            </div>
            <button id="export-graph-btn" class="export-btn" aria-label="Export graph as image">Export as Image</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Title Edit Modal -->
    <div id="title-edit-modal" class="title-edit-modal">
      <div class="title-edit-content">
        <h3 id="title-edit-heading">Edit Axis Title</h3>
        <input type="text" id="title-edit-input" aria-label="Axis title">
        <div class="title-edit-buttons">
          <button id="title-edit-save" class="title-edit-save">Save</button>
          <button id="title-edit-cancel" class="title-edit-cancel">Cancel</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(graphModal);
  
  // Add event listeners
  document.getElementById('graph-close').addEventListener('click', closeGraphModal);
  document.getElementById('add-point-btn').addEventListener('click', addDataPoint);
  document.getElementById('clear-points-btn').addEventListener('click', clearDataPoints);
  document.getElementById('add-data-set-btn').addEventListener('click', addDataSet);
  document.getElementById('connect-lines').addEventListener('change', updateGraph);
  document.getElementById('x-max').addEventListener('change', updateGraph);
  document.getElementById('y-max').addEventListener('change', updateGraph);
  document.getElementById('export-graph-btn').addEventListener('click', exportGraph);
  
  // Add event listeners for axis title editing
  document.getElementById('edit-x-title-btn').addEventListener('click', function() {
    openTitleEditModal('x');
  });
  
  document.getElementById('edit-y-title-btn').addEventListener('click', function() {
    openTitleEditModal('y');
  });
  
  document.getElementById('title-edit-save').addEventListener('click', saveTitleEdit);
  document.getElementById('title-edit-cancel').addEventListener('click', closeTitleEditModal);
  
  // Add event delegation for data table
  document.getElementById('data-table-body').addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-point-btn')) {
      removeDataPoint(e.target.closest('tr'));
    }
  });
  
  document.getElementById('data-table-body').addEventListener('input', function(e) {
    if (e.target.classList.contains('x-value') || e.target.classList.contains('y-value')) {
      updateDataPointFromInput(e.target);
    }
  });
  
  // Add event delegation for data sets container
  document.getElementById('data-sets-container').addEventListener('click', function(e) {
    if (e.target.classList.contains('data-set-select-btn')) {
      selectDataSet(parseInt(e.target.dataset.id));
    } else if (e.target.classList.contains('data-set-remove-btn')) {
      removeDataSet(parseInt(e.target.dataset.id));
    }
  });
  
  document.getElementById('data-sets-container').addEventListener('input', function(e) {
    if (e.target.classList.contains('data-set-name-input')) {
      updateDataSetName(parseInt(e.target.dataset.id), e.target.value);
    } else if (e.target.classList.contains('data-set-color-input')) {
      updateDataSetColor(parseInt(e.target.dataset.id), e.target.value);
    }
  });
  
  // Close modal on ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('graph-modal').style.display === 'block') {
      closeGraphModal();
    }
  });
  
  // Close modal when clicking outside the graph content
  graphModal.addEventListener('click', function(e) {
    if (e.target === graphModal) {
      closeGraphModal();
    }
  });
  
  // Set up proper wheel event handling for scrollable containers
  const scrollableContainers = graphModal.querySelectorAll('.table-container, .data-sets-container');
  scrollableContainers.forEach(container => {
    container.addEventListener('wheel', function(e) {
      // If the container is scrollable in the direction of the wheel
      const isScrollableUp = this.scrollTop > 0;
      const isScrollableDown = this.scrollTop < this.scrollHeight - this.clientHeight;
      
      const isScrollingUp = e.deltaY < 0;
      const isScrollingDown = e.deltaY > 0;
      
      // Only prevent default when we've reached the top or bottom
      if ((isScrollingUp && !isScrollableUp) || (isScrollingDown && !isScrollableDown)) {
        e.preventDefault();
      }
      
      // Don't stop propagation to allow background scrolling
      // e.stopPropagation();
    }, { passive: false });
  });
  
  // Allow touchmove events to propagate to the body for scrolling
  graphModal.addEventListener('touchmove', function(e) {
    if (!e.target.closest('.table-container, .data-sets-container')) {
      // e.preventDefault();
    }
    // e.stopPropagation();
  }, { passive: true });
  
  console.log('Graph Tool: Modal created');
}

/**
 * Opens the graph modal
 */
function openGraphModal() {
  const modal = document.getElementById('graph-modal');
  
  // Get button position relative to the viewport
  const graphButton = document.getElementById('graph-tool-button');
  if (graphButton) {
    const buttonRect = graphButton.getBoundingClientRect();
    const buttonCenterX = buttonRect.left + buttonRect.width / 2;
    const buttonCenterY = buttonRect.top + buttonRect.height / 2;
    
    // Find the graph content and set its transform origin
    const graphContent = modal.querySelector('.graph-content');
    if (graphContent) {
      // Calculate the position relative to the content
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Convert button position to percentage of viewport
      const originX = (buttonCenterX / viewportWidth) * 100;
      const originY = (buttonCenterY / viewportHeight) * 100;
      
      graphContent.style.transformOrigin = `${originX}% ${originY}%`;
    }
  }
  
  // Make the modal visible first (but invisible due to opacity: 0)
  modal.style.display = 'block';
  
  // Force a reflow to ensure the display change takes effect before adding the visible class
  void modal.offsetWidth;
  
  // Add class to body but don't prevent scrolling
  document.body.classList.add('graph-modal-open');
  
  // Use requestAnimationFrame for better performance
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Add visible class to trigger the transition
      modal.classList.add('visible');
    });
  });
  
  // Render data sets
  renderDataSets();
  
  // Render data points for active data set
  renderDataPoints();
  
  // Focus trap for accessibility
  const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const firstElement = focusableElements[0];
  firstElement.focus();
  
  console.log('Graph Tool: Modal opened');
}

/**
 * Closes the graph modal
 */
function closeGraphModal() {
  const modal = document.getElementById('graph-modal');
  
  // Get graph button position for closing animation
  const graphButton = document.getElementById('graph-tool-button');
  if (graphButton) {
    const buttonRect = graphButton.getBoundingClientRect();
    const buttonCenterX = buttonRect.left + buttonRect.width / 2;
    const buttonCenterY = buttonRect.top + buttonRect.height / 2;
    
    // Find the graph content and set its transform origin
    const graphContent = modal.querySelector('.graph-content');
    if (graphContent) {
      // Calculate the position relative to the content
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Convert button position to percentage of viewport
      const originX = (buttonCenterX / viewportWidth) * 100;
      const originY = (buttonCenterY / viewportHeight) * 100;
      
      graphContent.style.transformOrigin = `${originX}% ${originY}%`;
    }
  }
  
  // Use requestAnimationFrame for better performance
  requestAnimationFrame(() => {
    // Remove the visible class to trigger the transition out
    modal.classList.remove('visible');
  });
  
  // Add one-time event listener for the transition end
  const handleTransitionEnd = (e) => {
    if ((e.target === modal || e.target.classList.contains('graph-content')) && 
        (e.propertyName === 'opacity' || e.propertyName === 'transform')) {
      
      // Clean up the event listener
      modal.removeEventListener('transitionend', handleTransitionEnd);
      
      // Hide the modal
      modal.style.display = 'none';
      
      // Clean up body styles
      document.body.classList.remove('graph-modal-open');
      
      // Return focus to the button that opened the modal
      document.getElementById('graph-tool-button').focus();
    }
  };
  
  modal.addEventListener('transitionend', handleTransitionEnd);
  
  // Fallback timeout in case the transition event doesn't fire
  const fallbackTimeout = setTimeout(() => {
    modal.removeEventListener('transitionend', handleTransitionEnd);
    
    if (modal.style.display !== 'none') {
      modal.style.display = 'none';
      
      // Clean up body styles
      document.body.classList.remove('graph-modal-open');
      
      // Return focus to the button that opened the modal
      document.getElementById('graph-tool-button').focus();
    }
  }, 400);
  
  console.log('Graph Tool: Modal closed');
}

/**
 * Renders the data sets in the data sets container
 */
function renderDataSets() {
  const container = document.getElementById('data-sets-container');
  container.innerHTML = '';
  
  dataSets.forEach(dataSet => {
    const dataSetElement = document.createElement('div');
    dataSetElement.className = `data-set-item ${dataSet.active ? 'active' : ''}`;
    dataSetElement.dataset.id = dataSet.id;
    
    dataSetElement.innerHTML = `
      <div class="data-set-color">
        <input type="color" class="data-set-color-input" value="${dataSet.color}" data-id="${dataSet.id}" aria-label="Data set color">
      </div>
      <div class="data-set-info">
        <input type="text" class="data-set-name-input" value="${dataSet.name}" data-id="${dataSet.id}" aria-label="Data set name">
        <div class="data-set-points-count">${dataSet.points.length} points</div>
      </div>
      <div class="data-set-actions">
        <button class="data-set-select-btn ${dataSet.active ? 'active' : ''}" data-id="${dataSet.id}" aria-label="Select data set">
          ${dataSet.active ? 'Editing' : 'Edit'}
        </button>
        ${dataSets.length > 1 ? `<button class="data-set-remove-btn" data-id="${dataSet.id}" aria-label="Remove data set">&times;</button>` : ''}
      </div>
    `;
    
    container.appendChild(dataSetElement);
  });
}

/**
 * Renders the data points for the active data set
 */
function renderDataPoints() {
  const tableBody = document.getElementById('data-table-body');
  tableBody.innerHTML = '';
  
  const activeDataSet = getActiveDataSet();
  if (!activeDataSet) return;
  
  // Update the active data set name in the table header
  document.getElementById('active-data-set-name').textContent = `(${activeDataSet.name})`;
  
  activeDataSet.points.forEach((point, index) => {
    const row = document.createElement('tr');
    row.dataset.index = index;
    
    row.innerHTML = `
      <td class="point-number">${point.id}</td>
      <td><input type="number" min="0" step="any" value="${point.x}" class="x-value" aria-label="X value"></td>
      <td><input type="number" min="0" step="any" value="${point.y}" class="y-value" aria-label="Y value"></td>
      <td><button class="remove-point-btn" aria-label="Remove this point">&times;</button></td>
    `;
    
    tableBody.appendChild(row);
  });
}

/**
 * Gets the active data set
 * @returns {Object} The active data set
 */
function getActiveDataSet() {
  return dataSets.find(set => set.active);
}

/**
 * Adds a new data set
 */
function addDataSet() {
  const newId = getNextDataSetId();
  const newColor = getNextColor();
  
  // Set all existing data sets to inactive
  dataSets.forEach(set => set.active = false);
  
  // Add new data set
  dataSets.push({
    id: newId,
    name: `Data ${newId}`,
    color: newColor,
    points: [{ id: 1, x: 0, y: 0 }],
    nextPointId: 2,
    active: true
  });
  
  // Render data sets
  renderDataSets();
  
  // Render data points for new active data set
  renderDataPoints();
  
  // Update graph
  updateGraph();
  
  console.log(`Graph Tool: Added new data set (ID: ${newId})`);
}

/**
 * Selects a data set
 * @param {number} id - The ID of the data set to select
 */
function selectDataSet(id) {
  // Set all data sets to inactive
  dataSets.forEach(set => set.active = false);
  
  // Set the selected data set to active
  const dataSet = dataSets.find(set => set.id === id);
  if (dataSet) {
    dataSet.active = true;
  }
  
  // Render data sets
  renderDataSets();
  
  // Render data points for active data set
  renderDataPoints();
  
  console.log(`Graph Tool: Selected data set (ID: ${id})`);
}

/**
 * Removes a data set
 * @param {number} id - The ID of the data set to remove
 */
function removeDataSet(id) {
  const index = dataSets.findIndex(set => set.id === id);
  if (index === -1) return;
  
  // Check if the data set to remove is active
  const wasActive = dataSets[index].active;
  
  // Remove the data set
  dataSets.splice(index, 1);
  
  // If the removed data set was active, set the first data set as active
  if (wasActive && dataSets.length > 0) {
    dataSets[0].active = true;
  }
  
  // Render data sets
  renderDataSets();
  
  // Render data points for active data set
  renderDataPoints();
  
  // Update graph
  updateGraph();
  
  console.log(`Graph Tool: Removed data set (ID: ${id})`);
}

/**
 * Updates a data set's name
 * @param {number} id - The ID of the data set
 * @param {string} name - The new name
 */
function updateDataSetName(id, name) {
  const dataSet = dataSets.find(set => set.id === id);
  if (dataSet) {
    dataSet.name = name || `Data ${id}`;
    
    // Update the active data set name in the table header if this is the active data set
    if (dataSet.active) {
      document.getElementById('active-data-set-name').textContent = `(${dataSet.name})`;
    }
    
    // Update graph
    updateGraph();
  }
}

/**
 * Updates a data set's color
 * @param {number} id - The ID of the data set
 * @param {string} color - The new color
 */
function updateDataSetColor(id, color) {
  const dataSet = dataSets.find(set => set.id === id);
  if (dataSet) {
    dataSet.color = color;
    
    // Update graph
    updateGraph();
  }
}

// Chart.js instance
let graphChart = null;

// Store the current axis labels
let xAxisLabel = 'X Axis';
let yAxisLabel = 'Y Axis';
let currentEditingAxis = null;

/**
 * Opens the title edit modal for the specified axis
 * @param {string} axis - The axis to edit ('x' or 'y')
 */
function openTitleEditModal(axis) {
  currentEditingAxis = axis;
  const modal = document.getElementById('title-edit-modal');
  const input = document.getElementById('title-edit-input');
  const heading = document.getElementById('title-edit-heading');
  
  if (axis === 'x') {
    heading.textContent = 'Edit X-Axis Title';
    input.value = xAxisLabel;
  } else {
    heading.textContent = 'Edit Y-Axis Title';
    input.value = yAxisLabel;
  }
  
  modal.style.display = 'flex';
  input.focus();
  input.select();
}

/**
 * Saves the title edit and closes the modal
 */
function saveTitleEdit() {
  const input = document.getElementById('title-edit-input');
  const newTitle = input.value.trim() || (currentEditingAxis === 'x' ? 'X Axis' : 'Y Axis');
  
  if (currentEditingAxis === 'x') {
    xAxisLabel = newTitle;
  } else {
    yAxisLabel = newTitle;
  }
  
  updateAxisLabels();
  closeTitleEditModal();
}

/**
 * Closes the title edit modal without saving
 */
function closeTitleEditModal() {
  const modal = document.getElementById('title-edit-modal');
  modal.style.display = 'none';
  currentEditingAxis = null;
}

/**
 * Updates the axis labels in the chart
 */
function updateAxisLabels() {
  if (!graphChart) return;
  
  graphChart.options.scales.x.title.text = xAxisLabel;
  graphChart.options.scales.y.title.text = yAxisLabel;
  graphChart.update();
  
  console.log('Graph Tool: Axis labels updated');
}

/**
 * Initializes the graph with Chart.js
 */
function initializeGraph() {
  const ctx = document.getElementById('graph-canvas').getContext('2d');
  
  if (graphChart) {
    graphChart.destroy();
  }
  
  const xMax = parseInt(document.getElementById('x-max').value) || 100;
  const yMax = parseInt(document.getElementById('y-max').value) || 100;
  const connectLines = document.getElementById('connect-lines').checked;
  
  // Create datasets for Chart.js
  const chartDatasets = dataSets.map(dataSet => ({
    label: dataSet.name,
    data: dataSet.points,
    backgroundColor: dataSet.color,
    borderColor: dataSet.color,
    pointRadius: 6,
    pointHoverRadius: 8,
    pointStyle: 'circle',
    showLine: connectLines,
    borderWidth: 3,
    tension: 0.4
  }));
  
  graphChart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: chartDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          min: 0,
          max: xMax,
          grid: {
            color: 'rgba(51, 51, 51, 0.8)',
            borderColor: 'rgba(85, 85, 85, 1)'
          },
          ticks: {
            color: 'rgba(170, 170, 170, 1)'
          },
          title: {
            display: true,
            text: xAxisLabel,
            color: 'rgba(170, 170, 170, 1)',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        y: {
          min: 0,
          max: yMax,
          grid: {
            color: 'rgba(51, 51, 51, 0.8)',
            borderColor: 'rgba(85, 85, 85, 1)'
          },
          ticks: {
            color: 'rgba(170, 170, 170, 1)'
          },
          title: {
            display: true,
            text: yAxisLabel,
            color: 'rgba(170, 170, 170, 1)',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: (${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`;
            }
          },
          backgroundColor: 'rgba(20, 20, 20, 0.9)',
          titleColor: 'rgba(255, 255, 255, 1)',
          bodyColor: 'rgba(255, 255, 255, 1)',
          borderColor: 'rgba(51, 51, 51, 1)',
          borderWidth: 1,
          padding: 10,
          displayColors: true,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 14
          }
        },
        legend: {
          display: false // Hide default legend, we'll use our custom one
        }
      },
      animation: {
        duration: 500,
        easing: 'easeOutQuart'
      },
      interaction: {
        mode: 'nearest',
        intersect: false
      }
    },
    plugins: [customMovableLegendPlugin]
  });
  
  console.log('Graph Tool: Graph initialized');
}

/**
 * Updates the graph with new data or settings
 */
function updateGraph() {
  if (!graphChart) {
    initializeGraph();
    return;
  }
  
  const xMax = parseInt(document.getElementById('x-max').value) || 100;
  const yMax = parseInt(document.getElementById('y-max').value) || 100;
  const connectLines = document.getElementById('connect-lines').checked;
  
  // Create datasets for Chart.js
  const chartDatasets = dataSets.map(dataSet => ({
    label: dataSet.name,
    data: dataSet.points,
    backgroundColor: dataSet.color,
    borderColor: dataSet.color,
    pointRadius: 6,
    pointHoverRadius: 8,
    pointStyle: 'circle',
    showLine: connectLines,
    borderWidth: 3,
    tension: 0.4
  }));
  
  // Update chart data
  graphChart.data.datasets = chartDatasets;
  
  // Update axis ranges
  graphChart.options.scales.x.max = xMax;
  graphChart.options.scales.y.max = yMax;
  
  // Update the chart
  graphChart.update();
  
  // Enforce minimum size on the legend after updating the graph
  setTimeout(() => {
    enforceLegendMinimumSize();
  }, 100);
  
  console.log('Graph Tool: Graph updated');
}

/**
 * Updates a data point from input
 * @param {HTMLElement} input - The input element
 */
function updateDataPointFromInput(input) {
  const row = input.closest('tr');
  const index = parseInt(row.dataset.index);
  const activeDataSet = getActiveDataSet();
  
  if (!activeDataSet || isNaN(index)) return;
  
  const xInput = row.querySelector('.x-value');
  const yInput = row.querySelector('.y-value');
  
  const x = parseFloat(xInput.value);
  const y = parseFloat(yInput.value);
  
  // Ensure values are non-negative
  if (!isNaN(x) && !isNaN(y) && x >= 0 && y >= 0) {
    activeDataSet.points[index].x = x;
    activeDataSet.points[index].y = y;
    
    // Update the graph without re-sorting the points
    updateGraph();
  }
}

/**
 * Adds a new data point to the active data set
 */
function addDataPoint() {
  const activeDataSet = getActiveDataSet();
  if (!activeDataSet) return;
  
  // Add new point with a unique ID
  const newPointId = activeDataSet.nextPointId || activeDataSet.points.length + 1;
  activeDataSet.points.push({ id: newPointId, x: 0, y: 0 });
  activeDataSet.nextPointId = newPointId + 1;
  
  // Re-render data points
  renderDataPoints();
  
  // Update the graph
  updateGraph();
  
  // Focus the new X input (last row)
  const rows = document.querySelectorAll('#data-table-body tr');
  const lastRow = rows[rows.length - 1];
  if (lastRow) {
    const newXInput = lastRow.querySelector('.x-value');
    newXInput.focus();
    newXInput.select();
    
    // Scroll to the new row
    const tableContainer = document.querySelector('.table-container');
    tableContainer.scrollTop = tableContainer.scrollHeight;
  }
  
  console.log('Graph Tool: Data point added');
}

/**
 * Enforces the minimum size on the legend
 */
function enforceLegendMinimumSize() {
  const legendContainer = document.getElementById('movable-legend');
  if (!legendContainer) return;
  
  // Calculate the minimum dimensions
  const dimensions = updateLegendLayout(legendContainer);
  if (!dimensions) return;
  
  // Get current dimensions
  const currentWidth = legendContainer.offsetWidth;
  const currentHeight = legendContainer.offsetHeight;
  
  // Check if current dimensions are smaller than minimum
  let needsUpdate = false;
  
  if (currentWidth < dimensions.minWidth) {
    legendContainer.style.width = dimensions.minWidth + 'px';
    needsUpdate = true;
  }
  
  if (currentHeight < dimensions.minHeight) {
    legendContainer.style.height = dimensions.minHeight + 'px';
    needsUpdate = true;
  }
  
  // Update stored dimensions if needed
  if (needsUpdate) {
    try {
      const position = JSON.parse(legendContainer.dataset.position);
      if (currentWidth < dimensions.minWidth) {
        position.width = dimensions.minWidth;
      }
      if (currentHeight < dimensions.minHeight) {
        position.height = dimensions.minHeight;
      }
      legendContainer.dataset.position = JSON.stringify(position);
      
      // Update layout again
      updateLegendLayout(legendContainer);
    } catch (e) {
      console.error('Error updating legend position:', e);
    }
  }
}

/**
 * Removes a data point from the active data set
 * @param {HTMLElement} row - The table row to remove
 */
function removeDataPoint(row) {
  const activeDataSet = getActiveDataSet();
  if (!activeDataSet) return;
  
  const index = parseInt(row.dataset.index);
  if (isNaN(index)) return;
  
  // Ensure we always have at least one data point
  if (activeDataSet.points.length > 1) {
    // Remove the point
    activeDataSet.points.splice(index, 1);
    
    // Re-render data points
    renderDataPoints();
    
    // Update the graph
    updateGraph();
    
    console.log('Graph Tool: Data point removed');
  } else {
    console.log('Graph Tool: Cannot remove the last data point');
    // Reset values to 0 instead
    activeDataSet.points[0].x = 0;
    activeDataSet.points[0].y = 0;
    
    // Re-render data points
    renderDataPoints();
    
    // Update the graph
    updateGraph();
  }
}

/**
 * Exports the graph as a PNG image
 */
function exportGraph() {
  if (!graphChart) return;
  
  // Create a temporary link element
  const link = document.createElement('a');
  link.download = 'graph-export.png';
  
  // Get the canvas data URL
  const dataURL = document.getElementById('graph-canvas').toDataURL('image/png');
  link.href = dataURL;
  
  // Trigger the download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log('Graph Tool: Graph exported as image');
}

/**
 * Clears all data points from the active data set
 */
function clearDataPoints() {
  const activeDataSet = getActiveDataSet();
  if (!activeDataSet) return;
  
  // Reset to a single point with values 0,0
  activeDataSet.points = [{ id: 1, x: 0, y: 0 }];
  activeDataSet.nextPointId = 2;
  
  // Re-render data points
  renderDataPoints();
  
  // Update the graph
  updateGraph();
  
  console.log('Graph Tool: Data points cleared');
}

/**
 * Updates the layout of legend items based on container width
 * @param {HTMLElement} container - The legend container
 */
function updateLegendLayout(container) {
  const itemsContainer = container.querySelector('.legend-items-container');
  if (!itemsContainer) return;
  
  const items = itemsContainer.querySelectorAll('.legend-item');
  if (items.length === 0) return;
  
  // Clear any previous styles
  items.forEach(item => {
    item.style.width = '';
    item.style.flexBasis = '';
    item.style.maxWidth = '';
  });
  
  // Get the actual width of the container (accounting for padding)
  const containerWidth = container.clientWidth - 24; // Subtract padding
  
  // First, let's measure the natural width of each item
  const itemWidths = [];
  const itemHeights = [];
  
  items.forEach(item => {
    // Temporarily set the item to auto width to measure its natural size
    item.style.width = 'auto';
    item.style.flexBasis = 'auto';
    item.style.maxWidth = 'none';
    
    // Clone the item and append it to the body to measure its true width
    const clone = item.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.visibility = 'hidden';
    clone.style.width = 'auto';
    document.body.appendChild(clone);
    
    // Measure the width and height
    const width = clone.offsetWidth + 16; // Add some margin
    const height = clone.offsetHeight + 8; // Add some margin
    itemWidths.push(width);
    itemHeights.push(height);
    
    // Remove the clone
    document.body.removeChild(clone);
  });
  
  // Calculate the minimum width and height needed for the legend
  const maxItemWidth = Math.max(...itemWidths);
  const itemHeight = Math.max(...itemHeights);
  
  // Calculate how many items can fit per row
  const itemsPerRow = Math.max(1, Math.floor(containerWidth / Math.min(maxItemWidth, 200)));
  
  // Calculate the minimum width and height needed for the legend
  const minRows = Math.ceil(items.length / itemsPerRow);
  const minWidth = Math.max(150, itemsPerRow * Math.min(maxItemWidth, 200) + 24); // Add padding
  
  // Calculate the minimum width and height needed for the legend
  const minHeight = Math.max(30, minRows * itemHeight + 36); // 24px for top/bottom padding + 12px extra for bottom
  
  // Set the flex layout
  itemsContainer.style.display = 'flex';
  itemsContainer.style.flexWrap = 'wrap';
  itemsContainer.style.alignItems = 'flex-start';
  itemsContainer.style.padding = '4px';
  itemsContainer.style.marginBottom = '12px'; // Increased bottom margin to ensure items don't touch the bottom edge
  
  // Set the width for each item - use fixed width instead of percentage to maintain consistent spacing
  const itemWidth = Math.min(maxItemWidth, 200);
  const flexBasis = `${itemWidth}px`;
  
  items.forEach(item => {
    item.style.flexBasis = flexBasis;
    item.style.width = flexBasis;
    item.style.maxWidth = flexBasis;
  });
  
  // Store the minimum dimensions in the container's dataset
  container.dataset.minWidth = minWidth;
  container.dataset.minHeight = minHeight;
  
  // Log for debugging
  console.log(`Legend layout updated: ${itemsPerRow} items per row, min dimensions: ${minWidth}x${minHeight}px`);
  
  return { minWidth, minHeight };
}

// Custom plugin to create a movable legend box
const customMovableLegendPlugin = {
  id: 'customMovableLegend',
  afterRender(chart) {
    if (chart.legend.legendItems.length <= 1) {
      // Remove legend if only one dataset
      const existingLegend = document.getElementById('movable-legend');
      if (existingLegend) {
        existingLegend.remove();
      }
      return;
    }
    
    const canvas = chart.canvas;
    const legendItems = chart.legend.legendItems;
    
    // Hide the default legend
    chart.legend.options.display = false;
    
    // Create or get the movable legend container
    let legendContainer = document.getElementById('movable-legend');
    
    // If this is the first render, create the legend container
    if (!legendContainer) {
      legendContainer = document.createElement('div');
      legendContainer.id = 'movable-legend';
      legendContainer.className = 'movable-legend';
      canvas.parentNode.appendChild(legendContainer);
      
      // Store position and size
      legendContainer.dataset.position = JSON.stringify({
        left: 10,
        top: 10,
        width: 200,
        height: 'auto'
      });
      
      // Make the legend draggable
      let isDragging = false;
      let isResizing = false;
      let resizeDirection = '';
      let startX, startY, startWidth, startHeight, startLeft, startTop;
      
      // Add mousedown event for dragging and resizing
      legendContainer.addEventListener('mousedown', function(e) {
        // Prevent default to avoid text selection
        e.preventDefault();
        
        const target = e.target;
        
        // Check if we're clicking on a resize handle
        if (target.classList.contains('resize-handle')) {
          isResizing = true;
          resizeDirection = target.dataset.direction;
          
          const rect = legendContainer.getBoundingClientRect();
          startWidth = rect.width;
          startHeight = rect.height;
          startLeft = parseFloat(legendContainer.style.left) || 0;
          startTop = parseFloat(legendContainer.style.top) || 0;
          startX = e.clientX;
          startY = e.clientY;
          
          document.body.style.cursor = target.style.cursor;
        } 
        // If not a resize handle and not clicking on a legend item, it's a drag
        else if (!target.closest('.legend-item')) {
          isDragging = true;
          
          const rect = legendContainer.getBoundingClientRect();
          startX = e.clientX - rect.left;
          startY = e.clientY - rect.top;
          
          legendContainer.style.cursor = 'grabbing';
        }
      });
      
      // Add mousemove event for dragging and resizing
      document.addEventListener('mousemove', function(e) {
        if (!isDragging && !isResizing) return;
        
        // Get canvas boundaries
        const canvasRect = canvas.getBoundingClientRect();
        
        if (isDragging) {
          // Calculate new position
          let newLeft = e.clientX - startX - canvasRect.left;
          let newTop = e.clientY - startY - canvasRect.top;
          
          // Get legend dimensions
          const legendRect = legendContainer.getBoundingClientRect();
          
          // Constrain to canvas boundaries
          newLeft = Math.max(0, Math.min(newLeft, canvasRect.width - legendRect.width));
          newTop = Math.max(0, Math.min(newTop, canvasRect.height - legendRect.height));
          
          // Update position
          legendContainer.style.left = newLeft + 'px';
          legendContainer.style.top = newTop + 'px';
          
          // Store position
          const position = JSON.parse(legendContainer.dataset.position);
          position.left = newLeft;
          position.top = newTop;
          legendContainer.dataset.position = JSON.stringify(position);
        } 
        else if (isResizing) {
          // Get minimum dimensions from dataset
          const minWidth = parseInt(legendContainer.dataset.minWidth) || 150;
          const minHeight = parseInt(legendContainer.dataset.minHeight) || 30;
          
          // Calculate deltas
          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;
          
          let newWidth = startWidth;
          let newHeight = startHeight;
          let newLeft = startLeft;
          let newTop = startTop;
          
          // Apply resize based on direction
          switch (resizeDirection) {
            case 'e': // East (right)
              newWidth = startWidth + deltaX;
              break;
            case 'w': // West (left)
              newWidth = startWidth - deltaX;
              newLeft = startLeft + deltaX;
              break;
            case 's': // South (bottom)
              newHeight = startHeight + deltaY;
              break;
            case 'n': // North (top)
              newHeight = startHeight - deltaY;
              newTop = startTop + deltaY;
              break;
            case 'ne': // Northeast
              newWidth = startWidth + deltaX;
              newHeight = startHeight - deltaY;
              newTop = startTop + deltaY;
              break;
            case 'nw': // Northwest
              newWidth = startWidth - deltaX;
              newLeft = startLeft + deltaX;
              newHeight = startHeight - deltaY;
              newTop = startTop + deltaY;
              break;
            case 'se': // Southeast
              newWidth = startWidth + deltaX;
              newHeight = startHeight + deltaY;
              break;
            case 'sw': // Southwest
              newWidth = startWidth - deltaX;
              newLeft = startLeft + deltaX;
              newHeight = startHeight + deltaY;
              break;
          }
          
          // Enforce minimum dimensions - STRICT enforcement
          if (newWidth < minWidth) {
            if (resizeDirection.includes('w')) {
              newLeft = startLeft + (startWidth - minWidth);
            }
            newWidth = minWidth;
          }
          
          if (newHeight < minHeight) {
            if (resizeDirection.includes('n')) {
              newTop = startTop + (startHeight - minHeight);
            }
            newHeight = minHeight;
          }
          
          // Constrain to canvas boundaries
          newLeft = Math.max(0, Math.min(newLeft, canvasRect.width - newWidth));
          newTop = Math.max(0, Math.min(newTop, canvasRect.height - newHeight));
          
          // Apply new dimensions and position
          legendContainer.style.width = newWidth + 'px';
          legendContainer.style.height = newHeight + 'px';
          legendContainer.style.left = newLeft + 'px';
          legendContainer.style.top = newTop + 'px';
          
          // Store new dimensions and position
          const position = JSON.parse(legendContainer.dataset.position);
          position.left = newLeft;
          position.top = newTop;
          position.width = newWidth;
          position.height = newHeight;
          legendContainer.dataset.position = JSON.stringify(position);
          
          // Update layout of legend items
          updateLegendLayout(legendContainer);
        }
      });
      
      // Add mouseup event to stop dragging and resizing
      document.addEventListener('mouseup', function() {
        if (isDragging) {
          isDragging = false;
          legendContainer.style.cursor = 'grab';
        }
        
        if (isResizing) {
          isResizing = false;
          document.body.style.cursor = 'default';
        }
      });
    }
    
    // Get stored position and size
    let position = { left: 10, top: 10, width: 200, height: 'auto' };
    if (legendContainer.dataset.position) {
      try {
        position = JSON.parse(legendContainer.dataset.position);
      } catch (e) {
        console.error('Error parsing legend position:', e);
      }
    }
    
    // Apply stored position and size
    legendContainer.style.left = position.left + 'px';
    legendContainer.style.top = position.top + 'px';
    if (position.width) {
      legendContainer.style.width = position.width + 'px';
    }
    if (position.height && position.height !== 'auto') {
      legendContainer.style.height = position.height + 'px';
    }
    
    // Clear previous content
    legendContainer.innerHTML = '';
    
    // Add resize handles
    const directions = ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'];
    directions.forEach(dir => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-${dir}`;
      handle.dataset.direction = dir;
      
      // Set cursor style based on direction
      switch (dir) {
        case 'n':
        case 's':
          handle.style.cursor = 'ns-resize';
          break;
        case 'e':
        case 'w':
          handle.style.cursor = 'ew-resize';
          break;
        case 'ne':
        case 'sw':
          handle.style.cursor = 'nesw-resize';
          break;
        case 'nw':
        case 'se':
          handle.style.cursor = 'nwse-resize';
          break;
      }
      
      legendContainer.appendChild(handle);
    });
    
    // Create legend items container
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'legend-items-container';
    legendContainer.appendChild(itemsContainer);
    
    // Add all legend items
    legendItems.forEach(item => {
      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      
      const colorBox = document.createElement('span');
      colorBox.className = 'legend-color';
      colorBox.style.backgroundColor = item.fillStyle;
      colorBox.style.borderColor = item.strokeStyle;
      
      const text = document.createElement('span');
      text.className = 'legend-text';
      text.textContent = item.text;
      
      legendItem.appendChild(colorBox);
      legendItem.appendChild(text);
      itemsContainer.appendChild(legendItem);
    });
    
    // Update layout of legend items and calculate minimum dimensions
    const dimensions = updateLegendLayout(legendContainer);
    
    // Apply minimum dimensions if current size is smaller
    if (dimensions) {
      const currentWidth = legendContainer.offsetWidth;
      const currentHeight = legendContainer.offsetHeight;
      
      if (currentWidth < dimensions.minWidth) {
        legendContainer.style.width = dimensions.minWidth + 'px';
        position.width = dimensions.minWidth;
        legendContainer.dataset.position = JSON.stringify(position);
      }
      
      if (currentHeight < dimensions.minHeight) {
        legendContainer.style.height = dimensions.minHeight + 'px';
        position.height = dimensions.minHeight;
        legendContainer.dataset.position = JSON.stringify(position);
      }
    }
  }
}; 
