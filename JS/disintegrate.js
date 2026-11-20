/*
 * DISINTEGRATE — particle simulation
 *
 * This file owns the particle animation. The HTML supplies only:
 *   - #particles: a full-screen canvas to draw into
 *   - .gold-bar: the stationary gold source object
 *
 * Most visual tuning values are grouped in SETTINGS below.
 */

(() => {
    // Find the canvas, its 2D drawing context, and the gold bar that emits particles.
    const canvas = document.getElementById("particles");
    const ctx = canvas.getContext("2d");
    const bar = document.querySelector(".gold-bar");

    // Viewport dimensions in CSS pixels, plus the device-pixel ratio used for a sharp canvas.
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Every live particle is stored here until it expires or leaves the viewport.
    let particles = [];

    // Animation timing: lastTime lets us calculate elapsed seconds between frames.
    let lastTime = 0;

    // Fractional particle emissions are carried forward so the emission rate stays steady.
    let emissionCarry = 0;

    // -------------------------------------------------------------------------
    // TUNING SETTINGS
    // Change these values to experiment with the overall look and behavior.
    // -------------------------------------------------------------------------
    const SETTINGS = {
        emissionRate: 30,       // Average new particles created per second.
        lifetimeMin: 2.1,       // Shortest particle lifetime, in seconds.
        lifetimeMax: 6.5,       // Longest particle lifetime, in seconds.
        emissionZone: 0.32,     // Fraction of the bar's height that emits particles (top 22%).
        emissionBias: 2.8,      // Higher values concentrate more particles near the very top.
        launchAngleBase: -0.28, // Initial angle in radians. Negative angles travel upward.
        launchAngleTaper: -0.10, // Adds downward angle for particles emitted lower in the zone.
        launchAngleVariation: 0.16, // Random angle variation, in radians.
        speedMin: 18,           // Minimum initial particle speed, in CSS pixels per second.
        speedVariation: 17,     // Additional random speed above speedMin.
        particleSizeMin: 0.45,  // Minimum particle radius/size.
        particleSizeVariation: 1.9, // Additional size range; random weighting favors smaller grains.
        turbulence: 0.1,        // Strength of the gentle vertical eddies.
        horizontalWander: 0.35, // Tiny horizontal velocity variation over time.
        minimumHorizontalSpeed: 8, // Prevents particles from drifting backward.
        edgeSoftness: 1.8,      // Size multiplier for the faint outer edge of each particle.
        edgeOpacity: 0.24,      // Opacity multiplier for the soft outer edge.
        particleOpacityMin: 0.22, // Minimum particle opacity before lifetime fading.
        particleOpacityVariation: 0.3 // Random opacity range added to the minimum.
    };

    // Resize the canvas to match the viewport and account for high-density displays.
    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;

        // The backing bitmap uses device pixels; CSS dimensions remain viewport pixels.
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        // Scale drawing coordinates so the rest of the simulation can use CSS pixels.
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Pick a random origin along the upper emission zone of the gold bar.
    function emissionPoint() {
        const rect = bar.getBoundingClientRect();

        // Raising a random number to a power greater than 1 biases positions toward zero,
        // which means more particles originate close to the top edge of the bar.
        const verticalPosition = Math.pow(Math.random(), SETTINGS.emissionBias);

        return {
            x: rect.right + (Math.random() - 0.5) * 2, // Tiny horizontal jitter at the edge.
            y: rect.top + verticalPosition * rect.height * SETTINGS.emissionZone,
            verticalPosition // Keep the normalized position so it can control the launch angle.
        };
    }

    // Create one particle, assign its starting physics and add it to the simulation.
    function createParticle() {
        const origin = emissionPoint();

        // Each particle gets a random lifetime within the configured range.
        const life = SETTINGS.lifetimeMin +
            Math.random() * (SETTINGS.lifetimeMax - SETTINGS.lifetimeMin);

        // Particles lower in the emission zone receive a larger downward angle.
        // The small random term keeps neighboring trajectories from looking identical.
        const launchAngle = SETTINGS.launchAngleBase +
            origin.verticalPosition * SETTINGS.launchAngleTaper +
            (Math.random() - 0.5) * SETTINGS.launchAngleVariation;

        const speed = SETTINGS.speedMin + Math.random() * SETTINGS.speedVariation;

        particles.push({
            x: origin.x,
            y: origin.y,
            vx: Math.cos(launchAngle) * speed, // Horizontal component of launch velocity.
            vy: Math.sin(launchAngle) * speed, // Vertical component; negative is upward.
            size: SETTINGS.particleSizeMin +
                Math.pow(Math.random(), 1.7) * SETTINGS.particleSizeVariation,
            life,
            age: 0,
            phase: Math.random() * Math.PI * 2, // Unique phase prevents synchronized movement.
            drift: 2 + Math.random() * 7,       // Per-particle turbulence strength.
            shade: Math.random()                // Used to vary particle opacity slightly.
        });
    }

    // Advance a particle's physics and draw it for the current animation frame.
    function drawParticle(p, dt, now) {
        // Progress through the particle's lifetime, from 0 (new) to 1 (expired).
        const progress = p.age / p.life;

        // Fade particles in quickly and fade them out as they approach the end of life.
        const fadeIn = Math.min(progress * 6, 1);
        const fadeOut = Math.min((1 - progress) * 2.1, 1);
        const alpha = fadeIn * fadeOut *
            (SETTINGS.particleOpacityMin + p.shade * SETTINGS.particleOpacityVariation);

        // A slow sine wave adds subtle vertical eddies to the initial launch direction.
        const turbulence = Math.sin(now * 0.0005 + p.phase + p.x * 0.004);
        p.vy += turbulence * p.drift * dt * SETTINGS.turbulence;

        // Add a very small horizontal wander while keeping the overall breeze moving right.
        p.vx += Math.cos(now * 0.00035 + p.phase) * SETTINGS.horizontalWander * dt;
        p.vx = Math.max(SETTINGS.minimumHorizontalSpeed, p.vx);

        // Integrate velocity over elapsed time to update the particle's position.
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.age += dt;

        // No need to draw particles that are fully transparent.
        if (alpha <= 0) return;

        // Particles grow slightly as they disperse, making the cloud feel less uniform.
        const radius = p.size * (0.85 + progress * 0.45);

        // Rotate each particle to follow its current direction of travel.
        const angle = Math.atan2(p.vy, p.vx);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);

        // Draw a faint, slightly larger ellipse to soften the particle's edge.
        ctx.fillStyle = `rgba(190, 151, 65, ${alpha * SETTINGS.edgeOpacity})`;
        ctx.beginPath();
        ctx.ellipse(
            0, 0,
            radius * SETTINGS.edgeSoftness,
            radius * 1.25,
            0, 0, Math.PI * 2
        );
        ctx.fill();

        // Draw the smaller, more defined core. This keeps the effect closer to ash/soot
        // than the broad glowing particles used in the earlier version.
        ctx.fillStyle = `rgba(211, 177, 105, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, radius, Math.max(0.35, radius * 0.62), 0, 0, Math.PI * 2);
        ctx.fill();

        // Restore the canvas transform so the next particle starts from a clean state.
        ctx.restore();
    }

    // Main animation loop. It runs once per browser animation frame.
    function animate(timestamp) {
        if (!lastTime) lastTime = timestamp;

        // Convert milliseconds to seconds and cap large jumps (e.g. after a paused tab).
        const dt = Math.min((timestamp - lastTime) / 1000, 0.04);
        lastTime = timestamp;

        // Clear the previous frame; particles are redrawn at their updated positions.
        ctx.clearRect(0, 0, width, height);

        // Emit particles at a stable average rate, retaining any fractional remainder.
        emissionCarry += SETTINGS.emissionRate * dt;
        while (emissionCarry >= 1) {
            createParticle();
            emissionCarry -= 1;
        }

        // Update and draw each particle. Iterate backward so expired particles can be removed.
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            drawParticle(p, dt, timestamp);

            // Remove particles when their lifetime ends or they move well outside the screen.
            if (p.age >= p.life || p.x > width + 30 ||
                p.y < -30 || p.y > height + 30) {
                particles.splice(i, 1);
            }
        }

        // Ask the browser to run this function again at the next animation frame.
        requestAnimationFrame(animate);
    }

    // Keep the canvas fitted to the browser if the window or display size changes.
    window.addEventListener("resize", resize);

    // Set the initial canvas dimensions, then start the animation.
    resize();
    requestAnimationFrame(animate);
})();
