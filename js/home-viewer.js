// Handles inline course loading on the home page with simple fade transitions.
(function() {
  const courseButtons = document.querySelectorAll('.course-selection .course-button');
  const courseSelection = document.querySelector('.course-selection');
  const homeLink = document.querySelector('header .nav-left a.button[href="index.html"]');
  const widePicture = document.querySelector('.wide-picture');
  const courseView = document.getElementById('course-view');
  const courseContent = document.getElementById('course-content');
  const backButton = document.getElementById('course-back');
  const lectureView = document.getElementById('lecture-view');
  const inlineLectureTitle = document.getElementById('inline-lecture-title');
  const inlineLectureContent = document.getElementById('inline-lecture-content');
  const inlineQuizButton = document.getElementById('inline-quiz-button');
  const inlineLecturePage = document.querySelector('#inline-lecture .lecture-page');
  const inlineButtonsContainer = document.getElementById('inline-buttons-container');
  const hasNavigatorClass = () => typeof window !== 'undefined' && typeof window.LectureNavigator === 'function';
  const transitionTime = 350;
  const baseUrl = `${window.location.pathname}`;
  let currentLectureParams = null;

  if (!courseButtons.length || !courseView || !courseContent || !backButton) {
    return;
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  backButton.addEventListener('click', async () => {
    if (currentLectureParams) {
      await hideLectureView();
      showCourseContent();
      clearLectureState();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      await hideCourseView();
      revealHomeTiles();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  async function hideHomeTiles() {
    [courseSelection, widePicture].forEach((el) => {
      if (el) el.classList.add('is-fading-out');
    });
    await wait(transitionTime);
    [courseSelection, widePicture].forEach((el) => {
      if (el) el.classList.add('is-hidden');
    });
  }

  function revealHomeTiles() {
    [courseSelection, widePicture].forEach((el) => {
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
    clearLectureState();
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

  async function openLecture(params) {
    if (!params.subject || !params.topic || !params.lecture || !lectureView) return;
    currentLectureParams = params;
    courseContent.classList.add('is-fading-out');
    await wait(transitionTime);
    courseContent.classList.add('is-hidden');
    lectureView.classList.add('active');
    inlineLectureContent.textContent = 'Loading lecture...';
    inlineLectureTitle.textContent = '';
    await loadLectureData(params);
    requestAnimationFrame(() => {
      lectureView.classList.add('ready');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function hideLectureView() {
    lectureView.classList.remove('ready');
    await wait(transitionTime);
    lectureView.classList.remove('active');
    lectureView.classList.remove('ready');
    inlineLectureContent.innerHTML = '';
    inlineLectureTitle.textContent = '';
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

  // Local fallback segmenter (mirrors LectureNavigator.prepareContent) so inline view
  // always uses slide layout even if the navigator script fails to load.
  function segmentLectureHtml(content) {
    if (!content) return '<div class="lecture-segments-container"></div>';

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

    let html = '<div class="lecture-segments-container">';
    segments.forEach((segment, index) => {
      html += `
        <div class="lecture-segment" data-index="${index}">
          <div class="segment-content">
            ${segment.content}
          </div>
        </div>
      `;
    });
    html += '</div>';
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
      inlineLectureTitle.textContent = lectureData.title || '';
      const contentHtml = lectureData.content || '';
      const navigatorAvailable = hasNavigatorClass();
      const segmentedHtml = navigatorAvailable
        ? LectureNavigator.prepareContent(contentHtml)
        : segmentLectureHtml(contentHtml);

      inlineLectureContent.innerHTML = segmentedHtml;

      // Ensure at least the first slide is visible even if navigator init fails
      const firstSegment = inlineLectureContent.querySelector('.lecture-segment');
      if (firstSegment && !firstSegment.classList.contains('active')) {
        firstSegment.classList.add('active');
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

      if (navigatorAvailable) {
        const nav = new LectureNavigator(inlineLectureContent);
        setTimeout(() => nav.init(inlineLectureContent), 100);
        // Safety: ensure CTA exists even if navigator fails to append one
        setTimeout(() => {
          const cta = inlineLectureContent.querySelector('.quiz-button-container') || buildQuizCTA(inlineLectureContent, params);
          if (cta) {
            const segmentsCount = inlineLectureContent.querySelectorAll('.lecture-segment').length;
            if (segmentsCount <= 1) {
              cta.classList.add('visible');
            }
          }
        }, 200);
      } else {
        // Minimal fallback navigation if the navigator script did not load.
        const segments = Array.from(inlineLectureContent.querySelectorAll('.lecture-segment'));
        let idx = 0;
        const updateFallbackButtons = () => {
          const prev = inlineLectureContent.querySelector('.side-nav.side-nav-prev');
          const next = inlineLectureContent.querySelector('.side-nav.side-nav-next');
          const atFirst = idx === 0;
          const atLast = idx === segments.length - 1;
          const toggle = (btn, disabled) => {
            if (!btn) return;
            btn.classList.toggle('is-disabled', disabled);
            btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
          };
          toggle(prev, atFirst);
          toggle(next, atLast);
        };
        const showSegment = (newIdx) => {
          segments.forEach((seg, i) => {
            seg.classList.toggle('active', i === newIdx);
            seg.classList.toggle('prev', i < newIdx);
            seg.classList.toggle('next', i > newIdx);
          });
          idx = newIdx;
          updateFallbackButtons();
          if (quizCTA) {
            const atLast = idx === segments.length - 1 || segments.length === 1;
            quizCTA.classList.toggle('visible', atLast);
          }
        };
        const createSideBtn = (direction) => {
          const btn = document.createElement('div');
          btn.className = `side-nav side-nav-${direction}`;
          btn.innerHTML = `<div class="side-nav-icon"><i class="fas fa-chevron-${direction === 'prev' ? 'left' : 'right'}"></i></div>`;
          btn.addEventListener('click', () => {
            if (direction === 'prev' && idx > 0) showSegment(idx - 1);
            if (direction === 'next' && idx < segments.length - 1) showSegment(idx + 1);
          });
          inlineLectureContent.appendChild(btn);
        };
        if (segments.length > 1) {
          createSideBtn('prev');
          createSideBtn('next');
        }

        const quizCTA = buildQuizCTA(inlineLectureContent, params);
        showSegment(0);
        if (inlineButtonsContainer) {
          inlineButtonsContainer.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Error loading inline lecture:', error);
      inlineLectureTitle.textContent = 'Error Loading Lecture';
      inlineLectureContent.innerHTML = '<p>Could not load lecture content.</p>';
      inlineLecturePage.classList.remove('loading');
    }
  }
})();
