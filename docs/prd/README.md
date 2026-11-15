# PRD — 시험 중인 기획

여기 있는 것은 아직 굳지 않았다. 사용자가 결정하면 [문서 규칙](../README.md#prd--정식-자리로-옮기는-기준)대로 옮긴다.

| 문서 | 무엇 | 상태 |
|---|---|---|
| [interview.md](interview.md) | 처음 방향 인터뷰(2026-11-10~11) · 저작권 판단 과정 | 기록. 결정은 decisions.md 로 옮김 |
| [pipeline.md](pipeline.md) | 수집 → 이해 → 편집 → 업로드 흐름, 되는 것 · 막힌 것 | 2026-11-12 기준 |
| [template.md](template.md) | 원본 그대로 + 내 노트 템플릿 · 전달 장치 · 리듬 규칙 | 초안 |
| [research-agentos.md](research-agentos.md) | AgentOS 채널 9편 조사 표(template 의 근거) | 2026-11-13 |

## 지금 상태와 다음 할 일
→ 옮김: [.claude/small-step.md](../../.claude/small-step.md)

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
