const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { spawn } = require("child_process");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000", // your frontend origin
    methods: ["GET", "POST"],
    credentials: true,
  })
);
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.use(cors());
const UPLOADS_DIR = path.join(__dirname, "uploads");
const DOWNLOADS_DIR = path.join(__dirname, "downloads");

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR);

// Static file serving
app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/downloads", express.static(DOWNLOADS_DIR));

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// Upload endpoint
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  res.send({ message: "File uploaded", filename: req.file.originalname });
});

// Download endpoint for the generated RDF
app.get("/download-rdf", (req, res) => {
  const filePath = path.join(DOWNLOADS_DIR, "output.rdf");
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("No .rdf file generated yet.");
  }
  res.download(filePath);
});

let pythonProcess = null;

io.on("connection", (socket) => {
  console.log("✅ Client connected");
  socket.emit("client-status", "✅ Connected to server.");

  socket.on("start-python", () => {
    if (pythonProcess) {
      socket.emit("terminal-output", "⚠️ Python is already running.\n");
      return;
    }

    pythonProcess = spawn("python", [path.join(__dirname, "test.py")]);

    console.log("🚀 Python process started.");
    socket.emit("terminal-output", "✅ Python simulation started.\n");

    pythonProcess.stdout.on("data", (data) => {
      console.log("⬅️ PYTHON STDOUT:", data.toString().trim());
      socket.emit("terminal-output", data.toString());
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error("❌ PYTHON STDERR:", data.toString().trim());
      socket.emit("terminal-output", `❌ Error: ${data.toString()}`);
    });

    pythonProcess.on("close", () => {
      console.log("⛔ Python process closed.");
      socket.emit("terminal-output", "✅ Python simulation ended.\n");
      pythonProcess = null;
    });

    pythonProcess.stdin.setDefaultEncoding("utf-8");
  });

  socket.on("send-command", (cmd) => {
    console.log("📤 Command from client:", cmd);
    if (!pythonProcess) {
      socket.emit("terminal-output", "⚠️ Start the simulation first.\n");
      return;
    }

    if (pythonProcess.stdin.writable) {
      console.log("✅ Sending to Python stdin:", cmd);
      pythonProcess.stdin.write(cmd.trim() + "\n");
    } else {
      console.warn("🚫 Python stdin not writable.");
      socket.emit("terminal-output", "❌ Python is not accepting input.\n");
    }
  });

  socket.on("stop-python", () => {
    if (pythonProcess) {
      console.log("🛑 Stopping Python process.");
      pythonProcess.kill();
      pythonProcess = null;
      socket.emit("terminal-output", "⏹️ Python simulation stopped.\n");
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected.");
    if (pythonProcess) pythonProcess.kill();
    pythonProcess = null;
  });
});

server.listen(5000, () => {
  console.log("🚀 Server running at http://localhost:5000");
});
