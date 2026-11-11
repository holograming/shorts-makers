# shorts-makers

보기만 하고 잊어버리던 기술 영상을 **내 말 · 내 필체의 30~60초 숏폼**으로 줄이고, 그 과정을 기록한다.
돈이 목적이 아니라 **기억하는 방식을 바꾸는 것**이 목적이다. 에이전트가 묻고, 내가 결정한다.

- 방향과 결정 근거: [docs/interview.md](docs/interview.md)
- 파이프라인 설계와 지금 되는 것 · 막힌 것: [docs/pipeline.md](docs/pipeline.md)
- 작업 규칙과 다음 할 일: [CLAUDE.md](CLAUDE.md)

## 처음 한 번
```sh
npm install            # playwright · pretendard (정확한 버전 고정)
npx playwright install chromium   # 로컬에서만. 클라우드 세션은 이미 깔려 있다
npm run setup:fonts    # assets/fonts/ 에 Pretendard 복사 (커밋 안 함)
```
영상 편집에는 `ffmpeg`, 원본 받기에는 `yt-dlp`가 필요하다(내 컴퓨터).

## 폴더
| 폴더 | 무엇 |
|---|---|
| `shorts/<번호>-<주제>/` | 한 편 = 폴더 하나. `RECORD.md`(질문 · 결정 · 버린 이유), 버전별 편집안 |
| `tools/` | `cut.cjs`(원본 구간 → 9:16 숏폼) · `render.cjs`(HTML 데모 → 프레임) · `stills.cjs`(특정 시점 정지 화면) · `fonts.cjs` |
| `assets/fonts/` | 생성됨, 커밋 안 함 |

영상 파일(원본 구간 · 결과물)은 커밋하지 않는다.
