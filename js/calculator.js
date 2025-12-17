// Scientific Calculator with LaTeX support using MathQuill
let calculatorBooted = false;
document.addEventListener('DOMContentLoaded', () => {
  const calculatorButton = document.getElementById('calculator-button');
  if (!calculatorButton) return;
  calculatorButton.addEventListener('click', (event) => {
    if (calculatorBooted) return;
    calculatorBooted = true;
    event.preventDefault();
    bootCalculator();
    // Re-fire click to open now that listeners are bound
    setTimeout(() => calculatorButton.click(), 0);
  }, { once: true });
});

function bootCalculator() {
  console.log('DOMContentLoaded event fired');
  
  // Check if MathQuill is defined
  if (typeof MathQuill === 'undefined') {
    console.error('MathQuill is not defined. Make sure the library is loaded correctly.');
    return; // Exit early if MathQuill is not available
  }
  
  // Make MathQuill global for easy access
  var MQ;
  try {
    console.log('Attempting to get MathQuill interface');
    MQ = MathQuill.getInterface(2);
    console.log('MathQuill interface loaded:', MQ ? 'success' : 'failed');
  } catch (error) {
    console.error('Error loading MathQuill:', error);
  }
  
  // Create calculator modal
  const calculatorModal = document.createElement('div');
  calculatorModal.id = 'calculator-modal';
  calculatorModal.className = 'calculator-modal';
  
  // Create calculator content
  calculatorModal.innerHTML = `
    <div class="calculator-content">
      <div class="calculator-header">
        <span class="calculator-close">&times;</span>
      </div>
      <div class="calculator-body">
        <div class="calculator-editor-container">
          <div id="math-field" class="calculator-latex-editor"></div>
          <div id="result-display" class="calculator-result"></div>
        </div>
        
        <!-- Calculator Tab Navigation -->
        <div class="calculator-tabs">
          <div class="calculator-tabs-left">
            <button class="calculator-tab-btn active" data-tab="basic">Basic</button>
            <button class="calculator-tab-btn" data-tab="functions">Functions</button>
            <button class="calculator-tab-btn" data-tab="advanced">Advanced</button>
          </div>
          <div class="calculator-tabs-right">
            <div class="angle-mode-toggle">
              <button class="angle-mode-btn active" data-mode="deg">DEG</button>
              <button class="angle-mode-btn" data-mode="rad">RAD</button>
            </div>
            <button class="calculator-tab-btn history-btn" id="history-button">History</button>
          </div>
        </div>
        
        <!-- Calculator Pages -->
        <div class="calculator-pages">
          <!-- Basic Calculator Page -->
          <div class="calculator-page active" id="basic-page">
            <div class="calculator-buttons">
              <button data-insert="7">7</button>
              <button data-insert="8">8</button>
              <button data-insert="9">9</button>
              <button class="operator-btn" data-action="fraction">÷</button>
              
              <button data-insert="4">4</button>
              <button data-insert="5">5</button>
              <button data-insert="6">6</button>
              <button class="operator-btn" data-insert="\\cdot">×</button>
              
              <button data-insert="1">1</button>
              <button data-insert="2">2</button>
              <button data-insert="3">3</button>
              <button class="operator-btn" data-insert="-">−</button>
              
              <button data-insert=".">.</button>
              <button data-insert="0">0</button>
              <button data-insert="\\pi">π</button>
              <button class="operator-btn" data-insert="+">+</button>
              
              <button data-insert="(">( )</button>
              <button data-insert="^">^</button>
              <button class="operator-btn" data-action="percentage">%</button>
              <button class="operator-btn" data-action="power-of-ten">×10<sup>n</sup></button>
            </div>
          </div>
          
          <!-- Functions Calculator Page -->
          <div class="calculator-page" id="functions-page">
            <div class="calculator-sub-tabs">
              <button class="calculator-sub-tab-btn active" data-subtab="trig">Trig</button>
              <button class="calculator-sub-tab-btn" data-subtab="inverse">Inverse</button>
              <button class="calculator-sub-tab-btn" data-subtab="hyperbolic">Hyperbolic</button>
              <button class="calculator-sub-tab-btn" data-subtab="inverse-hyp">Inv Hyp</button>
            </div>
            
            <!-- Trigonometric Functions -->
            <div class="calculator-sub-page active" id="trig-sub-page">
              <div class="calculator-buttons">
                <button class="function-btn" data-insert="\\sin">sin</button>
                <button class="function-btn" data-insert="\\cos">cos</button>
                <button class="function-btn" data-insert="\\tan">tan</button>
                <button class="function-btn" data-insert="\\csc">csc</button>
                
                <button class="function-btn" data-insert="\\sec">sec</button>
                <button class="function-btn" data-insert="\\cot">cot</button>
              </div>
            </div>
            
            <!-- Inverse Trigonometric Functions -->
            <div class="calculator-sub-page" id="inverse-sub-page">
              <div class="calculator-buttons">
                <button class="function-btn" data-insert="\\sin^{-1}">sin⁻¹</button>
                <button class="function-btn" data-insert="\\cos^{-1}">cos⁻¹</button>
                <button class="function-btn" data-insert="\\tan^{-1}">tan⁻¹</button>
                <button class="function-btn" data-insert="\\csc^{-1}">csc⁻¹</button>
                
                <button class="function-btn" data-insert="\\sec^{-1}">sec⁻¹</button>
                <button class="function-btn" data-insert="\\cot^{-1}">cot⁻¹</button>
              </div>
            </div>
            
            <!-- Hyperbolic Functions -->
            <div class="calculator-sub-page" id="hyperbolic-sub-page">
              <div class="calculator-buttons">
                <button class="function-btn" data-insert="\\sinh">sinh</button>
                <button class="function-btn" data-insert="\\cosh">cosh</button>
                <button class="function-btn" data-insert="\\tanh">tanh</button>
                <button class="function-btn" data-insert="\\csch">csch</button>
                
                <button class="function-btn" data-insert="\\sech">sech</button>
                <button class="function-btn" data-insert="\\coth">coth</button>
              </div>
            </div>
            
            <!-- Inverse Hyperbolic Functions -->
            <div class="calculator-sub-page" id="inverse-hyp-sub-page">
              <div class="calculator-buttons">
                <button class="function-btn" data-insert="\\sinh^{-1}">sinh⁻¹</button>
                <button class="function-btn" data-insert="\\cosh^{-1}">cosh⁻¹</button>
                <button class="function-btn" data-insert="\\tanh^{-1}">tanh⁻¹</button>
                <button class="function-btn" data-insert="\\csch^{-1}">csch⁻¹</button>
                
                <button class="function-btn" data-insert="\\sech^{-1}">sech⁻¹</button>
                <button class="function-btn" data-insert="\\coth^{-1}">coth⁻¹</button>
              </div>
            </div>
          </div>
          
          <!-- Advanced Calculator Page -->
          <div class="calculator-page" id="advanced-page">
            <div class="calculator-buttons">
              <button class="function-btn" data-insert="\\log_{10}">log</button>
              <button class="function-btn" data-insert="\\ln">ln</button>
              <button class="function-btn" data-insert="\\sqrt">√</button>
              <button class="function-btn" data-insert="!">!</button>
              
              <button class="function-btn" data-insert="\\sum">∑</button>
              <button class="function-btn" data-insert="\\prod">∏</button>
              <button class="function-btn" data-insert="\\lim">lim</button>
              
              <button class="function-btn" data-insert="{">{ }</button>
              <button class="function-btn" data-insert="e">e</button>
              <button class="function-btn" data-insert="\\infty">∞</button>
            </div>
          </div>
        </div>
        
        <!-- Fixed Action Buttons (always visible) -->
        <div class="calculator-fixed-buttons">
          <button class="clear-btn" id="clear-button">Clear</button>
          <button class="equals-btn" id="solve-button">Solve</button>
        </div>
      </div>
    </div>
  `;
  
  // Initialize variables to hold MathQuill instances
  let mathField = null;
  let resultDisplay = null;
  
  // Array to store equation history
  let equationHistory = [];
  
  // Create history modal
  const historyOverlay = document.createElement('div');
  historyOverlay.className = 'history-overlay';
  
  const historyModal = document.createElement('div');
  historyModal.className = 'history-modal';
  historyModal.innerHTML = `
    <div class="history-content">
      <div class="history-header">
        <div class="history-title">Equation History</div>
        <span class="history-close">&times;</span>
      </div>
      <div class="history-body">
        <div class="history-empty">Your solved equations will be stored here...</div>
        <ul class="history-list"></ul>
      </div>
    </div>
  `;
  
  // Global variable to track angle mode (degrees or radians)
  let angleMode = 'deg'; // Default to degrees
  
  // Function to reset page visibility
  function resetPageVisibility() {
    const pages = calculatorModal.querySelectorAll('.calculator-page');
    const subPages = calculatorModal.querySelectorAll('.calculator-sub-page');
    
    // Hide all pages first
    pages.forEach(page => {
      page.classList.remove('active');
      page.style.display = 'none';
    });
    
    // Show only the active page
    const activeTabButton = calculatorModal.querySelector('.calculator-tab-btn.active:not(.history-btn)');
    if (activeTabButton) {
      const activeTabId = activeTabButton.getAttribute('data-tab');
      const activePage = document.getElementById(`${activeTabId}-page`);
      if (activePage) {
        activePage.classList.add('active');
        activePage.style.display = 'block';
      }
    } else {
      // Default to basic page if no active tab
      const basicPage = document.getElementById('basic-page');
      if (basicPage) {
        basicPage.classList.add('active');
        basicPage.style.display = 'block';
      }
    }
    
    // Hide all sub-pages first
    subPages.forEach(page => {
      page.classList.remove('active');
      page.style.display = 'none';
    });
    
    // Show only the active sub-pages
    const activeSubTabButtons = calculatorModal.querySelectorAll('.calculator-sub-tab-btn.active');
    activeSubTabButtons.forEach(button => {
      const activeSubTabId = button.getAttribute('data-subtab');
      const activeSubPage = document.getElementById(`${activeSubTabId}-sub-page`);
      if (activeSubPage) {
        activeSubPage.classList.add('active');
        activeSubPage.style.display = 'block';
      }
    });
  }
  
  // Initialize calculator when opened
  function initCalculator() {
    console.log('initCalculator function called');
    
    // Find the existing calculator button instead of creating a new one
    const calculatorButton = document.getElementById('calculator-button');
    console.log('Calculator button found:', calculatorButton ? 'yes' : 'no');
    
    // Add calculator modal to the document
    document.body.appendChild(calculatorModal);
    console.log('Calculator modal appended to document body');
    
    // Add history overlay and modal to the calculator content
    const calculatorContent = calculatorModal.querySelector('.calculator-content');
    calculatorContent.appendChild(historyOverlay);
    calculatorContent.appendChild(historyModal);
    console.log('History modal appended to calculator content');
    
    // Initialize history functionality
    initHistory();
    
    // Initialize angle mode toggle
    initAngleModeToggle();
    
    // Open calculator when button is clicked
    if (calculatorButton) {
      calculatorButton.addEventListener('click', function() {
        console.log('Calculator button clicked');
        
        // Remove any closing animation class first
        calculatorModal.classList.remove('closing');
        
        // Get button position relative to the viewport
        const buttonRect = calculatorButton.getBoundingClientRect();
        const buttonCenterX = buttonRect.left + buttonRect.width / 2;
        const buttonCenterY = buttonRect.top + buttonRect.height / 2;
        
        // Set transform origin for the modal and content based on button position
        calculatorModal.style.transformOrigin = `${buttonCenterX}px ${buttonCenterY}px`;
        
        // Find the calculator content and set its transform origin
        const calculatorContent = calculatorModal.querySelector('.calculator-content');
        if (calculatorContent) {
          // Calculate the position relative to the content
          // This makes the content appear to come from the button
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          // Convert button position to percentage of viewport
          const originX = (buttonCenterX / viewportWidth) * 100;
          const originY = (buttonCenterY / viewportHeight) * 100;
          
          calculatorContent.style.transformOrigin = `${originX}% ${originY}%`;
        }
        
        // Show the calculator modal
        calculatorModal.style.display = 'block';
        
        // Reset page visibility - hide all pages first
        const pages = calculatorModal.querySelectorAll('.calculator-page');
        pages.forEach(page => {
          page.classList.remove('active');
          page.style.display = 'none';
        });
        
        // Show only the active page
        const activeTabButton = calculatorModal.querySelector('.calculator-tab-btn.active:not(.history-btn)');
        if (activeTabButton) {
          const activeTabId = activeTabButton.getAttribute('data-tab');
          const activePage = document.getElementById(`${activeTabId}-page`);
          if (activePage) {
            activePage.classList.add('active');
            activePage.style.display = 'block';
          }
        } else {
          // Default to basic page if no active tab
          const basicPage = document.getElementById('basic-page');
          if (basicPage) {
            basicPage.classList.add('active');
            basicPage.style.display = 'block';
          }
        }
        
        // Hide all sub-pages first
        const subPages = calculatorModal.querySelectorAll('.calculator-sub-page');
        subPages.forEach(page => {
          page.classList.remove('active');
          page.style.display = 'none';
        });
        
        // Show only the active sub-pages
        const activeSubTabButtons = calculatorModal.querySelectorAll('.calculator-sub-tab-btn.active');
        activeSubTabButtons.forEach(button => {
          const activeSubTabId = button.getAttribute('data-subtab');
          const activeSubPage = document.getElementById(`${activeSubTabId}-sub-page`);
          if (activeSubPage) {
            activeSubPage.classList.add('active');
            activeSubPage.style.display = 'block';
          }
        });
        
        // Initialize math field if not already done
        if (!mathField) {
          console.log('Initializing math field');
          initMathField();
        } else {
          console.log('Math field already initialized');
          // If already initialized, make sure placeholder is shown if empty
          if (mathField.latex() === '') {
            showPlaceholder();
          }
        }
      });
    } else {
      console.error('Calculator button not found in the document');
    }
  }
  
  // Close calculator when clicking on close button
  const closeButton = calculatorModal.querySelector('.calculator-close');
  closeButton.addEventListener('click', function() {
    // Add closing animation class
    calculatorModal.classList.add('closing');
    
    // Get calculator button position for closing animation
    const calculatorButton = document.getElementById('calculator-button');
    if (calculatorButton) {
      const buttonRect = calculatorButton.getBoundingClientRect();
      const buttonCenterX = buttonRect.left + buttonRect.width / 2;
      const buttonCenterY = buttonRect.top + buttonRect.height / 2;
      
      // Set transform origin for the modal and content based on button position
      calculatorModal.style.transformOrigin = `${buttonCenterX}px ${buttonCenterY}px`;
      
      // Find the calculator content and set its transform origin
      const calculatorContent = calculatorModal.querySelector('.calculator-content');
      if (calculatorContent) {
        // Calculate the position relative to the content
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Convert button position to percentage of viewport
        const originX = (buttonCenterX / viewportWidth) * 100;
        const originY = (buttonCenterY / viewportHeight) * 100;
        
        calculatorContent.style.transformOrigin = `${originX}% ${originY}%`;
      }
    }
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      calculatorModal.style.display = 'none';
      calculatorModal.classList.remove('closing');
    }, 300); // Match the animation duration
  });
  
  // Close calculator when clicking outside the calculator content
  window.addEventListener('click', function(event) {
    if (event.target === calculatorModal) {
      // Add closing animation class
      calculatorModal.classList.add('closing');
      
      // Get calculator button position for closing animation
      const calculatorButton = document.getElementById('calculator-button');
      if (calculatorButton) {
        const buttonRect = calculatorButton.getBoundingClientRect();
        const buttonCenterX = buttonRect.left + buttonRect.width / 2;
        const buttonCenterY = buttonRect.top + buttonRect.height / 2;
        
        // Set transform origin for the modal and content based on button position
        calculatorModal.style.transformOrigin = `${buttonCenterX}px ${buttonCenterY}px`;
        
        // Find the calculator content and set its transform origin
        const calculatorContent = calculatorModal.querySelector('.calculator-content');
        if (calculatorContent) {
          // Calculate the position relative to the content
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          // Convert button position to percentage of viewport
          const originX = (buttonCenterX / viewportWidth) * 100;
          const originY = (buttonCenterY / viewportHeight) * 100;
          
          calculatorContent.style.transformOrigin = `${originX}% ${originY}%`;
        }
      }
      
      // Wait for animation to complete before hiding
      setTimeout(() => {
        calculatorModal.style.display = 'none';
        calculatorModal.classList.remove('closing');
      }, 300); // Match the animation duration
    }
  });
  
  // Initialize math field when calculator is opened
  function initMathField() {
    console.log('initMathField function called');
    if (!mathField) {
      try {
        // Initialize the math field with MathQuill
        const mathFieldElement = document.getElementById('math-field');
        console.log('Math field element found:', mathFieldElement ? 'yes' : 'no');
        
        // Add click event to hide placeholder when field is clicked
        mathFieldElement.addEventListener('click', function() {
          console.log('Math field clicked');
          hidePlaceholder();
          if (mathField && mathField.latex() === '') {
            mathField.focus();
          }
        });
        
        // Add event listener to document to check for focus changes
        document.addEventListener('click', function(event) {
          if (!mathFieldElement.contains(event.target) && mathField && mathField.latex() === '') {
            showPlaceholder();
          }
        });
        
        console.log('Creating MathQuill math field');
        mathField = MQ.MathField(mathFieldElement, {
          spaceBehavesLikeTab: true,
          handlers: {
            edit: function() {
              // Auto-solve if equals sign is present
              const latex = mathField.latex();
              if (latex.includes('=')) {
                solveEquation(latex);
              }
              
              // Show/hide placeholder text based on content
              if (latex === '') {
                // Only show placeholder if field is not focused
                if (!mathFieldElement.classList.contains('mq-focused')) {
                  showPlaceholder();
                }
              } else {
                hidePlaceholder();
              }
            },
            enter: function() {
              solveEquation(mathField.latex());
            },
            blur: function() {
              // Show placeholder when field loses focus and is empty
              if (mathField.latex() === '') {
                showPlaceholder();
              }
            },
            focus: function() {
              // Hide placeholder when field gains focus
              hidePlaceholder();
            }
          }
        });
        
        // Add placeholder text
        showPlaceholder();
        
        // Initialize the result display area with static MathQuill
        const resultElement = document.getElementById('result-display');
        resultDisplay = MQ.StaticMath(resultElement, {
          // Ensure it's truly static with no cursor
          mouseEvents: false,
          autoSubscriptNumerals: true
        });
        
        // Apply dark theme styles to MathQuill elements
        applyDarkThemeToMathQuill();
        
        // Render LaTeX in buttons
        renderLatexButtons();
        
        // Initialize button event listeners for calculator
        initButtons();
        
        // Initialize tab navigation
        initTabs();
        
        // Initialize sub-tab navigation
        initSubTabs();
      } catch (error) {
        console.error('Error initializing MathQuill:', error);
        document.getElementById('math-field').innerHTML = 
          '<div class="error-message">Error initializing LaTeX editor. Please try refreshing the page.</div>';
      }
    }
    
    // Focus the math field
    if (mathField) {
      setTimeout(() => {
        mathField.focus();
      }, 100);
    }
  }
  
  // Apply dark theme styles to MathQuill elements
  function applyDarkThemeToMathQuill() {
    // Force cursor to be white and hide it in result display
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .mq-cursor {
        border-left: 1px solid white !important;
      }
      .mq-math-mode, .mq-editable-field, .mq-root-block {
        color: white !important;
      }
      #result-display .mq-cursor {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
      #result-display .mq-blink {
        animation: none !important;
      }
    `;
    document.head.appendChild(styleElement);
  }
  
  // Render LaTeX in buttons
  function renderLatexButtons() {
    const latexButtons = document.querySelectorAll('.latex-btn');
    latexButtons.forEach(button => {
      const latex = button.getAttribute('data-latex');
      if (latex) {
        // Create a span for the LaTeX content
        const span = document.createElement('span');
        span.className = 'latex-content';
        button.innerHTML = '';
        button.appendChild(span);
        
        // Render the LaTeX using MathQuill
        const staticMath = MQ.StaticMath(span);
        staticMath.latex(latex);
      }
    });
  }
  
  // Initialize tab navigation
  function initTabs() {
    const tabButtons = calculatorModal.querySelectorAll('.calculator-tab-btn');
    const pages = calculatorModal.querySelectorAll('.calculator-page');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Skip if this is the history button
        if (this.id === 'history-button') return;
        
        // Get the tab to activate
        const tabToActivate = this.getAttribute('data-tab');
        
        // Remove active class from all buttons and pages
        tabButtons.forEach(btn => {
          if (btn.id !== 'history-button') {
            btn.classList.remove('active');
          }
        });
        
        // Hide all pages first
        pages.forEach(page => {
          page.classList.remove('active');
          page.style.display = 'none'; // Explicitly hide all pages
        });
        
        // Add active class to current button and corresponding page
        this.classList.add('active');
        const activePage = document.getElementById(`${tabToActivate}-page`);
        activePage.classList.add('active');
        activePage.style.display = 'block'; // Explicitly show active page
        
        // If history is open, make sure the page is still visible but non-interactive
        if (historyOverlay.style.display === 'block') {
          // Make sure all buttons in the active page are visible
          const buttons = activePage.querySelectorAll('.calculator-buttons button');
          buttons.forEach(button => {
            button.style.display = '';
          });
        }
        
        // Focus the math field after tab change
        if (mathField) {
          mathField.focus();
        }
      });
    });
  }
  
  // Initialize sub-tab navigation for the Functions page
  function initSubTabs() {
    const subTabButtons = calculatorModal.querySelectorAll('.calculator-sub-tab-btn');
    const subPages = calculatorModal.querySelectorAll('.calculator-sub-page');
    
    subTabButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Get the sub-tab to activate
        const subTabToActivate = this.getAttribute('data-subtab');
        
        // Get the parent tab (functions, advanced, etc.)
        const parentTab = this.closest('.calculator-page').id.replace('-page', '');
        
        // Remove active class from all buttons and pages within this parent tab
        const parentTabButtons = calculatorModal.querySelectorAll(`.calculator-page#${parentTab}-page .calculator-sub-tab-btn`);
        parentTabButtons.forEach(btn => btn.classList.remove('active'));
        
        // Hide all sub-pages within this parent tab
        const parentTabPages = calculatorModal.querySelectorAll(`.calculator-page#${parentTab}-page .calculator-sub-page`);
        parentTabPages.forEach(page => {
          page.classList.remove('active');
          page.style.display = 'none'; // Explicitly hide all sub-pages
        });
        
        // Add active class to current button and corresponding page
        this.classList.add('active');
        const activeSubPage = document.getElementById(`${subTabToActivate}-sub-page`);
        activeSubPage.classList.add('active');
        activeSubPage.style.display = 'block'; // Explicitly show active sub-page
        
        // If history is open, make sure the sub-page is still visible but non-interactive
        if (historyOverlay.style.display === 'block') {
          // Make sure all buttons in the active sub-page are visible
          const buttons = activeSubPage.querySelectorAll('.calculator-buttons button');
          buttons.forEach(button => {
            button.style.display = '';
          });
        }
        
        // Focus the math field after sub-tab change
        if (mathField) {
          mathField.focus();
        }
      });
    });
  }
  
  // Initialize button event listeners
  function initButtons() {
    // Add event listeners for all calculator buttons
    const buttons = calculatorModal.querySelectorAll('.calculator-buttons button, .calculator-fixed-buttons button');
    buttons.forEach(button => {
      button.addEventListener('click', function() {
        if (!mathField) return; // Skip if mathField isn't initialized
        
        const buttonId = this.id;
        const insertValue = this.getAttribute('data-insert');
        const action = this.getAttribute('data-action');
        
        if (buttonId === 'clear-button') {
          mathField.latex('');
          resultDisplay.latex('');
          showPlaceholder();
          mathField.focus();
        } else if (buttonId === 'solve-button') {
          solveEquation(mathField.latex());
        } else if (action === 'fraction') {
          // Create a fraction with empty numerator and denominator
          mathField.cmd('\\frac');
          mathField.focus();
        } else if (action === 'percentage') {
          // Insert 1/n for percentage
          mathField.write('\\frac{1}{n}');
          mathField.focus();
        } else if (action === 'power-of-ten') {
          // Insert *10^n
          mathField.write('\\cdot 10^{}');
          mathField.keystroke('Left');
          mathField.focus();
        } else if (insertValue === '(') {
          mathField.write('\\left(\\right)');
          mathField.keystroke('Left');
        } else if (insertValue === '{') {
          mathField.write('\\{\\}');
          mathField.keystroke('Left');
        } else if (insertValue === '\\sqrt') {
          mathField.cmd('\\sqrt');
        } else if (insertValue === '^') {
          mathField.cmd('^');
        } else if (insertValue === '\\sum') {
          mathField.write('\\sum_{i=1}^{n}');
          mathField.keystroke('Right');
          mathField.focus();
        } else if (insertValue === '\\prod') {
          mathField.write('\\prod_{i=1}^{n}');
          mathField.keystroke('Right');
          mathField.focus();
        } else if (insertValue === '\\lim') {
          mathField.write('\\lim_{x \\to 0}');
          mathField.keystroke('Right');
          mathField.focus();
        } else if (insertValue === '!') {
          mathField.cmd('!');
        } else if (insertValue.includes('^{-1}')) {
          // Handle inverse functions
          const baseFunction = insertValue.split('^')[0];
          
          // Use direct LaTeX insertion with both parentheses
          const currentLatex = mathField.latex();
          mathField.latex(currentLatex + baseFunction + '^{-1}()');
          
          // Position cursor between the parentheses
          mathField.keystroke('Left');
          mathField.focus();
        } else {
          mathField.write(insertValue);
        }
        mathField.focus();
      });
    });
  }
  
  // Initialize history functionality
  function initHistory() {
    // Get history button and add click event
    const historyButton = document.getElementById('history-button');
    if (historyButton) {
      historyButton.addEventListener('click', function(event) {
        // Prevent event from propagating to other elements
        event.stopPropagation();
        
        // Ensure active calculator page and sub-page remain visible
        const activePage = document.querySelector('.calculator-page.active');
        const activeSubPage = document.querySelector('.calculator-sub-page.active');
        
        if (activePage) {
          // Force display to be block
          activePage.style.display = 'block';
          
          // Make sure all buttons in the active page are visible
          const buttons = activePage.querySelectorAll('.calculator-buttons button');
          buttons.forEach(button => {
            button.style.display = '';
          });
        }
        
        if (activeSubPage) {
          // Force display to be block
          activeSubPage.style.display = 'block';
          
          // Make sure all buttons in the active sub-page are visible
          const subButtons = activeSubPage.querySelectorAll('.calculator-buttons button');
          subButtons.forEach(button => {
            button.style.display = '';
          });
        }
        
        // Position the history modal directly next to the history button
        setTimeout(() => {
          // Get button position relative to the viewport
          const buttonRect = historyButton.getBoundingClientRect();
          
          // Check if we're on a mobile device (screen width < 600px)
          const isMobile = window.innerWidth < 600;
          
          // Get the history modal and set its position
          historyModal.style.position = 'fixed';
          
          if (isMobile) {
            // On mobile, position at the button's location but centered horizontally
            historyModal.style.top = buttonRect.top + 'px';
            historyModal.style.left = '50%';
            historyModal.style.transform = 'translateX(-50%)';
            historyModal.style.right = 'auto';
            // Set transform origin to top center for mobile
            historyModal.style.transformOrigin = 'top center';
          } else {
            // On desktop, position relative to the button
            // Check if there's enough space to the left
            if (buttonRect.left > 320) { // 300px width + 20px margin
              // Position to the left of the button, aligned with its top
              historyModal.style.top = buttonRect.top + 'px';
              historyModal.style.left = (buttonRect.left - 310) + 'px'; // Closer to button
              historyModal.style.right = 'auto';
              historyModal.style.transform = 'none';
              // Set transform origin to top right (closest to the button)
              historyModal.style.transformOrigin = 'top right';
            } else {
              // Not enough space to the left, position to the right
              historyModal.style.top = buttonRect.top + 'px';
              historyModal.style.left = 'auto';
              historyModal.style.right = (window.innerWidth - buttonRect.right - 10) + 'px'; // Closer to button
              historyModal.style.transform = 'none';
              // Set transform origin to top left (closest to the button)
              historyModal.style.transformOrigin = 'top left';
            }
          }
          
          console.log('Positioning history modal:', {
            isMobile: isMobile,
            buttonRect: {
              top: buttonRect.top,
              left: buttonRect.left,
              right: buttonRect.right,
              width: buttonRect.width,
              height: buttonRect.height
            },
            modalPosition: {
              top: historyModal.style.top,
              left: historyModal.style.left,
              right: historyModal.style.right,
              transform: historyModal.style.transform,
              transformOrigin: historyModal.style.transformOrigin
            }
          });
          
          // Add a highlight effect to the history button to show it's active
          historyButton.classList.add('active');
        }, 0);
        
        // Show history overlay and modal
        historyOverlay.style.display = 'block';
        historyModal.style.display = 'block';
        
        // Update history list
        updateHistoryList();
      });
    }
    
    // Close history modal when clicking on close button
    const historyCloseButton = historyModal.querySelector('.history-close');
    historyCloseButton.addEventListener('click', function(event) {
      // Prevent event from propagating to other elements
      event.stopPropagation();
      
      // Add closing animation classes
      historyOverlay.classList.add('closing');
      historyModal.classList.add('closing');
      
      // Wait for animation to complete before hiding
      setTimeout(() => {
        historyOverlay.style.display = 'none';
        historyModal.style.display = 'none';
        historyOverlay.classList.remove('closing');
        historyModal.classList.remove('closing');
        
        // Remove active class from history button
        const historyButton = document.getElementById('history-button');
        if (historyButton) {
          historyButton.classList.remove('active');
        }
        
        // Ensure active calculator page and sub-page remain visible after closing
        const activePage = document.querySelector('.calculator-page.active');
        const activeSubPage = document.querySelector('.calculator-sub-page.active');
        
        if (activePage) {
          // Force display to be block
          activePage.style.display = 'block';
        }
        
        if (activeSubPage) {
          // Force display to be block
          activeSubPage.style.display = 'block';
        }
      }, 200); // Match the animation duration
    });
    
    // Close history modal when clicking on the overlay
    historyOverlay.addEventListener('click', function(event) {
      // Only close if clicking directly on the overlay, not its children
      if (event.target === historyOverlay) {
        // Add closing animation classes
        historyOverlay.classList.add('closing');
        historyModal.classList.add('closing');
        
        // Wait for animation to complete before hiding
        setTimeout(() => {
          historyOverlay.style.display = 'none';
          historyModal.style.display = 'none';
          historyOverlay.classList.remove('closing');
          historyModal.classList.remove('closing');
          
          // Remove active class from history button
          const historyButton = document.getElementById('history-button');
          if (historyButton) {
            historyButton.classList.remove('active');
          }
          
          // Ensure active calculator page and sub-page remain visible after closing
          const activePage = document.querySelector('.calculator-page.active');
          const activeSubPage = document.querySelector('.calculator-sub-page.active');
          
          if (activePage) {
            // Force display to be block
            activePage.style.display = 'block';
          }
          
          if (activeSubPage) {
            // Force display to be block
            activeSubPage.style.display = 'block';
          }
        }, 200); // Match the animation duration
      }
    });
    
    // Prevent clicks on the history modal from closing it
    historyModal.addEventListener('click', function(event) {
      // Prevent event from propagating to the overlay
      event.stopPropagation();
    });
  }
  
  // Update history list in the modal
  function updateHistoryList() {
    const historyList = historyModal.querySelector('.history-list');
    const historyEmpty = historyModal.querySelector('.history-empty');
    
    // Clear current list
    historyList.innerHTML = '';
    
    // Show empty message if no history
    if (equationHistory.length === 0) {
      historyEmpty.style.display = 'block';
      historyList.style.display = 'none';
      return;
    }
    
    // Hide empty message and show list
    historyEmpty.style.display = 'none';
    historyList.style.display = 'block';
    
    // Add history items
    equationHistory.forEach((item, index) => {
      const listItem = document.createElement('li');
      listItem.className = 'history-item';
      
      // Create a span for the LaTeX content
      const span = document.createElement('span');
      span.className = 'history-latex';
      listItem.appendChild(span);
      
      // Add click event to load equation
      listItem.addEventListener('click', function(event) {
        // Prevent event from propagating
        event.stopPropagation();
        
        if (mathField) {
          mathField.latex(item.expression);
          if (resultDisplay) {
            resultDisplay.latex(item.expression + ' = ' + item.result);
          }
          
          // Add closing animation classes
          historyOverlay.classList.add('closing');
          historyModal.classList.add('closing');
          
          // Wait for animation to complete before hiding
          setTimeout(() => {
            historyOverlay.style.display = 'none';
            historyModal.style.display = 'none';
            historyOverlay.classList.remove('closing');
            historyModal.classList.remove('closing');
            
            // Remove active class from history button
            const historyButton = document.getElementById('history-button');
            if (historyButton) {
              historyButton.classList.remove('active');
            }
            
            // Focus the math field after loading equation
            setTimeout(() => {
              mathField.focus();
            }, 100);
          }, 200); // Match the animation duration
        }
      });
      
      historyList.appendChild(listItem);
      
      // Render the LaTeX using MathQuill
      try {
        const staticMath = MQ.StaticMath(span);
        staticMath.latex(item.expression + ' = ' + item.result);
      } catch (error) {
        console.error('Error rendering LaTeX in history:', error);
        span.textContent = item.expression + ' = ' + item.result;
      }
    });
  }
  
  // Function to solve the equation
  function solveEquation(latex) {
    try {
      console.log('Solving equation:', latex);
      
      // Parse the LaTeX expression
      let expression = latex;
      
      if (expression.includes('=')) {
        // For now, we'll just evaluate the left side
        expression = expression.split('=')[0].trim();
      }
      
      try {
        // Convert LaTeX to JavaScript
        const jsExpression = latexToJS(expression);
        console.log('Converted to JS:', jsExpression);
        
        // Evaluate the expression
        const result = evaluateExpression(jsExpression);
        console.log('Result:', result);
        
        // Format the result
        const formattedResult = formatResult(result);
        
        // Display the result
        if (resultDisplay) {
          resultDisplay.latex(expression + ' = ' + formattedResult);
          ensureNoCursorInResultDisplay();
          
          // Add to history
          addToHistory(expression, formattedResult);
        }
      } catch (error) {
        console.error('Error evaluating expression:', error);
        if (resultDisplay) {
          resultDisplay.latex('\\text{Error: } ' + error.message);
          ensureNoCursorInResultDisplay();
        }
      }
    } catch (error) {
      console.error('Error solving equation:', error);
      if (resultDisplay) {
        resultDisplay.latex('\\text{Error: } ' + error.message);
        ensureNoCursorInResultDisplay();
      }
    }
  }
  
  // Add equation to history
  function addToHistory(expression, result) {
    // Add to the beginning of the array (newest first)
    equationHistory.unshift({
      expression: expression,
      result: result
    });
    
    // Limit history to 50 items
    if (equationHistory.length > 50) {
      equationHistory.pop();
    }
  }
  
  // Format the result to avoid extremely long decimals and improve readability
  function formatResult(result) {
    if (result === undefined || result === null) {
      return '\\text{undefined}';
    }
    
    if (typeof result === 'number') {
      // For very small numbers close to zero
      if (Math.abs(result) < 1e-10) {
        return '0';
      }
      
      // For very large or very small numbers, use scientific notation
      if (Math.abs(result) > 1e10 || (Math.abs(result) < 1e-6 && Math.abs(result) > 0)) {
        return result.toExponential(6);
      }
      
      // For integers and simple decimals
      if (Number.isInteger(result)) {
        return result.toString();
      } else {
        // Round to reasonable precision
        return parseFloat(result.toFixed(10)).toString();
      }
    }
    
    // For non-numeric results
    return result.toString();
  }
  
  // Function to convert LaTeX to JavaScript
  function latexToJS(latex) {
    // Handle empty or undefined input
    if (!latex || latex.trim() === '') {
      return '0';
    }
    
    console.log('Original LaTeX:', latex);
    
    // First, replace trigonometric functions with our custom degree versions
    let jsExpression = latex
      // Handle pi and e constants
      .replace(/\\pi/g, 'Math.PI')
      .replace(/\\mathrm{e}/g, 'Math.E')  // In case e is written as \mathrm{e}
      .replace(/\be\b(?!\{)/g, 'Math.E')  // Only match e that's not followed by a {
      .replace(/\\infty/g, 'Infinity')
      
      // Handle inverse trigonometric functions in DEGREES (must come before regular trig functions)
      .replace(/\\sin\^\{-1\}\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'degreeAsin($1)')
      .replace(/\\sin\^\{-1\}\s*\{\s*([^}]*)\s*\}/g, 'degreeAsin($1)')
      .replace(/\\sin\^\{-1\}\s*\(\s*([^)]*)\s*\)/g, 'degreeAsin($1)')
      .replace(/\\sin\^\{-1\}\s*([^({\s][^)\s}]*)/g, 'degreeAsin($1)')
      .replace(/\\sin\^-1/g, 'degreeAsin')
      .replace(/\\sin\^{-1}/g, 'degreeAsin')
      
      .replace(/\\cos\^\{-1\}\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'degreeAcos($1)')
      .replace(/\\cos\^\{-1\}\s*\{\s*([^}]*)\s*\}/g, 'degreeAcos($1)')
      .replace(/\\cos\^\{-1\}\s*\(\s*([^)]*)\s*\)/g, 'degreeAcos($1)')
      .replace(/\\cos\^\{-1\}\s*([^({\s][^)\s}]*)/g, 'degreeAcos($1)')
      .replace(/\\cos\^-1/g, 'degreeAcos')
      .replace(/\\cos\^{-1}/g, 'degreeAcos')
      
      .replace(/\\tan\^\{-1\}\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'degreeAtan($1)')
      .replace(/\\tan\^\{-1\}\s*\{\s*([^}]*)\s*\}/g, 'degreeAtan($1)')
      .replace(/\\tan\^\{-1\}\s*\(\s*([^)]*)\s*\)/g, 'degreeAtan($1)')
      .replace(/\\tan\^\{-1\}\s*([^({\s][^)\s}]*)/g, 'degreeAtan($1)')
      .replace(/\\tan\^-1/g, 'degreeAtan')
      .replace(/\\tan\^{-1}/g, 'degreeAtan')
      
      .replace(/\\csc\^\{-1\}\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'degreeAcsc($1)')
      .replace(/\\csc\^\{-1\}\s*\{\s*([^}]*)\s*\}/g, 'degreeAcsc($1)')
      .replace(/\\csc\^\{-1\}\s*\(\s*([^)]*)\s*\)/g, 'degreeAcsc($1)')
      .replace(/\\csc\^\{-1\}\s*([^({\s][^)\s}]*)/g, 'degreeAcsc($1)')
      .replace(/\\csc\^-1/g, 'degreeAcsc')
      .replace(/\\csc\^{-1}/g, 'degreeAcsc')
      
      .replace(/\\sec\^\{-1\}\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'degreeAsec($1)')
      .replace(/\\sec\^\{-1\}\s*\{\s*([^}]*)\s*\}/g, 'degreeAsec($1)')
      .replace(/\\sec\^\{-1\}\s*\(\s*([^)]*)\s*\)/g, 'degreeAsec($1)')
      .replace(/\\sec\^\{-1\}\s*([^({\s][^)\s}]*)/g, 'degreeAsec($1)')
      .replace(/\\sec\^-1/g, 'degreeAsec')
      .replace(/\\sec\^{-1}/g, 'degreeAsec')
      
      .replace(/\\cot\^\{-1\}\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'degreeAcot($1)')
      .replace(/\\cot\^\{-1\}\s*\{\s*([^}]*)\s*\}/g, 'degreeAcot($1)')
      .replace(/\\cot\^\{-1\}\s*\(\s*([^)]*)\s*\)/g, 'degreeAcot($1)')
      .replace(/\\cot\^\{-1\}\s*([^({\s][^)\s}]*)/g, 'degreeAcot($1)')
      .replace(/\\cot\^-1/g, 'degreeAcot')
      .replace(/\\cot\^{-1}/g, 'degreeAcot')
      
      // Handle trigonometric functions in DEGREES
      .replace(/\\sin\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'degreeSin($1)')
      .replace(/\\sin\s*\{\s*([^}]*)\s*\}/g, 'degreeSin($1)')
      .replace(/\\sin\s*\(\s*([^)]*)\s*\)/g, 'degreeSin($1)')
      .replace(/\\sin\s*([^({\s][^)\s}]*)/g, 'degreeSin($1)')
      .replace(/\\sin(?!\w)/g, 'degreeSin')
      
      .replace(/\\cos\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'degreeCos($1)')
      .replace(/\\cos\s*\{\s*([^}]*)\s*\}/g, 'degreeCos($1)')
      .replace(/\\cos\s*\(\s*([^)]*)\s*\)/g, 'degreeCos($1)')
      .replace(/\\cos\s*([^({\s][^)\s}]*)/g, 'degreeCos($1)')
      .replace(/\\cos(?!\w)/g, 'degreeCos')
      
      .replace(/\\tan\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'degreeTan($1)')
      .replace(/\\tan\s*\{\s*([^}]*)\s*\}/g, 'degreeTan($1)')
      .replace(/\\tan\s*\(\s*([^)]*)\s*\)/g, 'degreeTan($1)')
      .replace(/\\tan\s*([^({\s][^)\s}]*)/g, 'degreeTan($1)')
      .replace(/\\tan(?!\w)/g, 'degreeTan')
      
      // Handle additional trigonometric functions in DEGREES
      .replace(/\\csc\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'degreeCsc($1)')
      .replace(/\\csc\s*\{\s*([^}]*)\s*\}/g, 'degreeCsc($1)')
      .replace(/\\csc\s*\(\s*([^)]*)\s*\)/g, 'degreeCsc($1)')
      .replace(/\\csc\s*([^({\s][^)\s}]*)/g, 'degreeCsc($1)')
      .replace(/\\csc(?!\w)/g, 'degreeCsc')
      
      .replace(/\\sec\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'degreeSec($1)')
      .replace(/\\sec\s*\{\s*([^}]*)\s*\}/g, 'degreeSec($1)')
      .replace(/\\sec\s*\(\s*([^)]*)\s*\)/g, 'degreeSec($1)')
      .replace(/\\sec\s*([^({\s][^)\s}]*)/g, 'degreeSec($1)')
      .replace(/\\sec(?!\w)/g, 'degreeSec')
      
      .replace(/\\cot\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'degreeCot($1)')
      .replace(/\\cot\s*\{\s*([^}]*)\s*\}/g, 'degreeCot($1)')
      .replace(/\\cot\s*\(\s*([^)]*)\s*\)/g, 'degreeCot($1)')
      .replace(/\\cot\s*([^({\s][^)\s}]*)/g, 'degreeCot($1)')
      .replace(/\\cot(?!\w)/g, 'degreeCot')
      
      // Handle inverse hyperbolic functions
      .replace(/\\sinh\^\{-1\}\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'asinh($1)')
      .replace(/\\sinh\^\{-1\}\s*\{\s*([^}]*)\s*\}/g, 'asinh($1)')
      .replace(/\\sinh\^\{-1\}\s*\(\s*([^)]*)\s*\)/g, 'asinh($1)')
      .replace(/\\sinh\^\{-1\}\s*([^({\s][^)\s}]*)/g, 'asinh($1)')
      .replace(/\\sinh\^-1/g, 'asinh')
      .replace(/\\sinh\^{-1}/g, 'asinh')
      
      .replace(/\\cosh\^\{-1\}\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'acosh($1)')
      .replace(/\\cosh\^\{-1\}\s*\{\s*([^}]*)\s*\}/g, 'acosh($1)')
      .replace(/\\cosh\^\{-1\}\s*\(\s*([^)]*)\s*\)/g, 'acosh($1)')
      .replace(/\\cosh\^\{-1\}\s*([^({\s][^)\s}]*)/g, 'acosh($1)')
      .replace(/\\cosh\^-1/g, 'acosh')
      .replace(/\\cosh\^{-1}/g, 'acosh')
      
      .replace(/\\tanh\^\{-1\}\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'atanh($1)')
      .replace(/\\tanh\^\{-1\}\s*\{\s*([^}]*)\s*\}/g, 'atanh($1)')
      .replace(/\\tanh\^\{-1\}\s*\(\s*([^)]*)\s*\)/g, 'atanh($1)')
      .replace(/\\tanh\^\{-1\}\s*([^({\s][^)\s}]*)/g, 'atanh($1)')
      .replace(/\\tanh\^-1/g, 'atanh')
      .replace(/\\tanh\^{-1}/g, 'atanh')
      
      .replace(/\\csch\^\{-1\}\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'acsch($1)')
      .replace(/\\csch\^\{-1\}\s*\{\s*([^}]*)\s*\}/g, 'acsch($1)')
      .replace(/\\csch\^\{-1\}\s*\(\s*([^)]*)\s*\)/g, 'acsch($1)')
      .replace(/\\csch\^\{-1\}\s*([^({\s][^)\s}]*)/g, 'acsch($1)')
      .replace(/\\csch\^-1/g, 'acsch')
      .replace(/\\csch\^{-1}/g, 'acsch')
      
      .replace(/\\sech\^\{-1\}\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'asech($1)')
      .replace(/\\sech\^\{-1\}\s*\{\s*([^}]*)\s*\}/g, 'asech($1)')
      .replace(/\\sech\^\{-1\}\s*\(\s*([^)]*)\s*\)/g, 'asech($1)')
      .replace(/\\sech\^\{-1\}\s*([^({\s][^)\s}]*)/g, 'asech($1)')
      .replace(/\\sech\^-1/g, 'asech')
      .replace(/\\sech\^{-1}/g, 'asech')
      
      .replace(/\\coth\^\{-1\}\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'acoth($1)')
      .replace(/\\coth\^\{-1\}\s*\{\s*([^}]*)\s*\}/g, 'acoth($1)')
      .replace(/\\coth\^\{-1\}\s*\(\s*([^)]*)\s*\)/g, 'acoth($1)')
      .replace(/\\coth\^\{-1\}\s*([^({\s][^)\s}]*)/g, 'acoth($1)')
      .replace(/\\coth\^-1/g, 'acoth')
      .replace(/\\coth\^{-1}/g, 'acoth')
      
      // Handle hyperbolic functions
      .replace(/\\sinh\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'Math.sinh($1)')
      .replace(/\\sinh\s*\{\s*([^}]*)\s*\}/g, 'Math.sinh($1)')
      .replace(/\\sinh\s*\(\s*([^)]*)\s*\)/g, 'Math.sinh($1)')
      .replace(/\\sinh\s*([^({\s][^)\s}]*)/g, 'Math.sinh($1)')
      .replace(/\\sinh(?!\w)/g, 'Math.sinh')
      
      .replace(/\\cosh\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'Math.cosh($1)')
      .replace(/\\cosh\s*\{\s*([^}]*)\s*\}/g, 'Math.cosh($1)')
      .replace(/\\cosh\s*\(\s*([^)]*)\s*\)/g, 'Math.cosh($1)')
      .replace(/\\cosh\s*([^({\s][^)\s}]*)/g, 'Math.cosh($1)')
      .replace(/\\cosh(?!\w)/g, 'Math.cosh')
      
      .replace(/\\tanh\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'Math.tanh($1)')
      .replace(/\\tanh\s*\{\s*([^}]*)\s*\}/g, 'Math.tanh($1)')
      .replace(/\\tanh\s*\(\s*([^)]*)\s*\)/g, 'Math.tanh($1)')
      .replace(/\\tanh\s*([^({\s][^)\s}]*)/g, 'Math.tanh($1)')
      .replace(/\\tanh(?!\w)/g, 'Math.tanh')
      
      .replace(/\\csch\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'csch($1)')
      .replace(/\\csch\s*\{\s*([^}]*)\s*\}/g, 'csch($1)')
      .replace(/\\csch\s*\(\s*([^)]*)\s*\)/g, 'csch($1)')
      .replace(/\\csch\s*([^({\s][^)\s}]*)/g, 'csch($1)')
      .replace(/\\csch(?!\w)/g, 'csch')
      
      .replace(/\\sech\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'sech($1)')
      .replace(/\\sech\s*\{\s*([^}]*)\s*\}/g, 'sech($1)')
      .replace(/\\sech\s*\(\s*([^)]*)\s*\)/g, 'sech($1)')
      .replace(/\\sech\s*([^({\s][^)\s}]*)/g, 'sech($1)')
      .replace(/\\sech(?!\w)/g, 'sech')
      
      .replace(/\\coth\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'coth($1)')
      .replace(/\\coth\s*\{\s*([^}]*)\s*\}/g, 'coth($1)')
      .replace(/\\coth\s*\(\s*([^)]*)\s*\)/g, 'coth($1)')
      .replace(/\\coth\s*([^({\s][^)\s}]*)/g, 'coth($1)')
      .replace(/\\coth(?!\w)/g, 'coth')
      
      // Handle logarithms
      .replace(/\\log_\{10\}\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'Math.log10($1)')
      .replace(/\\log_\{10\}\s*\{\s*([^}]*)\s*\}/g, 'Math.log10($1)')
      .replace(/\\log_\{10\}\s*\(\s*([^)]*)\s*\)/g, 'Math.log10($1)')
      .replace(/\\log(?!\w)/g, 'Math.log10')
      
      .replace(/\\ln\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'Math.log($1)')
      .replace(/\\ln\s*\{\s*([^}]*)\s*\}/g, 'Math.log($1)')
      .replace(/\\ln\s*\(\s*([^)]*)\s*\)/g, 'Math.log($1)')
      .replace(/\\ln\s*([^({\s][^)\s}]*)/g, 'Math.log($1)')
      .replace(/\\ln(?!\w)/g, 'Math.log')
      
      // Handle square root
      .replace(/\\sqrt\s*\{\s*([^}]*)\s*\}/g, 'Math.sqrt($1)')
      .replace(/\\sqrt\s*\\left\(\s*([^)]*)\s*\\right\)/g, 'Math.sqrt($1)')
      .replace(/\\sqrt\s*\(\s*([^)]*)\s*\)/g, 'Math.sqrt($1)')
      .replace(/\\sqrt(?!\w)/g, 'Math.sqrt')
      
      // Handle factorial
      .replace(/(\d+)!/g, 'factorial($1)')
      .replace(/\(([^)]+)\)!/g, 'factorial($1)')
      
      // Handle fractions
      .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '(($1)/($2))')
      
      // Handle parentheses and braces
      .replace(/\\left\(/g, '(')
      .replace(/\\right\)/g, ')')
      .replace(/\\left\\{/g, '{')
      .replace(/\\right\\}/g, '}')
      .replace(/\\{/g, '{')
      .replace(/\\}/g, '}')
      
      // Handle operators
      .replace(/\\cdot/g, '*')
      .replace(/\\times/g, '*')
      .replace(/\\div/g, '/')
      
      // Handle powers
      .replace(/\^{([^}]*)}/g, '**($1)')
      .replace(/\^(\S)/, '**$1')
      .replace(/\^/g, '**');
    
    console.log('Converted to JS:', jsExpression);
    
    // If the expression is just a number without x, make it a constant function
    if (!jsExpression.includes('x') && !isNaN(parseFloat(jsExpression))) {
      jsExpression = jsExpression; // Keep it as is for constant functions
    }
    
    return jsExpression;
  }
  
  // Function to safely evaluate expressions
  function evaluateExpression(jsExpression) {
    try {
      // Create a context with our custom degree-based trig functions and other math functions
      const context = {
        Math: Math,
        // Current angle mode
        angleMode: angleMode,
        
        // Trigonometric functions that respect the current angle mode
        degreeSin: function(x) { 
          return angleMode === 'deg' ? Math.sin(x * Math.PI / 180) : Math.sin(x); 
        },
        degreeCos: function(x) { 
          return angleMode === 'deg' ? Math.cos(x * Math.PI / 180) : Math.cos(x); 
        },
        degreeTan: function(x) { 
          return angleMode === 'deg' ? Math.tan(x * Math.PI / 180) : Math.tan(x); 
        },
        degreeCsc: function(x) { 
          return angleMode === 'deg' ? 1 / Math.sin(x * Math.PI / 180) : 1 / Math.sin(x); 
        },
        degreeSec: function(x) { 
          return angleMode === 'deg' ? 1 / Math.cos(x * Math.PI / 180) : 1 / Math.cos(x); 
        },
        degreeCot: function(x) { 
          return angleMode === 'deg' ? 1 / Math.tan(x * Math.PI / 180) : 1 / Math.tan(x); 
        },
        
        // Inverse trigonometric functions that respect the current angle mode
        degreeAsin: function(x) { 
          return angleMode === 'deg' ? Math.asin(x) * 180 / Math.PI : Math.asin(x); 
        },
        degreeAcos: function(x) { 
          return angleMode === 'deg' ? Math.acos(x) * 180 / Math.PI : Math.acos(x); 
        },
        degreeAtan: function(x) { 
          return angleMode === 'deg' ? Math.atan(x) * 180 / Math.PI : Math.atan(x); 
        },
        degreeAcsc: function(x) { 
          return angleMode === 'deg' ? Math.asin(1/x) * 180 / Math.PI : Math.asin(1/x); 
        },
        degreeAsec: function(x) { 
          return angleMode === 'deg' ? Math.acos(1/x) * 180 / Math.PI : Math.acos(1/x); 
        },
        degreeAcot: function(x) { 
          return angleMode === 'deg' ? (Math.PI/2 - Math.atan(x)) * 180 / Math.PI : (Math.PI/2 - Math.atan(x)); 
        },
        
        // Additional hyperbolic functions
        csch: function(x) { return 1 / Math.sinh(x); },
        sech: function(x) { return 1 / Math.cosh(x); },
        coth: function(x) { return 1 / Math.tanh(x); },
        
        // Inverse hyperbolic functions
        asinh: function(x) { return Math.asinh ? Math.asinh(x) : Math.log(x + Math.sqrt(x * x + 1)); },
        acosh: function(x) { return Math.acosh ? Math.acosh(x) : Math.log(x + Math.sqrt(x * x - 1)); },
        atanh: function(x) { return Math.atanh ? Math.atanh(x) : 0.5 * Math.log((1 + x) / (1 - x)); },
        acsch: function(x) { return Math.asinh(1 / x); },
        asech: function(x) { return Math.acosh(1 / x); },
        acoth: function(x) { return 0.5 * Math.log((x + 1) / (x - 1)); },
        
        // Other math functions
        factorial: function(n) {
          if (n < 0) return NaN;
          if (n === 0 || n === 1) return 1;
          let result = 1;
          for (let i = 2; i <= n; i++) {
            result *= i;
          }
          return result;
        },
        
        // Standard math functions and constants
        log10: Math.log10,
        log: Math.log,
        sqrt: Math.sqrt,
        PI: Math.PI,
        E: Math.E,
        pow: Math.pow,
        abs: Math.abs
      };
      
      // Use a safer approach with Function constructor
      const evalFunction = new Function(...Object.keys(context), `return ${jsExpression};`);
      
      // Execute the function with our context values
      return evalFunction(...Object.values(context));
    } catch (error) {
      throw new Error('Invalid expression: ' + error.message);
    }
  }
  
  // Add this new function to ensure no cursor in result display
  function ensureNoCursorInResultDisplay() {
    // Add a small delay to ensure this runs after MathQuill has updated the DOM
    setTimeout(() => {
      const resultElement = document.getElementById('result-display');
      if (resultElement) {
        // Remove any cursor elements that might have been added
        const cursors = resultElement.querySelectorAll('.mq-cursor');
        cursors.forEach(cursor => {
          cursor.style.display = 'none';
          cursor.style.opacity = '0';
          cursor.style.visibility = 'hidden';
        });
      }
    }, 10);
  }
  
  // Functions to handle placeholder text
  function showPlaceholder() {
    const mathFieldElement = document.getElementById('math-field');
    if (!mathFieldElement) return; // Safety check
    
    // Don't show placeholder if field is focused
    if (mathFieldElement.classList.contains('mq-focused')) return;
    
    // Don't show placeholder if there's content
    if (mathField && mathField.latex() !== '') return;
    
    let placeholder = mathFieldElement.querySelector('.placeholder-text');
    
    if (!placeholder) {
      placeholder = document.createElement('div');
      placeholder.className = 'placeholder-text';
      placeholder.textContent = 'Write equations here...';
      placeholder.style.position = 'absolute';
      placeholder.style.top = '50%';
      placeholder.style.left = '10px';
      placeholder.style.transform = 'translateY(-50%)';
      placeholder.style.color = '#666';
      placeholder.style.pointerEvents = 'none';
      
      // Match tab buttons font styling exactly
      const tabButton = document.querySelector('.calculator-tab-btn');
      if (tabButton) {
        const computedStyle = window.getComputedStyle(tabButton);
        placeholder.style.fontSize = computedStyle.fontSize;
        placeholder.style.fontFamily = computedStyle.fontFamily;
        placeholder.style.fontWeight = computedStyle.fontWeight;
        placeholder.style.textDecoration = computedStyle.textDecoration;
      } else {
        // Fallback styling if tab buttons aren't available yet
        placeholder.style.fontSize = '14px';
        placeholder.style.fontFamily = 'inherit';
        placeholder.style.fontWeight = 'normal';
        placeholder.style.textDecoration = 'none';
      }
      placeholder.style.textAlign = 'left';
      
      mathFieldElement.style.position = 'relative';
      mathFieldElement.appendChild(placeholder);
    } else {
      placeholder.style.display = 'block';
    }
  }
  
  function hidePlaceholder() {
    const mathFieldElement = document.getElementById('math-field');
    if (!mathFieldElement) return; // Safety check
    
    const placeholder = mathFieldElement.querySelector('.placeholder-text');
    if (placeholder) {
      placeholder.style.display = 'none';
    }
  }
  
  // Function to initialize angle mode toggle
  function initAngleModeToggle() {
    const angleModeButtons = document.querySelectorAll('.angle-mode-btn');
    
    angleModeButtons.forEach(button => {
      button.addEventListener('click', function(event) {
        // Prevent event propagation to avoid triggering tab navigation
        event.stopPropagation();
        
        // Remove active class from all angle mode buttons
        angleModeButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Update angle mode
        angleMode = this.getAttribute('data-mode');
        
        // Update result if there's a current calculation
        if (mathField && mathField.latex() && resultDisplay.textContent) {
          solveEquation(mathField.latex());
        }
      });
    });
  }
  
  // Initialize calculator when the page loads
  console.log('Initializing calculator...');
  initCalculator();
  console.log('Calculator initialized');
} 
