/**
 * Quiz Creation Tool
 * A command-line tool to create new quiz JSON files
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Quiz template
const quizTemplate = {
  title: '',
  subject: '',
  topic: '',
  lectureNumber: '',
  questions: [],
  metadata: {
    difficulty: 'beginner',
    timeEstimate: '10 minutes',
    tags: [],
    lastUpdated: new Date().toISOString().split('T')[0]
  }
};

// Question template
const questionTemplate = {
  question: '',
  choices: ['', '', '', ''],
  correctAnswer: 0,
  explanation: ''
};

// Create directories if they don't exist
function createDirectories(dirPath) {
  const parts = dirPath.split(path.sep);
  let currentPath = '';
  
  for (const part of parts) {
    currentPath = path.join(currentPath, part);
    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath);
      console.log(`Created directory: ${currentPath}`);
    }
  }
}

// Ask for question details
function askForQuestion(questionNumber) {
  return new Promise((resolve) => {
    console.log(`\n--- Question ${questionNumber} ---`);
    
    const question = { ...questionTemplate };
    
    rl.question('Question text: ', (text) => {
      question.question = text;
      
      console.log('\nEnter 4 answer choices:');
      askForChoices(question.choices, 0, () => {
        rl.question('\nCorrect answer (0-3): ', (answer) => {
          question.correctAnswer = parseInt(answer);
          
          rl.question('Explanation: ', (explanation) => {
            question.explanation = explanation;
            resolve(question);
          });
        });
      });
    });
  });
}

// Ask for choices recursively
function askForChoices(choices, index, callback) {
  if (index >= choices.length) {
    callback();
    return;
  }
  
  rl.question(`Choice ${index} (${String.fromCharCode(65 + index)}): `, (choice) => {
    choices[index] = choice;
    askForChoices(choices, index + 1, callback);
  });
}

// Main function to create quiz file
async function createQuiz() {
  console.log('=== Quiz Creation Tool ===\n');
  
  const quiz = { ...quizTemplate };
  
  rl.question('Subject (e.g., physics): ', (subject) => {
    quiz.subject = subject;
    
    rl.question('Topic (e.g., kinematics): ', (topic) => {
      quiz.topic = topic;
      
      rl.question('Lecture number: ', (lectureNumber) => {
        quiz.lectureNumber = lectureNumber;
        
        rl.question('Quiz title: ', (title) => {
          quiz.title = title;
          
          rl.question('Difficulty (beginner/intermediate/advanced): ', (difficulty) => {
            quiz.metadata.difficulty = difficulty || 'beginner';
            
            rl.question('Estimated time (e.g., 10 minutes): ', (time) => {
              quiz.metadata.timeEstimate = time || '10 minutes';
              
              rl.question('Tags (comma-separated): ', (tags) => {
                quiz.metadata.tags = tags.split(',').map(tag => tag.trim());
                
                rl.question('Number of questions: ', async (numQuestions) => {
                  const count = parseInt(numQuestions);
                  
                  // Ask for each question
                  for (let i = 0; i < count; i++) {
                    const question = await askForQuestion(i + 1);
                    quiz.questions.push(question);
                  }
                  
                  // Create the directory structure
                  const dirPath = path.join('..', 'quizzes', subject, topic);
                  createDirectories(dirPath);
                  
                  // Write the quiz file
                  const filePath = path.join(dirPath, `quiz${lectureNumber}.json`);
                  fs.writeFileSync(filePath, JSON.stringify(quiz, null, 2));
                  
                  console.log(`\nQuiz file created successfully: ${filePath}`);
                  rl.close();
                });
              });
            });
          });
        });
      });
    });
  });
}

// Start the quiz creation process
createQuiz(); 