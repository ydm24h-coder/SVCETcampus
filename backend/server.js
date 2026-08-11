const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

const setupExecutionService = require('./sockets/executionService');
setupExecutionService(io);

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/execute', require('./routes/executeRoutes'));
app.use('/api/evaluate', require('./routes/evaluateRoutes'));
app.use('/api/analyze', require('./routes/analyzeRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running' });
});

const startServer = async () => {
  try {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Server startup error:', error);
  }
};

startServer();
