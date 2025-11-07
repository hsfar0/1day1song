const API = "https://oneday1song.onrender.com";

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submitBtn");
const toggleForm = document.getElementById("toggleForm");
const formTitle = document.getElementById("formTitle");

let isLogin = true;

toggleForm.addEventListener("click", () => {
  isLogin = !isLogin;
  formTitle.innerText = isLogin ? "로그인" : "회원가입";
  submitBtn.innerText = isLogin ? "로그인" : "회원가입";
  toggleForm.innerText = isLogin ? "회원가입하기" : "로그인하기";
});

submitBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) return alert("아이디와 비밀번호를 입력하세요.");

  const endpoint = isLogin ? "/login" : "/signup";

  try {
    const res = await fetch(API + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) return alert(data.message || "오류 발생");

    if (isLogin) {
      localStorage.setItem("token", data.token);
      alert("로그인 성공!");
      location.href = "index.html"; // 로그인 후 메인으로 이동
    } else {
      alert("회원가입 성공! 로그인 해주세요.");
      isLogin = true;
      formTitle.innerText = "로그인";
      submitBtn.innerText = "로그인";
      toggleForm.innerText = "회원가입하기";
    }
  } catch (err) {
    console.error(err);
    alert("서버와 연결할 수 없습니다.");
  }
});
