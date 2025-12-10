// lectures/physics/kinematics/lecture2.js

document.addEventListener('DOMContentLoaded', function() {
  // Get the load simulation button
  const loadSimulationButton = document.getElementById('load-simulation');
  
  // Add click event listener to the button
  loadSimulationButton.addEventListener('click', function() {
    // Create the simulation container
    const simulationContainer = document.getElementById('simulation-container');
    
    // Clear the container
    simulationContainer.innerHTML = '';
    
    // Create the canvas element
    const canvas = document.createElement('canvas');
    canvas.id = 'simulation-canvas';
    canvas.width = 600;
    canvas.height = 300;
    canvas.style.border = '1px solid #fff';
    canvas.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    simulationContainer.appendChild(canvas);
    
    // Create controls
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'simulation-controls';
    controlsDiv.style.marginTop = '10px';
    controlsDiv.style.color = '#ffffff';
    
    // Initial velocity control
    const velocityLabel = document.createElement('label');
    velocityLabel.textContent = 'Initial Velocity (m/s): ';
    velocityLabel.htmlFor = 'velocity-input';
    velocityLabel.style.color = '#ffffff';
    controlsDiv.appendChild(velocityLabel);
    
    const velocityInput = document.createElement('input');
    velocityInput.type = 'range';
    velocityInput.id = 'velocity-input';
    velocityInput.min = '-10';
    velocityInput.max = '10';
    velocityInput.value = '0';
    velocityInput.step = '1';
    controlsDiv.appendChild(velocityInput);
    
    const velocityValue = document.createElement('span');
    velocityValue.id = 'velocity-value';
    velocityValue.textContent = '0';
    velocityValue.style.marginLeft = '5px';
    velocityValue.style.color = '#ffffff';
    controlsDiv.appendChild(velocityValue);
    
    controlsDiv.appendChild(document.createElement('br'));
    
    // Acceleration control
    const accelerationLabel = document.createElement('label');
    accelerationLabel.textContent = 'Acceleration (m/s²): ';
    accelerationLabel.htmlFor = 'acceleration-input';
    accelerationLabel.style.color = '#ffffff';
    controlsDiv.appendChild(accelerationLabel);
    
    const accelerationInput = document.createElement('input');
    accelerationInput.type = 'range';
    accelerationInput.id = 'acceleration-input';
    accelerationInput.min = '-5';
    accelerationInput.max = '5';
    accelerationInput.value = '0';
    accelerationInput.step = '0.5';
    controlsDiv.appendChild(accelerationInput);
    
    const accelerationValue = document.createElement('span');
    accelerationValue.id = 'acceleration-value';
    accelerationValue.textContent = '0';
    accelerationValue.style.marginLeft = '5px';
    accelerationValue.style.color = '#ffffff';
    controlsDiv.appendChild(accelerationValue);
    
    controlsDiv.appendChild(document.createElement('br'));
    
    // Start/Reset button
    const startButton = document.createElement('button');
    startButton.textContent = 'Start';
    startButton.className = 'button';
    startButton.style.marginTop = '10px';
    controlsDiv.appendChild(startButton);
    
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset';
    resetButton.className = 'button';
    resetButton.style.marginLeft = '10px';
    resetButton.style.marginTop = '10px';
    controlsDiv.appendChild(resetButton);
    
    simulationContainer.appendChild(controlsDiv);
    
    // Get the canvas context
    const ctx = canvas.getContext('2d');
    
    // Simulation variables
    let position = 50; // Starting position (pixels from left)
    let velocity = 0;  // Initial velocity (pixels per frame)
    let acceleration = 0; // Acceleration (pixels per frame per frame)
    let isRunning = false;
    let animationId = null;
    
    // Scale factors (for display purposes)
    const positionScale = 5;  // 1 m = 5 pixels
    const timeScale = 0.1;    // 1 frame = 0.1 seconds
    
    // Update display values
    function updateDisplayValues() {
      velocityValue.textContent = velocityInput.value;
      accelerationValue.textContent = accelerationInput.value;
    }
    
    // Draw the simulation
    function drawSimulation() {
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the ground (x-axis)
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      
      // Draw position markers
      for (let x = 0; x <= canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, canvas.height / 2 - 5);
        ctx.lineTo(x, canvas.height / 2 + 5);
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${x / positionScale}m`, x, canvas.height / 2 + 20);
      }
      
      // Draw the object
      ctx.beginPath();
      ctx.arc(position, canvas.height / 2 - 15, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#ff6b6b';
      ctx.fill();
      
      // Draw current position, velocity, and acceleration
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Position: ${(position / positionScale).toFixed(1)} m`, 10, 20);
      ctx.fillText(`Velocity: ${(velocity / (positionScale * timeScale)).toFixed(1)} m/s`, 10, 40);
      ctx.fillText(`Acceleration: ${(acceleration / (positionScale * timeScale * timeScale)).toFixed(1)} m/s²`, 10, 60);
    }
    
    // Update the simulation
    function updateSimulation() {
      if (isRunning) {
        // Update position and velocity based on kinematic equations
        position += velocity;
        velocity += acceleration;
        
        // Check boundaries
        if (position < 0 || position > canvas.width) {
          isRunning = false;
          startButton.textContent = 'Start';
          alert('Object has left the visible area!');
        }
        
        // Draw the updated simulation
        drawSimulation();
        
        // Continue the animation
        animationId = requestAnimationFrame(updateSimulation);
      }
    }
    
    // Event listeners for controls
    velocityInput.addEventListener('input', function() {
      updateDisplayValues();
    });
    
    accelerationInput.addEventListener('input', function() {
      updateDisplayValues();
    });
    
    startButton.addEventListener('click', function() {
      if (isRunning) {
        // Pause the simulation
        isRunning = false;
        startButton.textContent = 'Start';
        cancelAnimationFrame(animationId);
      } else {
        // Start the simulation
        isRunning = true;
        startButton.textContent = 'Pause';
        
        // Set initial values
        velocity = parseFloat(velocityInput.value) * positionScale * timeScale;
        acceleration = parseFloat(accelerationInput.value) * positionScale * timeScale * timeScale;
        
        // Start the animation
        updateSimulation();
      }
    });
    
    resetButton.addEventListener('click', function() {
      // Reset the simulation
      isRunning = false;
      startButton.textContent = 'Start';
      cancelAnimationFrame(animationId);
      
      // Reset position
      position = 50;
      
      // Reset controls
      velocityInput.value = '0';
      accelerationInput.value = '0';
      updateDisplayValues();
      
      // Draw the reset simulation
      drawSimulation();
    });
    
    // Initialize
    updateDisplayValues();
    drawSimulation();
  });
}); 