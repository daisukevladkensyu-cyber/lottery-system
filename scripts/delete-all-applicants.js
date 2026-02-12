// ==========================================
// 全応募者データ削除スクリプト（緊急用）
// ==========================================
//
// 使用方法：
// npm run delete-all
//
// ⚠️ 警告: このスクリプトはすべての応募者データを削除します！
// 通常は使用しないでください。テスト時や緊急時のみ使用してください。
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
// 全応募者データの削除
// ==========================================

async function deleteAllApplicants() {
    try {
        console.log('');
        console.log('🚨 警告: すべての応募者データを削除します！');
        console.log('⚠️  この操作は取り消せません！');
        console.log('');

        const answer1 = await question('本当にすべて削除しますか？ (yes/no): ');

        if (answer1.toLowerCase() !== 'yes') {
            console.log('❌ キャンセルしました');
            process.exit(0);
        }

        const answer2 = await question('もう一度確認します。本当に削除しますか？ (DELETE): ');

        if (answer2 !== 'DELETE') {
            console.log('❌ キャンセルしました');
            process.exit(0);
        }

        console.log('');
        console.log('📥 応募者データを取得中...');

        const snapshot = await db.collection('applicants').get();

        if (snapshot.empty) {
            console.log('⚠️  応募者データが見つかりません');
            process.exit(0);
        }

        console.log(`📊 削除対象: ${snapshot.size}件`);
        console.log('');
        console.log('🗑️  削除を実行中...');

        let successCount = 0;
        let errorCount = 0;

        for (const doc of snapshot.docs) {
            try {
                const data = doc.data();

                // Firestoreからデータ削除
                await doc.ref.delete();

                // Authenticationからユーザー削除
                try {
                    await auth.deleteUser(doc.id);
                } catch (authError) {
                    if (authError.code !== 'auth/user-not-found') {
                        throw authError;
                    }
                }

                successCount++;
                console.log(`   ✓ ${data.email || doc.id}`);

            } catch (error) {
                errorCount++;
                console.error(`   ✗ ${doc.id} - エラー: ${error.message}`);
            }
        }

        console.log('');
        console.log('✅ 削除完了');
        console.log(`   - 成功: ${successCount}件`);
        console.log(`   - 失敗: ${errorCount}件`);

    } catch (error) {
        console.error('❌ エラー:', error);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// 実行
deleteAllApplicants()
    .then(() => {
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ エラー:', error);
        process.exit(1);
    });
