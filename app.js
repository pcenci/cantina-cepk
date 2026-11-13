// Dados iniciais caso o localStorage esteja vazio (RN02)
const defaultMenu = [
  { id: 1, name: "Coxinha de Frango", category: "Salgados", price: 6.50, available: true },
  { id: 2, name: "Pão de Queijo Grande", category: "Salgados", price: 5.00, available: true },
  { id: 3, name: "Suco Natural de Laranja", category: "Bebidas", price: 6.00, available: true },
  { id: 4, name: "Brigadeiro Gourmet", category: "Doces", price: 4.00, available: true }
];

let menu = JSON.parse(localStorage.getItem("cantina_menu")) || defaultMenu;
let orders = JSON.parse(localStorage.getItem("cantina_orders")) || [];
let cart = [];
let currentFilter = "Todos";
let isAdmin = false;

function saveData() {
  localStorage.setItem("cantina_menu", JSON.stringify(menu));
  localStorage.setItem("cantina_orders", JSON.stringify(orders));
}

// Alternar Visão Aluno / Cantina (RF01)
const btnToggle = document.getElementById("btn-toggle-role");
btnToggle.addEventListener("click", () => {
  isAdmin = !isAdmin;
  document.getElementById("view-aluno").classList.toggle("hidden", isAdmin);
  document.getElementById("view-cantina").classList.toggle("hidden", !isAdmin);
  btnToggle.textContent = isAdmin ? "Mudar para: Aluno" : "Mudar para: Cantina";
  renderAll();
});

// Renderizar Cardápio do Aluno (RF02)
function renderMenu() {
  const container = document.getElementById("menu-list");
  container.innerHTML = "";
  const filtered = currentFilter === "Todos" ? menu : menu.filter(i => i.category === currentFilter);

  filtered.forEach(item => {
    const div = document.createElement("div");
    div.className = "card item-card";
    div.innerHTML = `
      <span class="badge ${item.available ? '' : 'esgotado'}">
        ${item.available ? item.category : 'Esgotado'}
      </span>
      <h3>${item.name}</h3>
      <p class="price">R$ ${item.price.toFixed(2).replace('.', ',')}</p>
      <button class="btn-primary" ${!item.available ? 'disabled' : ''} onclick="addToCart(${item.id})">
        ${item.available ? 'Adicionar' : 'Indisponível'}
      </button>
    `;
    container.appendChild(div);
  });
}

// Filtros
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    currentFilter = e.target.dataset.cat;
    renderMenu();
  });
});

// Carrinho (RF03)
window.addToCart = (id) => {
  const item = menu.find(i => i.id === id);
  if (!item || !item.available) return;
  cart.push(item);
  renderCart();
};

window.removeFromCart = (index) => {
  cart.splice(index, 1);
  renderCart();
};

function renderCart() {
  const list = document.getElementById("cart-items");
  list.innerHTML = "";
  let total = 0;
  cart.forEach((item, idx) => {
    total += item.price;
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${item.name} - R$ ${item.price.toFixed(2).replace('.', ',')}</span>
      <button class="btn-sm" onclick="removeFromCart(${idx})">❌</button>
    `;
    list.appendChild(li);
  });
  document.getElementById("cart-total").textContent = total.toFixed(2).replace('.', ',');
}

// Finalizar Pedido (RF04)
document.getElementById("btn-checkout").addEventListener("click", () => {
  const student = document.getElementById("student-name").value.trim();
  if (cart.length === 0) return alert("Adicione pelo menos um item ao carrinho!");
  if (!student) return alert("Informe seu nome e turma!");

  const code = "#" + Math.floor(100 + Math.random() * 900);
  const total = cart.reduce((sum, i) => sum + i.price, 0);

  orders.unshift({
    code,
    student,
    items: cart.map(i => i.name).join(", "),
    total,
    status: "Em preparo"
  });

  cart = [];
  document.getElementById("student-name").value = "";
  saveData();
  renderAll();
  alert(`Pedido ${code} confirmado! Acompanhe o status abaixo.`);
});

// Renderizar Pedidos do Aluno e da Cantina (RF05, RF07)
function renderOrders() {
  const studentContainer = document.getElementById("student-orders");
  const adminContainer = document.getElementById("admin-orders-list");
  studentContainer.innerHTML = orders.length ? "" : "<p>Nenhum pedido realizado.</p>";
  adminContainer.innerHTML = orders.length ? "" : "<p>Nenhum pedido na fila.</p>";

  orders.forEach((order, idx) => {
    const htmlBase = `
      <strong>Senha ${order.code}</strong> - ${order.student}<br/>
      <small>${order.items}</small><br/>
      <span>Total: R$ ${order.total.toFixed(2).replace('.', ',')} | Status: <strong>${order.status}</strong></span>
    `;

    const sDiv = document.createElement("div");
    sDiv.className = "order-row";
    sDiv.innerHTML = htmlBase;
    studentContainer.appendChild(sDiv);

    const aDiv = document.createElement("div");
    aDiv.className = "order-row";
    aDiv.innerHTML = `${htmlBase}<div style="margin-top:0.5rem;">
      <button class="btn-sm" onclick="updateOrderStatus(${idx}, 'Pronto para retirada')">✅ Marcar Pronto</button>
      <button class="btn-sm" onclick="updateOrderStatus(${idx}, 'Entregue')">🤝 Entregue</button>
    </div>`;
    adminContainer.appendChild(aDiv);
  });
}

window.updateOrderStatus = (idx, status) => {
  orders[idx].status = status;
  saveData();
  renderOrders();
};

// Gestão de Cardápio (RF06)
document.getElementById("form-add-item").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("item-name").value.trim();
  const category = document.getElementById("item-cat").value;
  const price = parseFloat(document.getElementById("item-price").value);

  menu.push({ id: Date.now(), name, category, price, available: true });
  e.target.reset();
  saveData();
  renderAll();
});

function renderAdminMenu() {
  const container = document.getElementById("admin-menu-list");
  container.innerHTML = "";
  menu.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "order-row";
    div.innerHTML = `
      <strong>${item.name}</strong> (${item.category}) - R$ ${item.price.toFixed(2).replace('.', ',')}
      <div style="margin-top:0.4rem;">
        <button class="btn-sm" onclick="toggleAvailability(${idx})">
          ${item.available ? 'Marcar Esgotado' : 'Marcar Disponível'}
        </button>
        <button class="btn-sm" onclick="deleteItem(${idx})">🗑️ Excluir</button>
      </div>
    `;
    container.appendChild(div);
  });
}

window.toggleAvailability = (idx) => {
  menu[idx].available = !menu[idx].available;
  saveData();
  renderAll();
};

window.deleteItem = (idx) => {
  menu.splice(idx, 1);
  saveData();
  renderAll();
};

function renderAll() {
  renderMenu();
  renderCart();
  renderOrders();
  renderAdminMenu();
}

// Registrar Service Worker para PWA (RNF03)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch(err => console.log("SW erro:", err));
}

saveData();
renderAll();