# The Nobles Management - Website Prototype

A modern, responsive website prototype for The Nobles Management talent agency.

## Project Structure

```
frontend/
├── public/              # Static files
├── src/
│   ├── assets/         # Images and static assets
│   │   └── images/     # Image files
│   ├── components/     # Reusable React components
│   │   ├── NavBar.jsx
│   │   └── NavBar.css
│   ├── constants/      # Application constants
│   │   ├── colors.js   # Color palette
│   │   ├── routes.js   # Route definitions
│   │   └── index.js
│   ├── layouts/        # Layout components
│   │   ├── MainLayout.jsx
│   │   └── MainLayout.css
│   ├── pages/          # Page components
│   │   ├── HomePage.jsx
│   │   ├── HomePage.css
│   │   ├── ModelsPage.jsx
│   │   └── ModelsPage.css
│   ├── App.js          # Main application component
│   ├── App.css
│   ├── index.js        # Application entry point
│   └── index.css       # Global styles
└── package.json
```

## Features

### Implemented
- ✅ Responsive navigation bar with scroll behavior
- ✅ Homepage with animated scrolling text
- ✅ Talent category showcase (International/Local)
- ✅ Get Scouted call-to-action section
- ✅ Models discovery page with filtering
- ✅ Category navigation (International, Local, Junior)
- ✅ Search functionality (UI only)
- ✅ Mobile-responsive design
- ✅ Professional file structure
- ✅ Constants for colors and routes
- ✅ Reusable layout component

### To Be Implemented
- ⏳ Backend integration
- ⏳ Model data API
- ⏳ Search functionality
- ⏳ Filter functionality
- ⏳ Shopping cart functionality
- ⏳ Get Scouted form
- ⏳ Contact page
- ⏳ Model detail pages
- ⏳ Admin panel

## Technology Stack

- **React** 18.x - UI framework
- **React Router** 6.x - Client-side routing
- **CSS3** - Styling with custom animations
- **Create React App** - Build tooling

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (one-way operation)

## Design System

### Colors
- Primary Purple: `#5B006B`
- Black: `#000000`
- White: `#FFFFFF`
- Light Gray: `#BFBFBF`
- Border Gray: `#DDDDDD`

### Typography
- **Headings**: Helvetica Now Display (800)
- **Navigation**: Arial Narrow (500)
- **Body**: Helvetica

### Responsive Breakpoints
- Desktop: 1024px+
- Tablet: 768px - 1023px
- Mobile: < 768px

## Components

### MainLayout
Reusable layout component that handles:
- Fixed navbar with scroll behavior
- Content padding
- Responsive wrapper

### NavBar
Fixed navigation bar featuring:
- Brand logo (center)
- Category links (International, Local, Junior)
- Action buttons (Get Scouted, Contact)
- Social media links (Instagram)
- Shopping cart icon

### HomePage
Landing page with:
- Animated scrolling text ("MEET OUR TALENT")
- Split-screen talent categories
- Get Scouted CTA section

### ModelsPage
Talent discovery page with:
- Category filters
- Location and sort dropdowns
- Search bar
- Responsive grid layout (5 columns desktop, responsive)

## Code Quality

### Best Practices Implemented
- Semantic HTML5 elements
- Accessible ARIA labels
- Consistent naming conventions
- Component-based architecture
- CSS organization (component-scoped)
- Constants for reusable values
- Responsive design patterns
- Performance optimizations (will-change, transform)

### Performance
- CSS animations using transform/translate for hardware acceleration
- Lazy loading ready (can be implemented for images)
- Optimized re-renders with proper React hooks

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

1. **Backend Integration**
   - REST API or GraphQL
   - Database for model profiles
   - Content Management System

2. **Features**
   - User authentication
   - Booking system
   - Portfolio uploads
   - Admin dashboard
   - Analytics

3. **Performance**
   - Image optimization and lazy loading
   - Code splitting
   - Service worker for offline support

4. **SEO**
   - Meta tags
   - Structured data
   - Sitemap

## License

Proprietary - The Nobles Management © 2025

## Contact

For inquiries: [Instagram @thenoblesmgmt](https://www.instagram.com/thenoblesmgmt/)
