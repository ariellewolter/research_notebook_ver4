# 🔧 Troubleshooting Guide

## 🚨 **Current Known Issues**

### **Backend Compilation Errors**

**Problem:** TypeScript compilation errors preventing backend from starting
```
Error: Cannot find module '@prisma/client'
src/routes/search.ts:555:72 - error TS2353: Object literal may only specify known properties
```

**Solutions:**

1. **Use Simple Backend (Recommended for Development):**
   ```bash
   # Start with simple backend (no Prisma compilation issues)
   pnpm start:simple
   
   # Or start backend only with simple app
   pnpm backend:simple
   ```

2. **Fix Prisma Issues:**
   ```bash
   # Generate Prisma client
   pnpm prisma:generate
   
   # Run migrations
   pnpm prisma:migrate
   ```

3. **Check Prisma Schema:**
   - Verify `apps/backend/prisma/schema.prisma` exists
   - Check for syntax errors in schema
   - Ensure database URL is correct

---

## 🖥️ **Electron App Issues**

### **White Screen in Electron**

**Problem:** Electron app shows white screen

**Solutions:**

1. **Check Backend Status:**
   ```bash
   curl http://localhost:3000
   # Should return JSON response
   ```

2. **Check Frontend Status:**
   ```bash
   curl http://localhost:5173
   # Should return HTML
   ```

3. **Use Simple Backend:**
   ```bash
   # Stop current processes and restart with simple backend
   pnpm start:simple
   ```

4. **Check Console Logs:**
   - Open Electron DevTools (Ctrl+Shift+I / Cmd+Option+I)
   - Check for JavaScript errors
   - Look for network request failures

### **File Handler Not Working**

**Problem:** Double-clicking PDF files doesn't open in Research Notebook

**Solutions:**

1. **Build and Install App:**
   ```bash
   pnpm electron:package
   # Install the generated app
   ```

2. **Check File Associations:**
   - Windows: Check Default Apps settings
   - macOS: Check file associations in Finder
   - Linux: Check .desktop file associations

3. **Test File Handler:**
   ```bash
   # Test manually
   open -a "Research Notebook" /path/to/test.pdf
   ```

---

## 🔧 **Development Issues**

### **Dependencies Not Found**

**Problem:** Module resolution errors

**Solutions:**

1. **Reinstall Dependencies:**
   ```bash
   rm -rf node_modules
   pnpm install
   ```

2. **Clear Cache:**
   ```bash
   pnpm store prune
   pnpm install
   ```

### **Port Conflicts**

**Problem:** Port 3000 or 5173 already in use

**Solutions:**

1. **Find and Kill Process:**
   ```bash
   # Find process using port
   lsof -i :3000
   lsof -i :5173
   
   # Kill process
   kill -9 <PID>
   ```

2. **Use Different Ports:**
   ```bash
   # Set custom ports
   PORT=3001 pnpm backend:start
   VITE_PORT=5174 pnpm dev:frontend
   ```

---

## 📊 **Database Issues**

### **Prisma Migration Errors**

**Problem:** Database migration failures

**Solutions:**

1. **Reset Database:**
   ```bash
   cd apps/backend
   rm prisma/dev.db
   pnpm exec prisma migrate dev --name init
   ```

2. **Check Schema:**
   ```bash
   pnpm exec prisma validate
   ```

3. **Generate Client:**
   ```bash
   pnpm prisma:generate
   ```

---

## 🚀 **Performance Issues**

### **Slow App Startup**

**Problem:** App takes long time to start

**Solutions:**

1. **Use Simple Backend:**
   ```bash
   pnpm start:simple
   ```

2. **Disable Backend (Frontend Only):**
   ```bash
   pnpm dev:frontend
   # Access at http://localhost:5173
   ```

3. **Check System Resources:**
   - Monitor CPU and memory usage
   - Close unnecessary applications

---

## 🔍 **Debug Commands**

### **Check Service Status**
```bash
# Backend health
curl http://localhost:3000/api/health

# Frontend status
curl http://localhost:5173

# Simple backend status
curl http://localhost:4000
```

### **Check Logs**
```bash
# Electron logs
# Check console output when running pnpm electron:dev

# Backend logs
# Check terminal output when running pnpm backend:start

# Frontend logs
# Check browser console (F12)
```

### **Test File Operations**
```bash
# Test file handler
open -a "Research Notebook" /path/to/test.pdf

# Test file associations
file /path/to/test.pdf
```

---

## 📞 **Getting Help**

### **Before Asking for Help**

1. **Check this troubleshooting guide**
2. **Try the simple backend solution**
3. **Check console logs for specific errors**
4. **Verify all dependencies are installed**

### **Information to Provide**

When reporting issues, include:

1. **Operating System:** Windows/macOS/Linux version
2. **Node.js Version:** `node --version`
3. **pnpm Version:** `pnpm --version`
4. **Error Messages:** Full error output
5. **Steps to Reproduce:** Detailed steps
6. **Console Logs:** Relevant log output

### **Common Solutions Summary**

| Issue | Quick Fix |
|-------|-----------|
| Backend won't start | `pnpm start:simple` |
| White screen in Electron | Check if backend is running on port 3000 |
| File handler not working | Build and install app with `pnpm electron:package` |
| Prisma errors | `pnpm prisma:generate` |
| Port conflicts | Kill existing processes or use different ports |
| Dependencies missing | `rm -rf node_modules && pnpm install` |

---

## 🎯 **Recommended Development Workflow**

### **For Quick Development:**
```bash
# Use simple backend to avoid compilation issues
pnpm start:simple
```

### **For Full Features:**
```bash
# Fix Prisma issues first
pnpm prisma:generate
pnpm prisma:migrate

# Then start full stack
pnpm start
```

### **For Testing Desktop Features:**
```bash
# Build and package app
pnpm electron:package

# Install and test file handler
# Double-click PDF files to test
``` 