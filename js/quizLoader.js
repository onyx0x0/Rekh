/**
 * Quiz Loader Utility
 * Handles loading quiz data from JSON files based on subject, topic, and lecture number
 */

class QuizLoader {
  /**
   * Load a quiz from a JSON file
   * @param {string} subject - The subject (e.g., 'physics')
   * @param {string} topic - The topic (e.g., 'kinematics')
   * @param {string} lectureNumber - The lecture number
   * @returns {Promise<Object>} - A promise that resolves to the quiz data
   */
  static async loadQuiz(subject, topic, lectureNumber) {
    try {
      // Construct the path to the quiz file
      const quizPath = `quizzes/${subject}/${topic}/quiz${lectureNumber}.json`;
      
      // Fetch the quiz data
      const response = await fetch(quizPath);
      
      if (!response.ok) {
        throw new Error(`Failed to load quiz: ${response.status} ${response.statusText}`);
      }
      
      const quizData = await response.json();
      console.log('Quiz loaded successfully:', quizData.title);
      
      return quizData;
    } catch (error) {
      console.error('Error loading quiz:', error);
      
      // Return a default error quiz
      return {
        title: 'Quiz Not Found',
        questions: [
          {
            question: 'Sorry, the requested quiz could not be found.',
            choices: ['Return to lecture', 'Try again', 'Contact support'],
            correctAnswer: 0,
            explanation: 'Please return to the lecture page and try again later.'
          }
        ]
      };
    }
  }
  
  /**
   * Get metadata about available quizzes for a subject/topic
   * @param {string} subject - The subject
   * @param {string} topic - The topic
   * @returns {Promise<Array>} - A promise that resolves to an array of quiz metadata
   */
  static async getAvailableQuizzes(subject, topic) {
    // This would typically fetch a directory listing or an index file
    // For now, we'll return a simple error message
    return [
      { 
        id: 'not-implemented',
        message: 'Quiz directory listing not implemented yet'
      }
    ];
  }
}

// Export the QuizLoader class
window.QuizLoader = QuizLoader; 