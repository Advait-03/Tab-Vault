#!/bin/bash

# TabVault Electron Setup Script
# Run this after cloning the repository

echo "🚀 Setting up TabVault Electron Desktop App..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js $(node --version) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed"
echo ""

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo "✓ Prisma client generated"
echo ""

# Seed database
echo "🌱 Seeding database with sample data..."
npm run db:seed
if [ $? -ne 0 ]; then
    echo "❌ Failed to seed database"
    exit 1
fi

echo "✓ Database seeded"
echo ""

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Development: npm run dev:electron"
echo "  2. Build for Windows: npm run build:electron:win"
echo "  3. Build for macOS: npm run build:electron:mac"
echo "  4. Build for Linux: npm run build:electron:linux"
echo ""
echo "See ELECTRON_SETUP.md for detailed instructions."
