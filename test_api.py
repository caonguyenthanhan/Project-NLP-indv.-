import requests
import uuid
# import json # Không cần thư viện json nữa nếu chỉ xử lý text

# --- Cấu hình ---
N8N_WEBHOOK_URL = "https://caonguyenthanhan.app.n8n.cloud/webhook/chatbot-response"
# --- Kết thúc Cấu hình ---

def call_chatbot_api(message, session_id):
    """
    Gửi yêu cầu đến API chatbot và in ra phản hồi dạng text thuần túy.

    Args:
        message (str): Tin nhắn gửi đến chatbot.
        session_id (str): ID duy nhất cho phiên trò chuyện.
    """
    # Chuẩn bị các tham số cho yêu cầu GET
    params = {
        "message": message,
        "sessionId": session_id
    }

    print(f"[*] Đang gửi yêu cầu tới: {N8N_WEBHOOK_URL}")
    # print(f"[*] Tham số: {params}") # Bỏ comment nếu cần debug

    try:
        # Thực hiện yêu cầu GET với timeout 30 giây
        response = requests.get(N8N_WEBHOOK_URL, params=params, timeout=30)

        # In ra mã trạng thái HTTP
        print(f"\n[*] Mã trạng thái HTTP: {response.status_code}")

        # Kiểm tra xem yêu cầu có thành công không (mã 200 OK)
        if response.status_code == 200:
            # Vì phản hồi là text thuần túy, in trực tiếp nội dung text
            print("[*] Phản hồi từ Chatbot:")
            # Sử dụng response.text để lấy nội dung text thô
            print(response.text)
            # Không cần phân tích JSON nữa (response.json())
        else:
            # In ra lỗi nếu mã trạng thái không phải 200
            print(f"[!] Lỗi: Yêu cầu thất bại với mã trạng thái {response.status_code}")
            # Vẫn in nội dung text để xem thông tin lỗi nếu có
            print(f"[*] Nội dung phản hồi: {response.text}")

    except requests.exceptions.Timeout:
        print("[!] Lỗi: Yêu cầu bị hết thời gian chờ (timeout).")
    except requests.exceptions.RequestException as e:
        # Xử lý các lỗi khác liên quan đến thư viện requests (ví dụ: lỗi kết nối)
        print(f"[!] Lỗi trong quá trình gửi yêu cầu: {e}")
    except Exception as e:
        # Bắt các lỗi không mong muốn khác
         print(f"[!] Có lỗi không mong muốn xảy ra: {e}")


# --- Phần chạy chính của chương trình ---
if __name__ == "__main__":
    # Tạo một sessionId duy nhất và sử dụng nó cho toàn bộ phiên làm việc này
    session_id = f"interactive_session_{uuid.uuid4()}"

    print("--- Bắt đầu phiên Chatbot tương tác ---")
    print(f"Session ID: {session_id}")
    print("Nhập tin nhắn của bạn để trò chuyện với Bot.")
    print("Gõ 'quit' hoặc 'exit' và nhấn Enter để thoát.")

    while True:
        # Nhận input từ người dùng
        try:
            user_message = input("\nBạn: ")
        except EOFError: # Xử lý trường hợp input bị đóng bất ngờ
             print("\n[*] Input bị đóng. Kết thúc phiên làm việc.")
             break

        # Kiểm tra điều kiện thoát
        if user_message.strip().lower() in ["quit", "exit"]:
            print("[*] Kết thúc phiên làm việc.")
            break

        # Gọi API nếu có tin nhắn (sau khi đã loại bỏ khoảng trắng thừa)
        if user_message.strip():
            call_chatbot_api(user_message.strip(), session_id)
        # Không cần báo lỗi nếu người dùng chỉ nhấn Enter
        # else:
        #      print("[!] Vui lòng nhập tin nhắn hoặc 'quit'/'exit' để thoát.")