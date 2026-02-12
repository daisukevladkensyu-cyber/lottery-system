# 🔑 APIキー制限設定ガイド

このガイドでは、Google Cloud ConsoleでAPIキーにHTTPリファラー制限を設定する手順を詳しく説明します。

## ⚠️ なぜこの設定が必要なのか？

Firebase設定ファイル（`firebase-config.js`）に含まれるAPIキーは、GitHubに公開されても**それ自体は問題ありません**。

しかし、**制限を設定しないと**、第三者があなたのAPIキーを使って：
- 他のウェブサイトからあなたのFirebaseプロジェクトにアクセス
- 無料枠を使い果たす
- 不正なデータを送信する

といったリスクがあります。

**HTTPリファラー制限**を設定することで、**許可されたドメインからのみ**APIキーが使用できるようになります。

---

## 📋 設定手順

### ステップ1: Google Cloud Consoleにアクセス

1. ブラウザで https://console.cloud.google.com/ を開く
2. Googleアカウントでログイン
3. 画面上部のプロジェクト選択ドロップダウンをクリック
4. **lottery-system-c09a3** を選択

### ステップ2: 認証情報ページに移動

1. 左上の「☰」メニューをクリック
2. **「APIとサービス」** にカーソルを合わせる
3. **「認証情報」** をクリック

または、以下のURLに直接アクセス：
```
https://console.cloud.google.com/apis/credentials?project=lottery-system-c09a3
```

### ステップ3: APIキーを見つける

「認証情報」ページで、以下のいずれかの名前のAPIキーを探します：
- **ブラウザキー (auto created by Firebase)**
- **Browser key (auto created by Firebase)**
- **API キー**

⚠️ **注意**: 複数のキーがある場合、Firebaseが自動作成したものを選んでください。

### ステップ4: APIキーの編集

1. 該当するAPIキーの右側にある **「︙」（縦3点）** をクリック
2. **「APIキーを編集」** を選択

### ステップ5: アプリケーションの制限を設定

#### 5-1. 「アプリケーションの制限」セクションを探す

画面中央あたりに「アプリケーションの制限」という項目があります。

#### 5-2. 「HTTPリファラー（ウェブサイト）」を選択

デフォルトでは「なし」が選択されています。これを **「HTTPリファラー（ウェブサイト）」** に変更します。

#### 5-3. リファラーを追加

「ウェブサイトの制限」の下に「項目を追加」ボタンが表示されます。

以下の3つのリファラーを追加してください：

```
lottery-system-c09a3.web.app/*
```

```
lottery-system-c09a3.firebaseapp.com/*
```

```
localhost/*
```

**入力方法：**
1. 「項目を追加」をクリック
2. 1つ目のリファラー `lottery-system-c09a3.web.app/*` を入力
3. 「項目を追加」をクリック
4. 2つ目のリファラー `lottery-system-c09a3.firebaseapp.com/*` を入力
5. 「項目を追加」をクリック
6. 3つ目のリファラー `localhost/*` を入力

**各リファラーの意味：**
- `lottery-system-c09a3.web.app/*` - Firebase Hostingのメインドメイン
- `lottery-system-c09a3.firebaseapp.com/*` - Firebase Hostingの代替ドメイン
- `localhost/*` - ローカル開発環境（テスト用）

### ステップ6: APIの制限を設定

#### 6-1. 「APIの制限」セクションを探す

「アプリケーションの制限」の下に「APIの制限」という項目があります。

#### 6-2. 「キーを制限」を選択

デフォルトでは「制限しない」が選択されています。これを **「キーを制限」** に変更します。

#### 6-3. 必要なAPIのみを有効化

「APIを選択」ドロップダウンまたはリストから、以下の**3つのAPIのみ**にチェックを入れます：

✅ **Identity Toolkit API**
- 説明: Firebase Authenticationで使用
- 重要度: 必須

✅ **Cloud Firestore API**
- 説明: Firestoreデータベースで使用
- 重要度: 必須

