# 졸라맨 키우기 Android 빌드

이 저장소는 HTML 게임을 Capacitor로 Android APK로 빌드합니다.

## GitHub Actions

main 브랜치에 push하면 자동으로 APK 빌드가 실행됩니다.
Actions에서 **Build Android APK**를 수동 실행할 수도 있습니다.

빌드가 성공하면 Artifacts에서 **jolaman-study-warrior-debug-apk**를 내려받을 수 있습니다.

## 중요

- 초기 빌드는 package-lock.json이 없어도 되도록 npm install을 사용합니다.
- Android 프로젝트는 GitHub Actions 실행 환경에서 자동 생성됩니다.
- 앱 ID: com.jolaman.studywarrior
- 앱 이름: 졸라맨 키우기
- Play Store 출시 시에는 서명된 release AAB가 필요합니다.
