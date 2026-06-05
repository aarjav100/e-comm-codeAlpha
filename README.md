# Lumina Luxe - Boutique Premium E-Commerce Suite

Lumina Luxe is an ultra-premium, modern full-stack e-commerce boutique suite. It is designed with rich aesthetics, sleek dark modes, glassmorphism UI layouts, and a zero-compile-risk reliable transactional architecture.

---

## Workspace Structure

The project has been structured into dedicated client-side frontend and server-side backend components:

```
work/
│
├── backend/
│   ├── database/          # JSON-based Transactional DB Engine (Zero-compile-risk)
│   │   ├── db.js          # Core database operations and queue manager
│   │   ├── seed.js        # Seed file to restore clean catalog states
│   │   ├── products.json  # Curated high-fidelity catalog data
│   │   ├── users.json     # Encrypted user accounts data
│   │   └── orders.json    # Master customer purchase orders ledger
│   │
│   ├── routes/            # Express endpoint route definitions [Placeholder]
│   ├── controllers/       # Business logic and request controllers [Placeholder]
│   ├── models/            # Schema schemas and collection wrappers [Placeholder]
│   ├── middleware/        # Security and utility middlewares [Placeholder]
│   │
│   ├── server.js          # Core Express server & e-commerce REST APIs
│   ├── test_api.js        # Automated API test suite runner
│   ├── .env               # Active environmental configurations (gitignored)
│   ├── .env.example       # Environmental configurations template reference
│   ├── package.json       # Backend npm dependencies and scripts
│   └── node_modules/      # Relocated backend npm dependencies
│
├── frontend/
│   ├── css/               # High-fidelity custom premium design stylesheets
│   ├── images/            # High-resolution visual assets and photography
│   ├── js/                # Client controllers (app.js, api.js, components.js)
│   ├── templates/         # Interactive Figma mockup layout assets
│   ├── index.html         # Rich-aesthetic Single-Page Application (SPA) entry
│   └── package.json       # Dev script bindings
│
├── .gitignore             # Root revision control exclusions
├── README.md              # Project guide and structure instructions
└── package-lock.json      # Main lock file
```

---

## Getting Started

### 1. Configure the Environment
Ensure your local backend `.env` variables match your deployment database credentials. Create `backend/.env` using the `backend/.env.example` template:
```env
PORT=3000
JWT_SECRET=your-secret-key
NODE_ENV=development
MONGODB_URI=your-mongodb-connection-string
```

### 2. Install and Run the Server
From the root directory, navigate into `backend/` and start your development environment:
```bash
cd backend
npm install
npm run dev
```

### 3. Automated API Endpoints Tests
To verify all e-commerce transactions, inventory stock deductions, administrative controls, and security middlewares:
```bash
cd backend
npm run test:api
```
