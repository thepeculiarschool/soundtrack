// ================================================================
// STATE
// ================================================================

let songs         = [];
let filteredSongs = [];
let currentSongIndex = 0;
let shuffleMode   = false;

// ================================================================
// DOM
// ================================================================

const songTitle       = document.getElementById("songTitle");
const songArtist      = document.getElementById("songArtist");
const songDescription = document.getElementById("songDescription");

const player          = document.getElementById("player");
const playlistEl      = document.getElementById("playlist");
const noResults       = document.getElementById("noResults");

const toggleBtn       = document.getElementById("playToggle");
const nextBtn         = document.getElementById("nextBtn");
const prevBtn         = document.getElementById("prevBtn");
const loopBtn         = document.getElementById("loopBtn");
const shuffleBtn      = document.getElementById("shuffleBtn");
const downloadBtn     = document.getElementById("downloadBtn");
const linkBtn         = document.getElementById("linkBtn");

const progressEl      = document.getElementById("progress");
const currentTimeEl   = document.getElementById("currentTime");
const totalTimeEl     = document.getElementById("totalTime");

const searchEl        = document.getElementById("search");
const searchClear     = document.getElementById("searchClear");

const stylesheet      = document.getElementById("stylesheet");
const themeToggle     = document.getElementById("themeToggle");
const themeDropdown   = document.getElementById("themeDropdown");
const dyslexiaToggle  = document.getElementById("dyslexiaToggle");

// ================================================================
// HELPERS
// ================================================================

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function saveState() {
  localStorage.setItem("tps_player", JSON.stringify({
    index:   currentSongIndex,
    time:    player.currentTime,
    shuffle: shuffleMode,
    loop:    player.loop,
  }));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("tps_player"));
    if (!saved) return 0;
    currentSongIndex = Math.min(saved.index ?? 0, songs.length - 1);
    shuffleMode      = saved.shuffle ?? false;
    player.loop      = saved.loop    ?? false;
    shuffleBtn.classList.toggle("on", shuffleMode);
    loopBtn.classList.toggle("on",    player.loop);
    return saved.time ?? 0;
  } catch { return 0; }
}

// ================================================================
// THEME
// ================================================================

const THEMES = {
  book:  "styles/book.css",
  void:  "styles/void.css",
  magic: "styles/magic.css",
};

function applyTheme(name) {
  if (!THEMES[name]) name = "book";
  stylesheet.href = THEMES[name];
  localStorage.setItem("tps_theme", name);
  document.querySelectorAll(".theme-dropdown li").forEach(li => {
    li.classList.toggle("active-theme", li.dataset.theme === name);
  });
}

themeToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  themeDropdown.classList.toggle("open");
});

document.addEventListener("click", () => {
  themeDropdown.classList.remove("open");
});

themeDropdown.addEventListener("click", (e) => {
  const li = e.target.closest("li[data-theme]");
  if (!li) return;
  applyTheme(li.dataset.theme);
  themeDropdown.classList.remove("open");
});

// ================================================================
// DYSLEXIA MODE
// ================================================================

function isDyslexia() { return localStorage.getItem("tps_dyslexia") === "true"; }

function applyDyslexia(on) {
  document.body.classList.toggle("dyslexia", on);
  localStorage.setItem("tps_dyslexia", String(on));
  dyslexiaToggle.classList.toggle("on", on);
  dyslexiaToggle.title = on ? "Disable dyslexia-friendly font" : "Enable dyslexia-friendly font";
}

dyslexiaToggle.addEventListener("click", () => {
  applyDyslexia(!isDyslexia());
});

// ================================================================
// PLAYER CORE
// ================================================================

function loadSong(song, resumeTime = 0) {
  songTitle.textContent       = song.title;
  songArtist.textContent      = "By " + song.artist;
  songDescription.textContent = song.description ?? "";
  player.src                  = song.file;
  if (resumeTime) {
    player.addEventListener("loadedmetadata", () => {
      player.currentTime = resumeTime;
    }, { once: true });
  }
  renderPlaylist();
}

function playSong()  { player.play().catch(() => {}); }
function pauseSong() { player.pause(); }
function togglePlay() { player.paused ? playSong() : pauseSong(); }

