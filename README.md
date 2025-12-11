# BookPro - SaaS Booking Canvas

A comprehensive SaaS solution for booking and appointment management, designed to streamline operations for service-based businesses.

## 🚀 Features

- **Public Booking Interface**: intuitive booking flow for clients to select services, dates, and times.
- **Business Dashboard**: robust tools for business owners to manage appointments, services, and settings.
- **Admin Panel**: platform administration and business management.
- **Multi-tenancy**: support for multiple businesses with isolated configurations.
- **Customization**:
  - Brand customization (Logos, Colors).
  - Theming support (Light/Dark mode).
- **Internationalization**: fully localized interface (English & Spanish).
- **Notifications**: automated email notifications for booking confirmations and updates.
- **Service Management**: flexible configuration for service duration, pricing, and availability.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn-ui
- **State Management**: React Query
- **Routing**: React Router
- **I18n**: i18next

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Authentication**: Passport.js (JWT)
- **Email**: Nodemailer
- **Scheduler**: Node Cron

## 🏁 Getting Started

### Prerequisites
- Node.js (v20+)
- npm or yarn
- MongoDB
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_REPO_URL>
   cd saas-booking-canvas
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Configure environment variables
   cp .env.example .env
   # Update .env with your MongoDB URI and other settings
   
   # Start the backend server
   npm run start:dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Start the frontend development server
   npm run dev
   ```

## 🐳 Deployment with Docker

### Backend (NestJS)
- **Build**: `docker build -t bookpro-backend ./backend`
- **Run local**: `docker run --env-file backend/.env -p 3000:3000 bookpro-backend`
- **Render Web Service**:
  - Exposed port: `3000`
  - Environment Variables:
    - `MONGODB_URI`: Your MongoDB connection string
    - `JWT_SECRET`: Secret key for authentication
    - `ALLOWED_ORIGINS`: Comma-separated allowed origins (e.g., `http://localhost:5173,https://bookpro.mx`)
    - `PORT`: `3000`
    - `NODE_ENV`: `production`

### Frontend (Vite)
- **Build**: `docker build -t bookpro-frontend ./frontend`
- **Run local**: `docker run -p 4173:80 -e VITE_API_URL=http://localhost:3000/api bookpro-frontend`
- **Render Web Service (or Static Site)**:
  - Environment Variable: `VITE_API_URL=https://api.bookpro.mx/api`
  - Exposed port: `80`

## 📁 Project Structure

- `frontend/`: React application source code.
- `backend/`: NestJS API application source code.
- `docs/`: Additional documentation and assets.

## 📄 License

This project is licensed under the MIT License.
