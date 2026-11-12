// 원본 구간 → 9:16 숏폼. 사용: node cut.cjs <작업폴더> [--sample] [--edit 다른편집안.json]
//   작업폴더에 edit.json · overlay.html · c1.mp4… 또는 full.mp4
//   --sample: 전체 렌더 대신 구간마다 첫 자막 가운데 시점 프레임 1장씩(build/sample/) — 결정 1 형태 샘플용
// 원본 화면은 가운데에 두고, 내 자막·제목은 Playwright로 그린 투명 PNG를 얹는다.
// edit.json 의 fg (모두 생략 가능 — 기본값은 처음 v2 모양):
//   bg    "blur"(같은 영상을 흐리게 · 움직임) | "solid"(단색 · 정지)
//   w     원본을 늘릴 폭(px). 1080 보다 크면 가운데 1080 만 남긴다(좌우가 잘림)
//   keep  원본 위에서부터 남길 높이 비율(박힌 자막 띠를 잘라낼 때)
//   y     가운데 원본의 위치
//   band  [위, 아래] 원본 높이 비율. 그 띠를 흐리게 · 어둡게 덮고 내 자막을 그 안에 얹는다(박힌 자막 가리기)
//   cap   내 자막 글자 크기(px)
// clips[].caps 를 비우면 원본(박힌 자막 포함)을 그대로 쓴다. clips[].insert {html, from, to}: 그 구간 뒤에
//   직접 만든 이해 장면(HTML 애니메이션의 render(t))을 from~to 초만큼 끼운다. 무음.
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const argv = process.argv.slice(2);
const dir = path.resolve(argv[0] || '.');
const SAMPLE = argv.includes('--sample');
const editFile = argv.includes('--edit') ? path.resolve(argv[argv.indexOf('--edit') + 1]) : path.join(dir, 'edit.json');
const E = JSON.parse(fs.readFileSync(editFile, 'utf8'));
const FG = { bg: 'blur', w: 1080, keep: 1, y: 520, band: null, cap: 78, ...E.fg };
const build = path.join(dir, 'build'); fs.mkdirSync(build, { recursive: true });
const sec = s => String(s).split(':').reduce((a, x) => a * 60 + +x, 0);
const ff = args => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
const VID = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30'];
const AUD = ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2'];
E.clips.forEach(c => { if (!c.caps?.length) c.caps = [[0, sec(c.to) - sec(c.from), '']]; });
const even = x => 2 * Math.round(x / 2);

const inputOf = c => {
  const own = path.join(dir, c.file);
  return fs.existsSync(own) ? ['-i', own] : ['-ss', String(sec(c.from)), '-to', String(sec(c.to)), '-i', path.join(dir, 'full.mp4')];
};

// 화면 배치(px) — 원본 비율은 첫 입력에서 읽는다
const first = inputOf(E.clips[0]).at(-1);
const [sw, sh] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', first])
  .toString().trim().split(',').map(Number);
const L = { w: FG.w, cw: Math.min(FG.w, 1080) };
L.h0 = even(FG.w * sh / sw);              // 늘린 원본 높이
L.h = even(L.h0 * FG.keep);               // 남긴 높이
L.x = (1080 - L.cw) / 2;
if (FG.band) { L.by = even(L.h * FG.band[0]); L.bh = even(L.h * (FG.band[1] - FG.band[0])); }
const layout = FG.band
  ? { capTop: FG.y + L.by, capH: L.bh, capSize: FG.cap, speakerTop: FG.y + 24 }
  : { capSize: FG.cap };

