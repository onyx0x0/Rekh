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
    this.quizButton = null;
    this.mediaPanel = null;
    this.mediaTitle = null;
    this.mediaDescription = null;
    this.mediaPlaceholder = null;
    this.mediaImage = null;
    this.scrollyRoot = null;
    this.segmentObserver = null;
    this.quizObserver = null;
    this.handleClick = null;
    this.activeIndex = -1;
    this.accentColors = ['#ff8800'];
    this.initialized = false;
  }

  /**
   * Initialize the lecture navigation system
   */
  init(containerElement = null) {
    if (containerElement && this.container !== containerElement) {
      this.container = containerElement;
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

    this.teardown();

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

    this.currentSegment = 0;

    this.setupSegments();
    this.createQuizButton();
    this.cacheMediaPanel();
    this.bindSegmentButtons();
    this.observeSegments();

    this.initialized = true;
    console.log(`Lecture navigation initialized with ${this.totalSegments} segments`);
  }

  teardown() {
    if (this.segmentObserver) {
      this.segmentObserver.disconnect();
      this.segmentObserver = null;
    }
    if (this.quizObserver) {
      this.quizObserver.disconnect();
      this.quizObserver = null;
    }
    if (this.container && this.handleClick) {
      this.container.removeEventListener('click', this.handleClick);
    }
    this.handleClick = null;
    this.mediaPanel = null;
    this.mediaTitle = null;
    this.mediaDescription = null;
    this.mediaPlaceholder = null;
    this.mediaImage = null;
    this.scrollyRoot = null;
    this.activeIndex = -1;
  }

  setupSegments() {
    this.segments.forEach((segment, index) => {
      segment.dataset.index = index;
      if (!segment.id) {
        segment.id = `lecture-segment-${index}`;
      }
      if (!segment.dataset.title) {
        const header = segment.querySelector('h2');
        segment.dataset.title = header ? header.textContent.trim() : `Segment ${index + 1}`;
      }

      let footer = segment.querySelector('.segment-footer');
      if (!footer) {
        footer = document.createElement('div');
        footer.className = 'segment-footer';
        segment.appendChild(footer);
      }

      let prevButton = footer.querySelector('.segment-prev');
      if (!prevButton) {
        prevButton = document.createElement('button');
        prevButton.type = 'button';
        prevButton.className = 'segment-prev';
        footer.appendChild(prevButton);
      }

      let nextButton = footer.querySelector('.segment-next');
      if (!nextButton) {
        nextButton = document.createElement('button');
        nextButton.type = 'button';
        nextButton.className = 'segment-next';
        footer.appendChild(nextButton);
      }

      if (prevButton && nextButton && prevButton.nextSibling !== nextButton) {
        footer.insertBefore(prevButton, nextButton);
      }

      const isFirst = index === 0;
      const isLast = index === this.totalSegments - 1;
      prevButton.textContent = 'Back';
      prevButton.dataset.target = isFirst ? '' : `lecture-segment-${index - 1}`;
      prevButton.classList.toggle('is-disabled', isFirst);
      prevButton.disabled = isFirst;
      prevButton.setAttribute('aria-disabled', isFirst ? 'true' : 'false');

      nextButton.textContent = isLast ? 'Finish' : 'Next';
      nextButton.dataset.target = isLast ? 'lecture-quiz-cta' : `lecture-segment-${index + 1}`;
    });
  }

  bindSegmentButtons() {
    if (!this.container) return;
    this.handleClick = (event) => {
      const button = event.target.closest('.segment-next, .segment-prev');
      if (!button || !this.container.contains(button)) return;
      if (button.disabled || button.classList.contains('is-disabled')) return;
      const targetId = button.dataset.target;
      const target = targetId ? document.getElementById(targetId) : null;
      if (targetId === 'lecture-quiz-cta' && this.quizButton) {
        this.quizButton.classList.add('visible');
      }
      const targetSegment = target && target.classList.contains('lecture-segment')
        ? target
        : target?.querySelector?.('.lecture-segment');
      if (targetSegment) {
        const idx = Number(targetSegment.dataset.index);
        if (!Number.isNaN(idx)) {
          this.activeIndex = idx;
          this.currentSegment = idx;
          this.updateMediaPanel(targetSegment, idx);
          this.segments.forEach((segment, i) => {
            segment.classList.toggle('is-visible', i === idx);
          });
        }
      }
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    this.container.addEventListener('click', this.handleClick);
  }

  cacheMediaPanel() {
    this.scrollyRoot = this.container.querySelector('.lecture-scrolly');
    this.mediaPanel = this.container.querySelector('.lecture-media-panel');
    if (!this.mediaPanel) return;
    this.mediaTitle = this.mediaPanel.querySelector('.media-title');
    this.mediaDescription = this.mediaPanel.querySelector('.media-description');
    this.mediaPlaceholder = this.mediaPanel.querySelector('.media-placeholder');
    this.mediaImage = this.mediaPanel.querySelector('.media-image');
    if (this.scrollyRoot) {
      this.scrollyRoot.style.setProperty('--accent', this.accentColors[0]);
    }
  }

  observeSegments() {
    if (!this.segments.length) return;
    if (!('IntersectionObserver' in window)) {
      this.segments.forEach((segment, index) => {
        segment.classList.toggle('is-visible', index === 0);
        if (index === 0) {
          this.updateMediaPanel(segment, 0);
        }
      });
      return;
    }

    const observerOptions = {
      root: null,
      threshold: 0.5,
      rootMargin: '0px 0px -20% 0px'
    };

    this.segmentObserver = new IntersectionObserver((entries) => {
      const visible = [];
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visible.push(entry);
        }
      });

      if (visible.length) {
        visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const focusEntry = visible[0];
        const idx = Number(focusEntry.target.dataset.index) || 0;
        if (idx !== this.activeIndex) {
          this.activeIndex = idx;
          this.currentSegment = idx;
          this.updateMediaPanel(focusEntry.target, idx);
        }
        this.segments.forEach((segment, i) => {
          segment.classList.toggle('is-visible', i === idx);
        });
      }
    }, observerOptions);

    this.segments.forEach((segment) => this.segmentObserver.observe(segment));

    if (this.quizButton && this.segments.length) {
      const lastSegment = this.segments[this.segments.length - 1];
      this.quizObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && this.quizButton) {
            this.quizButton.classList.add('visible');
            if (this.quizObserver) {
              this.quizObserver.disconnect();
              this.quizObserver = null;
            }
          }
        });
      }, { threshold: 0.6 });
      this.quizObserver.observe(lastSegment);
    }

    if (this.segments[0]) {
      this.segments[0].classList.add('is-visible');
      this.updateMediaPanel(this.segments[0], 0);
    }
  }

  updateMediaPanel(segment, index) {
    if (!this.mediaPanel || !segment) return;

    const accent = this.accentColors[index % this.accentColors.length];
    if (this.scrollyRoot) {
      this.scrollyRoot.style.setProperty('--accent', accent);
    }

    if (this.mediaTitle) {
      this.mediaTitle.textContent = segment.dataset.title || `Segment ${index + 1}`;
    }

    if (this.mediaDescription) {
      this.mediaDescription.textContent = this.getSegmentPreview(segment) || 'Keep scrolling to reveal the next idea.';
    }

    const image = segment.querySelector('img');
    if (image && this.mediaImage) {
      this.mediaImage.src = image.src;
      this.mediaImage.alt = image.alt || (segment.dataset.title || 'Lecture visual');
      this.mediaImage.classList.add('is-visible');
      if (this.mediaPlaceholder) {
        this.mediaPlaceholder.classList.add('is-hidden');
      }
    } else {
      if (this.mediaImage) {
        this.mediaImage.classList.remove('is-visible');
      }
      if (this.mediaPlaceholder) {
        this.mediaPlaceholder.classList.remove('is-hidden');
      }
    }
  }

  getSegmentPreview(segment) {
    const paragraph = segment.querySelector('p');
    if (!paragraph) return '';
    const text = paragraph.textContent.trim();
    if (text.length <= 140) return text;
    return `${text.slice(0, 137)}...`;
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
      const dataset = this.container ? this.container.dataset : {};
      const subject = dataset.subject || urlParams.get('subject');
      const topic = dataset.topic || urlParams.get('topic');
      const lecture = dataset.lecture || urlParams.get('lecture');

      if (!subject || !topic || !lecture) {
        console.warn('Quiz parameters are missing.');
        return;
      }

      window.location.href = `quiz.html?subject=${subject}&topic=${topic}&lecture=${lecture}`;
    });
    
    // Add elements to container
    quizBtnContainer.appendChild(atomImage);
    quizBtnContainer.appendChild(quizBtn);
    
    const quizSlide = document.createElement('div');
    quizSlide.className = 'lecture-slide lecture-cta-slide';
    quizSlide.id = 'lecture-quiz-cta';
    quizSlide.appendChild(quizBtnContainer);

    // Add container to lecture content rail
    const rail = lectureContent.querySelector('.lecture-segments-container') || lectureContent;
    rail.appendChild(quizSlide);
    
    // Store reference to the quiz button
    this.quizButton = quizBtnContainer;
  }

  /**
   * Navigate to the previous segment
   */
  previousSegment() {
    if (this.currentSegment > 0) {
      this.scrollToSegment(this.currentSegment - 1);
    }
  }

  /**
   * Navigate to the next segment
   */
  nextSegment() {
    if (this.currentSegment < this.totalSegments - 1) {
      this.scrollToSegment(this.currentSegment + 1);
    }
  }

  /**
   * Go to a specific segment
   * @param {number} index - The index of the segment to navigate to
   */
  goToSegment(index) {
    this.scrollToSegment(index);
  }

  scrollToSegment(index) {
    if (index < 0 || index >= this.totalSegments || !this.segments.length) {
      console.warn(`Invalid segment index: ${index}`);
      return;
    }
    this.currentSegment = index;
    const target = this.segments[index];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      return `
        <div class="lecture-scrolly">
          <div class="lecture-rail">
            <div class="lecture-segments-container"></div>
          </div>
          ${LectureNavigator.mediaPanelMarkup()}
        </div>
      `;
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
    let segmentedHTML = `
      <div class="lecture-scrolly">
        <div class="lecture-rail">
          <div class="lecture-segments-container">
    `;
    
    segments.forEach((segment, index) => {
      const safeTitle = segment.title
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      segmentedHTML += `
        <div class="lecture-slide">
          <section class="lecture-segment" data-index="${index}" data-title="${safeTitle}">
            <div class="segment-content">
              ${segment.content}
            </div>
            <div class="segment-footer">
              <button type="button" class="segment-prev">Back</button>
              <button type="button" class="segment-next">Next</button>
            </div>
          </section>
        </div>
      `;
    });

    segmentedHTML += `
          </div>
        </div>
        ${LectureNavigator.mediaPanelMarkup()}
      </div>
    `;
    
    return segmentedHTML;
  }

  static mediaPanelMarkup() {
    return `
      <aside class="lecture-media-panel" aria-hidden="true">
        <div class="media-card">
          <div class="media-visual">
            <div class="media-placeholder">
              <div class="media-orb"></div>
              <div class="media-grid"></div>
              <div class="media-scan"></div>
            </div>
            <img class="media-image" alt="">
          </div>
          <div class="media-meta">
            <div class="media-kicker">Focus</div>
            <div class="media-title">Scroll to explore</div>
            <div class="media-description">Key visuals appear here as you move through the lecture.</div>
          </div>
        </div>
      </aside>
    `;
  }
}
