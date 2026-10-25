/**
 * JAYANTH MARINE SERVICES - LIGHT UNDER CONSTRUCTION EXPERIENCE
 * Procedural Wave Simulation & Smooth Buoyancy Dynamics
 */

(function () {
  'use strict';

  const canvas = document.getElementById('waterCanvas');
  const ctx = canvas.getContext('2d');
  const boatWrapper = document.getElementById('boatWrapper');
  const notifyForm = document.getElementById('notifyForm');
  const emailInput = document.getElementById('emailInput');
  const feedbackMsg = document.getElementById('feedbackMsg');
  const yearElem = document.getElementById('year');

  let width = 0;
  let height = 0;
  let waveTime = 0;
  let animationId = null;

  // Set current year
  if (yearElem) {
    yearElem.textContent = new Date().getFullYear();
  }

  // Handle high-DPI canvas resizing
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Wave mathematical function
  function getWaveHeight(x, layerOffset, time) {
    const amp = 10;
    const freq = 0.012;
    const speed = 0.035;

    const wave1 = Math.sin(x * freq + time * speed + layerOffset) * amp;
    const wave2 = Math.sin(x * (freq * 1.8) - time * (speed * 0.9) + layerOffset) * 4;
    return wave1 + wave2;
  }

  function getWaveSlope(x, layerOffset, time) {
    const delta = 4;
    const h1 = getWaveHeight(x - delta, layerOffset, time);
    const h2 = getWaveHeight(x + delta, layerOffset, time);
    return (h2 - h1) / (delta * 2);
  }

  // Animation Loop
  function animateWaves() {
    ctx.clearRect(0, 0, width, height);
    waveTime += 1;

    const baselineY = height * 0.72;

    // 1. Back Layer: Soft sky-blue wave
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 8) {
      const y = baselineY - 14 + getWaveHeight(x, 0.8, waveTime * 0.8);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = '#bae6fd';
    ctx.fill();

    // 2. Mid Layer: Calm light cyan wave
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 8) {
      const y = baselineY - 4 + getWaveHeight(x, 1.8, waveTime * 1.0);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = '#7dd3fc';
    ctx.fill();

    // 3. Floating Boat Buoyancy & Tilt Calculation
    const boatX = width * 0.5;
    const waveY = getWaveHeight(boatX, 2.2, waveTime * 1.0);
    const slope = getWaveSlope(boatX, 2.2, waveTime * 1.0);

    const targetY = baselineY + waveY - 26;
    const pitchAngleDeg = Math.atan(slope) * (180 / Math.PI) * 0.7;

    if (boatWrapper) {
      boatWrapper.style.top = `${targetY}px`;
      boatWrapper.style.transform = `translate(-50%, -50%) rotate(${pitchAngleDeg}deg)`;
    }

    // 4. Foreground Wave: Clean ocean blue
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 6) {
      const y = baselineY + 10 + getWaveHeight(x, 2.8, waveTime * 1.15);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = '#0284c7';
    ctx.fill();

    // 5. Stylized Accent Curves (Directly from the Logo)
    // Cyan speed ribbon
    ctx.beginPath();
    for (let x = 0; x <= width; x += 10) {
      const y = baselineY + 16 + getWaveHeight(x, 2.8, waveTime * 1.15);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#00a3e0';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Warm Orange accent ribbon (Logo Wave)
    ctx.beginPath();
    for (let x = width * 0.35; x <= width * 0.9; x += 8) {
      const y = baselineY + 30 + getWaveHeight(x, 3.6, waveTime * 0.95);
      if (x === Math.floor(width * 0.35)) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#f37920';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Deep Navy accent ribbon (Logo Keel Wave)
    ctx.beginPath();
    for (let x = width * 0.45; x <= width * 0.98; x += 8) {
      const y = baselineY + 42 + getWaveHeight(x, 4.4, waveTime * 0.85);
      if (x === Math.floor(width * 0.45)) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#0a2d52';
    ctx.lineWidth = 2.8;
    ctx.stroke();

    animationId = requestAnimationFrame(animateWaves);
  }

  animateWaves();

  // Simple Notification Form
  if (notifyForm) {
    notifyForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = emailInput.value.trim();

      if (!email || !email.includes('@') || !email.includes('.')) {
        feedbackMsg.textContent = 'Please enter a valid email address.';
        feedbackMsg.className = 'feedback-msg error';
        emailInput.focus();
        return;
      }

      try {
        const list = JSON.parse(localStorage.getItem('jms_notified_emails') || '[]');
        list.push({ email, date: new Date().toISOString() });
        localStorage.setItem('jms_notified_emails', JSON.stringify(list));
      } catch (err) {
        // Fallback
      }

      feedbackMsg.textContent = '✓ Thank you! We will notify you as soon as we set sail.';
      feedbackMsg.className = 'feedback-msg success';
      emailInput.value = '';
    });
  }
})();