const graph = (c, dur, audio = true) => {
  let f = FG.bg === 'solid'
    ? `color=c=0x0d0e12:s=1080x1920:r=30:d=${dur}[bg];[0:v]`
    : `[0:v]split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=28:2,eq=brightness=-0.32[bg];[b]`;
  f += `scale=${L.w}:${L.h0},crop=${L.cw}:${L.h}:${(L.w - L.cw) / 2}:0`;
  if (FG.band) {
    f += `,split[f1][f2];[f2]crop=iw:${L.bh}:0:${L.by},boxblur=22:3,eq=brightness=-0.38[bb];[f1][bb]overlay=0:${L.by}`;
  }
  f += `[fg];[bg][fg]overlay=${L.x}:${FG.y}:shortest=1[v0]`;
  c.caps.forEach(([s, e], k) => { f += `;[v${k}][${k + 1}:v]overlay=0:0:enable='between(t,${s},${e})'[v${k + 1}]`; });
  f += `;[v${c.caps.length}]format=yuv420p[vo]`;
  if (audio) f += `;[0:a]loudnorm=I=-14:TP=-1.5,afade=t=in:d=0.06,afade=t=out:st=${(dur - 0.08).toFixed(2)}:d=0.08[ao]`;
  return f;
};

// 이해 장면: HTML 의 render(t) 를 프레임으로 찍는다. 그 HTML 의 진행 막대는 숨기고 태그는 이 편의 것으로 바꾼다
const insertFrames = async (b, ins, outDir, times) => {
  fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(outDir, { recursive: true });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto(pathToFileURL(path.resolve(dir, ins.html)).href + '?t=0');
  await p.evaluate(() => document.fonts.ready);
  for (const [n, t] of times.entries()) {
    await p.evaluate(([t, tag]) => {
      render(t);
      const bar = document.getElementById('bar'); if (bar) bar.style.display = 'none';
      const g = document.getElementById('tag'); if (g && tag) g.textContent = tag;
    }, [t, E.tag]);
    await p.screenshot({ path: path.join(outDir, `f${String(n).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 95 });
  }
  await p.close();
};

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
      await shot({ tag: E.tag, title: E.title, speaker: i === 0 ? E.speaker : '', cap: cap[2], layout }, path.join(build, `o${i}_${k}.png`));
    }
  }
  await shot({ outro: E.outro, source: E.source }, path.join(build, 'outro.png'), false);
  // 2) 구간별 합성
  const sampleDir = path.join(build, 'sample');
  if (SAMPLE) fs.mkdirSync(sampleDir, { recursive: true });
  const parts = [];
  for (const [i, c] of E.clips.entries()) {
    const dur = +(sec(c.to) - sec(c.from)).toFixed(3);
    const ov = c.caps.flatMap((_, k) => ['-loop', '1', '-i', path.join(build, `o${i}_${k}.png`)]);
    const f = graph(c, dur, !SAMPLE);
    if (SAMPLE) {
      const t = (c.caps[0][0] + c.caps[0][1]) / 2;
      ff([...inputOf(c), ...ov, '-filter_complex', f, '-map', '[vo]', '-ss', String(t), '-frames:v', '1', path.join(sampleDir, `s${i + 1}.png`)]);
      if (c.insert) {
        await insertFrames(b, c.insert, path.join(build, `ins${i}`), [(c.insert.from + c.insert.to) / 2]);
        fs.copyFileSync(path.join(build, `ins${i}`, 'f00000.jpg'), path.join(sampleDir, `s${i + 1}i.jpg`));
      }
      continue;
    }
    const out = path.join(build, `p${i}.mp4`);
    ff([...inputOf(c), ...ov, '-filter_complex', f, '-map', '[vo]', '-map', '[ao]', '-t', String(dur), ...VID, ...AUD, out]);
    parts.push(out);
    if (c.insert) {
      const { from, to } = c.insert, n = Math.round((to - from) * 30);
      const fd = path.join(build, `ins${i}`);
      await insertFrames(b, c.insert, fd, Array.from({ length: n }, (_, k) => from + k / 30));
      const io = path.join(build, `p${i}i.mp4`);
      ff(['-framerate', '30', '-i', path.join(fd, 'f%05d.jpg'), '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
          '-t', String(n / 30), '-vf', 'format=yuv420p', ...VID, ...AUD, io]);
      parts.push(io);
    }
  }
  await b.close();
  if (SAMPLE) { console.log('samples', sampleDir); return; }
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
