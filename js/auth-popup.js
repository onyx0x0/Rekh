// js/auth-popup.js - Improved performance with TRUE BLACK theme

document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const authModal = document.getElementById('auth-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const tabs = document.querySelectorAll('.tab');
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');
  const signupFormContainer = document.getElementById('signup-form-container');
  const loginFormContainer = document.getElementById('login-form-container');
  
  // Cache form elements for better performance
  const signupEmail = document.getElementById('signup-email');
  const signupPassword = document.getElementById('signup-password');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  
  // Function to open the modal with improved animation
  function openModal() {
    // Reset form fields and errors
    resetForms();
    
    // Show modal with proper animation sequence
    authModal.style.display = 'block';
    
    // Force reflow to ensure transitions work properly
    void authModal.offsetWidth;
    
    // Add visible class to trigger transitions
    authModal.classList.add('visible');
    
    // Add class to body instead of changing overflow directly
    document.body.classList.add('modal-open');
  }
  
  // Function to close the modal with animation
  function closeModal() {
    // Remove visible class to trigger fade out
    authModal.classList.remove('visible');
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      authModal.style.display = 'none';
      // Remove class from body
      document.body.classList.remove('modal-open');
    }, 300); // Match transition duration
  }
  
  // Reset forms and clear any error messages
  function resetForms() {
    signupForm.reset();
    loginForm.reset();
    
    // Clear any error messages
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(el => {
      el.classList.remove('visible');
    });
    
    // Reset form borders
    const formInputs = document.querySelectorAll('.form-control');
    formInputs.forEach(input => {
      input.style.borderColor = '';
    });
  }
  
  // Tab switching functionality with improved animation to prevent flickering
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Only process if this tab isn't already active
      if (!this.classList.contains('active')) {
        // Get the tab name
        const tabName = this.getAttribute('data-tab');
        
        // Update tab states first
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // Prepare the new form container but don't show it yet
        const incomingContainer = tabName === 'signup' ? signupFormContainer : loginFormContainer;
        const outgoingContainer = tabName === 'signup' ? loginFormContainer : signupFormContainer;
        
        // First, start fading out the current form
        outgoingContainer.style.opacity = '0';
        outgoingContainer.style.transform = 'translateY(10px)';
        
        // After a short delay, switch the containers
        setTimeout(() => {
          outgoingContainer.classList.remove('active');
          incomingContainer.classList.add('active');
          
          // Force reflow to ensure transitions work properly
          void incomingContainer.offsetWidth;
          
          // Reset the incoming container's initial state
          incomingContainer.style.opacity = '0';
          incomingContainer.style.transform = 'translateY(10px)';
          
          // Force reflow again
          void incomingContainer.offsetWidth;
          
          // Then animate it in
          incomingContainer.style.opacity = '1';
          incomingContainer.style.transform = 'translateY(0)';
        }, 150);
      }
    });
  });
  
  // Display error message helper function
  function showError(form, message) {
    // Check if error element exists, create if not
    let errorElement = form.querySelector('.form-error');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'form-error';
      form.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.classList.add('visible');
  }
  
  // Close modal when clicking the close button
  closeModalBtn.addEventListener('click', closeModal);
  
  // Close modal when clicking outside the modal content
  authModal.addEventListener('click', function(event) {
    if (event.target === authModal) {
      closeModal();
    }
  });
  
  // Handle sign-up form submission with improved error handling
  signupForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = signupEmail.value.trim();
    const password = signupPassword.value.trim();
    
    // Disable submit button to prevent multiple submissions
    const submitButton = this.querySelector('.submit-button');
    submitButton.disabled = true;
    submitButton.textContent = 'Creating Account...';
    
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Signed up successfully
        console.log('User signed up:', userCredential.user);
        closeModal();
        window.location.reload(); // Reload to update UI based on auth state
      })
      .catch((error) => {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Create Account';
        
        // Show error message
        showError(signupForm, error.message);
        
        // Highlight the problematic field if possible
        if (error.code === 'auth/email-already-in-use' || error.code === 'auth/invalid-email') {
          signupEmail.style.borderColor = '#ff4d4d';
        } else if (error.code === 'auth/weak-password') {
          signupPassword.style.borderColor = '#ff4d4d';
        }
      });
  });
  
  // Handle login form submission with improved error handling
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    
    // Disable submit button to prevent multiple submissions
    const submitButton = this.querySelector('.submit-button');
    submitButton.disabled = true;
    submitButton.textContent = 'Logging In...';
    
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Logged in successfully
        console.log('User logged in:', userCredential.user);
        closeModal();
        window.location.reload(); // Reload to update UI based on auth state
      })
      .catch((error) => {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Log In';
        
        // Show error message
        showError(loginForm, error.message);
        
        // Highlight the problematic field if possible
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
          loginEmail.style.borderColor = '#ff4d4d';
        } else if (error.code === 'auth/wrong-password') {
          loginPassword.style.borderColor = '#ff4d4d';
        }
      });
  });
  
  // Add input event listeners to clear error styling when user types
  const allInputs = [signupEmail, signupPassword, loginEmail, loginPassword];
  allInputs.forEach(input => {
    input.addEventListener('input', function() {
      this.style.borderColor = '';
      
      // Find and hide any visible error in the parent form
      const form = this.closest('form');
      const errorElement = form.querySelector('.form-error');
      if (errorElement) {
        errorElement.classList.remove('visible');
      }
    });
  });
  
  // Expose the openModal function to the global scope
  window.openAuthModal = openModal;
}); 