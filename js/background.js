// background.js

(function() {
    // Customizable Parameters
    var numStars = 220;           // Number of stars
    var speed = 0.0004;             // Speed of stars
    var starColors = ['#ffffff', '#dbe7ff', '#f7efd5']; // Soft white/blue/yellow tones
    var minStarSize = 0.6;          // Minimum star size
    var maxStarSize = 1.4;          // Maximum star size
    var glowIntensity = 0;       // Intensity of the glow effect

    // Create the canvas element
    var canvas = document.createElement('canvas');
    canvas.id = 'starfield';
    document.body.appendChild(canvas);

    var context = canvas.getContext('2d');
    var stars = [];

    // Set canvas size
    var width = canvas.width = window.innerWidth;
    var height = canvas.height = window.innerHeight;

    // Update canvas size on window resize
    window.addEventListener('resize', function() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    // Function to create a new star
    function createStar() {
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            z: Math.random() * width,
            o: Math.random() * 0.5 + 0.5, // Opacity between 0.5 and 1
            size: Math.random() * (maxStarSize - minStarSize) + minStarSize,
            color: starColors[Math.floor(Math.random() * starColors.length)]
        };
    }

    // Initialize star positions
    for (var i = 0; i < numStars; i++) {
        stars.push(createStar());
    }

    // Animation loop
    function animate() {
        // Clear the canvas
        context.fillStyle = 'black';
        context.fillRect(0, 0, width, height);

        // Draw stars
        for (var i = 0; i < numStars; i++) {
            var star = stars[i];

            // Move star towards the viewer
            star.z -= speed * width;
            if (star.z <= 0) {
                stars[i] = createStar();
                star.z = width;
            }

            // Calculate star position
            var k = (width / 2) / star.z;
            var x = (star.x - width / 2) * k + width / 2;
            var y = (star.y - height / 2) * k + height / 2;

            // Only draw the star if it's within the viewport
            if (x >= 0 && x <= width && y >= 0 && y <= height) {
                // Prevent negative or zero radii when the window is resized
                if (star.z > width) {
                    star.z = width;
                }
                var size = Math.max(0, star.size * (1 - star.z / width) * 2);
                if (size <= 0) {
                    continue;
                }

                // Set glow effect
                context.globalAlpha = star.o;
                context.fillStyle = star.color;

                // Draw the star
                context.beginPath();
                context.arc(x, y, size, 0, Math.PI * 2);
                context.fill();

                // Reset shadow settings
                context.globalAlpha = 1;
            } else {
                // Recycle star if it's outside the viewport
                stars[i] = createStar();
                stars[i].z = width;
            }
        }

        // Continue the animation
        requestAnimationFrame(animate);
    }

    // Start the animation
    animate();
})();
