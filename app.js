const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }
const $ = s => document.querySelector(s);
const products = [
 {id:1,name:"Pack Starter",desc:"Pack numérique essentiel",price:9.90,icon:"📦",cat:"Packs"},
 {id:2,name:"Licence Pro",desc:"Licence numérique",price:19.90,icon:"🔑",cat:"Licences"},
 {id:3,name:"Abonnement Plus",desc:"Accès numérique",price:14.90,icon:"⚡",cat:"Abonnements"},
 {id:4,name:"Kit Créateur",desc:"Ressources téléchargeables",price:24.90,icon:"🎨",cat:"Fichiers"}
];
let balance=0, orders=[], topups=[], tickets=[], filter="Tous";
const money=n=>n.toLocaleString("fr-FR",{style:"currency",currency:"EUR"});
function renderProducts(target, list=products){$(target).innerHTML=list.map(p=>`<article class="product-card"><div class="product-art">${p.icon}</div><div class="product-info"><b>${p.name}</b><small>${p.desc}</small><div class="product-bottom"><span class="price">${money(p.price)}</span><button class="buy-mini" data-buy="${p.id}">Acheter</button></div></div></article>`).join("")||'<div class="empty-state">Aucun produit trouvé.</div>'}
function updateBalance(){$("#balance").textContent=money(balance)}
function showTab(tab){
 document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
 $("#homeHighlights").classList.toggle("hidden",tab!=="home");
 if(tab!=="home") $(`#${tab}Page`).classList.remove("hidden");
 document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
 window.scrollTo({top:0,behavior:"smooth"});
}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400)}
function modal(html){$("#modalContent").innerHTML=html;$("#modal").showModal()}
function renderLists(){
 $("#orders").innerHTML=orders.length?orders.map(o=>`<div class="row-item"><span>${o.name}<br><small>${o.date}</small></span><b class="status">Livraison démo</b></div>`).join(""):'<div class="empty-state">Tu n\'as pas encore de commande.</div>';
 $("#topups").innerHTML=topups.length?topups.map(t=>`<div class="row-item"><span>${t.method} · ${money(t.amount)}</span><b class="status">${t.status}</b></div>`).join(""):'<div class="empty-state">Aucune recharge pour le moment.</div>';
 $("#tickets").innerHTML=tickets.length?tickets.map(t=>`<div class="row-item"><span>#${t.id} · ${t.subject}<br><small>${t.message}</small></span><b class="status">Ouvert</b></div>`).join(""):'<div class="empty-state">Aucun ticket ouvert.</div>';
}
renderProducts("#featured");renderProducts("#products");updateBalance();
const cats=["Tous",...new Set(products.map(p=>p.cat))];
$("#filters").innerHTML=cats.map(c=>`<button class="filter ${c==="Tous"?"active":""}" data-filter="${c}">${c}</button>`).join("");
document.addEventListener("click",e=>{
 const tab=e.target.closest("[data-tab]")?.dataset.tab||e.target.closest("[data-go]")?.dataset.go;
 if(tab){showTab(tab);return}
 const f=e.target.closest("[data-filter]");if(f){filter=f.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===f));renderProducts("#products",filter==="Tous"?products:products.filter(p=>p.cat===filter));return}
 const amt=e.target.closest("[data-amount]");if(amt){$("#amount").value=amt.dataset.amount;return}
 const buy=e.target.closest("[data-buy]");if(buy){const p=products.find(x=>x.id===+buy.dataset.buy);modal(`<h2 class="modal-title">${p.icon} ${p.name}</h2><p class="modal-copy">${p.desc}<br><b class="price">${money(p.price)}</b></p><p class="modal-copy">Confirmer l'achat avec ton portefeuille ?</p><div class="modal-actions"><button class="secondary-button close-action">Annuler</button><button class="primary-button" id="confirmBuy" data-id="${p.id}">Confirmer</button></div>`);return}
 const pay=e.target.closest("[data-payment]");if(pay){const amount=Number($("#amount").value);if(!amount||amount<5){toast("Entre un montant valide (minimum 5 €).");return}const method=pay.dataset.payment;
 if(method==="crypto"){modal(`<h2 class="modal-title">Paiement crypto</h2><p class="modal-copy">Montant demandé : <b>${money(amount)}</b><br>Choisis une devise :</p><select class="field" id="coin"><option>BTC</option><option>ETH</option><option>SOL</option><option>LTC</option></select><p class="tiny-note">En production, cette étape affichera l'adresse et le QR code de paiement, puis vérifiera la transaction sur la blockchain.</p><div class="modal-actions"><button class="secondary-button close-action">Annuler</button><button class="primary-button" id="cryptoRequest">Créer la demande</button></div>`)}
 else modal(`<h2 class="modal-title">Recharge PayPal</h2><p class="modal-copy">Montant : <b>${money(amount)}</b><br>Effectue le paiement via les instructions PayPal de la boutique, puis joins ta preuve pour vérification par l'administrateur.</p><input class="field" id="proof" type="file" accept="image/*"><input class="field" id="reference" placeholder="Référence de paiement (facultatif)" style="margin-top:9px"><div class="modal-actions"><button class="secondary-button close-action">Annuler</button><button class="primary-button" id="paypalRequest">Envoyer la preuve</button></div>`);
 return}
 if(e.target.id==="confirmBuy"){const p=products.find(x=>x.id===+e.target.dataset.id);if(balance<p.price){$("#modal").close();toast("Solde insuffisant. Recharge ton portefeuille.");showTab("wallet");return}balance-=p.price;orders.unshift({name:p.name,date:new Date().toLocaleString("fr-FR")});updateBalance();renderLists();$("#modal").close();toast("Commande créée ! Livraison démo.");return}
 if(e.target.id==="cryptoRequest"||e.target.id==="paypalRequest"){const method=e.target.id==="cryptoRequest"?"Crypto "+$("#coin").value:"PayPal";if(e.target.id==="paypalRequest"&&!$("#proof").files.length){toast("Ajoute une capture de paiement.");return}topups.unshift({method,amount:Number($("#amount").value),status:"En attente"});renderLists();$("#modal").close();toast("Demande envoyée pour vérification.");return}
 if(e.target.id==="openTicket"){modal(`<h2 class="modal-title">Ouvrir un ticket</h2><p class="modal-copy">Décris ton problème, le support te répondra ici.</p><select id="ticketSubject" class="field"><option>Question sur une commande</option><option>Problème de recharge</option><option>Produit reçu</option><option>Autre demande</option></select><textarea id="ticketMessage" class="field" rows="4" placeholder="Ton message…" style="margin-top:9px;resize:vertical"></textarea><div class="modal-actions"><button class="secondary-button close-action">Annuler</button><button class="primary-button" id="sendTicket">Envoyer</button></div>`);return}
 if(e.target.id==="sendTicket"){const msg=$("#ticketMessage").value.trim();if(!msg){toast("Écris un message avant d'envoyer.");return}tickets.unshift({id:1000+tickets.length,subject:$("#ticketSubject").value,message:msg});renderLists();$("#modal").close();toast("Ticket créé avec succès.");return}
 if(e.target.closest(".close-modal")||e.target.closest(".close-action"))$("#modal").close();
});
$("#search").addEventListener("input",e=>renderProducts("#products",products.filter(p=>(p.name+" "+p.desc).toLowerCase().includes(e.target.value.toLowerCase()))));
$("#profileBtn").addEventListener("click",()=>showTab("profile"));
if(tg?.initDataUnsafe?.user){const u=tg.initDataUnsafe.user;$("#userName").textContent=[u.first_name,u.last_name].filter(Boolean).join(" ")||"Client CryShop";$("#userId").textContent="@"+(u.username||"Telegram");}
