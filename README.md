# NLP Toolkit 🚀

Bộ công cụ xử lý ngôn ngữ tự nhiên toàn diện với giao diện người dùng hiện đại và hỗ trợ đa ngôn ngữ.

## ✨ Tính năng

- 📝 **Phân loại văn bản** - Phân loại văn bản vào các nhóm khác nhau
- 🔍 **Lọc NLP** - Lọc và xử lý văn bản theo nhiều tiêu chí
- 💬 **Hộp thoại** - Tương tác với mô hình NLP qua giao diện chat
- 🌐 **Đa ngôn ngữ** - Hỗ trợ hơn 40 ngôn ngữ với dịch tự động
- 🎨 **Giao diện tùy biến** - 6 theme độc đáo lấy cảm hứng từ văn hóa Việt Nam

## 🚀 Bắt đầu

### Yêu cầu hệ thống

- Node.js 18.x trở lên
- Python 3.8 trở lên
- Google Cloud Translation API credentials

### Cài đặt

1. Clone repository:
```bash
git clone https://github.com/your-username/nlp-toolkit.git
cd nlp-toolkit
```

2. Cài đặt dependencies:
```bash
# Frontend dependencies
npm install

# Backend dependencies
pip install -r requirements.txt
```

3. Thiết lập môi trường:
- Tạo file `.env.local` từ `.env.example`
- Thêm Google Cloud Translation API credentials

4. Khởi chạy ứng dụng:
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 🌐 Đa ngôn ngữ

### Ngôn ngữ được hỗ trợ sẵn
- 🇻🇳 Tiếng Việt
- 🇬🇧 English

### Dịch tự động
- Hỗ trợ hơn 40 ngôn ngữ thông qua Google Cloud Translation API
- Tự động lưu các bản dịch để tái sử dụng
- Không yêu cầu dịch lại cho các ngôn ngữ đã có

## 🎨 Themes

### Theme có sẵn
1. **Thống Nhất** - Beige & Red
2. **Độc Lập** - Smoky White & Dark Gray
3. **Hạnh Phúc** - Dark Red & Light Yellow
4. **Tuyên Ngôn** - Turquoise & Beige
5. **Tôi Yêu Việt Nam** - Dark Green & White
6. **Tự Do** - Dark Blue & Orange

## 📁 Cấu trúc dự án

```
/app
  /[locale]     # Routes theo ngôn ngữ
  /api          # API endpoints
/components     # React components
/messages       # Translation files
/styles         # CSS files
/public         # Static files
/lib           # Shared utilities
```

## 🔧 Configuration

### Environment Variables

```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_PRIVATE_KEY=your-private-key
GOOGLE_CLOUD_CLIENT_EMAIL=your-client-email
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 🛠️ Development

### Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Adding New Features

1. Tạo branch mới cho tính năng
2. Phát triển và test tính năng
3. Cập nhật documentation và translations
4. Tạo pull request

## 📚 Documentation

- [Logic Documentation](./logic.txt)
- [API Documentation](./api-docs.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## 🤝 Contributing

Đóng góp luôn được chào đón! Xem [Contributing Guidelines](./CONTRIBUTING.md) để biết thêm chi tiết.

## 📄 License

MIT License - Xem [LICENSE](./LICENSE) để biết thêm chi tiết.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Next.js Team
- Vercel
- Google Cloud Translation API
- Shadcn UI
- TailwindCSS

## 📞 Support

Nếu bạn gặp vấn đề, vui lòng tạo issue trong repository.