// deploy.js
import { execSync } from "child_process";

const REPO = "Ngoc-Tieu-Cac-Admin"; // Tên repo của bạn
const BUILD_DIR = "dist";            // Thư mục build (Vite mặc định là dist)

// Hàm chạy lệnh shell
function run(cmd) {
  try {
    console.log(`> ${cmd}`);
    execSync(cmd, { stdio: "inherit" });
  } catch (err) {
    console.error(`❌ Lỗi khi chạy: ${cmd}`);
    console.error(err.message);
    process.exit(1);
  }
}

console.log("📦 Bắt đầu build dự án...");
run(`npm run build`);

console.log("🚀 Deploy lên GitHub Pages...");
run(`npx gh-pages -d ${BUILD_DIR}`);

console.log(`✅ Deploy thành công!`);
console.log(`Xem tại: https://nhatthanhtranho.github.io/${REPO}/`);
