# Artificial Guruji - AI-Powered Learning Management System

A modern, AI-powered Learning Management System built with Next.js that enables users to create personalized courses, generate study materials, build learning roadmaps, and track progress. The platform leverages advanced AI to generate comprehensive educational content including notes, flashcards, quizzes, videos, and interactive learning paths.

## 🚀 Features

### Core Features

- **AI-Powered Course Generation**: Generate complete courses with chapters, notes, flashcards, and quizzes from any topic
- **Learning Roadmaps**: Create structured learning paths with prerequisites, dependencies, and progress tracking
- **Multiple Study Types**: Generate content for Practice, Exam preparation, and Interview preparation
- **Interactive Roadmap Views**:
  - Graph view with visual dependency mapping
  - Timeline view for sequential learning
  - Syllabus view for structured content
- **Video Generation**: AI-generated educational videos with narration and visuals
- **Multi-language Support**: Internationalization support with real-time AI translation
- **Progress Tracking**: Track your learning progress across courses and roadmaps
- **User Authentication**: Secure authentication with Clerk
- **Payment Integration**: Stripe integration for premium features

### Advanced Features

- **AI Roadmap Assistant**: Get personalized guidance and explanations for any topic
- **Topic Explanations**: Comprehensive explanations at beginner, intermediate, and expert levels
- **Resource Curation**: AI-curated learning resources for each topic
- **Project Suggestions**: Hands-on project ideas for practical learning
- **Quiz Generation**: Automated quiz creation with multiple question types
- **Skill Checks**: Verify your understanding before moving to advanced topics

## 🛠️ Tech Stack

### Frontend

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Radix UI** - Accessible component primitives
- **React Flow** - Interactive graph visualizations
- **Remotion** - Video generation and rendering

### Backend & Services

- **Next.js API Routes** - Serverless API endpoints
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** (Neon) - Database
- **Clerk** - Authentication
- **Stripe** - Payment processing
- **Inngest** - Background job processing

### AI & ML

- **OpenAI GPT-4** - Content generation and translations
- **Google Generative AI** - Alternative AI provider
- **AI SDK (Vercel AI)** - AI integration utilities

### Development Tools

- **Drizzle Kit** - Database migrations
- **ESLint** - Code linting
- **TypeScript** - Type checking

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ (recommended: 22+)
- **pnpm** (or npm/yarn)
- **PostgreSQL** database (or Neon account)
- **Git**

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd lms
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   # Database
   NEXT_PUBLIC_DATABASE_URL=postgresql://user:password@host:port/database

   # Authentication (Clerk)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   # OpenAI
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

   # Inngest (optional, for background jobs)
   INNGEST_EVENT_KEY=your_inngest_event_key
   INNGEST_SIGNING_KEY=your_inngest_signing_key

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**

   ```bash
   # Generate migrations (if needed)
   pnpm drizzle-kit generate

   # Run migrations
   pnpm drizzle-kit push
   ```

5. **Run the development server**

   ```bash
   pnpm dev
   # or
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
lms/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── courses/       # Course management endpoints
│   │   ├── roadmaps/      # Roadmap endpoints
│   │   ├── video/         # Video generation endpoints
│   │   └── translate/     # Translation endpoints
│   ├── course/            # Course pages
│   ├── dashboard/         # Dashboard pages
│   ├── roadmaps/          # Roadmap pages
│   └── (auth)/            # Authentication pages
├── components/            # React components
│   ├── Dashboard/         # Dashboard components
│   ├── Roadmap/           # Roadmap components
│   ├── Course/            # Course components
│   └── ui/                # Reusable UI components
├── config/                # Configuration files
│   ├── schema.ts          # Database schema
│   ├── db.ts              # Database connection
│   └── AiModel.ts         # AI model configuration
├── lib/                   # Utility libraries
│   ├── ai/                # AI-related utilities
│   ├── i18n/              # Internationalization
│   ├── roadmap/           # Roadmap utilities
│   └── video/              # Video generation utilities
├── locales/               # Translation files
├── drizzle/               # Database migrations
├── inngest/               # Background job functions
└── public/                 # Static assets
```

## 🎯 Key Features Explained

### Course Generation

Create comprehensive courses by simply entering a topic. The AI generates:

- Structured course layout with chapters
- Detailed notes for each chapter
- Interactive flashcards
- Practice quizzes
- Q&A sections
- Educational videos

### Learning Roadmaps

Build structured learning paths with:

- **Hierarchical Structure**: Levels → Sections → Subtopics
- **Prerequisites Mapping**: Visual dependency graph
- **Progress Tracking**: Track completion status
- **Multiple Views**: Graph, Timeline, and Syllabus views
- **AI Assistant**: Get help and explanations for any topic

### Video Generation

Generate educational videos with:

- AI-written scripts
- Automated narration
- Visual scenes and animations
- Multi-language support

## 🔌 API Endpoints

### Courses

- `POST /api/courses` - Create a new course
- `GET /api/courses` - Get user's courses
- `POST /api/generate-course-outline` - Generate course outline

### Roadmaps

- `POST /api/roadmaps/generate` - Generate a roadmap
- `GET /api/roadmaps/[roadmapId]` - Get roadmap details
- `POST /api/roadmaps/[roadmapId]/progress` - Update progress
- `POST /api/roadmaps/[roadmapId]/assistant` - Chat with roadmap assistant
- `POST /api/roadmaps/[roadmapId]/explain/[topicId]` - Get topic explanation
- `POST /api/roadmaps/[roadmapId]/quiz/[topicId]` - Generate quiz
- `POST /api/roadmaps/[roadmapId]/resources/[topicId]` - Get resources

### Video

- `POST /api/video/generate` - Generate video
- `POST /api/video/render` - Render video
- `GET /api/video/status/[videoId]` - Get video status

## 🌐 Internationalization

The platform supports multiple languages with AI-powered translations:

- English (en) - Source language
- Spanish (es)
- French (fr)
- German (de)
- Portuguese (pt)
- Chinese (zh)
- Japanese (ja)
- Arabic (ar)
- Hindi (hi)

See [I18N_README.md](./I18N_README.md) for detailed i18n setup instructions.

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Ensure all environment variables from `.env.local` are set in your deployment platform.

### Database Setup

For production, use a managed PostgreSQL service like:

- **Neon** (recommended for serverless)
- **Supabase**
- **Railway**
- **AWS RDS**

## 📝 Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm i18n` - Generate translations with Lingo.dev CLI
- `pnpm i18n:watch` - Watch mode for translations

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🆘 Support

For support, please open an issue in the repository or contact the development team.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Clerk](https://clerk.com/) - Authentication
- [OpenAI](https://openai.com/) - AI capabilities
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe database queries
- [Remotion](https://www.remotion.dev/) - Video generation
- [Radix UI](https://www.radix-ui.com/) - Accessible components

---

Built with ❤️ using Next.js and AI
