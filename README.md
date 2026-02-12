# 🎁 安全な抽選応募システム

セキュリティを最優先に設計された、Googleログイン認証付きの抽選応募システムです。

## 🌟 特徴

- ✅ **Googleログイン認証** - 1人1回のみ応募可能
- 🔒 **最高レベルのセキュリティ** - Firestoreセキュリティルールで個人情報を保護
- 🚫 **データ漏洩防止** - 第三者はデータを一切読み取れない設計
- 🗑️ **プライバシー保護** - 落選者データの自動削除機能
- 📱 **レスポンシブデザイン** - スマホ・タブレット対応
- 🎨 **モダンなUI** - グラデーション、アニメーション付き

## 📋 必要なもの

- Googleアカウント
- Firebaseプロジェクト（無料プラン可）
- Node.js（管理者用スクリプト実行時のみ）

## 🚀 セットアップ手順

### 1. Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: lottery-system）
4. Google Analyticsは不要なので無効化してOK

### 2. Firebase Authenticationの設定

1. Firebase Console > Authentication > 始める
2. 「ログイン方法」タブ > Google を有効化
3. プロジェクトのサポートメールを設定
4. 保存

### 3. Cloud Firestoreの設定

1. Firebase Console > Firestore Database > データベースを作成
2. **本番環境モード**で開始（重要！）
3. ロケーションを選択（asia-northeast1 推奨）
4. 「ルール」タブを開く
5. `firestore.rules` の内容をコピー＆ペースト
6. 「公開」をクリック

### 4. ウェブアプリの登録

1. Firebase Console > プロジェクト設定（歯車アイコン）
2. 「全般」タブ > マイアプリ > ウェブアプリを追加
3. アプリのニックネームを入力（例: lottery-web）
4. Firebase Hostingは後で設定するのでチェック不要
5. 表示された設定値をコピー

### 5. Firebase設定ファイルの作成

1. `firebase-config.template.js` をコピーして `firebase-config.js` を作成
2. コピーした設定値を貼り付け

```javascript
export const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

### 6. APIキーの制限設定（重要！）

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. Firebaseプロジェクトを選択
3. 「APIとサービス」 > 「認証情報」
4. 「ブラウザキー」をクリック
5. **アプリケーションの制限**:
   - 「HTTPリファラー（ウェブサイト）」を選択
   - 許可するドメインを追加:
     - `your-project.web.app/*`
     - `your-project.firebaseapp.com/*`
     - `localhost/*`（開発用）
6. **APIの制限**:
   - 「キーを制限」を選択
   - 以下のAPIのみ有効化:
     - Identity Toolkit API
     - Cloud Firestore API
     - Firebase Installations API
7. 保存

### 7. Firebase Hostingへのデプロイ

```powershell
# Firebase CLIをインストール（初回のみ）
npm install -g firebase-tools

# Firebaseにログイン
firebase login

# プロジェクトを初期化
firebase init hosting

# 以下のように選択:
# - 既存のプロジェクトを使用
# - Public directoryは "." (カレントディレクトリ)
# - Single-page appは "No"
# - GitHubとの連携は "No"

# デプロイ
firebase deploy --only hosting
```

デプロイ完了後、表示されたURLにアクセスしてサイトを確認できます。

## 🔧 管理者用スクリプト

抽選実施と落選者データ削除のためのスクリプトを用意しています。

### セットアップ

1. Firebase Console > プロジェクト設定 > サービスアカウント
2. 「新しい秘密鍵の生成」をクリック
3. ダウンロードしたJSONファイルを `serviceAccountKey.json` として保存
4. 依存関係をインストール:

```powershell
npm install
```

### 使用方法

#### 1. 応募者データのエクスポート

```powershell
npm run export
```

- `applicants.json` が生成されます
- 統計情報（未抽選・当選・落選の件数）が表示されます

#### 2. 抽選の実行

```powershell
npm run lottery
```

- 当選者数を入力
- `winners.json` と `losers.json` が生成されます

#### 3. 当選者へのメール送信

`winners.json` を確認し、当選者にメールを送信してください。

**メール例:**

```
件名: 【当選のお知らせ】抽選結果について

〇〇様

この度は抽選にご応募いただき、誠にありがとうございました。
厳正なる抽選の結果、見事当選されましたのでご連絡いたします。

おめでとうございます！

詳細につきましては、別途ご連絡させていただきます。

---
抽選システム運営事務局
```

#### 4. 落選者データの削除

```powershell
npm run delete-losers
```

- 確認プロンプトが表示されます
- `yes` と入力すると削除が実行されます
- Firestoreのデータと、Firebase Authenticationのアカウントが削除されます

#### 5. 全データ削除（緊急用）

```powershell
npm run delete-all
```

⚠️ **警告**: すべての応募者データを削除します。テスト時や緊急時のみ使用してください。

## 📊 ワークフロー

```
1. ユーザーが応募
   ↓
2. データがFirestoreに保存
   ↓
3. 管理者がデータをエクスポート (npm run export)
   ↓
4. 抽選を実行 (npm run lottery)
   ↓
5. 当選者にメールを送信
   ↓
6. 落選者データを削除 (npm run delete-losers)
```

## 🔒 セキュリティチェックリスト

公開前に必ず確認してください：

- [ ] Firestoreのセキュリティルールが設定されている
- [ ] Google Cloud ConsoleでAPIキーの制限が設定されている
- [ ] `.gitignore` に `serviceAccountKey.json` が含まれている
- [ ] Firebase Authenticationで「Googleログイン」が有効化されている
- [ ] 予算アラートがGoogle Cloud Consoleで設定されている
- [ ] プライバシーポリシーが表示されている

## 🛡️ セキュリティ対策の詳細

### 1. Firestoreセキュリティルール

```javascript
// ✅ 認証済みユーザーのみが自分のデータを作成可能
allow create: if request.auth != null && request.auth.uid == uid;

// ✅ 誰もデータを読み取れない
allow read: if false;

// ✅ データの更新・削除は誰もできない
allow update, delete: if false;
```

### 2. APIキーの制限

- HTTPリファラー制限で、許可されたドメインからのみアクセス可能
- 必要最小限のAPIのみ有効化

### 3. データの最小化

- 必要な情報のみ収集（氏名、メールアドレス）
- 抽選後、落選者データは速やかに削除

### 4. 管理者権限の分離

- フロントエンドからはデータの読み取り不可
- 管理者はAdmin SDKを使用してローカルで操作

## 📱 対応ブラウザ

- Chrome（推奨）
- Firefox
- Safari
- Edge

## ⚠️ トラブルシューティング

### ログインできない

- ポップアップがブロックされていないか確認
- Firebase Authenticationで「Google」が有効化されているか確認

### 応募ボタンを押してもエラーになる

- Firestoreのセキュリティルールが正しく設定されているか確認
- ブラウザのコンソールでエラーメッセージを確認

### スクリプトが実行できない

- `serviceAccountKey.json` が正しく配置されているか確認
- `npm install` を実行したか確認

## 📄 ライセンス

MIT License

## 🙋 サポート

問題が発生した場合は、以下を確認してください：

1. Firebase Consoleのログ
2. ブラウザのデベロッパーツール（F12）のコンソール
3. `firestore.rules` の設定

---

**作成日**: 2026年2月12日  
**バージョン**: 1.0.0
