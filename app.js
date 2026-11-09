const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const $ = s => document.querySelector(s);
const money = n => Number(n || 0).toLocaleString("fr-FR", {style:"currency", currency:"EUR"});
let products = [];
let balance = 0, orders = [], topups = [], tickets = [], filter = "Tous";

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  window.setTimeout(() => t.classList.remove("show"), 2600);
}
function modal(html) {
  $("#modalContent").innerHTML = html;
  $("#modal").showModal();
}
function showTab(tab) {
  $("#homePage").classList.toggle("hidden", tab !== "home");
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  if (tab !== "home") {
    const page = $(`#${tab}Page`);
    if (page) page.classList.remove("hidden");
  }
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  window.scrollTo({top:0, behavior:"smooth"});
}
function updateBalance() {
  $("#balance").textContent = money(balance);
}
function updateStats() {
  $("#statOrders").textContent = orders.length;
  $("#statSpent").textContent = money(orders.reduce((sum, o) => sum + Number(o.price || 0), 0));
  $("#statTopups").textContent = topups.length;
}
function renderProducts(target, list = products) {
  const container = $(target);
  if (!container) return;
  if (!list.length) {
    container.innerHTML = '<div class="empty-state">Aucun produit disponible pour le moment.</div>';
    return;
  }
  container.innerHTML = list.map(p => {
    const image = p.image_url
      ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy">`
      : `<span>✦</span>`;
    const description = p.description || "Produit numérique";
    const price = Number(p.price || 0);
    const stock = Number(p.stock ?? 0);
    return `<article class="product-card">
      <div class="product-art">${image}</div>
      <div class="product-info">
        <b>${escapeHtml(p.name)}</b>
        <small>${escapeHtml(description)}</small>
        <div class="product-bottom"><span class="price">${money(price)}</span>
        <button class="buy-mini" data-buy="${escapeHtml(p.id)}" ${stock <= 0 ? "disabled" : ""}>${stock <= 0 ? "Épuisé" : "Acheter"}</button></div>
      </div></article>`;
  }).join("");
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function renderLists() {
  $("#orders").innerHTML = orders.length
    ? orders.map(o => `<div class="row-item"><span>${escapeHtml(o.name)}<br><small>${escapeHtml(o.date)}</small></span><b class="status">Démo locale</b></div>`).join("")
   : `<div class="empty-state">Tu n'as pas encore de commande.</div>`;
  $("#homeOrders").innerHTML = orders.length
    ? orders.slice(0,3).map(o => `<div class="row-item"><span>${escapeHtml(o.name)}<br><small>${escapeHtml(o.date)}</small></span><b class="status">${money(o.price)}</b></div>`).join("")
    : '<div class="empty-state">Tes commandes apparaîtront ici.</div>';
  $("#topups").innerHTML = topups.length
    ? topups.map(t => `<div class="row-item"><span>${escapeHtml(t.method)} · ${money(t.amount)}</span><b class="status">${escapeHtml(t.status)}</b></div>`).join("")
    : '<div class="empty-state">Aucune recharge pour le moment.</div>';
  const ticketList = $("#tickets");
  if (ticketList) ticketList.innerHTML = tickets.length
    ? tickets.map(t => `<div class="row-item"><span>#${t.id} · ${escapeHtml(t.subject)}<br><small>${escapeHtml(t.message)}</small></span><b class="status">Ouvert</b></div>`).join("")
    : '<div class="empty-state">Aucun ticket ouvert.</div>';
  updateStats();
}
async function loadProducts() {
  const client = (typeof supabaseClient !== "undefined" ? supabaseClient : window.supabaseClient);
  if (!client || typeof client.from !== "function") {
    $("#products").innerHTML = '<div class="empty-state">Connexion Supabase indisponible. Vérifie supabase.js et sa clé publique.</div>';
    $("#featured").innerHTML = '<div class="empty-state">Les produits seront affichés après connexion à Supabase.</div>';
    return;
  }
  try {
    const { data, error } = await client.from("products")
      .select("id,name,description,price,stock,image_url,is_active,created_at")
      .eq("is_active", true)
      .order("created_at", {ascending:false});
    if (error) throw error;
    products = (data || []).filter(p => p.is_active !== false);
    const categories = ["Tous", ...new Set(products.map(p => p.category).filter(Boolean))];
    $("#filters").innerHTML = categories.map(c => `<button class="filter ${c === "Tous" ? "active" : ""}" data-filter="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("");
    renderProducts("#products", products);
    renderProducts("#featured", products.slice(0,2));
  } catch (err) {
    console.error("Erreur de chargement des produits Supabase :", err);
    $("#products").innerHTML = '<div class="empty-state">Impossible de charger les produits. Vérifie les autorisations (RLS) de la table products.</div>';
    $("#featured").innerHTML = '<div class="empty-state">Les produits ne sont pas disponibles pour le moment.</div>';
  }
}

renderLists();
updateBalance();
loadProducts();

document.addEventListener("click", e => {
  const tab = e.target.closest("[data-tab]")?.dataset.tab || e.target.closest("[data-go]")?.dataset.go;
  if (tab) { showTab(tab); return; }

  const filterButton = e.target.closest("[data-filter]");
  if (filterButton) {
    filter = filterButton.dataset.filter;
    document.querySelectorAll(".filter").forEach(x => x.classList.toggle("active", x === filterButton));
    renderProducts("#products", filter === "Tous" ? products : products.filter(p => p.category === filter));
    return;
  }

  const amountButton = e.target.closest("[data-amount]");
  if (amountButton) { $("#amount").value = amountButton.dataset.amount; return; }

  const buyButton = e.target.closest("[data-buy]");
  if (buyButton) {
    const p = products.find(x => String(x.id) === buyButton.dataset.buy);
    if (!p) return;
    modal(`<h2 class="modal-title">${escapeHtml(p.name)}</h2>
      <p class="modal-copy">${escapeHtml(p.description || "Produit numérique")}<br><b class="price">${money(p.price)}</b></p>
      <p class="modal-copy">La validation de commande n'est pas encore connectée à un système de paiement réel.</p>
      <div class="modal-actions"><button class="secondary-button close-action">Fermer</button></div>`);
    return;
  }

  const payment = e.target.closest("[data-payment]");
  if (payment) {
    const amount = Number($("#amount").value);
    if (!amount || amount < 5) { toast("Entre un montant valide (minimum 5 €)."); return; }
    modal(`<h2 class="modal-title">Demande de recharge</h2>
      <p class="modal-copy">Montant souhaité : <b>${money(amount)}</b><br>Le paiement n'est pas configuré dans cette version. Aucune somme ne sera débitée ni créditée.</p>
      <div class="modal-actions"><button class="secondary-button close-action">Fermer</button></div>`);
    return;
  }

  if (e.target.id === "openTicket") {
    modal(`<h2 class="modal-title">Ouvrir un ticket</h2>
      <p class="modal-copy">Décris ton problème, le support pourra te répondre.</p>
      <select id="ticketSubject" class="field">
        <option>Question sur une commande</option><option>Problème de recharge</option><option>Produit reçu</option><option>Autre demande</option>
      </select>
      <textarea id="ticketMessage" class="field" rows="4" placeholder="Ton message…" style="margin-top:9px;resize:vertical"></textarea>
      <div class="modal-actions"><button class="secondary-button close-action">Annuler</button><button class="primary-button" id="sendTicket">Envoyer</button></div>`);
    return;
  }

  if (e.target.id === "sendTicket") {
    const msg = $("#ticketMessage").value.trim();
    if (!msg) { toast("Écris un message avant d'envoyer."); return; }
    tickets.unshift({id:1000+tickets.length, subject:$("#ticketSubject").value, message:msg});
    renderLists();
    $("#modal").close();
    toast("Ticket ajouté à cette session.");
    return;
  }

  if (e.target.id === "profileSupport") {
    $("#modal").close();
    toast("Le formulaire de ticket est accessible depuis l'accueil.");
    showTab("home");
    return;
  }

  if (e.target.closest(".close-modal") || e.target.closest(".close-action")) {
    $("#modal").close();
  }
});

$("#search").addEventListener("input", e => {
  const q = e.target.value.toLowerCase().trim();
  const filtered = products.filter(p => `${p.name} ${p.description || ""}`.toLowerCase().includes(q));
  renderProducts("#products", filtered);
});
$("#profileBtn").addEventListener("click", () => showTab("profile"));
if (tg?.initDataUnsafe?.user) {
  const u = tg.initDataUnsafe.user;
  $("#userName").textContent = [u.first_name, u.last_name].filter(Boolean).join(" ") || "Client CryShop";
  $("#userId").textContent = u.username ? `@${u.username}` : `Telegram · ${u.id}`;
}
