'use client';

import React from 'react';

export const PARTNER_TERMS_VERSION = 'DD-PARTNER-AGREEMENT-v1';

export default function PartnerTermsContent() {
  return (
    <div className="space-y-6 text-gray-800">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-gray-900">Điều khoản Partner – DineDate</h1>
        <p className="text-sm text-gray-500 font-medium">
          Mã văn bản: <span className="font-bold">{PARTNER_TERMS_VERSION}</span>
        </p>
        <p className="text-sm text-gray-500 font-medium">
          Vui lòng đọc kỹ trước khi bật chế độ Partner và cung cấp dịch vụ trên DineDate.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-black text-gray-900">1) Phạm vi dịch vụ hợp lệ</h2>
        <div className="text-sm leading-relaxed text-gray-700 space-y-2">
          <p>
            Partner được phép cung cấp các dịch vụ đồng hành lành mạnh như: đi cafe, ăn uống, xem phim, karaoke, tour guide,
            du lịch trong ngày, tham dự sự kiện công khai… theo mô tả dịch vụ đăng trên DineDate.
          </p>
          <p>
            Partner cam kết mô tả dịch vụ trung thực, rõ ràng về nội dung hoạt động, thời lượng, địa điểm gợi ý, chi phí
            (nếu có) và các điều kiện đi kèm.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-black text-gray-900">2) Phí nền tảng & chia sẻ doanh thu</h2>
        <div className="text-sm leading-relaxed text-gray-700 space-y-2">
          <p className="font-bold text-gray-900">
            Partner đồng ý cơ chế chia sẻ doanh thu: DineDate thu 30% phí nền tảng, Partner nhận 70%.
          </p>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2">
            <p className="text-sm text-rose-700 font-bold">Cơ chế tính:</p>
            <ul className="list-disc pl-5 text-rose-700 space-y-1">
              <li>30% tổng giá trị đơn hàng = Phí nền tảng để vận hành, duy trì và phát triển DineDate.</li>
              <li>70% còn lại = Thu nhập của Partner.</li>
            </ul>
            <p className="text-xs text-rose-700">
              Ví dụ: Đơn 1.000.000 VNĐ → Phí nền tảng 300.000 VNĐ → Partner nhận 700.000 VNĐ.
            </p>
          </div>

          <p className="font-bold text-gray-900">Phí nền tảng 30% dùng cho (không giới hạn):</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Hạ tầng kỹ thuật, máy chủ, lưu trữ dữ liệu, bảo mật.</li>
            <li>Vận hành hệ thống, kiểm duyệt, chăm sóc khách hàng, xử lý khiếu nại.</li>
            <li>Phát triển sản phẩm, cải thiện tính năng, đảm bảo chất lượng dịch vụ.</li>
            <li>Marketing và hoạt động kinh doanh để tăng lượng khách hàng và cơ hội nhận đơn cho Partner.</li>
          </ul>

          <p className="font-bold text-gray-900">Cấm né phí / giao dịch ngoài nền tảng:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Không yêu cầu khách chuyển khoản riêng/tiền mặt để né phí nền tảng.</li>
            <li>Không lôi kéo khách ra khỏi DineDate để giao dịch riêng thông qua chat, số điện thoại, mạng xã hội.</li>
            <li>Vi phạm có thể bị hạn chế hiển thị, khóa Partner tạm thời hoặc vĩnh viễn.</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-black text-gray-900">3) Khiếu nại, đánh giá xấu & xử lý vi phạm</h2>
        <div className="text-sm leading-relaxed text-gray-700 space-y-2">
          <p>
            Khách hàng có quyền đánh giá và khiếu nại sau khi sử dụng dịch vụ. Partner hiểu rằng đánh giá xấu có thể ảnh hưởng
            đến hiển thị hồ sơ, khả năng nhận đơn và trạng thái Partner.
          </p>

          <p className="font-bold text-gray-900">Các tình huống thường bị khiếu nại (không giới hạn):</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Không đúng giờ, hủy sát giờ, vắng mặt không lý do.</li>
            <li>Thái độ không phù hợp: thô lỗ, quấy rối, ép buộc, đe doạ.</li>
            <li>Hồ sơ sai sự thật (ảnh/tuổi/thông tin không đúng).</li>
            <li>Đòi thêm tiền trái thỏa thuận hoặc ép khách chi thêm ngoài app.</li>
            <li>Gợi ý/cung cấp dịch vụ nhạy cảm hoặc trái pháp luật.</li>
          </ul>

          <p className="font-bold text-gray-900">Nguyên tắc xử lý của DineDate:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Ưu tiên bằng chứng trong hệ thống: lịch sử booking, chat, log giao dịch.</li>
            <li>Có thể tạm khóa tính năng để điều tra nếu có dấu hiệu rủi ro cao.</li>
            <li>Áp dụng biện pháp: cảnh cáo, hạn chế hiển thị, khóa tạm thời, khóa vĩnh viễn tùy mức độ.</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-black text-gray-900">4) Tuyệt đối không cung cấp dịch vụ nhạy cảm / vi phạm pháp luật</h2>
        <div className="text-sm leading-relaxed text-gray-700 space-y-2">
          <p className="font-bold text-gray-900">Partner cam kết tuyệt đối không:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Mua bán dâm, kích dục, hoặc bất kỳ nội dung/thoả thuận liên quan tình dục đổi lợi ích.</li>
            <li>Gợi ý/ám chỉ/mã hoá nội dung nhạy cảm trong chat hoặc mô tả dịch vụ.</li>
            <li>Ma túy, chất cấm, cờ bạc, rửa tiền, lừa đảo, tống tiền, đe dọa.</li>
            <li>Hành vi trái pháp luật, trái thuần phong mỹ tục.</li>
          </ul>
          <p className="text-sm text-gray-700">
            Vi phạm có thể dẫn tới <span className="font-bold">khóa vĩnh viễn</span> và cung cấp thông tin cho cơ quan chức năng khi có yêu cầu hợp pháp.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-black text-gray-900">5) An toàn khi gặp mặt</h2>
        <div className="text-sm leading-relaxed text-gray-700 space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>Ưu tiên địa điểm công cộng, có camera, đông người.</li>
            <li>Không vào nơi riêng tư khi không đảm bảo an toàn.</li>
            <li>Không uống/ăn đồ không rõ nguồn gốc; bảo quản tài sản cá nhân.</li>
            <li>Khi có dấu hiệu rủi ro: dừng cuộc gặp và báo cáo trên DineDate.</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-black text-gray-900">6) Xác nhận đồng ý</h2>
        <div className="text-sm leading-relaxed text-gray-700 space-y-2">
          <p>
            Bằng việc xác nhận, bạn đồng ý toàn bộ điều khoản này và cho phép DineDate lưu lại log đồng ý để phục vụ vận hành và xử lý tranh chấp (nếu có).
          </p>
        </div>
      </section>
    </div>
  );
}