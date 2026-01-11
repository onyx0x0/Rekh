// background.js

(function() {
    // Customizable Parameters
    var numStars = 800;           // Number of stars
    var speed = 0.0004;             // Speed of stars
    var starColors = ['#ff6a3d', '#59b4ff']; // Bright orange-red or bright blue
    var glowColors = starColors;
    var minStarSize = 0.2;          // Minimum star size
    var maxStarSize = 1.2;          // Maximum star size
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
            size: minStarSize + (maxStarSize - minStarSize) * Math.pow(Math.random(), 2.2),
            color: starColors[Math.floor(Math.random() * starColors.length)],
            glowColor: glowColors[Math.floor(Math.random() * glowColors.length)]
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
                var size = star.size;
                if (size <= 0) {
                    continue;
                }

                // Fade brightness by distance (nearer = brighter, farther = dimmer)
                var depthRatio = Math.max(0, 1 - star.z / width);
                var depthBrightness = 0.08 + Math.pow(depthRatio, 1.6) * 0.92;
                context.globalAlpha = star.o * depthBrightness;
                var nearWhite = '#ffffff';
                var mix = Math.min(1, Math.pow(depthRatio, 1.3));
                context.fillStyle = mixColors(star.color, nearWhite, mix);
                context.shadowBlur = 0;
                context.shadowColor = 'transparent';

                // Draw the star (fixed dot size)
                context.beginPath();
                context.arc(x, y, size, 0, Math.PI * 2);
                context.fill();

                // Reset shadow settings
                context.shadowBlur = 0;
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

function mixColors(baseColor, targetColor, weight) {
    weight = Math.max(0, Math.min(1, weight));
    var base = parseHexColor(baseColor);
    var target = parseHexColor(targetColor);
    var r = Math.round(base.r * (1 - weight) + target.r * weight);
    var g = Math.round(base.g * (1 - weight) + target.g * weight);
    var b = Math.round(base.b * (1 - weight) + target.b * weight);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function parseHexColor(hex) {
    if (!hex || hex[0] !== '#') return { r: 255, g: 255, b: 255 };
    var raw = hex.slice(1);
    if (raw.length === 3) {
        raw = raw[0] + raw[0] + raw[1] + raw[1] + raw[2] + raw[2];
    }
    var num = parseInt(raw, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}
