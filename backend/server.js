require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// -----------------------------
// API routes
// -----------------------------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/income', require('./routes/income'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/investments', require('./routes/investments'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/seo', require('./routes/seo'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// -----------------------------
// Serve frontend static files
// -----------------------------
const frontendDir = path.join(__dirname, '..', 'frontend');

// Handle Linux case-sensitivity for /css, /js, and /fonts routes
app.use('/css', express.static(path.join(frontendDir, 'Css')));
app.use('/css', express.static(path.join(frontendDir, 'css')));
app.use('/js', express.static(path.join(frontendDir, 'JS')));
app.use('/js', express.static(path.join(frontendDir, 'js')));
app.use('/fonts', express.static(path.join(frontendDir, 'fonts')));
app.use('/fonts', express.static(path.join(frontendDir, 'Fonts')));
app.use(express.static(frontendDir));

// Fallback: serve specific html files or index.html (do not serve index.html for missing static assets)
app.get(/^\/(?!api).*/, (req, res) => {
  const reqPath = req.path.replace(/^\//, '');
  const filePath = path.join(frontendDir, reqPath);

  // If requesting a static asset file that doesn't exist, return 404 instead of SPA index.html fallback
  if (/\.(ttf|woff|woff2|eot|css|js|png|jpg|jpeg|gif|svg|ico)$/i.test(reqPath)) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath);
    }
    return res.status(404).send('Static asset not found');
  }

  if (reqPath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// -----------------------------
// Error handler
// -----------------------------
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    await db.init();
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Finora API running on port ${PORT}`);
      });
    }
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

startServer();

module.exports = app;
