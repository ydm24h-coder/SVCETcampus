const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Supabase client (validates env vars on import)
require('./config/db');

const app = express();

const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/execute', require('./routes/executeRoutes'));
app.use('/api/evaluate', require('./routes/evaluateRoutes'));
app.use('/api/analyze', require('./routes/analyzeRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
