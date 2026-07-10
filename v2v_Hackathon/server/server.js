require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const initSocket = require("./src/sockets");

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Create raw HTTP server so we can attach Socket.io to the same port
const server = http.createServer(app);

// Initialize Socket.io (used for live location broadcasting during SOS)
const io = initSocket(server);

// Make io accessible inside controllers via req.app.get("io")
app.set("io", io);

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});

// Safety net for unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
