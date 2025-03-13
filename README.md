# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## リファクタリング計画

### ディレクトリ構造の改善

```
music_community/
├── app/                    # Expo Routerのルート
├── assets/                 # 画像やフォントなどの静的ファイル
├── components/             # 共通コンポーネント
│   ├── common/             # 汎用的なUIコンポーネント
│   ├── layout/             # レイアウト関連コンポーネント
│   ├── features/           # 機能別コンポーネント
│   │   ├── sidemenu/       # サイドメニュー関連
│   │   ├── music/          # 音楽関連（CircleOfFifths、DrumRollなど）
│   │   └── ...
├── constants/              # 定数定義
├── contexts/               # Reactコンテキスト
│   ├── user/               # ユーザー関連コンテキスト
│   ├── data/               # データ関連コンテキスト
│   └── ...
├── hooks/                  # カスタムフック
├── types/                  # 型定義
├── utils/                  # ユーティリティ関数
├── services/               # APIやFirebase関連のサービス
│   ├── api/                # API関連
│   ├── firebase/           # Firebase関連
│   └── ...
└── ...
```

### リファクタリングの主なポイント

1. **大きなコンポーネントの分割**
   - SideMenu、CircleOfFifthsMenu、DrumRollFABなどの大きなコンポーネントを小さな単位に分割

2. **コンテキストの責務分離**
   - DataContextを複数の小さなコンテキストに分割（ChannelContext、ThreadContextなど）

3. **型定義の共通化**
   - 共通の型定義を`types`ディレクトリに集約

4. **ロジックの分離**
   - UIコンポーネントからビジネスロジックを分離
   - カスタムフックの活用

5. **テストの改善**
   - 単体テストの追加
   - コンポーネントテストの追加

6. **パフォーマンスの最適化**
   - メモ化の適切な使用
   - 不要な再レンダリングの防止

### リファクタリング進捗状況

#### 完了した項目

1. **ディレクトリ構造の改善**
   - 新しいディレクトリ構造を作成

2. **型定義の共通化**
   - 共通の型定義を`types/index.ts`に集約

3. **定数の整理**
   - テーマ関連の定数を`constants/theme.ts`に集約

4. **コンテキストの責務分離**
   - DataContextをChannelContextとThreadContextに分割
   - UserContextを整理

5. **コンポーネントの分割**
   - SideMenuコンポーネントをMiniMenuとFullMenuに分割

#### 今後の課題

1. **残りの大きなコンポーネントの分割**
   - CircleOfFifthsMenu、DrumRollFABなどの分割

2. **ロジックの分離**
   - カスタムフックの作成と活用

3. **テストの追加**
   - 単体テストとコンポーネントテストの追加

4. **パフォーマンスの最適化**
   - メモ化の適用
   - 不要な再レンダリングの防止
