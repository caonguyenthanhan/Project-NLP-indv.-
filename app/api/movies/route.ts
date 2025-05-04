import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

export async function GET() {
  try {
    // Lấy đường dẫn tới thư mục gốc của project
    const projectRoot = process.cwd()
    
    // Đọc file movies.json từ thư mục RecSys
    const filePath = path.join(projectRoot, 'app', '[locale]', 'RecSys', 'movies.json')
    const jsonData = await fs.readFile(filePath, 'utf8')
    const data = JSON.parse(jsonData)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error reading movies data:', error)
    return NextResponse.json(
      { error: 'Không thể đọc dữ liệu phim' },
      { status: 500 }
    )
  }
} 