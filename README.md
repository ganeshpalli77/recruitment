# 🤖 AI-Powered Recruitment Dashboard

A comprehensive recruitment automation system built with Next.js, Supabase, and shadcn/ui components. This platform automates the first stage of recruitment — collecting resumes, parsing them into structured data, evaluating candidates based on unbiased criteria, and generating shortlists for recruiters.

## ✨ Features

### 🔐 **Authentication System**
- Beautiful login/signup pages with form validation
- Protected routes with middleware
- User session management
- Secure logout functionality

### 💼 **Job Postings Management**
- Create and manage job openings
- Professional TanStack React Table interface
- CRUD operations (Create, Read, Update, Delete)
- Status management (Active, Paused, Closed, Draft)
- Skills tracking and requirements

### 📊 **Candidate Dashboard**
- Real-time metrics and analytics
- AI scoring system display
- Candidate filtering and search
- Performance cards with trending data
- Interactive data visualization

### 🎨 **Premium UI/UX**
- Built with shadcn/ui components
- Responsive design for all devices
- Professional blue theme
- Loading states and error handling
- Glass-morphism effects and gradients

## 🏗️ **Tech Stack**

### **Frontend**
- **Next.js 15** with App Router and TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **TanStack Table** for data display
- **React Hook Form** + Zod for validation

### **Backend**
- **Supabase** for database and authentication
- **PostgreSQL** with Row Level Security
- **Server Actions** for data mutations
- **Middleware** for route protection

### **Development Tools**
- **TypeScript** for type safety
- **ESLint** for code quality
- **Supabase MCP** for database management
- **Context7 MCP** for documentation

## 🗄️ **Database Schema**

### **Tables**
1. **`candidates`** - Candidate information and AI scores
2. **`job_postings`** - Job openings and requirements
3. **`candidate_evaluations`** - AI scoring details
4. **`resume_processing_queue`** - Bulk processing pipeline

### **Security**
- Row Level Security (RLS) enabled
- User-based access control
- Secure authentication policies

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- Supabase account
- Git

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/ganeshpalli12/recruitment.git
   cd recruitment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create `.env.local` file:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - Run the SQL commands from `SETUP_DATABASE.sql` in your Supabase dashboard
   - Or use the provided migration files

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Visit Application**
   Open [http://localhost:3000](http://localhost:3000)

## 📱 **Pages & Routes**

- **`/`** - Home (redirects to dashboard or login)
- **`/login`** - User authentication
- **`/signup`** - Account creation
- **`/dashboard`** - Main recruitment dashboard
- **`/job-postings`** - Job management interface
- **`/job-postings/create`** - Job creation form
- **`/profile`** - User profile information

## 🎯 **Core Functionality**

### **For Recruiters**
- Create and manage job postings
- View candidate applications and AI scores
- Filter and search candidates
- Track recruitment metrics
- Manage application status

### **For System Administrators**
- User management and authentication
- Database monitoring and management
- System analytics and reporting
- Bulk resume processing capabilities

## 🔧 **Configuration**

### **Supabase Setup**
1. Create a Supabase project
2. Run the database migrations
3. Configure authentication settings
4. Set up Row Level Security policies

### **Environment Variables**
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📊 **AI-Powered Features**

### **Bias-Free Candidate Selection**
- AI ignores demographic data (name, gender, age, ethnicity)
- Skills-based evaluation system
- Transparent scoring with detailed breakdowns
- Weighted scoring (skills 40%, experience 35%, education 15%, extras 10%)

### **Scalable Processing**
- Handles 15k-20k resumes efficiently
- Batch processing with job queues
- Asynchronous AI evaluation
- Real-time status updates

## 🛡️ **Security Features**

- **Authentication** - Supabase Auth with email/password
- **Authorization** - Row Level Security policies
- **Data Protection** - Secure API endpoints
- **Session Management** - Secure cookie handling
- **Input Validation** - Form validation and sanitization

## 📈 **Performance Optimizations**

- Server-side rendering for fast initial loads
- Optimized database queries with selective field fetching
- React.memo for component optimization
- Pagination for large datasets
- Loading states for better UX

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License.

## 🙋‍♂️ **Support**

For questions or support, please contact:
- **Email**: thehireflow@gmail.com
- **GitHub**: [ganeshpalli12](https://github.com/ganeshpalli12)

## 🎯 **Vision**

This recruitment dashboard is **Module 1** of a comprehensive AI-powered recruitment automation platform designed to:

- **Automate** the first stage of recruitment
- **Remove bias** from candidate selection
- **Scale efficiently** to handle thousands of applications
- **Provide transparency** in the hiring process
- **Streamline workflows** for recruiting teams

**Built by Utilitarian Labs** - Revolutionizing recruitment through AI and automation.

---

**⭐ Star this repository if you find it helpful!**