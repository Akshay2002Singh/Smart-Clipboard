# Smart Clipboard

A privacy-focused snippet manager built with React Native. Create and organize your own copiable text items, build powerful templates with dynamic variables, and keep a quick scratchpad.

## Features

- **Clipboard Manager**: Store and organize clipboard snippets.
- **Smart Templates**: Create reusable text templates with dynamic variables (e.g., `{{name}}`, `{{date}}`) for quick replies.
- **Notepad**: A simple, local-only scratchpad for temporary thoughts.
- **Privacy First**: All data is stored locally using MMKV. Cloud sync is 100% optional.
- **Secure Sync**: If you choose to sync, your data is encrypted before it leaves your device.

## Use Cases

### ⚡️ Clipboard
Best for static text you copy repeatedly—no retyping, no hunting through old chats.
- **Profiles & Links**: Personal website, LinkedIn, GitHub, Calendly, app store links..
- **Dev & Ops Snippets**: .gitignore templates, environment variables, Docker commands, API base URLs.
- **Personal Info**: Phone number, address, email, etc.

### 📝 Templates
Designed for personalized messages at scale using dynamic variables like {{name}}, {{role}}, or {{date}}.
- **Job Applications**: "Tailored cover letters, interview follow-ups, recruiter outreach."
- **Team Communication**: Standups, retrospectives, handoff notes, or incident updates.
- **Customer Support**: Standard responses customized for each user.

## Tech Stack

- **Core**: React Native 0.81, React 19, TypeScript
- **Storage**: MMKV (via NitroModules) for high-performance local storage
- **Cloud**: Firebase (Auth, Firestore, Crashlytics)
- **UI**: React Native Paper, Reanimated 3
- **Navigation**: React Navigation 7
- **Security**: Crypto-js for encryption

## Installation

```bash
npm install --legacy-peer-deps
```

## Run for android

```bash
npm run android
```

## Troubleshooting

**Device not found (Android):**
```bash
adb devices
```


## Build Android
#### For APK
```bash
cd android && ./gradlew assembleRelease
```
#### For AAB
```bash
cd android && ./gradlew bundleRelease
```