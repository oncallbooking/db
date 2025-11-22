const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const DB_FILE = "db.json";

// Create file if missing
if (!fs.existsSync(DB_FILE)) {
  fs.writeJsonSync(DB_FILE, {
    users: [],
    technicians: [],
    jobs: []
  });
}

function loadDB() {
  return fs.readJsonSync(DB_FILE);
}

function saveDB(data) {
  fs.writeJsonSync(DB_FILE, data, { spaces: 2 });
}

/* -------------------- SIGNUP -------------------- */
app.post("/signup", (req, res) => {
  const { role, name, email, password, skill } = req.body;

  let db = loadDB();

  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const user = {
    id: Date.now(),
    role,
    name,
    email,
    password,
    skill: skill || "",
    plan: "basic"
  };

  db.users.push(user);
  saveDB(db);

  res.json({ message: "Signup successful", user });
});

/* -------------------- LOGIN -------------------- */
app.post("/login", (req, res) => {
  const { email, password, role } = req.body;

  let db = loadDB();
  const user = db.users.find(u => u.email === email && u.password === password && u.role === role);

  if (!user) return res.status(401).json({ message: "Invalid login" });

  res.json({ message: "Login success", user });
});

/* -------------------- GET TECHNICIANS -------------------- */
app.get("/technicians", (req, res) => {
  let db = loadDB();
  const technicians = db.users.filter(u => u.role === "technician");
  res.json(technicians);
});

/* -------------------- CREATE JOB -------------------- */
app.post("/job", (req, res) => {
  const { title, description, priceRange, customerEmail } = req.body;

  let db = loadDB();
  const job = {
    id: Date.now(),
    title,
    description,
    priceRange,
    customerEmail,
    bids: []
  };

  db.jobs.push(job);
  saveDB(db);

  res.json({ message: "Job created", job });
});

/* -------------------- GET JOBS -------------------- */
app.get("/jobs", (req, res) => {
  let db = loadDB();
  res.json(db.jobs);
});

/* -------------------- BID ON A JOB -------------------- */
app.post("/bid", (req, res) => {
  const { jobId, technicianName, amount } = req.body;

  let db = loadDB();
  const job = db.jobs.find(j => j.id == jobId);

  if (!job) return res.status(404).json({ message: "Job not found" });

  job.bids.push({ technicianName, amount });
  saveDB(db);

  res.json({ message: "Bid added", job });
});

/* -------------------- UPDATE SUBSCRIPTION -------------------- */
app.post("/subscribe", (req, res) => {
  const { email, plan } = req.body;

  let db = loadDB();
  const user = db.users.find(u => u.email === email);

  if (!user) return res.status(404).json({ message: "No user" });

  user.plan = plan;
  saveDB(db);

  res.json({ message: "Subscription updated" });
});

/* -------------------- START SERVER -------------------- */
app.listen(PORT, () => console.log("Backend running on port " + PORT));
