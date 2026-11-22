// Danh sách game hiển thị ở trang chủ. Thêm game mới = thêm 1 object vào đây
// và tạo thư mục games/<ten-game>/ chứa index.html, style.css, script.js.
const GAMES = [
  {
    path: 'games/number-match/',
    icon: '🔢',
    title: 'Nối Số – ƯCLN',
    desc: 'Nối 2 số, chia cho ƯCLN, xóa sạch bàn 8x8. 21 màn, 3 mức độ.',
    tag: 'Số học · 21 màn'
  },
  {
    path: 'games/perfect-square/',
    icon: '🟦',
    title: 'Perfect Square',
    desc: 'Kéo, xoay các cụm hình vuông để ghép thành một hình vuông hoàn mỹ. 3 mức độ, không gợi ý.',
    tag: 'Hình học · 30 màn'
  }
];