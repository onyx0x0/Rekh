/**
 * Lecture Navigation System
 * Handles the interactive navigation between lecture segments
 */

class LectureNavigator {
  constructor(containerElement = null) {
    this.container = containerElement;
    this.currentSegment = 0;
    this.totalSegments = 0;
    this.segments = [];
    this.prevButton = null;
    this.nextButton = null;
    this.quizButton = null;
    this.initialized = false;
  }

  /**
   * Initialize the lecture navigation system
   */
  init(containerElement = null) {
    if (containerElement && this.container !== containerElement) {
      this.initialized = false;
      this.container = containerElement;
    }

    // Check if already initialized to prevent duplicates
    if (this.initialized) {
      console.warn('Lecture navigator already initialized');
      return;
    }

    // Find the container the navigator should control
    const lectureContent =
      this.container ||
      document.getElementById('lecture-content') ||
      document.getElementById('inline-lecture-content') ||
      document.querySelector('.lecture-content');

    if (!lectureContent) {
      console.warn('No lecture content container found');
      return;
    }

    this.container = lectureContent;

    // Reset references before rebuilding controls
    this.prevButton = null;
    this.nextButton = null;
    this.quizButton = null;

    // Remove any existing navigation elements first
    const existingNavigation = this.container.querySelectorAll('.side-nav');
    existingNavigation.forEach(nav => nav.remove());

    // Clean up any previous quiz button in this container
    this.container
      .querySelectorAll('.quiz-button-container')
      .forEach(btn => btn.remove());

    // Get all lecture segments
    this.segments = Array.from(this.container.querySelectorAll('.lecture-segment'));
    this.totalSegments = this.segments.length;

    if (this.totalSegments === 0) {
      console.warn('No lecture segments found');
      return;
    }

    // Reset any stale classes and default to the first segment
    this.segments.forEach(segment => {
      segment.classList.remove('active', 'prev', 'next');
    });
    this.currentSegment = 0;

    // Create the navigation controls
    this.createNavigation();
    
    // Set the initial active segment
    this.goToSegment(0);
    
    this.initialized = true;
    console.log(`Lecture navigation initialized with ${this.totalSegments} segments`);
  }

  /**
   * Create navigation buttons
   */
  createNavigation() {
    // Create side navigation elements
    this.createSideNavigation();
    
    // Create the quiz button container
    this.createQuizButton();
  }

  /**
   * Create side navigation elements
   */
  createSideNavigation() {
    const lectureContent = this.container || document.querySelector('.lecture-content');
    if (!lectureContent) return;
    
    // Remove any existing navigation first
    const existingNavs = lectureContent.querySelectorAll('.side-nav');
    existingNavs.forEach(nav => nav.remove());
    
    // Create previous navigation bar
    const prevNav = document.createElement('div');
    prevNav.className = 'side-nav side-nav-prev';
    prevNav.innerHTML = '<div class="side-nav-icon"><i class="fas fa-chevron-left"></i></div>';
    prevNav.addEventListener('click', () => this.previousSegment());
    this.prevButton = prevNav;
    
    // Create next navigation bar
    const nextNav = document.createElement('div');
    nextNav.className = 'side-nav side-nav-next';
    nextNav.innerHTML = '<div class="side-nav-icon"><i class="fas fa-chevron-right"></i></div>';
    nextNav.addEventListener('click', () => this.nextSegment());
    this.nextButton = nextNav;
    
    // Add navigation to the lecture content
    lectureContent.appendChild(prevNav);
    lectureContent.appendChild(nextNav);
  }

  /**
   * Create animated quiz button with atom image
   */
  createQuizButton() {
    const lectureContent = this.container || document.querySelector('.lecture-content');
    if (!lectureContent) return;
    
    // Remove any existing quiz button
    lectureContent
      .querySelectorAll('.quiz-button-container')
      .forEach(btn => btn.remove());
    
    // Create quiz button container
    const quizBtnContainer = document.createElement('div');
    quizBtnContainer.className = 'quiz-button-container';
    
    // Create the atom image
    const atomImage = document.createElement('img');
    atomImage.src = 'images/AtomHoldingPenToDoQuiz.png';
    atomImage.alt = 'Atom holding pen';
    atomImage.className = 'atom-image';
    
    // Create the animated quiz button
    const quizBtn = document.createElement('button');
    quizBtn.className = 'animated-quiz-button';
    quizBtn.textContent = 'Take Quiz';
    
    // Add click event
    quizBtn.addEventListener('click', () => {
      const urlParams = new URLSearchParams(window.location.search);
      const subject = urlParams.get('subject');
      const topic = urlParams.get('topic');
      const lecture = urlParams.get('lecture');
      
      window.location.href = `quiz.html?subject=${subject}&topic=${topic}&lecture=${lecture}`;
    });
    
    // Add elements to container
    quizBtnContainer.appendChild(atomImage);
    quizBtnContainer.appendChild(quizBtn);
    
    // Add container to lecture content
    lectureContent.appendChild(quizBtnContainer);
    
    // Store reference to the quiz button
    this.quizButton = quizBtnContainer;
  }

