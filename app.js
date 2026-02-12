// ==========================================
// メインアプリケーションロジック
// ==========================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

import { firebaseConfig } from './firebase-config.js';

// ==========================================
// Firebase初期化
// ==========================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ==========================================
// DOM要素の取得
// ==========================================

const screens = {
    loading: document.getElementById('loading'),
    login: document.getElementById('login-screen'),
    application: document.getElementById('application-screen'),
    success: document.getElementById('success-screen'),
    error: document.getElementById('error-screen'),
    alreadyApplied: document.getElementById('already-applied-screen')
};

const elements = {
    googleLoginBtn: document.getElementById('google-login-btn'),
    submitBtn: document.getElementById('submit-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    logoutAlreadyBtn: document.getElementById('logout-already-btn'),
    closeBtn: document.getElementById('close-btn'),
    retryBtn: document.getElementById('retry-btn'),
    userName: document.getElementById('user-name'),
    userEmail: document.getElementById('user-email'),
    errorMessage: document.getElementById('error-message')
};

// ==========================================
// 画面制御
// ==========================================

function showScreen(screenName) {
    // すべての画面を非表示
    Object.values(screens).forEach(screen => {
        screen.classList.add('hidden');
    });

    // 指定された画面を表示
    if (screens[screenName]) {
        screens[screenName].classList.remove('hidden');
    }
}

function showError(message) {
    elements.errorMessage.textContent = message;
    showScreen('error');
}

// ==========================================
// 認証状態の監視
// ==========================================

console.log('🔄 認証状態の監視を開始...');

onAuthStateChanged(auth, async (user) => {
    console.log('👤 認証状態変更:', user ? `ログイン済み (${user.email})` : '未ログイン');

    if (user) {
        // ログイン済み - 既に応募しているかチェック
        console.log('📋 応募状態をチェック中...');
        await checkApplicationStatus(user);
    } else {
        // 未ログイン - ログイン画面を表示
        console.log('🔓 ログイン画面を表示');
        showScreen('login');
    }
});

// ==========================================
// 応募状態のチェック
// ==========================================

async function checkApplicationStatus(user) {
    try {
        console.log('🔍 Firestoreからデータ取得中...', user.uid);
        const docRef = doc(db, 'applicants', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // 既に応募済み
            console.log('✅ 既に応募済み');
            showScreen('alreadyApplied');
        } else {
            // 未応募 - 応募フォームを表示
            console.log('📝 未応募 - 応募フォームを表示');
            displayUserInfo(user);
            showScreen('application');
        }
    } catch (error) {
        console.error('❌ 応募状態の確認エラー:', error);
        console.error('エラーコード:', error.code);
        console.error('エラーメッセージ:', error.message);
        showError('応募状態の確認中にエラーが発生しました。再度お試しください。');
    }
}

// ==========================================
// ユーザー情報の表示
// ==========================================

function displayUserInfo(user) {
    elements.userName.textContent = user.displayName || '名前未設定';
    elements.userEmail.textContent = user.email || 'メールアドレス未設定';
}

// ==========================================
// Googleログイン
// ==========================================

elements.googleLoginBtn.addEventListener('click', async () => {
    try {
        elements.googleLoginBtn.disabled = true;
        elements.googleLoginBtn.textContent = 'ログイン中...';

        await signInWithPopup(auth, provider);
        // onAuthStateChangedで自動的に次の画面へ遷移

    } catch (error) {
        console.error('ログインエラー:', error);

        let errorMsg = 'ログインに失敗しました。';

        if (error.code === 'auth/popup-closed-by-user') {
            errorMsg = 'ログインがキャンセルされました。';
        } else if (error.code === 'auth/popup-blocked') {
            errorMsg = 'ポップアップがブロックされました。ブラウザの設定を確認してください。';
        }

        showError(errorMsg);

    } finally {
        elements.googleLoginBtn.disabled = false;
        elements.googleLoginBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Googleアカウントでログイン
        `;
    }
});

// ==========================================
// 応募送信
// ==========================================

elements.submitBtn.addEventListener('click', async () => {
    const user = auth.currentUser;

    if (!user) {
        showError('ログイン情報が見つかりません。再度ログインしてください。');
        return;
    }

    try {
        elements.submitBtn.disabled = true;
        elements.submitBtn.textContent = '送信中...';

        // Firestoreに応募データを保存
        await setDoc(doc(db, 'applicants', user.uid), {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            appliedAt: serverTimestamp(),
            status: 'pending' // pending, winner, loser
        });

        // 成功画面を表示
        showScreen('success');

    } catch (error) {
        console.error('応募送信エラー:', error);

        let errorMsg = '応募の送信に失敗しました。';

        if (error.code === 'permission-denied') {
            errorMsg = 'データの保存権限がありません。セキュリティルールを確認してください。';
        } else if (error.code === 'unavailable') {
            errorMsg = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
        }

        showError(errorMsg);

    } finally {
        elements.submitBtn.disabled = false;
        elements.submitBtn.textContent = '応募する';
    }
});

// ==========================================
// ログアウト
// ==========================================

async function handleLogout() {
    try {
        await signOut(auth);
        showScreen('login');
    } catch (error) {
        console.error('ログアウトエラー:', error);
        showError('ログアウトに失敗しました。');
    }
}

elements.logoutBtn.addEventListener('click', handleLogout);
elements.logoutAlreadyBtn.addEventListener('click', handleLogout);

// ==========================================
// その他のボタン
// ==========================================

elements.closeBtn.addEventListener('click', () => {
    handleLogout();
});

elements.retryBtn.addEventListener('click', () => {
    showScreen('loading');
    location.reload();
});

// ==========================================
// 初期化完了
// ==========================================

console.log('🎁 抽選応募システム初期化完了');
console.log('⚠️ セキュリティルールの設定を忘れずに！');
