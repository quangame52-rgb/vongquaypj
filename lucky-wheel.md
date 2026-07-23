\# Workflow: Lucky Wheel Data \& Zalo Automation



\*\*Description:\*\* Xây dựng hệ thống Webhook nhận dữ liệu từ Landing Page Vòng quay may mắn, tự động lưu vào hệ thống CSKH và gửi tin nhắn xác nhận.



\*\*Steps:\*\*



1\. \*\*Khởi tạo Dịch vụ Webhook (Node.js):\*\* 

&#x20;  - Dựng một server Node.js với các package `express`, `axios`, và `googleapis`.

&#x20;  - Thiết lập endpoint `POST /webhook/lucky-wheel` để hứng payload dữ liệu (Họ Tên, SĐT, Tên Giải Thưởng) được đẩy về từ Landing page Vòng quay.



2\. \*\*Đồng bộ Data về Google Sheets:\*\*

&#x20;  - Viết module kết nối Google Sheets API qua Service Account.

&#x20;  - Tự động append dữ liệu khách hàng thành một dòng mới vào file quản lý. 

&#x20;  - Đảm bảo mapping đúng định dạng các cột để luồng data đẩy lên dashboard quản lý CSKH/Telesale không làm vỡ cấu trúc hiển thị real-time hiện tại.



3\. \*\*Kích hoạt Zalo API:\*\*

&#x20;  - Viết hàm gọi API Zalo ZNS (hoặc Zalo OA) để gửi tin nhắn thông báo. 

&#x20;  - Tham chiếu và tái sử dụng lại logic xử lý số điện thoại, định dạng HTML/chuỗi từ các script cấu hình tin nhắn xác nhận Zalo đã có sẵn trong workspace.

&#x20;  - Gửi tự động nội dung: "Chúc mừng \[Họ Tên] đã quay trúng \[Tên Giải Thưởng] từ chương trình tri ân. Vui lòng đưa tin nhắn này cho lễ tân khi tới Spa để nhận ưu đãi."



4\. \*\*Kiểm thử tự động bằng Browser Agent:\*\*

&#x20;  - Sử dụng Browser Agent trong Antigravity để mở URL của Landing Page.

&#x20;  - Giả lập thao tác người dùng: Nhập thông tin vào form và bấm Quay ngay.

&#x20;  - Kiểm tra log terminal để xác nhận Webhook đã bắt được trigger, verify dữ liệu trên Sheets và đảm bảo có phản hồi HTTP 200 từ Zalo.

