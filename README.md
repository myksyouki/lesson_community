# 音楽コミュニティアプリ

楽器演奏者のためのコミュニティプラットフォームアプリケーション。
楽器ごとのチャンネルが用意されており、演奏テクニックや機材についての情報交換、初心者の質問など多様な交流が可能です。

## 機能

- 楽器ごとのチャンネル
- スレッド形式のディスカッション
- HOTスレッドの表示
- プロフィール管理
- 画像/音声メッセージのサポート
- GoogleアカウントでのログインとEメール/パスワード認証

## 技術スタック

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Firebase](https://firebase.google.com/)
  - Authentication（認証）
  - Firestore（データベース）
  - Storage（ファイルストレージ）

## セットアップ

### 前提条件

- Node.js (16.x 以上)
- npm または yarn
- Expo CLI (`npm install -g expo-cli`)
- Firebase プロジェクト

### 初期設定

1. リポジトリをクローン
```bash
git clone <リポジトリURL>
cd music_community
```

2. 依存パッケージのインストール
```bash
npm install
# または
yarn install
```

3. Firebase設定

Firebase コンソールから新しいプロジェクトを作成し、Webアプリケーションとして登録します。
発行された設定情報を `.env` ファイルに記入します。

```dotenv
EXPO_PUBLIC_FIREBASE_API_KEY=XXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=XXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_PROJECT_ID=XXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=XXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=XXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_APP_ID=XXXXXXXXXXXX
```

4. Google認証設定 (オプション)

Google認証を使用する場合は、Firebase コンソールで Google 認証プロバイダーを有効にし、
OAuthクライアントIDを取得して `.env` ファイルに追加します。

```dotenv
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=XXXXXXXXXXXX
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=XXXXXXXXXXXX
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=XXXXXXXXXXXX
```

### 開発サーバーの起動

```bash
npx expo start -c
```

## ディレクトリ構成

- `/app`: メインアプリケーションコード (Expo Router ファイルベースのルーティング)
- `/components`: 再利用可能なUIコンポーネント
- `/contexts`: Reactコンテキスト（Firebase、User、Data）
- `/firebase`: Firebase設定とサービス
- `/hooks`: カスタムReactフック
- `/constants`: 定数と設定
- `/utils`: ユーティリティ関数
- `/assets`: 画像やフォントなどの静的アセット

## バックエンド機能

アプリケーションは以下のバックエンド機能を提供しています：

1. **認証管理**: メール/パスワード認証、Google認証
2. **ユーザープロファイル管理**: プロフィール情報の保存と更新
3. **チャンネル管理**: チャンネルの作成、一覧取得、更新、削除
4. **スレッド管理**: スレッドの作成、一覧取得、更新、削除
5. **メッセージ管理**: メッセージの送信、取得、削除、添付ファイル対応
6. **リアルタイムデータ同期**: Firestoreのリアルタイムリスナーによるデータ同期

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
