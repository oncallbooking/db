const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, "db.json");

// Ensure DB file exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeJsonSync(DB_FILE, {
    users: [],
    technicians: [],
    jobs: []
  }, { spaces: 2 });
}

function loadDB() {
  try {
    return fs.readJsonSync(DB_FILE);
  } catch (err) {
    console.error("Failed to read DB, recreating:", err);
    fs.writeJsonSync(DB_FILE, { users: [], technicians: [], jobs: [] }, { spaces: 2 });
    return { users: [], technicians: [], jobs: [] };
  }
}

function saveDB(db) {
  fs.writeJsonSync(DB_FILE, db, { spaces: 2 });
}

/* -------------------- AUTH: Users -------------------- */

// Register customer
app.post("/api/register", (req, res) => {
  const { name, email, password, role = "customer" } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Missing email or password" });

  let db = loadDB();
  if (db.users.find(u => u.email === email)) {
    return res.status(409).json({ message: "User already exists" });
  }

  const user = { id: Date.now(), name: name || email.split('@')[0], email, password, role, plan: null };
  db.users.push(user);
  saveDB(db);
  // do not return password in response
  const { password: _, ...userSafe } = user;
  res.json({ message: "Registered", user: userSafe });
});

// Login (customer or technician)
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Missing email or password" });

  let db = loadDB();
  const user = db.users.find(u => u.email === email && u.password === password) ||
               db.technicians.find(t => t.email === email && t.password === password);

  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const { password: _, ...userSafe } = user;
  res.json({ message: "Logged in", user: userSafe });
});

/* -------------------- TECHNICIANS -------------------- */

// Register technician
app.post("/api/technicians/register", (req, res) => {
  const { name, email, password, skills = [], phone } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Missing email or password" });

  let db = loadDB();
  if (db.technicians.find(t => t.email === email)) {
    return res.status(409).json({ message: "Technician already exists" });
  }

  const tech = { id: Date.now(), name: name || email.split('@')[0], email, password, skills, phone, rating: 0, bids: [] };
  db.technicians.push(tech);
  saveDB(db);
  const { password: _, ...techSafe } = tech;
  res.json({ message: "Technician registered", technician: techSafe });
});

// List technicians (optionally filter by skill or pincode)
app.get("/api/technicians", (req, res) => {
  const { skill } = req.query;
  let db = loadDB();
  let techs = db.technicians || [];
  if (skill) {
    techs = techs.filter(t => (t.skills || []).map(s => s.toLowerCase()).includes(skill.toLowerCase()));
  }
  // hide password
  techs = techs.map(({ password, ...rest }) => rest);
  res.json({ technicians: techs });
});

/* -------------------- JOBS & BIDS -------------------- */

// Create a job (customer)
app.post("/api/jobs", (req, res) => {
  const { title, description, priceRange, customerEmail } = req.body;
  if (!title || !customerEmail) return res.status(400).json({ message: "Missing fields" });

  let db = loadDB();
  const job = {
    id: Date.now(),
    title,
    description: description || '',
    priceRange: priceRange || null,
    customerEmail,
    status: "open",
    bids: [],
    createdAt: new Date().toISOString()
  };

  db.jobs.push(job);
  saveDB(db);

  res.json({ message: "Job created", job });
});

// List jobs
app.get("/api/jobs", (req, res) => {
  let db = loadDB();
  res.json({ jobs: db.jobs || [] });
});

// Get single job
app.get("/api/jobs/:id", (req, res) => {
  let db = loadDB();
  const job = db.jobs.find(j => String(j.id) === String(req.params.id));
  if (!job) return res.status(404).json({ message: "Job not found" });
  res.json({ job });
});

// Place a bid on a job (technician)
app.post("/api/jobs/:id/bid", (req, res) => {
  const jobId = req.params.id;
  const { techEmail, price, message } = req.body;
  if (!techEmail || !price) return res.status(400).json({ message: "Missing bidder info" });

  let db = loadDB();
  const job = db.jobs.find(j => String(j.id) === String(jobId));
  if (!job) return res.status(404).json({ message: "Job not found" });

  const bid = { id: Date.now(), techEmail, price, message: message || '', createdAt: new Date().toISOString() };
  job.bids.push(bid);
  saveDB(db);
  res.json({ message: "Bid placed", bid });
});

// Accept bid (customer accepts a bid -> job assigned to tech)
app.post("/api/jobs/:id/accept", (req, res) => {
  const jobId = req.params.id;
  const { bidId } = req.body;
  if (!bidId) return res.status(400).json({ message: "Missing bid id" });

  let db = loadDB();
  const job = db.jobs.find(j => String(j.id) === String(jobId));
  if (!job) return res.status(404).json({ message: "Job not found" });

  const bid = job.bids.find(b => String(b.id) === String(bidId));
  if (!bid) return res.status(404).json({ message: "Bid not found" });

  job.status = "assigned";
  job.assignedTo = bid.techEmail;
  job.assignedBid = bid;
  saveDB(db);
  res.json({ message: "Bid accepted", job });
});

/* -------------------- SUBSCRIPTION -------------------- */

// Update user's subscription / plan
app.post("/api/subscription", (req, res) => {
  const { email, plan } = req.body;
  if (!email || !plan) return res.status(400).json({ message: "Missing fields" });

  let db = loadDB();
  const user = db.users.find(u => u.email === email);
  if (!user) return res.status(404).json({ message: "No user found" });

  user.plan = plan;
  saveDB(db);

  res.json({ message: "Subscription updated", user: { ...user, password: undefined } });
});

/* -------------------- SIMPLE ADMIN ENDPOINTS (demo) -------------------- */

app.get("/api/admin/stats", (req, res) => {
  const db = loadDB();
  res.json({
    users: db.users.length,
    technicians: db.technicians.length,
    jobs: db.jobs.length
  });
});

/* -------------------- START SERVER -------------------- */
app.listen(PORT, () => console.log("Backend running on port " + PORT));
