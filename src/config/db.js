const mongoose = require("mongoose");

let memoryServer = null;

/**
 * Connect to MongoDB.
 *
 * Zero-config by default: if MONGODB_URI is NOT set, we spin up an in-memory
 * MongoDB (mongodb-memory-server) so a learner can just `npm start` with no
 * database account, no Docker, nothing. Set MONGODB_URI to use a real
 * MongoDB / Atlas instance instead (data then persists).
 */
const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    let usingMemory = false;

    if (!uri) {
      // Lazy-require so the dependency is only loaded when actually needed.
      const { MongoMemoryServer } = require("mongodb-memory-server");
      console.log("ℹ️  No MONGODB_URI set — starting an in-memory MongoDB (zero-config mode)…");
      memoryServer = await MongoMemoryServer.create();
      uri = memoryServer.getUri();
      usingMemory = true;
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
    });

    console.log(
      usingMemory
        ? "✅ In-memory MongoDB ready (data resets when the server stops)"
        : `✅ MongoDB connected: ${conn.connection.host}`
    );

    mongoose.connection.on("error", (err) => {
      console.error(`❌ MongoDB runtime error: ${err.message}`);
    });
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
    });
    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected successfully");
    });

    return { conn, usingMemory };
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.error("Full error:", error);
    process.exit(1);
  }
};

const getConnectionStatus = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return {
    state: states[mongoose.connection.readyState] || "unknown",
    readyState: mongoose.connection.readyState,
    mode: memoryServer ? "in-memory" : "external",
  };
};

const isMemoryMode = () => !!memoryServer;

module.exports = { connectDB, getConnectionStatus, isMemoryMode };
