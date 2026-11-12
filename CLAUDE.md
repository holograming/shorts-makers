@AGENTS.md

# Claude 전용
- 결정 지점 질문은 질문 도구(AskUserQuestion)로, 추천 하나를 맨 앞에. 결정 1에는 형태 샘플 프레임을 붙인다.
- 영상 · 이미지를 보여 줄 때는 파일로 보내고(로컬이면 `open` 도), 프레임 몇 장으로 직접 확인한 뒤 묻는다.
- 세컨브레인 MCP(`secondbrain`)가 있으면 시작 · 리뷰 때 `get_guide` · `get_criteria` 를 먼저 본다. 이 레포 문서가 먼저다.
