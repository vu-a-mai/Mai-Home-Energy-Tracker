# ⚡ Mai Home Energy Tracker

A modern, full-stack web application for tracking household energy consumption, managing devices, and splitting electricity bills fairly among family members.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

---

## 🌟 Features

### 📊 **Energy Tracking**
- Track energy usage by device with precise kWh calculations
- Monitor costs in real-time with time-of-use rate calculations
- Log energy sessions with start/end times
- View historical usage patterns and trends

### 🏠 **Device Management**
- Add and manage household devices (29 device types)
- Track device wattage and location (23 locations)
- Categorize devices as shared or personal
- Visual device icons for easy identification

### 💰 **Bill Splitting**
- Fair cost allocation based on actual usage
- Automatic calculation of personal vs shared costs
- Detailed breakdown per household member
- Save and track historical bill splits

### 📈 **Analytics & Insights**
- Interactive charts (weekly, monthly, device usage)
- Rate period breakdown (Off-Peak, Mid-Peak, On-Peak)
- Personal usage analytics
- Household summary and comparisons

### 🎭 **Demo Mode**
- Explore the app without authentication
- Pre-populated with realistic demo data
- Perfect for testing and demonstrations

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- Supabase account (for live mode)

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mai-home-energy-tracker.git
   cd mai-home-energy-tracker
   ```

2. **Install dependencies**
   ```bash
   cd web
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **Setup**: [Supabase Setup Guide](docs/setup/SUPABASE_SETUP_GUIDE.md)
- **Features**: [Demo Mode](docs/features/DEMO_MODE_GUIDE.md), [Bill Split](docs/features/BILL_SPLIT_CALCULATION.md)
- **Development**: [Project Progress](docs/development/PROJECT_PROGRESS.md)

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Recharts
- **Backend**: Supabase (PostgreSQL + Authentication)
- **Deployment**: Vercel

---

## 🚀 Deployment to Vercel

1. Push to GitHub
2. Import repository to Vercel
3. Set root directory to `web`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy!

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for sustainable energy tracking**
