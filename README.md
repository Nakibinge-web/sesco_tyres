# Sesco Tyres — Frontend Redesign Concept

A responsive, multi-page static HTML/CSS/JavaScript redesign using Direction B (clean automotive retail) with navy, white, charcoal and sky-blue accents.

## Pages
- `index.html` — Home, hero, tyre finder, featured products, services, brand story and articles
- `shop.html` — Catalogue, category filters and sort
- `product.html` — Product details (`?id=p1` through `?id=p6`)
- `services.html` and `service-detail.html` — Service overview and detail sections
- `about.html`
- `contact.html` — Frontend-only enquiry form
- `faq.html`
- `blog.html` and `article.html`
- `login.html` and `register.html` — UI only
- `wishlist.html` and `cart.html` — Browser-local demo interactions

## Run it
Open `index.html` in a browser. No build step or backend is required.

## Frontend-only notes
- Cart and wishlist are demo interactions stored in browser `localStorage`.
- Forms show an on-page notice and do not send/store submissions.
- Product names, prices and product imagery are illustrative sample content, not verified live inventory. Replace them with Sesco Tyres' approved product catalogue and images before publishing.
- Images load from Unsplash over the internet; an internet connection is needed for these remote images.
- No real authentication, payment, inventory API, booking, email or order submission is implemented.
- Confirm actual business address, telephone, opening hours, service availability, prices and product stock with Sesco Tyres before publishing.
