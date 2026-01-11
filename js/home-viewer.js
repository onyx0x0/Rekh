// Handles inline course loading on the home page with simple fade transitions.
(function() {
  const courseButtons = document.querySelectorAll('.course-selection .course-button');
  const courseSelection = document.querySelector('.course-selection');
  const homeLink = document.querySelector('header .nav-left a.button[href="index.html"]');
  const widePicture = document.querySelector('.wide-picture');
  const updateNotice = document.querySelector('.update-notice');
  const courseView = document.getElementById('course-view');
  const courseContent = document.getElementById('course-content');
  const backButton = document.getElementById('course-back');
  const lectureView = document.getElementById('lecture-view');
  const inlineLectureTitle = document.getElementById('inline-lecture-title');
  const inlineLectureContent = document.getElementById('inline-lecture-content');
  const inlineQuizButton = document.getElementById('inline-quiz-button');
  const inlineLecturePage = document.querySelector('#inline-lecture .lecture-page');
  const inlineButtonsContainer = document.getElementById('inline-buttons-container');
  const body = document.body;
  const focusToggle = document.getElementById('lecture-focus-toggle');
  const transitionTime = 350;
  const baseUrl = `${window.location.pathname}`;
  let currentLectureParams = null;
  let fallbackWheelHandler = null;
  const focusTransitionTime = 460;
  const setPhysicsInlineState = (isActive) => {
    if (!courseContent) return;
    courseContent.classList.toggle('physics-inline', isActive);
    if (courseView) {
      courseView.classList.toggle('physics-inline-active', isActive);
    }
    if (body) {
      body.classList.toggle('physics-inline-open', isActive);
    }
    if (document.documentElement) {
      document.documentElement.classList.toggle('physics-inline-open', isActive);
    }
  };
  const releaseInlinePhysicsScrollLock = () => {
    if (body) {
      body.classList.remove('physics-inline-open');
    }
    if (document.documentElement) {
      document.documentElement.classList.remove('physics-inline-open');
    }
  };
  const restoreInlinePhysicsScrollLock = () => {
    if (!courseContent || !courseContent.classList.contains('physics-inline')) return;
    if (body) {
      body.classList.add('physics-inline-open');
    }
    if (document.documentElement) {
      document.documentElement.classList.add('physics-inline-open');
    }
  };

  const closeNavFolders = () => {
    document.querySelectorAll('.nav-folder.open').forEach((folder) => {
      folder.classList.remove('open');
    });
    document.querySelectorAll('.folder-button[aria-expanded="true"]').forEach((toggle) => {
      toggle.setAttribute('aria-expanded', 'false');
    });
  };

  const setFocusMode = (isFocused) => {
    if (!body) return;
    body.classList.toggle('lecture-focus-mode', isFocused);
    if (focusToggle) {
      focusToggle.setAttribute('aria-pressed', isFocused ? 'true' : 'false');
      focusToggle.setAttribute('aria-label', isFocused ? 'Show header' : 'Hide header');
    }
    if (isFocused) {
      closeNavFolders();
    }
  };

  const activateLectureFocus = () => {
    if (!body) return;
    body.classList.add('lecture-inline-active');
    requestAnimationFrame(() => {
      body.classList.add('lecture-stars-faded');
    });
    setFocusMode(true);
  };

  const deactivateLectureFocus = () => {
    if (!body) return;
    body.classList.remove('lecture-inline-active', 'lecture-stars-faded', 'lecture-focus-mode');
    if (focusToggle) {
      focusToggle.setAttribute('aria-pressed', 'false');
      focusToggle.setAttribute('aria-label', 'Hide header');
    }
  };

  if (focusToggle) {
    focusToggle.addEventListener('click', () => {
      if (!body || !body.classList.contains('lecture-inline-active')) return;
      setFocusMode(!body.classList.contains('lecture-focus-mode'));
    });
  }

  if (!courseButtons.length || !courseView || !courseContent || !backButton) {
    return;
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const resetScroll = () => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };
  const centerInlineLecture = () => {
    if (!inlineLectureContent) return;
    const target = inlineLectureContent.querySelector('.lecture-segment') ||
      inlineLectureContent.querySelector('.lecture-slide');
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const offset = rect.top + window.scrollY - (window.innerHeight - rect.height) / 2;
    const nextScroll = Math.max(0, offset);
    if (Math.abs(nextScroll - window.scrollY) < 2) return;
    window.scrollTo({ top: nextScroll, behavior: 'auto' });
  };
  const loadScriptOnce = (src) => new Promise((resolve, reject) => {
    const existing = Array.from(document.scripts).find((s) => s.src && s.src.includes(src));
    if (existing && existing.dataset.loaded === 'true') {
      resolve();
      return;
    }
    if (existing && existing.dataset.loading === 'true') {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', (e) => reject(e), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.defer = false;
    script.dataset.loading = 'true';
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    });
    script.addEventListener('error', (e) => reject(e));
    document.head.appendChild(script);
  });

  async function ensurePhysicsAssets(scope) {
    const cssId = 'physics-structure-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'css/physics-structure.css?v=3';
      document.head.appendChild(link);
    }

    if (typeof window.initPhysicsStructure !== 'function') {
      await loadScriptOnce('js/physics-structure.js?v=3');
    }
    if (typeof window.initPhysicsStructure === 'function') {
      window.initPhysicsStructure(scope || document);
    }
  }

  courseButtons.forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const target = button.getAttribute('href');
      if (!target) return;

      await hideHomeTiles();
      await loadCourse(target);
      showCourseView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  if (homeLink) {
    homeLink.addEventListener('click', async (event) => {
      if (!courseSelection) return;
      event.preventDefault();
      const homeVisible = !courseSelection.classList.contains('is-hidden');
      if (homeVisible) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (lectureView && lectureView.classList.contains('active')) {
        await hideLectureView();
      }
      if (courseView && courseView.classList.contains('active')) {
        await hideCourseView();
      }
      revealHomeTiles();
      resetScroll();
    });
  }

  backButton.addEventListener('click', async () => {
    if (currentLectureParams) {
      await hideLectureView();
      showCourseContent();
      clearLectureState();
      resetScroll();
    } else {
      await hideCourseView();
      revealHomeTiles();
      resetScroll();
    }
  });

  async function hideHomeTiles() {
    [courseSelection, widePicture, updateNotice].forEach((el) => {
      if (el) el.classList.add('is-fading-out');
    });
    await wait(transitionTime);
    [courseSelection, widePicture, updateNotice].forEach((el) => {
      if (el) el.classList.add('is-hidden');
    });
  }

  function revealHomeTiles() {
    [courseSelection, widePicture, updateNotice].forEach((el) => {
      if (!el) return;
      el.classList.remove('is-hidden');
      // allow reflow before removing fade state for smooth return
      requestAnimationFrame(() => {
        el.classList.remove('is-fading-out');
      });
    });
  }

  async function loadCourse(url) {
    courseContent.textContent = 'Loading...';
    setPhysicsInlineState(url.includes('physics.html'));
    try {
      const response = await fetch(url, { cache: 'no-store' });
      const html = await response.text();
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const main = parsed.querySelector('main');
      courseContent.innerHTML = main ? main.innerHTML : '<p>Content unavailable.</p>';
      if (url.includes('physics.html')) {
        await ensurePhysicsAssets(courseContent);
      } else {
        attachSubjectAccordions(courseContent);
        attachLectureLinks(courseContent);
      }
    } catch (error) {
      console.error('Failed to load course:', error);
      courseContent.innerHTML = '<p>Unable to load course content right now.</p>';
    }
  }

  function showCourseView() {
    courseView.classList.add('active');
    requestAnimationFrame(() => {
      courseView.classList.add('ready');
    });
  }

  async function hideCourseView() {
    courseView.classList.remove('ready');
    await wait(transitionTime);
    courseView.classList.remove('active');
    courseContent.innerHTML = '';
    courseContent.classList.remove('is-hidden', 'is-fading-out');
    if (lectureView) {
      lectureView.classList.remove('active', 'ready');
    }
    inlineLectureContent.innerHTML = '';
    inlineLectureTitle.textContent = '';
    deactivateLectureFocus();
    clearLectureState();
    setPhysicsInlineState(false);
  }

  // Reuses the physics dropdown interaction for dynamically injected content.
  function attachSubjectAccordions(scope) {
    const subjectCards = scope.querySelectorAll('.subjects .subject');
    subjectCards.forEach((card) => {
      const header = card.querySelector('.subject-header');
      const lectures = card.querySelector('.lectures');
      if (!header || !lectures) return;

      lectures.style.maxHeight = '0';
      card.style.marginBottom = '20px';

      header.addEventListener('click', () => {
        const dropdownHeight = lectures.scrollHeight;
        subjectCards.forEach((otherCard) => {
          if (otherCard === card) return;
          otherCard.classList.remove('active');
          const otherLectures = otherCard.querySelector('.lectures');
          if (otherLectures) {
            otherLectures.style.maxHeight = '0';
          }
          otherCard.style.transition = 'margin-bottom 0.5s ease';
          otherCard.style.marginBottom = '20px';
        });

        if (card.classList.contains('active')) {
          lectures.style.maxHeight = '0';
          card.style.transition = 'margin-bottom 0.5s ease';
          card.classList.remove('active');
          card.style.marginBottom = '20px';
        } else {
          card.classList.add('active');
          lectures.style.maxHeight = `${dropdownHeight}px`;
          card.style.transition = 'margin-bottom 0.5s ease';
          card.style.marginBottom = `${dropdownHeight + 20}px`;
        }
      });
    });
  }

  function attachLectureLinks(scope) {
    const lectureLinks = scope.querySelectorAll('.lecture-button');
    lectureLinks.forEach((link) => {
      link.addEventListener('click', async (event) => {
        event.preventDefault();
        const href = link.getAttribute('href');
        if (!href) return;
        const url = new URL(href, window.location.href);
        const params = {
          subject: url.searchParams.get('subject'),
          topic: url.searchParams.get('topic'),
          lecture: url.searchParams.get('lecture')
        };
        await openLecture(params);
      });
    });
  }

  async function openLectureFromQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    const subject = urlParams.get('subject');
    const topic = urlParams.get('topic');
    const lecture = urlParams.get('lecture');
    if (!subject || !topic || !lecture) return;
    const courseMap = {
      physics: 'physics.html',
      chemistry: 'chemistry.html',
      mathematics: 'mathematics.html',
      math: 'mathematics.html'
    };
    const courseUrl = courseMap[subject];
    if (!courseUrl) return;
    await hideHomeTiles();
    await loadCourse(courseUrl);
    showCourseView();
    await openLecture({ subject, topic, lecture });
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  async function openLecture(params) {
    if (!params.subject || !params.topic || !params.lecture || !lectureView) return;
    currentLectureParams = params;
    courseContent.classList.add('is-fading-out');
    await wait(transitionTime);
    courseContent.classList.add('is-hidden');
    releaseInlinePhysicsScrollLock();
    activateLectureFocus();
    lectureView.classList.add('active');
    inlineLectureContent.textContent = 'Loading lecture...';
    inlineLectureTitle.textContent = '';
    await loadLectureData(params);
    await wait(focusTransitionTime);
    requestAnimationFrame(() => {
      centerInlineLecture();
      lectureView.classList.add('ready');
    });
  }

  async function hideLectureView() {
    lectureView.classList.remove('ready');
    await wait(transitionTime);
    lectureView.classList.remove('active');
    lectureView.classList.remove('ready');
    inlineLectureContent.innerHTML = '';
    inlineLectureTitle.textContent = '';
    deactivateLectureFocus();
    restoreInlinePhysicsScrollLock();
    if (fallbackWheelHandler) {
      window.removeEventListener('wheel', fallbackWheelHandler, { capture: true });
      fallbackWheelHandler = null;
    }
  }

  function showCourseContent() {
    courseContent.classList.remove('is-hidden');
    requestAnimationFrame(() => {
      courseContent.classList.remove('is-fading-out');
    });
  }

  function clearLectureState() {
    currentLectureParams = null;
  }

  // Expose inline lecture opener so other modules (e.g., physics structure) can trigger it without a full page load.
  window.openInlineLecture = openLecture;

  openLectureFromQuery();

  // Create the animated quiz CTA (atom image + button) inside a lecture content container.
  function buildQuizCTA(container, params) {
    if (!container) return null;
    const existing = container.querySelector('.quiz-button-container');
    if (existing) return existing;

    const quizBtnContainer = document.createElement('div');
    quizBtnContainer.className = 'quiz-button-container';

    const atomImage = document.createElement('img');
    atomImage.src = 'images/AtomHoldingPenToDoQuiz.png';
    atomImage.alt = 'Atom holding pen';
    atomImage.className = 'atom-image';

    const quizBtn = document.createElement('button');
    quizBtn.className = 'animated-quiz-button';
    quizBtn.textContent = 'Take Quiz';

    quizBtn.addEventListener('click', () => {
      window.location.href = `quiz.html?subject=${params.subject}&topic=${params.topic}&lecture=${encodeURIComponent(params.lecture)}`;
    });

    quizBtnContainer.appendChild(atomImage);
    quizBtnContainer.appendChild(quizBtn);
    container.appendChild(quizBtnContainer);
    return quizBtnContainer;
  }

  function appendQuizSlide(container, params) {
    if (!container) return null;
    const rail = container.querySelector('.lecture-segments-container') || container;
    if (rail.querySelector('#lecture-quiz-cta')) {
      return rail.querySelector('.quiz-button-container');
    }
    const quizSlide = document.createElement('div');
    quizSlide.className = 'lecture-slide lecture-cta-slide';
    quizSlide.id = 'lecture-quiz-cta';
    const cta = buildQuizCTA(quizSlide, params);
    if (cta) {
      rail.appendChild(quizSlide);
    }
    return cta;
  }

  // Local segmenter (mirrors LectureNavigator.prepareContent) so the inline view
  // always uses the scrollytelling layout.
  function segmentLectureHtml(content) {
    if (!content) {
      return `
        <div class="lecture-scrolly">
          <div class="lecture-rail">
            <div class="lecture-segments-container"></div>
          </div>
          <aside class="lecture-media-panel" aria-hidden="true">
            <div class="media-card">
              <div class="media-visual">
              <div class="media-placeholder">
                <div class="media-orb"></div>
                <div class="media-grid"></div>
                <div class="media-scan"></div>
              </div>
              <div class="media-custom" aria-hidden="true"></div>
              <img class="media-image" alt="">
            </div>
              <div class="media-meta">
                <div class="media-kicker">Focus</div>
                <div class="media-title">Scroll to explore</div>
                <div class="media-description">Key visuals appear here as you move through the lecture.</div>
              </div>
            </div>
          </aside>
        </div>
      `;
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const headers = Array.from(tempDiv.querySelectorAll('h2'));
    const segments = [];

    if (headers.length === 0) {
      segments.push({ title: 'Introduction', content });
    } else {
      headers.forEach((header) => {
        let segmentContent = header.outerHTML;
        let currentNode = header.nextElementSibling;
        while (currentNode && currentNode.tagName !== 'H2') {
          segmentContent += currentNode.outerHTML;
          const nextNode = currentNode.nextElementSibling;
          currentNode.parentNode.removeChild(currentNode);
          currentNode = nextNode;
        }
        segments.push({ title: header.textContent, content: segmentContent });
      });
    }

    const mediaPanelMarkup = `
      <aside class="lecture-media-panel" aria-hidden="true">
        <div class="media-card">
          <div class="media-visual">
            <div class="media-placeholder">
              <div class="media-orb"></div>
              <div class="media-grid"></div>
              <div class="media-scan"></div>
            </div>
            <div class="media-custom" aria-hidden="true"></div>
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

    let html = `
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
      html += `
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
    html += `
          </div>
        </div>
        ${mediaPanelMarkup}
      </div>
    `;
    return html;
  }

  async function loadLectureData(params) {
    if (!inlineLectureContent || !inlineLectureTitle || !inlineQuizButton || !inlineLecturePage) return;
    inlineLecturePage.classList.add('loading');
    inlineLectureContent.textContent = 'Loading...';
    inlineQuizButton.style.display = 'none';
    if (inlineButtonsContainer) {
      inlineButtonsContainer.style.display = 'none';
    }

    const lecturePath = `lectures/${params.subject}/${params.topic}/lecture${params.lecture}.json`;

    try {
      const response = await fetch(lecturePath, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Failed to load lecture: ${response.status} ${response.statusText}`);
      }
      const lectureData = await response.json();
      inlineLectureContent.dataset.subject = params.subject;
      inlineLectureContent.dataset.topic = params.topic;
      inlineLectureContent.dataset.lecture = params.lecture;
      inlineLectureTitle.textContent = lectureData.title || '';
      const contentHtml = lectureData.content || '';
      const segmentedHtml = segmentLectureHtml(contentHtml);

      inlineLectureContent.innerHTML = segmentedHtml;

      // Ensure at least the first slide is visible before observers run.
      const firstSegment = inlineLectureContent.querySelector('.lecture-segment');
      if (firstSegment && !firstSegment.classList.contains('is-visible')) {
        firstSegment.classList.add('is-visible');
      }

      // Render math (KaTeX preferred, MathJax fallback)
      if (window.katex && window.renderMathInElement) {
        renderMathInElement(inlineLectureContent, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      } else if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([inlineLectureContent]).catch((err) =>
          console.warn('MathJax rendering issue:', err)
        );
      }

      if (lectureData.hasCustomScript) {
        const scriptElement = document.createElement('script');
        scriptElement.src = `lectures/${params.subject}/${params.topic}/lecture${params.lecture}.js`;
        document.body.appendChild(scriptElement);
      }

      inlineLecturePage.classList.remove('loading');

      // Inline scrollytelling behavior.
      const segments = Array.from(inlineLectureContent.querySelectorAll('.lecture-segment'));
      const scrollyRoot = inlineLectureContent.querySelector('.lecture-scrolly');
      const mediaPanel = inlineLectureContent.querySelector('.lecture-media-panel');
      const mediaTitle = mediaPanel ? mediaPanel.querySelector('.media-title') : null;
      const mediaDescription = mediaPanel ? mediaPanel.querySelector('.media-description') : null;
      const mediaPlaceholder = mediaPanel ? mediaPanel.querySelector('.media-placeholder') : null;
      const mediaImage = mediaPanel ? mediaPanel.querySelector('.media-image') : null;
      const mediaCustom = mediaPanel ? mediaPanel.querySelector('.media-custom') : null;
      const accentColors = ['#ff8800'];
      let activeIndex = 0;

      let quizCTA = null;

      segments.forEach((segment, index) => {
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

        const isFirst = index === 0;
        const isLast = index === segments.length - 1;

        prevButton.textContent = 'Back';
        prevButton.dataset.target = isFirst ? '' : `lecture-segment-${index - 1}`;
        prevButton.classList.toggle('is-disabled', isFirst);
        prevButton.disabled = isFirst;
        prevButton.setAttribute('aria-disabled', isFirst ? 'true' : 'false');
        prevButton.addEventListener('click', () => {
          if (prevButton.disabled) return;
          const targetId = prevButton.dataset.target;
          const target = targetId ? document.getElementById(targetId) : null;
          const targetSegment = target && target.classList.contains('lecture-segment')
            ? target
            : target?.querySelector?.('.lecture-segment');
          if (targetSegment) {
            setActive(targetSegment);
          }
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });

        nextButton.textContent = isLast ? 'Finish' : 'Next';
        nextButton.dataset.target = isLast ? 'lecture-quiz-cta' : `lecture-segment-${index + 1}`;
        nextButton.addEventListener('click', () => {
          const targetId = nextButton.dataset.target;
          const target = targetId ? document.getElementById(targetId) : null;
          if (targetId === 'lecture-quiz-cta' && quizCTA) {
            quizCTA.classList.add('visible');
          }
          const targetSegment = target && target.classList.contains('lecture-segment')
            ? target
            : target?.querySelector?.('.lecture-segment');
          if (targetSegment) {
            setActive(targetSegment);
          }
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      });

      quizCTA = appendQuizSlide(inlineLectureContent, params);

      const updateMedia = (segment, index) => {
        if (!segment) return;
        const accent = accentColors[index % accentColors.length];
        if (scrollyRoot) {
          scrollyRoot.style.setProperty('--accent', accent);
        }
        if (mediaTitle) {
          mediaTitle.textContent = segment.dataset.title || `Segment ${index + 1}`;
        }
        if (mediaDescription) {
          const paragraph = segment.querySelector('p');
          const text = paragraph ? paragraph.textContent.trim() : '';
          mediaDescription.textContent = text ? `${text.slice(0, 137)}${text.length > 140 ? '...' : ''}` : 'Keep scrolling to reveal the next idea.';
        }

        const customMedia = segment.querySelector('.segment-media-custom');
        if (customMedia && mediaCustom) {
          const webappName = customMedia.dataset.webapp;
          if (webappName && window.ModuleWebapps && typeof window.ModuleWebapps.mount === 'function') {
            window.ModuleWebapps.mount(mediaCustom, webappName);
          } else {
            mediaCustom.innerHTML = customMedia.innerHTML;
          }
          if (mediaImage) {
            mediaImage.classList.remove('is-visible');
            mediaImage.removeAttribute('src');
            mediaImage.removeAttribute('alt');
          }
          if (mediaPlaceholder) {
            mediaPlaceholder.classList.add('is-hidden');
          }
          if (mediaPanel) {
            mediaPanel.classList.remove('is-empty', 'is-image-only');
            mediaPanel.classList.add('is-custom');
          }
          return;
        }

        if (mediaCustom) {
          mediaCustom.innerHTML = '';
          delete mediaCustom.dataset.webappMounted;
        }
        if (mediaPanel) {
          mediaPanel.classList.remove('is-custom');
        }

        const image = segment.querySelector('img.segment-media');
        if (image && mediaImage) {
          mediaImage.src = image.src;
          mediaImage.alt = image.alt || (segment.dataset.title || 'Lecture visual');
          mediaImage.classList.add('is-visible');
          if (mediaPlaceholder) {
            mediaPlaceholder.classList.add('is-hidden');
          }
          if (mediaPanel) {
            mediaPanel.classList.remove('is-empty');
            mediaPanel.classList.add('is-image-only');
          }
        } else {
          if (mediaImage) {
            mediaImage.classList.remove('is-visible');
            mediaImage.removeAttribute('src');
            mediaImage.removeAttribute('alt');
          }
          if (mediaPlaceholder) {
            mediaPlaceholder.classList.add('is-hidden');
          }
          if (mediaPanel) {
            mediaPanel.classList.add('is-empty');
            mediaPanel.classList.remove('is-image-only');
          }
        }
      };

      const setActive = (segment) => {
        if (!segment) return;
        const idx = Number(segment.dataset.index) || 0;
        activeIndex = idx;
        updateMedia(segment, idx);
        segments.forEach((seg, i) => {
          seg.classList.toggle('is-visible', i === idx);
        });
      };

      if (segments[0]) {
        setActive(segments[0]);
      }

      if ('IntersectionObserver' in window) {
        const segmentObserver = new IntersectionObserver((entries) => {
          const visible = [];
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              visible.push(entry);
            }
          });
          if (visible.length) {
            visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
            const focus = visible[0];
            setActive(focus.target);
          }
        }, { threshold: 0.5, rootMargin: '0px 0px -20% 0px' });

        segments.forEach((segment) => segmentObserver.observe(segment));

        if (quizCTA && segments.length) {
          const lastSegment = segments[segments.length - 1];
          const quizObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                quizCTA.classList.add('visible');
                quizObserver.disconnect();
              }
            });
          }, { threshold: 0.6 });
          quizObserver.observe(lastSegment);
        }
      }

      if (fallbackWheelHandler) {
        window.removeEventListener('wheel', fallbackWheelHandler, { capture: true });
      }
      let scrollLocked = false;
      let scrollLockTimeout = null;
      fallbackWheelHandler = (event) => {
        if (!lectureView || !lectureView.classList.contains('active')) return;
        if (!inlineLectureContent || !inlineLectureContent.isConnected) return;
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        const scaledDelta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * window.innerHeight : event.deltaY;
        if (!scaledDelta) return;
        if (scrollLocked) {
          event.preventDefault();
          return;
        }
        const direction = scaledDelta > 0 ? 1 : -1;
        const lastIndex = segments.length - 1;
        const quizSlide = document.getElementById('lecture-quiz-cta');
        let isCtaActive = false;
        if (quizSlide) {
          const rect = quizSlide.getBoundingClientRect();
          const midpoint = window.innerHeight / 2;
          isCtaActive = rect.top <= midpoint && rect.bottom >= midpoint;
        }
        event.preventDefault();
        if (isCtaActive) {
          if (direction < 0 && segments[lastIndex]) {
            setActive(segments[lastIndex]);
            segments[lastIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else if (direction > 0 && activeIndex >= lastIndex) {
          if (quizSlide) {
            if (quizCTA) {
              quizCTA.classList.add('visible');
            }
            quizSlide.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          const nextIndex = activeIndex + direction;
          if (nextIndex >= 0 && nextIndex < segments.length) {
            setActive(segments[nextIndex]);
            segments[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        scrollLocked = true;
        if (scrollLockTimeout) {
          clearTimeout(scrollLockTimeout);
        }
        scrollLockTimeout = setTimeout(() => {
          scrollLocked = false;
        }, 600);
      };
      window.addEventListener('wheel', fallbackWheelHandler, { passive: false, capture: true });

      if (inlineButtonsContainer) {
        inlineButtonsContainer.style.display = 'none';
      }
    } catch (error) {
      console.error('Error loading inline lecture:', error);
      inlineLectureTitle.textContent = 'Error Loading Lecture';
      inlineLectureContent.innerHTML = '<p>Could not load lecture content.</p>';
      inlineLecturePage.classList.remove('loading');
    }
  }
})();
