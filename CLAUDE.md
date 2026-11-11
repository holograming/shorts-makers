# 작업 규칙 — shorts-makers

무엇 · 왜: [README](README.md) · 결정 근거: [docs/interview.md](docs/interview.md) · 되는 것/막힌 것: [docs/pipeline.md](docs/pipeline.md)

## 일하는 방식
- **에이전트가 묻고 사용자가 결정한다.** 결정 1 · 2 · 3(→ interview.md)에서는 선택지 + 추천 하나를 내고 기다린다. 임의로 넘기지 않는다.
- 결정 1에는 **형태 샘플 프레임 1장**을 붙인다. 형태를 추측해 전체 렌더부터 하지 않는다(v1 교훈).
- 사용자 기본값을 에이전트가 바꾸지 않는다. 위험(저작권 등)이 보이면 알리고, 고르는 건 사용자.
- 한 편 = `shorts/<3자리 번호>-<주제>/`. `RECORD.md`에 질문 · 결정 · 버린 이유(사용자 원문)를 추가만 한다.
- 자막은 원문 번역이 아니라 **내 문장**. 필체는 Pretendard Black(두꺼운 고딕) 고정.
- 감지 회피 기법(반전 · 속도 · 피치 변조 등)은 넣지 않는다.

## 커밋하지 않는 것
영상(원본 구간 · 결과물), 자막 원본(`*.json3`), `build/` · `frames/`, `assets/fonts/`, `node_modules/`, 토큰.

## 커밋
- 제목 `type(scope): 요약` 한국어 72자 이하. 본문은 `대상: 무엇을` 목록, 끝에 `근거:` · `검증:` · `세션:`.

## 지금 상태와 다음 할 일 (2026-11-11 기준)
- **001-sentinel v2 대기 중**: 편집안 `shorts/001-sentinel/v2/edit.json` 완성, 원본 5구간 파일만 없다.
- 내 컴퓨터에서(로컬 세션이면 직접):
  ```sh
  cd shorts/001-sentinel/v2
  yt-dlp -f "bv*[height<=1080]+ba/b" --merge-output-format mp4 --force-keyframes-at-cuts \
    --download-sections "*18:10.3-18:19.3" --download-sections "*18:24.2-18:33.4" \
    --download-sections "*18:38.4-18:51.0" --download-sections "*27:36.9-27:46.0" \
    --download-sections "*31:01.3-31:06.1" \
    -o "c%(section_number)s.%(ext)s" "https://www.youtube.com/watch?v=yROCJ0OrSLE"
  cd ../../.. && npm run cut -- shorts/001-sentinel/v2    # → v2/out.mp4
  ```
  파일 이름이 c1~c5 로 안 나오면 순서대로 바꾼다(실행 검증 안 된 명령). 또는 원본 전체를 `v2/full.mp4` 로 두면 `cut.cjs` 가 구간을 잘라 쓴다.
  `out.mp4` 를 프레임 몇 장으로 확인한 뒤 사용자에게 **결정 2**를 묻는다.
- 그 다음 순서(추천): 이슈 라벨(상태) 만들고 001 이슈화 → 슬랙 수집기(토큰 필요) → GitHub Actions 비공개 업로드.
- 아직 없는 것: 새 인스타 · 유튜브 계정, 슬랙 앱, 이 레포에 대한 Claude GitHub 앱 권한(클라우드 세션 push 거절됨).
