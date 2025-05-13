# Bộ Công Cụ Xử Lý Ngôn Ngữ Tự Nhiên (NLP)

Một bộ công cụ toàn diện cho xử lý ngôn ngữ tự nhiên, được xây dựng với Next.js và tích hợp nhiều tính năng NLP hiện đại.

## Tính Năng

- Phân loại văn bản thông minh
- Hệ thống gợi ý cho người dùng
- Hộp thoại AI tích hợp AIMLAPI
- Hỗ trợ đa ngôn ngữ
- Giao diện hiện đại và thân thiện với người dùng
- Biểu diễn văn bản và trực quan hóa
- Phân tích TF-IDF
- Khám phá word embeddings

## Yêu Cầu Trước Khi Cài Đặt

- Node.js phiên bản 18 trở lên
- Python 3.8 trở lên
- Tài khoản AIMLAPI và khóa API
- Tài khoản Google Cloud (cho dịch vụ dịch thuật)

## Cài Đặt

1. Clone kho mã nguồn:
```bash
git clone <repository-url>
cd proj-nlp
```

2. Cài đặt các thư viện phụ thuộc:
```bash
# Cài đặt dependencies cho frontend
npm install 

# Cài đặt dependencies cho backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
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

### 4. Biểu Diễn Văn Bản
- Trực quan hóa TF-IDF
- Khám phá word embeddings
- Phân tích biểu diễn văn bản

### 5. Hệ Thống Gợi Ý
- Collaborative filtering
- Gợi ý dựa trên nội dung
- Đánh giá và phản hồi người dùng

## Chạy Ứng Dụng

1. Khởi động máy chủ phát triển:

Chạy backend (Python):
```bash
npm run server
```

Chạy frontend (Next.js):
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
│   │   ├── RecSys/
│   │   └── text-classification/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts
│   └── layout.tsx
├── components/
│   ├── models/
│   └── ui/
├── server/
│   └── phobert-finetuned-viquad2/
├── messages/
│   ├── en.json
│   └── vi.json
├── public/
├── styles/
├── types/
├── hooks/
├── context/
├── lib/
├── providers/
├── config/
├── scripts/
├── i18n/
├── .env.local
└── package.json
```

## Tải và Cài Đặt File Model

Để sử dụng đầy đủ chức năng của ứng dụng, bạn cần tải các file model sau:

### 1. Model PhoBERT
- **Vị trí**: `server/phobert-finetuned-viquad2/`
- **Các file cần tải**:
  - `model.safetensors` (1.0GB)
  - `tokenizer.json` (16MB)
  - `sentencepiece.bpe.model` (4.8MB)
  - `optimizer.pt` (2.1GB)
  - `training_args.bin` (vài MB)

### 2. Model Phân Loại
- **Vị trí**: `components/models/`
- **Các file cần tải**:
  - AG News: `AG_News_*.pkl`
  - BBC News: `BBC_News_*.pkl`
  - IMDB Reviews: `IMDB_Reviews_*.pkl`
  - SMS Spam: `SMS_Spam_*.pkl`
  - Yelp Reviews: `Yelp_Reviews_*.pkl`

### 3. File Thư Viện
- **Vị trí**: `venv/Lib/site-packages/torch/lib/`
- **Các file cần tải**:
  - `dnnl.lib` (623MB)
  - `torch_cpu.dll` (239MB)

### Hướng Dẫn Tải và Cài Đặt

1. **Tải file model**:
   - Xem danh sách đầy đủ các file model trong `link_models.txt`
   - Tải các file model từ link được cung cấp

2. **Cài đặt file model**:
   ```bash
   # Tạo thư mục nếu chưa tồn tại
   mkdir -p server/phobert-finetuned-viquad2
   mkdir -p components/models
   mkdir -p venv/Lib/site-packages/torch/lib

   # Di chuyển file model vào thư mục tương ứng
   # (Thay thế đường dẫn tải xuống của bạn)
   mv ~/Downloads/model.safetensors server/phobert-finetuned-viquad2/
   mv ~/Downloads/*.pkl components/models/
   mv ~/Downloads/dnnl.lib venv/Lib/site-packages/torch/lib/
   mv ~/Downloads/torch_cpu.dll venv/Lib/site-packages/torch/lib/
   ```

3. **Kiểm tra cài đặt**:
   ```bash
   # Kiểm tra file model PhoBERT
   ls -lh server/phobert-finetuned-viquad2/

   # Kiểm tra file model phân loại
   ls -lh components/models/

   # Kiểm tra file thư viện
   ls -lh venv/Lib/site-packages/torch/lib/
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

## Lưu ý về quản lý mã nguồn

- **Không commit các file mô hình lớn (.pkl, .joblib, .safetensors, .json tokenizer, .bpe, .png mô hình, ...)**
- **Không commit các file dữ liệu lớn hoặc file có thể tạo lại bằng code/notebook**
- **Không commit các notebook (.ipynb) nếu chỉ dùng để thử nghiệm hoặc sinh dữ liệu**
- **Các file này đã được thêm vào .gitignore**

### Danh sách file loại trừ (có thể tạo lại):
- `server/models/*.pkl`, `server/models/*.joblib`, `server/models/*.png`
- `models_backup/` (toàn bộ thư mục backup mô hình)
- `server/data/RecSys/*.json` (có thể sinh lại từ notebook hoặc script)
- `context-aware.ipynb`, `collaborative_filtering.ipynb` (notebook thử nghiệm)
- `user_item_matrix.joblib`, `user_similarity.joblib`, `svd_model.joblib` (có thể train lại)

> **Ghi chú:** Nếu cần sử dụng lại, hãy chạy lại notebook hoặc script tương ứng để sinh ra file.