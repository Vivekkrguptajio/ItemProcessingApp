// GLOBAL DATA
var items = [];
var childCount = 0;

// ---------------- FETCH ----------------
async function fetchItems() {
    try {
        const response = await fetch('/Item/Index');
        const data = await response.json();
        console.log("Raw Data Fetched:", data);

        if (Array.isArray(data)) {
            items = data;
            refreshAll();
        } else {
            console.error("Server did not return an array. Showing entire response:", data);
            showToast("Server data format error");
        }
    } catch (err) {
        console.error('Fetch error:', err);
        showToast("Connection Error. Is server running?");
    }
}

// ---------------- TOAST ----------------
function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ---------------- DASHBOARD ----------------
function getProp(obj, prop) {
    if (obj[prop] !== undefined) return obj[prop];
    if (prop === 'parentId' && obj.ParentId !== undefined) return obj.ParentId;
    return obj[prop.charAt(0).toUpperCase() + prop.slice(1)];
}

function updateDashboard() {
    if (!document.getElementById('stat-total')) return;

    document.getElementById('stat-total').textContent = items.length;
    document.getElementById('stat-processed').textContent =
        items.filter(i => (getProp(i, 'status') || "").toLowerCase().trim() === 'processed').length;
    document.getElementById('stat-pending').textContent =
        items.filter(i => (getProp(i, 'status') || "").toLowerCase().trim() === 'unprocessed').length;
    document.getElementById('stat-children').textContent =
        items.filter(i => getProp(i, 'parentId') !== null && getProp(i, 'parentId') !== undefined).length;
}

function updateRecentItems() {
    const tbody = document.getElementById('dashRecentTable');
    if (!tbody) return;

    const recent = [...items].reverse().slice(0, 5);
    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">No recent items</td></tr>';
        return;
    }

    tbody.innerHTML = recent.map(i => {
        const name = getProp(i, 'name');
        const weight = getProp(i, 'weight');
        const status = (getProp(i, 'status') || 'unprocessed').toLowerCase().trim();
        const badgeCls = status === 'processed' ? 'tree-badge-processed' : 'tree-badge-unprocessed';
        return `<tr>
            <td><strong>${name}</strong></td>
            <td>${weight} kg</td>
            <td><span class="custom-tree-badge ${badgeCls}">${status}</span></td>
        </tr>`;
    }).join('');
}

function refreshAll() {
    console.log("--- Refreshing Global UI ---");

    if (!Array.isArray(items)) {
        console.error("Critical Error: 'items' is not an array!", items);
        items = [];
    }

    try { console.log("Updating Dashboard..."); updateDashboard(); } catch (e) { console.error("Dashboard refresh failed:", e); }
    try { console.log("Updating Recent Items..."); updateRecentItems(); } catch (e) { console.error("Recent items refresh failed:", e); }
    try { console.log("Rendering Items Table..."); renderItemsTable(); } catch (e) { console.error("Items table refresh failed:", e); }
    try { console.log("Populating Parent Select..."); populateParentSelect(); } catch (e) { console.error("Parent select refresh failed:", e); }

    console.log("--- UI Refresh Complete ---");
}

// ---------------- ITEMS ----------------
function renderItemsTable() {
    const tbody = document.getElementById('itemsTableBody');
    if (!tbody) return;

    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">No items</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map((i, idx) => {
        const id = getProp(i, 'id');
        const name = getProp(i, 'name');
        const weight = getProp(i, 'weight');
        const status = (getProp(i, 'status') || 'unprocessed').toLowerCase().trim();
        const badgeCls = status === 'processed' ? 'tree-badge-processed' : (status === 'child' ? 'tree-badge-child' : 'tree-badge-unprocessed');
        return `<tr>
            <td>${idx + 1}</td>
            <td><strong>${name}</strong></td>
            <td>${weight} kg</td>
            <td><span class="custom-tree-badge ${badgeCls}">${status}</span></td>
            <td class="actions">
                <button class="btn btn-secondary btn-sm" onclick="openEditModal(${id}, '${name}', ${weight})">&#9998; Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteItem(${id})">&#128465;</button>
            </td>
        </tr>`;
    }).join('');
}

