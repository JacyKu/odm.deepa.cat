'use client';

import { useEffect, useRef } from 'react';

export default function Background() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width, height;
        let animId;

        const PALETTE = ['#2C2C2C', '#9C59D1', '#FFFFFF', '#FCF434'];
        const BG = '#09090b';
        const MAX_DIST = 140;
        const PARTICLE_COUNT = 100;
        let particles = [];

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        }

        function hexToRgba(hex, alpha) {
            hex = hex.replace('#', '');
            if (hex.length === 3) {
                hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            }
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
        }

        function lerpColor(c1, c2, t) {
            let h1 = c1.replace('#', '');
            let h2 = c2.replace('#', '');
            if (h1.length === 3) h1 = h1[0] + h1[0] + h1[1] + h1[1] + h1[2] + h1[2];
            if (h2.length === 3) h2 = h2[0] + h2[0] + h2[1] + h2[1] + h2[2] + h2[2];
            const r = Math.round(
                parseInt(h1.substring(0, 2), 16) +
                    (parseInt(h2.substring(0, 2), 16) - parseInt(h1.substring(0, 2), 16)) * t
            );
            const g = Math.round(
                parseInt(h1.substring(2, 4), 16) +
                    (parseInt(h2.substring(2, 4), 16) - parseInt(h1.substring(2, 4), 16)) * t
            );
            const b = Math.round(
                parseInt(h1.substring(4, 6), 16) +
                    (parseInt(h2.substring(4, 6), 16) - parseInt(h1.substring(4, 6), 16)) * t
            );
            return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }

        function initParticles() {
            particles = [];
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    size: Math.random() * 3 + 1,
                    vx: (Math.random() - 0.5) * 1.2,
                    vy: (Math.random() - 0.5) * 1.2,
                    colorA: PALETTE[Math.floor(Math.random() * PALETTE.length)],
                    colorB: PALETTE[Math.floor(Math.random() * PALETTE.length)],
                    blend: Math.random(),
                });
            }
        }

        function draw() {
            ctx.fillStyle = BG;
            ctx.fillRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                p.blend += 0.003;
                if (p.blend > 1) p.blend = 0;

                const particleColor = lerpColor(p.colorA, p.colorB, p.blend);

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = particleColor;
                ctx.fill();
            }

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < MAX_DIST) {
                        const alpha = (1 - dist / MAX_DIST) * 0.6;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = hexToRgba('#9C59D1', alpha);
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                }
            }

            animId = requestAnimationFrame(draw);
        }

        resize();
        initParticles();

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                resize();
                initParticles();
            }, 150);
        });

        draw();

        return () => {
            cancelAnimationFrame(animId);
        };
    }, []);

    return (
        <div className="fixed inset-0" style={{ zIndex: -1, transform: 'scale(1.05)' }}>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full blur-[6px]" />
        </div>
    );
}
