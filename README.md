# Full-Stack Blog Application

A simple blog platform built with Node.js/Express and React.

## Project Structure
- `server/`: Express API with MongoDB (Mongoose) + JWT auth.
- `client/`: React frontend built with Vite and TypeScript.

## Getting Started

### 1. Start the Backend
```bash
cd server
npm install
npm run dev
```
The server will run on [http://localhost:5000](http://localhost:5000).

Create `.env` from `.env.example` (Mongo local default):
```bash
copy .env.example .env
```

#### MongoDB (Recommended: Docker)
From the project root:
```bash
docker compose up -d
```
This exposes MongoDB on `mongodb://127.0.0.1:27017` (matches `.env.example`).

### 2. Start the Frontend
```bash
cd client
npm install
npm run dev
```
The frontend will run on [http://localhost:5173](http://localhost:5173).

## Features
- List all blog posts.
- View post details.
- Register/login (JWT).
- Create/edit/delete posts (requires login; only owner or admin can edit/delete).

## API Notes
- `GET /api/posts` supports `?page=1&limit=20&q=search`.
  - Pagination metadata is returned via headers: `X-Total-Count`, `X-Page`, `X-Limit`.
