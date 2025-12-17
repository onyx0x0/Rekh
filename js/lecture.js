// js/lecture.js

document.addEventListener('DOMContentLoaded', function() {
  // Get the query parameters from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const subject = urlParams.get('subject');
  const topic = urlParams.get('topic');
  const lectureName = urlParams.get('lecture'); // Use lecture name

  console.log('Lecture Page Loaded');
  console.log('Subject:', subject);
  console.log('Topic:', topic);
  console.log('Lecture Name:', lectureName);

  const lectureTitleElement = document.getElementById('lecture-title');
  const lectureContentElement = document.getElementById('lecture-content');
  const quizButton = document.getElementById('quiz-button');
  const lecturePage = document.querySelector('.lecture-page');

  // Function to load the lecture content from local file
  async function loadLecture() {
    if (!subject || !topic || !lectureName) {
      console.log('Missing URL parameters.');
      lectureTitleElement.textContent = 'Lecture Not Found';
      lectureTitleElement.style.visibility = 'visible';
      lectureTitleElement.style.opacity = '1';
      lectureContentElement.innerHTML = '<p>The requested lecture could not be found.</p>';
      quizButton.style.display = 'none'; // Hide Quiz Button if parameters are invalid
      lecturePage.classList.remove('loading');
      return;
    }

    // Construct the path to the lecture file
    const lecturePath = `lectures/${subject}/${topic}/lecture${lectureName}.json`;
    
    try {
      // Fetch the lecture data from the JSON file
      const response = await fetch(lecturePath);
      
      if (!response.ok) {
        throw new Error(`Failed to load lecture: ${response.status} ${response.statusText}`);
      }
      
      const lectureData = await response.json();
      console.log('Lecture Data:', lectureData);
      
      // Update the page with lecture data
      lectureTitleElement.textContent = lectureData.title;
      
      // Hide the original quiz button since we'll use the one in the navigation
      const buttonsContainer = document.getElementById('buttons-container');
      if (buttonsContainer) {
        buttonsContainer.style.display = 'none';
      }
      
      // Process the content for interactive navigation
      const processedContent = LectureNavigator.prepareContent(lectureData.content);
      lectureContentElement.innerHTML = processedContent;

      // After setting the HTML, trigger KaTeX to typeset any equations
      if (window.katex && window.renderMathInElement) {
        renderMathInElement(document.body, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false}
          ],
          throwOnError: false
        });
      }
      
      // If there's a custom script for this lecture, load it
      if (lectureData.hasCustomScript) {
        const scriptElement = document.createElement('script');
        scriptElement.src = `lectures/${subject}/${topic}/lecture${lectureName}.js`;
        document.body.appendChild(scriptElement);
      }
      
      // Remove loading state and show the title
      lectureTitleElement.style.visibility = 'visible';
      lectureTitleElement.style.opacity = '1';
      lecturePage.classList.remove('loading');
      
      // Initialize the lecture navigator
      // Clear any existing instance first
      window.lectureNavigator = null;

      setTimeout(() => {
        // Create a new instance only if one doesn't exist
        if (!window.lectureNavigator) {
          window.lectureNavigator = new LectureNavigator();
          window.lectureNavigator.init();
        } else {
          // If it exists, just reinitialize it
          window.lectureNavigator.init();
        }
      }, 100);
      
    } catch (error) {
      console.error('Error fetching lecture:', error);
      lectureTitleElement.textContent = 'Error Loading Lecture';
      lectureTitleElement.style.visibility = 'visible';
      lectureTitleElement.style.opacity = '1';
      lectureContentElement.innerHTML = '<p>An error occurred while loading the lecture.</p>';
      quizButton.style.display = 'none'; // Hide Quiz Button on error
      lecturePage.classList.remove('loading');
    }
  }

  // Handle the Quiz Button click
  quizButton.addEventListener('click', function() {
    window.location.href = `quiz.html?subject=${subject}&topic=${topic}&lecture=${encodeURIComponent(lectureName)}`;
  });

  // Load the lecture when the page is ready
  loadLecture();
});
