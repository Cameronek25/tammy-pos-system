// ===================== EMPLOYEES =====================
const EMPLOYEES = {
  "1234": { name: "Demo User", role: "Manager" }
};

// ===================== SESSION =====================
function setSession(pin) {
  localStorage.setItem("tammy-session-pin", pin);
}

function getEmployeeId() {
  return localStorage.getItem("tammy-session-pin");
}

function logout() {
  localStorage.removeItem("tammy-session-pin");
  window.location.href = "index.html";
}

function requireLogin() {
  const empId = getEmployeeId();
  if (!empId) {
    window.location.href = "index.html";
    return null;
  }
  return empId;
}

// ===================== LOGIN =====================
function initLoginPage() {
  const form = document.getElementById("loginForm");
  const pinInput = document.getElementById("employeePin");
  const msg = document.getElementById("loginMessage");

  if (!form || !pinInput || !msg) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const pin = pinInput.value.trim();

    if (pin !== "1234") {
      msg.textContent = "Access code not recognized.";
      pinInput.value = "";
      return;
    }

    setSession(pin);
    window.location.href = "dashboard.html";
  });
}

// ===================== DATA =====================
const DEFAULT_MENU = [
  { id: 1, name: "Patatas Bravas", category: "Tapas", price: 11 },
  { id: 2, name: "Garlic Shrimp", category: "Tapas", price: 15 },
  { id: 3, name: "Braised Short Rib", category: "Entrees", price: 28 },
  { id: 4, name: "Mushroom Flatbread", category: "Specials", price: 18 },
  { id: 5, name: "Sangria Pitcher", category: "Drinks", price: 24 },
  { id: 6, name: "Sparkling Water", category: "Drinks", price: 5 }
];

function getMenu() {
  return JSON.parse(localStorage.getItem("tammy-menu")) || DEFAULT_MENU;
}

function getOrders() {
  return JSON.parse(localStorage.getItem("tammy-orders")) || [];
}

function saveOrders(orders) {
  localStorage.setItem("tammy-orders", JSON.stringify(orders));
}

// ===================== CREATE ORDER =====================
function createOrder(table, items, notes = "") {
  const employeeId = getEmployeeId();
  const orders = getOrders();

  orders.push({
    id: `T${table}-${Date.now().toString().slice(-4)}`,
    table: table,
    employeeId: employeeId, // 🔥 IMPORTANT
    status: "Submitted",
    notes: notes,
    createdAt: new Date().toLocaleString(),
    items: items
  });

  saveOrders(orders);
}

// ===================== DASHBOARD =====================
function renderTables() {
  const employeeId = getEmployeeId();
  const orders = getOrders();

  const employeeOrders = orders.filter(
    order => order.employeeId === employeeId
  );

  const tableMap = {};

  employeeOrders.forEach(order => {
    tableMap[order.table] = order;
  });

  const tablesGrid = document.getElementById("tablesGrid");
  if (!tablesGrid) return;

  const tables = Object.values(tableMap);

  if (tables.length === 0) {
    tablesGrid.innerHTML =
      '<div class="empty">No active tables yet.</div>';
    return;
  }

  tablesGrid.innerHTML = tables.map(order => {
    let statusClass = "open";

    if (order.status === "Ready") statusClass = "ready";
    else if (order.status === "In Kitchen") statusClass = "cooking";
    else if (order.status === "Submitted") statusClass = "submitted";

    return `
      <a href="create-order.html" class="table-circle ${statusClass}">
        <span class="table-number">${order.table}</span>
        <span class="table-status">${order.status}</span>
      </a>
    `;
  }).join("");
}

function initDashboard() {
  const empId = requireLogin();
  if (!empId) return;

  const display = document.getElementById("employeeId");
  if (display) {
    display.textContent = empId;
  }

  renderTables();
}