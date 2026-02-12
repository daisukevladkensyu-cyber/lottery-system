// ==========================================
// 落選者データ削除スクリプト
// ==========================================
//
// 使用方法：
// 1. 当選者へのメール送信が完了したことを確認
// 2. npm run delete-losers を実行
// 3. 確認後、落選者のデータが削除される
//
// ⚠️ 警告: この操作は取り消せません！
//

import admin from 'firebase-admin';
import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Firebase Admin初期化
try {
    const serviceAccount = JSON.parse(
        fs.readFileSync('./serviceAccountKey.json', 'utf8')
    );

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase Admin SDK初期化完了');
} catch (error) {
    console.error('❌ エラー: serviceAccountKey.json が見つかりません');
    process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

// ==========================================
// 質問関数
// ==========================================

function question(query) {
    return new Promise(resolve => {
        rl.question(query, resolve);
    });
}

// ==========================================
// 落選者データの削除
// ==========================================

async function deleteLosers() {
    try {
        // losers.jsonを読み込み
        if (!fs.existsSync('losers.json')) {
            console.error('❌ エラー: losers.json が見つかりません');
            console.error('先に npm run lottery を実行してください');
            process.exit(1);
        }

        const losers = JSON.parse(
            fs.readFileSync('losers.json', 'utf8')
        );

        if (losers.length === 0) {
            console.log('⚠️  削除する落選者データがありません');
            process.exit(0);
        }

        console.log('');
        console.log('⚠️  警告: この操作は取り消せません！');
        console.log(`📊 削除対象: ${losers.length}名の落選者データ`);
        console.log('');
        console.log('削除されるデータ:');
        console.log('  - Firestoreの応募データ');
        console.log('  - Firebase Authenticationのユーザーアカウント');
        console.log('');

        const answer = await question('本当に削除しますか？ (yes/no): ');

        if (answer.toLowerCase() !== 'yes') {
            console.log('❌ キャンセルしました');
            process.exit(0);
        }

        console.log('');
        console.log('🗑️  削除を実行中...');

        let successCount = 0;
        let errorCount = 0;

        for (const loser of losers) {
            try {
                // Firestoreからデータ削除
                await db.collection('applicants').doc(loser.uid).delete();

                // Authenticationからユーザー削除
                try {
                    await auth.deleteUser(loser.uid);
                } catch (authError) {
                    // ユーザーが既に削除されている場合はスキップ
                    if (authError.code !== 'auth/user-not-found') {
                        throw authError;
                    }
                }

                successCount++;
                console.log(`   ✓ ${loser.email}`);

            } catch (error) {
                errorCount++;
                console.error(`   ✗ ${loser.email} - エラー: ${error.message}`);
            }
        }

        console.log('');
        console.log('✅ 削除完了');
        console.log(`   - 成功: ${successCount}件`);
        console.log(`   - 失敗: ${errorCount}件`);

        if (errorCount === 0) {
            console.log('');
            console.log('🎉 すべての落選者データを安全に削除しました');
            console.log('📧 当選者へのメール送信を忘れずに！');
        }

    } catch (error) {
        console.error('❌ エラー:', error);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// 実行
deleteLosers()
    .then(() => {
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ エラー:', error);
        process.exit(1);
    });
