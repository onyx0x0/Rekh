// Modern Premium Quiz Implementation

document.addEventListener('DOMContentLoaded', function() {
  // Access the Firestore database
  const db = firebase.firestore();

  // Get the query parameters from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const subject = urlParams.get('subject');
  const topic = urlParams.get('topic');
  const lectureNumber = urlParams.get('lecture');

  // DOM Elements
  const quizTitleElement = document.getElementById('quiz-title');
  const quizContentElement = document.getElementById('quiz-content');
  const progressBarElement = document.getElementById('progress-bar');
  const prevQuestionButton = document.getElementById('prev-question');
  const nextQuestionButton = document.getElementById('next-question');
  const quizResultsElement = document.getElementById('quiz-results');
  const scoreValueElement = document.getElementById('score-value');
  const scoreCircleElement = document.getElementById('score-circle');
  const feedbackMessageElement = document.getElementById('feedback-message');
  const feedbackItemsElement = document.getElementById('feedback-items');
  const reviewQuizButton = document.getElementById('review-quiz');
  const backToLectureButton = document.getElementById('back-to-lecture');
  const confettiContainer = document.getElementById('confetti-container');

  // Quiz State
  let currentQuiz = null;
  let currentQuestionIndex = 0;
  let userAnswers = [];
  let quizStartTime = null;
  let quizCompleted = false;
  let reviewMode = false;
  const XP_PER_CORRECT_ANSWER = 50; // XP reward for each correct answer

  // Initialize the quiz
  async function initializeQuiz() {
    try {
      // Show loading state - Don't show the quiz title anymore
      
      // Load the quiz data using QuizLoader
      currentQuiz = await QuizLoader.loadQuiz(subject, topic, lectureNumber);
      
      // Don't update the title anymore
      quizStartTime = new Date();
      
      // Enable the next button if there are questions
      if (currentQuiz.questions && currentQuiz.questions.length > 0) {
        nextQuestionButton.disabled = false;
        
        // Initialize user answers array with nulls
        userAnswers = Array(currentQuiz.questions.length).fill(null);
        
        // Show the first question
        showQuestion(0);
        updateProgressBar();
      } else {
        // No questions found
        quizContentElement.innerHTML = `
          <div class="question-container">
            <p class="question-text">No questions found for this quiz.</p>
          </div>
        `;
        nextQuestionButton.disabled = true;
        prevQuestionButton.disabled = true;
      }
    } catch (error) {
      console.error('Error initializing quiz:', error);
      quizContentElement.innerHTML = `
        <div class="question-container">
          <p class="question-text">An error occurred while loading the quiz. Please try again later.</p>
        </div>
      `;
      nextQuestionButton.disabled = true;
      prevQuestionButton.disabled = true;
    }
  }

  // Show a specific question
  function showQuestion(index) {
    if (!currentQuiz || !currentQuiz.questions || index < 0 || index >= currentQuiz.questions.length) return;
    
    currentQuestionIndex = index;
    const question = currentQuiz.questions[index];
    
    // Create the question HTML
    let questionHTML = `
      <div class="question-container">
        <p class="question-text">${index + 1}. ${question.question}</p>
        <div class="answer-options">
    `;
    
    // Add each answer option
    question.choices.forEach((choice, choiceIndex) => {
      const isSelected = userAnswers[index] === choiceIndex;
      const optionClass = isSelected ? 'answer-option selected' : 'answer-option';
      
      questionHTML += `
        <div class="${optionClass}" data-index="${choiceIndex}">
          <input type="radio" id="option-${choiceIndex}" name="answer" value="${choiceIndex}" ${isSelected ? 'checked' : ''}>
          <label for="option-${choiceIndex}">
            <span class="option-marker">${String.fromCharCode(65 + choiceIndex)}</span>
            ${choice}
          </label>
        </div>
      `;
    });
    
    questionHTML += `
        </div>
      </div>
    `;
    
    // Update the quiz content
    quizContentElement.innerHTML = questionHTML;
    
    // Add event listeners to the answer options
    document.querySelectorAll('.answer-option').forEach(option => {
      option.addEventListener('click', function() {
        selectAnswer(this.dataset.index);
      });
    });
    
    // Update button states
    updateButtonStates();
    
    // If in review mode, show correct/incorrect indicators
    if (reviewMode && quizCompleted) {
      showAnswerFeedback(index);
    }
    
    // Render any math equations
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false}
        ],
        throwOnError: false
      });
    }
  }

  // Select an answer
  function selectAnswer(choiceIndex) {
    userAnswers[currentQuestionIndex] = parseInt(choiceIndex);
    
    // Update the UI to show the selected answer
    document.querySelectorAll('.answer-option').forEach(option => {
      option.classList.remove('selected');
    });
    
    const selectedOption = document.querySelector(`.answer-option[data-index="${choiceIndex}"]`);
    if (selectedOption) {
      selectedOption.classList.add('selected');
    }
    
    // Enable the next button if it's disabled
    nextQuestionButton.disabled = false;
    
    // Update progress bar
    updateProgressBar();
  }

  // Update the progress bar
  function updateProgressBar() {
    const totalQuestions = currentQuiz ? currentQuiz.questions.length : 0;
    const answeredQuestions = userAnswers.filter(answer => answer !== null).length;
    const progressPercentage = (answeredQuestions / totalQuestions) * 100;
    
    progressBarElement.style.width = `${progressPercentage}%`;
  }

  // Update button states based on current question
  function updateButtonStates() {
    // Disable previous button if on first question
    prevQuestionButton.disabled = currentQuestionIndex === 0;
    
    // Update next button text and state
    if (currentQuestionIndex === currentQuiz.questions.length - 1) {
      nextQuestionButton.textContent = quizCompleted ? 'Show Results' : 'Submit Quiz';
    } else {
      nextQuestionButton.textContent = 'Next';
    }
  }

  // Show answer feedback in review mode
  function showAnswerFeedback(index) {
    const question = currentQuiz.questions[index];
    const userAnswer = userAnswers[index];
    const correctAnswer = question.correctAnswer;
    
    document.querySelectorAll('.answer-option').forEach(option => {
      const optionIndex = parseInt(option.dataset.index);
      
      if (optionIndex === correctAnswer) {
        option.classList.add('correct');
      } else if (optionIndex === userAnswer && userAnswer !== correctAnswer) {
        option.classList.add('incorrect');
      }
    });
    
    // Add explanation if available
    if (question.explanation) {
      const explanationDiv = document.createElement('div');
      explanationDiv.className = 'explanation';
      explanationDiv.innerHTML = `
        <p><strong>Explanation:</strong> ${question.explanation}</p>
      `;
      quizContentElement.appendChild(explanationDiv);
    }
  }

  /**
   * Display the quiz results
   */
  function showResults() {
    quizCompleted = true;
    const totalQuestions = currentQuiz.questions.length;
    let correctAnswers = 0;
    
    // Count correct answers
    userAnswers.forEach((answer, index) => {
      if (answer === currentQuiz.questions[index].correctAnswer) {
        correctAnswers++;
      }
    });
    
    const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
    const earnedXP = correctAnswers * XP_PER_CORRECT_ANSWER; // Calculate XP earned
    
    // Hide the quiz title and progress bar
    if (quizTitleElement) quizTitleElement.style.display = 'none';
    document.querySelector('.quiz-progress').style.display = 'none';
    
    // Prepare the results section first
    // Clear any existing SVG
    scoreCircleElement.innerHTML = `
      <div class="score-value" id="score-value">0%</div>
      <div class="score-label">Score</div>
    `;
    
    // Create SVG circle for progress
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    const circle = document.createElementNS(svgNS, "circle");
    
    // Set circle attributes
    const radius = 75; // Half of the 150px circle + 8px border offset
    const circumference = 2 * Math.PI * radius;
    
    circle.setAttribute("cx", radius + 8); // Center X (radius + border width)
    circle.setAttribute("cy", radius + 8); // Center Y (radius + border width)
    circle.setAttribute("r", radius); // Radius
    circle.style.strokeDasharray = `0 ${circumference}`; // Start at 0%
    
    // Add circle to SVG and SVG to score circle
    svg.appendChild(circle);
    scoreCircleElement.appendChild(svg);
    
    // Generate feedback message based on score
    let feedbackMessage = '';
    if (scorePercentage >= 90) {
      feedbackMessage = 'Excellent! You have a strong understanding of this topic.';
    } else if (scorePercentage >= 70) {
      feedbackMessage = 'Good job! You have a solid grasp of most concepts.';
    } else if (scorePercentage >= 50) {
      feedbackMessage = 'You\'re on the right track, but there\'s room for improvement.';
    } else {
      feedbackMessage = 'You might want to review this topic again before moving on.';
    }
    
    // Set feedback message content but keep it initially hidden
    feedbackMessageElement.textContent = feedbackMessage;
    feedbackMessageElement.style.opacity = '0';
    feedbackMessageElement.style.transition = 'opacity 0.5s ease-out';
    
    // Show the results section
    quizContentElement.classList.add('hidden');
    quizResultsElement.classList.remove('hidden');
    
    // Hide the quiz controls
    document.querySelector('.quiz-controls').classList.add('hidden');
    
    // Hide navigation buttons initially
    const resultsControls = quizResultsElement.querySelector('.quiz-controls');
    if (resultsControls) {
      resultsControls.style.opacity = '0';
      resultsControls.style.transition = 'opacity 0.5s ease-out';
      resultsControls.style.pointerEvents = 'none'; // Prevent clicking while invisible
    }
    
    // Make the results header and score container visible immediately
    const resultsHeader = document.querySelector('.results-header');
    const scoreContainer = document.querySelector('.score-container');
    
    resultsHeader.style.opacity = '1';
    resultsHeader.style.transition = 'opacity 0.5s ease-out';
    scoreContainer.style.opacity = '1';
    scoreContainer.style.transition = 'opacity 0.5s ease-out';
    
    // Animation sequence with fixed timing to prevent flicker
    setTimeout(() => {
      // Animate the score percentage and circle
      animateScore(0, scorePercentage, 1500, circle, circumference);
      
      // After score animation completes, apply additional animations based on score
      setTimeout(() => {
        // Apply animations based on score
        const scoreValueElement = document.getElementById('score-value');
        
        if (scorePercentage >= 75) {
          // High score - add celebration animation with stars and particles
          scoreCircleElement.classList.add('celebrate');
          scoreValueElement.style.color = '#4caf50'; // Green for good score
          
          // Create cartoon explosive celebration - with a small delay to ensure starBurst is visible
          setTimeout(() => {
            createCartoonCelebration(scoreCircleElement);
          }, 200);
          
        } else if (scorePercentage < 25) {
          // Low score - just add shake animation without lightning
          scoreCircleElement.classList.add('error-shake');
          scoreValueElement.style.color = '#f44336'; // Red for bad score
          
        } else {
          // Middle scores (25-75%) - just set color, particles are handled in animateScore
          if (scorePercentage >= 50) {
            scoreValueElement.style.color = '#ff9800'; // Orange for average score
          } else {
            scoreValueElement.style.color = '#ff5722'; // Deep orange for below average
          }
        }
        
        // Create XP display after score animation
        setTimeout(() => {
          createXPDisplay(earnedXP, scoreCircleElement); 
          
          // Create level progress bar right after the XP display appears
          setTimeout(() => {
            createLevelProgressBar(earnedXP);
            
            // Show feedback message after level bar appears
            setTimeout(() => {
              feedbackMessageElement.style.opacity = '1';
              const feedbackContainer = document.querySelector('.feedback-container');
              if (feedbackContainer) feedbackContainer.style.opacity = '1';
            }, 800);
            
          }, 600);
          
        }, 600);
        
        // Generate feedback grid after a brief delay to prevent it from appearing too early
        setTimeout(() => {
          // Build the grid structure
          feedbackItemsElement.innerHTML = '<div class="feedback-grid-wrapper"><div class="feedback-grid"></div></div>';
          const feedbackGrid = feedbackItemsElement.querySelector('.feedback-grid');
          
          // Create mission items with animations intact
          currentQuiz.questions.forEach((question, index) => {
            const isCorrect = userAnswers[index] === question.correctAnswer;
            const statusClass = isCorrect ? 'correct' : 'incorrect';
            const statusText = isCorrect ? 'COMPLETED' : 'FAILED';
            
            const missionItem = document.createElement('div');
            missionItem.className = `mission-item ${statusClass}`;
            missionItem.style.setProperty('--item-index', index);
            
            missionItem.innerHTML = `
              <div class="mission-number">${index + 1}</div>
              <div class="mission-status">${statusText}</div>
            `;
            
            // Add click event to show question details
            missionItem.addEventListener('click', () => {
              // Enter review mode and jump to this question
              enterReviewMode(index);
            });
            
            feedbackGrid.appendChild(missionItem);
          });
          
          // Make the grid wrapper visible - this will trigger the individual mission item animations
          const gridWrapper = feedbackItemsElement.querySelector('.feedback-grid-wrapper');
          gridWrapper.style.opacity = '1';
          gridWrapper.style.transition = 'opacity 0.5s ease-out';
          
          // Show navigation buttons after all feedback items have appeared
          // Add extra delay to wait for all mission items to complete their animations
          const lastItemDelay = currentQuiz.questions.length * 100 + 500; // 100ms per item plus 500ms buffer
          setTimeout(() => {
            // Make nav buttons visible and enable interaction
            if (resultsControls) {
              resultsControls.style.opacity = '1';
              resultsControls.style.pointerEvents = 'auto';
            }
          }, lastItemDelay);
          
        }, 2800); // Extended delay to allow for XP display and level bar before showing feedback grid
        
      }, 1600); // Delay slightly longer than the score animation to ensure it completes
    }, 300); // Initial delay
    
    // Store quiz results in Firestore
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
      // Calculate XP earned
      
      const quizData = {
        subject: subject,
        topic: topic,
        lecture: lectureNumber,
        score: scorePercentage,
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions,
        xpEarned: earnedXP, // Store XP earned in the results
        timeTaken: Math.round((new Date() - quizStartTime) / 1000),
        completedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Update the user's XP and level in Firestore
      const userRef = db.collection('users').doc(currentUser.uid);
      
      // Get current user data
      userRef.get().then((doc) => {
        if (doc.exists) {
          const userData = doc.data();
          const currentXP = userData.xp || 0;
          const currentLevel = userData.level || 1;
          const newXP = currentXP + earnedXP;
          
          // Simple level calculation
          const XP_PER_LEVEL = 500; // Match the xpPerLevel in dashboard.js
          const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
          
          // Update user data with new XP and level
          userRef.update({
            xp: newXP,
            level: newLevel
          }).then(() => {
            console.log('User XP and level updated');
          }).catch(error => {
            console.error('Error updating user XP and level:', error);
          });
        }
      }).catch(error => {
        console.error('Error getting user data:', error);
      });
      
      // Store quiz results
      userRef.collection('quizResults').add(quizData)
        .then(() => {
          console.log('Quiz results saved to Firestore');
        })
        .catch(error => {
          console.error('Error saving quiz results:', error);
        });
    }
  }

  // Animate the score from start to end over duration milliseconds
  function animateScore(start, end, duration, circle, circumference) {
    const scoreValueElement = document.getElementById('score-value');
    const progressBarElement = document.getElementById('progress-bar');
    const startTime = performance.now();
    let previousPercentage = 0;
    const isHighScore = end >= 75; // Check if the final score is high
    const isMidScore = end >= 25 && end < 75; // Check if it's a middle score
    
    // Animation function
    function updateScore(currentTime) {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Use easeOutQuad for smoother animation
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      
      // Calculate current score
      const currentScore = Math.round(start + (end - start) * easeProgress);
      
      // Update score text
      scoreValueElement.textContent = `${currentScore}%`;
      
      // Update circle progress
      const dashArray = (currentScore / 100) * circumference;
      circle.style.strokeDasharray = `${dashArray} ${circumference}`;
      
      // For high or middle scoring results, emit particles from the progress bar tip
      if (isHighScore || isMidScore) {
        // Emit particles at intervals to make it look like they're coming from the tip
        const currentPercentage = Math.floor(currentScore / 5) * 5; // Round to nearest 5%
        if (currentPercentage > previousPercentage) {
          // Create particles at the tip of the progress bar using current visual percentage
          emitProgressParticle(currentScore);
          previousPercentage = currentPercentage;
        }
        
        // Also emit small particles randomly for a more continuous effect
        if (Math.random() > 0.85 && currentScore > 0) { // 15% chance each frame if score > 0
          emitProgressParticle(currentScore, true); // true for smaller particles
        }
      }
      
      // Continue animation if not complete
      if (progress < 1) {
        requestAnimationFrame(updateScore);
      }
    }
    
    // Start the animation
    requestAnimationFrame(updateScore);
  }

  // Create a particle emitting from the progress bar tip
  function emitProgressParticle(percentage, isSmall = false) {
    const specificColors = ['#fbbe00', '#001372', '#e30050']; // Requested colors
    const scoreCircle = document.querySelector('.score-circle');
    const svgCircle = document.querySelector('.score-circle svg circle');
    if (!scoreCircle || !svgCircle) return;
    
    // Get the bounding rectangle of the score circle for positioning
    const circleRect = scoreCircle.getBoundingClientRect();
    
    // Get the circumference and radius from the SVG circle
    const radius = parseInt(svgCircle.getAttribute('r'));
    const circumference = 2 * Math.PI * radius;
    
    // Calculate the exact position on the progress bar based on the percentage
    // The angle needs to be calculated based on the percentage of the circumference
    const angle = (percentage / 100) * 2 * Math.PI - (Math.PI / 2); // Start from top
    
    // Calculate the position relative to the circle's center
    const centerX = circleRect.width / 2;
    const centerY = circleRect.height / 2;
    
    // Calculate the position exactly on the circle's perimeter (tip of the progress)
    const tipX = Math.cos(angle) * radius + centerX;
    const tipY = Math.sin(angle) * radius + centerY;
    
    // Create a square particle
    const particle = document.createElement('div');
    
    // Choose a random color from the specific colors
    const color = specificColors[Math.floor(Math.random() * specificColors.length)];
    
    // Add class based on type
    particle.classList.add('progress-particle-square');
    if (isSmall) {
      particle.classList.add('small');
    }
    
    // Set the particle style
    particle.style.backgroundColor = color;
    particle.style.width = isSmall ? '4px' : '6px';
    particle.style.height = isSmall ? '4px' : '6px';
    
    // Position the particle at the exact tip of the progress circle
    particle.style.position = 'absolute';
    particle.style.left = `${tipX}px`;
    particle.style.top = `${tipY}px`;
    particle.style.marginLeft = `-3px`; // Center the particle
    particle.style.marginTop = `-3px`;
    
    // Set random direction for the particle to travel
    const particleAngle = angle + (Math.random() - 0.5) * Math.PI / 3; // Narrower angle variation
    const distance = 30 + Math.random() * 40; // Random distance
    
    // Set custom properties for the CSS animation
    particle.style.setProperty('--fx', `${Math.cos(particleAngle) * distance}px`);
    particle.style.setProperty('--fy', `${Math.sin(particleAngle) * distance}px`);
    
    // Add to DOM
    scoreCircle.appendChild(particle);
    
    // Remove the particle after animation completes
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    }, isSmall ? 800 : 1000);
  }

  // Create cartoonish celebration effects around the score circle
  function createCartoonCelebration(element) {
    // Create colorful square flares using Kurzgesagt-inspired colors
    const kurzColors = ['#00b9ae', '#0083c7', '#8246af', '#fb3880', '#ff8e31', '#ffde17', '#ff3838', '#25d380'];
    const numFlares = 30; // More flares for denser effect
    
    // Create explosive burst of flares all at once
    for (let i = 0; i < numFlares; i++) {
      const flare = document.createElement('div');
      flare.className = 'flare-square';
      flare.style.backgroundColor = kurzColors[i % kurzColors.length];
      
      // Random starting position behind the circle
      const startAngle = Math.random() * 2 * Math.PI;
      const startRadius = Math.random() * 40; // Random within the circle
      const startX = Math.cos(startAngle) * startRadius;
      const startY = Math.sin(startAngle) * startRadius;
      
      flare.style.position = 'absolute';
      flare.style.left = `calc(50% + ${startX}px)`;
      flare.style.top = `calc(50% + ${startY}px)`;
      
      // Random direction to shoot out, but with gravity effect (more downward)
      const angle = Math.random() * 2 * Math.PI;
      // Add more gravity (higher Y value) for falling effect
      const distance = 120 + Math.random() * 80;
      const finalX = Math.cos(angle) * distance;
      const finalY = Math.sin(angle) * distance + 100; // Add downward bias for gravity
      
      flare.style.setProperty('--sx', `${startX}px`);
      flare.style.setProperty('--sy', `${startY}px`);
      flare.style.setProperty('--tx', `${finalX}px`);
      flare.style.setProperty('--ty', `${finalY}px`);
      
      // Random size for variety
      const size = 15 + Math.random() * 25;
      flare.style.width = `${size}px`;
      flare.style.height = `${size}px`;
      
      // Random rotation for more dynamic look
      const rotation = Math.random() * 180;
      flare.style.transform = `rotate(${rotation}deg)`;
      
      // Random but small animation delay for burst effect
      flare.style.animationDelay = `${Math.random() * 200}ms`;
      
      element.appendChild(flare);
    }
    
    // Create explosion particles with vibrant colors
    const particleColors = kurzColors;
    const numParticles = 60; // More particles for a denser effect
    
    for (let i = 0; i < numParticles; i++) {
      const particle = document.createElement('div');
      particle.className = 'score-particle';
      particle.style.backgroundColor = particleColors[i % particleColors.length];
      
      // Random starting position behind the circle
      const startAngle = Math.random() * 2 * Math.PI;
      const startRadius = Math.random() * 40; // Random within the circle
      const startX = Math.cos(startAngle) * startRadius;
      const startY = Math.sin(startAngle) * startRadius;
      
      particle.style.position = 'absolute';
      particle.style.left = `calc(50% + ${startX}px)`;
      particle.style.top = `calc(50% + ${startY}px)`;
      
      // Random direction to shoot out but with gravity effect
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * 150 + 100;
      const finalX = Math.cos(angle) * distance;
      const finalY = Math.sin(angle) * distance + 120; // Add downward bias for gravity
      
      particle.style.setProperty('--sx', `${startX}px`);
      particle.style.setProperty('--sy', `${startY}px`);
      particle.style.setProperty('--tx', `${finalX}px`);
      particle.style.setProperty('--ty', `${finalY}px`);
      
      // Random size
      const size = 5 + Math.random() * 10;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Random but small animation delay for burst effect
      particle.style.animationDelay = `${Math.random() * 150}ms`;
      
      element.appendChild(particle);
    }
    
    // Clean up animated elements after animations finish
    setTimeout(() => {
      const animElements = element.querySelectorAll('.flare-square, .score-particle, .progress-particle');
      animElements.forEach(el => el.remove());
    }, 3000); // Wait for all animations to complete
  }

  // Enter review mode
  function enterReviewMode(startQuestionIndex = 0) {
    reviewMode = true;
    quizResultsElement.classList.add('hidden');
    quizContentElement.classList.remove('hidden');
    document.querySelector('.quiz-controls').classList.remove('hidden');
    
    // Only show the progress bar, but not the quiz title
    document.querySelector('.quiz-progress').style.display = '';
    
    // Show the specified question with feedback
    currentQuestionIndex = startQuestionIndex;
    showQuestion(currentQuestionIndex);
    showAnswerFeedback(currentQuestionIndex);
  }

  // Event Listeners
  prevQuestionButton.addEventListener('click', function() {
    if (currentQuestionIndex > 0) {
      showQuestion(currentQuestionIndex - 1);
    }
  });

  nextQuestionButton.addEventListener('click', function() {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      // Move to next question
      showQuestion(currentQuestionIndex + 1);
    } else {
      // On last question, submit the quiz
      if (!quizCompleted) {
        showResults();
      } else {
        // If already completed and reviewing, show results again
        quizContentElement.classList.add('hidden');
        quizResultsElement.classList.remove('hidden');
        document.querySelector('.quiz-controls').classList.add('hidden');
      }
    }
  });

  reviewQuizButton.addEventListener('click', function() {
    enterReviewMode();
  });

  backToLectureButton.addEventListener('click', function() {
    window.location.href = `lecture.html?subject=${subject}&topic=${topic}&lecture=${lectureNumber}`;
  });

  // Initialize the quiz when the page loads
  initializeQuiz();
});