async function deleteItem(id) {
    if (!confirm("Are you sure?")) return;
    try {
        const response = await fetch(`/Item/Delete?id=${id}`, { method: 'POST' });
        const result = await response.json();
        if (result.success) {
            showToast("Deleted");
            fetchItems();
        }
    } catch {
        showToast("Error deleting");
    }
}

// ---------------- MODAL ----------------
var editingId = null;

function openAddModal() {
    editingId = null;
    const modal = document.getElementById('itemModal');
    const title = document.getElementById('modalTitle');
    if (title) title.textContent = 'Add New Item';
    document.getElementById('modalName').value = '';
    document.getElementById('modalWeight').value = '';
    if (modal) modal.classList.add('open');
}

function openEditModal(id, name, weight) {
    editingId = id;
    const modal = document.getElementById('itemModal');
    const title = document.getElementById('modalTitle');
    if (title) title.textContent = 'Edit Item';
    document.getElementById('modalName').value = name;
    document.getElementById('modalWeight').value = weight;
    if (modal) modal.classList.add('open');
}

function closeModal() {
    const modal = document.getElementById('itemModal');
    if (modal) modal.classList.remove('open');
    // Clear inputs
    document.getElementById('modalName').value = '';
    document.getElementById('modalWeight').value = '';
}

