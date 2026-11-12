# 파이프라인 — 설계와 지금 되는 것

본 범위: 2026-11-11 클라우드 세션(제한 네트워크)에서 실제로 돌려 본 결과. 내 컴퓨터 · 슬랙 · 인스타 · 유튜브 업로드는 돌려 보지 않았다.

## 흐름
```
슬랙 #save ─(예약 실행)→ ① 수집: 링크 → 이슈 (captured)
  → ② 이해: 원어 자막 → 핵심 후보 + 구간 타임코드 (understood)
  ❓ 결정 1 (슬랙 스레드): 핵심 · 형태 샘플
  → ③ 원본 구간 받기 [내 컴퓨터] → ④ 편집: tools/cut.cjs (rendered)
  → ⑤ 자동 검수: 길이 · 해상도 · 자막 겹침 · 출처 표기
  ❓ 결정 2: 미리보기 → 올림 / 수정 / 버림
  → ⑥ 비공개 업로드 [GitHub Actions] (published)
  ❓ 결정 3 (주 1회): 세컨브레인에 남길 판단
```
원장은 GitHub 이슈(라벨 = 상태). 한 편의 질문 · 결정 · 버린 이유는 `shorts/<번호>/RECORD.md`에도 남긴다. 결정 지점은 [rules/workflow.md](../rules/workflow.md).

## 실제로 확인한 것 (2026-11-11)
| 단계 | 상태 | 근거 · 메모 |
|---|---|---|
| 유튜브 메타데이터(oEmbed) | ✅ 클라우드 | `www.youtube.com` 을 환경 허용 호스트에 추가한 뒤 |
| 자막: 한국어 자동번역 | ❌ 클라우드 | timedtext 429. `youtube-transcript-api` 는 google.com/sorry 로 튕김 |
| 자막: **원어(en-orig) 자동자막** | ✅ 클라우드 | `yt-dlp --js-runtimes node --skip-download --write-auto-subs --sub-langs en-orig --sub-format json3` — 단어 단위 타임코드가 나온다 |
| 구간 선택 | ✅ | json3 단어 타임코드로 문장 경계를 0.1초 단위로 자름 |
| HTML 데모 → mp4 | ✅ | `render.cjs` 1350프레임 약 70초 + ffmpeg |
| 원본 구간 편집 | ✅ 로컬 | `cut.cjs` — 001 진짜 원본으로 1080×1920 · 30fps · 47.9초 · -14.5 LUFS (2026-11-12) |
| **원본 영상 받기** | ❌ 클라우드 | "Sign in to confirm you're not a bot" — 데이터센터 IP 차단. 쿠키 넘기기는 계정 위험이라 안 씀 → **내 컴퓨터 몫**. 로컬에서 구간별로 받아짐(2026-11-12) |
| 영상 내용 보기 | 반쪽 | 에이전트는 재생 · 청취를 못 하고 대본만 읽는다. 파일이 있으면 프레임을 뽑아 볼 수 있다 |
| 슬랙 · Meta Graph | ⏸ 클라우드 | `slack.com` · `graph.facebook.com` 이 허용 호스트에 없음. 토큰을 보안 폼으로 받으면 호스트도 같이 열린다 |
| 유튜브 업로드 API | ⏸ | `www.googleapis.com` 은 닿음. 그러나 OAuth 접근 토큰이 1시간마다 만료 → 고정 키 주입으로는 안 됨 → GitHub Actions 에서 refresh token 으로 |
| 인스타 업로드 | ⏸ | ueber-secondbrain `ig-graph-facebook-login-path` 경로(페이지 토큰) + `instagram_content_publish` 권한. 릴스는 공개 URL 영상이 필요 |

## 화면 규칙 (v2 처음 모양 — 2026-11-12 결정으로 바뀜, 지금 규칙은 [rules/source.md](../rules/source.md))
- 9:16. 원본은 가운데 1080 폭(기본 y=520, 박힌 자막이 있으면 `fg.keep` · `fg.y`), 위아래는 같은 영상을 흐리게 · 어둡게.
- 위: 태그(`SAVED · 원본분 → 결과초`) + 제목. 아래: 내 자막(두꺼운 고딕, 강조는 노란 박스). 첫 구간에 화자 이름표.
- 끝: "내가 남기는 한 줄" 카드 3초 + 출처. 원본 소리는 살리고 loudnorm -14 LUFS.
