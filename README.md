# RoofShare - Solar Energy Hackathon Project

A Next.js application for the "Dach für Dach" hackathon focused on democratizing solar energy access in German apartment buildings.

## 🌞 Project Overview

This project addresses the problem that only 1% of apartment buildings in Germany have solar panels, leaving 50% of Germans missing out on affordable, clean energy. We're building digital solutions to make solar energy more transparent, affordable, and engaging for apartment communities.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Start local PostgreSQL database
npm run db:dev

# Run database migrations (in a new terminal)
npm run db:migrate

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Database Management
- **View data**: `npm run db:studio` → [http://localhost:5555](http://localhost:5555)
- **Seed data**: `npm run db:seed`
- **Reset database**: `npm run db:reset`

## 📊 Dataset

The hackathon dataset is located in `/local/Dataset/` with:
- Smart meter data from a 2-tenant building
- Solar PV generation data
- Billing templates and tariff information

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Material-UI v7
- **Backend**: Prisma ORM with PostgreSQL
- **Styling**: Material-UI with custom solar-themed colors
- **Development**: ESLint, TypeScript strict mode

## 📁 Project Structure

```
app/                 # Next.js App Router pages
components/          # Reusable React components
lib/                 # Utility functions (Prisma client)
prisma/              # Database schema and migrations
local/               # Hackathon dataset and documentation
styles/              # Theming and global styles
```

## 🤝 Collaboration

- See `CLAUDE.md` for detailed development guidance
- Use feature branches for new functionality
- Database schema changes require migrations
- Follow existing code patterns and Material-UI theme

## 📋 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run type-check` - TypeScript validation
- `npm run lint` - ESLint code checking

### Database
- `npm run db:dev` - Start local PostgreSQL
- `npm run db:migrate` - Run migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open database GUI
- `npm run db:seed` - Add sample data
- `npm run db:reset` - Reset database
