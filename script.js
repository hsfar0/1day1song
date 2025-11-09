const galleryContainer = document.getElementById("galleryContainer");
const uploadModal = document.getElementById("uploadModal");
const addSongBtn = document.getElementById("addSongBtn");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const songForm = document.getElementById("songForm");
const scrollLeft = document.getElementById("scrollLeft");
const scrollRight = document.getElementById("scrollRight");
const galleryWrapper = document.getElementById("galleryWrapper");

const SERVER_URL = "https://oneday1song.onrender.com"; // Render API 서버

let songs = [];

// 서버에서 노래 목록 불러오기
async function loadSongs() {
  try {
    const token = localStorage.getItem("token");

    // 토큰이 없으면 로그인 페이지로
    if (!token) {
      alert("로그인이 필요합니다.");
      window.location.href = "login.html";
      return;
    }

    const res = await fetch(`${SERVER_URL}/images`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }

    const data = await res.json();

    songs = data.map((item) => ({
      id: item.filename,
      date: item.uploadDate.split("T")[0],
      title: item.title,
      artist: item.artist,
      albumCover: `${SERVER_URL}/uploads/${item.filename}`,
      url: item.url,
    }));

    renderGallery();
    checkScrollButtons();
  } catch (err) {
    console.error("서버에서 데이터를 불러오는 중 오류:", err);
  }
}

// 업로드 폼 열기
addSongBtn.addEventListener("click", () => {
  uploadModal.classList.add("active");
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  document.getElementById("songDate").value = local.toISOString().split("T")[0];
});

// 닫기 버튼
closeModal.addEventListener("click", () => uploadModal.classList.remove("active"));
cancelBtn.addEventListener("click", () => uploadModal.classList.remove("active"));
uploadModal.addEventListener("click", (e) => {
  if (e.target === uploadModal) uploadModal.classList.remove("active");
});

// 서버로 업로드
songForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("songTitle").value.trim();
  const artist = document.getElementById("songArtist").value.trim();
  const url = document.getElementById("songCover").value.trim();

  const token = localStorage.getItem("token");
  if (!token) {
    alert("로그인이 필요합니다.");
    window.location.href = "login.html";
    return;
  }

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.click();

  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("title", title);
    formData.append("artist", artist);
    formData.append("url", url);

    try {
      const res = await fetch(`${SERVER_URL}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("업로드 실패");

      await loadSongs();
      uploadModal.classList.remove("active");
      songForm.reset();
    } catch (err) {
      console.error("업로드 중 오류:", err);
      alert("업로드 실패. 서버를 확인하세요.");
    }
  };
});

// 스크롤
scrollLeft.addEventListener("click", () => {
  galleryContainer.scrollBy({ left: -400, behavior: "smooth" });
  checkScrollButtons();
});
scrollRight.addEventListener("click", () => {
  galleryContainer.scrollBy({ left: 400, behavior: "smooth" });
  checkScrollButtons();
});
galleryContainer.addEventListener("scroll", checkScrollButtons);

function checkScrollButtons() {
  const container = galleryContainer;
  const canScrollLeft = container.scrollLeft > 0;
  const canScrollRight =
    container.scrollLeft < container.scrollWidth - container.clientWidth - 10;
  scrollLeft.style.display = canScrollLeft ? "flex" : "none";
  scrollRight.style.display = canScrollRight ? "flex" : "none";
}

// 갤러리 렌더링
function renderGallery() {
  galleryContainer.innerHTML = songs
    .map(
      (song) => `
        <div class="song-card">
            <div class="album-cover" onclick="window.open('${song.url}', '_blank')">
                <img src="${song.albumCover}" alt="${song.title} album cover" onerror="this.src='default-cover.png'">
            </div>
            <div class="song-info">
                <div class="song-date">${formatDate(song.date)}</div>
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
            </div>
        </div>
      `
    )
    .join("");
}

// 로그인 버튼
document.getElementById("loginBtn").addEventListener("click", () => {
  window.location.href = "login.html";
});

function formatDate(dateStr) {
  // 입력된 문자열이 YYYY-MM-DD 형식일 때
  const [year, month, day] = dateStr.split("-");
  const date = new Date(year, month - 1, day); // 로컬 시간 기준 생성

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}


// 시작 시 서버에서 데이터 불러오기
loadSongs();
