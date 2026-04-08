const EMPLOYEES = {
  "1234": { name: "Demo User", role: "Manager" }
};

const DEFAULT_MENU = [
  { id: 1, name: "Patatas Bravas", category: "Tapas", price: 11 },
  { id: 2, name: "Garlic Shrimp", category: "Tapas", price: 15 },
  { id: 3, name: "Braised Short Rib", category: "Entrees", price: 28 },
  { id: 4, name: "Mushroom Flatbread", category: "Specials", price: 18 },
  { id: 5, name: "Sangria Pitcher", category: "Drinks", price: 24 },
  { id: 6, name: "Sparkling Water", category: "Drinks", price: 5 }
];

function setSession(pin) {
  localStorage.setItem("tammy-session-pin", pin);
}

function getEmployeeId() {
  return localStorage.getItem("tammy-session-pin");
}

function getEmployee() {
  const pin = getEmployeeId();
  return EMPLOYEES[pin] || { name: `Employee ${pin || ""}`.trim(), role: "Server" };
}

function logout() {
  localStorage.removeItem("tammy-session-pin");
  window.location.href = "./index.html";
}

function requireLogin() {
  const empId = getEmployeeId();
  if (!empId) {
    window.location.href = "./index.html";
    return null;
  }
  return empId;
}

function getMenu() {
  const menu = JSON.parse(localStorage.getItem("tammy-menu"));
  return Array.isArray(menu) && menu.length ? menu : DEFAULT_MENU;
}

function saveMenu(menu) {
  localStorage.setItem("tammy-menu", JSON.stringify(menu));
}

function getOrders() {
  const orders = JSON.parse(localStorage.getItem("tammy-orders"));
  return Array.isArray(orders) ? orders : [];
}

function saveOrders(orders) {
  localStorage.setItem("tammy-orders", JSON.stringify(orders));
}

function getDraftOrder() {
  const draft = JSON.parse(localStorage.getItem("tammy-draft-order"));
  return draft && typeof draft === "object" ? draft : { items: [] };
}

function saveDraftOrder(draft) {
  localStorage.setItem("tammy-draft-order", JSON.stringify(draft));
}

