# Test Simulator Project

This project consists of three main components working together:

- **Python Test Simulator**: A command-line program that processes input commands, simulates test logic, and generates an RDF report.
- **Backend Server**: A Node.js Express server with Socket.IO that manages communication between frontend and the Python simulator. It handles file uploads, runs the Python process, and streams real-time output.
- **Frontend UI**: A React application providing a user-friendly interface to start/stop the simulator, send commands, upload `.tpf` files, and download the RDF report.

---

## How the Project Works Together

1. **Starting the System**  
   The backend server starts and listens for connections. The frontend connects to the backend via WebSockets (Socket.IO).

2. **User Interaction**  
   Users start the Python simulator through the frontend. The backend spawns the Python process and streams its output back to the frontend in real-time.

3. **Sending Commands**  
   Users enter commands or upload `.tpf` files via the frontend. Commands are sent over WebSocket to the backend, which forwards them to the Python simulator’s standard input.

4. **Processing in Python**  
   The Python simulator reads commands line-by-line, processes them, prints logs, and maintains a session buffer for the RDF report. The simulator supports special commands such as `save` to write the RDF file or `exit` to stop.

5. **RDF Report Handling**  
   The backend serves the generated RDF report file via an HTTP endpoint. Users can download the RDF file directly from the frontend UI.

6. **Stopping the Simulation**  
   The frontend allows stopping the Python process gracefully through the backend, which terminates the running Python simulation.

---

## Running the Whole System

- Start the backend server. This will listen for frontend connections and be ready to spawn the Python simulator process.
- Start the frontend React app. It connects to the backend and provides the interface.
- Use the frontend controls to start the simulation, send commands or upload `.tpf` files, and monitor live output.
- Use the frontend button to download the RDF report anytime after saving it within the simulation.
- Stop the simulation when done.

---

## Running Only the Python Simulator

The Python simulator is a standalone CLI program that reads commands from standard input and prints output to standard output. It maintains internal state and writes an RDF report file when requested.

- Launch the Python simulator directly from the command line.
- Enter commands manually or use `@filename.tpf` to load commands from a file.
- Use the command `save` to write the RDF report file.
- Use `exit` to quit the simulator.

This standalone mode allows quick testing and debugging without the backend or frontend.

---

This architecture cleanly separates concerns:

- The **frontend** handles user interaction,
- The **backend** handles process management and communication,
- The **Python simulator** performs the core logic and processing.

This allows easy development, testing, and maintenance.
