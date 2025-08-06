# Room Booking Calendar Application

## Overview

This is a full-stack room booking calendar application built with React and Express. The application provides an interactive calendar interface for managing room reservations with drag-and-drop date selection, real-time booking conflict detection, and a comprehensive booking management system. Users can view room availability, create new bookings, and manage existing reservations through an intuitive calendar grid that displays bookings with color-coded room indicators.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Modern component-based architecture using functional components and hooks
- **Vite Build System**: Fast development server and optimized production builds
- **shadcn/ui Components**: Comprehensive UI component library built on Radix UI primitives with Tailwind CSS styling
- **TanStack Query**: Server state management for API calls, caching, and data synchronization
- **Wouter Routing**: Lightweight client-side routing solution
- **Form Management**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Express.js Server**: RESTful API with middleware for logging and error handling
- **Memory Storage Layer**: In-memory data storage with abstract storage interface for easy database migration
- **Type-Safe Schema**: Shared TypeScript types between frontend and backend using Drizzle ORM schema definitions
- **Development Integration**: Hot module replacement and development middleware for seamless development experience

### Calendar System Design
- **Interactive Calendar Grid**: Custom calendar component with drag-to-select date ranges
- **Booking Conflict Detection**: Real-time validation to prevent overlapping reservations
- **Color-Coded Rooms**: Visual room identification with customizable color schemes
- **Responsive Layout**: Mobile-first design with adaptive grid layouts

### Data Layer Architecture
- **Drizzle ORM Schema**: Type-safe database schema definitions with PostgreSQL dialect support
- **Zod Validation**: Runtime type checking and validation for API requests
- **Abstract Storage Interface**: Modular storage layer allowing easy switching between memory and database storage
- **Type Generation**: Automated TypeScript type generation from database schema

### Styling Architecture
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **CSS Variables**: Theme-based color system supporting light/dark modes
- **Component Variants**: Class Variance Authority for consistent component styling
- **Design Tokens**: Centralized design system with consistent spacing, colors, and typography

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18 with TypeScript support, React DOM, and development tools
- **Express.js**: Web application framework with middleware support for API development
- **Vite**: Next-generation frontend build tool with plugin ecosystem

### Database and ORM
- **Drizzle ORM**: Type-safe ORM with PostgreSQL support and schema migrations
- **Drizzle Kit**: Migration management and database tooling
- **Neon Database**: Serverless PostgreSQL database integration (configured but using memory storage in development)

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework with PostCSS processing
- **Radix UI**: Unstyled accessible UI primitives for complex components
- **shadcn/ui**: Pre-built component library with consistent design patterns
- **Lucide React**: Modern icon library with React components

### Form and Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation for runtime type checking
- **Hookform Resolvers**: Integration layer between React Hook Form and Zod

### State Management
- **TanStack Query**: Server state management with caching, synchronization, and background updates
- **React Context**: Client state management for UI state and user preferences

### Development Tools
- **TypeScript**: Static type checking and enhanced developer experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **tsx**: TypeScript execution environment for development server
- **Replit Integration**: Development environment integration with runtime error handling

### Utility Libraries
- **date-fns**: Modern JavaScript date utility library for calendar operations
- **clsx**: Conditional className utility for dynamic styling
- **nanoid**: URL-safe unique ID generator for client-side ID generation
- **class-variance-authority**: Component variant management for consistent styling