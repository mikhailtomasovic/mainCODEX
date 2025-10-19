class CustomVideoPlayer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Core structure
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 800px;
          max-width: 100%;
          font-family: system-ui, sans-serif;
        }
        .player {
          position: relative;
        }
        video {
          width: 100%;
          border-radius: 8px;
          background: black;
        }
        .controls {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(0,0,0,0.6);
          padding: 10px;
          border-radius: 0 0 8px 8px;
          position: absolute;
          bottom: 0;
          width: 100%;
          box-sizing: border-box;
          backdrop-filter: blur(8px);
        }
        button, input[type=range] {
          cursor: pointer;
        }
        button {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          transition: transform 0.1s;
        }
        button:hover { transform: scale(1.2); }
        input[type=range] {
          flex: 1;
          accent-color: #09f;
        }
        .progress-container {
          position: relative;
          flex: 1;
        }
        .buffered {
          position: absolute;
          height: 4px;
          background: #444;
          width: 100%;
          top: 50%;
          transform: translateY(-50%);
          border-radius: 2px;
        }
        .buffer-fill {
          position: absolute;
          height: 4px;
          background: #666;
          width: 0%;
          top: 50%;
          transform: translateY(-50%);
          border-radius: 2px;
        }
        .thumb-preview {
          position: absolute;
          bottom: 40px;
          left: 0;
          background: rgba(0,0,0,0.8);
          color: #fff;
          font-size: 12px;
          padding: 4px 6px;
          border-radius: 4px;
          transform: translateX(-50%);
          display: none;
          pointer-events: none;
        }
      </style>

      <div class="player">
        <video id="video" preload="metadata"></video>
        <div class="controls">
          <button id="playpause">▶️</button>
          <div class="progress-container">
            <div class="buffered"></div>
            <div class="buffer-fill" id="buffer-fill"></div>
            <input id="progress" type="range" value="0" min="0" max="100">
            <div class="thumb-preview" id="thumb-preview">00:00</div>
          </div>
          <input id="volume" type="range" value="100" min="0" max="100" style="width:100px;">
          <button id="fullscreen">⛶</button>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    const video = this.shadowRoot.getElementById("video");
    const playpause = this.shadowRoot.getElementById("playpause");
    const progress = this.shadowRoot.getElementById("progress");
    const bufferFill = this.shadowRoot.getElementById("buffer-fill");
    const volume = this.shadowRoot.getElementById("volume");
    const fullscreen = this.shadowRoot.getElementById("fullscreen");
    const thumbPreview = this.shadowRoot.getElementById("thumb-preview");

    video.src = this.getAttribute("src") || "";

    // Play / Pause toggle
    const togglePlay = () => {
      if (video.paused) {
        video.play();
        playpause.textContent = "⏸️";
      } else {
        video.pause();
        playpause.textContent = "▶️";
      }
    };
    playpause.addEventListener("click", togglePlay);
    video.addEventListener("click", togglePlay);

    // Progress updates
    video.addEventListener("timeupdate", () => {
      progress.value = (video.currentTime / video.duration) * 100;
    });
    progress.addEventListener("input", () => {
      video.currentTime = (progress.value / 100) * video.duration;
    });

    // Buffered
    video.addEventListener("progress", () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferPercent = (bufferedEnd / video.duration) * 100;
        bufferFill.style.width = bufferPercent + "%";
      }
    });

    // Volume
    volume.addEventListener("input", () => {
      video.volume = volume.value / 100;
    });

    // Fullscreen
    fullscreen.addEventListener("click", () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        video.requestFullscreen();
      }
    });

    // Preview hover
    progress.addEventListener("mousemove", e => {
      const rect = progress.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const time = pos * video.duration;
      thumbPreview.style.left = e.clientX - rect.left + "px";
      thumbPreview.textContent = this.formatTime(time);
      thumbPreview.style.display = "block";
    });
    progress.addEventListener("mouseleave", () => thumbPreview.style.display = "none");

    // Keyboard shortcuts
    document.addEventListener("keydown", e => {
      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          video.currentTime += 5;
          break;
        case "ArrowLeft":
          video.currentTime -= 5;
          break;
        case "ArrowUp":
          video.volume = Math.min(video.volume + 0.1, 1);
          volume.value = video.volume * 100;
          break;
        case "ArrowDown":
          video.volume = Math.max(video.volume - 0.1, 0);
          volume.value = video.volume * 100;
          break;
        case "KeyF":
          fullscreen.click();
          break;
      }
    });
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }
}

customElements.define("custom-video-player", CustomVideoPlayer);
