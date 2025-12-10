# Premium Graph Tool for Educational Website

This document provides a comprehensive guide to the premium-grade, dark-themed, and fully responsive graphing tool that has been added to the educational website.

## Overview

The Graph Tool is a high-quality, interactive graphing utility that allows users to plot data points in the positive X and Y axes (first quadrant only). It features a modern dark theme, responsive design, and premium user experience.

## Features

- **Dark-themed, premium UI**: Sleek, modern interface with smooth animations and transitions
- **Positive-quadrant only**: Displays only the first quadrant (X ≥ 0, Y ≥ 0)
- **Configurable axis ranges**: Users can set maximum X and Y values
- **Interactive data table**: Add, remove, and edit data points with real-time graph updates
- **Line connection toggle**: Option to display points only or connect them with lines
- **Export functionality**: Save the graph as a PNG image
- **Responsive design**: Works on all device sizes
- **Accessibility features**: Keyboard navigation, ARIA labels, and focus management
- **High-performance rendering**: Handles up to 100 data points smoothly
- **Fixed modal positioning**: Modal stays centered and doesn't move when scrolling
- **Background interaction prevention**: Site in the background is not interactive when the modal is open
- **Fixed data table header**: The "Data Points" header and "Add Point" button remain visible when scrolling through data points

## Implementation Details

### Files Added

1. **CSS**: `css/graph-tool.css` - Contains all styling for the graph tool
2. **JavaScript**: `js/graph-tool.js` - Contains all functionality for the graph tool
3. **Library**: Chart.js (added via CDN) - Powers the graphing functionality

### Integration Points

- A "Graph Tool" button has been added to the header of the homepage only
- The button opens a modal dialog containing the graphing interface
- The tool is fully self-contained and doesn't interfere with existing functionality

## User Guide

### Opening the Graph Tool

1. Navigate to the homepage of the educational website
2. Click the "Graph Tool" button in the header navigation
3. The graph tool modal will open with a smooth animation

### Setting Axis Ranges

1. In the right panel, find the "X-axis Maximum" and "Y-axis Maximum" inputs
2. Enter your desired maximum values (minimum is always 0)
3. The graph will automatically update to reflect the new ranges

### Managing Data Points

1. The data table in the right panel shows all current data points
2. Each row represents one (X, Y) coordinate pair
3. To add a point:
   - Click the "Add Point" button
   - A new row will appear with default values (0, 0)
   - Edit the X and Y values as needed
4. To edit a point:
   - Simply change the values in the X or Y input fields
   - The graph updates in real-time as you type
5. To remove a point:
   - Click the "×" button at the end of the row
   - The point will be removed and the graph will update

### Graph Display Options

1. "Connect Points with Lines" toggle:
   - When enabled (default), points are connected with lines
   - When disabled, only individual points are shown
2. The graph automatically sorts points by X value for proper line connections

### Exporting the Graph

1. Click the "Export as Image" button in the right panel
2. The graph will be downloaded as a PNG image file
3. The image includes the current graph state with all points and settings

### Keyboard Navigation

- Press `ESC` to close the modal
- Use `TAB` to navigate between interactive elements
- Use `ENTER` or `SPACE` to activate buttons
- Use arrow keys to adjust number inputs

## Technical Implementation

### Chart.js Configuration

The graph is implemented using Chart.js with a custom configuration:

- Type: Scatter plot with optional line connections
- Scales: Custom X and Y axes with minimum 0
- Colors: Dark theme with orange accent colors
- Animations: Smooth transitions when data changes
- Tooltips: Custom tooltips showing exact coordinates

### Responsive Design

The graph tool is fully responsive:

- On larger screens: Side-by-side layout with graph on left, controls on right
- On smaller screens: Stacked layout with graph above controls
- The canvas resizes dynamically to fit available space
- The data table becomes scrollable when it contains many points

### Modal Behavior

The graph tool modal has been designed with optimal user experience in mind:

- Modal is fixed in the center of the screen and doesn't move when scrolling
- Background content is non-interactive when the modal is open (pointer events disabled)
- Scrolling within the modal doesn't affect the page behind it
- The data table header remains fixed at the top when scrolling through data points

### Accessibility

The graph tool follows accessibility best practices:

- Proper ARIA roles and labels
- Keyboard navigation support
- Focus management when opening/closing the modal
- High contrast colors for readability
- Semantic HTML structure

## Customization Options

If you wish to customize the graph tool, here are some key areas to modify:

### Colors and Theme

Edit the CSS variables at the top of `css/graph-tool.css`:

```css
:root {
  --graph-dark-bg: #141414;
  --graph-dark-secondary: #1e1e1e;
  --graph-dark-tertiary: #2a2a2a;
  --graph-accent: #ff8800;
  --graph-accent-hover: #ff6600;
  /* ... other variables ... */
}
```

### Default Values

Edit the default values in the HTML template in `js/graph-tool.js`:

```javascript
// For axis ranges
<input type="number" id="x-max" min="1" value="100" aria-label="X-axis maximum value">
<input type="number" id="y-max" min="1" value="100" aria-label="Y-axis maximum value">

// For initial data points
<td><input type="number" min="0" step="any" value="10" class="x-value" aria-label="X value"></td>
<td><input type="number" min="0" step="any" value="20" class="y-value" aria-label="Y value"></td>
```

### Chart Options

Modify the Chart.js configuration in the `initializeGraph()` function in `js/graph-tool.js`:

```javascript
graphChart = new Chart(ctx, {
  type: 'scatter',
  data: {
    datasets: [{
      // Dataset options
    }]
  },
  options: {
    // Chart options
  }
});
```

## Troubleshooting

### Graph Not Displaying

- Ensure Chart.js is properly loaded
- Check browser console for any JavaScript errors
- Verify that the canvas element has proper dimensions

### Data Points Not Updating

- Check that event listeners are properly attached
- Ensure the data table inputs have the correct classes
- Verify that the `updateGraph()` function is being called

### Export Not Working

- Ensure the browser supports canvas data URL export
- Check if there are any Content Security Policy restrictions
- Try using a different browser if issues persist

### Modal Interaction Issues

- If the modal moves when scrolling, check that the CSS positioning is correct
- If background content is still interactive, verify the `graph-modal-open` class is being applied to the body
- If the data table header scrolls away, check the `position: sticky` CSS property

## Browser Compatibility

The graph tool has been tested and works in:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Android Chrome)

## Credits

- Chart.js: https://www.chartjs.org/
- Icons and design inspiration: Material Design 