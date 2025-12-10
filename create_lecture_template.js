// create_lecture_template.js
// A simple Node.js script to generate lecture templates

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Template for lecture JSON
const lectureTemplate = {
  title: "Lecture Title",
  content: "<div class='lecture-section'><h2>Section Title</h2><p>Section content goes here.</p></div>",
  hasCustomScript: false
};

// Template for lecture JavaScript
const scriptTemplate = `// lectures/[subject]/[topic]/lecture[number].js

document.addEventListener('DOMContentLoaded', function() {
  console.log('Custom script for lecture loaded');
  
  // Your interactive code goes here
  
});`;

// Function to create directories if they don't exist
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

// Main function to create lecture files
function createLectureFiles() {
  rl.question('Subject (e.g., physics): ', (subject) => {
    rl.question('Topic (e.g., kinematics): ', (topic) => {
      rl.question('Lecture number (e.g., 3): ', (number) => {
        rl.question('Lecture title: ', (title) => {
          rl.question('Include custom script? (y/n): ', (includeScript) => {
            // Create the directory structure
            const dirPath = path.join('lectures', subject, topic);
            createDirectories(dirPath);
            
            // Create the lecture JSON file
            const lectureData = { ...lectureTemplate, title };
            lectureData.hasCustomScript = includeScript.toLowerCase() === 'y';
            
            const jsonPath = path.join(dirPath, `lecture${number}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(lectureData, null, 2));
            console.log(`Created lecture JSON file: ${jsonPath}`);
            
            // Create the script file if requested
            if (includeScript.toLowerCase() === 'y') {
              const scriptPath = path.join(dirPath, `lecture${number}.js`);
              const customScript = scriptTemplate
                .replace('[subject]', subject)
                .replace('[topic]', topic)
                .replace('[number]', number);
              
              fs.writeFileSync(scriptPath, customScript);
              console.log(`Created lecture script file: ${scriptPath}`);
            }
            
            console.log('\nLecture files created successfully!');
            console.log('\nRemember to add a link to this lecture in the appropriate course page:');
            console.log(`<a href="lecture.html?subject=${subject}&topic=${topic}&lecture=${number}" class="lecture-button">Lecture ${number}: ${title}</a>`);
            
            rl.close();
          });
        });
      });
    });
  });
}

// Start the script
console.log('=== Lecture Template Generator ===');
createLectureFiles(); 