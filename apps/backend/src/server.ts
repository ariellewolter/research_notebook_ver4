import { createApp } from './app';
import { config } from './config/environment';

const app = createApp();
const PORT = config.port || 3001;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 Electronic Lab Notebook API ready!`);
    console.log(`🔗 API Documentation: http://localhost:${PORT}/`);
    console.log(`📱 Environment: ${config.environment}`);
    console.log(`🗄️  Database: ${config.database.url ? 'Connected' : 'Not configured'}`);
}); 