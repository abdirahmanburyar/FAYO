# FAYO Healthcare Admin Panel

A modern, responsive admin panel built with Next.js 14, TypeScript, and Tailwind CSS for managing the FAYO Healthcare application.

## 🚀 Features

- **Modern UI/UX**: Built with Tailwind CSS and Framer Motion for smooth animations
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Authentication**: Secure admin login with username/password
- **Real-time Dashboard**: Live statistics and activity monitoring
- **User Management**: Complete user administration capabilities
- **Appointment Management**: Schedule and manage medical appointments
- **Reports & Analytics**: Comprehensive reporting system
- **Settings**: System configuration and preferences

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **UI Components**: Material-UI (MUI)
- **Forms**: React Hook Form + Zod validation
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: Lucide React

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (for containerized deployment)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd web/admin-panel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file:
   ```env
   USER_SERVICE_URL=http://localhost:3001
   NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🐳 Docker Deployment

### Using Docker Compose

1. **Start all services**
   ```bash
   docker-compose up -d
   ```

2. **Access the admin panel**
   - Admin Panel: `http://localhost:3000`
   - User Service: `http://localhost:3001`

### Manual Docker Build

1. **Build the image**
   ```bash
   docker build -t fayo-admin-panel .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 \
     -e USER_SERVICE_URL=http://localhost:3001 \
     -e NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1 \
     fayo-admin-panel
   ```

## 🔐 Admin Authentication

### Default Admin Credentials

- **Username**: `0001`
- **Password**: `admin123`

### Creating New Admin Users

1. **Access the user-service**
   ```bash
   cd services/user-service
   ```

2. **Run the admin creation script**
   ```bash
   npm run create-admin
   ```

3. **Or manually create via API**
   ```bash
   curl -X POST http://localhost:3001/api/v1/auth/admin-login \
     -H "Content-Type: application/json" \
     -d '{"username":"0001","password":"admin123"}'
   ```

## 📁 Project Structure

```
admin-panel/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── api/               # API routes
│   │   ├── login/             # Login page
│   │   └── page.tsx           # Home page (redirects)
│   ├── components/            # Reusable components
│   │   ├── AdminHeader.tsx    # Dashboard header
│   │   └── AdminSidebar.tsx   # Navigation sidebar
│   └── config/                # Configuration files
│       └── api.ts             # API configuration
├── public/                    # Static assets
├── Dockerfile                 # Docker configuration
├── docker-compose.yml         # Docker Compose setup
└── package.json               # Dependencies and scripts
```

## 🎨 UI Components

### Admin Layout
- **Header**: Search, notifications, user menu
- **Sidebar**: Navigation menu with smooth animations
- **Main Content**: Page-specific content with animations

### Dashboard Features
- **Statistics Cards**: Real-time metrics and KPIs
- **Activity Feed**: Recent system activities
- **Quick Actions**: Common administrative tasks
- **Responsive Grid**: Adaptive layout for all screen sizes

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `USER_SERVICE_URL` | Backend user service URL | `http://localhost:3001` |
| `NEXT_PUBLIC_API_URL` | Public API URL | `http://localhost:3001/api/v1` |

### API Endpoints

The admin panel communicates with the following user-service endpoints:

- `POST /auth/admin-login` - Admin authentication
- `GET /users` - User management
- `GET /appointments` - Appointment management
- `GET /reports` - System reports

## 🚀 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Code Style

- **ESLint**: Configured with Next.js recommended rules
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Tailwind CSS**: Utility-first styling

## 🧪 Testing

```bash
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## 📱 Responsive Design

The admin panel is fully responsive and optimized for:

- **Desktop**: 1920px and above
- **Laptop**: 1024px - 1919px
- **Tablet**: 768px - 1023px
- **Mobile**: 320px - 767px

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Admin-only access control
- **Input Validation**: Zod schema validation
- **XSS Protection**: Built-in Next.js security features
- **CSRF Protection**: Cross-site request forgery protection

## 🚀 Performance

- **Next.js 14**: Latest performance optimizations
- **Image Optimization**: Automatic image optimization
- **Code Splitting**: Automatic code splitting
- **Static Generation**: Pre-rendered pages where possible
- **Caching**: Intelligent caching strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is part of the FAYO Healthcare application suite.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.