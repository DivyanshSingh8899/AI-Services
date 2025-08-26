# AI Hub - AI-Powered Solutions for Small Businesses

A modern, responsive website showcasing AI solutions for small businesses, with a dedicated product page for the AI Customer Support Bot.

## 🚀 Features

### Main Website
- **Homepage** with hero section and service overview
- **Navigation** with dropdown menu for products
- **Responsive design** optimized for all devices
- **Modern UI/UX** with smooth animations

### AI Support Bot Product Page
- **Hero Section** with compelling headline and CTA buttons
- **Problem + Solution** section explaining the business case
- **Features** showcasing bot capabilities
- **Pricing** with three tiers (Starter, Pro, Business)
- **How It Works** timeline showing 4-week implementation
- **Testimonials** from satisfied customers
- **Call-to-Action** sections throughout

### Contact Page
- **Contact form** for demo booking and inquiries
- **Business information** and contact details
- **FAQ section** addressing common questions

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 + TypeScript
- **Styling**: TailwindCSS + custom CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **UI Components**: Custom components with shadcn/ui patterns
- **Responsive**: Mobile-first design approach

## 📁 Project Structure

```
ai-hub/
├── src/
│   ├── app/
│   │   ├── globals.css          # Global styles and TailwindCSS
│   │   ├── layout.tsx           # Root layout component
│   │   ├── page.tsx             # Homepage
│   │   ├── ai-support-bot/      # AI Support Bot product page
│   │   │   └── page.tsx
│   │   └── contact/             # Contact page
│   │       └── page.tsx
│   └── components/
│       └── Navigation.tsx       # Main navigation component
├── package.json                  # Dependencies and scripts
├── tailwind.config.js           # TailwindCSS configuration
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 🎨 Design Features

### Color Scheme
- **Primary**: Blue gradient (#3B82F6 to #8B5CF6)
- **Background**: Subtle gradient backgrounds
- **Text**: Dark grays for readability
- **Accents**: Blue and purple variations

### Animations
- **Framer Motion** for smooth page transitions
- **Scroll-triggered animations** for better engagement
- **Hover effects** on interactive elements
- **Staggered animations** for lists and grids

### Responsive Design
- **Mobile-first** approach
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Flexible grids** that adapt to screen sizes
- **Touch-friendly** buttons and interactions

## 📱 Pages Overview

### Homepage (`/`)
- Hero section with main value proposition
- Services overview (AI Support Bot, AI Automation, AI Analytics)
- Features highlighting business benefits
- Call-to-action for getting started

### AI Support Bot (`/ai-support-bot`)
- **Hero**: "24/7 AI Customer Support for Small Businesses 🚀"
- **Problem/Solution**: Clear business case presentation
- **Features**: 6 key capabilities with icons
- **Pricing**: 3 tiers with setup fees
- **Timeline**: 4-week implementation process
- **Testimonials**: Real customer success stories
- **CTA**: Multiple conversion points

### Contact (`/contact`)
- Comprehensive contact form
- Business information and contact details
- FAQ section for common questions
- Demo booking functionality

## 🔧 Customization

### Adding New Products
1. Create a new directory in `src/app/`
2. Add the route to the navigation in `Navigation.tsx`
3. Follow the same structure as the AI Support Bot page

### Styling Changes
- Modify `src/app/globals.css` for global styles
- Update `tailwind.config.js` for custom colors and animations
- Use the existing component patterns for consistency

### Content Updates
- All content is stored in the component files
- Easy to modify text, pricing, and features
- Update testimonials and case studies as needed

## 📊 Performance Features

- **Next.js 14** with App Router for optimal performance
- **Image optimization** with Next.js Image component
- **Code splitting** for better loading times
- **Responsive images** for different screen sizes
- **Lazy loading** for better user experience

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Vercel will automatically detect Next.js
3. Deploy with zero configuration

### Other Platforms
- **Netlify**: Use `npm run build` and deploy the `out` directory
- **AWS Amplify**: Connect repository and deploy
- **Traditional hosting**: Build and upload static files

## 📈 SEO & Marketing

### Built-in SEO Features
- **Meta tags** for all pages
- **Structured data** ready for implementation
- **Fast loading** for better search rankings
- **Mobile-friendly** design

### Conversion Optimization
- **Multiple CTAs** throughout the product page
- **Social proof** with testimonials
- **Clear pricing** and value proposition
- **Easy contact** and demo booking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For questions or support:
- **Email**: hello@aihub.com
- **Phone**: +91 98765 43210
- **Business Hours**: Mon-Fri, 9 AM - 6 PM IST

---

**Built with ❤️ for small businesses looking to leverage AI technology**