// Create XP display that appears after score animation
function createXPDisplay(earnedXP, scoreCircleElement) {
  if (earnedXP <= 0) return; // Don't show if no XP earned
  
  // Create XP bubble
  const xpBubble = document.createElement('div');
  xpBubble.className = 'xp-bubble';
  xpBubble.innerHTML = `<span>+${earnedXP} XP</span>`;
  
  // Position at top right of score circle
  xpBubble.style.position = 'absolute';
  xpBubble.style.top = '-50px';
  xpBubble.style.right = '-30px';
  xpBubble.style.zIndex = '200'; // Ensure it's above other elements
  
  // Add to the DOM
  scoreCircleElement.appendChild(xpBubble);
}

// Create level progress bar that appears below the score display with FIXED ANIMATION
function createLevelProgressBar(earnedXP) {
  if (earnedXP <= 0) return; // Don't show if no XP earned
  
  const currentUser = firebase.auth().currentUser;
  if (!currentUser) return; // Don't show if user is not logged in
  
  // Get user data to get current level and XP
  db.collection('users').doc(currentUser.uid).get().then((doc) => {
    if (doc.exists) {
      const userData = doc.data();
      const currentXP = userData.xp || 0;
      const previousXP = currentXP - earnedXP; // XP before this quiz
      const currentLevel = userData.level || 1;
      
      // Calculate previous and new levels
      const XP_PER_LEVEL = 500; // Match the xpPerLevel in dashboard.js
      const previousLevel = Math.floor(previousXP / XP_PER_LEVEL) + 1;
      const levelUpOccurred = currentLevel > previousLevel;
      
      // Calculate XP needed for next level
      const previousLevelXP = (previousLevel - 1) * XP_PER_LEVEL;
      const previousXpProgressInLevel = previousXP - previousLevelXP;
      
      // Calculate percentages for animation 
      const startPercentage = (previousXpProgressInLevel / XP_PER_LEVEL) * 100;
      
      // Create level bar container
      const levelContainer = document.createElement('div');
      levelContainer.className = 'level-progress-container';
      levelContainer.style.opacity = '0';
      levelContainer.style.transition = 'opacity 0.8s ease-out';
      
      // Create level header
      const levelHeader = document.createElement('div');
      levelHeader.className = 'level-header';
      levelHeader.style.display = 'flex';
      levelHeader.style.justifyContent = 'space-between';
      levelHeader.style.marginBottom = '10px';
      
      // Start with the initial level and XP values (before adding new XP)
      levelHeader.innerHTML = `
        <div class="level-title">Level ${previousLevel}</div>
        <div class="level-xp">${previousXpProgressInLevel}/${XP_PER_LEVEL} XP</div>
      `;
      
      // Create progress bar
      const progressBarContainer = document.createElement('div');
      progressBarContainer.className = 'level-progress-bar-container';
      
      const progressBar = document.createElement('div');
      progressBar.className = 'level-progress-bar';
      progressBar.style.width = `${startPercentage}%`; // Start at current percentage
      
      // Assemble components
      progressBarContainer.appendChild(progressBar);
      levelContainer.appendChild(levelHeader);
      levelContainer.appendChild(progressBarContainer);
      
      // Add to the DOM - insert directly after score-container
      const scoreContainer = document.querySelector('.score-container');
      if (scoreContainer) {
        // Position the level bar below the score container
        scoreContainer.parentNode.insertBefore(levelContainer, scoreContainer.nextSibling);
      }
      
      // Make the level container visible after a short delay
      setTimeout(() => {
        levelContainer.style.opacity = '1';
        
        // Animate the XP bubble to the progress bar
        setTimeout(() => {
          // Get elements for updates
          const levelTitle = levelContainer.querySelector('.level-title');
          const levelXP = levelContainer.querySelector('.level-xp');
          
          // ---------- NEW ANIMATION APPROACH -----------
          // Calculate how many full levels we need to animate through
          const totalLevelsToAnimate = currentLevel - previousLevel;
          let currentLevelInAnimation = previousLevel;
          let remainingXP = earnedXP;
          
          // Start XP animation
          animateXPToProgressBar(earnedXP, progressBarContainer, () => {
            // Function to animate a single level fill with promise for chaining
            function animateLevelFill(fromPercentage, toPercentage, currentXP) {
              return new Promise(resolve => {
                // Update XP text while the bar fills
                levelXP.textContent = `${currentXP}/${XP_PER_LEVEL} XP`;
                
                // If this isn't the first level, start from the current width
                if (fromPercentage > 0) {
                  progressBar.style.width = `${fromPercentage}%`;
                }
                
                // Set transition for smooth animation
                progressBar.style.transition = 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)';
                
                // Animate to target percentage
                setTimeout(() => {
                  progressBar.style.width = `${toPercentage}%`;
                  
                  // Wait for animation to complete
                  setTimeout(() => {
                    resolve();
                  }, 1000); // Match the transition duration
                }, 50);
              });
            }
            
            // Function to animate level up with promise for chaining
            function animateLevelUp(fromLevel, toLevel) {
              return new Promise(resolve => {
                // First update the level text
                levelTitle.textContent = `Level ${toLevel}`;
                
                // Reset the progress bar to 0%
                progressBar.style.transition = 'none';
                progressBar.style.width = '0%';
                levelXP.textContent = `0/${XP_PER_LEVEL} XP`;
                
                // Force a reflow to make sure the browser recognizes the change
                progressBar.offsetHeight;
                
                // Short delay before resolving to allow UI to update
                setTimeout(resolve, 50);
              });
            }
            
            // Function to manage the entire animation sequence
            async function runFullAnimation() {
              // If no level up, just animate to the final percentage
              if (totalLevelsToAnimate === 0) {
                const finalXP = previousXpProgressInLevel + earnedXP;
                const finalPercentage = (finalXP / XP_PER_LEVEL) * 100;
                await animateLevelFill(startPercentage, finalPercentage, finalXP);
                return;
              }
              
              // First, animate the current level to 100%
              let xpNeededForCurrentLevelUp = XP_PER_LEVEL - previousXpProgressInLevel;
              remainingXP -= xpNeededForCurrentLevelUp;
              
              // Fill the first level to 100%
              await animateLevelFill(startPercentage, 100, XP_PER_LEVEL);
              
              // Now animate through each level up one by one
              for (let i = 0; i < totalLevelsToAnimate; i++) {
                currentLevelInAnimation++;
                
                // Animate the level change
                await animateLevelUp(currentLevelInAnimation - 1, currentLevelInAnimation);
                
                // If this is the last level, only fill partially
                if (i === totalLevelsToAnimate - 1) {
                  // Calculate the final percentage in the last level
                  const finalLevelXP = remainingXP;
                  const finalPercentage = (finalLevelXP / XP_PER_LEVEL) * 100;
                  
                  // Animate the final level fill
                  await animateLevelFill(0, finalPercentage, finalLevelXP);
                } else {
                  // For intermediate levels, fill to 100%
                  remainingXP -= XP_PER_LEVEL;
                  await animateLevelFill(0, 100, XP_PER_LEVEL);
                }
              }
            }
            
            // Start the full animation sequence
            runFullAnimation();
          });
        }, 300);
      }, 500);
    }
  }).catch(error => {
    console.error('Error getting user data:', error);
  });
}

