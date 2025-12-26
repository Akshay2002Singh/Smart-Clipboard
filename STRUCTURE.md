# Project Structure

```
SmartClipboard/
├── src/
│   ├── assets/              # Images and assets
│   ├── components/          # UI components
│   │   ├── common/          # Button, Input, Card, ListItem, Dialogs
│   │   └── clipboard/       # TemplateModal
│   ├── config/              # Firebase config
│   ├── constants/           # App constants (limits, storage keys)
│   ├── context/             # AuthContext, ClipboardContext, DialogContext
│   ├── hooks/               # useClipboard
│   ├── navigation/          # AppNavigator
│   ├── screens/             # App screens
│   │   ├── auth/            # LoginScreen
│   │   ├── clipboard/       # ClipboardList, ClipboardEdit, TemplatesList, TemplateEdit
│   │   ├── notepad/         # NotepadScreen
│   │   └── profile/         # ProfileScreen
│   ├── services/            # Analytics, Crashlytics, FirebaseSync, Notification
│   ├── storage/             # MMKV storage
│   │   └── repositories/    # ClipboardRepository
│   ├── theme/               # ThemeProvider, colors
│   └── utils/               # date, uuid, network, encryption, debounce
├── App.tsx                  # Entry point
├── package.json
└── app.json                 # Expo config
```

## Key Files

- `App.tsx` - Main app component
- `src/storage/storage.ts` - MMKV storage configuration
- `src/storage/repositories/ClipboardRepository.ts` - Data access for clipboard/templates
- `src/context/ClipboardContext.tsx` - Main state management
- `src/services/FirebaseSyncService.ts` - Cloud synchronization logic
- `src/utils/encryption.ts` - Data encryption utilities

