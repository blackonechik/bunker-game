import { NextApiRequest } from 'next';
import { initializeSocketServer, NextApiResponseWithSocket } from '../../lib/socket/server';

export default async function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (req.method === 'GET' || req.method === 'POST') {
    await initializeSocketServer(req, res);
    res.status(200).json({ message: 'Socket.IO server is running' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
