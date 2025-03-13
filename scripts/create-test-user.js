// Firebase Admin SDKを使用してテストユーザーを作成するスクリプト
const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-key.json');

// Firebase Admin SDKの初期化
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

// テストユーザーの情報
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  displayName: 'テストユーザー'
};

async function createTestUser() {
  try {
    // 既存のユーザーを確認
    try {
      const userRecord = await auth.getUserByEmail(testUser.email);
      console.log('テストユーザーは既に存在します:', userRecord.uid);
      
      // Firestoreのユーザー情報を更新
      await db.collection('users').doc(userRecord.uid).set({
        id: userRecord.uid,
        name: testUser.displayName,
        email: testUser.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
        isTestUser: true
      });
      
      console.log('テストユーザーのFirestoreデータを更新しました');
      return;
    } catch (error) {
      // ユーザーが存在しない場合は新規作成
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // 新しいユーザーを作成
    const userRecord = await auth.createUser({
      email: testUser.email,
      password: testUser.password,
      displayName: testUser.displayName,
    });
    
    console.log('テストユーザーを作成しました:', userRecord.uid);

    // Firestoreにユーザー情報を保存
    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      name: testUser.displayName,
      email: testUser.email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      isTestUser: true
    });
    
    console.log('テストユーザーのFirestoreデータを作成しました');
  } catch (error) {
    console.error('テストユーザー作成エラー:', error);
  } finally {
    // Firebase Admin SDKの接続を終了
    process.exit(0);
  }
}

createTestUser(); 