import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// x402 Payment Middleware Configuration
const facilitatorUrl = process.env.CDP_API_KEY_ID
  ? `https://facilitator.cdp.coinbase.com` // CDP facilitator
  : process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator'; // Public fallback

const network = process.env.X402_NETWORK || 'base-sepolia';

console.log(`🔗 x402 Facilitator: ${facilitatorUrl}`);
console.log(`🌐 Network: ${network}`);
// Line 27
if (process.env.CDP_API_KEY_ID) {
  console.log(`✅ Using Coinbase CDP Facilitator`);
} else {
  console.log(`⚠️  Using public facilitator (testnet mode)`);
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    message: 'Penny.io backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    facilitator: facilitatorUrl,
    network: network,
    cdpEnabled: !!process.env.CDP_API_KEY_ID
  });
});

// API routes
app.use('/api', routes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Penny.io backend server running on port ${PORT}`);
  console.log(`📚 API documentation available at http://localhost:${PORT}/api/health`);
});

server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Run: lsof -i :${PORT}`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});
