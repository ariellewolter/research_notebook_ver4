# Troubleshooting Guide

This guide covers common issues and their solutions for the Electronic Lab Notebook application.

## 🚨 Common Issues

### 1. Backend Not Starting

**Symptoms:**
- Electron shows "Backend failed to become ready" error
- No response from `http://localhost:3001/health`
- Backend process exits immediately

**Solutions:**

#### Check Entry Point
```bash
# Verify the correct entry point is configured
cat apps/backend/package.json | grep "dev"
# Should show: "dev": "ts-node-dev src/server.ts"
```

#### Check Database
```bash
# Verify database exists
ls -la apps/backend/prisma/dev.db

# Regenerate Prisma client if needed
cd apps/backend
pnpm prisma generate
```

#### Check TypeScript Compilation
```bash
# Start backend individually to see errors
cd apps/backend
pnpm dev
```

### 2. Frontend Compilation Errors

**Symptoms:**
- Vite shows compilation errors
- Missing API exports
- TypeScript type errors

**Solutions:**

#### Check API Exports
```bash
# Verify all API exports are present
cat apps/frontend/src/services/api/index.ts
```

#### Check Dependencies
```bash
# Reinstall dependencies
pnpm install

# Clear cache
pnpm store prune
```

### 3. Electron Window Issues

**Symptoms:**
- White screen or error page
- Window doesn't load
- Backend connection errors

**Solutions:**

#### Check Health Endpoint
```bash
# Verify backend health endpoint
curl http://localhost:3001/health
# Should return: {"status":"OK","timestamp":"..."}
```

#### Check Port Conflicts
```bash
# Check what's using port 3001
lsof -i :3001

# Check what's using port 5173
lsof -i :5173
```

### 4. Type Mismatch Errors

**Symptoms:**
- TypeScript compilation errors
- "Property does not exist" errors
- Date type mismatches

**Solutions:**

#### Check Prisma Schema
```bash
# Verify schema matches types
cat apps/backend/prisma/schema.prisma
```

#### Regenerate Types
```bash
cd apps/backend
pnpm prisma generate
```

## 🔧 Debugging Steps

### 1. Check All Services
```bash
# Check running processes
ps aux | grep -E "(ts-node|vite|electron)" | grep -v grep

# Check listening ports
lsof -i | grep node | grep LISTEN
```

### 2. Check Logs
```bash
# Backend logs
cd apps/backend && pnpm dev

# Frontend logs
cd apps/frontend && pnpm dev

# Electron logs
cd electron && pnpm dev
```

### 3. Verify Environment
```bash
# Check Node.js version
node --version

# Check pnpm version
pnpm --version

# Check if all dependencies are installed
pnpm list --depth=0
```

## 🛠️ Reset Procedures

### Complete Reset
```bash
# Stop all processes
pkill -f "pnpm.*dev"
pkill -f "electron"
pkill -f "vite"
pkill -f "ts-node"

# Clear node_modules
rm -rf node_modules
rm -rf apps/*/node_modules

# Reinstall dependencies
pnpm install

# Regenerate Prisma client
cd apps/backend
pnpm prisma generate

# Start fresh
pnpm start
```

### Database Reset
```bash
cd apps/backend

# Reset database
rm -f prisma/dev.db

# Run migrations
pnpm prisma migrate dev

# Generate client
pnpm prisma generate
```

## 📋 Health Check Checklist

Before reporting issues, verify:

- [ ] Node.js 18+ installed
- [ ] pnpm package manager installed
- [ ] All dependencies installed (`pnpm install`)
- [ ] Database exists and is accessible
- [ ] No port conflicts (3001, 5173)
- [ ] TypeScript compilation successful
- [ ] Backend health endpoint responding
- [ ] Frontend Vite server running
- [ ] Electron can connect to backend

## 🆘 Getting Help

If you're still experiencing issues:

1. **Check the logs** - Look for specific error messages
2. **Review this guide** - Ensure you've tried all relevant solutions
3. **Check the implementation docs** - [Implementation Guide](implementation/README.md)
4. **Create a detailed issue report** with:
   - Error messages
   - Steps to reproduce
   - Environment details
   - Logs from all services

## 🔍 Common Error Messages

### "Backend failed to become ready"
- Backend isn't starting properly
- Check backend logs for compilation errors
- Verify database connection

### "Cannot GET /api/health"
- Wrong health endpoint URL
- Should be `/health`, not `/api/health`
- Check Electron configuration

### "Property does not exist"
- TypeScript type mismatch
- Check Prisma schema vs TypeScript types
- Regenerate Prisma client

### "Module not found"
- Missing dependencies
- Run `pnpm install`
- Check import paths

## 📞 Support

For additional help:
1. Review the [Implementation Documentation](implementation/README.md)
2. Check the [Developer Guide](../DEVELOPER_GUIDE.md)
3. Create an issue with detailed information 