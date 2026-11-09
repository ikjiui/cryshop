# CryShop — prototype Mini App Telegram

Prototype front-end responsive pour une boutique de produits numériques.

## Lancer en local
Ouvre `index.html` dans un navigateur ou sers le dossier avec un serveur HTTP local.

## Contenu
- Accueil et catalogue de démonstration
- Portefeuille et demandes de recharge simulées
- Parcours crypto BTC / ETH / SOL / LTC
- Parcours PayPal avec ajout d'une preuve (simulation)
- Commandes et tickets de support
- Détection du profil Telegram WebApp si ouvert depuis Telegram

## Important avant une mise en production
Cette version est une maquette interactive côté navigateur : elle n'encaisse aucun paiement, ne crédite pas réellement de solde et ne livre aucun produit réel. Les données sont temporaires et disparaissent au rechargement.

Pour une version réelle, ajouter :
1. Backend sécurisé (ex. Node.js) et base de données.
2. Vérification serveur de `Telegram.WebApp.initData` — ne jamais faire confiance au seul `initDataUnsafe`.
3. Paiements crypto avec génération d'adresses/ordres et confirmation blockchain côté serveur.
4. PayPal avec configuration administrateur, preuve téléversée de façon sécurisée et vérification du paiement dans le compte PayPal avant crédit.
5. Stock de codes/fichiers et livraison atomique après paiement confirmé.
6. Authentification et autorisations admin côté serveur, stockage privé des preuves et journal d'audit.
7. HTTPS et URL publique pour le bouton Mini App de BotFather.

Ne jamais stocker le token du bot dans le code front-end. Le token doit rester dans une variable d'environnement côté serveur.
