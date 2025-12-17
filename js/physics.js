document.addEventListener('DOMContentLoaded', function() {
    const subjectCards = document.querySelectorAll('.subjects .subject');
  
    subjectCards.forEach(function(card) {
      const header = card.querySelector('.subject-header');
      const lectures = card.querySelector('.lectures');
  
      // Pre-calculate dropdown height and store it
      const dropdownHeight = lectures.scrollHeight;
  
      // Set initial styles to prevent jitter on the first click
      lectures.style.maxHeight = '0'; // Initially hide
      card.style.marginBottom = '20px'; // Default margin when dropdown is hidden
  
      header.addEventListener('click', function() {
        // Close other dropdowns before opening a new one
        subjectCards.forEach(c => {
          if (c !== card) {
            c.classList.remove('active');
            c.querySelector('.lectures').style.maxHeight = '0';
            c.style.transition = 'margin-bottom 0.5s ease'; // Smooth transition for closing
            c.style.marginBottom = '20px'; // Reset margin for inactive cards
          }
        });
  
        if (card.classList.contains('active')) {
          // Collapse the dropdown and reset margin
          lectures.style.maxHeight = '0';
          card.style.transition = 'margin-bottom 0.5s ease';
          card.classList.remove('active');
          card.style.marginBottom = '20px';
        } else {
          // Expand the dropdown smoothly
          card.classList.add('active');
          lectures.style.maxHeight = `${dropdownHeight}px`; // Use pre-calculated height
  
          // Apply smooth transition to margin, matching dropdown expansion
          card.style.transition = 'margin-bottom 0.5s ease';
          card.style.marginBottom = `${dropdownHeight + 20}px`; // Adjust margin to match dropdown
        }
      });
    });
  });
  