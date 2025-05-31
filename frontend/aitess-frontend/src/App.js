import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [tpfFile, setTpfFile] = useState(null);
  const terminalRef = useRef(null);

  useEffect(() => {
    socket.on("client-status", (msg) => appendOutput(msg));
    socket.on("terminal-output", (msg) => appendOutput(msg));

    return () => {
      socket.off("client-status");
      socket.off("terminal-output");
    };
  }, []);

  const appendOutput = (msg) => {
    setOutput((prev) => prev + msg);
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 50);
  };

  const handleInputChange = (e) => setInput(e.target.value);

  const sendCommands = () => {
    const lines = input
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) return;

    lines.forEach((line) => {
      socket.emit("send-command", line);
    });

    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.shiftKey || e.ctrlKey)) {
      setInput((prev) => prev + "\n");
    } else if (e.key === "Enter") {
      e.preventDefault();
      sendCommands();
    }
  };

  const handleStart = () => socket.emit("start-python");
  const handleStop = () => socket.emit("stop-python");

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setTpfFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!tpfFile) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", tpfFile);

    try {
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        appendOutput(`✅ Uploaded ${data.filename}\n`);
        socket.emit("send-command", `@uploads/${data.filename}`);
      } else {
        appendOutput("❌ Upload failed\n");
      }
    } catch (err) {
      appendOutput("❌ Upload error\n");
    } finally {
      setUploading(false);
      setTpfFile(null);
      document.getElementById("tpfInput").value = "";
    }
  };

  const handleDownloadRdf = () => {
    window.open("http://localhost:5000/download-rdf", "_blank");
  };

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "monospace",
        maxWidth: 800,
        margin: "auto",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 30 }}>
        🧪 Test Simulator
      </h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
        <button onClick={handleStart} style={btnStyle}>
          ▶️ Start
        </button>
        <button
          onClick={handleStop}
          style={{ ...btnStyle, background: "#d9534f" }}
        >
          ⏹️ Stop
        </button>
        <button
          onClick={handleDownloadRdf}
          style={{ ...btnStyle, marginLeft: "auto" }}
        >
          📥 Download .rdf
        </button>
      </div>

      <div
        ref={terminalRef}
        style={{
          width: "100%",
          height: 300,
          background: "#111",
          color: "#0f0",
          padding: 10,
          marginBottom: 15,
          overflowY: "auto",
          whiteSpace: "pre-wrap",
          borderRadius: 5,
          border: "1px solid #333",
          fontSize: 14,
        }}
      >
        {output}
      </div>

      <textarea
        placeholder="🔹 Type command(s) here. Press Enter to run. Shift+Enter for newline."
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        rows={4}
        style={{
          width: "100%",
          padding: 10,
          fontSize: 15,
          border: "1px solid #ccc",
          borderRadius: 5,
          marginBottom: 15,
          fontFamily: "monospace",
        }}
      />

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          id="tpfInput"
          type="file"
          accept=".tpf"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <button
          onClick={handleUpload}
          disabled={!tpfFile || uploading}
          style={{
            ...btnStyle,
            padding: "6px 14px",
            background: uploading ? "#999" : "#0275d8",
          }}
        >
          {uploading ? "Uploading..." : "Upload .tpf"}
        </button>
        <span style={{ fontSize: 13, color: "#555" }}>
          ⬆️ Upload a `.tpf` file to run batch input.
        </span>
      </div>

      <p style={{ fontSize: 13, color: "#888", marginTop: 20 }}>
        💡 Type `save` and press Enter to generate and download the latest
        `.rdf` result.
      </p>
    </div>
  );
}

const btnStyle = {
  background: "#5cb85c",
  color: "#fff",
  border: "none",
  padding: "6px 12px",
  fontSize: 14,
  borderRadius: 4,
  cursor: "pointer",
};
