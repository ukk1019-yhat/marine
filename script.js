/**
 * JAYANTH MARINE SERVICES - UNDER CONSTRUCTION PORTAL
 * Interactive Ocean Physics, Floating Vessel Dynamics & Audio Synthesizer
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. CANVAS WAVE ENGINE & BUOYANCY PHYSICS
  // ---------------------------------------------------------------------------
  const canvas = document.getElementById('oceanCanvas');
  const ctx = canvas.getContext('2d');
  const vesselContainer = document.getElementById('floatingVesselContainer');
  const vesselAssembly = document.getElementById('vesselAssembly');
  const steamPuff = document.getElementById('steamPuff');
  const shipPosElem = document.getElementById('shipPos');
  const shipKnotsElem = document.getElementById('shipKnots');
  const seaStateElem = document.getElementById('seaStateText');
  const waveSelect = document.getElementById('waveSelect');
  const hornBtn = document.getElementById('hornBtn');
  const speedBoostBtn = document.getElementById('speedBoostBtn');

  let width = 0;
  let height = 0;
  let animationFrameId = null;

  // Wave Configuration by Sea State
  const waveSettings = {
    calm: {
      amplitude: 10,
      frequency: 0.007,
      speed: 0.02,
      secondaryAmp: 6,
      foamRate: 0.2,
      boatPitchMult: 0.5,
      label: 'CALM HARBOR'
    },
    moderate: {
      amplitude: 18,
      frequency: 0.009,
      speed: 0.035,
      secondaryAmp: 11,
      foamRate: 0.6,
      boatPitchMult: 0.9,
      label: 'OCEAN SWELL'
    },
    rough: {
      amplitude: 28,
      frequency: 0.012,
      speed: 0.055,
      secondaryAmp: 18,
      foamRate: 1.2,
      boatPitchMult: 1.4,
      label: 'HIGH SEAS'
    }
  };

  let currentSeaState = 'moderate';
  let waveTime = 0;
  let mouseRipple = { x: -1000, y: -1000, strength: 0, decay: 0.95 };
  let isSpeedBoosted = false;
  let boostTimer = null;
  let boostSpeedFactor = 1;

  // Wake & Splash Particles
  const wakeParticles = [];
  const splashParticles = [];

  // Floating Navigation Buoy in the Mid-Distance
  const buoy = {
    relX: 0.82, // percentage of canvas width
    y: 0,
    angle: 0,
    blinkPhase: 0
  };

  // Resize canvas cleanly
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;

    // Handle high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Mouse interaction: stirs waves
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseRipple.x = e.clientX - rect.left;
    mouseRipple.y = e.clientY - rect.top;
    mouseRipple.strength = 14;
  });

  // Calculate Wave Elevation at coordinate X
  function getWaveHeight(x, layerOffset, time) {
    const settings = waveSettings[currentSeaState];
    const amp = settings.amplitude * boostSpeedFactor;
    const freq = settings.frequency;
    const speed = settings.speed * boostSpeedFactor;

    // Base trochoidal sine wave
    const baseWave = Math.sin(x * freq + time * speed + layerOffset) * amp;
    // Secondary harmonic for oceanic choppiness
    const harmonicWave = Math.sin(x * (freq * 2.1) - time * (speed * 1.3) + layerOffset) * (settings.secondaryAmp * 0.5);
    // Mouse interactive swell
    const distToMouse = Math.abs(x - mouseRipple.x);
    let rippleEffect = 0;
    if (distToMouse < 180 && mouseRipple.strength > 0.1) {
      rippleEffect = Math.sin(distToMouse * 0.06 - time * 0.2) * mouseRipple.strength * (1 - distToMouse / 180);
    }

    return baseWave + harmonicWave + rippleEffect;
  }

  // Get slope (derivative) for vessel pitching
  function getWaveSlope(x, layerOffset, time) {
    const delta = 4;
    const h1 = getWaveHeight(x - delta, layerOffset, time);
    const h2 = getWaveHeight(x + delta, layerOffset, time);
    return (h2 - h1) / (delta * 2);
  }

  // Particle Generators
  function emitWakeParticles(x, y) {
    if (Math.random() < 0.65 * boostSpeedFactor) {
      wakeParticles.push({
        x: x - 40 - Math.random() * 20,
        y: y + 25 + (Math.random() - 0.5) * 8,
        vx: -(1.5 + Math.random() * 2.5) * boostSpeedFactor,
        vy: (Math.random() - 0.5) * 1.2,
        radius: 3 + Math.random() * 4 * boostSpeedFactor,
        maxRadius: 16 + Math.random() * 12,
        alpha: 0.8,
        color: Math.random() > 0.4 ? 'rgba(255, 255, 255, ' : 'rgba(0, 229, 255, '
      });
    }

    // Splash at the bow
    if (Math.random() < 0.35 * boostSpeedFactor) {
      splashParticles.push({
        x: x + 70 + (Math.random() - 0.5) * 10,
        y: y + 10,
        vx: (1.5 + Math.random() * 2) * boostSpeedFactor,
        vy: -(2 + Math.random() * 3),
        radius: 2 + Math.random() * 3,
        alpha: 0.9,
        gravity: 0.18
      });
    }
  }

  // Draw Dynamic Waves and Buoyancy
  function renderOcean() {
    ctx.clearRect(0, 0, width, height);

    waveTime += 1;
    mouseRipple.strength *= mouseRipple.decay;

    const baselineY = height * 0.65;

    // Detect theme colors
    const isNight = document.body.classList.contains('theme-night');
    const isDay = document.body.classList.contains('theme-day');

    // Layer Colors
    let colorBack, colorMid, colorFront, colorFoam, colorRibbon;
    if (isNight) {
      colorBack = '#021024';
      colorMid = '#031c3b';
      colorFront = '#052952';
      colorFoam = 'rgba(0, 229, 255, 0.45)';
      colorRibbon = '#00c2ff';
    } else if (isDay) {
      colorBack = '#075985';
      colorMid = '#0284c7';
      colorFront = '#0ea5e9';
      colorFoam = 'rgba(255, 255, 255, 0.65)';
      colorRibbon = '#f59e0b';
    } else {
      // Sunset (Logo Palette)
      colorBack = '#071e3d';
      colorMid = '#0a305e';
      colorFront = '#0d4380';
      colorFoam = 'rgba(255, 240, 220, 0.55)';
      colorRibbon = '#ff7a00';
    }

    // -------------------------------------------------------------
    // 1. LAYER 1: Deep Ocean Background Swell
    // -------------------------------------------------------------
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 10) {
      const y = baselineY - 25 + getWaveHeight(x, 0.5, waveTime * 0.8);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = colorBack;
    ctx.fill();

    // -------------------------------------------------------------
    // 2. LAYER 2: Floating Navigation Buoy
    // -------------------------------------------------------------
    const buoyX = width * buoy.relX;
    const buoyWaveY = baselineY - 10 + getWaveHeight(buoyX, 1.8, waveTime);
    const buoySlope = getWaveSlope(buoyX, 1.8, waveTime);
    buoy.angle = Math.atan(buoySlope) * 0.8;
    buoy.blinkPhase += 0.05;

    ctx.save();
    ctx.translate(buoyX, buoyWaveY);
    ctx.rotate(buoy.angle);

    // Buoy Body
    ctx.fillStyle = '#ff7a00';
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.lineTo(6, -18);
    ctx.lineTo(-6, -18);
    ctx.closePath();
    ctx.fill();

    // Buoy Mast & Beacon
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(0, -28);
    ctx.stroke();

    // Flashing Beacon Light (Amber / Green)
    const isBlink = Math.sin(buoy.blinkPhase) > 0.4;
    ctx.fillStyle = isBlink ? '#ffaa00' : '#442200';
    ctx.beginPath();
    ctx.arc(0, -30, 3, 0, Math.PI * 2);
    ctx.fill();

    if (isBlink) {
      ctx.fillStyle = 'rgba(255, 170, 0, 0.35)';
      ctx.beginPath();
      ctx.arc(0, -30, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // -------------------------------------------------------------
    // 3. LAYER 3: Mid Ocean Swell
    // -------------------------------------------------------------
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 8) {
      const y = baselineY + getWaveHeight(x, 1.8, waveTime);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = colorMid;
    ctx.fill();

    // -------------------------------------------------------------
    // 4. FLOATING VESSEL BUOYANCY & PITCH POSITIONING
    // -------------------------------------------------------------
    // The ship is centered horizontally at canvas center (50%)
    const boatX = width * 0.5;
    const waveElevAtBoat = getWaveHeight(boatX, 2.2, waveTime);
    const waveSlopeAtBoat = getWaveSlope(boatX, 2.2, waveTime);

    // Heave (Y position) and Pitch (Tilt angle)
    const targetY = baselineY + waveElevAtBoat - 28;
    const pitchMultiplier = waveSettings[currentSeaState].boatPitchMult;
    const pitchAngleDeg = Math.atan(waveSlopeAtBoat) * (180 / Math.PI) * pitchMultiplier;

    // Apply smooth transforms to the ship container
    if (vesselContainer) {
      vesselContainer.style.top = `${targetY}px`;
      vesselContainer.style.transform = `translate(-50%, -50%) rotate(${pitchAngleDeg}deg)`;
    }

    // Emit Wake & Splash Particles from ship hull
    emitWakeParticles(boatX, targetY);

    // -------------------------------------------------------------
    // 5. DRAW PARTICLES (Wake & Bow Splashes)
    // -------------------------------------------------------------
    // Wake bubbles
    for (let i = wakeParticles.length - 1; i >= 0; i--) {
      const p = wakeParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.radius += 0.25 * boostSpeedFactor;
      p.alpha -= 0.015;

      if (p.alpha <= 0 || p.radius >= p.maxRadius) {
        wakeParticles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.alpha + ')';
      ctx.fill();
    }

    // Bow splashes
    for (let j = splashParticles.length - 1; j >= 0; j--) {
      const sp = splashParticles[j];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vy += sp.gravity;
      sp.alpha -= 0.03;

      if (sp.alpha <= 0) {
        splashParticles.splice(j, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${sp.alpha})`;
      ctx.fill();
    }

    // -------------------------------------------------------------
    // 6. LAYER 4: Foreground Crest Wave with Foam Spray
    // -------------------------------------------------------------
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 6) {
      const y = baselineY + 22 + getWaveHeight(x, 3.2, waveTime * 1.15);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();

    // Create wave gradient
    const waveGrad = ctx.createLinearGradient(0, baselineY, 0, height);
    waveGrad.addColorStop(0, colorFront);
    waveGrad.addColorStop(1, '#020914');
    ctx.fillStyle = waveGrad;
    ctx.fill();

    // -------------------------------------------------------------
    // 7. LAYER 5: Stylized Accent Wave Curls (Directly honoring Logo!)
    // -------------------------------------------------------------
    // Vibrant Cyan wave ribbon
    ctx.beginPath();
    for (let x = 0; x <= width; x += 10) {
      const y = baselineY + 28 + getWaveHeight(x, 3.2, waveTime * 1.15);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#00c2ff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Energetic Orange wave curl (as seen in the logo bottom)
    ctx.beginPath();
    for (let x = width * 0.35; x <= width * 0.85; x += 10) {
      const y = baselineY + 45 + getWaveHeight(x, 4.0, waveTime * 0.95);
      if (x === Math.floor(width * 0.35)) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = colorRibbon;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Request next animation frame
    animationFrameId = requestAnimationFrame(renderOcean);
  }

  // Start Animation Loop
  renderOcean();

  // ---------------------------------------------------------------------------
  // 2. INTERACTIVE CONTROLS (Horn, Throttle, Waves)
  // ---------------------------------------------------------------------------
  // Trigger Foghorn sound & visual puff
  function triggerHorn() {
    playShipHornSound();

    if (steamPuff) {
      steamPuff.classList.remove('active');
      void steamPuff.offsetWidth; // trigger reflow
      steamPuff.classList.add('active');
    }

    showToast('🎺 Maritime Foghorn Sounded!');
  }

  if (hornBtn) hornBtn.addEventListener('click', triggerHorn);
  if (vesselContainer) vesselContainer.addEventListener('click', triggerHorn);

  // Sea State Selector
  if (waveSelect) {
    waveSelect.addEventListener('change', (e) => {
      currentSeaState = e.target.value;
      if (seaStateElem) {
        seaStateElem.textContent = waveSettings[currentSeaState].label;
      }
      showToast(`🌊 Sea Condition: ${waveSettings[currentSeaState].label}`);
    });
  }

  // Speed Throttle Boost
  if (speedBoostBtn) {
    speedBoostBtn.addEventListener('click', () => {
      if (isSpeedBoosted) return;
      isSpeedBoosted = true;
      boostSpeedFactor = 2.2;

      speedBoostBtn.classList.add('active');
      speedBoostBtn.innerHTML = '<i class="fa-solid fa-gauge-max"></i> <span>28.5 KTS!</span>';
      if (shipKnotsElem) shipKnotsElem.textContent = '28.5 KTS (SPRINT)';

      showToast('⚡ Twin Turbines Engaged: Full Ahead 28.5 Knots!');

      clearTimeout(boostTimer);
      boostTimer = setTimeout(() => {
        boostSpeedFactor = 1;
        isSpeedBoosted = false;
        speedBoostBtn.classList.remove('active');
        speedBoostBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> <span>Full Ahead</span>';
        if (shipKnotsElem) shipKnotsElem.textContent = '14.8 KTS';
      }, 5000);
    });
  }

  // ---------------------------------------------------------------------------
  // 3. WEB AUDIO SYNTHESIZER (Ocean Surf & Maritime Foghorn)
  // ---------------------------------------------------------------------------
  let audioCtx = null;
  let isAudioPlaying = false;
  let oceanGainNode = null;
  let surfLfoGain = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Authentic Maritime Foghorn Synthesis
  function playShipHornSound() {
    try {
      initAudioContext();
      const now = audioCtx.currentTime;

      // Master horn gain
      const hornGain = audioCtx.createGain();
      hornGain.gain.setValueAtTime(0.001, now);
      hornGain.gain.exponentialRampToValueAtTime(0.35, now + 0.15); // soft attack
      hornGain.gain.setValueAtTime(0.35, now + 1.2);
      hornGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0); // natural echo decay
      hornGain.connect(audioCtx.destination);

      // Low fundamental oscillator (110 Hz - A2)
      const osc1 = audioCtx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(110, now);
      osc1.frequency.linearRampToValueAtTime(108, now + 2.0);

      // Overtone oscillator (165 Hz - E3, fifth harmony)
      const osc2 = audioCtx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(165, now);
      osc2.frequency.linearRampToValueAtTime(162, now + 2.0);

      // Low pass acoustic filter (simulates distance & marine atmosphere)
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.Q.value = 3.0;

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(hornGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.1);
      osc2.stop(now + 2.1);
    } catch (e) {
      console.warn('Audio not allowed yet:', e);
    }
  }

  // Soothing Ocean Waves Ambient Sound Synthesis
  function startOceanAmbience() {
    initAudioContext();

    // Generate Pink/White Noise Buffer
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.2;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Bandpass Filter shaped by LFO for wave surges
    const bandpass = audioCtx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 380;
    bandpass.Q.value = 1.2;

    // Wave swell LFO
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.12; // wave surge every ~8 seconds

    surfLfoGain = audioCtx.createGain();
    surfLfoGain.gain.value = 220; // sweeps frequency up and down

    lfo.connect(surfLfoGain);
    surfLfoGain.connect(bandpass.frequency);

    // Master volume for ocean
    oceanGainNode = audioCtx.createGain();
    oceanGainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
    oceanGainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 1.5);

    whiteNoise.connect(bandpass);
    bandpass.connect(oceanGainNode);
    oceanGainNode.connect(audioCtx.destination);

    whiteNoise.start();
    lfo.start();
  }

  function stopOceanAmbience() {
    if (oceanGainNode && audioCtx) {
      oceanGainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      setTimeout(() => {
        if (oceanGainNode) oceanGainNode.disconnect();
      }, 900);
    }
  }

  // Audio Toggle Button
  const audioToggle = document.getElementById('audioToggle');
  const audioIcon = document.getElementById('audioIcon');
  const audioLabel = document.getElementById('audioLabel');

  if (audioToggle) {
    audioToggle.addEventListener('click', () => {
      isAudioPlaying = !isAudioPlaying;

      if (isAudioPlaying) {
        startOceanAmbience();
        audioToggle.classList.add('playing');
        audioIcon.className = 'fa-solid fa-volume-high';
        audioLabel.textContent = 'Sea Ambience';
        showToast('🌊 Ocean Ambience: Active');
      } else {
        stopOceanAmbience();
        audioToggle.classList.remove('playing');
        audioIcon.className = 'fa-solid fa-volume-xmark';
        audioLabel.textContent = 'Sea Sounds';
        showToast('🔇 Ocean Ambience: Muted');
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 4. ATMOSPHERIC THEME SWITCHER
  // ---------------------------------------------------------------------------
  const themeBtns = document.querySelectorAll('.theme-btn');
  themeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      themeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const themeClass = btn.getAttribute('data-theme');
      document.body.className = themeClass;

      if (themeClass === 'theme-sunset') {
        showToast('🌅 Theme: Sunset Horizon (Jayanth Signature)');
      } else if (themeClass === 'theme-night') {
        showToast('🌙 Theme: Midnight Deep Sea Radar');
      } else {
        showToast('☀️ Theme: Harbor Daylight');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 5. COUNTDOWN TIMER TO OFFICIAL LAUNCH
  // ---------------------------------------------------------------------------
  const daysEl = document.getElementById('daysNum');
  const hoursEl = document.getElementById('hoursNum');
  const minsEl = document.getElementById('minsNum');
  const secsEl = document.getElementById('secsNum');

  // Target launch date: 18 days 6 hours ahead from current session
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 18);
  targetDate.setHours(targetDate.getHours() + 6);
  targetDate.setMinutes(targetDate.getMinutes() + 42);

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate.getTime() - now;

    if (distance <= 0) {
      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minsEl) minsEl.textContent = '00';
      if (secsEl) secsEl.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minsEl) minsEl.textContent = String(minutes).padStart(2, '0');
    if (secsEl) secsEl.textContent = String(seconds).padStart(2, '0');
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  // ---------------------------------------------------------------------------
  // 6. NOTIFICATION / SUBSCRIPTION FORM
  // ---------------------------------------------------------------------------
  const subscribeForm = document.getElementById('subscribeForm');
  const subscriberEmail = document.getElementById('subscriberEmail');
  const formFeedback = document.getElementById('formFeedback');

  if (subscribeForm) {
    subscribeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = subscriberEmail.value.trim();

      if (!email || !email.includes('@') || !email.includes('.')) {
        formFeedback.textContent = '⚠ Please enter a valid maritime enterprise or corporate email.';
        formFeedback.className = 'form-feedback error';
        subscriberEmail.focus();
        return;
      }

      // Save email to localStorage
      try {
        const list = JSON.parse(localStorage.getItem('jms_subscribers') || '[]');
        list.push({ email, timestamp: new Date().toISOString() });
        localStorage.setItem('jms_subscribers', JSON.stringify(list));
      } catch (err) {
        // Fallback
      }

      formFeedback.innerHTML = `✓ Anchor dropped! <strong>${email}</strong> registered for VIP launch dispatch.`;
      formFeedback.className = 'form-feedback success';
      subscriberEmail.value = '';

      showToast('⚓ Priority Notification Confirmed!');
    });
  }

  // ---------------------------------------------------------------------------
  // 7. DIRECT DISPATCH MODAL & CONTACT FORM
  // ---------------------------------------------------------------------------
  const inquiryModal = document.getElementById('inquiryModal');
  const openContactBtn = document.getElementById('openContactBtn');
  const openDirectModalBtn = document.getElementById('openDirectModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const inquiryForm = document.getElementById('inquiryForm');

  function openModal() {
    if (inquiryModal) {
      inquiryModal.classList.add('open');
      document.body.style.overflow = 'hidden';
      const firstInput = document.getElementById('clientName');
      if (firstInput) setTimeout(() => firstInput.focus(), 150);
    }
  }

  function closeModal() {
    if (inquiryModal) {
      inquiryModal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (openContactBtn) openContactBtn.addEventListener('click', openModal);
  if (openDirectModalBtn) openDirectModalBtn.addEventListener('click', openModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

  // Close when clicking modal backdrop
  if (inquiryModal) {
    inquiryModal.addEventListener('click', (e) => {
      if (e.target === inquiryModal) closeModal();
    });
  }

  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && inquiryModal && inquiryModal.classList.contains('open')) {
      closeModal();
    }
  });

  // Handle Inquiry Form Submission
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const clientName = document.getElementById('clientName').value;
      const serviceType = document.getElementById('serviceType').value;

      showToast(`⚓ Ticket dispatched for ${clientName}! Superintendent notified.`);
      closeModal();
      inquiryForm.reset();
    });
  }

  // ---------------------------------------------------------------------------
  // 8. SERVICE CARDS 3D PARALLAX TILT
  // ---------------------------------------------------------------------------
  const cards = document.querySelectorAll('.service-card');
  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // ---------------------------------------------------------------------------
  // 9. TOAST NOTIFICATION UTILITY
  // ---------------------------------------------------------------------------
  let toastTimer = null;
  const toastElem = document.getElementById('audioToast');

  function showToast(message) {
    if (!toastElem) return;
    toastElem.textContent = message;
    toastElem.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastElem.classList.remove('show');
    }, 3200);
  }

  // Update Footer Year
  const yearElem = document.getElementById('currentYear');
  if (yearElem) {
    yearElem.textContent = new Date().getFullYear();
  }

})();
