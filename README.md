<div align="center">

# 🛍️ Trendora Trends

### Premium Children's Clothing E-Commerce Platform

*Full-stack web application for discovering, browsing, and purchasing premium children's clothing — with a complete admin dashboard for managing every aspect of the store.*

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express_4-000000?style=for-the-badge&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Data Models](#-data-models)
- [Payment Flow](#-payment-flow)
- [Admin Dashboard](#-admin-dashboard)
- [Security](#-security)

---

## 🌟 Overview

Trendora Trends is a full-stack e-commerce platform specialising in premium children's clothing. It supports end-to-end retail operations — from product discovery and cart management to Razorpay payment processing, order tracking, customer reviews, and a feature-rich admin dashboard.

**Architecture:** React SPA (client) + Node.js/Express REST API (server) in a monorepo layout.

---

## ✨ Features

### Customer-Facing
- 🏠 **Homepage** — Hero section, best sellers, new arrivals, featured categories, customer reviews
- 🗂️ **Collections** — Browse by age group (Newborn → Pre-Teen) or category (Occasion, Party Wear, Designer, Traditional, Fabric)
- 🔍 **Product Detail** — Multi-image gallery, per-colour galleries, size picker, specifications, delivery date, related products
- 🛒 **Cart & Checkout** — Server-synced cart, address management, gift wrapping option, Razorpay payment
- 📦 **Order Tracking** — Real-time tracking status with activity timeline
- 💌 **Gift Orders** — Upload a video message; recipient views it via a unique gift link
- ❤️ **Wishlist** — Server-persisted wishlist
- ⭐ **Reviews** — Post-delivery photo/video reviews; QR-code-based general reviews
- 💬 **Support** — Raise tickets with image/video attachments; live chat support page
- 👤 **Account Hub** — Profile, addresses, order history, reviews, wishlist, policy pages

### Admin Dashboard
- 📬 Contact message management
- 👥 User (admin) management with role-based permissions
- ⭐ Review moderation (approve / unapprove / delete)
- 📦 Product & product detail management (AI-assisted description generation)
- 🧑‍💼 Client (customer) management with stats
- 💳 Payment & order management with tracking updates
- 🎧 Support ticket management
- 🔲 QR code generator for review page

---

## 🛠️ Tech Stack

### Frontend (`/client`)

| Layer | Technology |
|---|---|
| Framework | React 18.2 (functional components + hooks) |
| Build Tool | Vite 4 |
| Routing | react-router-dom v7.13 |
| State | React Context API (CartContext, WishlistContext) |
| Code Splitting | React.lazy + Suspense |
| SEO | react-helmet-async |
| Icons | lucide-react |
| QR Code | qrcode.react, qrcode |
| Screenshot/Export | html2canvas |
| Styling | Per-component CSS modules |

### Backend (`/server`)

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 4 |
| Database | MongoDB + Mongoose 8.3 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| File Uploads | Multer (memory storage) |
| Image Storage | Cloudinary |
| Payments | Razorpay |
| AI | Google Gemini 2.0 Flash |
| Caching | ioredis (Redis) |
| Scheduled Jobs | node-cron |
| Security | helmet, express-rate-limit, CORS |

---

## 📁 Project Structure

```
Clothing-Website/
├── client/                        # React frontend
│   ├── public/                    # Static assets, favicons, sitemap, PWA manifest
│   ├── src/
│   │   ├── App.jsx                # Root router, providers, lazy imports
│   │   ├── main.jsx               # React DOM entry point
│   │   ├── admin/                 # Admin panel (layout, login, 12 views)
│   │   │   ├── layout/
│   │   │   ├── login/
│   │   │   └── views/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── auth/
│   │   │   ├── cart/
│   │   │   ├── collectiondetails/
│   │   │   ├── collections/
│   │   │   ├── homepage/
│   │   │   ├── navbar/
│   │   │   └── sidebar/
│   │   ├── context/               # CartContext, WishlistContext
│   │   ├── hooks/                 # useCartSync, useWishlistSync, useAddressSync
│   │   ├── pages/                 # Page-level components (one per route)
│   │   ├── styles/                # Per-component CSS files
│   │   └── utils/                 # authFetch.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── server/                        # Node.js/Express backend
    ├── server.js                  # App entry — middleware, route mounting
    ├── conf/                      # DB, Cloudinary, Razorpay setup
    │   ├── db.js
    │   ├── cloudinary.js
    │   └── razorpay.js
    ├── models/                    # 10 Mongoose schemas
    ├── controllers/               # 11 business-logic controllers
    ├── routers/                   # 12 Express router files
    ├── middleware/                 # authMiddleware.js, rateLimiter.js
    ├── cronJobs.js                # Scheduled background tasks
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- Razorpay account (test keys work for development)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/trendora-trends.git
cd trendora-trends/Clothing-Website
```

### 2. Install dependencies

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 3. Configure environment variables

Create `.env` files in both `client/` and `server/` directories. See [Environment Variables](#-environment-variables) below for all required keys.

### 4. Run in development

```bash
# Terminal 1 — Start the backend (from /server)
npm run dev

# Terminal 2 — Start the frontend (from /client)
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:5000`.

### 5. Build for production

```bash
# From /client
npm run build
```

---

## 🔐 Environment Variables

### `client/.env`

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Backend API base URL
VITE_BACKEND_URL=http://localhost:5000/api

# Razorpay (public key — safe to expose)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### `server/.env`

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/Clothing-Website

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=30d

# Super-admin seed credentials
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password

# CORS
CLIENT_URL=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

> ⚠️ **Never commit your `.env` files to version control.** Add them to `.gitignore`.

---

## 📡 API Reference

**Base URL:** `/api` — Admin routes require a JWT `adminToken` cookie. Client routes use a `Bearer` token header.

### Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/login` | Public | Admin login — sets httpOnly `adminToken` cookie |
| POST | `/logout` | Public | Clears `adminToken` cookie |
| GET | `/me` | Admin | Returns current admin profile |

### Client Auth — `/api/client-auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Email/password registration |
| POST | `/login` | Public | Email/password login |
| POST | `/google` | Public | Google OAuth login/register |
| POST | `/phone` | Public | Phone OTP login/register |
| POST | `/sync-cart` | Client | Sync cart to server |
| POST | `/sync-wishlist` | Client | Sync wishlist to server |
| GET | `/profile/:uid` | Client | Get customer profile |
| PUT | `/profile/:uid` | Client | Update profile |
| DELETE | `/delete/:uid` | Client | Delete account |
| GET/POST | `/addresses/:uid` | Client | List / add address |
| PUT/DELETE | `/addresses/:uid/:id` | Client | Update / remove address |

### Products — `/api/products`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | Filtered product list |
| GET | `/featured` | Public | Homepage featured sections |
| GET | `/admin` | Admin | Full product list |
| POST | `/` | Admin | Create product + image upload |
| PUT | `/:id` | Admin | Update product |
| DELETE | `/:id` | Admin | Delete product |
| GET/PUT | `/settings/all` | Public/Admin | Site settings |

### Product Details — `/api/product-details`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/:productId` | Public | Detail page data |
| GET | `/admin/:productId` | Admin | Admin read |
| POST | `/admin/:productId` | Admin | Create/replace detail (up to 7 images) |
| DELETE | `/admin/:productId` | Admin | Remove detail + Cloudinary images |

### Payments & Orders — `/api/payment`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/create-order` | Client | Validate stock → create Razorpay order |
| POST | `/verify-payment` | Client | HMAC verify → decrement stock → save order |
| POST | `/calculate-summary` | Client | Preview cart totals |
| POST | `/upload-gift-video` | Public | Upload gift video to Cloudinary |
| GET | `/gift/:hash` | Public | Gift message page data |
| GET | `/orders` | Admin | All orders |
| GET | `/user-orders/:uid` | Client | Customer order history |
| GET | `/orders/:orderId` | Client | Single order detail |
| GET | `/track/:orderId` | Admin/Client | Sync tracking status |
| POST | `/mark-delivered/:id` | Admin | Mark order as delivered |

### Reviews — `/api/product-reviews` & `/api/qr-reviews`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/product-reviews/submit` | Public | Submit review (up to 5 media files) |
| GET | `/product-reviews/product/:id` | Public | Reviews for a product |
| POST | `/qr-reviews/submit` | Public | Submit QR code review |
| GET | `/qr-reviews/approved` | Public | Approved QR reviews for homepage |
| PATCH | `/qr-reviews/admin/:id/approve` | Admin | Approve a review |
| DELETE | `/qr-reviews/admin/:id` | Admin | Delete a review |

### Support — `/api/support`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/submit` | Public | Submit ticket (up to 5 attachments) |
| GET | `/order/:orderId` | Public | Tickets for an order |
| GET | `/admin/issues` | Admin | All tickets |
| PATCH | `/admin/issues/:id` | Admin | Update ticket status |

---

## 🗄️ Data Models

### ClientUser
Registered customer — supports email, Google, and phone login.

```
uids[]         Firebase UIDs (indexed)
customerId     Human-readable ID, e.g. CUST-00001
loginTypes[]   google | phone | email
name, email, phone, photo, gender
addresses[]    Embedded address sub-documents
cart[]         Embedded cart items (productId, size, color, qty)
wishlist[]     Embedded wishlist items
orders[]       Embedded order snapshots
lastSeen       Updated on each interaction
```

### Product
```
name, category[], subCategory[]
price, oldPrice
ageGroup       newborn | infant | toddler | little-girls | kids | pre-teen
colors[]       { name, hex, hexArray, price }
img            Cloudinary URL
badge          "New" | "Sale" | null
stars, reviews Aggregate — recalculated on each review
featuredIn[]   bestSelling | newArrivals | youMightAlsoLike | ...
inventory      Map<size, qty>
stock          Total count
isActive       Soft-delete toggle
```

### Order
```
orderId, displayId   Razorpay ID + human-readable (e.g. ST1001)
paymentId            Set after verification
userId, userName, userEmail
amount, currency     INR
status               pending | success | failed
items[]              Product snapshot at order time
shippingAddress      Address snapshot
trackingStatus       Unshipped | In Transit | Delivered
trackingActivities[] Timeline events
giftWrapping, isGift, giftVideoUrl, giftHash
```

---

## 💳 Payment Flow

```
1. Client → POST /payment/calculate-summary   Preview totals (5% tax + optional gift wrap ₹50)
2. Client → POST /payment/create-order        Server validates stock + creates Razorpay order
3. Browser → Razorpay Checkout               Customer completes payment
4. Razorpay → Client                          Returns order_id, payment_id, signature
5. Client → POST /payment/verify-payment      Server verifies HMAC-SHA256 signature
6. ✅ Match  → Decrement inventory, save Order (status: success), clear cart
7. ❌ No match → Save Order (status: failed) for audit
```

---

## 🖥️ Admin Dashboard

The admin panel (`/admin`) is protected by JWT and role-based access. The super-admin can create additional admin accounts with granular permissions.

| View | What it does |
|---|---|
| Contact Messages | Read and delete customer contact submissions |
| User Management | Create/activate/deactivate admin users, set permissions |
| Review Management | Approve, unapprove, delete QR reviews; view product reviews |
| Review QR Page | Generate a QR code linking to the public review form |
| Product Management | Full product CRUD with image upload, badges, featured sections, inventory |
| Product Detail | Rich editor: 7-image gallery, per-colour galleries, sizes, specs, highlights |
| Client Management | Customer accounts, login-type stats, individual profiles with order history |
| Payment Management | All orders with payment status |
| Order Management | Update tracking, mark delivered, view timeline |
| Support Management | View and resolve customer support tickets |

---

## 🔒 Security

| Layer | Implementation |
|---|---|
| Admin auth | JWT stored in `httpOnly` cookie — prevents XSS theft |
| Client auth | JWT in `Authorization: Bearer` header |
| Password hashing | bcryptjs — cost factor 12 (client), 10 (admin) |
| Ownership checks | `requireOwnership()` — clients can only access their own resources |
| Payment verification | HMAC-SHA256 signature check on every payment callback |
| Rate limiting | General 1000/15min · Auth 500/15min · Admin login 100/15min · Payment 200/15min |
| HTTP headers | `helmet` with custom CSP for Razorpay, Cloudinary, and Google images |
| CORS | Strict origin whitelist from `CLIENT_URL` env variable |
| Role guards | `superAdminOnly()` protects user management and migration endpoints |
| Body size | 50 MB limit on JSON/form-data for high-resolution image payloads |

---

## 📦 File Storage

| Provider | Used For | Size Limit |
|---|---|---|
| **Cloudinary** | Product thumbnails, product detail galleries, support attachments, gift videos | 30–100 MB |

---

<div align="center">

Made with ❤️ for **Trendora Trends**

</div>
