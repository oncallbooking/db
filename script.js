// script.js - booking logic (localStorage)
(() => {
  const FORM_ID = "bookingForm";
  const LIST_ID = "bookingsList";
  const EMPTY_ID = "emptyState";
  const STORAGE_KEY = "oncallbookings.v1";

  const form = document.getElementById(FORM_ID);
  const list = document.getElementById(LIST_ID);
  const empty = document.getElementById(EMPTY_ID);
  const clearBtn = document.getElementById("clearBtn");

  function readStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to read storage", e);
      return [];
    }
  }

  function writeStorage(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function uid() {
    return "b_" + Math.random().toString(36).slice(2, 9);
  }

  function render() {
    const items = readStorage();
    list.innerHTML = "";
    if (!items.length) {
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    items.slice().reverse().forEach(item => {
      const li = document.createElement("li");
      li.className = "booking";
      li.dataset.id = item.id;

      const meta = document.createElement("div");
      meta.className = "meta";
      const name = document.createElement("div");
      name.innerHTML = `<strong>${escapeHtml(item.name)}</strong> <span class="small">• ${formatDateTime(item.date, item.time)}</span>`;
      const phone = document.createElement("div");
      phone.className = "small";
      phone.textContent = item.phone || "";
      const notes = document.createElement("div");
      notes.className = "small";
      notes.textContent = item.notes || "";

      meta.appendChild(name);
      if (item.phone) meta.appendChild(phone);
      if (item.notes) meta.appendChild(notes);

      const controls = document.createElement("div");
      controls.style.display = "flex";
      controls.style.flexDirection = "column";
      controls.style.gap = "8px";
      const badge = document.createElement("div");
      badge.className = "badge";
      badge.textContent = item.time || "—";
      const del = document.createElement("button");
      del.textContent = "Delete";
      del.style.padding = "6px 8px";
      del.style.borderRadius = "8px";
      del.style.background = "transparent";
      del.style.color = "var(--muted)";
      del.style.border = "1px solid rgba(255,255,255,0.04)";
      del.style.cursor = "pointer";
      del.onclick = () => removeBooking(item.id);

      controls.appendChild(badge);
      controls.appendChild(del);

      li.appendChild(meta);
      li.appendChild(controls);
      list.appendChild(li);
    });
  }

  function formatDateTime(date, time) {
    if (!date) return time || "";
    try {
      const d = new Date(date + "T" + (time || "00:00"));
      return d.toLocaleString();
    } catch {
      return `${date} ${time || ""}`;
    }
  }

  function removeBooking(id) {
    const items = readStorage().filter(i => i.id !== id);
    writeStorage(items);
    render();
  }

  function clearAll() {
    if (!confirm("Clear all bookings? This cannot be undone.")) return;
    localStorage.removeItem(STORAGE_KEY);
    render();
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (m) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[m]));
  }

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const fd = new FormData(form);
    const name = (fd.get("name") || "").toString().trim();
    const date = (fd.get("date") || "").toString();
    const time = (fd.get("time") || "").toString();
    const phone = (fd.get("phone") || "").toString().trim();
    const notes = (fd.get("notes") || "").toString().trim();

    if (name.length < 2) { alert("Please enter a valid name."); return; }
    if (!date) { alert("Please choose a date."); return; }
    if (!time) { alert("Please choose a time."); return; }

    const items = readStorage();
    const booking = {
      id: uid(),
      name, date, time, phone, notes,
      createdAt: new Date().toISOString()
    };
    items.push(booking);
    writeStorage(items);
    form.reset();
    render();
    // focus name for quick next add
    document.getElementById("name").focus();
  });

  clearBtn.addEventListener("click", clearAll);

  // initial render
  render();
})();
