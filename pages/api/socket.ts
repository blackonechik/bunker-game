import { NextApiRequest } from 'next';
import { initializeSocketServer, NextApiResponseWithSocket } from '@/shared/api/socket/server';

export default async function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  await initializeSocketServer(req, res);
  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};
