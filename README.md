# Bộ Công Cụ Xử Lý Ngôn Ngữ Tự Nhiên (NLP)

Một bộ công cụ toàn diện cho xử lý ngôn ngữ tự nhiên, được xây dựng với Next.js và tích hợp nhiều tính năng NLP hiện đại.

## Tính Năng

- Phân loại văn bản thông minh
- Lọc và xử lý văn bản bằng kỹ thuật NLP
- Hộp thoại AI tích hợp AIMLAPI
- Hỗ trợ đa ngôn ngữ
- Giao diện hiện đại và thân thiện với người dùng

## Yêu Cầu Trước Khi Cài Đặt

- Node.js phiên bản 18 trở lên
- Tài khoản AIMLAPI và khóa API
- Tài khoản Google Cloud (cho dịch vụ dịch thuật)

## Cài Đặt

1. Clone kho mã nguồn:
```bash
git clone <your-repository-url>
cd proj-nlp
```

2. Cài đặt các thư viện phụ thuộc:
```bash
npm install
```

3. Tạo file `.env.local` trong thư mục gốc và thêm các khóa API cần thiết:
```
# Google Cloud Translation API Configuration
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_PRIVATE_KEY_ID=your_private_key_id
GOOGLE_CLOUD_PRIVATE_KEY=your_private_key
GOOGLE_CLOUD_CLIENT_EMAIL=your_client_email
GOOGLE_CLOUD_CLIENT_ID=your_client_id
GOOGLE_CLOUD_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GOOGLE_CLOUD_TOKEN_URI=https://oauth2.googleapis.com/token
GOOGLE_CLOUD_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
GOOGLE_CLOUD_CLIENT_X509_CERT_URL=your_client_x509_cert_url

# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# AIMLAPI Configuration
AIMLAPI_KEY=your_aimlapi_key
```

## Các Tính Năng Chính

### 1. Phân Loại Văn Bản
- Phân loại văn bản thành các danh mục định sẵn
- Hỗ trợ nhiều mô hình học máy
- Giao diện trực quan để xem kết quả

### 2. Lọc NLP
- Lọc và xử lý văn bản bằng các kỹ thuật NLP
- Hỗ trợ nhiều phương pháp xử lý khác nhau
- Xem trước kết quả trực tiếp

### 3. Hộp Thoại AI
- Tích hợp AIMLAPI cho hội thoại thông minh
- Lưu lịch sử trò chuyện
- Giao diện chat thời gian thực

## Chạy Ứng Dụng

1. Khởi động máy chủ phát triển:
```bash
npm run dev
```

2. Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt của bạn

## Cấu Trúc Dự Án

```
proj-nlp/
├── app/
│   ├── [locale]/
│   │   ├── chat-box/
│   │   ├── nlp-filtering/
│   │   └── text-classification/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts
│   └── layout.tsx
├── components/
├── messages/
│   ├── en.json
│   └── vi.json
├── public/
├── .env.local
└── package.json
```

## Đóng Góp

1. Fork kho mã nguồn
2. Tạo nhánh chức năng mới (`git checkout -b feature/amazing-feature`)
3. Commit thay đổi của bạn (`git commit -m 'Add some amazing feature'`)
4. Push lên nhánh đó (`git push origin feature/amazing-feature`)
5. Mở Pull Request

## Giấy Phép

Dự án này được phát hành theo giấy phép MIT - xem file LICENSE để biết chi tiết.

## Lời Cảm Ơn

Cảm ơn tất cả những người đã đóng góp cho dự án này.

# NLP Toolbox

A comprehensive Natural Language Processing (NLP) toolbox for text processing and analysis.

## Features

### Chat Box

The application provides three different types of chatbot implementations:

1. **Context API Chatbot** (`/chat-box/context-api`)
   - Uses a simple API with context limitations
   - Ideal for specific use cases where context is predefined
   - Limited by the provided context scope

2. **Fine-tuned Chatbot** (`/chat-box/fine-tuned`)
   - Custom-trained using BERT/RoBERTa models
   - Fine-tuned on specific datasets for better performance
   - Provides more accurate responses for specialized domains

3. **General API Chatbot** (`/chat-box/general-api`)
   - Uses a pure API implementation
   - Provides general-purpose responses
   - Not limited by specific context or training data