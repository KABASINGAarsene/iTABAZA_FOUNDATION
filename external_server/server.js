const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Serve static files from the current external_server directory first, then fallback to Frontend
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, '../Frontend')));

// Route for the doctor dashboard
app.get('/doctor-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'doctor-dashboard.html'));
});

// Default route redirects to doctor dashboard
app.get('/', (req, res) => {
  res.redirect('/doctor-dashboard.html');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Doctor Dashboard Server running at http://0.0.0.0:${port}`);
  console.log(`Doctor Dashboard URL: http://0.0.0.0:${port}/doctor-dashboard.html`);
});
