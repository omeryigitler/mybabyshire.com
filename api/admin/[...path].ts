import express from 'express';
import apiRoutes from '../../server/api.js';

const app = express();

app.use(express.json({ limit: '25mb' }));
app.use('/api', apiRoutes);

export default app;
