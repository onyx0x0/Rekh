## Overview
I created an educational website to teach scientific subjects, specifically Physics, Math, and Chemistry. The goal is to have a platform where users can access lectures, take quizzes, and track their progress through an interactive dashboard.

## Site Layout and Navigation
1. **Home Page**  
   - The home page displays three card-like buttons, one for each course subject (Physics, Math, and Chemistry).  
   - A **Home** button is always visible on every page of the site, serving as a persistent link back to the home page.

2. **Dashboard**  
   - I plan to include a user dashboard where each signed-in user can view their stats, such as lectures completed, tests taken, mistakes made, and progress across courses.  
   - The **Dashboard** button should only appear when the user is signed in. It's supposed to function as a quick way for users to see all their progress metrics and possibly additional features. However, right now, this button sometimes fails to show up due to tangled code.

3. **Course Access**  
   - From the home page, clicking a subject card takes you to a course page that presents topics as dropdown menu cards. The idea is to make this interactive and fun.  
   - When a user clicks on a subject dropdown (for example, "Kinematics" in Physics), it should display individual lectures (e.g., "Introduction to Kinematics," "Motion in One Dimension," etc.).  
   - Clicking on a specific lecture should take the user to a lecture page. This lecture page should maintain the same general layout as the rest of the site but display content specific to that lecture.

4. **Lecture Pages**  
   - Each lecture page should have its own content, possibly including text, tables, pictures, transparent images, or videos.  
   - There must always be a quiz button that either opens a pop-up with a "fake quiz for now" or navigates to a separate quiz page.  
   - Currently, many of these features may not be coded correctly or are unstable. Some pages do not display or function properly because the code is messy.

5. **Quiz Pages**  
   - After a user finishes a quiz, the plan is to store their results so the dashboard can display their performance.  
   - The quiz page should be modern and simple. It should also support LaTeX for math (in the form of KaTeX, as explained later).  
   - Once the quiz is completed, it should redirect the user back to the subject's page or somewhere that makes sense for continued navigation.

6. **Animated Background**  
   - There is a main animated background in the site that I spent a lot of time creating. It looks great, and it's working properly, but I am not entirely certain it's coded in the best possible way to appear correctly across all pages.

7. **Header Buttons and Flickering Issue**  
   - The **Home** button works fine and does not flicker or disappear.  
   - However, other buttons, such as the quiz button on a lecture page or the sign-in button, briefly appear each time I navigate the site, then disappear or reposition themselves. It feels like there is a transition or re-rendering glitch causing them to flicker.  
   - This flickering problem also affects the sign-in button, which behaves differently from how the home button does. I need a solution to prevent these header buttons from resetting or flickering on every page load.

## Sign-In Feature and Admin Editing
1. **User Sign-In**  
   - The sign-in feature for regular users is one of the only parts I got working correctly. It shows user accounts properly when they sign in.  
   - Once signed in, the user's name and other relevant data should appear somewhere, and the user should be able to access additional features like the dashboard.

2. **Admin Editing (Old Approach)**  
   - My original plan was to allow an admin to sign in and, when viewing a lecture page, have editor-like functionality to write or edit the lecture content (similar to using Microsoft Word).  
   - This feature, which relied on Firebase Firestore to store lecture text and files, proved to be extremely buggy. I could not figure out how to implement it reliably, so I considered giving up on it.  

3. **Revised Approach for Lectures**  
   - I decided it might be best not to use cloud services or Firestore for lectures. Instead, I want each lecture coded directly in the project directory (i.e., plain HTML files or some other local system).  
   - This means removing the on-web editor approach and storing lectures in the codebase itself, which simplifies things and is less buggy in my experience.

## KaTeX for Math
- I want to display math in LaTeX form but prefer KaTeX instead of other libraries like MathJax.  
- KaTeX allows me to select the math text, which is important for an educational site where students might want to copy and paste or interact with the expressions.

## Future Lecture and Course Expansion
1. **Structure and Organization**  
   - I need an efficient way to systematically add hundreds of lectures inside the project directory without causing clutter.  
   - Each subject (e.g., Physics, Math, Chemistry) contains several topics (e.g., "Kinematics," "Thermodynamics," etc.), and each topic contains multiple lectures.  
   - Additionally, there might be interactive educational games or small simulations embedded in some lectures.

2. **Consistent Layout**  
   - All lecture pages should maintain a consistent layout. This layout includes:  
     - The main site header (with the Home button, sign-up, log-in, log-out, and dashboard if signed in).  
     - The main animated background visible at all times.  
     - A transparent black "box" for the lecture content with slightly beveled corners, white text, and enough transparency to let the background animation show through slightly.  
     - A quiz button at the bottom of the lecture box.

3. **Final Exams**  
   - At the end of each main subject area, there should be a "Final Exam" option in the dropdown.  
   - This final exam is a standalone page with the same site layout but provides a longer, more comprehensive exam.

4. **Storing and Tracking Progress**  
   - In the future, when quizzes or exams are completed, the data should be stored and reflected in the user's dashboard.  
   - The dashboard would then show stats such as the user's overall performance in each subject, time spent, mistakes, etc.

## Current Problems to Address
1. **Code Messiness**  
   - Many features are either not coded correctly or are very unstable, leading to layout issues and missing functionality.  
   - I suspect there are directory structure problems and general disorganization, making everything harder to fix.

2. **Flickering Buttons**  
   - Aside from the Home button, other header buttons (Quiz, Sign In, Dashboard) flicker or appear/disappear whenever the user navigates through the site.

3. **Removed or Simplified Features**  
   - The in-browser editing approach for lectures has been discarded in favor of coding lectures directly into the project directory.

4. **Need for a Systematic Way to Add Lectures**  
   - I need a method to add and manage hundreds of lectures (with potential interactive elements) without causing clutter or making future edits too difficult.

## Conclusion
- This website is intended to be an educational platform for Physics, Math, and Chemistry, with a focus on lectures, quizzes, and a user dashboard that tracks progress.  
- There is a main animated background that must remain consistent across all pages.  
- The layout includes a persistent Home button, plus sign-in, sign-up, log-out, and dashboard buttons, which should appear or disappear correctly based on user status—without flickering.  
- Lectures will be stored in the project directory rather than in the cloud, and math content will be rendered via KaTeX.  
- Ultimately, I want a clean, organized structure that makes it easy to expand the number of lectures and incorporate interactive learning elements.  
- Right now, the code is messy, and many parts (especially the flickering header buttons, directory structure, and lecture quiz features) need fixing or overhauling. My hope is that, with this explanation, we can figure out how to clean up the project so I can start properly adding and managing all the course lectures and their quizzes.
