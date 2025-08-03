const { spawn } = require('child_process');
const path = require('path');

class BackendSpawner {
    constructor() {
        this.process = null;
        this.isRunning = false;
    }

    /**
     * Spawn the backend server process
     * @param {boolean} isDev - Whether running in development mode
     * @param {string} customPort - Custom port for the backend (optional)
     * @returns {Promise<void>}
     */
    async spawnBackend(isDev = false, customPort = null) {
        if (this.isRunning) {
            console.log('Backend is already running');
            return;
        }

        const backendDir = path.join(__dirname, '..', '..', 'apps', 'backend');
        const port = customPort || process.env.BACKEND_PORT || 3000;

        try {
            if (isDev) {
                // Development mode - use ts-node-dev with simple app to avoid compilation issues
                this.process = spawn('npx', ['ts-node-dev', 'src/simple-app.ts'], {
                    cwd: backendDir,
                    stdio: ['pipe', 'pipe', 'pipe'],
                    env: {
                        ...process.env,
                        PORT: port.toString(),
                        NODE_ENV: 'development'
                    }
                });
            } else {
                // Production mode - use compiled JavaScript
                const compiledPath = path.join(backendDir, 'dist', 'app.js');
                this.process = spawn('node', [compiledPath], {
                    cwd: backendDir,
                    stdio: ['pipe', 'pipe', 'pipe'],
                    env: {
                        ...process.env,
                        PORT: port.toString(),
                        NODE_ENV: 'production'
                    }
                });
            }

            this.isRunning = true;

            // Handle stdout
            this.process.stdout.on('data', (data) => {
                const output = data.toString().trim();
                if (output) {
                    console.log(`[Backend] ${output}`);
                }
            });

            // Handle stderr
            this.process.stderr.on('data', (data) => {
                const output = data.toString().trim();
                if (output) {
                    console.error(`[Backend Error] ${output}`);
                }
            });

            // Handle process close
            this.process.on('close', (code) => {
                console.log(`[Backend] Process exited with code ${code}`);
                this.isRunning = false;
                this.process = null;
            });

            // Handle process error
            this.process.on('error', (error) => {
                console.error('[Backend] Process error:', error);
                this.isRunning = false;
                this.process = null;
            });

            // Wait for backend to start
            await this.waitForBackend(port);

        } catch (error) {
            console.error('[Backend] Failed to spawn backend:', error);
            this.isRunning = false;
            throw error;
        }
    }

    /**
     * Wait for backend to be ready
     * @param {number} port - Backend port
     * @param {number} maxAttempts - Maximum attempts to check
     * @returns {Promise<void>}
     */
    async waitForBackend(port, maxAttempts = 30) {
        const http = require('http');

        for (let i = 0; i < maxAttempts; i++) {
            try {
                await new Promise((resolve, reject) => {
                    const req = http.get(`http://localhost:${port}/api/health`, (res) => {
                        if (res.statusCode === 200) {
                            resolve();
                        } else {
                            reject(new Error(`Backend responded with status ${res.statusCode}`));
                        }
                    });

                    req.on('error', reject);
                    req.setTimeout(1000, () => {
                        req.destroy();
                        reject(new Error('Backend connection timeout'));
                    });
                });

                console.log(`[Backend] Ready on port ${port}`);
                return;
            } catch (error) {
                if (i === maxAttempts - 1) {
                    throw new Error(`Backend failed to start after ${maxAttempts} attempts`);
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    /**
     * Kill the backend process
     */
    killBackend() {
        if (this.process && this.isRunning) {
            console.log('[Backend] Killing backend process...');
            this.process.kill('SIGTERM');

            // Force kill after 5 seconds if still running
            setTimeout(() => {
                if (this.process && this.isRunning) {
                    console.log('[Backend] Force killing backend process...');
                    this.process.kill('SIGKILL');
                }
            }, 5000);

            this.isRunning = false;
            this.process = null;
        }
    }

    /**
     * Check if backend is running
     * @returns {boolean}
     */
    isBackendRunning() {
        return this.isRunning && this.process && !this.process.killed;
    }

    /**
     * Get backend process info
     * @returns {Object|null}
     */
    getBackendInfo() {
        if (!this.process) return null;

        return {
            pid: this.process.pid,
            isRunning: this.isRunning,
            killed: this.process.killed
        };
    }
}

module.exports = BackendSpawner; 