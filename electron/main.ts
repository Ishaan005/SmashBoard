import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { isDev } from './utils';
import { DatabaseManager } from '../db/database';
import { DBAdapter } from '../db/adapter';
import * as fs from 'fs';
import * as http from 'http';
import * as url from 'url';

class Main {
  private mainWindow: BrowserWindow | null = null;
  private dbAdapter: DBAdapter;
  private server: http.Server | null = null;
  private serverPort: number = 0;

  constructor() {
    // Initialize database
    console.log('Initializing SmashBoard database...');
    this.dbAdapter = new DBAdapter();
  }

  public init(): void {
    app.whenReady().then(async () => {
      if (!isDev) {
        await this.setupLocalServer();
      }
      this.createWindow();
      console.log('SmashBoard application ready!');
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        console.log('💾 Closing database connection...');
        DatabaseManager.getInstance().close();
        if (this.server) {
          this.server.close();
        }
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    this.setupIpcHandlers();
  }

  private setupLocalServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const appPath = app.getAppPath();
      const outPath = path.join(appPath, 'out');
      
      console.log('Setting up local HTTP server for static files');
      console.log(`Serving files from: ${outPath}`);

      this.server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url || '');
        let pathname = parsedUrl.pathname || '/';
        
        // Handle root path
        if (pathname === '/') {
          pathname = '/index.html';
        }
        
        // Handle debug.html specifically
        if (pathname === '/debug.html') {
          const debugPath = path.join(appPath, 'debug.html');
          console.log(`Serving debug.html from: ${debugPath}`);
          
          if (fs.existsSync(debugPath)) {
            const content = fs.readFileSync(debugPath);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
          } else {
            res.writeHead(404);
            res.end('Debug page not found');
          }
          return;
        }
        
        const filePath = path.join(outPath, pathname);
        console.log(`HTTP request: ${req.url} -> ${filePath}`);
        
        // Security check
        if (!filePath.startsWith(outPath)) {
          console.error('Security violation: Path outside of out directory');
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        // Check if file exists
        if (!fs.existsSync(filePath)) {
          console.error(`File not found: ${filePath}`);
          res.writeHead(404);
          res.end('Not Found');
          return;
        }

        // Determine content type
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes: { [key: string]: string } = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon'
        };
        
        const contentType = contentTypes[ext] || 'application/octet-stream';
        
        try {
          const content = fs.readFileSync(filePath);
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        } catch (error) {
          console.error('Error reading file:', error);
          res.writeHead(500);
          res.end('Internal Server Error');
        }
      });

      this.server.listen(0, '127.0.0.1', () => {
        const address = this.server?.address();
        if (address && typeof address === 'object') {
          this.serverPort = address.port;
          console.log(`Local server running on http://127.0.0.1:${this.serverPort}`);
          resolve();
        } else {
          reject(new Error('Failed to start local server'));
        }
      });

      this.server.on('error', (error) => {
        console.error('Server error:', error);
        reject(error);
      });
    });
  }

  private createWindow(): void {
    console.log('Creating Electron window...');
    
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true,
      },
      titleBarStyle: 'default',
      show: false,
      icon: isDev ? undefined : path.join(__dirname, '../public/icon.png'), // Optional app icon
    });

    this.mainWindow.once('ready-to-show', () => {
      console.log('Window ready, showing application');
      this.mainWindow?.show();
      
      if (isDev) {
        console.log('Development mode: Opening DevTools');
        this.mainWindow?.webContents.openDevTools();
      }
    });

    // Load the Next.js application
    let startUrl: string;
    
    if (isDev) {
      startUrl = 'http://localhost:3000';
      console.log('Development mode: Loading from localhost');
    } else {
      // Use local HTTP server
      if (this.serverPort === 0) {
        console.error('❌ Server port is 0! Server may not have started correctly.');
        // Don't try to load anything, let the error handler deal with it
        return;
      }
      
      startUrl = `http://127.0.0.1:${this.serverPort}`;
      
      console.log('Production mode: Loading from local HTTP server');
      console.log(`Start URL: ${startUrl}`);
      
      // Detailed file system check
      const appPath = app.getAppPath();
      console.log('=== File System Debug ===');
      console.log(`App path: ${appPath}`);
      console.log(`Server port: ${this.serverPort}`);
      console.log(`App path exists: ${fs.existsSync(appPath)}`);
      
      if (fs.existsSync(appPath)) {
        const rootFiles = fs.readdirSync(appPath);
        console.log(`Root directory contents (${rootFiles.length} items): ${rootFiles.join(', ')}`);
        
        const outPath = path.join(appPath, 'out');
        console.log(`Out directory path: ${outPath}`);
        console.log(`Out directory exists: ${fs.existsSync(outPath)}`);
        
        if (fs.existsSync(outPath)) {
          const outFiles = fs.readdirSync(outPath);
          console.log(`Out directory contents (${outFiles.length} items): ${outFiles.join(', ')}`);
          
          const indexPath = path.join(outPath, 'index.html');
          console.log(`Index.html exists: ${fs.existsSync(indexPath)}`);
          if (fs.existsSync(indexPath)) {
            const stats = fs.statSync(indexPath);
            console.log(`Index.html size: ${stats.size} bytes`);
            console.log(`Index.html modified: ${stats.mtime}`);
          } else {
            console.error('❌ index.html NOT FOUND!');
          }
        } else {
          console.error('❌ out directory NOT FOUND!');
        }
      } else {
        console.error('❌ App path does not exist!');
      }
      console.log('=== End File System Debug ===');
    }

    console.log(`🚀 Loading application from: ${startUrl}`);
    
    // Load the URL and handle the result
    this.mainWindow.loadURL(startUrl).then(() => {
      console.log('✅ URL loaded successfully');
    }).catch((error) => {
      console.error('❌ Error loading URL:', error);
    });

    // Add error handling for failed loads
    let hasAttemptedFallback = false; // Prevent infinite fallback loops
    
    this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('❌ === LOAD FAILURE ===');
      console.error(`Failed URL: ${validatedURL}`);
      console.error(`Error Code: ${errorCode}`);
      console.error(`Error Description: ${errorDescription}`);
      console.error('========================');
      
      // Check if window still exists before trying fallback
      if (!this.mainWindow || this.mainWindow.isDestroyed()) {
        console.log('Window destroyed, skipping fallback load attempts');
        return;
      }
      
      // Prevent infinite fallback loops
      if (hasAttemptedFallback) {
        console.log('Already attempted fallback, skipping to prevent loops');
        return;
      }
      
      hasAttemptedFallback = true;
      
      // Show debug page using local HTTP server in production, file:// in dev
      let debugPath: string;
      if (isDev) {
        debugPath = `file://${path.join(__dirname, '../debug.html')}`;
      } else {
        if (this.serverPort === 0) {
          console.error('❌ Cannot load debug page: Server port is 0');
          return;
        }
        debugPath = `http://127.0.0.1:${this.serverPort}/debug.html`;
      }
      console.log(`🔧 Loading debug page: ${debugPath}`);
      
      this.mainWindow.loadURL(debugPath).catch((fallbackError) => {
        console.error('❌ Even debug page failed to load:', fallbackError);
      });
    });

    // Add success handler
    this.mainWindow.webContents.on('did-finish-load', () => {
      console.log('✅ Page loaded successfully');
      const currentURL = this.mainWindow?.webContents.getURL();
      console.log(`Current URL: ${currentURL}`);
    });

    // Add navigation handler
    this.mainWindow.webContents.on('did-start-loading', () => {
      console.log('🔄 Started loading page...');
    });

    // Handle navigation
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      // Allow navigation within the app
      if (url.startsWith('http://localhost:3000') || url.startsWith('file://')) {
        return { action: 'allow' };
      }
      // Block external navigation
      return { action: 'deny' };
    });

    // Handle window closed event
    this.mainWindow.on('closed', () => {
      console.log('Main window closed, cleaning up...');
      this.mainWindow = null;
    });
  }

  private setupIpcHandlers(): void {
    console.log('🔗 Setting up IPC channels for database operations...');

    // Player operations
    ipcMain.handle('db:getPlayers', async () => {
      try {
        console.log('📋 Fetching all players...');
        return this.dbAdapter.getPlayers();
      } catch (error) {
        console.error('Error getting players:', error);
        return [];
      }
    });

    ipcMain.handle('db:addPlayer', async (_, playerData: { name: string; tag?: string; mainCharacter?: string; secondaryCharacter?: string }) => {
      try {
        console.log('Adding new player:', playerData.name);
        const player = this.dbAdapter.addPlayer(
          playerData.name,
          playerData.tag,
          playerData.mainCharacter,
          playerData.secondaryCharacter
        );
        console.log('✅ Player added successfully:', player.name);
        return { success: true, player };
      } catch (error) {
        console.error('❌ Error adding player:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    ipcMain.handle('db:deletePlayer', async (_, playerId: number) => {
      try {
        console.log('🗑️ Deleting player with ID:', playerId);
        const deleted = this.dbAdapter.deletePlayer(playerId);
        if (deleted) {
          console.log('✅ Player deleted successfully');
          return { success: true };
        } else {
          console.log('⚠️ Player not found');
          return { success: false, error: 'Player not found' };
        }
      } catch (error) {
        console.error('❌ Error deleting player:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    ipcMain.handle('db:getPlayerById', async (_, playerId: number) => {
      try {
        console.log('🔍 Fetching player by ID:', playerId);
        return this.dbAdapter.getPlayerById(playerId);
      } catch (error) {
        console.error('❌ Error getting player by ID:', error);
        return null;
      }
    });

    ipcMain.handle('db:getPlayerStats', async (_, playerId: number) => {
      try {
        console.log('Fetching player stats for ID:', playerId);
        return this.dbAdapter.getPlayerStats(playerId);
      } catch (error) {
        console.error('❌ Error getting player stats:', error);
        return { totalMatches: 0, wins: 0, losses: 0, winRate: 0 };
      }
    });

    // Match operations
    ipcMain.handle('db:getMatches', async () => {
      try {
        console.log('⚔️ Fetching all matches...');
        return this.dbAdapter.getAllMatches();
      } catch (error) {
        console.error('❌ Error getting matches:', error);
        return [];
      }
    });

    ipcMain.handle('db:addMatch', async (_, matchData: { playerA_id: number; playerB_id: number; scoreA: number; scoreB: number }) => {
      try {
        console.log('Recording singles match:', `Player ${matchData.playerA_id} vs Player ${matchData.playerB_id}`);
        const match = this.dbAdapter.recordMatch(
          matchData.playerA_id,
          matchData.playerB_id,
          matchData.scoreA,
          matchData.scoreB
        );
        console.log('✅ Singles match recorded successfully with ELO updates');
        return { success: true, match };
      } catch (error) {
        console.error('❌ Error recording singles match:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    ipcMain.handle('db:addDoublesMatch', async (_, matchData: { 
      playerA_id: number; 
      playerC_id: number; 
      playerB_id: number; 
      playerD_id: number; 
      teamA_score: number; 
      teamB_score: number 
    }) => {
      try {
        console.log('Recording doubles match:', `Team A (${matchData.playerA_id}, ${matchData.playerC_id}) vs Team B (${matchData.playerB_id}, ${matchData.playerD_id})`);
        const match = this.dbAdapter.recordDoublesMatch(
          matchData.playerA_id,
          matchData.playerC_id,
          matchData.playerB_id,
          matchData.playerD_id,
          matchData.teamA_score,
          matchData.teamB_score
        );
        console.log('✅ Doubles match recorded successfully with ELO updates');
        return { success: true, match };
      } catch (error) {
        console.error('❌ Error recording doubles match:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    // Leaderboard operations
    ipcMain.handle('db:getLeaderboard', async () => {
      try {
        console.log('Fetching leaderboard...');
        return this.dbAdapter.getLeaderboard();
      } catch (error) {
        console.error('❌ Error getting leaderboard:', error);
        return [];
      }
    });

    console.log('✅ IPC channels setup complete');
  }
}

// Initialize and start the application
console.log('🚀 Starting SmashBoard application...');
const main = new Main();
main.init();