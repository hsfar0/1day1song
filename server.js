// server.js
const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'dev-secret';
const SERVER_URL = "https://oneday1song.onrender.com";

app.get("/", (req, res) => {
  res.send("Server is alive! 🌐");
});

// 5분(300,000ms)마다 자기 자신에게 요청
setInterval(async () => {
  try {
    await axios.get(SELF_URL);
    console.log("Keep-alive ping sent ✅");
  } catch (err) {
    console.error("Keep-alive ping failed ❌", err.message);
  }
}, 300000);

app.listen(PORT, () => console.log(`✅ 서버 실행 중: ${PORT}`));
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🔹 데이터 파일들
const USERS_FILE = path.join(__dirname, "users.json");
const DATA_FILE = path.join(__dirname, "data.json");

// JSON 파일 초기화
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");

// Multer 설정 (이미지 업로드용)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// 📌 회원가입
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  // 유효성 검사
  if (!username || !password)
    return res.status(400).json({ message: "필수 항목이 누락되었습니다." });
  if (!/^[a-zA-Z0-9]+$/.test(username))
    return res.status(400).json({ message: "아이디는 영문+숫자만 가능합니다." });

  const users = JSON.parse(fs.readFileSync(USERS_FILE));
  const exists = users.find((u) => u.username === username);
  if (exists) return res.status(400).json({ message: "이미 존재하는 아이디입니다." });

  const hashed = await bcrypt.hash(password, 10);
  users.push({ username, password: hashed });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  res.json({ message: "회원가입 성공" });
});

// 📌 로그인
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(USERS_FILE));
  const user = users.find((u) => u.username === username);
  if (!user) return res.status(400).json({ message: "존재하지 않는 아이디입니다." });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "비밀번호가 틀렸습니다." });

  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "2h" });
  res.json({ token });
});

// 📌 인증 미들웨어
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "로그인이 필요합니다." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }
}

// 📌 이미지 업로드 (로그인한 유저만)
app.post("/upload", authMiddleware, upload.single("image"), (req, res) => {
  const { title, artist, url } = req.body;
  const newImage = {
    user: req.user.username,
    filename: req.file.filename,
    title,
    artist,
    url,
    uploadDate: new Date().toISOString(),
  };

  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  data.push(newImage);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

  res.json({ message: "업로드 성공", file: newImage });
});

// 📌 유저별 이미지 불러오기
app.get("/images", authMiddleware, (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  const userData = data.filter((d) => d.user === req.user.username);
  res.json(userData);
});

app.listen(PORT, () =>
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`)
);
