// js/dashboard.js

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const playerNameElement = document.getElementById('player-name');
  const playerBadgeElement = document.getElementById('player-badge');
  const playerLevelElement = document.getElementById('player-level');
  const xpFillElement = document.getElementById('xp-fill');
  const currentXpElement = document.getElementById('current-xp');
  const nextLevelXpElement = document.getElementById('next-level-xp');
  const totalQuizzesElement = document.getElementById('total-quizzes');
  const averageScoreElement = document.getElementById('average-score');
  const currentStreakElement = document.getElementById('current-streak');
  const perfectScoresElement = document.getElementById('perfect-scores');
  const recentActivityElement = document.getElementById('recent-activity');
  const subjectMasteryElement = document.getElementById('subject-mastery');
  const achievementsGridElement = document.getElementById('achievements-grid');
  const badgeModalElement = document.getElementById('badge-modal');
  const badgesGridElement = document.getElementById('badges-grid');
  const closeBadgeModalButton = document.getElementById('close-badge-modal');
  const playerBadgeContainer = document.getElementById('player-badge-container');
  const modalContent = badgeModalElement.querySelector('.modal-content');
  const playerInfoContainer = document.querySelector('.player-info');
  const playerCard = document.querySelector('.player-card');

  // Create invisible placeholder content to maintain layout
  if (playerNameElement) {
    playerNameElement.innerHTML = '<span style="opacity: 0;">Placeholder</span>';
  }
  
  // Make badge invisible but keep its space
  if (playerBadgeElement) {
    playerBadgeElement.style.opacity = '0';
  }
  
  // Add loading indicator that doesn't affect layout
  if (playerCard) {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<div class="spinner"></div>';
    playerCard.appendChild(loadingIndicator);
  }

  // Initialize modal event listeners
  if (modalContent) {
    modalContent.addEventListener('click', function(event) {
      event.stopPropagation();
    });
  }

  // Game stats
  let quizResults = [];
  let subjectStats = {};
  let userBadge = '';  // Start with empty badge
  let userLevel = 1;
  let userXp = 0;
  let xpPerLevel = 500;
  
  // Calendar state
  let currentCalendarDate = new Date();
  let quizzesByDate = {};
  
  // Available badges - using the User badges folder with exoplanet names
  const availableBadges = [
    { file: 'badge1.png', name: 'Kepler-186f' },
    { file: 'badge2.png', name: 'TRAPPIST-1e' },
    { file: 'badge3.png', name: 'HD 209458b' },
    { file: 'badge4.png', name: 'Proxima Centauri b' },
    { file: 'badge5.png', name: 'K2-18b' }
  ];

  // Monitor authentication status
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in
      // Fetch user profile data (including badge)
      fetchUserProfile(user.uid);
      
      // Fetch quiz results from Firestore
      fetchQuizResults(user.uid);
    } else {
      // No user is signed in, redirect to the home page
      window.location.href = 'index.html';
    }
  });

  // Fetch user profile from Firestore
  function fetchUserProfile(userId) {
    db.collection('users').doc(userId).get()
      .then((doc) => {
        if (doc.exists && doc.data().badge) {
          userBadge = doc.data().badge;
          updateBadgeDisplay();
        } else {
          // Create default profile if it doesn't exist
          const randomBadgeIndex = Math.floor(Math.random() * availableBadges.length);
          userBadge = availableBadges[randomBadgeIndex].file;
          
          db.collection('users').doc(userId).set({
            badge: userBadge
          }, { merge: true })
          .then(() => {
            updateBadgeDisplay();
          })
          .catch(error => {
            console.error('Error creating user profile:', error);
          });
        }
        
        // Show user name after badge is loaded
        const currentUser = firebase.auth().currentUser;
        if (currentUser && playerNameElement) {
          playerNameElement.textContent = currentUser.displayName || currentUser.email.split('@')[0];
        }
        
        // Make badge visible now that it's loaded
        if (playerBadgeElement) {
          playerBadgeElement.style.opacity = '1';
        }
        
        // Remove loading indicator
        const loadingIndicator = document.querySelector('.loading-indicator');
        if (loadingIndicator) loadingIndicator.remove();
      })
      .catch((error) => {
        console.error('Error fetching user profile:', error);
        
        // Show error state
        if (playerNameElement) {
          playerNameElement.textContent = 'Error loading profile';
        }
        
        // Remove loading indicator
        const loadingIndicator = document.querySelector('.loading-indicator');
        if (loadingIndicator) loadingIndicator.remove();
      });
  }

  // Update badge display
  function updateBadgeDisplay() {
    playerBadgeElement.src = `images/User badges/${userBadge}`;
  }

  // Fetch quiz results from Firestore
  function fetchQuizResults(userId) {
    db.collection('users').doc(userId)
      .collection('quizResults')
      .orderBy('completedAt', 'desc')
      .get()
      .then((querySnapshot) => {
        if (querySnapshot.empty) {
          // No quiz results yet
          displayNoQuizResults();
          return;
        }

        // Process quiz results
        quizResults = querySnapshot.docs.map(doc => {
          return { id: doc.id, ...doc.data() };
        });
        
        // Group quizzes by date for calendar view
        organizeQuizzesByDate();

        // Calculate and display stats
        calculateGameStats();
        displayCalendarActivity();
        calculateSubjectMastery();
        updateAchievements();
      })
      .catch((error) => {
        console.error('Error fetching quiz results:', error);
        displayError();
      });
  }
  
  // Organize quizzes by date for calendar view
  function organizeQuizzesByDate() {
    quizzesByDate = {};
    
    quizResults.forEach(quiz => {
      if (quiz.completedAt) {
        const date = quiz.completedAt.toDate();
        const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        if (!quizzesByDate[dateString]) {
          quizzesByDate[dateString] = [];
        }
        
        quizzesByDate[dateString].push(quiz);
      }
    });
  }

  // Calculate game stats from quiz results
  function calculateGameStats() {
    // Total quizzes completed
    const totalQuizzes = quizResults.length;
    
    // Average score
    const totalScore = quizResults.reduce((sum, quiz) => sum + quiz.score, 0);
    const averageScore = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0;
    
    // Perfect scores (100%)
    const perfectScores = quizResults.filter(quiz => quiz.score === 100).length;
    
    // Calculate streak
    const streak = calculateStreak();
    
    // Calculate XP and level
    // Use the xpEarned property stored in quiz results
    userXp = quizResults.reduce((sum, quiz) => {
      return sum + (quiz.xpEarned || 0); // Use xpEarned property (fallback to 0 if not available)
    }, 0);
    
    userLevel = Math.max(1, Math.floor(userXp / xpPerLevel) + 1);
    const currentLevelXp = userXp % xpPerLevel;
    const xpPercentage = (currentLevelXp / xpPerLevel) * 100;
    
    // Update DOM elements
    totalQuizzesElement.textContent = totalQuizzes;
    averageScoreElement.textContent = averageScore + '%';
    perfectScoresElement.textContent = perfectScores;
    currentStreakElement.textContent = streak;
    playerLevelElement.textContent = userLevel;
    xpFillElement.style.width = xpPercentage + '%';
    currentXpElement.textContent = currentLevelXp;
    nextLevelXpElement.textContent = xpPerLevel;
    
    // Animate the stats
    animateStats();
  }

  // Animate stats with a counting effect
  function animateStats() {
    const statElements = document.querySelectorAll('.stat-value');
    
    statElements.forEach(element => {
      const finalValue = element.textContent;
      let startValue = 0;
      let duration = 1500;
      let startTime = null;
      
      // Remove % if present for calculation
      const isPercentage = finalValue.includes('%');
      const targetValue = parseInt(finalValue.replace('%', ''));
      
      function updateNumber(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        // Use easeOutQuad for smoother animation
        const easeProgress = 1 - (1 - progress) * (1 - progress);
        
        // Calculate current value
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeProgress);
        
        // Update element text
        element.textContent = isPercentage ? `${currentValue}%` : currentValue;
        
        // Continue animation if not complete
        if (progress < 1) {
          requestAnimationFrame(updateNumber);
        }
      }
      
      // Start animation
      requestAnimationFrame(updateNumber);
    });
  }

  // Calculate current streak based on quiz completion dates
  function calculateStreak() {
    if (quizResults.length === 0) return 0;
    
    // Sort quiz results by date
    const sortedDates = quizResults
      .map(quiz => quiz.completedAt ? quiz.completedAt.toDate() : new Date())
      .sort((a, b) => b - a); // Sort descending
    
    // Get unique dates (one quiz per day counts for streak)
    const uniqueDates = [];
    const dateStrings = new Set();
    
    sortedDates.forEach(date => {
      const dateString = date.toDateString();
      if (!dateStrings.has(dateString)) {
        dateStrings.add(dateString);
        uniqueDates.push(date);
      }
    });
    
    // Calculate streak
    let streak = 1;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if the most recent quiz was today or yesterday
    const mostRecentDate = uniqueDates[0];
    const mostRecentDateString = mostRecentDate.toDateString();
    
    if (mostRecentDateString !== today.toDateString() && 
        mostRecentDateString !== yesterday.toDateString()) {
      // Streak broken - most recent quiz was before yesterday
      return 0;
    }
    
    // Count consecutive days
    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = uniqueDates[i-1];
      const prevDate = uniqueDates[i];
      
      // Check if dates are consecutive
      const diffTime = currentDate - prevDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
      } else {
        break; // Streak broken
      }
    }
    
    return streak;
  }

  // Display calendar activity
  function displayCalendarActivity() {
    if (quizResults.length === 0) {
      recentActivityElement.innerHTML = '<p class="empty-state">No activity yet. Complete some quizzes to see your progress!</p>';
      return;
    }
    
    // Create calendar container
    const calendarContainer = document.createElement('div');
    calendarContainer.className = 'calendar-container';
    
    // Create calendar header
    const calendarHeader = document.createElement('div');
    calendarHeader.className = 'calendar-header';
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const calendarTitle = document.createElement('div');
    calendarTitle.className = 'calendar-title';
    calendarTitle.textContent = `${monthNames[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`;
    
    const calendarNav = document.createElement('div');
    calendarNav.className = 'calendar-nav';
    
    const prevMonthBtn = document.createElement('button');
    prevMonthBtn.className = 'calendar-nav-btn';
    prevMonthBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevMonthBtn.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
      displayCalendarActivity();
    });
    
    const nextMonthBtn = document.createElement('button');
    nextMonthBtn.className = 'calendar-nav-btn';
    nextMonthBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    
    // Check if next month is in the future
    const today = new Date();
    const nextMonth = new Date(currentCalendarDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    // Disable next button if it would go to a future month
    if (nextMonth > today) {
      nextMonthBtn.disabled = true;
      nextMonthBtn.style.opacity = '0.3';
      nextMonthBtn.style.cursor = 'not-allowed';
    } else {
      nextMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        displayCalendarActivity();
      });
    }
    
    calendarNav.appendChild(prevMonthBtn);
    calendarNav.appendChild(nextMonthBtn);
    
    calendarHeader.appendChild(calendarTitle);
    calendarHeader.appendChild(calendarNav);
    
    // Create calendar grid
    const calendarGrid = document.createElement('div');
    calendarGrid.className = 'calendar-grid';
    
    // Add day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'calendar-day-header';
      dayHeader.textContent = day;
      calendarGrid.appendChild(dayHeader);
    });
    
    // Get current month's days
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of the week for the first day (0-6, where 0 is Sunday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Add days from previous month to fill the first row
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = 0; i < firstDayOfWeek; i++) {
      const day = prevMonthLastDay - firstDayOfWeek + i + 1;
      const dayElement = createDayElement(new Date(year, month - 1, day), true);
      calendarGrid.appendChild(dayElement);
    }
    
    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dayElement = createDayElement(new Date(year, month, day), false);
      calendarGrid.appendChild(dayElement);
    }
    
    // Add days from next month to fill the last row
    const daysAdded = firstDayOfWeek + lastDay.getDate();
    const remainingDays = 7 - (daysAdded % 7);
    if (remainingDays < 7) {
      for (let day = 1; day <= remainingDays; day++) {
        const dayElement = createDayElement(new Date(year, month + 1, day), true);
        calendarGrid.appendChild(dayElement);
      }
    }
    
    // Assemble calendar
    calendarContainer.appendChild(calendarHeader);
    calendarContainer.appendChild(calendarGrid);
    
    // Update the DOM
    recentActivityElement.innerHTML = '';
    recentActivityElement.appendChild(calendarContainer);
  }
  
  // Create a day element for the calendar
  function createDayElement(date, isOtherMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    if (isOtherMonth) {
      dayElement.classList.add('other-month');
    }
    
    // Check if it's today
    const today = new Date();
    if (date.getDate() === today.getDate() && 
        date.getMonth() === today.getMonth() && 
        date.getFullYear() === today.getFullYear()) {
      dayElement.classList.add('today');
    }
    
    // Set day number
    dayElement.textContent = date.getDate();
    
    // Check if there are quizzes on this day
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const dayQuizzes = quizzesByDate[dateString] || [];
    
    if (dayQuizzes.length > 0) {
      dayElement.classList.add('has-activity');
      
      // Create popup with activity info
      const popup = document.createElement('div');
      popup.className = 'day-activity-popup';
      
      if (dayQuizzes.length === 1) {
        popup.textContent = '1 quiz taken';
      } else {
        popup.textContent = `${dayQuizzes.length} quizzes taken`;
      }
      
      dayElement.appendChild(popup);
    }
    
    return dayElement;
  }

  // Calculate and display subject mastery
  function calculateSubjectMastery() {
    // Get all available subjects and their total quizzes
    const subjectTotals = {
      'physics': 20,  // Example: 20 total quizzes available for physics
      'mathematics': 15,
      'chemistry': 18
      // Add more subjects as needed
    };
    
    // Group quiz results by subject
    const subjects = {};
    
    // Initialize subjects with 0 completed quizzes
    Object.keys(subjectTotals).forEach(subject => {
      subjects[subject] = {
        completed: 0,
        total: subjectTotals[subject]
      };
    });
    
    // Count completed quizzes by subject
    quizResults.forEach(quiz => {
      const subject = quiz.subject.toLowerCase();
      if (subjects[subject]) {
        subjects[subject].completed++;
      } else {
        // If we encounter a subject not in our predefined list
        subjects[subject] = {
          completed: 1,
          total: 10 // Default assumption
        };
      }
    });
    
    // Display subject mastery
    if (Object.keys(subjects).length === 0) {
      subjectMasteryElement.innerHTML = '<p class="empty-state">Complete quizzes to see your subject mastery!</p>';
      return;
    }
    
    let masteryHTML = '';
    
    Object.keys(subjects).forEach(subject => {
      const subjectData = subjects[subject];
      const completionPercentage = Math.round((subjectData.completed / subjectData.total) * 100);
      
      // Determine mastery class based on completion percentage
      let masteryClass = 'mastery-beginner';
      if (completionPercentage >= 90) {
        masteryClass = 'mastery-master';
      } else if (completionPercentage >= 75) {
        masteryClass = 'mastery-advanced';
      } else if (completionPercentage >= 50) {
        masteryClass = 'mastery-intermediate';
      }
      
      masteryHTML += `
        <div class="mastery-card ${masteryClass}">
          <div class="mastery-subject">${subject}</div>
          <div class="mastery-completion">${completionPercentage}%</div>
        </div>
      `;
    });
    
    subjectMasteryElement.innerHTML = masteryHTML;
  }

  // Update achievements based on user stats
  function updateAchievements() {
    // Define achievements
    const achievements = [
      {
        id: 'first-quiz',
        title: 'First Steps',
        description: 'Complete your first quiz',
        icon: 'fas fa-shoe-prints',
        unlocked: quizResults.length >= 1
      },
      {
        id: 'quiz-master',
        title: 'Quiz Master',
        description: 'Complete 10 quizzes',
        icon: 'fas fa-crown',
        unlocked: quizResults.length >= 10
      },
      {
        id: 'perfect-score',
        title: 'Perfect Score',
        description: 'Get 100% on any quiz',
        icon: 'fas fa-award',
        unlocked: quizResults.some(quiz => quiz.score === 100)
      },
      {
        id: 'streak-3',
        title: 'On Fire',
        description: 'Maintain a 3-day streak',
        icon: 'fas fa-fire',
        unlocked: calculateStreak() >= 3
      },
      {
        id: 'high-level',
        title: 'Level Up',
        description: 'Reach level 5',
        icon: 'fas fa-level-up-alt',
        unlocked: userLevel >= 5
      },
      {
        id: 'subject-master',
        title: 'Subject Expert',
        description: 'Reach Master level in any subject',
        icon: 'fas fa-graduation-cap',
        unlocked: Object.values(subjectStats).some(subject => subject.masteryLevel === 'Master')
      }
    ];
    
    // Generate HTML for achievements
    let achievementsHTML = '';
    
    achievements.forEach(achievement => {
      if (achievement.unlocked) {
        achievementsHTML += `
          <div class="achievement unlocked" title="${achievement.title}: ${achievement.description}">
            <i class="${achievement.icon}"></i>
          </div>
        `;
      } else {
        achievementsHTML += `
          <div class="achievement locked" title="${achievement.title}: ${achievement.description}">
            <i class="fas fa-lock"></i>
          </div>
        `;
      }
    });
    
    achievementsGridElement.innerHTML = achievementsHTML;
  }

  // Display message when no quiz results are available
  function displayNoQuizResults() {
    totalQuizzesElement.textContent = '0';
    averageScoreElement.textContent = '0%';
    perfectScoresElement.textContent = '0';
    currentStreakElement.textContent = '0';
    playerLevelElement.textContent = '1';
    xpFillElement.style.width = '0%';
    currentXpElement.textContent = '0';
    nextLevelXpElement.textContent = xpPerLevel;
    
    recentActivityElement.innerHTML = '<p class="empty-state">No activity yet. Complete some quizzes to see your progress!</p>';
    subjectMasteryElement.innerHTML = '<p class="empty-state">Complete quizzes to see your subject mastery!</p>';
  }

  // Display error message
  function displayError() {
    recentActivityElement.innerHTML = '<p class="error-message">Error loading your data. Please try again later.</p>';
  }

  // Event Listeners
  playerBadgeContainer.addEventListener('click', function(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Get badge position
    const badgeRect = playerBadgeContainer.getBoundingClientRect();
    
    // Create a completely new modal instead of using the existing one
    const modalHTML = `
      <div class="badge-select-overlay" style="display: flex; opacity: 0; transform: translateY(-20px);">
        <div class="badge-select-container" style="position: absolute; top: ${badgeRect.bottom + window.scrollY}px; left: ${badgeRect.left}px; transform-origin: top left; transform: scale(0.9);">
          <div class="badge-select-header">
            <h3>Select Badge</h3>
            <button class="badge-close-btn">&times;</button>
          </div>
          <div class="badge-select-grid">
            ${availableBadges.map(badge => `
              <div class="badge-select-item ${badge.file === userBadge ? 'selected' : ''}" data-badge="${badge.file}">
                <img src="images/User badges/${badge.file}" alt="${badge.name}">
                <div class="badge-name">${badge.name}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    // Remove any existing badge overlay
    const existingOverlay = document.querySelector('.badge-select-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    // Add the new modal to the body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listeners to the new modal
    const overlay = document.querySelector('.badge-select-overlay');
    const container = document.querySelector('.badge-select-container');
    const closeBtn = document.querySelector('.badge-close-btn');
    const badgeItems = document.querySelectorAll('.badge-select-item');
    
    // Animate in
    setTimeout(() => {
      overlay.style.opacity = '1';
      overlay.style.transform = 'translateY(0)';
      container.style.transform = 'scale(1)';
    }, 10);
    
    // Animation transition
    overlay.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    container.style.transition = 'transform 0.2s ease';
    
    // Close function with animation
    const closeModal = () => {
      overlay.style.opacity = '0';
      overlay.style.transform = 'translateY(-20px)';
      container.style.transform = 'scale(0.9)';
      
      setTimeout(() => {
        overlay.remove();
      }, 200);
    };
    
    // Close button event
    closeBtn.addEventListener('click', closeModal);
    
    // Close when clicking outside the modal content
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeModal();
      }
    });
    
    // Badge selection
    badgeItems.forEach(item => {
      item.addEventListener('click', function() {
        const badge = this.dataset.badge;
        
        // Update selection UI
        badgeItems.forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
        
        // Update user badge
        userBadge = badge;
        playerBadgeElement.src = `images/User badges/${badge}`;
        
        // Save to Firestore
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
          db.collection('users').doc(currentUser.uid).update({
            badge: badge
          })
          .then(() => {
            console.log('Badge updated successfully');
            // Close the modal after selection
            closeModal();
          })
          .catch(error => {
            console.error('Error updating badge:', error);
            closeModal();
          });
        } else {
          // Close the modal after selection even if not logged in
          closeModal();
        }
      });
    });
  });
});
