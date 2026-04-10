
## Prerequisites

- Node.js (v18 or higher)
- Python 3.10 or 3.11
- pip (Python package manager)

## Project Structure

```
├── backend/          # FastAPI backend server
│   ├── app/         # Application code
│   ├── models/      # Trained ML models
│   └── data/        # Data storage
├── src/             # React frontend
└── server.ts        # Node.js development server
```

## Setup and Installation

### 1. Frontend Setup

Install Node.js dependencies:

```bash
npm install
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment:

- Windows (PowerShell): `.\venv\Scripts\Activate.ps1`
- Windows (CMD): `.\venv\Scripts\activate.bat`
- Linux/Mac: `source venv/bin/activate`

Install Python dependencies:

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and update the following variables:
- `SECRET_KEY`: Change to a secure random string (at least 32 characters)
- `DATABASE_URL`: SQLite database path (default: `sqlite:///./grid_security.db`)
- `CORS_ORIGINS`: Frontend URLs (default includes localhost:3000 and localhost:5173)

## Running the Application

### Start Backend Server

From the `backend` directory with virtual environment activated:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
v1
Or use the run script:

```bash
python run_server.py app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at: `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

### Start Frontend Development Server

From the root directory:

```bash
npm run dev
```

The frontend will be available at: `http://localhost:5173`

## Available Scripts

### Frontend

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run TypeScript type checking
- `npm run clean` - Remove build artifacts

### Backend

- Train ML models: `python -m app.services.train_models`
- Run tests: `pytest` (if tests are configured)

## Features

- Real-time grid monitoring dashboard
- ML-based anomaly detection (FDI, AGC attacks)
- Alert management system
- Data simulation and streaming
- PDF report generation
- Interactive network topology visualization

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Recharts for data visualization
- Socket.IO for real-time updates
- Zustand for state management

### Backend
- FastAPI for REST API
- SQLAlchemy for database ORM
- PyTorch for ML models
- Socket.IO for WebSocket communication
- JWT for authentication
- ReportLab for PDF generation