  /**
   * Navigate to the previous segment
   */
  previousSegment() {
    if (this.currentSegment > 0) {
      this.goToSegment(this.currentSegment - 1);
    }
  }

  /**
   * Navigate to the next segment
   */
  nextSegment() {
    if (this.currentSegment < this.totalSegments - 1) {
      this.goToSegment(this.currentSegment + 1);
    }
  }

  /**
   * Go to a specific segment
   * @param {number} index - The index of the segment to navigate to
   */
  goToSegment(index) {
    if (index < 0 || index >= this.totalSegments || !this.segments.length) {
      console.warn(`Invalid segment index: ${index}`);
      return;
    }
    
    // Update current segment
    this.currentSegment = index;
    
    // Update segment classes
    this.segments.forEach((segment, i) => {
      segment.classList.remove('active', 'prev', 'next');
      
      if (i === index) {
        segment.classList.add('active');
      } else if (i < index) {
        segment.classList.add('prev');
      } else {
        segment.classList.add('next');
      }
    });

    // Update button states
    this.updateButtonStates();
  }
  updateButtonStates() {
    if (!this.prevButton || !this.nextButton) return;

    const setNavDisabled = (btn, disabled) => {
      if (!btn) return;
      btn.classList.toggle('is-disabled', disabled);
      btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      const icon = btn.querySelector('.side-nav-icon');
      if (icon) {
        if (disabled) {
          icon.style.background = '#2c2c2c';
        } else {
          icon.style.background = '#121212';
          icon.style.opacity = '1';
          icon.style.boxShadow = '';
        }
      }
    };

    // Update previous button
    if (this.currentSegment === 0) {
      this.prevButton.style.opacity = '0.3';
      setNavDisabled(this.prevButton, true);
    } else {
      this.prevButton.style.opacity = '1';
      setNavDisabled(this.prevButton, false);
    }
    
    // Update next button and quiz button
    if (this.currentSegment === this.totalSegments - 1) {
      // On last segment, hide next button and show quiz button
      this.nextButton.style.opacity = '0.3';
      setNavDisabled(this.nextButton, true);
      
      // Show the quiz button with a slight delay for better effect
      setTimeout(() => {
        if (this.quizButton) {
          this.quizButton.classList.add('visible');
        }
      }, 500);
    } else {
      // Otherwise, show next button and hide quiz button
      this.nextButton.style.opacity = '1';
      setNavDisabled(this.nextButton, false);
      
      // Make sure quiz button is hidden on all other segments
      if (this.quizButton) {
        this.quizButton.classList.remove('visible');
      }
    }
  }

  /**
   * Prepare the lecture content for segmented navigation
   * @param {string} content - The original lecture content HTML
   * @returns {string} - The segmented lecture content HTML
   */
  static prepareContent(content) {
    // If content is empty, return empty container
    if (!content) {
      return '<div class="lecture-segments-container"></div>';
    }
    
    // Split content into segments based on h2 headers
    const segments = [];
    
    // Create a temporary div to parse the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Find all h2 elements
    const headers = Array.from(tempDiv.querySelectorAll('h2'));
    
    if (headers.length === 0) {
      // If no headers, treat the entire content as one segment
      segments.push({
        title: 'Introduction',
        content: content
      });
    } else {
      // Process each header as a segment
      headers.forEach((header, index) => {
        const title = header.textContent;
        let segmentContent = '';
        
        // Start with the header itself
        segmentContent += header.outerHTML;
        
        // Get all elements until the next h2
        let currentNode = header.nextElementSibling;
        while (currentNode && currentNode.tagName !== 'H2') {
          segmentContent += currentNode.outerHTML;
          
          // Get the next sibling before removing this one
          const nextNode = currentNode.nextElementSibling;
          
          // Remove this node from the tempDiv to avoid duplicates
          currentNode.parentNode.removeChild(currentNode);
          
          currentNode = nextNode;
        }
        
        segments.push({
          title: title,
          content: segmentContent
        });
      });
    }
    
    // Create the segmented HTML
    let segmentedHTML = '<div class="lecture-segments-container">';
    
    segments.forEach((segment, index) => {
      segmentedHTML += `
        <div class="lecture-segment" data-index="${index}">
          <div class="segment-content">
            ${segment.content}
          </div>
        </div>
      `;
    });

    segmentedHTML += '</div>';
    
    return segmentedHTML;
  }
}
