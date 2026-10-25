/**
 * JAYANTH MARINE SERVICES - FULL SCREEN LIGHT UNDER CONSTRUCTION
 * Full-Width Procedural Waves & Boat Buoyancy Dynamics
 */

(function () {
  'use strict';

  const canvas = document.getElementById('waterCanvas');
  const ctx = canvas.getContext('2d');
  const boatWrapper = document.getElementById('boatWrapper');
  const yearElem = document.getElementById('year');

  let width = 0;
  let height = 0;
  let waveTime = 0;

  // Set current year
  if (yearElem) {
    yearElem.textContent = new Date().getFullYear();
  }

  // Handle canvas sizing across full viewport width
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

  // Procedural Trochoidal Wave Elevation Calculation
  function getWaveHeight(x, layerOffset, time) {
    const amp = Math.min(height * 0.08, 14);
    const freq = 0.0065;
    const speed = 0.03;

    const wave1 = Math.sin(x * freq + time * speed + layerOffset) * amp;
    const wave2 = Math.sin(x * (freq * 1.9) - time * (speed * 0.8) + layerOffset) * (amp * 0.4);
    return wave1 + wave2;
  }

  // Derivative calculation for realistic hull tilting / pitch
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

    const baselineY = height * 0.58;

    // 1. Back Swell (Light Soft Sky Blue)
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 12) {
      const y = baselineY - 18 + getWaveHeight(x, 0.6, waveTime * 0.8);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = '#bae6fd';
    ctx.fill();

    // 2. Mid Ocean Layer (Calm Light Marine Cyan)
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 10) {
      const y = baselineY - 6 + getWaveHeight(x, 1.6, waveTime * 1.0);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = '#7dd3fc';
    ctx.fill();

    // 3. Floating Boat Buoyancy & Tilt Calculation
    const boatX = width * 0.5;
    const waveY = getWaveHeight(boatX, 2.0, waveTime * 1.0);
    const slope = getWaveSlope(boatX, 2.0, waveTime * 1.0);

    const targetY = baselineY + waveY - 26;
    const pitchAngleDeg = Math.atan(slope) * (180 / Math.PI) * 0.75;

    if (boatWrapper) {
      boatWrapper.style.top = `${targetY}px`;
      boatWrapper.style.transform = `translate(-50%, -50%) rotate(${pitchAngleDeg}deg)`;
    }

    // 4. Foreground Main Wave (Clean Maritime Azure)
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 8) {
      const y = baselineY + 12 + getWaveHeight(x, 2.8, waveTime * 1.15);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = '#0284c7';
    ctx.fill();

    // 5. Stylized Accent Waves (Directly from Company Logo)
    // Cyan speed line
    ctx.beginPath();
    for (let x = 0; x <= width; x += 14) {
      const y = baselineY + 18 + getWaveHeight(x, 2.8, waveTime * 1.15);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#00a3e0';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Solar Orange wave curl
    ctx.beginPath();
    for (let x = width * 0.28; x <= width * 0.88; x += 10) {
      const y = baselineY + 32 + getWaveHeight(x, 3.6, waveTime * 0.95);
      if (x === Math.floor(width * 0.28)) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#f37920';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Deep Navy keel wave
    ctx.beginPath();
    for (let x = width * 0.42; x <= width * 0.95; x += 10) {
      const y = baselineY + 46 + getWaveHeight(x, 4.4, waveTime * 0.85);
      if (x === Math.floor(width * 0.42)) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#0a2d52';
    ctx.lineWidth = 3.2;
    ctx.stroke();

    requestAnimationFrame(animateWaves);
  }

  animateWaves();

})();
