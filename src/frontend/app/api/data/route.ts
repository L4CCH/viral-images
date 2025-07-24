import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';



export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let filePath;
    if (type === 'clusters') {
      filePath = path.join(process.cwd(), '../../data/processed/clusters.json');
    } else if (type === 'metadata') {
      filePath = path.join(process.cwd(), '../../data/processed/metadata.json');
    } else {
      return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
    }

    let data;
    if (type === 'metadata') {
      const fileContent = await fs.readFile(filePath, 'utf8');
      data = fileContent.split('\n').filter(Boolean).map(line => JSON.parse(line));
    } else {
      const fileContent = await fs.readFile(filePath, 'utf8');
      data = JSON.parse(fileContent);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading data:', error);
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}