function formatMoney(value) {
  return `$${Number(value).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function updateGlobalStats() {
  const orders = getOrders();
  const total = orders.length;
  const submitted = orders.filter(order => order.status === "Submitted").length;
  const inKitchen = orders.filter(order => order.status === "In Kitchen").length;
  const ready = orders.filter(order => order.status === "Ready").length;

  const statTotal = document.getElementById("statTotal");
  const statSubmitted = document.getElementById("statSubmitted");
  const statInKitchen = document.getElementById("statInKitchen");
  const statReady = document.getElementById("statReady");

  if (statTotal) statTotal.textContent = total;
  if (statSubmitted) statSubmitted.textContent = submitted;
  if (statInKitchen) statInKitchen.textContent = inKitchen;
  if (statReady) statReady.textContent = ready;
}

function populateSessionHeader() {
  const empId = requireLogin();
  if (!empId) return null;

  const employee = getEmployee();
  const welcomeName = document.getElementById("welcomeName");
  const welcomeRole = document.getElementById("welcomeRole");
  const managerNav = document.getElementById("managerNav");

  if (welcomeName) welcomeName.textContent = employee.name;
  if (welcomeRole) welcomeRole.textContent = employee.role;
  if (managerNav) managerNav.style.display = "block";

  updateGlobalStats();
  return employee;
}

function initOrderEntryPage() {
  const empId = requireLogin();
  if (!empId) return;

  const employee = getEmployee();
  const table = localStorage.getItem("active-table") || "";
  const guests = localStorage.getItem("active-guests") || "—";
  const allergies = localStorage.getItem("active-allergies") || "—";
  const notes = localStorage.getItem("active-notes") || "";

  if (!table) {
    window.location.href = "./create-order.html";
    return;
  }

  const welcome = document.getElementById("welcomeName");
  if (welcome) welcome.textContent = employee.name;
  const summaryTable = document.getElementById("summaryTable");
  const summaryGuests = document.getElementById("summaryGuests");
  const summaryAllergies = document.getElementById("summaryAllergies");
  const context = document.getElementById("ticketContext");
  if (summaryTable) summaryTable.textContent = table;
  if (summaryGuests) summaryGuests.textContent = guests || "—";
  if (summaryAllergies) summaryAllergies.textContent = allergies || "—";
  if (context) context.textContent = `Table ${table}${notes ? ` • ${notes}` : ""}`;

  const menuSelect = document.getElementById("menuItem");
  const addItemBtn = document.getElementById("addItemBtn");
  const clearBtn = document.getElementById("clearTicketBtn");
  const submitBtn = document.getElementById("submitOrderBtn");

  const menu = getMenu();
  menuSelect.innerHTML = menu.map(item => `
    <option value="${item.id}">${escapeHtml(item.name)} • ${escapeHtml(item.category)} • ${formatMoney(item.price)}</option>
  `).join("");

  let draft = getDraftOrder();
  draft.table = table;
  draft.guests = guests;
  draft.allergies = allergies;
  draft.notes = notes;
  draft.employeeId = empId;
  draft.items = Array.isArray(draft.items) ? draft.items : [];
  saveDraftOrder(draft);

  function renderDraft() {
    const ticketItems = document.getElementById("ticketItems");
    const summaryCount = document.getElementById("summaryCount");
    summaryCount.textContent = draft.items.length;

    if (!draft.items.length) {
      ticketItems.innerHTML = '<div class="empty">No menu items added yet.</div>';
      return;
    }

    ticketItems.innerHTML = draft.items.map((item, index) => `
      <div class="ticket">
        <div class="row">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <div class="table-meta">Qty ${item.quantity} • ${formatMoney(item.price)} each</div>
            ${item.modifier ? `<div class="footer-note" style="margin-top:8px">Modifier: ${escapeHtml(item.modifier)}</div>` : ""}
          </div>
          <button class="btn-secondary" type="button" onclick="removeDraftItem(${index})">Remove</button>
        </div>
      </div>
    `).join("");
  }

  window.removeDraftItem = function(index) {
    draft.items.splice(index, 1);
    saveDraftOrder(draft);
    renderDraft();
  };

  addItemBtn.addEventListener("click", function () {
    const menuId = Number(menuSelect.value);
    const qty = Math.max(1, Number(document.getElementById("itemQty").value) || 1);
    const modifier = document.getElementById("itemModifier").value.trim();
    const selected = menu.find(item => item.id === menuId);

    if (!selected) return;

    draft.items.push({
      id: selected.id,
      name: selected.name,
      category: selected.category,
      price: selected.price,
      quantity: qty,
      modifier
    });

    saveDraftOrder(draft);
    document.getElementById("itemQty").value = 1;
    document.getElementById("itemModifier").value = "";
    renderDraft();
  });

  clearBtn.addEventListener("click", function () {
    draft.items = [];
    saveDraftOrder(draft);
    renderDraft();
  });

  submitBtn.addEventListener("click", function () {
    if (!draft.items.length) {
      alert("Please add at least one item before submitting.");
      return;
    }

    const orders = getOrders();
    orders.push({
      id: `T${draft.table}-${Date.now().toString().slice(-5)}`,
      table: draft.table,
      guests: draft.guests,
      allergies: draft.allergies,
      notes: draft.notes,
      employeeId: draft.employeeId,
      employeeName: employee.name,
      status: "Submitted",
      createdAt: new Date().toLocaleString(),
      items: draft.items
    });

    saveOrders(orders);
    localStorage.removeItem("tammy-draft-order");
    localStorage.removeItem("active-table");
    localStorage.removeItem("active-guests");
    localStorage.removeItem("active-allergies");
    localStorage.removeItem("active-notes");
    window.location.href = "./dashboard.html";
  });

  renderDraft();
}

function renderKitchenOrders(query = "") {
  const container = document.getElementById("kitchenOrders");
  if (!container) return;

  const normalized = query.trim().toLowerCase();
  const filtered = getOrders().filter(order => {
    if (!normalized) return true;
    const haystack = [
      order.id,
      order.table,
      order.employeeId,
      order.employeeName,
      order.status
    ].join(" ").toLowerCase();
    return haystack.includes(normalized);
  });

  if (!filtered.length) {
    container.innerHTML = '<div class="empty">No matching orders found.</div>';
    return;
  }

  container.innerHTML = filtered.map(order => `
    <div class="ticket">
      <div class="row" style="align-items:flex-start">
        <div>
          <strong>${escapeHtml(order.id)}</strong>
          <div class="table-meta">Table ${escapeHtml(order.table)} • ${escapeHtml(order.employeeName || order.employeeId)}</div>
          <div class="table-meta">${escapeHtml(order.createdAt || "")}</div>
          ${order.allergies && order.allergies !== "—" ? `<div class="badge" style="margin-top:10px;background:#fee2e2;color:#b91c1c">Allergy: ${escapeHtml(order.allergies)}</div>` : ""}
          ${order.notes ? `<div class="footer-note" style="margin-top:10px">Notes: ${escapeHtml(order.notes)}</div>` : ""}
        </div>
        <span class="badge status-${order.status.replace(/\s+/g,"")}">${escapeHtml(order.status)}</span>
      </div>
      <div class="table-orders">
        <ul>
          ${order.items.map(item => `<li>${escapeHtml(item.name)} × ${item.quantity}${item.modifier ? ` — ${escapeHtml(item.modifier)}` : ""}</li>`).join("")}
        </ul>
      </div>
      <div class="status-row" style="margin-top:14px">
        <button class="btn-secondary" type="button" onclick="updateOrderStatus('${order.id}','Submitted')">Submitted</button>
        <button class="btn-secondary" type="button" onclick="updateOrderStatus('${order.id}','In Kitchen')">In Kitchen</button>
        <button class="btn-secondary" type="button" onclick="updateOrderStatus('${order.id}','Ready')">Ready</button>
        <button class="btn-secondary" type="button" onclick="updateOrderStatus('${order.id}','Delivered')">Delivered</button>
      </div>
    </div>
  `).join("");
}

function updateOrderStatus(orderId, newStatus) {
  const orders = getOrders();
  const target = orders.find(order => order.id === orderId);
  if (!target) return;
  target.status = newStatus;
  saveOrders(orders);
  updateGlobalStats();
  const search = document.getElementById("searchOrders");
  renderKitchenOrders(search ? search.value : "");
  renderManagerStats();
}

function initKitchenPage() {
  const employee = populateSessionHeader();
  if (!employee) return;

  const search = document.getElementById("searchOrders");
  renderKitchenOrders();
  if (search) {
    search.addEventListener("input", function () {
      renderKitchenOrders(this.value);
    });
  }
}

function renderManagerStats() {
  const orders = getOrders();
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText("mgrSubmitted", orders.filter(order => order.status === "Submitted").length);
  setText("mgrInKitchen", orders.filter(order => order.status === "In Kitchen").length);
  setText("mgrReady", orders.filter(order => order.status === "Ready").length);
  setText("mgrDelivered", orders.filter(order => order.status === "Delivered").length);
}

function renderMenuList() {
  const menuList = document.getElementById("menuList");
  if (!menuList) return;
  const menu = getMenu();

  menuList.innerHTML = menu.map(item => `
    <div class="menu-tile">
      <div class="row">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <div class="table-meta">${escapeHtml(item.category)}</div>
        </div>
        <strong>${formatMoney(item.price)}</strong>
      </div>
      <div style="margin-top:14px">
        <button class="btn-secondary" type="button" onclick="removeMenuItem(${item.id})">Remove</button>
      </div>
    </div>
  `).join("");
}

function removeMenuItem(itemId) {
  const updated = getMenu().filter(item => item.id !== itemId);
  saveMenu(updated.length ? updated : DEFAULT_MENU);
  renderMenuList();
}

function initManagerPage() {
  const employee = populateSessionHeader();
  if (!employee) return;

  renderManagerStats();
  renderMenuList();

  const saveBtn = document.getElementById("saveMenuItemBtn");
  if (!saveBtn) return;

  saveBtn.addEventListener("click", function () {
    const name = document.getElementById("newItemName").value.trim();
    const category = document.getElementById("newItemCategory").value;
    const price = Number(document.getElementById("newItemPrice").value);

    if (!name || !price) {
      alert("Please enter an item name and price.");
      return;
    }

    const menu = getMenu();
    menu.push({
      id: Date.now(),
      name,
      category,
      price
    });

    saveMenu(menu);
    document.getElementById("newItemName").value = "";
    document.getElementById("newItemPrice").value = "";
    renderMenuList();
  });
}


function getLatestOrderForTable(tableNumber, employeeId = null) {
  const orders = getOrders()
    .filter(order => String(order.table) === String(tableNumber) && (!employeeId || order.employeeId === employeeId))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return orders[0] || null;
}
