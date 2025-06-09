// src/data/localization.js

/**
 * Provides localized text and predefined data for the application.
 * This centralizes content for easy management and potential internationalization.
 */
export const localization = {
  appName: "ReactNexus",
  navLinks: [
    { name: "Home", path: "home", icon: "fas fa-home" },
    { name: "Features", path: "features", icon: "fas fa-star" },
    { name: "Pricing", path: "pricing", icon: "fas fa-dollar-sign" },
    { name: "Contact", path: "contact", icon: "fas fa-envelope" },
  ],
  heroSection: {
    title: "Build Your Web Faster with React & Tailwind",
    subtitle: "Modern, responsive, and beautiful web applications crafted with efficiency.",
    primaryButton: "Get Started",
    secondaryButton: "Learn More",
    imageUrl: "https://placehold.co/1200x800/A0D1EA/FFFFFF?text=Hero+Image", // Placeholder image
  },
  featureSection: {
    title: "Key Features",
    features: [
      {
        icon: "fas fa-mobile-alt",
        title: "Fully Responsive",
        description: "Your application will look stunning on any device, from mobile to desktop.",
      },
      {
        icon: "fas fa-palette",
        title: "Customizable Design",
        description: "Easily adapt the look and feel to match your brand's unique style.",
      },
      {
        icon: "fas fa-code",
        title: "Developer Friendly",
        description: "Clean and modular code for easy maintenance and future expansions.",
      },
      {
        icon: "fas fa-bolt",
        title: "Blazing Fast Performance",
        description: "Optimized for speed to provide the best user experience.",
      },
    ],
  },
  ctaSection: {
    title: "Ready to Start Your Project?",
    subtitle: "Join thousands of satisfied developers building amazing things.",
    button: "Sign Up Now",
  },
  footer: {
    copyright: "© 2024 ReactNexus. All rights reserved.",
    links: [
      { name: "Privacy Policy", path: "privacy" },
      { name: "Terms of Service", path: "terms" },
      { name: "About Us", path: "about" },
    ],
  },
  messageBox: {
    title: "Application Message",
    confirmText: "Confirm",
    cancelText: "Cancel",
  },
};