// Show level up message with animation - REMOVING COMPLETELY
function showLevelUpMessage(newLevel) {
  // Function intentionally empty - removed per user request
}

// Show animation for level up
function showLevelUpAnimation(oldLevel, newLevel, levelTitleElement) {
  // Simple update without animation - just change the text
  levelTitleElement.textContent = `Level ${newLevel}`;
}

// Animate XP orbs from XP bubble to progress bar
function animateXPToProgressBar(earnedXP, targetElement, onComplete) {
  const xpBubble = document.querySelector('.xp-bubble');
  if (!xpBubble || !targetElement) return;
  
  const bubbleRect = xpBubble.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();
  
  // Create multiple XP orbs for a particle effect
  const numOrbs = Math.min(20, Math.max(8, earnedXP / 8)); // More orbs for better effect
  let orbsCompleted = 0;
  
  // Play a sound effect if available
  if (window.playSound) {
    playSound('xpCollect');
  }
  
  // Create a container for the orbs to help with positioning
  const orbContainer = document.createElement('div');
  orbContainer.style.position = 'fixed';
  orbContainer.style.top = '0';
  orbContainer.style.left = '0';
  orbContainer.style.width = '100%';
  orbContainer.style.height = '100%';
  orbContainer.style.pointerEvents = 'none';
  orbContainer.style.zIndex = '9999';
  document.body.appendChild(orbContainer);
  
  // Add a delay between each orb
  const baseDelay = 50;
  
  for (let i = 0; i < numOrbs; i++) {
    setTimeout(() => {
      const orb = document.createElement('div');
      orb.className = 'xp-orb';
      
      // Make orbs look more like game tokens/coins
      orb.style.position = 'fixed';
      orb.style.width = '12px';
      orb.style.height = '12px';
      orb.style.borderRadius = '50%';
      orb.style.boxSizing = 'border-box';
      orb.style.border = '2px solid white';
      orb.style.backgroundColor = '#001372';
      orb.style.zIndex = '1000';
      
      // Set initial position at XP bubble
      orb.style.left = `${bubbleRect.left + bubbleRect.width/2 - 6}px`;
      orb.style.top = `${bubbleRect.top + bubbleRect.height/2 - 6}px`;
      orb.style.opacity = '1';
      
      // Add to container
      orbContainer.appendChild(orb);
      
      // Calculate arc path
      const targetX = targetRect.left + (targetRect.width / 2) - 6 + (Math.random() * 20 - 10);
      const targetY = targetRect.top + (targetRect.height / 2) - 6 + (Math.random() * 10 - 5);
      
      // Calculate a control point for the arc path (higher up for a nice arc)
      const controlX = (bubbleRect.left + targetX) / 2 + (Math.random() * 40 - 20);
      const controlY = Math.min(bubbleRect.top, targetY) - 50 - (Math.random() * 50);
      
      // Animate along the arc path
      const startTime = performance.now();
      const duration = 600 + Math.random() * 200; // Slightly randomized duration
      
      function moveAlongArc(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Quadratic bezier curve calculation
        const t = progress;
        const t1 = 1 - t;
        const x = t1 * t1 * bubbleRect.left + 2 * t1 * t * controlX + t * t * targetX;
        const y = t1 * t1 * bubbleRect.top + 2 * t1 * t * controlY + t * t * targetY;
        
        // Apply position
        orb.style.left = `${x}px`;
        orb.style.top = `${y}px`;
        
        // Apply scale based on height (max scale at top of arc)
        const heightProgress = Math.sin(progress * Math.PI);
        const scale = 1 + heightProgress * 0.5;
        orb.style.transform = `scale(${scale})`;
        
        if (progress < 1) {
          requestAnimationFrame(moveAlongArc);
        } else {
          // Impact effect on arrival
          const impact = document.createElement('div');
          impact.style.position = 'absolute';
          impact.style.left = `${targetX}px`;
          impact.style.top = `${targetY}px`;
          impact.style.width = '20px';
          impact.style.height = '20px';
          impact.style.borderRadius = '50%';
          impact.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
          impact.style.transform = 'translate(-50%, -50%)';
          impact.style.zIndex = '99';
          impact.style.animation = 'impact 0.4s forwards';
          
          // Add a small impact animation
          const keyframes = `
            @keyframes impact {
              0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0.8; }
              100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
            }
          `;
          
          const style = document.createElement('style');
          style.textContent = keyframes;
          document.head.appendChild(style);
          
          targetElement.appendChild(impact);
          
          // Flash the progress bar
          const progressBar = targetElement.querySelector('.level-progress-bar');
          progressBar.style.transition = 'filter 0.1s ease';
          progressBar.style.filter = 'brightness(1.5)';
          
          setTimeout(() => {
            progressBar.style.filter = 'brightness(1)';
            impact.remove();
            style.remove();
          }, 400);
          
          // Remove the orb
          orb.remove();
          
          // Check if all orbs are done
          orbsCompleted++;
          if (orbsCompleted === numOrbs) {
            if (onComplete) {
              setTimeout(onComplete, 200);
            }
            
            // Remove the container after all animations
            setTimeout(() => {
              if (orbContainer.parentNode) {
                orbContainer.parentNode.removeChild(orbContainer);
              }
            }, 500);
          }
        }
      }
      
      // Start the animation
      requestAnimationFrame(moveAlongArc);
      
    }, i * baseDelay); // Staggered start for each orb
  }
  
  // Keep the XP bubble visible until all orbs have animated
  setTimeout(() => {
    xpBubble.style.transition = 'all 0.3s ease-out';
    xpBubble.style.opacity = '0';
    xpBubble.style.transform = 'scale(0.8)';
    setTimeout(() => {
      if (xpBubble.parentNode) {
        xpBubble.parentNode.removeChild(xpBubble);
      }
    }, 300);
  }, numOrbs * baseDelay + 400); // Wait long enough for orbs to start their journey
}
