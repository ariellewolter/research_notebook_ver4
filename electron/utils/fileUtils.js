const fs = require('fs').promises;
const path = require('path');

/**
 * File Utilities for Electron Main Process
 * Provides safe file operations with comprehensive error handling and logging
 */

/**
 * Save content to a file
 * @param {string} content - The content to write to the file
 * @param {string} filePath - The path where to save the file
 * @returns {Promise<void>}
 */
async function saveFile(content, filePath) {
    try {
        // Ensure the directory exists
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        
        // Write the file
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`✅ File saved successfully: ${filePath}`);
    } catch (error) {
        console.error(`❌ Error saving file ${filePath}:`, error.message);
        throw new Error(`Failed to save file: ${error.message}`);
    }
}

/**
 * Load and parse a JSON file
 * @param {string} filePath - The path to the JSON file
 * @returns {Promise<object>} The parsed JSON data
 */
async function loadJSON(filePath) {
    try {
        // Check if file exists
        try {
            await fs.access(filePath);
        } catch (accessError) {
            console.warn(`⚠️ File does not exist: ${filePath}`);
            return {};
        }
        
        // Read and parse the file
        const data = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(data);
        console.log(`✅ JSON loaded successfully: ${filePath}`);
        return parsed;
    } catch (error) {
        if (error instanceof SyntaxError) {
            console.error(`❌ Invalid JSON in file ${filePath}:`, error.message);
            throw new Error(`Invalid JSON format: ${error.message}`);
        } else {
            console.error(`❌ Error loading JSON file ${filePath}:`, error.message);
            throw new Error(`Failed to load JSON file: ${error.message}`);
        }
    }
}

/**
 * Save data as JSON to a file
 * @param {string} filePath - The path where to save the JSON file
 * @param {object} data - The data to save as JSON
 * @param {object} options - Additional options for saving
 * @param {number} options.indent - Number of spaces for indentation (default: 2)
 * @returns {Promise<void>}
 */
async function saveJSON(filePath, data, options = {}) {
    try {
        const { indent = 2 } = options;
        
        // Ensure the directory exists
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        
        // Stringify the data with pretty formatting
        const jsonContent = JSON.stringify(data, null, indent);
        
        // Write the file
        await fs.writeFile(filePath, jsonContent, 'utf8');
        console.log(`✅ JSON saved successfully: ${filePath}`);
    } catch (error) {
        console.error(`❌ Error saving JSON file ${filePath}:`, error.message);
        throw new Error(`Failed to save JSON file: ${error.message}`);
    }
}

/**
 * Check if a file exists
 * @param {string} filePath - The path to check
 * @returns {Promise<boolean>} True if file exists, false otherwise
 */
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Get file information (size, modification time, etc.)
 * @param {string} filePath - The path to the file
 * @returns {Promise<object>} File information object
 */
async function getFileInfo(filePath) {
    try {
        const stats = await fs.stat(filePath);
        return {
            exists: true,
            size: stats.size,
            modified: stats.mtime,
            created: stats.birthtime,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory()
        };
    } catch (error) {
        return {
            exists: false,
            error: error.message
        };
    }
}

/**
 * Create a backup of a file before modifying it
 * @param {string} filePath - The path to the file to backup
 * @param {string} backupSuffix - Suffix for the backup file (default: '.backup')
 * @returns {Promise<string>} The path to the backup file
 */
async function createBackup(filePath, backupSuffix = '.backup') {
    try {
        const backupPath = `${filePath}${backupSuffix}`;
        await fs.copyFile(filePath, backupPath);
        console.log(`✅ Backup created: ${backupPath}`);
        return backupPath;
    } catch (error) {
        console.error(`❌ Error creating backup for ${filePath}:`, error.message);
        throw new Error(`Failed to create backup: ${error.message}`);
    }
}

/**
 * Safely update a file with atomic write operation
 * @param {string} filePath - The path to the file
 * @param {string} content - The new content
 * @param {boolean} createBackup - Whether to create a backup before updating
 * @returns {Promise<void>}
 */
