# Thesis Website

A modern, responsive website showcasing your thesis research and findings.

## Getting Started

### Installation

First, install the dependencies:

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

Build the production version:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Adding Your Content

Edit the file `content/thesis-content.ts` to add your thesis information:

1. **Hero Section**: Update title, author, university, date, etc.
2. **Abstract**: Add your abstract text
3. **Introduction**: Add introduction paragraphs (each string in the array becomes a paragraph)
4. **Methodology**: Add methodology content
5. **Results**: Add your results and findings
6. **Conclusions**: Add conclusions and future work
7. **Contact**: Update your contact information

## File Structure

- `app/` - Next.js app directory with pages and components
- `content/` - Content file for easy editing
- `public/` - Static files (PDFs, images, etc.)
  - `Tese_fixed_references.pdf` - Your thesis PDF
  - `Final_Presentation.pptx` - Your presentation file

## Features

- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Smooth scrolling navigation
- ✅ SEO optimized
- ✅ Modern, clean design
- ✅ Easy content management
- ✅ PDF download integration

## Customization

You can customize the design by editing:
- `app/globals.css` - Global styles
- `tailwind.config.ts` - Tailwind configuration
- Individual component files in `app/components/`

## Next Steps

1. Extract content from your presentation slides
2. Update `content/thesis-content.ts` with your research information
3. Add images from your presentation to `public/images/` if needed
4. Customize colors and styling to match your preferences
5. Deploy to Vercel, Netlify, or your preferred hosting platform

