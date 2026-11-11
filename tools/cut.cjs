// 원본 구간 → 9:16 숏폼. 사용: node cut.cjs <작업폴더>  (작업폴더에 edit.json · overlay.html · c1.mp4… 또는 full.mp4)
// 원본 화면은 가운데(1080 폭), 위아래는 같은 영상을 흐리게 깔고, 내 자막·제목은 Playwright로 그린 투명 PNG를 얹는다.
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const dir = path.resolve(process.argv[2] || '.');
const E = JSON.parse(fs.readFileSync(path.join(dir, 'edit.json'), 'utf8'));
const build = path.join(dir, 'build'); fs.mkdirSync(build, { recursive: true });
const sec = s => String(s).split(':').reduce((a, x) => a * 60 + +x, 0);
const ff = args => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
const VID = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30'];
const AUD = ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2'];

(async () => {
  // 1) 오버레이 PNG
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto(pathToFileURL(path.join(dir, 'overlay.html')).href);
  await p.evaluate(() => document.fonts.ready);
  const shot = async (state, file, transparent = true) => {
    await p.evaluate(s => paint(s), state);
    await p.screenshot({ path: file, omitBackground: transparent });
  };
  for (const [i, c] of E.clips.entries()) {
    for (const [k, cap] of c.caps.entries()) {
      await shot({ tag: E.tag, title: E.title, speaker: i === 0 ? E.speaker : '', cap: cap[2] }, path.join(build, `o${i}_${k}.png`));
    }
  }
  await shot({ outro: E.outro, source: E.source }, path.join(build, 'outro.png'), false);
  await b.close();

  // 2) 구간별 합성
  const parts = [];
  for (const [i, c] of E.clips.entries()) {
    const dur = sec(c.to) - sec(c.from);
    const own = path.join(dir, c.file);
    const input = fs.existsSync(own) ? ['-i', own] : ['-ss', String(sec(c.from)), '-to', String(sec(c.to)), '-i', path.join(dir, 'full.mp4')];
    const ov = c.caps.flatMap((_, k) => ['-loop', '1', '-i', path.join(build, `o${i}_${k}.png`)]);
    let f = `[0:v]split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=28:2,eq=brightness=-0.32[bg];` +
            `[b]scale=1080:-2[fg];[bg][fg]overlay=0:520[v0]`;
    c.caps.forEach(([s, e], k) => { f += `;[v${k}][${k + 1}:v]overlay=0:0:enable='between(t,${s},${e})'[v${k + 1}]`; });
    f += `;[v${c.caps.length}]format=yuv420p[vo]`;
    f += `;[0:a]loudnorm=I=-14:TP=-1.5,afade=t=in:d=0.06,afade=t=out:st=${(dur - 0.08).toFixed(2)}:d=0.08[ao]`;
    const out = path.join(build, `p${i}.mp4`);
    ff([...input, ...ov, '-filter_complex', f, '-map', '[vo]', '-map', '[ao]', '-t', String(dur), ...VID, ...AUD, out]);
    parts.push(out);
  }
  const outro = path.join(build, 'pz.mp4');
  ff(['-loop', '1', '-i', path.join(build, 'outro.png'), '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
      '-t', String(E.outro.seconds), '-vf', 'format=yuv420p', ...VID, ...AUD, outro]);
  parts.push(outro);

  // 3) 이어 붙이기
  const list = path.join(build, 'list.txt');
  fs.writeFileSync(list, parts.map(x => `file '${x}'`).join('\n'));
  const final = path.join(dir, 'out.mp4');
  ff(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', final]);
  console.log('done', final);
})();
