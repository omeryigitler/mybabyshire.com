import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-development';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const requireAdmin = (authorization?: string) => {
  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing token');
  }

  const token = authorization.split(' ')[1];
  return jwt.verify(token, JWT_SECRET);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    requireAdmin(req.headers.authorization);
  } catch (error) {
    return res.status(401).json({ error: (error as Error).message });
  }

  try {
    const { file, folder = 'little-wonders/products' } = req.body;

    if (!file || typeof file !== 'string') {
      return res.status(400).json({ error: 'Missing image file.' });
    }

    if (!process.env.REMOVE_BG_API_KEY) {
      return res.status(500).json({
        error: 'REMOVE_BG_API_KEY environment variable is missing.',
      });
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(500).json({
        error: 'Cloudinary environment variables are missing.',
      });
    }

    const base64Data = file.includes(',') ? file.split(',')[1] : file;
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const imageBlob = new Blob([imageBuffer], {
      type: 'image/png',
    });

    const formData = new FormData();
    formData.append('size', 'auto');
    formData.append('format', 'png');
    formData.append('image_file', imageBlob, 'image.png');

    const removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.REMOVE_BG_API_KEY,
      },
      body: formData,
    });

    if (!removeBgResponse.ok) {
      const errorText = await removeBgResponse.text();

      return res.status(removeBgResponse.status).json({
        error: 'remove.bg failed',
        details: errorText,
      });
    }

    const transparentArrayBuffer = await removeBgResponse.arrayBuffer();
    const transparentBuffer = Buffer.from(transparentArrayBuffer);
    const transparentBase64 = transparentBuffer.toString('base64');

    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${transparentBase64}`,
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 900, height: 900, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      }
    );

    return res.status(200).json({
      imageUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Background removal upload failed',
      details: (error as Error).message,
    });
  }
}