async function saveItem() {
    const nameEl = document.getElementById('modalName');
    const weightEl = document.getElementById('modalWeight');

    if (!nameEl || !weightEl || !nameEl.value || !weightEl.value) {
        showToast("Please fill all fields");
        return;
    }

    const name = nameEl.value;
    const weight = weightEl.value;

    try {
        let url, body;
        if (editingId) {
            url = '/Item/Edit';
            body = `id=${editingId}&itemName=${encodeURIComponent(name)}&weight=${weight}`;
        } else {
            url = '/Item/Add';
            body = `itemName=${encodeURIComponent(name)}&weight=${weight}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body
        });

        const result = await response.json();
        if (result.success) {
            showToast(editingId ? "Item Updated!" : "Item Added!");
            closeModal();
            fetchItems();
        } else {
            showToast(result.message || "Error saving item");
        }
    } catch (err) {
        showToast("Network Error");
        console.error(err);
    }
}

// ---------------- PROCESS ----------------
function populateParentSelect() {
    const select = document.getElementById('parentSelect');
    if (!select) return;

    const val = select.value;
    // Show ALL unprocessed items
    const available = items.filter(i => {
        const s = (getProp(i, 'status') || "").toLowerCase().trim();
        return s === 'unprocessed';
    });

    // Build a name lookup for parent references
    const nameMap = {};
    items.forEach(i => { nameMap[getProp(i, 'id')] = getProp(i, 'name'); });

    select.innerHTML = '<option value="">-- Select an item to process --</option>' +
        available.map(i => {
            const id = getProp(i, 'id');
            const name = getProp(i, 'name');
            const weight = getProp(i, 'weight');
            const pid = getProp(i, 'parentId');
            let label = `${name} (${weight} kg)`;
            if (pid && nameMap[pid]) {
                label += ` (child of: ${nameMap[pid]})`;
            }
            return `<option value="${id}">${label}</option>`;
        }).join('');
    select.value = val;
}

function addChildRow() {
    const container = document.getElementById('childrenContainer');
    if (!container) return;

    childCount++;
    const div = document.createElement('div');
    div.className = "child-row";
    div.style = "display:flex; gap:10px; margin-bottom:10px;";
    div.innerHTML = `
        <input type="text" class="child-name" placeholder="Child Name" style="flex:2"/>
        <input type="number" class="child-weight" placeholder="Weight" style="flex:1"/>
        <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">X</button>
    `;
    container.appendChild(div);
}

async function processItem() {
    const parentId = document.getElementById('parentSelect').value;
    if (!parentId) {
        showToast("Select a parent item");
        return;
    }

    const childRows = document.querySelectorAll('.child-row');
    const children = [];
    childRows.forEach(row => {
        const name = row.querySelector('.child-name').value;
        const weight = row.querySelector('.child-weight').value;
        if (name && weight) children.push({ name, weight });
    });

    if (children.length === 0) {
        showToast("Add at least one child");
        return;
    }

    try {
        // First create the child items
        const childIds = [];
        for (const child of children) {
            const res = await fetch('/Item/Add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `itemName=${encodeURIComponent(child.name)}&weight=${child.weight}`
            });
            const data = await res.json();
            const newId = data.id || data.Id;
            if (newId) childIds.push(newId);
            else console.error("Item Add fallback: no ID in response", data);
        }

        console.log("Linking Children with IDs:", childIds);
        if (childIds.length === 0) {
            console.warn("No valid child IDs obtained from Item/Add!");
        }

        // Then process the relationship
        const response = await fetch('/Process/ProcessItem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `parentId=${parentId}&${childIds.map(id => "childIds=" + id).join('&')}`
        });

        const result = await response.json();
        console.log("Process Result:", result);
        if (result.success) {
            showToast(result.message || "Processing Successful");
            document.getElementById('childrenContainer').innerHTML = '';
            childCount = 0;
            addChildRow();
            fetchItems();
        } else {
            showToast(result.message || "Error processing");
        }
    } catch (err) {
        showToast("Processing Error");
        console.error(err);
    }
}

function resetProcessForm() {
    try {
        const s = document.getElementById('parentSelect');
        if (s) s.value = '';
        const c = document.getElementById('childrenContainer');
        if (c) c.innerHTML = '';
        childCount = 0;
        addChildRow();
    } catch (e) {
        console.error("Reset error:", e);
    }
}

// ---------------- TREE VIEW ----------------
async function initTree() {
    const container = document.getElementById('jstree_container');
    if (!container) return;

    try {
        const response = await fetch('/Process/TreeView');
        const result = await response.json();
        if (result.success) {
            if (!result.data || result.data.length === 0) {
                container.innerHTML = '<div class="empty-state"><div class="empty-icon">&#127795;</div><p>No items yet. Add items to see the tree!</p></div>';
                return;
            }

            const nodes = result.data;
            // Build parent-child map
            const roots = [];
            const childMap = {};

            nodes.forEach(n => {
                const pid = n.parent || n.Parent;
                const id = n.id || n.Id;
                if (!pid) {
                    roots.push(n);
                } else {
                    if (!childMap[pid]) childMap[pid] = [];
                    childMap[pid].push(n);
                }
            });

            function badgeClass(status) {
                const s = (status || "").toLowerCase().trim();
                if (s === 'processed') return 'tree-badge-processed';
                if (s === 'child') return 'tree-badge-child';
                return 'tree-badge-unprocessed';
            }

            function renderNode(node, depth) {
                const id = node.id || node.Id;
                const name = node.text || node.Text;
                const weight = node.weight || node.Weight || 0;
                const status = node.status || node.Status || 'unprocessed';
                const itemStatus = node.itemStatus || node.ItemStatus || status;
                const children = childMap[id] || [];
                const hasChildren = children.length > 0;
                const icon = hasChildren ? '📦' : (status === 'child' ? '📋' : '📄');

                // Build badge HTML: show both "child" and actual status for child items
                let badgeHtml = '';
                if (status === 'child') {
                    badgeHtml = `<span class="custom-tree-badge ${badgeClass('child')}">child</span>`;
                    badgeHtml += ` <span class="custom-tree-badge ${badgeClass(itemStatus)}">${itemStatus}</span>`;
                } else {
                    badgeHtml = `<span class="custom-tree-badge ${badgeClass(status)}">${status}</span>`;
                }

                let html = `<div class="custom-tree-node depth-${depth}">
                    <div class="custom-tree-row" ${hasChildren ? 'onclick="toggleTreeChildren(this)"' : ''}>
                        <div class="custom-tree-left">
                            ${hasChildren ? '<span class="custom-tree-toggle">▼</span>' : '<span class="custom-tree-dot">○</span>'}
                            <span class="custom-tree-icon">${icon}</span>
                            <span class="custom-tree-name">${name}</span>
                        </div>
                        <div class="custom-tree-right">
                            <span class="custom-tree-weight">${weight} kg</span>
                            ${badgeHtml}
                        </div>
                    </div>`;

                if (hasChildren) {
                    html += '<div class="custom-tree-children open">';
                    children.forEach(c => {
                        html += renderNode(c, depth + 1);
                    });
                    html += '</div>';
                }

                html += '</div>';
                return html;
            }

            let treeHtml = '';
            roots.forEach(r => { treeHtml += renderNode(r, 0); });
            container.innerHTML = treeHtml;
        }
    } catch (err) {
        console.error("Tree error:", err);
        container.innerHTML = '<div class="empty-state"><p>Error loading tree</p></div>';
    }
}

function toggleTreeChildren(el) {
    const childrenDiv = el.parentElement.querySelector('.custom-tree-children');
    if (childrenDiv) {
        childrenDiv.classList.toggle('open');
        const toggle = el.querySelector('.custom-tree-toggle');
        if (toggle) toggle.classList.toggle('collapsed');
    }
}

// ---------------- NAV ----------------
function switchTab(tab, el) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const tabEl = document.getElementById('tab-' + tab);
    if (tabEl) tabEl.classList.add('active');
    if (el) el.classList.add('active');

    if (tab === 'dashboard') {
        updateDashboard();
        updateRecentItems();
    }
    if (tab === 'items') renderItemsTable();
    if (tab === 'process') populateParentSelect();
    if (tab === 'processed') renderProcessedTable();
    if (tab === 'tree') initTree();
}

async function renderProcessedTable() {
    const tbody = document.getElementById('processedTableBody');
    if (!tbody) return;

    try {
        const response = await fetch('/Process/ProcessedList');
        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error("Non-JSON response:", text);
            showToast("Server error (Check console)");
            return;
        }

        console.log("Processed List Result:", result);
        if (result.success && result.data) {
            if (result.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">No processed items found.</td></tr>';
                return;
            }
            tbody.innerHTML = result.data.map((p, idx) => {
                const parentName = getProp(p, 'parentName');
                const parentWeight = getProp(p, 'parentWeight');
                const childItems = getProp(p, 'childItems') || '';
                const totalChildWeight = getProp(p, 'totalChildWeight');

                // Render child names as individual colored badges
                let childBadges = '<span style="color:var(--text-muted)">None</span>';
                if (childItems && childItems.trim() !== '') {
                    const names = childItems.split(',').map(n => n.trim()).filter(n => n);
                    childBadges = names.map(n =>
                        `<span class="custom-tree-badge tree-badge-child">${n}</span>`
                    ).join(' ');
                }

                return `<tr>
                    <td>${idx + 1}</td>
                    <td><strong>${parentName}</strong></td>
                    <td>${parentWeight} kg</td>
                    <td>${childBadges}</td>
                    <td>${totalChildWeight} kg</td>
                </tr>`;
            }).join('');
        } else {
            showToast(result.message || "Error loading list");
        }
    } catch (err) {
        showToast("Network Error loading list");
        console.error("Processed list error:", err);
    }
}

// ---------------- INIT ----------------
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('addItemBtn')?.addEventListener('click', openAddModal);
    document.getElementById('saveItemBtn')?.addEventListener('click', saveItem);
    document.getElementById('cancelModalBtn')?.addEventListener('click', closeModal);
    document.getElementById('addChildBtn')?.addEventListener('click', addChildRow);
    document.getElementById('processBtn')?.addEventListener('click', processItem);
    document.getElementById('resetBtn')?.addEventListener('click', resetProcessForm);
    document.getElementById('logoutBtn')?.addEventListener('click', function () {
        window.location.href = '/Account/Logout';
    });

    if (document.getElementById('childrenContainer')) {
        addChildRow();
    }

    fetchItems();
});