✅ **Firebase Installations API**
- 説明: Firebaseアプリの識別で使用
- 重要度: 必須

⚠️ **注意**: これら以外のAPIはチェックを外してください。

#### 6-4. APIが見つからない場合

もし上記のAPIがリストに表示されない場合：

1. 画面上部の検索ボックスで「Identity Toolkit API」を検索
2. 「有効にする」をクリック
3. 同様に「Cloud Firestore API」と「Firebase Installations API」も有効化
4. 再度APIキーの編集画面に戻る

### ステップ7: 保存

1. 画面下部の **「保存」** ボタンをクリック
2. 「APIキーが更新されました」というメッセージが表示されれば成功

---

## ✅ 設定確認

設定が正しく完了したか確認します：

### 確認1: アプリケーションの制限

APIキーの詳細画面で、以下のように表示されているか確認：

```
アプリケーションの制限: HTTPリファラー
ウェブサイトの制限:
  - lottery-system-c09a3.web.app/*
  - lottery-system-c09a3.firebaseapp.com/*
  - localhost/*
```

### 確認2: APIの制限

```
APIの制限: 制限あり
選択されたAPI:
  - Identity Toolkit API
  - Cloud Firestore API
  - Firebase Installations API
```

---

## 🧪 テスト方法

設定が正しく機能しているか確認します：

### テスト1: ローカルでの動作確認

1. `index.html` をブラウザで開く（`file://` プロトコル）
2. Googleログインを試す
3. **エラーが出るのが正常です**（HTTPリファラーに `file://` は含まれていないため）

### テスト2: Firebase Hostingでの動作確認

1. Firebase Hostingにデプロイ
2. `https://lottery-system-c09a3.web.app/` にアクセス
3. Googleログインを試す
4. **正常にログインできれば成功です**

### テスト3: ローカルサーバーでの動作確認

```powershell
# 簡易HTTPサーバーを起動
python -m http.server 8000
# または
npx http-server -p 8000
```

1. http://localhost:8000 にアクセス
2. Googleログインを試す
3. **正常にログインできれば成功です**

---

## 🚨 トラブルシューティング

### エラー: "This API key is not authorized to use this service or API"

**原因**: 必要なAPIが有効化されていない

**解決方法**:
1. Google Cloud Console > APIとサービス > ライブラリ
2. 「Identity Toolkit API」を検索して有効化
3. 「Cloud Firestore API」を検索して有効化
4. 「Firebase Installations API」を検索して有効化

### エラー: "API keys with referer restrictions cannot be used with this API"

**原因**: 一部のFirebase機能はHTTPリファラー制限と互換性がない

**解決方法**:
1. 新しいAPIキーを作成（Webアプリ用）
2. 古いキーは削除せず、用途を分ける

### ログインできない（localhost）

**原因**: HTTPリファラーに `localhost/*` が含まれていない

**解決方法**:
1. APIキーの編集画面に戻る
2. `localhost/*` を追加
3. 保存

### ログインできない（デプロイ後）

**原因**: HTTPリファラーにFirebase Hostingのドメインが含まれていない

**解決方法**:
1. APIキーの編集画面に戻る
2. `lottery-system-c09a3.web.app/*` を追加
3. `lottery-system-c09a3.firebaseapp.com/*` を追加
4. 保存

---

## 📚 参考資料

- [Firebase API キーの使用と管理](https://firebase.google.com/docs/projects/api-keys)
- [Google Cloud API キーのベストプラクティス](https://cloud.google.com/docs/authentication/api-keys)

---

## 🔐 セキュリティのポイント

✅ **やるべきこと:**
- HTTPリファラー制限を設定
- 必要最小限のAPIのみ有効化
- 定期的に使用状況を確認

❌ **やってはいけないこと:**
- 「制限なし」のまま放置
- すべてのAPIを有効化
- `*`（ワイルドカードのみ）のリファラー設定

---

**最終更新**: 2026年2月12日  
**プロジェクトID**: lottery-system-c09a3
