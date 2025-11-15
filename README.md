# AI-Driven API Endpoint Mapper

A sophisticated web application that discovers and visualizes API endpoints through advanced spider crawling, WebAssembly-powered pattern matching, and interactive graph visualization.

![API Endpoint Mapper](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![WebAssembly](https://img.shields.io/badge/WebAssembly-654FF0?style=for-the-badge&logo=webassembly&logoColor=white)

## 🚀 Features

### Core Functionality
- **Advanced Spider Crawling**: Intelligent website crawling with configurable depth and rate limiting
- **WebAssembly Pattern Matching**: High-performance endpoint detection using WASM
- **Interactive Graph Visualization**: Real-time API structure mapping with react-force-graph
- **Security Analysis**: Automated vulnerability detection and risk assessment
- **Export Capabilities**: Generate CSV reports and OpenAPI specifications

### Technical Highlights
- **Rate-Limited Scanning**: Respectful crawling with configurable delays
- **JavaScript Engine**: Puppeteer-based dynamic content analysis
- **Heuristic Detection**: Smart pattern recognition for hidden endpoints
- **Real-time Updates**: Live progress tracking and results streaming
- **Responsive Design**: Modern UI with Tailwind CSS and smooth animations

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Force Graph** - Interactive 3D/2D graph visualization
- **Framer Motion** - Smooth animations
- **Zustand** - State management
- **Lucide React** - Beautiful icons

### Backend
- **Next.js API Routes** - Server-side endpoints
- **Puppeteer** - Headless browser automation
- **Cheerio** - Server-side HTML parsing
- **Rate Limiter Flexible** - Request rate limiting
- **Axios** - HTTP client

### Performance
- **WebAssembly** - Fast pattern matching (JavaScript fallback)
- **Dynamic Imports** - Code splitting for better performance
- **Streaming** - Real-time progress updates

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Chrome/Chromium (for Puppeteer)

### Setup
```bash
# Clone the repository
git clone https://github.com/your-username/api-endpoint-mapper.git
cd api-endpoint-mapper

# Install dependencies
npm install

# Run development server
npm run dev

# Open in browser
open http://localhost:3000
```

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🎯 Usage

### Basic Scanning
1. Enter a domain name (e.g., `example.com`)
2. Configure scan parameters (optional)
3. Click "Scan" to start discovery
4. Monitor real-time progress
5. Explore results in the interactive graph

### Configuration Options
- **Max Depth**: How deep to crawl (1-10 levels)
- **Max Pages**: Maximum pages to scan (10-1000)
- **Crawl Delay**: Time between requests (100-10000ms)
- **Timeout**: Request timeout (5-120 seconds)
- **Respect robots.txt**: Honor site crawling rules
- **Enable JavaScript**: Use headless browser for dynamic content
- **Include External Links**: Follow external domain links

### Results Analysis
- **Interactive Graph**: Visualize API structure and relationships
- **Endpoint Details**: View methods, parameters, and security info
- **Filter & Search**: Find specific endpoints quickly
- **Export Data**: Download CSV or OpenAPI specifications

## 🔒 Security & Ethics

### Security Features
- **Input Validation**: Sanitize all user inputs
- **Rate Limiting**: Prevent abuse and respect servers
- **robots.txt Compliance**: Honor website crawling preferences
- **No Data Storage**: Results are temporary and session-based
- **HTTPS Preferred**: Encourage secure connections

### Ethical Usage
⚠️ **Important**: Only scan domains you own or have explicit permission to test.

This tool is designed for:
- Security research and testing
- API documentation and discovery
- Website architecture analysis
- Educational purposes

## 🚦 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📝 License

This project is licensed under the Apache 2.0 License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Puppeteer](https://pptr.dev/) - Headless Chrome automation
- [React Force Graph](https://github.com/vasturiano/react-force-graph) - Graph visualization
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling

---

**Disclaimer**: This tool is for authorized security research and testing only. Users are responsible for ensuring they have permission to scan target domains.
