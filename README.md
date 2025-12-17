Project structure (tools/data modals omitted per request)

- Root pages
  - `index.html` – landing shell; loads shared styling and nav.
  - `physics.html` – physics home with mission cards and module grid; pulls `js/physics-structure.js` + `css/physics-structure.css`.
  - `chemistry.html`, `mathematics.html` – subject landing pages styled via `css/styles.css`.
  - `dashboard.html` – user dashboard shell; driven by `js/dashboard.js`.
  - `lecture.html` – lecture viewer that consumes JSON lectures based on URL params (`subject`, `topic`, `lecture`).
  - `quiz.html` – quiz runner that consumes JSON quizzes based on URL params.
  - `auth-modal.html` – standalone auth modal markup (also reused in pages via `css/signup-popup.css` + `js/auth-popup.js`).

- Core scripts (js/)
  - `main.js` – global nav hooks, auth button injection, and shared page wiring.
  - `background.js` – shared animated background grid/noise setup.
  - `auth-popup.js` – sign-up / login modal logic and validation.
  - `physics-structure.js` – builds physics mission carousel + module list and module detail modal (Initiate routes Kinematics to lecture 1).
  - `physics.js` – subject-specific helpers for physics landing.
  - `lecture.js` – fetches lecture JSON, renders content, wires quiz link.
  - `lecture-navigation.js` – in-lecture navigation/section handling for rendered lecture content.
  - `quiz.js` – quiz engine for `quiz.html` (renders, scores, feedback).
  - `quizLoader.js` – helper to load/select quizzes (used by quiz shell).
  - `home-viewer.js` – inline course viewer logic for embedding course blocks on the home page.
  - `dashboard.js` – dashboard UI behaviors and data wiring.
  - `firebase.js` – Firebase config bootstrap.
  - `create_lecture_template.js` – utility to scaffold lecture JSON files.

- Styles (css/)
  - `styles.css` – base typography, layout, buttons, and shared components.
  - `background.css` – shared background overlays/effects.
  - `signup-popup.css` – auth modal styles.
  - `lecture.css` + `lecture-content.css` – lecture page layout and content styling.
  - `course.css` – general course card/layout styles used across subjects.
  - `physics-structure.css` – physics mission deck, module grid, and module modal styling.
  - `dashboard.css` – dashboard layout and widgets.
  - `quiz.css` – quiz page layout and controls.
  - `speed-of-light.css`, `atomic-orbitals.css`, `standard-model.css` – subject-specific visualizations/pages (non-tool data modals).

- Data content
  - `lectures/physics/kinematics/lecture1.json` – “Introduction to Kinematics” lecture (only live lecture kept).
  - `quizzes/physics/kinematics/quiz1.json` – quiz paired to the kinematics lecture.

- Other
  - `CNAME` – domain mapping for deployment.
