# 🏎️ F1GPT - Your AI-Powered Formula 1 Expert

An intelligent chatbot specialized in Formula 1, powered by advanced AI and vector search technology. Built with Next.js, Supabase, and Together AI.



## ✨ Features

- 🤖 **AI-Powered Chat**: Intelligent conversations about F1 using Llama 4 Maverick model
- 🔍 **Vector Search**: RAG (Retrieval-Augmented Generation) for accurate, context-aware responses
- 🔐 **User Authentication**: Secure sign-up/sign-in with email/password and Google OAuth
- 💬 **Chat History**: Save and retrieve your conversation history
- 📱 **Responsive Design**: Beautiful UI that works on all devices
- ⚡ **Real-time Streaming**: See AI responses as they're generated
- 🎨 **Modern UI**: Glassmorphism design with F1-themed colors

## 🚀 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Custom styling with F1 theme

### Backend & Services
- **Supabase** - Authentication and PostgreSQL database
- **Together AI** - LLM (Llama 4) and embeddings (m2-bert)
- **DataStax Astra DB** - Vector database for F1 knowledge
- **Vercel** - Deployment platform

### AI & Data
- **Llama 4 Maverick** - Chat completions
- **m2-bert-80M** - Text embeddings
- **LangChain** - Document processing
- **Puppeteer** - Web scraping for F1 data

## 🛠️ Installation

### Prerequisites
- Node.js 18+ installed
- Supabase account
- Together AI API key
- DataStax Astra DB account

### 1. Clone the repository
```bash
git clone https://github.com/vaibhav-123-4/f1GPT.git
cd f1GPT
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
# Astra DB Configuration
ASTRA_DB_NAMESPACE=default_keyspace
ASTRA_DB_COLLECTION=f1gpt
ASTRA_DB_API_ENDPOINT=your_astra_endpoint
ASTRA_DB_APPLICATION_TOKEN=your_astra_token

# Together AI
TOGETHERAI_API_KEY=your_together_api_key

# Chat API Security
CHATBOT_SECRET_KEY=your_secret_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Set up Supabase

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions on:
- Creating database tables
- Configuring authentication
- Setting up Row Level Security

### 5. Seed the database with F1 data

```bash
npm run seed
```

This will scrape F1 websites and populate the vector database.

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

1. **Sign Up**: Create an account with email/password or Google OAuth
2. **Ask Questions**: Type any F1-related question in the chat
3. **Get Answers**: Receive intelligent, context-aware responses
4. **Chat History**: Your conversations are automatically saved

### Example Questions
- "Who won the 2024 F1 championship?"
- "Tell me about Max Verstappen's career"
- "What are the technical regulations for 2025?"
- "Compare Lewis Hamilton and Michael Schumacher's stats"

## 🏗️ Project Structure

```
f1gpt/
├── app/
│   ├── api/
│   │   ├── chat/          # Main chat endpoint with RAG
│   │   ├── proxy-chat/    # Secure proxy for client requests
│   │   └── chat-history/  # Chat history management
│   ├── auth/              # Authentication pages
│   ├── components/        # React components
│   └── assets/            # Images and static files
├── lib/
│   └── supabase/          # Supabase client utilities
├── scripts/
│   └── loadDb.ts          # Database seeding script
└── public/                # Public assets
```

## 🔐 Authentication

F1GPT supports two authentication methods:

1. **Email/Password**: Traditional signup with email verification
2. **Google OAuth**: One-click sign-in with Google

All user data is securely stored in Supabase with Row Level Security.

## 🎨 Key Features Explained

### RAG (Retrieval-Augmented Generation)
- Converts user questions to embeddings
- Searches vector database for relevant F1 content
- Provides context to LLM for accurate responses

### Streaming Responses
- Real-time response generation
- Shows AI "thinking" process
- Better user experience

### Chat History
- Conversations stored per user
- Organized in sidebar
- Full conversation context maintained

## 📝 API Routes

- `POST /api/proxy-chat` - Client-facing chat endpoint
- `POST /api/chat` - Secured chat with RAG logic
- `GET /api/chat-history` - Fetch user's chat history
- `POST /api/chat-history` - Save conversation
- `GET /auth/callback` - OAuth callback handler
- `POST /auth/signout` - Sign out endpoint

## 🚢 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vaibhav-123-4/f1GPT)

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy!

### Environment Variables for Production
Make sure to set all environment variables in your deployment platform.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.



## 🙏 Acknowledgments

- **Together AI** for LLM infrastructure
- **DataStax Astra DB** for vector database
- **Supabase** for authentication and database
- **Formula1.com** for F1 data
- **Next.js** team for the amazing framework

## 📧 Contact

Built with ❤️ for F1 fans by [Vaibhav](https://github.com/vaibhav-123-4)

---

**Warning**: May cause speed addiction 🏎️💨