async function safeUpdateFile(filePath, content, createBackup = true) {
    try {
        // Create backup if requested and file exists
        if (createBackup && await fileExists(filePath)) {
            await createBackup(filePath);
        }
        
        // Ensure directory exists
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        
        // Write to temporary file first, then rename (atomic operation)
        const tempPath = `${filePath}.tmp`;
        await fs.writeFile(tempPath, content, 'utf8');
        await fs.rename(tempPath, filePath);
        
        console.log(`✅ File updated safely: ${filePath}`);
    } catch (error) {
        console.error(`❌ Error updating file ${filePath}:`, error.message);
        throw new Error(`Failed to update file: ${error.message}`);
    }
}

/**
 * Safely update a JSON file with atomic write operation
 * @param {string} filePath - The path to the JSON file
 * @param {object} data - The new data
 * @param {object} options - Additional options
 * @param {number} options.indent - Number of spaces for indentation (default: 2)
 * @param {boolean} options.createBackup - Whether to create a backup before updating (default: true)
 * @returns {Promise<void>}
 */
async function safeUpdateJSON(filePath, data, options = {}) {
    try {
        const { indent = 2, createBackup = true } = options;
        
        // Create backup if requested and file exists
        if (createBackup && await fileExists(filePath)) {
            await createBackup(filePath);
        }
        
        // Ensure directory exists
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        
        // Stringify the data
        const jsonContent = JSON.stringify(data, null, indent);
        
        // Write to temporary file first, then rename (atomic operation)
        const tempPath = `${filePath}.tmp`;
        await fs.writeFile(tempPath, jsonContent, 'utf8');
        await fs.rename(tempPath, filePath);
        
        console.log(`✅ JSON updated safely: ${filePath}`);
    } catch (error) {
        console.error(`❌ Error updating JSON file ${filePath}:`, error.message);
        throw new Error(`Failed to update JSON file: ${error.message}`);
    }
}

/**
 * Read a file as text
 * @param {string} filePath - The path to the file
 * @param {string} encoding - The encoding to use (default: 'utf8')
 * @returns {Promise<string>} The file content
 */
async function readFile(filePath, encoding = 'utf8') {
    try {
        const content = await fs.readFile(filePath, encoding);
        console.log(`✅ File read successfully: ${filePath}`);
        return content;
    } catch (error) {
        console.error(`❌ Error reading file ${filePath}:`, error.message);
        throw new Error(`Failed to read file: ${error.message}`);
    }
}

/**
 * Copy a file to a new location
 * @param {string} sourcePath - The source file path
 * @param {string} destPath - The destination file path
 * @returns {Promise<void>}
 */
async function copyFile(sourcePath, destPath) {
    try {
        // Ensure destination directory exists
        const destDir = path.dirname(destPath);
        await fs.mkdir(destDir, { recursive: true });
        
        await fs.copyFile(sourcePath, destPath);
        console.log(`✅ File copied successfully: ${sourcePath} -> ${destPath}`);
    } catch (error) {
        console.error(`❌ Error copying file ${sourcePath} to ${destPath}:`, error.message);
        throw new Error(`Failed to copy file: ${error.message}`);
    }
}

/**
 * Delete a file
 * @param {string} filePath - The path to the file to delete
 * @returns {Promise<void>}
 */
async function deleteFile(filePath) {
    try {
        await fs.unlink(filePath);
        console.log(`✅ File deleted successfully: ${filePath}`);
    } catch (error) {
        console.error(`❌ Error deleting file ${filePath}:`, error.message);
        throw new Error(`Failed to delete file: ${error.message}`);
    }
}

module.exports = {
    saveFile,
    loadJSON,
    saveJSON,
    fileExists,
    getFileInfo,
    createBackup,
    safeUpdateFile,
    safeUpdateJSON,
    readFile,
    copyFile,
    deleteFile
}; 