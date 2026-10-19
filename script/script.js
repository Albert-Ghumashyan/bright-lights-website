// ==================================================
// BRIGHT LIGHTS — MAIN SCRIPT
// Header Player + Playlist + News + Gallery + Swiper
// ==================================================

document.addEventListener("DOMContentLoaded", () => {
  // ====================== SWIPER ======================

  if (typeof Swiper !== "undefined" && document.querySelector(".mySwiper")) {
    new Swiper(".mySwiper", {
      slidesPerView: 3,
      spaceBetween: 24,
      navigation: {
        prevEl: ".custom-prev",
        nextEl: ".custom-next",
      },
      breakpoints: {
        320: { slidesPerView: 1 },
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      },
    });
  }

  // ====================== NEWS CARDS ======================

  const newsCards = document.querySelectorAll(".cards-block .card");

  if ("IntersectionObserver" in window) {
    const newsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.15 },
    );

    newsCards.forEach((card) => newsObserver.observe(card));
  } else {
    newsCards.forEach((card) => card.classList.add("is-visible"));
  }

  // ====================== GALLERY LIGHTBOX ======================

  const galleryImages = [...document.querySelectorAll(".section-gallery img")];

  const lightbox = document.querySelector("#gallery-lightbox");

  if (galleryImages.length && lightbox) {
    const image = lightbox.querySelector(".lightbox-image");
    const close = lightbox.querySelector(".lightbox-close");
    const prev = lightbox.querySelector(".lightbox-prev");
    const next = lightbox.querySelector(".lightbox-next");

    if (image && close && prev && next) {
      let currentIndex = 0;

      function showImage(index) {
        currentIndex = (index + galleryImages.length) % galleryImages.length;

        image.src = galleryImages[currentIndex].src;
        image.alt = galleryImages[currentIndex].alt || "Gallery image";
      }

      function openLightbox(index) {
        showImage(index);
        lightbox.classList.add("is-open");
        lightbox.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
      }

      function closeLightbox() {
        lightbox.classList.remove("is-open");
        lightbox.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
      }

      galleryImages.forEach((img, index) => {
        img.addEventListener("click", () => openLightbox(index));
      });

      close.addEventListener("click", closeLightbox);
      prev.addEventListener("click", () => showImage(currentIndex - 1));
      next.addEventListener("click", () => showImage(currentIndex + 1));

      lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) closeLightbox();
      });

      document.addEventListener("keydown", (event) => {
        if (!lightbox.classList.contains("is-open")) return;

        if (event.key === "Escape") closeLightbox();
        if (event.key === "ArrowLeft") showImage(currentIndex - 1);
        if (event.key === "ArrowRight") showImage(currentIndex + 1);
      });
    }
  }

  // ====================== COMMON HELPERS ======================

  function formatTime(seconds) {
    seconds = Number.isFinite(seconds) ? seconds : 0;

    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  // ====================== HEADER PLAYER ======================
  // Header-ի player-ը առանձին է Playlist-ից։

  const headerPlayer = document.getElementById("header-player");
  const headerPlayBtn = document.getElementById("header-play-btn");
  const headerWaveform = document.getElementById("header-waveform");
  const headerCanvas = document.getElementById("header-audio-visualizer");
  const headerTime = document.getElementById("header-time");

  let headerWavesurfer = null;

  if (
    headerPlayer &&
    headerPlayBtn &&
    headerWaveform &&
    headerCanvas &&
    headerTime &&
    typeof WaveSurfer !== "undefined"
  ) {
    const headerCtx = headerCanvas.getContext("2d");

    if (headerCtx) {
      headerWavesurfer = WaveSurfer.create({
        container: headerWaveform,
        height: 30,
        waveColor: "#c5c5ca",
        progressColor: "#7A66CC",
        cursorColor: "#B9A8FF",
        cursorWidth: 2,
        barWidth: 2,
        barGap: 2,
        barRadius: 2,
        normalize: true,
        interact: false,
      });

      window.headerWavesurfer = headerWavesurfer;

      let headerAudioContext = null;
      let headerAnalyser = null;
      let headerFrequencyData = null;
      let headerSource = null;
      let headerAnimationId = null;
      let headerBars = [];
      let headerDragging = false;

      function updateHeaderTime() {
        headerTime.textContent =
          `${formatTime(headerWavesurfer.getCurrentTime())}-` +
          `${formatTime(headerWavesurfer.getDuration())}`;
      }

      function resizeHeaderCanvas() {
        const rect = headerCanvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        headerCanvas.width = Math.round(rect.width * dpr);
        headerCanvas.height = Math.round(rect.height * dpr);

        headerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawHeaderBars();
      }

      function drawHeaderBars() {
        const width = headerCanvas.clientWidth;
        const height = headerCanvas.clientHeight;

        if (!width || !height) return;

        const duration = headerWavesurfer.getDuration();
        const progress =
          duration > 0 ? headerWavesurfer.getCurrentTime() / duration : 0;

        headerCtx.clearRect(0, 0, width, height);

        // Սկզբնական սովորական սպիտակ գիծ
        if (headerBars.length === 0) {
          const y = Math.round(height / 2);
          headerCtx.fillStyle = "#ffffff";
          headerCtx.fillRect(0, y - 1, width, 2);
        } else {
          // Երգի ընթացքում՝ ձայնային ալիքներ
          const count = headerBars.length;
          const gap = 2;
          const barWidth = Math.max(1, (width - gap * (count - 1)) / count);

          for (let i = 0; i < count; i++) {
            const x = i * (barWidth + gap);
            const barHeight = headerBars[i];
            const y = (height - barHeight) / 2;

            headerCtx.fillStyle =
              (x + barWidth / 2) / width <= progress ? "#7A66CC" : "#ffffff";

            headerCtx.fillRect(x, y, barWidth, barHeight);
          }
        }

        // Կուրսորը պետք է համընկնի նվագարկման դիրքին
        const markerX = Math.max(0, Math.min(width - 2, progress * width));

        headerCtx.fillStyle = "#B9A8FF";
        headerCtx.fillRect(markerX, 0, 2, height);
      }

      function setupHeaderVisualizer() {
        if (headerAnalyser) return;

        const AudioContextClass =
          window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        try {
          headerAudioContext = new AudioContextClass();
          headerAnalyser = headerAudioContext.createAnalyser();

          headerAnalyser.fftSize = 256;
          headerAnalyser.smoothingTimeConstant = 0.8;

          headerSource = headerAudioContext.createMediaElementSource(
            headerWavesurfer.getMediaElement(),
          );

          headerSource.connect(headerAnalyser);
          headerAnalyser.connect(headerAudioContext.destination);

          headerFrequencyData = new Uint8Array(
            headerAnalyser.frequencyBinCount,
          );
        } catch (error) {
          console.error("Header visualizer error:", error);
          headerAnalyser = null;
          headerFrequencyData = null;
        }
      }

      function animateHeader() {
        if (!headerWavesurfer.isPlaying()) {
          headerAnimationId = null;
          drawHeaderBars();
          return;
        }

        if (headerAnalyser && headerFrequencyData) {
          headerAnalyser.getByteFrequencyData(headerFrequencyData);

          const count = Math.max(1, Math.floor(headerCanvas.clientWidth / 5));

          const height = headerCanvas.clientHeight;

          headerBars = Array.from({ length: count }, (_, i) => {
            const dataIndex = Math.floor(
              (i / count) * headerFrequencyData.length,
            );

            return Math.max(
              3,
              (headerFrequencyData[dataIndex] / 255) * (height - 4),
            );
          });
        }

        drawHeaderBars();
        headerAnimationId = requestAnimationFrame(animateHeader);
      }

      function startHeaderAnimation() {
        if (headerAnimationId !== null) return;
        headerAnimationId = requestAnimationFrame(animateHeader);
      }

      function stopHeaderAnimation() {
        if (headerAnimationId !== null) {
          cancelAnimationFrame(headerAnimationId);
          headerAnimationId = null;
        }

        drawHeaderBars();
      }

      headerPlayBtn.addEventListener("click", async () => {
        try {
          // Եթե Playlist-ը նվագում է, կանգնեցնում ենք։
          window.playlistWavesurfer?.pause();

          setupHeaderVisualizer();

          if (headerAudioContext?.state === "suspended") {
            await headerAudioContext.resume();
          }

          await headerWavesurfer.playPause();
        } catch (error) {
          console.error("Header player error:", error);
        }
      });

      function seekHeader(event) {
        const rect = headerCanvas.getBoundingClientRect();
        const duration = headerWavesurfer.getDuration();

        if (!duration || rect.width <= 0) return;

        const progress = Math.max(
          0,
          Math.min(1, (event.clientX - rect.left) / rect.width),
        );

        headerWavesurfer.seekTo(progress);

        updateHeaderTime();
        drawHeaderBars();
      }
      headerPlayBtn;

      headerCanvas.style.pointerEvents = "auto";
      headerCanvas.style.cursor = "pointer";
      headerCanvas.style.touchAction = "none";

      headerCanvas.addEventListener("pointerdown", (event) => {
        if (!headerWavesurfer.getDuration()) return;

        headerDragging = true;
        headerCanvas.setPointerCapture(event.pointerId);
        seekHeader(event);
      });

      headerCanvas.addEventListener("pointermove", (event) => {
        if (headerDragging) {
          seekHeader(event);
        }
      });

      headerCanvas.addEventListener("pointerup", () => {
        headerDragging = false;
      });

      headerCanvas.addEventListener("pointercancel", () => {
        headerDragging = false;
      });

      headerWavesurfer.on("play", () => {
        headerPlayBtn.innerHTML = '<span class="pause-icon"></span>';
        headerPlayBtn.setAttribute("aria-label", "Pause");
        startHeaderAnimation();
      });

      headerWavesurfer.on("pause", () => {
        headerPlayBtn.innerHTML = '<span class="play-icon"></span>';
        headerPlayBtn.setAttribute("aria-label", "Play");
        stopHeaderAnimation();
      });

      headerWavesurfer.on("ready", () => {
        updateHeaderTime();
        resizeHeaderCanvas();
      });

      headerWavesurfer.on("timeupdate", () => {
        updateHeaderTime();
        if (!headerWavesurfer.isPlaying()) drawHeaderBars();
      });

      headerWavesurfer.on("seeking", updateHeaderTime);

      headerWavesurfer.on("finish", () => {
        stopHeaderAnimation();
        headerPlayBtn.innerHTML = '<span class="play-icon"></span>';
        headerPlayBtn.setAttribute("aria-label", "Play");
      });

      window.addEventListener("resize", resizeHeaderCanvas);

      resizeHeaderCanvas();
      headerWavesurfer.load("audio/3LAU-How You Love Me.mp3");
    }
  }

  // ====================== PLAYLIST ELEMENTS ======================
  const playlistPlayer = document.querySelector(
    ".section-playlist .playlist-player",
  );

  const waveformElement = document.getElementById("waveform");
  const visualizerCanvas = document.getElementById("audio-visualizer");

  const playlistPlayBtn = playlistPlayer?.querySelector(".play-btn");
  const playlistTime = playlistPlayer?.querySelector(".time");

  const trackItems = document.querySelectorAll(".playlist-block-music");

  const tracks = [
    "audio/3LAU-How You Love Me.mp3",
    "audio/Bright Lights & Kaleena Zanders & Kandy-War For Love.mp3",
    "audio/Pink Is Punk & Benny Benassi feat. Bright Lights - Ghost (Original Extended).mp3",
    "audio/Hardwell & Dyro feat. Bright Lights - Never Say Goodbye.mp3",
    "audio/Zeds Dead & Dirtyphonics feat. Bright Lights - Where Are You Now.mp3",
    "audio/Zedd - Follow You Down (ft. Bright Lights).mp3",
  ];

  // Header-ի կոդն արդեն աշխատում է։
  // Եթե Playlist-ի տարրերը չկան, միայն Playlist-ի սկզբնավորումն ենք բաց թողնում։

  if (
    !playlistPlayer ||
    !waveformElement ||
    !visualizerCanvas ||
    !playlistPlayBtn ||
    !playlistTime ||
    typeof WaveSurfer === "undefined"
  ) {
    return;
  }

  const ctx = visualizerCanvas.getContext("2d");

  if (!ctx) return;

  // ====================== PLAYLIST WAVESURFER ======================
  const wavesurfer = WaveSurfer.create({
    container: waveformElement,
    height: 30,
    waveColor: "#c5c5ca",
    progressColor: "#7A66CC",
    cursorColor: "#B9A8FF",
    cursorWidth: 2,
    barWidth: 2,
    barGap: 2,
    barRadius: 2,
    normalize: true,
    interact: false,
  });

  window.playlistWavesurfer = wavesurfer;

  // ====================== PLAYLIST VARIABLES ======================
  let currentTrack = 0;
  let audioContext = null;
  let analyser = null;
  let frequencyData = null;
  let audioSource = null;
  let visualizerInitialized = false;
  let visualizerAnimationId = null;
  let isDraggingSeek = false;
  let lastBarHeights = [];

  function updatePlaylistTime() {
    playlistTime.textContent =
      `${formatTime(wavesurfer.getCurrentTime())}-` +
      `${formatTime(wavesurfer.getDuration())}`;
  }

  function showPlaylistPlayButton() {
    playlistPlayBtn.innerHTML = '<span class="play-icon"></span>';
    playlistPlayBtn.setAttribute("aria-label", "Play");
  }

  function showPlaylistPauseButton() {
    playlistPlayBtn.innerHTML = '<span class="pause-icon"></span>';
    playlistPlayBtn.setAttribute("aria-label", "Pause");
  }

  // ====================== LOAD TRACK ======================
  async function loadTrack(index, autoplay = false) {
    if (index < 0 || index >= tracks.length) return;

    currentTrack = index;

    trackItems.forEach((item, itemIndex) => {
      item.classList.toggle("active", itemIndex === index);
    });

    showPlaylistPlayButton();
    playlistTime.textContent = "00:00-00:00";

    try {
      await wavesurfer.load(tracks[index]);
      updatePlaylistTime();

      if (autoplay) {
        await wavesurfer.play();
      }
    } catch (error) {
      console.error("Playlist track loading error:", error);
    }
  }

  // ====================== CANVAS SIZE ======================
  function resizeVisualizer() {
    const rect = visualizerCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    visualizerCanvas.width = Math.round(rect.width * dpr);
    visualizerCanvas.height = Math.round(rect.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawCurrentVisualizer();
  }

  // ====================== IDLE LINE ======================
  function drawIdleLine() {
    const width = visualizerCanvas.clientWidth;
    const height = visualizerCanvas.clientHeight;

    if (!width || !height) return;

    const duration = wavesurfer.getDuration();
    const current = wavesurfer.getCurrentTime();
    const progress = duration > 0 ? current / duration : 0;
    const centerY = height / 2;
    const markerX = Math.max(0, Math.min(width - 1, progress * width));

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#c5c5ca";
    ctx.fillRect(0, centerY - 1, width, 2);

    if (markerX > 0) {
      ctx.fillStyle = "#7A66CC";
      ctx.fillRect(0, centerY - 1, markerX, 2);
    }

    ctx.fillStyle = "#7A66CC";
    ctx.fillRect(
      Math.max(0, Math.min(width - 2, markerX - 1)),
      centerY - 9,
      2,
      18,
    );
  }

  // ====================== PLAYLIST AUDIO VISUALIZER ======================
  function setupAudioVisualizer() {
    if (analyser) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    try {
      audioContext = new AudioContextClass();
      analyser = audioContext.createAnalyser();

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      audioSource = audioContext.createMediaElementSource(
        wavesurfer.getMediaElement(),
      );

      audioSource.connect(analyser);
      analyser.connect(audioContext.destination);

      frequencyData = new Uint8Array(analyser.frequencyBinCount);
      visualizerInitialized = true;
    } catch (error) {
      console.error("Playlist visualizer error:", error);

      audioContext?.close().catch(() => {});

      audioContext = null;
      analyser = null;
      frequencyData = null;
      audioSource = null;
      visualizerInitialized = false;
    }
  }

  function drawCurrentVisualizer() {
    if (visualizerInitialized && lastBarHeights.length > 0) {
      drawWaveform();
    } else {
      drawIdleLine();
    }
  }

  function drawWaveform() {
    const width = visualizerCanvas.clientWidth;
    const height = visualizerCanvas.clientHeight;

    if (!width || !height || !lastBarHeights.length) return;

    ctx.clearRect(0, 0, width, height);

    const count = lastBarHeights.length;
    const gap = 3;
    const barWidth = (width - gap * (count - 1)) / count;

    const duration = wavesurfer.getDuration();
    const progress = duration > 0 ? wavesurfer.getCurrentTime() / duration : 0;

    for (let i = 0; i < count; i++) {
      const x = i * (barWidth + gap);
      const barHeight = lastBarHeights[i];
      const y = (height - barHeight) / 2;

      ctx.fillStyle =
        (x + barWidth / 2) / width <= progress ? "#7A66CC" : "#c5c5ca";

      ctx.fillRect(x, y, barWidth, barHeight);
    }

    const markerX = Math.max(0, Math.min(width - 1, progress * width));

    ctx.fillStyle = "#B9A8FF";
    ctx.fillRect(markerX - 1, 0, 2, height);
  }

  function drawVisualizer() {
    if (wavesurfer.isPlaying() && analyser && frequencyData) {
      analyser.getByteFrequencyData(frequencyData);

      const height = visualizerCanvas.clientHeight;
      const count = 36;

      lastBarHeights = Array.from({ length: count }, (_, index) => {
        const dataIndex = Math.floor((index / count) * frequencyData.length);

        return Math.max(3, (frequencyData[dataIndex] / 255) * (height - 4));
      });
    }

    drawCurrentVisualizer();
  }

  function startVisualizerLoop() {
    if (visualizerAnimationId !== null) return;

    function animate() {
      if (!wavesurfer.isPlaying()) {
        visualizerAnimationId = null;
        drawCurrentVisualizer();
        return;
      }

      drawVisualizer();
      visualizerAnimationId = requestAnimationFrame(animate);
    }

    visualizerAnimationId = requestAnimationFrame(animate);
  }

  function stopVisualizerLoop() {
    if (visualizerAnimationId !== null) {
      cancelAnimationFrame(visualizerAnimationId);
      visualizerAnimationId = null;
    }

    drawCurrentVisualizer();
  }

  // ====================== PLAYLIST PLAY / PAUSE ======================
  playlistPlayBtn.addEventListener("click", async () => {
    try {
      window.headerWavesurfer?.pause();

      setupAudioVisualizer();

      if (audioContext?.state === "suspended") {
        await audioContext.resume();
      }

      if (!wavesurfer.getDuration()) {
        await loadTrack(currentTrack, true);
        return;
      }

      await wavesurfer.playPause();
    } catch (error) {
      console.error("Playlist playback error:", error);
    }
  });

  wavesurfer.on("play", () => {
    showPlaylistPauseButton();
    startVisualizerLoop();
  });

  wavesurfer.on("pause", () => {
    showPlaylistPlayButton();
    stopVisualizerLoop();
  });

  wavesurfer.on("ready", () => {
    updatePlaylistTime();
    drawCurrentVisualizer();
  });

  wavesurfer.on("timeupdate", updatePlaylistTime);
  wavesurfer.on("seeking", updatePlaylistTime);

  wavesurfer.on("finish", async () => {
    if (currentTrack < tracks.length - 1) {
      await loadTrack(currentTrack + 1, true);
    } else {
      showPlaylistPlayButton();
      stopVisualizerLoop();
    }
  });

  // ====================== PLAYLIST SEEK / DRAG ======================
  function seekFromPointer(event) {
    const rect = visualizerCanvas.getBoundingClientRect();
    const duration = wavesurfer.getDuration();

    if (!duration || !rect.width) return;

    const progress = Math.max(
      0,
      Math.min(1, (event.clientX - rect.left) / rect.width),
    );

    wavesurfer.seekTo(progress);
    updatePlaylistTime();
    drawCurrentVisualizer();
  }

  visualizerCanvas.style.pointerEvents = "auto";
  visualizerCanvas.style.cursor = "pointer";
  visualizerCanvas.style.touchAction = "none";

  visualizerCanvas.addEventListener("pointerdown", (event) => {
    if (!wavesurfer.getDuration()) return;

    isDraggingSeek = true;
    visualizerCanvas.setPointerCapture(event.pointerId);
    seekFromPointer(event);
  });

  visualizerCanvas.addEventListener("pointermove", (event) => {
    if (isDraggingSeek) seekFromPointer(event);
  });

  visualizerCanvas.addEventListener("pointerup", () => {
    isDraggingSeek = false;
  });

  visualizerCanvas.addEventListener("pointercancel", () => {
    isDraggingSeek = false;
  });

  // ====================== PLAYLIST TRACK SELECTION ======================
  trackItems.forEach((item, index) => {
    const trackButton = item.querySelector(".track-info");

    if (!trackButton) return;

    trackButton.addEventListener("click", async () => {
      try {
        window.headerWavesurfer?.pause();

        setupAudioVisualizer();

        if (audioContext?.state === "suspended") {
          await audioContext.resume();
        }

        await loadTrack(index, true);
      } catch (error) {
        console.error("Track selection error:", error);
      }
    });
  });

  // ====================== INITIALIZE PLAYLIST ======================
  window.addEventListener("resize", resizeVisualizer);

  resizeVisualizer();
  drawIdleLine();

  loadTrack(0);
});

const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");

menuToggle.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("active");

  menuToggle.setAttribute("aria-expanded", isOpen);
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation" : "Open navigation",
  );
});

navMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  });
});