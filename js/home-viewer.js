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
  const transitionTime = 350;
  const baseUrl = `${window.location.pathname}`;
  let currentLectureParams = null;

  if (!courseButtons.length || !courseView || !courseContent || !backButton) {
    return;
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
      window.history.replaceState({}, '', baseUrl);
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
      attachSubjectAccordions(courseContent);
      attachLectureLinks(courseContent);
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
    window.history.replaceState({}, '', baseUrl);
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
    window.history.replaceState({}, '', `${baseUrl}?subject=${params.subject}&topic=${params.topic}&lecture=${params.lecture}`);
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

  async function loadLectureData(params) {
    if (!inlineLectureContent || !inlineLectureTitle || !inlineQuizButton || !inlineLecturePage) return;
    inlineLecturePage.classList.add('loading');
    inlineLectureContent.textContent = 'Loading...';
    inlineQuizButton.style.display = 'none';

    const lecturePath = `lectures/${params.subject}/${params.topic}/lecture${params.lecture}.json`;

    try {
      const response = await fetch(lecturePath, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Failed to load lecture: ${response.status} ${response.statusText}`);
      }
      const lectureData = await response.json();
      inlineLectureTitle.textContent = lectureData.title || '';
      const contentHtml = lectureData.content || '';
      if (window.LectureNavigator) {
        inlineLectureContent.innerHTML = LectureNavigator.prepareContent(contentHtml);
      } else {
        inlineLectureContent.innerHTML = contentHtml;
      }
      inlineQuizButton.style.display = 'inline-block';
      inlineQuizButton.onclick = () => {
        window.location.href = `quiz.html?subject=${params.subject}&topic=${params.topic}&lecture=${encodeURIComponent(params.lecture)}`;
      };
      inlineLecturePage.classList.remove('loading');

      if (window.LectureNavigator) {
        const nav = new LectureNavigator();
        setTimeout(() => nav.init(), 100);
      }
    } catch (error) {
      console.error('Error loading inline lecture:', error);
      inlineLectureTitle.textContent = 'Error Loading Lecture';
      inlineLectureContent.innerHTML = '<p>Could not load lecture content.</p>';
      inlineLecturePage.classList.remove('loading');
    }
  }
})();