function nextSong() {
  if (shuffleMode) {
    let next;
    do { next = Math.floor(Math.random() * songs.length); }
    while (songs.length > 1 && next === currentSongIndex);
    currentSongIndex = next;
  } else {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
  }
  loadSong(songs[currentSongIndex]);
  playSong();
}

function prevSong() {
  if (player.currentTime > 3) { player.currentTime = 0; return; }
  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  loadSong(songs[currentSongIndex]);
  playSong();
}

// ================================================================
// PLAYLIST RENDER
// ================================================================

function renderPlaylist() {
  const query = searchEl.value.trim().toLowerCase();
  filteredSongs = query
    ? songs.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.artist.toLowerCase().includes(query))
    : [...songs];

  playlistEl.innerHTML = "";
  noResults.hidden = filteredSongs.length > 0;

  filteredSongs.forEach((song) => {
    const realIndex = songs.indexOf(song);
    const li = document.createElement("li");
    li.className = realIndex === currentSongIndex ? "active" : "";
    li.innerHTML = `
      <span class="pl-title">${song.title}</span>
      <span class="pl-artist">${song.artist}</span>
    `;
    li.addEventListener("click", () => {
      currentSongIndex = realIndex;
      loadSong(song);
      playSong();
    });
    playlistEl.appendChild(li);
  });
}

// ================================================================
// SEARCH
// ================================================================

searchEl.addEventListener("input", () => {
  searchClear.hidden = searchEl.value === "";
  renderPlaylist();
});

searchClear.addEventListener("click", () => {
  searchEl.value = "";
  searchClear.hidden = true;
  renderPlaylist();
  searchEl.focus();
});

// ================================================================
// AUDIO EVENTS
// ================================================================

player.addEventListener("play", () => {
  toggleBtn.textContent = "⏸️";
  toggleBtn.classList.add("on");
});

player.addEventListener("pause", () => {
  toggleBtn.textContent = "▶️";
  toggleBtn.classList.remove("on");
  saveState();
});

player.addEventListener("ended", nextSong);

player.addEventListener("loadedmetadata", () => {
  totalTimeEl.textContent = formatTime(player.duration);
});

player.addEventListener("timeupdate", () => {
  if (!player.duration) return;
  progressEl.value = (player.currentTime / player.duration) * 100;
  currentTimeEl.textContent = formatTime(player.currentTime);
  saveState();
});

progressEl.addEventListener("input", () => {
  player.currentTime = (progressEl.value / 100) * player.duration;
});

// ================================================================
// BUTTON EVENTS
// ================================================================

toggleBtn.onclick   = togglePlay;
nextBtn.onclick     = nextSong;
prevBtn.onclick     = prevSong;

loopBtn.onclick = () => {
  player.loop = !player.loop;
  loopBtn.classList.toggle("on", player.loop);
};

shuffleBtn.onclick = () => {
  shuffleMode = !shuffleMode;
  shuffleBtn.classList.toggle("on", shuffleMode);
};

downloadBtn.onclick = () => {
  const song = songs[currentSongIndex];
  const a = document.createElement("a");
  a.href = song.file;
  a.download = song.title;
  a.click();
};

linkBtn.onclick = () => {
  const song = songs[currentSongIndex];
  if (!song.link || song.link === "https://www.youtube.com/") return;
  const a = document.createElement("a");
  a.href = song.link;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.click();
};

document.addEventListener("keydown", (e) => {
  if (e.target === searchEl) return;
  if (e.code === "Space")      { e.preventDefault(); togglePlay(); }
  if (e.code === "ArrowRight") { e.preventDefault(); nextSong();   }
  if (e.code === "ArrowLeft")  { e.preventDefault(); prevSong();   }
});

// ================================================================
// INIT
// ================================================================

async function init() {
  const res = await fetch("songs.json");
  songs = await res.json();

  // Restore all settings before first render
  applyTheme(localStorage.getItem("tps_theme") || "book");
  applyDyslexia(isDyslexia());

  const savedTime = loadState();
  loadSong(songs[currentSongIndex], savedTime);
}

init();
