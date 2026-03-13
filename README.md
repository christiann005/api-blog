# Full-Stack Blog Application

A simple blog platform built with **Node.js/Express**, **React 19**, and **PostgreSQL** using **Prisma**.

## 🚀 Recent Updates
- **Migration to PostgreSQL:** Replaced MongoDB with PostgreSQL for better data relational management.
- **ORM Transition:** Now using **Prisma 6** for type-safe database queries.
- **Improved Architecture:** Cleaner separation between server logic and database schemas.

## Project Structure
- `server/`: Express API with PostgreSQL (Prisma) + JWT auth.
- `client/`: React frontend built with Vite and TypeScript.

## Getting Started

### 1. Start the Backend
```bash
cd server
npm install
npx prisma generate
npm run dev
```
The server will run on [http://localhost:5000](http://localhost:5000).

**Note:** Ensure you have PostgreSQL installed and a database named `blogdb` created. Configure your `.env` following the `.env.example`.

### 2. Start the Frontend
```bash
cd client
npm install
npm run dev
```
The frontend will run on [http://localhost:5173](http://localhost:5173).

## Features
- List all blog posts with pagination and search.
- View post details.
- User authentication (Register/Login with JWT).
- Role-based access control (User and Admin).
- Full CRUD for blog posts (Owner/Admin only).

## 🗺️ Roadmap
### Phase 1: Core Enhancements
- [ ] Add categories/tags to blog posts.
- [ ] Implement image uploads for post thumbnails using Cloudinary or AWS S3.
- [ ] Add user profile pictures and bio.

### Phase 2: Social Features
- [ ] Comment system for each post.
- [ ] "Like" or "Heart" functionality for posts.
- [ ] Share buttons for social media.

### Phase 3: Advanced
- [ ] Admin Dashboard for user management and statistics.
- [ ] Full-text search using PostgreSQL indexes.
- [ ] Dark mode toggle for the UI.
- [ ] Deployment guide for Render/Vercel/Heroku.

## API Notes
- `GET /api/posts` supports `?page=1&limit=20&q=search`.
  - Pagination metadata is returned via headers: `X-Total-Count`, `X-Page`, `X-Limit`.
