// =======================
// STATE
// =======================

let songs = [];
let currentSongIndex = 0;
let shuffleMode = false;

// =======================
// DOM
// =======================

const songTitle = document.getElementById("songTitle");
const songArtist = document.getElementById("songArtist");

const player = document.getElementById("player");
const playlistElement = document.getElementById("playlist");

const toggleBtn = document.getElementById("playToggle");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");

const progress = document.getElementById("progress");
const currentTimeEl = document.getElementById("currentTime");
const totalTimeEl = document.getElementById("totalTime");

const loopBtn = document.getElementById("loopBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const downloadBtn = document.getElementById("downloadBtn");
const linkBtn = document.getElementById("linkBtn");

// =======================
// HELPERS
// =======================

function formatTime(seconds) {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2,"0")}`;
}

function savePlayerState() {
  localStorage.setItem("playerState", JSON.stringify({
    index: currentSongIndex,
    time: player.currentTime,
    shuffle: shuffleMode,
    loop: player.loop
  }));
}

function loadPlayerState() {
  const saved = JSON.parse(localStorage.getItem("playerState"));
  if (!saved) return 0;

  currentSongIndex = saved.index ?? 0;
  shuffleMode = saved.shuffle ?? false;
  player.loop = saved.loop ?? false;

  shuffleBtn.classList.toggle("active", shuffleMode);
  loopBtn.classList.toggle("active", player.loop);

  return saved.time ?? 0;
}

// =======================
// LOAD SONGS
// =======================

async function loadSongs() {
  const res = await fetch("songs.json");
  return await res.json();
}

// =======================
// PLAYER LOGIC
// =======================

function loadSong(song) {

  songTitle.textContent = song.title;
  songArtist.textContent = "By " + song.artist;

  player.src = song.file;

  renderPlaylist();
}

function playSong() { player.play(); }
function pauseSong() { player.pause(); }

function togglePlay() {
  player.paused ? playSong() : pauseSong();
}

function nextSong() {

  if (shuffleMode) {
    currentSongIndex = Math.floor(Math.random() * songs.length);
  } else {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
  }

  loadSong(songs[currentSongIndex]);
  playSong();
}

function prevSong() {

  currentSongIndex--;

  if (currentSongIndex < 0) {
    currentSongIndex = songs.length - 1;
  }

  loadSong(songs[currentSongIndex]);
  playSong();
}

// =======================
// PLAYLIST
// =======================

function renderPlaylist() {

  playlistElement.innerHTML = "";

  songs.forEach((song, index) => {

    const li = document.createElement("li");

    li.textContent = `${song.title} - ${song.artist}`;

    if (index === currentSongIndex) {
      li.classList.add("active");
    }

    li.onclick = () => {
      currentSongIndex = index;
      loadSong(song);
      playSong();
    };

    playlistElement.appendChild(li);
  });
}

// =======================
// AUDIO EVENTS
// =======================

player.addEventListener("play", () => {
  toggleBtn.textContent = "⏸️";
});

player.addEventListener("pause", () => {
  toggleBtn.textContent = "▶️";
  savePlayerState();
});

player.addEventListener("ended", nextSong);

player.addEventListener("loadedmetadata", () => {
  totalTimeEl.textContent = formatTime(player.duration);
});

player.addEventListener("timeupdate", () => {

  if (!player.duration) return;

  progress.value = (player.currentTime / player.duration) * 100;

  currentTimeEl.textContent = formatTime(player.currentTime);

  savePlayerState();
});

progress.addEventListener("input", () => {
  player.currentTime = (progress.value / 100) * player.duration;
});

// =======================
// EXTRA BUTTONS
// =======================

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

    const a = document.createElement("a");
    a.href = song.link;
    a.target = "_blank";
    a.rel = "noopener noreferrer"
    a.click();
};

// =======================
// BUTTON EVENTS
// =======================

toggleBtn.onclick = togglePlay;
nextBtn.onclick = nextSong;
prevBtn.onclick = prevSong;

// =======================
// INIT
// =======================

async function init() {

  songs = await loadSongs();

  const savedTime = loadPlayerState();

  loadSong(songs[currentSongIndex]);

  player.addEventListener("loadedmetadata", () => {

    if (savedTime) {
      player.currentTime = savedTime;
    }

  }, { once:true });
}

init();
