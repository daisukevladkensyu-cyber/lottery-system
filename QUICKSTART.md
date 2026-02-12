# 🚀 クイックスタートガイド

このガイドに従えば、5分で抽選システムを公開できます！

## ステップ1: Firebaseプロジェクトを作成（2分）

1. https://console.firebase.google.com/ にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `my-lottery`）
4. Google Analyticsは無効化してOK
5. 「プロジェクトを作成」をクリック

## ステップ2: Authenticationを有効化（1分）

1. 左メニュー > **Authentication** > 「始める」
2. 「ログイン方法」タブ > **Google** を有効化
3. サポートメールを選択
4. 「保存」

## ステップ3: Firestoreを作成（1分）

1. 左メニュー > **Firestore Database** > 「データベースを作成」
2. **本番環境モード**を選択（重要！）
3. ロケーション: **asia-northeast1** を選択
4. 「有効にする」

## ステップ4: セキュリティルールを設定（30秒）

1. Firestore Database > 「ルール」タブ
2. `firestore.rules` の内容をコピー
3. ペーストして「公開」

## ステップ5: ウェブアプリを登録（1分）

1. プロジェクト設定（歯車アイコン）> 「全般」タブ
2. マイアプリ > **ウェブアプリを追加**
3. アプリのニックネーム: `lottery-web`
4. Firebase Hostingは**チェックしない**
5. 「アプリを登録」

## ステップ6: 設定ファイルを作成（30秒）

1. 表示された設定値をコピー
2. `firebase-config.template.js` をコピーして `firebase-config.js` を作成
3. 設定値を貼り付け

```javascript
export const firebaseConfig = {
    apiKey: "コピーした値",
    authDomain: "コピーした値",
    projectId: "コピーした値",
    storageBucket: "コピーした値",
    messagingSenderId: "コピーした値",
    appId: "コピーした値"
};
```

## ステップ7: APIキーを制限（重要！）

1. https://console.cloud.google.com/ にアクセス
2. プロジェクトを選択
3. 「APIとサービス」 > 「認証情報」
4. 「ブラウザキー」をクリック
5. アプリケーションの制限:
   - 「HTTPリファラー」を選択
   - `your-project.web.app/*` を追加
   - `localhost/*` を追加
6. APIの制限:
   - 「キーを制限」を選択
   - Identity Toolkit API ✓
   - Cloud Firestore API ✓
   - Firebase Installations API ✓
7. 「保存」

## ステップ8: デプロイ（2分）

PowerShellで以下を実行:

```powershell
# Firebase CLIをインストール（初回のみ）
npm install -g firebase-tools

# ログイン
firebase login

# 初期化
firebase init hosting
# - 既存のプロジェクトを使用
# - Public directory: . (ドット)
# - Single-page app: No
# - GitHub: No

# デプロイ
firebase deploy --only hosting
```

## 完了！🎉

デプロイが完了すると、URLが表示されます:
```
Hosting URL: https://your-project.web.app
```

このURLにアクセスして、動作を確認してください！

---

## 📝 次のステップ

### テスト応募してみる
1. 公開されたURLにアクセス
2. Googleアカウントでログイン
3. 応募してみる

### 管理者用スクリプトのセットアップ

```powershell
# 依存関係をインストール
npm install

# サービスアカウントキーをダウンロード
# Firebase Console > プロジェクト設定 > サービスアカウント
# > 「新しい秘密鍵の生成」
# ダウンロードしたファイルを serviceAccountKey.json として保存

# 応募者データをエクスポート
npm run export

# 抽選を実行
npm run lottery

# 落選者データを削除
npm run delete-losers
```

---

## ⚠️ トラブルシューティング

### ログインできない
- Firebase Authenticationで「Google」が有効化されているか確認

### 応募ボタンを押してもエラー
- Firestoreのセキュリティルールが設定されているか確認
- ブラウザのコンソール（F12）でエラーを確認

### デプロイできない
- `firebase login` を実行したか確認
- プロジェクトIDが正しいか確認

---

## 📚 詳細ドキュメント

- **README.md**: 詳細なセットアップ手順
- **SECURITY.md**: セキュリティガイド

---

**作成日**: 2026年2月12日
