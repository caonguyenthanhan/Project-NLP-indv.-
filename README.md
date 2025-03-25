# Project NLP: Comprehensive Text Representation Learning Platform

Project NLP là một nền tảng học tập và thực hành toàn diện về các phương pháp biểu diễn văn bản trong xử lý ngôn ngữ tự nhiên (Natural Language Processing). Dự án này được thiết kế để giúp người dùng hiểu và trực quan hóa cách các kỹ thuật NLP khác nhau chuyển đổi văn bản thành các biểu diễn số học mà máy tính có thể xử lý.

## Các thành phần chính

### 1. Quy trình xử lý dữ liệu 5 bước

Dự án được tổ chức theo quy trình xử lý dữ liệu 5 bước: 

* **Thu thập dữ liệu**: Nhập và quản lý tài liệu văn bản 
* **Tăng cường dữ liệu**: Mở rộng tập dữ liệu để cải thiện hiệu suất mô hình 
* **Làm sạch dữ liệu**: Loại bỏ nhiễu và chuẩn hóa văn bản 
* **Tiền xử lý dữ liệu**: Chuẩn bị văn bản cho các thuật toán NLP 
* **Biểu diễn văn bản**: Chuyển đổi văn bản thành biểu diễn số học 


### 2. Phương pháp biểu diễn văn bản

Dự án phân loại các phương pháp biểu diễn văn bản thành hai nhóm: 

#### Phương pháp cơ bản

* **One-Hot Encoding**: Biểu diễn mỗi từ dưới dạng vector nhị phân với một phần tử có giá trị 1 và tất cả các phần tử khác là 0 
* **Bag of Words**: Biểu diễn văn bản dưới dạng tập hợp các từ không theo thứ tự, đếm số lần xuất hiện của mỗi từ 
* **N-Grams**: Phân tích chuỗi liên tiếp gồm n từ, giúp nắm bắt thông tin về thứ tự từ 
* **TF-IDF**: Đánh giá tầm quan trọng của từ dựa trên tần suất xuất hiện trong tài liệu và độ hiếm của từ trong toàn bộ tập tài liệu 

#### Phương pháp nâng cao

* **Word2Vec**: Tạo vector từ bằng mạng nơ-ron, ánh xạ từ vào không gian vector liên tục 
* **GloVe**: Phân tích thống kê đồng xuất hiện từ-từ toàn cục để tạo vector biểu diễn 
* **FastText**: Mở rộng Word2Vec bằng cách biểu diễn từ dưới dạng tập hợp n-gram ký tự 
* **Doc2Vec**: Mở rộng Word2Vec để học biểu diễn cho câu, đoạn văn hoặc tài liệu 
* **Sentence Transformers**: Sử dụng mô hình transformer như BERT để tạo vector biểu diễn cho câu hoặc đoạn văn 

### 3. Phân loại văn bản (Text Classification)

Phân loại văn bản là một tính năng cốt lõi của dự án, cho phép người dùng huấn luyện và thử nghiệm các mô hình học máy trên các tập dữ liệu văn bản. Tính năng này hỗ trợ nhiều thuật toán phân loại khác nhau, giúp người dùng hiểu cách các mô hình phân loại văn bản hoạt động.

#### Các thuật toán hỗ trợ

* **Naïve Bayes**: Sử dụng định lý Bayes để phân loại văn bản, với các tham số tùy chỉnh như alpha (smoothing) và khả năng học xác suất tiên nghiệm của lớp (fit prior).
* **Logistic Regression**: (Sắp ra mắt) Một thuật toán tuyến tính để phân loại văn bản.
* **SVM (Support Vector Machine)**: (Sắp ra mắt) Sử dụng không gian vector để tìm ranh giới phân chia tối ưu.
* **K-NN (K-Nearest Neighbors)**: (Sắp ra mắt) Phân loại dựa trên các điểm dữ liệu gần nhất trong không gian đặc trưng.

#### Tính năng chính

* **Huấn luyện mô hình**: Người dùng có thể chọn một tập dữ liệu (như IMDB Reviews, Twitter Sentiment) hoặc tải lên tập dữ liệu tùy chỉnh, sau đó huấn luyện mô hình với các tham số tùy chỉnh.
* **Dự đoán**: Sau khi huấn luyện, người dùng có thể nhập văn bản mới để dự đoán nhãn (ví dụ: tích cực/tiêu cực trong phân tích tình cảm).
* **Tùy chỉnh tham số**: Cung cấp các tùy chọn như alpha smoothing và fit prior (cho Naïve Bayes) để tinh chỉnh mô hình.
* **Thông báo trực quan**: Sử dụng `react-toastify` để hiển thị thông báo về trạng thái huấn luyện và dự đoán (đang xử lý, thành công, hoặc lỗi).
* **Xử lý lỗi**: Kiểm tra và thông báo lỗi nếu người dùng chưa chọn tập dữ liệu hoặc chưa tải lên file dataset.

