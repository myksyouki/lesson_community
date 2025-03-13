import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Dimensions,
  Image,
  Animated,
  Keyboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { useFirebase } from '@/contexts/FirebaseContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const router = useRouter();
  const { isInitialized } = useFirebase();
  
  // Google認証の設定
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,       // Web用
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,    // iOS用
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID, // Android用
  });
  
  // デバッグ用に環境変数の存在をログに出力
  useEffect(() => {
    console.log('Firebase設定:', {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? 'セット済み' : '未設定',
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'セット済み' : '未設定',
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? 'セット済み' : '未設定',
    });
    
    console.log('Google認証設定:', {
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? 'セット済み' : '未設定',
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ? 'セット済み' : '未設定',
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ? 'セット済み' : '未設定',
    });
  }, []);

  // アニメーション用の値
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(30)).current;

  // キーボードの表示/非表示を検知
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Google認証レスポンスの処理
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleLogin(id_token);
    }
  }, [response]);

  // 画面表示時のアニメーション
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 1200,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(formSlide, {
        toValue: 0,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // フォーム切り替え時のアニメーション
  const animateFormChange = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(formSlide, {
          toValue: 20,
          duration: 200,
          useNativeDriver: true,
        })
      ]),
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(formSlide, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ])
    ]).start();
  };

  const toggleAuthMode = () => {
    animateFormChange();
    setIsLogin(!isLogin);
    setErrorMessage(null);
  };

  // Googleログイン処理
  const handleGoogleLogin = async (idToken: string) => {
    try {
      setIsGoogleLoading(true);
      console.log('Googleログイン開始...');
      const auth = getAuth();
      const credential = GoogleAuthProvider.credential(idToken);
      
      // より詳細なデバッグ情報を追加
      console.log('Google認証情報を作成しました');
      
      const userCredential = await signInWithCredential(auth, credential);
      console.log('Google認証成功:', userCredential.user.uid);
      
      // Firestoreにユーザー情報を保存
      if (userCredential.user) {
        const userData = {
          id: userCredential.user.uid,
          name: userCredential.user.displayName || '',
          email: userCredential.user.email || '',
          avatar: userCredential.user.photoURL || '',
          createdAt: new Date(),
          lastLogin: new Date()
        };
        
        console.log('ユーザー情報をFirestoreに保存します:', userData.id);
        await setDoc(doc(db, 'users', userCredential.user.uid), userData, { merge: true });
        console.log('ユーザー情報の保存が完了しました');
      }
      
      console.log('Googleログイン成功');
      // 正しいホーム画面にリダイレクト
      router.replace('/(drawer)');
    } catch (error) {
      console.error('Google認証エラー:', error);
      // より具体的なエラーメッセージを表示
      let message = 'Google認証に失敗しました';
      if (error instanceof Error) {
        if (error.message.includes('auth/invalid-credential')) {
          message = '無効な認証情報です。再度お試しください。';
        } else if (error.message.includes('auth/network-request-failed')) {
          message = 'ネットワーク接続エラーが発生しました。インターネット接続を確認してください。';
        } else if (error.message.includes('auth/user-disabled')) {
          message = 'このアカウントは無効化されています。';
        } else if (error.message.includes('auth/user-not-found')) {
          message = 'アカウントが見つかりません。';
        } else if (error.message.includes('auth/operation-not-allowed')) {
          message = 'この操作は許可されていません。';
        } else {
          message = error.message;
        }
      }
      setErrorMessage(message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAuth = async () => {
    setErrorMessage(null);
    
    if (!email || !password) {
      setErrorMessage('メールアドレスとパスワードを入力してください');
      return;
    }

    if (!isLogin && !name) {
      setErrorMessage('名前を入力してください');
      return;
    }

    if (!isInitialized) {
      setErrorMessage('Firebaseの初期化中です。しばらくお待ちください。');
      return;
    }

    setIsLoading(true);
    try {
      const auth = getAuth();
      if (isLogin) {
        // ログイン処理
        console.log('メールログイン開始...');
        await signInWithEmailAndPassword(auth, email, password);
        console.log('ログイン成功');
      } else {
        // 新規登録処理
        console.log('アカウント作成開始...');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('ユーザーアカウント作成成功:', userCredential.user.uid);
        
        // 名前を設定
        if (userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: name
          });
          console.log('ユーザープロフィール更新成功');
          
          // Firestoreにユーザー情報を保存
          const userData = {
            id: userCredential.user.uid,
            name: name,
            email: userCredential.user.email || '',
            createdAt: new Date(),
            lastLogin: new Date()
          };
          
          console.log('ユーザー情報をFirestoreに保存します:', userData.id);
          await setDoc(doc(db, 'users', userCredential.user.uid), userData);
          console.log('ユーザー情報の保存が完了しました');
        }
        console.log('アカウント作成成功');
      }
      // 正しいホーム画面にリダイレクト
      router.replace('/(drawer)');
    } catch (error) {
      console.error('認証エラー:', error);
      // より具体的なエラーメッセージを表示
      let message = '認証に失敗しました';
      if (error instanceof Error) {
        if (error.message.includes('auth/invalid-email')) {
          message = 'メールアドレスの形式が正しくありません。';
        } else if (error.message.includes('auth/user-disabled')) {
          message = 'このアカウントは無効化されています。';
        } else if (error.message.includes('auth/user-not-found')) {
          message = 'アカウントが見つかりません。登録されていないか、削除された可能性があります。';
        } else if (error.message.includes('auth/wrong-password')) {
          message = 'パスワードが間違っています。';
        } else if (error.message.includes('auth/email-already-in-use')) {
          message = 'このメールアドレスは既に使用されています。';
        } else if (error.message.includes('auth/weak-password')) {
          message = 'パスワードが脆弱です。より強力なパスワードを設定してください。';
        } else if (error.message.includes('auth/network-request-failed')) {
          message = 'ネットワーク接続エラーが発生しました。インターネット接続を確認してください。';
        } else if (error.message.includes('auth/too-many-requests')) {
          message = 'ログイン試行回数が多すぎます。しばらく経ってから再度お試しください。';
        } else if (error.message.includes('auth/invalid-credential')) {
          message = '認証情報が無効です。メールアドレスとパスワードを確認してください。';
        } else {
          message = error.message;
        }
      }
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  // テスト用のログインボタンを追加
  const handleTestLogin = async () => {
    setIsLoading(true);
    try {
      console.log('テストログイン開始...');
      const testEmail = 'test@example.com';
      const testPassword = 'testpassword123';
      
      const auth = getAuth();
      
      try {
        // テストユーザーでログイン試行
        await signInWithEmailAndPassword(auth, testEmail, testPassword);
        console.log('テストログイン成功');
        router.replace('/(drawer)');
      } catch (loginError) {
        console.log('テストユーザーが存在しないため作成します');
        
        // テストユーザーが存在しない場合は作成
        const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        
        // 名前を設定
        await updateProfile(userCredential.user, {
          displayName: 'テストユーザー'
        });
        
        // Firestoreにユーザー情報を保存
        const userData = {
          id: userCredential.user.uid,
          name: 'テストユーザー',
          email: testEmail,
          createdAt: new Date(),
          lastLogin: new Date()
        };
        
        await setDoc(doc(db, 'users', userCredential.user.uid), userData);
        console.log('テストユーザー作成およびログイン成功');
        router.replace('/(drawer)');
      }
    } catch (error) {
      console.error('テストログインエラー:', error);
      let message = 'テストログインに失敗しました';
      if (error instanceof Error) {
        message = error.message;
      }
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* グラデーション背景 */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* 装飾的な円形グラデーション */}
      <View style={styles.decorationContainer}>
        <LinearGradient
          colors={['rgba(127, 61, 255, 0.4)', 'rgba(127, 61, 255, 0.1)']}
          style={[styles.decorationCircle, { top: -100, left: -100 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={['rgba(61, 127, 255, 0.3)', 'rgba(61, 127, 255, 0.05)']}
          style={[styles.decorationCircle, { bottom: -150, right: -150 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* ヘッダーセクション */}
          <Animated.View 
            style={[
              styles.headerContainer,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#7F3DFF', '#3D7FFF']}
                style={styles.logoBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="musical-notes" size={40} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>音楽コミュニティ</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'アカウントにログイン' : '新しいアカウントを作成'}
            </Text>
          </Animated.View>
          
          {/* フォームセクション */}
          <Animated.View 
            style={[
              styles.formContainer,
              { 
                opacity: formOpacity,
                transform: [{ translateY: formSlide }]
              }
            ]}
          >
            <BlurView intensity={30} tint="dark" style={styles.formBlur}>
              {/* 新規登録時のみ名前入力欄を表示 */}
              {!isLogin && (
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={22} color="#fff" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="名前"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}
              
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={22} color="#fff" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="メールアドレス"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={22} color="#fff" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="パスワード"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
              
              {errorMessage && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#ff4d4f" style={{ marginRight: 8 }} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={[styles.button, !isInitialized && styles.disabledButton]} 
                onPress={handleAuth}
                disabled={isLoading || !isInitialized}
              >
                <LinearGradient
                  colors={['#7F3DFF', '#3D7FFF']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {isLogin ? 'ログイン' : '登録する'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>または</Text>
                <View style={styles.divider} />
              </View>
              
              <TouchableOpacity 
                style={styles.googleButton} 
                onPress={() => promptAsync()}
                disabled={isGoogleLoading || !request}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color="#fff" style={styles.googleIcon} />
                    <Text style={styles.googleButtonText}>
                      Googleでログイン
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* テストログインボタン */}
              <TouchableOpacity 
                style={[styles.googleButton, { backgroundColor: 'rgba(79, 195, 247, 0.2)' }]} 
                onPress={handleTestLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="construct-outline" size={20} color="#4fc3f7" style={styles.googleIcon} />
                    <Text style={[styles.googleButtonText, { color: '#4fc3f7' }]}>
                      テストユーザーでログイン
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.switchButton} 
                onPress={toggleAuthMode}
              >
                <Text style={styles.switchButtonText}>
                  {isLogin ? '新規登録はこちら' : 'ログインはこちら'}
                </Text>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  decorationContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  decorationCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formContainer: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  formBlur: {
    padding: 24,
    borderRadius: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    height: 56,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  buttonGradient: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  googleButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 16,
    alignSelf: 'center',
    padding: 8,
  },
  switchButtonText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 79, 0.15)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#ff4d4f',
    flex: 1,
  },
}); 