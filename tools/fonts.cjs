// node_modules/pretendard 의 woff2 를 assets/fonts/ 로 복사한다 (폰트 파일은 커밋하지 않는다)
const fs = require('node:fs');
const path = require('node:path');
const src = path.join(__dirname, '..', 'node_modules', 'pretendard', 'dist', 'web', 'static', 'woff2');
const dst = path.join(__dirname, '..', 'assets', 'fonts');
fs.mkdirSync(dst, { recursive: true });
for (const w of ['Medium', 'Bold', 'ExtraBold', 'Black']) {
  fs.copyFileSync(path.join(src, `Pretendard-${w}.woff2`), path.join(dst, `Pretendard-${w}.woff2`));
}
console.log('fonts →', dst);
