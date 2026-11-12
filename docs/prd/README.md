# PRD — 시험 중인 기획

여기 있는 것은 아직 굳지 않았다. 사용자가 결정하면 [문서 규칙](../README.md#prd--정식-자리로-옮기는-기준)대로 옮긴다.

| 문서 | 무엇 | 상태 |
|---|---|---|
| [interview.md](interview.md) | 처음 방향 인터뷰(2026-11-10~11) · 저작권 판단 과정 | 기록. 결정은 decisions.md 로 옮김 |
| [pipeline.md](pipeline.md) | 수집 → 이해 → 편집 → 업로드 흐름, 되는 것 · 막힌 것 | 2026-11-12 기준 |
| (예정) template.md | AgentOS 채널 9편 분석에서 나온 템플릿 · 전달 장치 | 정리 전 |

## 지금 상태와 다음 할 일 (2026-11-13 기준)
- 001-sentinel v2: 원본 자막 그대로 + 이해 장면 3초 ×4 + 내 한 줄, 59.9초로 렌더함. 결정 2 미정(형식 자체를 다시 보는 중).
- 다음: AgentOS 분석을 `template.md` 로 정리 → 001 을 새 틀로 형태 샘플 → 결정.
- 그 뒤(추천 순서): 이슈 라벨(상태) · 001 이슈화 → 슬랙 수집기(토큰 필요) → GitHub Actions 비공개 업로드.
- 아직 없는 것: 새 인스타 · 유튜브 계정, 슬랙 앱, 이 레포에 대한 Claude GitHub 앱 권한.

## 원본 구간 받기 (내 컴퓨터, 2026-11-12 검증)
`--download-sections` 를 한 번에 여러 개 주면 `section_number` 가 NA 라 한 파일에 덮어쓴다. 구간마다 따로 받는다.
```sh
cd shorts/<편>/v2; i=1
for s in 18:10.3-18:19.3 18:24.2-18:33.4 ...; do
  yt-dlp --js-runtimes node -f "bv*[height<=1080]+ba/b" --merge-output-format mp4 --force-keyframes-at-cuts \
    --download-sections "*$s" -o "c$i.%(ext)s" "<원본 URL>"; i=$((i+1)); done
cd ../../.. && npm run cut -- shorts/<편>/v2    # → out.mp4 (--sample 이면 형태 샘플만)
```
yt-dlp 는 최신으로(2026.10.26 검증). 편집안 형식은 `tools/cut.cjs` 머리 주석이 정본.