#### Tích hợp với giao diện

* Giao diện tabbed cho phép người dùng chuyển đổi giữa các thuật toán phân loại khác nhau (Naïve Bayes, Logistic, SVM, K-NN).
* Form nhập liệu để tải file dataset, cấu hình tham số, và nhập văn bản cần dự đoán.
* Kết quả dự đoán được hiển thị trực quan dưới dạng văn bản.

#### Ứng dụng trong giáo dục và nghiên cứu

* Hiểu cách các thuật toán phân loại văn bản hoạt động.
* So sánh hiệu suất của các thuật toán trên cùng một tập dữ liệu.
* Thử nghiệm các tham số để cải thiện hiệu suất mô hình.

### 4. Giao diện tương tác

Giao diện người dùng trực quan cho phép: 

* **Quản lý tài liệu**: Xem, thêm và chỉnh sửa tài liệu văn bản.
* **Lựa chọn phương pháp**: Chuyển đổi giữa các phương pháp biểu diễn cơ bản và nâng cao, cũng như các thuật toán phân loại văn bản.
* **Tùy chọn xử lý**: Cấu hình các tùy chọn như loại bỏ stopwords, loại bỏ dấu câu, chuyển đổi chữ thường.
* **Trực quan hóa kết quả**: Xem kết quả biểu diễn văn bản dưới dạng ma trận hoặc vector, và kết quả dự đoán phân loại văn bản.

## Ứng dụng và lợi ích

### Giáo dục và học tập

* Hiểu rõ các khái niệm NLP cơ bản và nâng cao.
* So sánh trực tiếp các phương pháp biểu diễn văn bản và thuật toán phân loại khác nhau.
* Trực quan hóa cách văn bản được chuyển đổi thành dạng số học và cách các mô hình phân loại dự đoán nhãn.

### Nghiên cứu và phát triển

* Thử nghiệm nhanh các phương pháp biểu diễn văn bản và thuật toán phân loại khác nhau.
* Đánh giá hiệu quả của các kỹ thuật tiền xử lý và các tham số mô hình.
* Chuẩn bị dữ liệu cho các mô hình học máy và học sâu.

### Ứng dụng thực tế

* **Phân loại văn bản**: Gắn nhãn tự động cho tài liệu (ví dụ: spam/ham, tích cực/tiêu cực).
* **Phân tích tình cảm**: Xác định cảm xúc trong văn bản (tích cực, tiêu cực, trung lập).
* **Tìm kiếm ngữ nghĩa**: Cải thiện tìm kiếm dựa trên ý nghĩa của văn bản.
* **Hệ thống gợi ý**: Gợi ý nội dung dựa trên phân loại văn bản.
* **Tóm tắt văn bản**: Sử dụng biểu diễn văn bản để tóm tắt nội dung.

## Công nghệ sử dụng

* **Frontend**: React, Next.js, Tailwind CSS, shadcn/ui.
* **Backend**: Node.js (cho server), FastAPI (cho các tác vụ như huấn luyện mô hình và dự đoán).
* **Xử lý NLP**: Tích hợp các thư viện như NLTK, Gensim, spaCy, Hugging Face Transformers, scikit-learn (cho phân loại văn bản).
* **Trực quan hóa**: Biểu đồ và ma trận tương tác để hiển thị kết quả.

## Hướng phát triển tương lai

* Tích hợp thêm các phương pháp biểu diễn văn bản mới.
* Thêm các thuật toán phân loại văn bản mới (Logistic Regression, SVM, K-NN).
* Thêm các công cụ đánh giá và so sánh hiệu suất giữa các thuật toán phân loại.
* Hỗ trợ nhiều ngôn ngữ hơn ngoài tiếng Anh.
* Tích hợp với các mô hình học máy để thực hiện các tác vụ NLP phức tạp hơn.
* Phát triển API để tích hợp với các ứng dụng khác.

Project NLP là một công cụ giáo dục và thực hành toàn diện, giúp người dùng hiểu sâu về cách văn bản được biểu diễn và phân loại trong các hệ thống xử lý ngôn ngữ tự nhiên, từ các phương pháp cơ bản đến các kỹ thuật học sâu hiện đại.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Run the Development Server (Frontend)

First, run the Next.js development server for the frontend:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev