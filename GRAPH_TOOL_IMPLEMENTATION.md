# Graph Tool Implementation Guide

This guide provides step-by-step instructions for implementing the premium graphing tool on your educational website.

## Implementation Steps

### Step 1: Add the Required Files

1. Create a new CSS file:
   - Path: `css/graph-tool.css`
   - This file contains all the styling for the graph tool

2. Create a new JavaScript file:
   - Path: `js/graph-tool.js`
   - This file contains all the functionality for the graph tool

### Step 2: Update the Homepage (index.html)

1. Add the CSS link in the `<head>` section:
   ```html
   <link rel="stylesheet" href="css/graph-tool.css">
   ```

2. Add the Chart.js library before your other scripts:
   ```html
   <!-- Chart.js for Graph Tool -->
   <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
   ```

3. Add the Graph Tool script after Chart.js:
   ```html
   <!-- Graph Tool Script -->
   <script src="js/graph-tool.js" defer></script>
   ```

### Step 3: Verify Implementation

1. Open the homepage (index.html) in your browser
2. You should see a new "Graph Tool" button in the header navigation
3. Click the button to open the graph tool modal
4. Test the following functionality:
   - Adding and removing data points
   - Changing axis ranges
   - Toggling line connections
   - Exporting the graph as an image
   - Verify the modal stays centered when scrolling
   - Confirm the background is not interactive when the modal is open
   - Check that the data points header stays visible when scrolling through the table

## Key Features

### Fixed Modal Positioning

The graph tool modal is fixed in the center of the screen and doesn't move when scrolling. This is achieved through:

```css
.graph-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  overflow: hidden;
}
```

### Background Interaction Prevention

When the modal is open, the site in the background is not interactive. This is implemented using:

```css
body.graph-modal-open {
  overflow: hidden;
  pointer-events: none;
}

body.graph-modal-open .graph-modal {
  pointer-events: auto;
}
```

And in JavaScript:

```javascript
function openGraphModal() {
  // ...
  document.body.classList.add('graph-modal-open');
  // ...
}

function closeGraphModal() {
  // ...
  document.body.classList.remove('graph-modal-open');
  // ...
}
```

### Fixed Data Points Header

The "Data Points" header and "Add Point" button remain visible when scrolling through the data table:

```css
.table-header {
  position: sticky;
  top: 0;
  z-index: 5;
  background-color: var(--graph-dark-secondary);
  border-bottom: 1px solid var(--graph-border);
}
```

## Customization Options

### Changing the Button Position

If you want to move the Graph Tool button to a different location in the header:

1. Open `js/graph-tool.js`
2. Find the `addGraphToolButton()` function
3. Modify the code to append the button to a different element

For example, to add it to the right navigation instead of the left:

```javascript
function addGraphToolButton() {
  const navRight = document.querySelector('.nav-right');
  
  if (navRight) {
    const graphToolLi = document.createElement('li');
    const graphToolButton = document.createElement('button');
    
    graphToolButton.id = 'graph-tool-button';
    graphToolButton.className = 'graph-tool-button';
    graphToolButton.textContent = 'Graph Tool';
    
    graphToolButton.addEventListener('click', openGraphModal);
    
    graphToolLi.appendChild(graphToolButton);
    navRight.appendChild(graphToolLi);
  }
}
```

### Changing the Color Scheme

To change the color scheme of the graph tool:

1. Open `css/graph-tool.css`
2. Find the `:root` section at the top of the file
3. Modify the CSS variables to match your desired colors

```css
:root {
  --graph-dark-bg: #141414;          /* Modal background */
  --graph-dark-secondary: #1e1e1e;   /* Panel backgrounds */
  --graph-dark-tertiary: #2a2a2a;    /* Input backgrounds */
  --graph-accent: #ff8800;           /* Primary accent color */
  --graph-accent-hover: #ff6600;     /* Hover accent color */
  --graph-text: #ffffff;             /* Primary text color */
  --graph-text-secondary: #aaaaaa;   /* Secondary text color */
  --graph-border: #333333;           /* Border color */
  --graph-shadow: rgba(0, 0, 0, 0.5); /* Shadow color */
  --graph-grid: #333333;             /* Graph grid color */
  --graph-axis: #555555;             /* Graph axis color */
  --graph-point: #ff8800;            /* Data point color */
  --graph-line: #ff6600;             /* Line color */
}
```

### Adding the Graph Tool to Other Pages

By default, the Graph Tool button only appears on the homepage. To add it to other pages:

1. Open `js/graph-tool.js`
2. Find this code in the DOMContentLoaded event listener:

```javascript
// Add Graph Tool button to the header (only on homepage)
if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
  addGraphToolButton();
}
```

3. Modify it to include other pages:

```javascript
// Add Graph Tool button to the header on multiple pages
if (
  window.location.pathname.endsWith('index.html') || 
  window.location.pathname.endsWith('/') ||
  window.location.pathname.endsWith('physics.html') ||
  window.location.pathname.endsWith('mathematics.html')
) {
  addGraphToolButton();
}
```

## Troubleshooting

### Button Not Appearing

If the Graph Tool button doesn't appear in the header:

1. Check the browser console for any JavaScript errors
2. Verify that the `.nav-left` element exists in your HTML
3. Make sure the `graph-tool.js` file is being loaded correctly

### Modal Not Opening

If clicking the button doesn't open the modal:

1. Check the browser console for any JavaScript errors
2. Verify that the `openGraphModal()` function is being called
3. Make sure the modal HTML is being correctly appended to the body

### Graph Not Rendering

If the graph doesn't appear in the modal:

1. Check that Chart.js is properly loaded
2. Verify that the canvas element has proper dimensions
3. Check the browser console for any Chart.js errors

### Modal Positioning Issues

If the modal doesn't stay centered or moves when scrolling:

1. Verify the CSS positioning properties in `.graph-content`
2. Check that the modal has `position: fixed` and proper transform values
3. Ensure the modal has `overflow: hidden` to prevent unwanted scrolling

### Background Still Interactive

If the background is still interactive when the modal is open:

1. Verify that the `graph-modal-open` class is being added to the body element
2. Check the CSS for `body.graph-modal-open` has `pointer-events: none`
3. Ensure the modal itself has `pointer-events: auto` to allow interaction

### Data Table Header Not Sticky

If the data table header doesn't stay visible when scrolling:

1. Check that the `.table-header` has `position: sticky` and `top: 0`
2. Verify it has a proper `z-index` value to appear above the table content
3. Ensure the header has a background color to hide content scrolling underneath

## Advanced Customization

### Adding More Graph Options

To add more options to the graph tool:

1. Add new HTML elements to the graph options section in `createGraphModal()`
2. Add corresponding event listeners
3. Update the `updateGraph()` function to handle the new options

For example, to add a point size option:

```javascript
// In the HTML template
<div class="option-group">
  <label for="point-size">Point Size:</label>
  <input type="range" id="point-size" min="1" max="10" value="6">
</div>

// Add event listener
document.getElementById('point-size').addEventListener('input', updateGraph);

// Update the updateGraph function
function updateGraph() {
  // Existing code...
  
  const pointSize = parseInt(document.getElementById('point-size').value);
  graphChart.data.datasets[0].pointRadius = pointSize;
  
  // Rest of the function...
}
```

### Supporting Negative Values

The current implementation only supports positive X and Y values. If you want to allow negative values:

1. Remove the `min="0"` attribute from the input elements
2. Update the axis configuration in `initializeGraph()`:

```javascript
scales: {
  x: {
    type: 'linear',
    position: 'bottom',
    // Remove min: 0,
    max: xMax,
    // Rest of the configuration...
  },
  y: {
    // Remove min: 0,
    max: yMax,
    // Rest of the configuration...
  }
}
```

## Performance Considerations

The graph tool is designed to handle up to 100 data points smoothly. If you need to support more data points:

1. Consider implementing pagination in the data table
2. Optimize the Chart.js configuration for performance
3. Add a warning when too many points are added

## Browser Support

The graph tool uses modern JavaScript and CSS features. It should work in all modern browsers, including:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

For older browsers, you may need to add polyfills or adjust the code accordingly. 