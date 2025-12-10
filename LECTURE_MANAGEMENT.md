# Lecture Management System

This document outlines the new approach for managing lectures in the educational website project. The system is designed to be scalable, allowing for hundreds of lectures to be added systematically while maintaining organization and ease of editing.

## Directory Structure

Lectures are organized in a hierarchical directory structure:

```
lectures/
├── physics/
│   ├── kinematics/
│   │   ├── lecture1.json
│   │   ├── lecture2.json
│   │   ├── lecture2.js (optional)
│   │   └── ...
│   ├── thermodynamics/
│   │   ├── lecture1.json
│   │   └── ...
│   └── ...
├── math/
│   ├── algebra/
│   │   ├── lecture1.json
│   │   └── ...
│   └── ...
└── chemistry/
    ├── organic/
    │   ├── lecture1.json
    │   └── ...
    └── ...
```

- The top level contains subject directories (`physics`, `math`, `chemistry`)
- Each subject directory contains topic directories (`kinematics`, `thermodynamics`, etc.)
- Each topic directory contains lecture files (`lecture1.json`, `lecture2.json`, etc.)
- Optional JavaScript files for interactive elements (`lecture2.js`, etc.)

## Lecture File Format

Each lecture is stored as a JSON file with the following structure:

```json
{
  "title": "Lecture Title",
  "content": "<div class='lecture-section'>...</div>",
  "hasCustomScript": false
}
```

- `title`: The title of the lecture
- `content`: HTML content of the lecture, structured with CSS classes
- `hasCustomScript`: Boolean indicating whether the lecture has an associated JavaScript file

## Adding Interactive Elements

For lectures that require interactive elements:

1. Set `hasCustomScript` to `true` in the lecture JSON file
2. Create a JavaScript file with the same name as the lecture JSON file (e.g., `lecture2.js` for `lecture2.json`)
3. The JavaScript file will be automatically loaded when the lecture is displayed

Example:
```json
{
  "title": "Motion in One Dimension",
  "content": "... <div id='simulation-container'>...</div> ...",
  "hasCustomScript": true
}
```

## Content Styling

Lecture content is styled using CSS classes defined in `css/lecture-content.css`:

- `.lecture-section`: Main content sections
- `.lecture-table`: Tables
- `.lecture-image`: Images
- `.simulation-container`: Interactive elements
- `.code-block`: Code snippets
- `.callout`, `.callout-warning`, `.callout-tip`: Callout boxes

## Math Formatting

Mathematical expressions are rendered using KaTeX:

- Inline math: `$expression$`
- Display math: `$$expression$$`

Example:
```html
<p>The formula for kinetic energy is $E_k = \frac{1}{2}mv^2$.</p>
```

## Adding New Lectures

To add a new lecture:

1. Determine the subject and topic
2. Create a JSON file in the appropriate directory (`lectures/[subject]/[topic]/lecture[number].json`)
3. Add the lecture content using HTML with the appropriate CSS classes
4. If the lecture requires interactive elements, set `hasCustomScript` to `true` and create a JavaScript file
5. Update the course page (e.g., `physics.html`) to include a link to the new lecture

## URL Structure

Lectures are accessed via URLs with the following format:

```
lecture.html?subject=[subject]&topic=[topic]&lecture=[number]
```

Example:
```
lecture.html?subject=physics&topic=kinematics&lecture=1
```

## Best Practices

1. Keep lecture content modular and well-structured using the provided CSS classes
2. Use consistent formatting for mathematical expressions
3. Optimize images for web display
4. Test interactive elements thoroughly
5. Maintain a consistent style across all lectures
6. Use meaningful file names and follow the established directory structure
7. Keep JavaScript files separate from content for better maintainability 