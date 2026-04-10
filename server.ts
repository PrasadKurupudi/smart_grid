import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Database from 'better-sqlite3';
import { z } from 'zod';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(express.json());

// Database Setup
const db = new Database('grid_security.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    grid_zone TEXT,
    sensor_id TEXT,
    value REAL,
    is_flagged BOOLEAN,
    attack_type TEXT
  );
  
  CREATE TABLE IF NOT EXISTS detections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    attack_type TEXT,
    confidence REAL,
    model_id INTEGER,
    severity TEXT,
    measurement_ids TEXT
  );
  
  CREATE TABLE IF NOT EXISTS grid_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    zone TEXT,
    node_type TEXT CHECK(node_type IN ('generator', 'bus', 'line', 'substation')),
    latitude REAL,
    longitude REAL
  );
  
  CREATE TABLE IF NOT EXISTS attack_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time TEXT,
    end_time TEXT,
    attack_type TEXT,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT,
    description TEXT
  );
  
  CREATE TABLE IF NOT EXISTS ml_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    version TEXT,
    algorithm TEXT,
    f1_score REAL,
    precision REAL,
    recall REAL,
    created_at TEXT,
    is_active BOOLEAN
  );
  
  CREATE TABLE IF NOT EXISTS scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    attack_type TEXT,
    config TEXT,
    created_by TEXT,
    created_at TEXT
  );
  
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    hashed_password TEXT,
    role TEXT CHECK(role IN ('admin', 'analyst', 'viewer')),
    created_at TEXT,
    last_login TEXT
  );
`);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Detect endpoint
const MeasurementVectorSchema = z.object({
  bus_voltages: z.array(z.number()),
  phase_angles: z.array(z.number()),
  line_flows: z.array(z.number()),
  nodal_injections: z.array(z.number()),
  pmu_timestamps: z.array(z.number()),
  grid_zone: z.string(),
  measurement_type: z.enum(['DC', 'AC', 'PMU'])
});

app.post('/api/v1/detect', (req, res) => {
  try {
    const vector = MeasurementVectorSchema.parse(req.body);
    // Mock ML detection
    const isAttack = Math.random() > 0.8;
    const attackTypes = ['FDI', 'AGC', 'GPS_SPOOFING', 'TOPOLOGY', 'DOS'];
    const attackType = isAttack ? attackTypes[Math.floor(Math.random() * attackTypes.length)] : null;
    const severityLevels = ['low', 'medium', 'high', 'critical'];
    
    const result = {
      attack_type: attackType,
      confidence: isAttack ? 0.75 + Math.random() * 0.24 : 0.1 + Math.random() * 0.3,
      severity: isAttack ? severityLevels[Math.floor(Math.random() * severityLevels.length)] : 'low',
      explanation: {
        feature_1: Math.random(),
        feature_2: Math.random(),
        feature_3: Math.random()
      },
      is_attack: isAttack
    };
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input' });
  }
});

app.get('/api/v1/detections', (req, res) => {
  const stmt = db.prepare('SELECT * FROM detections ORDER BY timestamp DESC LIMIT 50');
  res.json(stmt.all());
});

app.get('/api/v1/models', (req, res) => {
  const stmt = db.prepare('SELECT * FROM ml_models');
  res.json(stmt.all());
});

// WebSocket Simulation
const ZONES = Array.from({ length: 10 }, (_, i) => `zone_${i + 1}`);
const ATTACK_TYPES = ['FDI', 'AGC', 'GPS_SPOOFING', 'TOPOLOGY', 'DOS'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];

setInterval(() => {
  const timestamp = new Date().toISOString();
  
  // Emit measurements (reduced frequency)
  ZONES.forEach(zone => {
    const value = 0.95 + Math.random() * 0.1; // 0.95 - 1.05
    io.emit('measurement:new', {
      sensor_id: `sensor_${zone}`,
      value,
      timestamp,
      is_flagged: false
    });
  });
  
  // 3% chance of attack alert (reduced from 5%)
  if (Math.random() < 0.03) {
    const attack_type = ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];
    const severity = SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)];
    const zone = ZONES[Math.floor(Math.random() * ZONES.length)];
    
    io.emit('detection:alert', {
      attack_type,
      confidence: 0.75 + Math.random() * 0.24,
      zone,
      severity,
      timestamp
    });
    
    // Save to DB
    db.prepare(`
      INSERT INTO detections (timestamp, attack_type, confidence, model_id, severity, measurement_ids)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(timestamp, attack_type, 0.85, 1, severity, '[]');
  }
}, 3000); // Increased from 2s to 3s

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
