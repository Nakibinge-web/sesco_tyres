/**
 * Sesco Tyres - About Us Interactive 3D & Scroll Animation Suite
 * Powered by Three.js & Modern Web 3D Technologies
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. THREE.JS 3D TYRE & ALLOY WHEEL STAGE
  // --------------------------------------------------------------------------
  const stage = document.getElementById('hero-3d-stage');
  const canvas = document.getElementById('hero-3d-canvas');

  if (stage && canvas && typeof THREE !== 'undefined') {
    initThreeStage(stage, canvas);
  }

  function initThreeStage(stageEl, canvasEl) {
    let renderer, scene, camera;
    let wheelGroup, rimGroup, tyreMesh, rotorMesh, caliperMesh;
    let particles;
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let dragVelocity = { x: 0, y: 0 };
    let targetRotation = { x: 0.15, y: -0.45 };
    let currentRotation = { x: 0.15, y: -0.45 };
    let autoRotate = true;
    let autoRotateSpeed = 0.004;
    let isVisible = true;
    let scrollRotationOffset = 0;

    // View presets
    const views = {
      default: { camPos: [0, 0, 7.2], camTarget: [0, 0, 0], rot: [0.15, -0.45] },
      rim:     { camPos: [0.2, 0, 5.0], camTarget: [0, 0, 0], rot: [0.0, 0.0] },
      tread:   { camPos: [0, 0, 6.8], camTarget: [0, 0, 0], rot: [0.0, Math.PI * 0.48] },
      caliper: { camPos: [-0.6, 0.4, 5.2], camTarget: [-0.5, 0.3, 0], rot: [-0.1, -0.2] }
    };

    let activeCamTarget = new THREE.Vector3(0, 0, 0);
    let targetCamPos = new THREE.Vector3(0, 0, 7.2);

    // Renderer setup
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasEl,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(stageEl.clientWidth, stageEl.clientHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
    } catch (e) {
      console.warn('WebGL init failed:', e);
      return;
    }

    // Scene & Camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      42,
      stageEl.clientWidth / stageEl.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 7.2);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    // Main cool white key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(5, 7, 6);
    scene.add(keyLight);

    // Electric cyan rim/fill light (Sesco signature)
    const cyanLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
    cyanLight.position.set(-6, -2, 4);
    scene.add(cyanLight);

    // Warm amber bounce light (automotive performance glow)
    const amberLight = new THREE.PointLight(0xff7300, 2.0, 15);
    amberLight.position.set(2, -4, -3);
    scene.add(amberLight);

    // Subtle top accent light
    const topLight = new THREE.DirectionalLight(0x93c5fd, 1.2);
    topLight.position.set(0, 8, 2);
    scene.add(topLight);

    // ------------------------------------------------------------------------
    // Construct Procedural 3D Performance Wheel
    // ------------------------------------------------------------------------
    wheelGroup = new THREE.Group();
    scene.add(wheelGroup);

    // 1. Tyre Outer Rubber (Deep Torus with grooved procedural shader texture)
    const tyreRadius = 2.45;
    const tyreTube = 0.82;
    const tyreGeom = new THREE.TorusGeometry(tyreRadius, tyreTube, 48, 96);

    // Procedural tyre bump/groove texture
    const treadCanvas = document.createElement('canvas');
    treadCanvas.width = 1024;
    treadCanvas.height = 512;
    const ctx = treadCanvas.getContext('2d');
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, 1024, 512);

    // Longitudinal tread grooves
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 180, 1024, 28);
    ctx.fillRect(0, 240, 1024, 32);
    ctx.fillRect(0, 304, 1024, 28);

    // Lateral sipes / tread blocks
    ctx.strokeStyle = '#0a0a0a';
    ctx.lineWidth = 6;
    for (let x = 0; x < 1024; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x + 18, 160);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + 12, 350);
      ctx.lineTo(x + 30, 470);
      ctx.stroke();
    }

    // Sidewall brand typography debossing
    ctx.fillStyle = '#3a3a3a';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('SESCO PILOT SPORT 225/45 R18', 120, 110);
    ctx.fillText('RADIAL TUBELESS • EXTRA LOAD', 160, 420);

    const bumpMap = new THREE.CanvasTexture(treadCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.repeat.set(2, 1);

    const tyreMat = new THREE.MeshStandardMaterial({
      color: 0x181a1d,
      roughness: 0.82,
      metalness: 0.12,
      bumpMap: bumpMap,
      bumpScale: 0.05
    });
    tyreMesh = new THREE.Mesh(tyreGeom, tyreMat);
    wheelGroup.add(tyreMesh);

    // 2. Alloy Rim Assembly
    rimGroup = new THREE.Group();
    wheelGroup.add(rimGroup);

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xdde4ec,
      metalness: 0.88,
      roughness: 0.22
    });

    const darkAlloyMat = new THREE.MeshStandardMaterial({
      color: 0x242a35,
      metalness: 0.92,
      roughness: 0.32
    });

    // Outer rim barrel/lip
    const rimLipGeom = new THREE.CylinderGeometry(1.88, 1.88, 1.45, 64, 1, true);
    const rimLip = new THREE.Mesh(rimLipGeom, rimMat);
    rimLip.rotation.x = Math.PI / 2;
    rimGroup.add(rimLip);

    // Rim outer bevel ring
    const rimBevelGeom = new THREE.TorusGeometry(1.88, 0.08, 16, 64);
    const rimBevel = new THREE.Mesh(rimBevelGeom, rimMat);
    rimBevel.position.z = 0.72;
    rimGroup.add(rimBevel);

    const rimBevelBack = rimBevel.clone();
    rimBevelBack.position.z = -0.72;
    rimGroup.add(rimBevelBack);

    // Deep step-lip inner ring
    const stepLipGeom = new THREE.TorusGeometry(1.68, 0.06, 16, 64);
    const stepLip = new THREE.Mesh(stepLipGeom, darkAlloyMat);
    stepLip.position.z = 0.52;
    rimGroup.add(stepLip);

    // Central hub cone & cap
    const hubGeom = new THREE.CylinderGeometry(0.55, 0.65, 0.5, 32);
    const hubMesh = new THREE.Mesh(hubGeom, rimMat);
    hubMesh.rotation.x = Math.PI / 2;
    hubMesh.position.z = 0.45;
    rimGroup.add(hubMesh);

    // Center cap emblem (Sesco Brand Accent)
    const capGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.1, 32);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x163687,
      metalness: 0.5,
      roughness: 0.2
    });
    const capMesh = new THREE.Mesh(capGeom, capMat);
    capMesh.rotation.x = Math.PI / 2;
    capMesh.position.z = 0.72;
    rimGroup.add(capMesh);

    // Center cap gold logo ring
    const capRingGeom = new THREE.TorusGeometry(0.24, 0.025, 12, 32);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffa012,
      metalness: 0.95,
      roughness: 0.2
    });
    const capRing = new THREE.Mesh(capRingGeom, goldMat);
    capRing.position.z = 0.78;
    rimGroup.add(capRing);

    // 5-Spoke Dual-Branch Performance Alloy Spokes
    const spokeCount = 5;
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i * Math.PI * 2) / spokeCount;

      // Branch 1
      const spokeGeom = new THREE.BoxGeometry(0.2, 1.25, 0.12);
      const spokeMesh1 = new THREE.Mesh(spokeGeom, rimMat);
      spokeMesh1.position.set(Math.cos(angle - 0.08) * 1.05, Math.sin(angle - 0.08) * 1.05, 0.52);
      spokeMesh1.rotation.z = angle - 0.08 - Math.PI / 2;
      rimGroup.add(spokeMesh1);

      // Branch 2 (Sport split-spoke)
      const spokeMesh2 = new THREE.Mesh(spokeGeom, rimMat);
      spokeMesh2.position.set(Math.cos(angle + 0.08) * 1.05, Math.sin(angle + 0.08) * 1.05, 0.52);
      spokeMesh2.rotation.z = angle + 0.08 - Math.PI / 2;
      rimGroup.add(spokeMesh2);

      // Lug nut socket
      const lugGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.18, 6);
      const lugMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.1 });
      const lugMesh = new THREE.Mesh(lugGeom, lugMat);
      lugMesh.rotation.x = Math.PI / 2;
      lugMesh.position.set(Math.cos(angle) * 0.42, Math.sin(angle) * 0.42, 0.68);
      rimGroup.add(lugMesh);
    }

    // 3. Drilled Ventilated Brake Rotor Disc
    const rotorGroup = new THREE.Group();
    wheelGroup.add(rotorGroup);

    const rotorGeom = new THREE.CylinderGeometry(1.48, 1.48, 0.1, 48, 1, false);
    const rotorMat = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      metalness: 0.95,
      roughness: 0.35
    });
    rotorMesh = new THREE.Mesh(rotorGeom, rotorMat);
    rotorMesh.rotation.x = Math.PI / 2;
    rotorMesh.position.z = 0.15;
    rotorGroup.add(rotorMesh);

    // Rotor central steel hat
    const hatGeom = new THREE.CylinderGeometry(0.72, 0.8, 0.14, 32);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.8, roughness: 0.4 });
    const hatMesh = new THREE.Mesh(hatGeom, hatMat);
    hatMesh.rotation.x = Math.PI / 2;
    hatMesh.position.z = 0.22;
    rotorGroup.add(hatMesh);

    // 4. Sport Golden Performance Brake Caliper (Stationary / Fixed assembly)
    const caliperGroup = new THREE.Group();
    // Caliper is outside the rotating wheelGroup so it stays clamped at top-left like a real car!
    scene.add(caliperGroup);

    const caliperGeom = new THREE.BoxGeometry(0.65, 1.25, 0.52);
    const caliperMat = new THREE.MeshStandardMaterial({
      color: 0xff7300, // Sesco Gold/Amber Performance Caliper
      metalness: 0.75,
      roughness: 0.25
    });
    caliperMesh = new THREE.Mesh(caliperGeom, caliperMat);
    caliperMesh.position.set(-1.08, 0.95, 0.18);
    caliperMesh.rotation.z = 0.72;
    caliperGroup.add(caliperMesh);

    // Caliper branding emblem
    const badgeGeom = new THREE.BoxGeometry(0.42, 0.18, 0.05);
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const badgeMesh = new THREE.Mesh(badgeGeom, badgeMat);
    badgeMesh.position.set(-1.08, 0.95, 0.46);
    badgeMesh.rotation.z = 0.72;
    caliperGroup.add(badgeMesh);

    // 5. Floating Dust / Atmospheric Micro-Particles
    const particleCount = 120;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let p = 0; p < particleCount; p++) {
      positions[p * 3]     = (Math.random() - 0.5) * 12;
      positions[p * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[p * 3 + 2] = (Math.random() - 0.5) * 8;

      const isCyan = Math.random() > 0.4;
      colors[p * 3]     = isCyan ? 0.22 : 1.0;
      colors[p * 3 + 1] = isCyan ? 0.74 : 0.45;
      colors[p * 3 + 2] = isCyan ? 0.97 : 0.0;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // ------------------------------------------------------------------------
    // User Interactions: Drag, Tilt & Orbit Controls
    // ------------------------------------------------------------------------
    function onPointerDown(e) {
      isDragging = true;
      autoRotate = false;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      prevMousePos.x = clientX;
      prevMousePos.y = clientY;
      dragVelocity.x = 0;
      dragVelocity.y = 0;
      stageEl.style.cursor = 'grabbing';
    }

    function onPointerMove(e) {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      if (isDragging) {
        const deltaX = clientX - prevMousePos.x;
        const deltaY = clientY - prevMousePos.y;

        dragVelocity.x = deltaX * 0.007;
        dragVelocity.y = deltaY * 0.007;

        targetRotation.y += dragVelocity.x;
        targetRotation.x += dragVelocity.y;

        prevMousePos.x = clientX;
        prevMousePos.y = clientY;
      } else {
        // Subtle Parallax Tilt on hover
        const rect = stageEl.getBoundingClientRect();
        const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const normY = -(((clientY - rect.top) / rect.height) * 2 - 1);

        targetRotation.x = 0.15 + normY * 0.25;
        targetRotation.y = -0.45 + normX * 0.35;
      }
    }

    function onPointerUp() {
      isDragging = false;
      stageEl.style.cursor = 'grab';
    }

    stageEl.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('mouseup', onPointerUp);

    stageEl.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // ------------------------------------------------------------------------
    // Preset View Buttons
    // ------------------------------------------------------------------------
    const viewButtons = document.querySelectorAll('[data-3d-view]');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const viewKey = btn.getAttribute('data-3d-view');
        const v = views[viewKey] || views.default;

        targetCamPos.set(v.camPos[0], v.camPos[1], v.camPos[2]);
        activeCamTarget.set(v.camTarget[0], v.camTarget[1], v.camTarget[2]);
        targetRotation.x = v.rot[0];
        targetRotation.y = v.rot[1];
        autoRotate = (viewKey === 'default');
      });
    });

    // ------------------------------------------------------------------------
    // Scroll-Linked 3D Rotation Effect
    // ------------------------------------------------------------------------
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      // Wheel rolls forward/backward along with user scroll velocity
      scrollRotationOffset += scrollDelta * 0.005;
    }, { passive: true });

    // ------------------------------------------------------------------------
    // Intersection Observer (Auto-pause WebGL when offscreen)
    // ------------------------------------------------------------------------
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
      });
    }, { threshold: 0.05 });
    observer.observe(stageEl);

    // Resize Handler
    function onResize() {
      if (!stageEl || !renderer || !camera) return;
      const width = stageEl.clientWidth;
      const height = stageEl.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    window.addEventListener('resize', onResize);

    // ------------------------------------------------------------------------
    // Main Render Loop (60 FPS lerp interpolation)
    // ------------------------------------------------------------------------
    let clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      if (!isVisible) return;

      const delta = clock.getDelta();

      // Continuous subtle idle rotation when untouched
      if (autoRotate && !isDragging) {
        targetRotation.y += autoRotateSpeed;
      }

      // Smooth inertia lerp for wheel rotation
      currentRotation.x += (targetRotation.x - currentRotation.x) * 0.08;
      currentRotation.y += (targetRotation.y - currentRotation.y) * 0.08;

      wheelGroup.rotation.x = currentRotation.x;
      wheelGroup.rotation.y = currentRotation.y;
      // Combine rolling motion with scroll offset
      wheelGroup.rotation.z = scrollRotationOffset;

      // Subtle float oscillation
      const time = clock.getElapsedTime();
      wheelGroup.position.y = Math.sin(time * 1.5) * 0.08;
      caliperGroup.position.y = wheelGroup.position.y;

      // Slowly rotate particle field
      if (particles) {
        particles.rotation.y = time * 0.03;
        particles.rotation.x = Math.sin(time * 0.02) * 0.1;
      }

      // Smooth camera transition between presets
      camera.position.lerp(targetCamPos, 0.06);
      camera.lookAt(activeCamTarget);

      renderer.render(scene, camera);
    }

    animate();
  }

  // --------------------------------------------------------------------------
  // 2. 3D CARD HOVER PERSPECTIVE TILT & SPECULAR SHEEN
  // --------------------------------------------------------------------------
  const tiltCards = document.querySelectorAll('.card-3d-tilt');

  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Rotation range: -12deg to +12deg
      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(12px)`;
      card.style.setProperty('--sheen-x', `${(x / rect.width * 100).toFixed(1)}%`);
      card.style.setProperty('--sheen-y', `${(y / rect.height * 100).toFixed(1)}%`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    });
  });

  // --------------------------------------------------------------------------
  // 3. STATS NUMBER COUNTER ANIMATION (ON SCROLL INTO VIEW)
  // --------------------------------------------------------------------------
  const counters = document.querySelectorAll('[data-counter-target]');
  if (counters.length > 0) {
    const counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.getAttribute('data-counter-target'));
          const suffix = el.getAttribute('data-counter-suffix') || '';
          const prefix = el.getAttribute('data-counter-prefix') || '';
          const decimals = parseInt(el.getAttribute('data-counter-decimals') || '0', 10);
          const duration = 2000;
          let startTime = null;

          function updateCounter(currentTime) {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            // EaseOutCubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = easeProgress * target;

            el.textContent = prefix + (decimals > 0 ? currentVal.toFixed(decimals) : Math.floor(currentVal).toLocaleString()) + suffix;

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              el.textContent = prefix + (decimals > 0 ? target.toFixed(decimals) : target.toLocaleString()) + suffix;
            }
          }

          requestAnimationFrame(updateCounter);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.25 });

    counters.forEach(counter => counterObserver.observe(counter));
  }

  // --------------------------------------------------------------------------
  // 4. OUR SERVICES INTERACTIVE HORIZONTAL SHOWCASE & DETAIL PANEL
  // --------------------------------------------------------------------------
  initOurServicesShowcase();

  function initOurServicesShowcase() {
    const serviceCards = document.querySelectorAll('.service-horizontal-card[data-service-key]');
    const detailInner = document.getElementById('serviceDetailInner');

    if (!serviceCards.length || !detailInner) return;

    const servicesData = {
      alignment: {
        num: "01",
        tag: "01 / Computerized Handling",
        title: "Wheel Alignment",
        lead: "Restore Factory Suspension Geometry with ±0.01° Laser Precision",
        desc: "At Sesco Tyres, wheel alignment adjusts the angles of your vehicle's wheels so they are precisely perpendicular to the ground and parallel to each other. Using our Italian multi-camera 3D laser diagnostic rigs, certified technicians realign camber, caster, and toe angles to exact manufacturer tolerances. This eliminates dangerous steering wheel pulling, reduces rolling resistance, protects suspension linkages, and prevents costly irregular tyre wear.",
        specs: [
          { icon: "fa-solid fa-crosshairs", label: "Precision Laser Sensors", val: "±0.01° Optical Accuracy" },
          { icon: "fa-solid fa-print", label: "Diagnostic Audit", val: "Live Camber/Toe Printout" },
          { icon: "fa-solid fa-clock-rotate-left", label: "Recommended Interval", val: "Every 10,000 km / After Impact" },
          { icon: "fa-solid fa-shield-halved", label: "Handling Benefit", val: "100% Highway Stability" }
        ],
        features: [
          "Precision 3D Italian optical laser diagnostic cameras and wheel targets",
          "Factory toe, camber, and caster calibration for front and rear axles",
          "Eliminates highway drifting, steering wobble, and uneven shoulder tyre wear",
          "Full digital before-and-after alignment inspection report provided"
        ],
        bookLink: "contact.html?subject=Wheel%20Alignment%20Booking",
        bookText: "Book Wheel Alignment",
        articleLink: "service-detail.html#alignment"
      },
      rotation: {
        num: "02",
        tag: "02 / Tread Longevity",
        title: "Tyre Rotation",
        lead: "Extend Tyre Tread Life by Up to 20% with Periodic Axle Rotation",
        desc: "Tyres at each corner of your vehicle perform different jobs and bear vastly different loads. Front tyres on Ugandan roads endure the majority of acceleration, heavy steering friction, and weight transfer during braking. Regular tyre rotation periodically alternates tyre positions using verified directional or asymmetric cross-patterns to ensure even wear across all four tyres, preserving braking grip and maximizing your investment.",
        specs: [
          { icon: "fa-solid fa-arrows-rotate", label: "Wear Pattern", val: "Front-to-Rear & Cross Rotation" },
          { icon: "fa-solid fa-gauge-high", label: "Tread Depth Audit", val: "Multi-Point Micrometer Check" },
          { icon: "fa-solid fa-calendar-check", label: "Recommended Interval", val: "Every 8,000 – 10,000 km" },
          { icon: "fa-solid fa-chart-line", label: "Longevity Benefit", val: "Up to 20% Life Extension" }
        ],
        features: [
          "Optimal rotational patterns tailored for FWD, RWD & AWD vehicle architectures",
          "Multi-point tread depth and rubber compound inspection at every corner",
          "Promotes balanced cornering traction and wet-weather stopping performance",
          "Free tyre pressure calibration and valve stem condition check included"
        ],
        bookLink: "contact.html?subject=Tyre%20Rotation%20Booking",
        bookText: "Book Tyre Rotation",
        articleLink: "service-detail.html#rotation"
      },
      fitting: {
        num: "03",
        tag: "03 / Fitment Specialists",
        title: "Tyre Fitting",
        lead: "Touchless High-Pressure Tyre Demounting & Alloy-Safe Installation",
        desc: "Incorrect tyre mounting can tear inner bead bundles, scratch expensive alloy rims, or cause dangerous slow leaks that lead to blowouts at high speeds. Sesco Tyres master fitters utilize European touchless pneumatic tyre mounting machines that securely seat tyres without metal-on-metal contact. Every fitting includes fresh high-pressure rubber valves, airtight bead seal testing, and calibrated inflation.",
        specs: [
          { icon: "fa-solid fa-screwdriver-wrench", label: "Fitment Technology", val: "Touchless Pneumatic Changers" },
          { icon: "fa-solid fa-stopwatch", label: "Turnaround Time", val: "10–15 Minutes Per Axle" },
          { icon: "fa-solid fa-circle-check", label: "Rim Protection", val: "Zero Scratch Guarantee on Rims" },
          { icon: "fa-solid fa-shield-virus", label: "Valves & Seals", val: "New Valve Stems & Bead Seal" }
        ],
        features: [
          "High-speed pneumatic rim mounting with anti-scratch nylon clamp jaws",
          "Zero damage to tyre bead bundles, sidewall plies, or TPMS pressure sensors",
          "Brand new high-grade replacement rubber or metal valves installed",
          "Accurate multi-axle pressure inflation and airtight water-tank verification"
        ],
        bookLink: "contact.html?subject=Tyre%20Fitting%20Booking",
        bookText: "Book Tyre Fitting",
        articleLink: "service-detail.html#fitting"
      },
      balancing: {
        num: "04",
        tag: "04 / High-Speed Stability",
        title: "Tyre Balancing",
        lead: "Eliminate Highway Steering Wobble with Dynamic Laser Balancing",
        desc: "Even a microscopic weight difference of a few grams across a wheel assembly generates violent centrifugal vibration when spinning at 80–120 km/h. This vibration fatigues drivers, damages wheel bearings, and ruins steering linkages. Our computerized Hofmann dynamic spin balancers measure static and dynamic forces, pinpointing exact counter-weight placement with laser accuracy for a silky smooth ride.",
        specs: [
          { icon: "fa-solid fa-arrows-spin", label: "Balancing Rig", val: "Computerized Hofmann Balancers" },
          { icon: "fa-solid fa-bullseye", label: "Laser Precision", val: "Micro-gram Counter-Weight Guide" },
          { icon: "fa-solid fa-car", label: "Ride Quality", val: "Zero Highway Steering Wobble" },
          { icon: "fa-solid fa-gears", label: "Protection", val: "Extends Bearing & Bushing Life" }
        ],
        features: [
          "State-of-the-art Hofmann computerized dynamic spin balancing",
          "Laser weight placement guide for concealed, aesthetic alloy weights",
          "Completely eradicates highway steering wheel vibrations and cabin resonance",
          "Protects steering rack, shock absorbers, and suspension bushings from fatigue"
        ],
        bookLink: "contact.html?subject=Tyre%20Balancing%20Booking",
        bookText: "Book Tyre Balancing",
        articleLink: "service-detail.html#balancing"
      },
      tyres: {
        num: "05",
        tag: "05 / Tyre Inventory & Supply",
        title: "Stok Tyres",
        lead: "100% Factory-Direct Genuine Tyres from Premier Global Manufacturers",
        desc: "Sesco Tyres is Uganda's authorized distributor for world-renowned tyre brands including Rodeo, Roadstone, and Otani, alongside premier international tier-1 manufacturers Michelin, Bridgestone, Continental, Pirelli, Goodyear, and Dunlop. Whether you need ultra-high performance passenger tyres, heavy-duty 4x4 all-terrain tyres, or commercial fleet haulage tyres, our vast Queensway Kampala warehouse holds verified factory-fresh inventory backed by manufacturer warranties.",
        specs: [
          { icon: "fa-solid fa-certificate", label: "Authenticity", val: "100% Genuine Authorized Stocks" },
          { icon: "fa-solid fa-layer-group", label: "Inventory Range", val: "Sedan, SUV, 4x4, Truck & Fleet" },
          { icon: "fa-solid fa-award", label: "Warranty", val: "Official Manufacturer Warranties" },
          { icon: "fa-solid fa-hand-holding-dollar", label: "Direct Pricing", val: "Importer Wholesale Rates" }
        ],
        features: [
          "Sole authorized Ugandan distributor for Rodeo, Roadstone & Otani brands",
          "Tier-1 inventory: Michelin, Bridgestone, Continental, Goodyear & Dunlop",
          "Massive Queensway warehouse stock for passenger, SUV, light & heavy trucks",
          "Full manufacturer warranties with complimentary fitment and inspection"
        ],
        bookLink: "shop.html",
        bookText: "Browse Tyre Catalogue",
        articleLink: "service-detail.html#tyres"
      },
      servicing: {
        num: "06",
        tag: "06 / Vehicle Maintenance",
        title: "Basic Car Servicing",
        lead: "Preventative Automotive Care, Fluid Replacements & Diagnostic Audits",
        desc: "Regular preventative servicing is the lifeblood of your vehicle. Over time, engine oil degrades, accumulates sludge, and loses thermal viscosity, which accelerates internal friction and threatens catastrophic engine failure. Our certified technicians perform comprehensive basic car servicing, replacing engine oil and OEM filters, inspecting brake pads and rotors, checking transmission and coolant fluids, and conducting an extensive multi-point safety diagnostic.",
        specs: [
          { icon: "fa-solid fa-oil-can", label: "Lubrication", val: "Synthetic Engine Oil & OEM Filter" },
          { icon: "fa-solid fa-clipboard-check", label: "Diagnostic Audit", val: "Comprehensive Multi-Point Check" },
          { icon: "fa-solid fa-droplet", label: "Fluids Serviced", val: "Coolant, Brake, Steering & Washer" },
          { icon: "fa-solid fa-hourglass-half", label: "Interval", val: "Every 5,000 km or 6 Months" }
        ],
        features: [
          "High-grade synthetic engine oil and OEM certified filter replacement",
          "Brake pad, disc rotor, shock absorber, and suspension health check",
          "Coolant, brake fluid, battery electrolyte, and washer fluid top-up",
          "Computerized multi-point vehicle safety and roadworthiness audit"
        ],
        bookLink: "contact.html?subject=Basic%20Car%20Servicing%20Booking",
        bookText: "Book Car Servicing",
        articleLink: "service-detail.html#servicing"
      }
    };

    function renderService(key, shouldAnimate = true) {
      const data = servicesData[key];
      if (!data) return;

      const specsHtml = data.specs.map(s => `
        <div class="service-spec-item">
          <div class="service-spec-icon-wrap">
            <i class="${s.icon} service-spec-icon" aria-hidden="true"></i>
          </div>
          <div class="service-spec-meta">
            <span class="service-spec-label">${s.label}</span>
            <strong class="service-spec-val">${s.val}</strong>
          </div>
        </div>
      `).join('');

      const featuresHtml = data.features.map(f => `
        <li><i class="fa-solid fa-circle-check" aria-hidden="true"></i> <span>${f}</span></li>
      `).join('');

      detailInner.innerHTML = `
        <div class="service-detail-grid ${shouldAnimate ? 'service-detail-anim' : ''}">
          <div class="service-detail-main">
            <div class="service-detail-header-badge">
              <span class="service-detail-tag">${data.tag}</span>
              <span class="service-detail-divider">/</span>
              <span class="service-detail-badge"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Certified Sesco Standard</span>
            </div>
            <h3 class="service-detail-title">${data.title}</h3>
            <h4 class="service-detail-lead">${data.lead}</h4>
            <p class="service-detail-desc">${data.desc}</p>
            <div class="service-detail-actions">
              <a href="${data.bookLink}" class="btn btn-primary service-action-btn">
                <i class="fa-solid fa-calendar-check" aria-hidden="true"></i>
                <span>${data.bookText}</span>
              </a>
              <a href="${data.articleLink}" class="btn btn-outline-white service-action-btn">
                <span>Read Full Technical Guide</span>
                <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
              </a>
            </div>
          </div>
          <div class="service-detail-sidebar">
            <div class="service-specs-header">
              <i class="fa-solid fa-sliders" aria-hidden="true"></i>
              <span>Engineering Specifications</span>
            </div>
            <div class="service-specs-grid">
              ${specsHtml}
            </div>
            <div class="service-checklist-box">
              <h5 class="service-checklist-title">
                <i class="fa-solid fa-circle-nodes" aria-hidden="true"></i>
                <span>Workshop Quality Standards</span>
              </h5>
              <ul class="service-checklist-items">
                ${featuresHtml}
              </ul>
            </div>
          </div>
        </div>
      `;
    }

    // Card Click Handler
    serviceCards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const key = card.getAttribute('data-service-key');
        if (!key) return;

        // Toggle active card
        serviceCards.forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-selected', 'false');
        });

        card.classList.add('active');
        card.setAttribute('aria-selected', 'true');

        // Render information
        renderService(key, true);
      });
    });

    // Initial render for active card (Wheel Alignment)
    const activeCard = document.querySelector('.service-horizontal-card.active') || serviceCards[0];
    if (activeCard) {
      const initialKey = activeCard.getAttribute('data-service-key') || 'alignment';
      renderService(initialKey, false);
    }
  }

  // --------------------------------------------------------------------------
  // 4b. OUR VALUES 3-CARD STAGE & DYNAMIC INFO CONTROLLER
  // Stage: Values (Left), Mission (Center/Front), Vision (Right)
  // Continuous scroll animation & reversible in both directions
  // --------------------------------------------------------------------------
  initOurValuesDeck();

  function initOurValuesDeck() {
    const section = document.getElementById('our-values');
    if (!section) return;

    const stageCardMission = document.getElementById('stageCardMission');
    const stageCardVision = document.getElementById('stageCardVision');
    const stageCardValues = document.getElementById('stageCardValues');

    const panelMission = document.getElementById('infoPanelMission');
    const panelVision = document.getElementById('infoPanelVision');
    const panelValues = document.getElementById('infoPanelValues');

    const pills = document.querySelectorAll('.values-nav-pill');

    if (!stageCardMission || !stageCardVision || !stageCardValues) return;

    function smoothStep(edge0, edge1, x) {
      const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
      return t * t * (3 - 2 * t);
    }

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function applyCardTransform(card, x, y, scale, rotY, zIndex, opacity) {
      if (!card) return;
      card.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)}) rotateY(${rotY.toFixed(1)}deg)`;
      card.style.zIndex = zIndex;
      card.style.opacity = opacity.toFixed(3);
    }

    function updateDeck() {
      const rect = section.getBoundingClientRect();
      const totalScroll = section.offsetHeight - window.innerHeight;
      if (totalScroll <= 0) return;

      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / totalScroll));

      // Dynamic spacing between cards according to screen width
      let cardSpacing;
      if (window.innerWidth < 640) {
        cardSpacing = Math.min(150, window.innerWidth * 0.32);
      } else if (window.innerWidth < 1024) {
        cardSpacing = 240;
      } else if (window.innerWidth < 1300) {
        cardSpacing = 320;
      } else {
        cardSpacing = 395;
      }

      // Transitions with wide, comfortable resting plateaus:
      // Stage 0 (Mission Front): 0.00 to 0.28 (t1=0, t2=0)
      // Transition 0 -> 1: 0.28 to 0.48 (t1: 0 -> 1)
      // Stage 1 (Vision Front): 0.48 to 0.72 (t1=1, t2=0)
      // Transition 1 -> 2: 0.72 to 0.88 (t2: 0 -> 1)
      // Stage 2 (Values Front): 0.88 to 1.00 (t1=1, t2=1)
      const t1 = smoothStep(0.28, 0.48, progress);
      const t2 = smoothStep(0.72, 0.88, progress);

      // 1. Mission Card
      // Stage 0: Center (front)
      // Transition 0 -> 1: Center -> Left
      // Stage 1: Left
      // Transition 1 -> 2: Left -> Right (via behind arc)
      // Stage 2: Right
      let mX, mY, mScale, mRotY, mZ, mOp;
      if (t1 < 1) {
        mX = lerp(0, -cardSpacing, t1);
        mY = lerp(0, 10, t1);
        mScale = lerp(1.06, 0.90, t1);
        mRotY = lerp(0, 10, t1);
        mZ = t1 > 0.5 ? 10 : 30;
        mOp = lerp(1, 0.85, t1);
      } else {
        mX = lerp(-cardSpacing, cardSpacing, t2);
        mY = 10 + Math.sin(t2 * Math.PI) * 14;
        mScale = 0.90 - Math.sin(t2 * Math.PI) * 0.10;
        mRotY = lerp(10, -10, t2);
        mZ = 5;
        mOp = 0.85 - Math.sin(t2 * Math.PI) * 0.25;
      }
      applyCardTransform(stageCardMission, mX, mY, mScale, mRotY, mZ, mOp);

      // 2. Vision Card
      // Stage 0: Right
      // Transition 0 -> 1: Right -> Center (front)
      // Stage 1: Center (front)
      // Transition 1 -> 2: Center -> Left
      // Stage 2: Left
      let vX, vY, vScale, vRotY, vZ, vOp;
      if (t1 < 1) {
        vX = lerp(cardSpacing, 0, t1);
        vY = lerp(10, 0, t1);
        vScale = lerp(0.90, 1.06, t1);
        vRotY = lerp(-10, 0, t1);
        vZ = t1 > 0.5 ? 30 : 10;
        vOp = lerp(0.85, 1, t1);
      } else {
        vX = lerp(0, -cardSpacing, t2);
        vY = lerp(0, 10, t2);
        vScale = lerp(1.06, 0.90, t2);
        vRotY = lerp(0, 10, t2);
        vZ = t2 > 0.5 ? 10 : 30;
        vOp = lerp(1, 0.85, t2);
      }
      applyCardTransform(stageCardVision, vX, vY, vScale, vRotY, vZ, vOp);

      // 3. Values Card
      // Stage 0: Left
      // Transition 0 -> 1: Left -> Right (via behind arc)
      // Stage 1: Right
      // Transition 1 -> 2: Right -> Center (front)
      // Stage 2: Center (front)
      let valX, valY, valScale, valRotY, valZ, valOp;
      if (t1 < 1) {
        valX = lerp(-cardSpacing, cardSpacing, t1);
        valY = 10 + Math.sin(t1 * Math.PI) * 14;
        valScale = 0.90 - Math.sin(t1 * Math.PI) * 0.10;
        valRotY = lerp(10, -10, t1);
        valZ = 5;
        valOp = 0.85 - Math.sin(t1 * Math.PI) * 0.25;
      } else {
        valX = lerp(cardSpacing, 0, t2);
        valY = lerp(10, 0, t2);
        valScale = lerp(0.90, 1.06, t2);
        valRotY = lerp(-10, 0, t2);
        valZ = t2 > 0.5 ? 30 : 10;
        valOp = lerp(0.85, 1, t2);
      }
      applyCardTransform(stageCardValues, valX, valY, valScale, valRotY, valZ, valOp);

      // Active Stage Determination
      let activeStage = 0;
      if (progress >= 0.78) {
        activeStage = 2; // Values
      } else if (progress >= 0.38) {
        activeStage = 1; // Vision
      } else {
        activeStage = 0; // Mission
      }

      // Update Card Active Classes
      stageCardMission.classList.toggle('is-active', activeStage === 0);
      stageCardVision.classList.toggle('is-active', activeStage === 1);
      stageCardValues.classList.toggle('is-active', activeStage === 2);

      // Update Info Panels
      if (panelMission) panelMission.classList.toggle('is-active', activeStage === 0);
      if (panelVision) panelVision.classList.toggle('is-active', activeStage === 1);
      if (panelValues) panelValues.classList.toggle('is-active', activeStage === 2);

      // Update Nav Pills
      pills.forEach((p, idx) => {
        if (idx === activeStage) {
          p.classList.add('active');
          p.setAttribute('aria-selected', 'true');
        } else {
          p.classList.remove('active');
          p.setAttribute('aria-selected', 'false');
        }
      });
    }

    // Scroll To Stage Helper
    function scrollToStage(step) {
      const totalScroll = section.offsetHeight - window.innerHeight;
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;

      let targetY = sectionTop;
      if (step === 0) {
        targetY = sectionTop + totalScroll * 0.05;
      } else if (step === 1) {
        targetY = sectionTop + totalScroll * 0.58;
      } else if (step === 2) {
        targetY = sectionTop + totalScroll * 0.90;
      }

      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
    }

    // Interactive Pill Navigation
    pills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        const step = parseInt(pill.getAttribute('data-step') || '0', 10);
        scrollToStage(step);
      });
    });

    // Click on Card directly to bring it to center stage
    stageCardMission.addEventListener('click', () => scrollToStage(0));
    stageCardVision.addEventListener('click', () => scrollToStage(1));
    stageCardValues.addEventListener('click', () => scrollToStage(2));

    // RequestAnimationFrame scroll binding
    let isTicking = false;
    window.addEventListener('scroll', () => {
      if (!isTicking) {
        window.requestAnimationFrame(() => {
          updateDeck();
          isTicking = false;
        });
        isTicking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      updateDeck();
    }, { passive: true });

    // Initial position call
    updateDeck();
  }

  // --------------------------------------------------------------------------
  // 5. 3D SCROLL REVEAL OBSERVER
  // --------------------------------------------------------------------------
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, { threshold: 0.12 });

    revealElements.forEach(el => revealObserver.observe(el));
  }

  // --------------------------------------------------------------------------
  // 6. REALISTIC 3D TYRE HERO MOTION SEQUENCE (THREE.JS WEBGL)
  // Actions:
  // - On arrival: Realistic 3D tyre rendered with Three.js WebGL on navy blue banner
  // - After 2s: The 3D tyre spins 360 degrees twice in the X-axis plane (720deg)
  // - The 3D tyre disappears in a smooth fade out transition
  // - Immediately after, the sentence "About Sesco Tyres" appears in a smooth transition
  // --------------------------------------------------------------------------
  initHero3DTyreMotion();

  function initHero3DTyreMotion() {
    const wrapper = document.getElementById('hero-3d-tyre-wrapper');
    const canvas = document.getElementById('hero-motion-3d-canvas');
    const titleReveal = document.getElementById('hero-title-reveal');
    const replayBtn = document.getElementById('hero-motion-replay-btn');

    if (!wrapper || !canvas || typeof THREE === 'undefined') return;

    let renderer, scene, camera, wheelGroup, tyreMesh, rimGroup, rotorMesh, caliperMesh, shadowMesh;
    let animFrameId = null;
    let timerId = null;
    let isSpinningX = false;
    let spinStartTime = 0;
    const spinDuration = 1800; // 1.8s for 2 full 360-degree rotations in X-axis (720deg / 4π)
    const baseRotX = 0.08;
    const baseRotY = -0.36; // 3/4 perspective reveals 3D tyre tread, depth & rim barrel

    // Easing function for natural spin momentum
    function easeInOutCubic(x) {
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }

    // 1. Setup Three.js WebGL Renderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      const stageW = wrapper.clientWidth || 270;
      const stageH = wrapper.clientHeight || 270;
      renderer.setSize(stageW, stageH);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      if (THREE.sRGBEncoding) {
        renderer.outputEncoding = THREE.sRGBEncoding;
      }
    } catch (e) {
      console.warn('Hero 3D WebGL init failed:', e);
      return;
    }

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.05, 8.8);

    window.addEventListener('resize', () => {
      const w = wrapper.clientWidth || 270;
      const h = wrapper.clientHeight || 270;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });

    // Studio 4-point dynamic lighting calibrated for automotive photography
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    // Key Light (sharp specular glints on spokes and curved tyre shoulder)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.85);
    keyLight.position.set(5, 6, 6);
    scene.add(keyLight);

    // Electric Cyan Rim/Fill Light (subtle contour outline on black rubber)
    const cyanLight = new THREE.DirectionalLight(0x38bdf8, 1.35);
    cyanLight.position.set(-5, -2, 4);
    scene.add(cyanLight);

    // Warm Amber Bounce Light (warm reflection picking up red caliper & lower rim)
    const amberLight = new THREE.PointLight(0xff7800, 1.25, 14);
    amberLight.position.set(2, -4, -2);
    scene.add(amberLight);

    // Top Soft Highlight
    const topLight = new THREE.DirectionalLight(0xdbeafe, 0.7);
    topLight.position.set(0, 7, 2);
    scene.add(topLight);

    // ------------------------------------------------------------------------
    // 2. Build Photorealistic 3D Wheel & Tyre Assembly
    // ------------------------------------------------------------------------
    wheelGroup = new THREE.Group();
    wheelGroup.rotation.x = baseRotX;
    wheelGroup.rotation.y = baseRotY;
    scene.add(wheelGroup);

    // 2a. Genuine Automotive 3D Tyre Geometry (Lathe Cross-Section Profile)
    // Real tyre profile: wide flat tread, squared shoulders, bulging sidewalls & bead
    const tyrePoints = [
      new THREE.Vector2(1.72, -0.62), // Inner bead seat
      new THREE.Vector2(1.78, -0.70), // Bead rim protector seat
      new THREE.Vector2(1.88, -0.76), // Rim protector ridge
      new THREE.Vector2(2.05, -0.83), // Lower sidewall
      new THREE.Vector2(2.26, -0.88), // Mid sidewall bulge
      new THREE.Vector2(2.46, -0.85), // Upper sidewall
      new THREE.Vector2(2.58, -0.76), // Shoulder transition corner
      new THREE.Vector2(2.64, -0.62), // Outer tread shoulder block
      new THREE.Vector2(2.66, -0.42), // Outer water channel
      new THREE.Vector2(2.68, -0.18), // Intermediate tread band
      new THREE.Vector2(2.69, 0.0),   // Central crown peak
      new THREE.Vector2(2.68, 0.18),  // Intermediate tread band
      new THREE.Vector2(2.66, 0.42),  // Inner water channel
      new THREE.Vector2(2.64, 0.62),  // Inner tread shoulder block
      new THREE.Vector2(2.58, 0.76),  // Inner shoulder transition
      new THREE.Vector2(2.46, 0.85),  // Upper inner sidewall
      new THREE.Vector2(2.26, 0.88),  // Mid inner sidewall
      new THREE.Vector2(2.05, 0.83),  // Lower inner sidewall
      new THREE.Vector2(1.88, 0.76),  // Inner rim protector ridge
      new THREE.Vector2(1.78, 0.70),  // Inner bead corner
      new THREE.Vector2(1.72, 0.62),  // Inner bead seat
      // Inner liner cavity to form a completely enclosed solid 3D mass
      new THREE.Vector2(1.80, 0.52),
      new THREE.Vector2(2.10, 0.70),
      new THREE.Vector2(2.38, 0.68),
      new THREE.Vector2(2.52, 0.0),
      new THREE.Vector2(2.38, -0.68),
      new THREE.Vector2(2.10, -0.70),
      new THREE.Vector2(1.80, -0.52),
      new THREE.Vector2(1.72, -0.62)
    ];

    const tyreGeom = new THREE.LatheGeometry(tyrePoints, 96);
    tyreGeom.computeVertexNormals();

    // 2b. High-Resolution Diffuse & Bump Textures (2048 x 1024)
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = 2048;
    colorCanvas.height = 1024;
    const cCtx = colorCanvas.getContext('2d');

    // Base vulcanized rubber tone (deep rich carbon black)
    cCtx.fillStyle = '#141518';
    cCtx.fillRect(0, 0, 2048, 1024);

    // Tread band area (y ≈ 340 to 680)
    cCtx.fillStyle = '#0a0a0c';
    cCtx.fillRect(0, 360, 2048, 24); // Shoulder channel 1
    cCtx.fillRect(0, 440, 2048, 30); // Center-left channel 2
    cCtx.fillRect(0, 550, 2048, 30); // Center-right channel 3
    cCtx.fillRect(0, 630, 2048, 24); // Shoulder channel 4

    // Sipes & lateral drainage grooves
    const cols = 48;
    const stepX = 2048 / cols;
    cCtx.strokeStyle = '#070709';
    cCtx.lineWidth = 4;
    for (let i = 0; i < cols; i++) {
      const x = i * stepX;
      cCtx.beginPath(); cCtx.moveTo(x, 280); cCtx.lineTo(x + 18, 360); cCtx.stroke();
      cCtx.beginPath(); cCtx.moveTo(x + 8, 388); cCtx.lineTo(x + 28, 440); cCtx.stroke();
      cCtx.beginPath(); cCtx.moveTo(x + 14, 478); cCtx.lineTo(x + 26, 495); cCtx.lineTo(x + 14, 512); cCtx.stroke();
      cCtx.beginPath(); cCtx.moveTo(x + 28, 580); cCtx.lineTo(x + 10, 630); cCtx.stroke();
      cCtx.beginPath(); cCtx.moveTo(x + 18, 654); cCtx.lineTo(x, 735); cCtx.stroke();
    }

    // Sidewall lettering (rubber-on-rubber dark slate branding)
    cCtx.fillStyle = '#262932';
    cCtx.font = 'bold 34px "Arial Black", "Impact", sans-serif';
    cCtx.fillText('SESCO SPORT GT  245/40 ZR19 98Y XL', 80, 125);
    cCtx.fillText('★ ULTRA HIGH PERFORMANCE ★ RADIAL TUBELESS', 100, 215);
    cCtx.fillText('SESCO SPORT GT  245/40 ZR19 98Y XL', 1100, 125);
    cCtx.fillText('OUTSIDE  ▶▶  ROTATION  ▶▶  MAX LOAD 750KG', 1120, 215);
    cCtx.fillText('SESCO TYRES UGANDA  •  PRECISION MOTORING', 120, 915);
    cCtx.fillText('SESCO TYRES UGANDA  •  PRECISION MOTORING', 1140, 915);

    const colorMap = new THREE.CanvasTexture(colorCanvas);
    colorMap.wrapS = THREE.RepeatWrapping;
    colorMap.wrapT = THREE.ClampToEdgeWrapping;
    colorMap.needsUpdate = true;

    // Bump Map: calibrated with neutral #808080 height
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 2048;
    bumpCanvas.height = 1024;
    const bCtx = bumpCanvas.getContext('2d');

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 2048, 1024);

    // Deep aquaplaning channels (#101010)
    bCtx.fillStyle = '#101010';
    bCtx.fillRect(0, 360, 2048, 24);
    bCtx.fillRect(0, 440, 2048, 30);
    bCtx.fillRect(0, 550, 2048, 30);
    bCtx.fillRect(0, 630, 2048, 24);

    // Bevels
    bCtx.fillStyle = '#404040';
    bCtx.fillRect(0, 356, 2048, 4);
    bCtx.fillRect(0, 384, 2048, 4);
    bCtx.fillRect(0, 436, 2048, 4);
    bCtx.fillRect(0, 470, 2048, 4);
    bCtx.fillRect(0, 546, 2048, 4);
    bCtx.fillRect(0, 580, 2048, 4);
    bCtx.fillRect(0, 626, 2048, 4);
    bCtx.fillRect(0, 654, 2048, 4);

    // Lateral grooves
    bCtx.strokeStyle = '#181818';
    bCtx.lineWidth = 5;
    bCtx.lineCap = 'round';
    for (let i = 0; i < cols; i++) {
      const x = i * stepX;
      bCtx.beginPath(); bCtx.moveTo(x, 280); bCtx.lineTo(x + 18, 360); bCtx.stroke();
      bCtx.beginPath(); bCtx.moveTo(x + 8, 388); bCtx.lineTo(x + 28, 440); bCtx.stroke();
      bCtx.beginPath(); bCtx.moveTo(x + 14, 478); bCtx.lineTo(x + 26, 495); bCtx.lineTo(x + 14, 512); bCtx.stroke();
      bCtx.beginPath(); bCtx.moveTo(x + 28, 580); bCtx.lineTo(x + 10, 630); bCtx.stroke();
      bCtx.beginPath(); bCtx.moveTo(x + 18, 654); bCtx.lineTo(x, 735); bCtx.stroke();
    }

    // Sidewall circular embossed ribs (raised: #b0b0b0)
    bCtx.strokeStyle = '#a2a2a2';
    bCtx.lineWidth = 4;
    bCtx.beginPath();
    bCtx.moveTo(0, 160); bCtx.lineTo(2048, 160);
    bCtx.moveTo(0, 185); bCtx.lineTo(2048, 185);
    bCtx.moveTo(0, 835); bCtx.lineTo(2048, 835);
    bCtx.moveTo(0, 860); bCtx.lineTo(2048, 860);
    bCtx.stroke();

    // Sidewall text embossing (raised: #c0c0c0)
    bCtx.fillStyle = '#b8b8b8';
    bCtx.font = 'bold 34px "Arial Black", "Impact", sans-serif';
    bCtx.fillText('SESCO SPORT GT  245/40 ZR19 98Y XL', 80, 125);
    bCtx.fillText('★ ULTRA HIGH PERFORMANCE ★ RADIAL TUBELESS', 100, 215);
    bCtx.fillText('SESCO SPORT GT  245/40 ZR19 98Y XL', 1100, 125);
    bCtx.fillText('OUTSIDE  ▶▶  ROTATION  ▶▶  MAX LOAD 750KG', 1120, 215);
    bCtx.fillText('SESCO TYRES UGANDA  •  PRECISION MOTORING', 120, 915);
    bCtx.fillText('SESCO TYRES UGANDA  •  PRECISION MOTORING', 1140, 915);

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.ClampToEdgeWrapping;
    bumpMap.needsUpdate = true;

    // Roughness map (matte tread, satin sidewall, glossier groove bottoms)
    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = 1024;
    roughCanvas.height = 512;
    const rCtx = roughCanvas.getContext('2d');
    rCtx.fillStyle = '#b8b8b8'; // ~0.72 roughness sidewall
    rCtx.fillRect(0, 0, 1024, 512);
    // Tread face: matte rubber (#e0e0e0 ~0.88 roughness)
    rCtx.fillStyle = '#dedede';
    rCtx.fillRect(0, 140, 1024, 230);
    // Grooves: smoother (#666666 ~0.45 roughness)
    rCtx.fillStyle = '#666666';
    rCtx.fillRect(0, 180, 1024, 16);
    rCtx.fillRect(0, 220, 1024, 18);
    rCtx.fillRect(0, 275, 1024, 18);
    rCtx.fillRect(0, 315, 1024, 16);

    const roughnessMap = new THREE.CanvasTexture(roughCanvas);
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
    roughnessMap.needsUpdate = true;

    const tyreMat = new THREE.MeshStandardMaterial({
      color: 0x121316, // Pure vulcanized carbon black rubber
      map: colorMap,
      bumpMap: bumpMap,
      bumpScale: 0.045,
      roughness: 0.84,
      metalness: 0.04,
      roughnessMap: roughnessMap
    });

    tyreMesh = new THREE.Mesh(tyreGeom, tyreMat);
    tyreMesh.rotation.x = Math.PI / 2;
    wheelGroup.add(tyreMesh);

    // 2c. High-End 3D Multi-Spoke Performance Alloy Wheel
    rimGroup = new THREE.Group();
    wheelGroup.add(rimGroup);

    const brightRimMat = new THREE.MeshStandardMaterial({
      color: 0xf3f4f6,
      metalness: 0.95,
      roughness: 0.15
    });

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xd4d8df,
      metalness: 0.92,
      roughness: 0.22
    });

    const darkAlloyMat = new THREE.MeshStandardMaterial({
      color: 0x1a212b,
      metalness: 0.88,
      roughness: 0.35
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.98,
      roughness: 0.06
    });

    // Outer Rim Barrel Cylinder
    const rimBarrelGeom = new THREE.CylinderGeometry(1.74, 1.74, 1.44, 64, 1, true);
    const rimBarrel = new THREE.Mesh(rimBarrelGeom, rimMat);
    rimBarrel.rotation.x = Math.PI / 2;
    rimGroup.add(rimBarrel);

    // Outer Polished Stepped Rim Lip
    const rimLipGeom = new THREE.TorusGeometry(1.74, 0.07, 16, 64);
    const rimLip = new THREE.Mesh(rimLipGeom, brightRimMat);
    rimLip.position.z = 0.70;
    rimGroup.add(rimLip);

    // Inner Rear Rim Flange
    const rimLipBack = new THREE.Mesh(rimLipGeom, rimMat);
    rimLipBack.position.z = -0.70;
    rimGroup.add(rimLipBack);

    // Inner drop-center step ring
    const stepGeom = new THREE.TorusGeometry(1.56, 0.05, 16, 64);
    const stepMesh = new THREE.Mesh(stepGeom, darkAlloyMat);
    stepMesh.position.z = 0.52;
    rimGroup.add(stepMesh);

    // Solid inner back barrel so wheel is solid from behind
    const backWallGeom = new THREE.RingGeometry(0.70, 1.72, 48);
    const backWall = new THREE.Mesh(backWallGeom, darkAlloyMat);
    backWall.position.z = -0.58;
    rimGroup.add(backWall);

    // 10-Spoke Forged Performance Sports Alloy Design
    const spokeCount = 10;
    const spokeLen = 1.32;
    const spokeRadius = 1.10;

    for (let i = 0; i < spokeCount; i++) {
      const angle = (i * Math.PI * 2) / spokeCount;

      // Main diamond-cut spoke blade
      const spokeGeom = new THREE.BoxGeometry(0.18, spokeLen, 0.12);
      const spokeMesh = new THREE.Mesh(spokeGeom, brightRimMat);
      spokeMesh.position.set(Math.cos(angle) * spokeRadius, Math.sin(angle) * spokeRadius, 0.54);
      spokeMesh.rotation.z = angle - Math.PI / 2;
      rimGroup.add(spokeMesh);

      // Gunmetal shadow pocket flank giving 3D chamfered depth
      const flankGeom = new THREE.BoxGeometry(0.24, spokeLen, 0.08);
      const flankMesh = new THREE.Mesh(flankGeom, darkAlloyMat);
      flankMesh.position.set(Math.cos(angle) * spokeRadius, Math.sin(angle) * spokeRadius, 0.48);
      flankMesh.rotation.z = angle - Math.PI / 2;
      rimGroup.add(flankMesh);

      // Center milled groove along spoke face (racing weight-reduction channel)
      const grooveGeom = new THREE.BoxGeometry(0.06, spokeLen * 0.75, 0.04);
      const grooveMesh = new THREE.Mesh(grooveGeom, darkAlloyMat);
      grooveMesh.position.set(Math.cos(angle) * spokeRadius, Math.sin(angle) * spokeRadius, 0.60);
      grooveMesh.rotation.z = angle - Math.PI / 2;
      rimGroup.add(grooveMesh);
    }

    // 5 Chrome Hex Lug Bolts with deep socket pockets
    for (let i = 0; i < 5; i++) {
      const boltAngle = (i * Math.PI * 2) / 5;

      // Socket hole cavity
      const socketGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.12, 16);
      const socketMesh = new THREE.Mesh(socketGeom, darkAlloyMat);
      socketMesh.rotation.x = Math.PI / 2;
      socketMesh.position.set(Math.cos(boltAngle) * 0.38, Math.sin(boltAngle) * 0.38, 0.62);
      rimGroup.add(socketMesh);

      // Hex Lug Nut
      const lugGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.16, 6);
      const lugMesh = new THREE.Mesh(lugGeom, chromeMat);
      lugMesh.rotation.x = Math.PI / 2;
      lugMesh.position.set(Math.cos(boltAngle) * 0.38, Math.sin(boltAngle) * 0.38, 0.66);
      rimGroup.add(lugMesh);
    }

    // Center Hub Cylinder
    const hubGeom = new THREE.CylinderGeometry(0.55, 0.65, 0.48, 32);
    const hubMesh = new THREE.Mesh(hubGeom, rimMat);
    hubMesh.rotation.x = Math.PI / 2;
    hubMesh.position.z = 0.42;
    rimGroup.add(hubMesh);

    // Sesco Emblem Disc (Deep Sapphire Navy Lacquer)
    const capDiscGeom = new THREE.CylinderGeometry(0.30, 0.30, 0.10, 32);
    const capDiscMat = new THREE.MeshStandardMaterial({ color: 0x09173a, metalness: 0.65, roughness: 0.15 });
    const capDisc = new THREE.Mesh(capDiscGeom, capDiscMat);
    capDisc.rotation.x = Math.PI / 2;
    capDisc.position.z = 0.68;
    rimGroup.add(capDisc);

    // Metallic Gold Trim Ring
    const goldRingGeom = new THREE.TorusGeometry(0.24, 0.024, 12, 32);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.18 });
    const goldRing = new THREE.Mesh(goldRingGeom, goldMat);
    goldRing.position.z = 0.74;
    rimGroup.add(goldRing);

    // Tire Air Valve Stem
    const valveStemGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.22, 12);
    const valveStemMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 });
    const valveStem = new THREE.Mesh(valveStemGeom, valveStemMat);
    valveStem.rotation.x = Math.PI / 2;
    valveStem.rotation.z = 0.45;
    valveStem.position.set(Math.cos(0.45) * 1.58, Math.sin(0.45) * 1.58, 0.58);
    rimGroup.add(valveStem);

    // 2d. Dark Cast-Iron Drilled & Slotted Ventilated Rotor
    const rotorGroup = new THREE.Group();
    wheelGroup.add(rotorGroup);

    const rotorCanvas = document.createElement('canvas');
    rotorCanvas.width = 512;
    rotorCanvas.height = 512;
    const rtx = rotorCanvas.getContext('2d');
    rtx.fillStyle = '#22262d';
    rtx.fillRect(0, 0, 512, 512);

    // Circular brushed metal grain
    rtx.strokeStyle = '#323944';
    rtx.lineWidth = 1.5;
    for (let r = 80; r < 240; r += 6) {
      rtx.beginPath();
      rtx.arc(256, 256, r, 0, Math.PI * 2);
      rtx.stroke();
    }
    // Cross-drilled cooling holes
    rtx.fillStyle = '#0e1013';
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI * 2) / 24;
      const dist1 = 135 + ((i % 3) * 35);
      rtx.beginPath();
      rtx.arc(256 + Math.cos(a) * dist1, 256 + Math.sin(a) * dist1, 4.5, 0, Math.PI * 2);
      rtx.fill();
    }
    // Curved brake slots
    rtx.strokeStyle = '#181b20';
    rtx.lineWidth = 3.5;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      rtx.beginPath();
      rtx.arc(256, 256, 170, a, a + 0.35);
      rtx.stroke();
    }

    const rotorTex = new THREE.CanvasTexture(rotorCanvas);
    const rotorMat = new THREE.MeshStandardMaterial({
      color: 0x1f232a,
      map: rotorTex,
      metalness: 0.88,
      roughness: 0.40
    });

    const rotorDiscGeom = new THREE.CylinderGeometry(1.22, 1.22, 0.08, 64);
    rotorMesh = new THREE.Mesh(rotorDiscGeom, rotorMat);
    rotorMesh.rotation.x = Math.PI / 2;
    rotorMesh.position.z = 0.16;
    rotorGroup.add(rotorMesh);

    // Aluminum Rotor Center Hat
    const hatGeom = new THREE.CylinderGeometry(0.70, 0.78, 0.14, 32);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x1a212b, metalness: 0.90, roughness: 0.30 });
    const hatMesh = new THREE.Mesh(hatGeom, hatMat);
    hatMesh.rotation.x = Math.PI / 2;
    hatMesh.position.z = 0.22;
    rotorGroup.add(hatMesh);

    // 2e. Brembo-Style Racing Brake Caliper (Gloss Racing Red)
    const caliperGroup = new THREE.Group();
    wheelGroup.add(caliperGroup);

    const caliperGeom = new THREE.BoxGeometry(0.60, 1.25, 0.50);
    const caliperMat = new THREE.MeshStandardMaterial({
      color: 0xbe123c, // Gloss Brembo Performance Red
      metalness: 0.75,
      roughness: 0.20
    });
    caliperMesh = new THREE.Mesh(caliperGeom, caliperMat);
    caliperMesh.position.set(-0.95, 0.88, 0.24);
    caliperMesh.rotation.z = 0.74;
    caliperGroup.add(caliperMesh);

    const bridgeGeom = new THREE.BoxGeometry(0.32, 0.25, 0.22);
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2 });
    const bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
    bridge.position.set(-0.95, 0.88, 0.44);
    bridge.rotation.z = 0.74;
    caliperGroup.add(bridge);

    // 2f. Soft Contact Shadow Plane underneath the wheel
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.40)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeom = new THREE.PlaneGeometry(6.4, 3.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    shadowMesh.position.set(0, -2.85, 0);
    shadowMesh.rotation.x = -Math.PI * 0.45;
    scene.add(shadowMesh);

    // ------------------------------------------------------------------------
    // 3. Render Loop & Animation Sequence
    // ------------------------------------------------------------------------
    let clock = new THREE.Clock();
    let mouseTilt = { x: 0, y: 0 };
    let currentTilt = { x: 0, y: 0 };

    window.addEventListener('mousemove', (e) => {
      const rect = wrapper.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseTilt.x = y * 0.12;
      mouseTilt.y = x * 0.18;
    });

    function renderLoop() {
      animFrameId = requestAnimationFrame(renderLoop);
      const time = clock.getElapsedTime();

      // Smooth mouse parallax tilt
      currentTilt.x += (mouseTilt.x - currentTilt.x) * 0.08;
      currentTilt.y += (mouseTilt.y - currentTilt.y) * 0.08;

      if (!isSpinningX) {
        // Idle state: Subtle breathing float & parallax
        wheelGroup.position.y = Math.sin(time * 2.2) * 0.07;
        wheelGroup.rotation.y = baseRotY + Math.sin(time * 1.5) * 0.04 + currentTilt.y;
        wheelGroup.rotation.x = baseRotX + currentTilt.x;
        shadowMesh.scale.set(1 + Math.sin(time * 2.2) * 0.04, 1, 1);
      } else {
        // Active 360-degree spins in the X-axis plane (two full turns = 4π radians / 720deg)
        const elapsed = performance.now() - spinStartTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        const easedProgress = easeInOutCubic(progress);

        // Spin in the X-axis plane
        wheelGroup.rotation.x = baseRotX + (easedProgress * Math.PI * 4);
        wheelGroup.rotation.y = baseRotY;

        // Smooth fade out as the second rotation finishes
        if (progress > 0.72) {
          const fadeProgress = (progress - 0.72) / 0.28;
          const currentOpacity = Math.max(1 - fadeProgress, 0);
          canvas.style.opacity = currentOpacity.toFixed(3);
          canvas.style.transform = `scale(${(1 - fadeProgress * 0.15).toFixed(3)})`;
          shadowMesh.material.opacity = (0.85 * currentOpacity);
        }

        // Spin complete -> reveal "About Sesco Tyres"
        if (progress >= 1) {
          isSpinningX = false;
          wrapper.classList.add('hidden');
          wrapper.style.display = 'none';

          if (titleReveal) {
            titleReveal.style.display = 'block';
            void titleReveal.offsetWidth;
            titleReveal.classList.add('revealed');
            titleReveal.style.visibility = 'visible';
            titleReveal.style.transition = 'opacity 750ms cubic-bezier(0.16, 1, 0.3, 1), transform 750ms cubic-bezier(0.16, 1, 0.3, 1)';
            titleReveal.style.opacity = '1';
            titleReveal.style.transform = 'translateY(0) scale(1)';
            titleReveal.style.pointerEvents = 'auto';
          }
        }
      }

      renderer.render(scene, camera);
    }

    renderLoop();

    // ------------------------------------------------------------------------
    // 4. Main Choreographed Sequence
    // ------------------------------------------------------------------------
    function runSequence() {
      clearTimeout(timerId);

      // Reset 3D Tyre State
      isSpinningX = false;
      wheelGroup.rotation.x = baseRotX;
      wheelGroup.rotation.y = baseRotY;
      wheelGroup.position.y = 0;
      shadowMesh.material.opacity = 0.85;

      wrapper.classList.remove('hidden');
      // 1. Initial State: Tyre starts at opacity 0 with subtle scale
      canvas.style.transition = 'none';
      canvas.style.opacity = '0';
      canvas.style.transform = 'scale(0.88)';

      // Reset Title State (Completely hidden while 3D tyre is present)
      if (titleReveal) {
        titleReveal.classList.remove('revealed');
        titleReveal.style.display = 'none';
        titleReveal.style.opacity = '0';
        titleReveal.style.visibility = 'hidden';
        titleReveal.style.transform = 'translateY(28px) scale(0.96)';
        titleReveal.style.pointerEvents = 'none';
      }

      // Force layout reflow so the transition reliably starts from opacity 0
      void canvas.offsetWidth;

      // 2. Smooth Fade In Transition (450ms)
      const fadeInDuration = 450; // smooth fade in
      const pauseBeforeSpin = 100; // 0.1s pause after fade in
      canvas.style.transition = `opacity ${fadeInDuration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${fadeInDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
      canvas.style.opacity = '1';
      canvas.style.transform = 'scale(1)';

      // 3. After 0.1s following the fade in, the spinning effect occurs and the rest follows
      timerId = setTimeout(() => {
        canvas.style.transition = 'none'; // clear transition for precise per-frame rotation and fade out
        isSpinningX = true;
        spinStartTime = performance.now();
      }, fadeInDuration + pauseBeforeSpin);
    }

    runSequence();

    // Replay button support
    if (replayBtn) {
      replayBtn.addEventListener('click', runSequence);
    }

    // Expose control methods to window
    window.heroMotionReplay = runSequence;
    window.heroMotionPause = function() {
      clearTimeout(timerId);
      isSpinningX = false;
      wrapper.classList.remove('hidden');
      wrapper.style.display = 'flex';
      canvas.style.opacity = '1';
      canvas.style.transform = 'scale(1)';
      if (titleReveal) {
        titleReveal.style.display = 'none';
        titleReveal.style.opacity = '0';
      }
    };
  }

  // --------------------------------------------------------------------------
  // 7. Interactive Letter Cursor Effect for "About Sesco Tyres"
  // When cursor moves on a letter: moves upwards and becomes bigger
  // --------------------------------------------------------------------------
  initHeroLettersCursorEffect();

  function initHeroLettersCursorEffect() {
    const sentence = document.getElementById('hero-main-sentence');
    if (!sentence) return;

    const chars = sentence.querySelectorAll('.hero-char');
    if (!chars.length) return;

    chars.forEach((char) => {
      char.addEventListener('mouseenter', () => {
        char.classList.add('char-active');
      });

      char.addEventListener('mouseleave', () => {
        setTimeout(() => {
          char.classList.remove('char-active');
        }, 120);
      });
    });

    // Fluid pointer tracking for swift cursor sweeping
    sentence.addEventListener('pointermove', (e) => {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (target && target.classList.contains('hero-char')) {
        target.classList.add('char-active');
      }
    });
  }

})();

