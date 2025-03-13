import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Avatar, Card, Divider, List, Switch, IconButton, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../../contexts/UserContext';
import { useData } from '../../contexts/DataContext';
import InstrumentSelectorScreen from '../instrument-selector';

// 楽器カテゴリーのデータ（app/category/index.tsxと同じデータを使用）
const INSTRUMENT_CATEGORIES = [
  { 
    id: 'flute', 
    name: 'フルート', 
    icon: 'musical-notes', 
    color: '#7F3DFF'
  },
  { 
    id: 'clarinet', 
    name: 'クラリネット', 
    icon: 'musical-notes', 
    color: '#FF3D77'
  },
  { 
    id: 'oboe', 
    name: 'オーボエ', 
    icon: 'musical-notes', 
    color: '#3D7FFF'
  },
  { 
    id: 'fagotto', 
    name: 'ファゴット', 
    icon: 'musical-notes', 
    color: '#FF9F3D'
  },
  { 
    id: 'saxophone', 
    name: 'サクソフォン', 
    icon: 'musical-notes', 
    color: '#3DFFCF'
  },
  { 
    id: 'horn', 
    name: 'ホルン', 
    icon: 'musical-notes', 
    color: '#FF3D3D'
  },
];

// マーブル柄のグラデーションカラー
const MARBLE_COLORS = [
  '#7F3DFF80', '#FF3D7780', '#3D7FFF80', '#FF9F3D80', '#3DFFCF80', '#FF3D3D80'
];

export default function ProfileScreen() {
  const router = useRouter();
  const { 
    userState, 
    toggleCategory, 
    setDarkMode, 
    setNotifications 
  } = useUser();
  const { channels } = useData();

  const { 
    selectedCategories, 
    darkMode: userDarkMode, 
    notifications: userNotifications, 
    username, 
    bio, 
    avatarUrl 
  } = userState;
  
  const [modalVisible, setModalVisible] = React.useState(false);
  const [editModalVisible, setEditModalVisible] = React.useState(false);

  // ユーザーが作成したチャンネル（サンプルとして最初の3つを表示）
  const userChannels = channels.slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Avatar.Image 
            size={100} 
            source={{ uri: avatarUrl }} 
            style={styles.avatar}
          />
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.bio}>{bio}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>128</Text>
              <Text style={styles.statLabel}>投稿</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>チャンネル</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>2.1k</Text>
              <Text style={styles.statLabel}>いいね</Text>
            </View>
          </View>
          
          {/* HOMEに戻るボタン */}
          <Button 
            mode="contained" 
            style={styles.homeButton}
            icon="home"
            onPress={() => router.replace('/(drawer)')}
          >
            HOMEに戻る
          </Button>

          <View style={styles.buttonContainer}>
            <Button 
              mode="contained" 
              style={styles.editButton}
              onPress={() => setEditModalVisible(true)}
            >
              プロフィールを編集
            </Button>
            
            <TouchableOpacity 
              style={styles.instrumentSwitchButton}
              onPress={() => setModalVisible(true)}
            >
              <LinearGradient
                colors={['#7F3DFF80', '#FF3D7780', '#3D7FFF80', '#FF9F3D80', '#3DFFCF80', '#FF3D3D80']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.marbleGradient}
              >
                <View style={styles.switchButtonContent}>
                  <Ionicons name="swap-horizontal" size={24} color="#FFFFFF" />
                  <Text style={styles.switchButtonText}>楽器を切り替える</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* ユーザーのチャンネル */}
        <Card style={styles.sectionCard}>
          <Card.Title title="あなたのチャンネル" />
          <Card.Content>
            {userChannels.length > 0 ? (
              userChannels.map((channel) => (
                <React.Fragment key={channel.id}>
                  <List.Item
                    title={channel.name}
                    description={`${channel.members}人のメンバー • ${channel.threads.length}スレッド`}
                    left={props => (
                      <View style={[styles.channelIcon, { backgroundColor: getCategoryColor(channel.category) }]}>
                        <Ionicons name="chatbubble-outline" size={24} color="#FFFFFF" />
                      </View>
                    )}
                    right={props => <List.Icon {...props} icon="chevron-forward" />}
                    onPress={() => router.push(`/channels/${channel.id}`)}
                    style={styles.channelItem}
                  />
                  <Divider />
                </React.Fragment>
              ))
            ) : (
              <View style={styles.emptyChannelContainer}>
                <Ionicons name="chatbubble-outline" size={48} color="#AAAAAA" />
                <Text style={styles.emptyChannelText}>チャンネルがありません</Text>
                <Button 
                  mode="contained" 
                  style={styles.createChannelButton}
                  onPress={() => {/* チャンネル作成画面へ遷移 */}}
                >
                  チャンネルを作成
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        <Button 
          mode="outlined" 
          style={styles.logoutButton}
          textColor="#FF3D3D"
          onPress={() => {
            // ログアウト処理
          }}
        >
          ログアウト
        </Button>
      </ScrollView>
      
      {/* 楽器切り替えモーダル */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <IconButton
              icon="close"
              size={24}
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            />
            <InstrumentSelectorScreen 
              isModal={true} 
              onClose={() => setModalVisible(false)} 
            />
          </View>
        </View>
      </Modal>
      
      {/* プロフィール編集モーダル */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ProfileEditScreen 
              onClose={() => setEditModalVisible(false)} 
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// プロフィール編集画面コンポーネント
function ProfileEditScreen({ onClose }: { onClose: () => void }) {
  const { userState, updateProfile } = useUser();
  const [username, setUsername] = React.useState(userState.username);
  const [bio, setBio] = React.useState(userState.bio);
  const [avatarUrl, setAvatarUrl] = React.useState(userState.avatarUrl);
  
  // アバター選択オプション
  const avatarOptions = [
    'https://randomuser.me/api/portraits/men/32.jpg',
    'https://randomuser.me/api/portraits/women/32.jpg',
    'https://randomuser.me/api/portraits/men/41.jpg',
    'https://randomuser.me/api/portraits/women/41.jpg',
    'https://randomuser.me/api/portraits/men/55.jpg',
    'https://randomuser.me/api/portraits/women/55.jpg',
  ];
  
  // 画像アップロード処理
  const pickImage = async () => {
    // カメラロールへのアクセス許可を取得
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('エラー', '画像へのアクセス許可が必要です');
      return;
    }
    
    // 画像ピッカーを起動
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUrl(result.assets[0].uri);
    }
  };
  
  // カメラで撮影
  const takePhoto = async () => {
    // カメラへのアクセス許可を取得
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('エラー', 'カメラへのアクセス許可が必要です');
      return;
    }
    
    // カメラを起動
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUrl(result.assets[0].uri);
    }
  };
  
  // 画像選択オプションを表示
  const showImageOptions = () => {
    Alert.alert(
      'プロフィール画像',
      '画像の選択方法を選んでください',
      [
        {
          text: 'カメラで撮影',
          onPress: takePhoto,
        },
        {
          text: 'ギャラリーから選択',
          onPress: pickImage,
        },
        {
          text: 'サンプル画像から選択',
          onPress: () => {}, // 既存のサンプル画像選択UIを使用
        },
        {
          text: 'キャンセル',
          style: 'cancel',
        },
      ]
    );
  };
  
  const handleSave = () => {
    updateProfile({
      username,
      bio,
      avatarUrl,
    });
    onClose();
  };
  
  return (
    <SafeAreaView style={styles.editContainer}>
      <View style={styles.editHeader}>
        <IconButton
          icon="close"
          size={24}
          iconColor="#FFFFFF"
          onPress={onClose}
        />
        <Text style={styles.editTitle}>プロフィール編集</Text>
        <Button onPress={handleSave}>保存</Button>
      </View>
      
      <ScrollView style={styles.editForm}>
        <View style={styles.avatarEditSection}>
          <TouchableOpacity onPress={showImageOptions}>
            <Avatar.Image 
              size={100} 
              source={{ uri: avatarUrl }} 
              style={styles.editAvatar}
            />
            <View style={styles.cameraIconOverlay}>
              <Ionicons name="camera" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={showImageOptions}>
            <Text style={styles.avatarEditLabel}>プロフィール画像を変更</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.avatarOptions}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {avatarOptions.map((url, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => setAvatarUrl(url)}
                style={[
                  styles.avatarOption,
                  avatarUrl === url && styles.selectedAvatarOption
                ]}
              >
                <Image 
                  source={{ uri: url }} 
                  style={styles.avatarOptionImage} 
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <Card style={styles.editCard}>
          <Card.Content>
            <Text style={styles.inputLabel}>ユーザー名</Text>
            <TextInput
              style={styles.textInput}
              value={username}
              onChangeText={setUsername}
              placeholder="ユーザー名"
              placeholderTextColor="#666"
              mode="outlined"
              outlineColor="#2A2A2A"
              activeOutlineColor="#7F3DFF"
              theme={{ colors: { text: '#FFFFFF', background: '#1E1E1E' } }}
            />
            
            <Text style={styles.inputLabel}>自己紹介</Text>
            <TextInput
              style={[styles.textInput, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="自己紹介"
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              mode="outlined"
              outlineColor="#2A2A2A"
              activeOutlineColor="#7F3DFF"
              theme={{ colors: { text: '#FFFFFF', background: '#1E1E1E' } }}
            />
          </Card.Content>
        </Card>
        
        <Card style={[styles.editCard, { marginTop: 16 }]}>
          <Card.Content>
            <Text style={styles.sectionTitle}>アカウント情報</Text>
            
            <Text style={styles.inputLabel}>メールアドレス</Text>
            <TextInput
              style={styles.textInput}
              value="user@example.com"
              disabled
              mode="outlined"
              outlineColor="#2A2A2A"
              theme={{ colors: { text: '#AAAAAA', background: '#1E1E1E' } }}
            />
            
            <Button 
              mode="outlined" 
              style={styles.changeEmailButton}
              onPress={() => {/* メールアドレス変更処理 */}}
            >
              メールアドレスを変更
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// カテゴリーの色を取得する関数
function getCategoryColor(category: string): string {
  const categoryMap: Record<string, string> = {
    'flute': '#7F3DFF',
    'clarinet': '#FF3D77',
    'oboe': '#3D7FFF',
    'fagotto': '#FF9F3D',
    'saxophone': '#3DFFCF',
    'horn': '#FF3D3D',
    'euphonium': '#B03DFF',
    'trumpet': '#FFD93D',
    'trombone': '#3DFFB0',
    'tuba': '#FF6B3D',
    'percussion': '#3DB0FF',
  };
  
  return categoryMap[category] || '#7F3DFF';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatar: {
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#7F3DFF',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bio: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  editButton: {
    backgroundColor: '#7F3DFF',
    borderRadius: 8,
    width: '80%',
    marginBottom: 12,
  },
  instrumentSwitchButton: {
    width: '80%',
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
  },
  marbleGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  switchButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  switchButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginVertical: 24,
    borderColor: '#FF3D3D',
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#121212',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  // プロフィール編集画面のスタイル
  editContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  editTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editForm: {
    flex: 1,
    padding: 16,
  },
  avatarEditSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  editAvatar: {
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#7F3DFF',
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 0,
    backgroundColor: '#7F3DFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#121212',
  },
  avatarEditLabel: {
    fontSize: 14,
    color: '#7F3DFF',
    marginTop: 8,
  },
  avatarOptions: {
    marginBottom: 24,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAvatarOption: {
    borderColor: '#7F3DFF',
  },
  avatarOptionImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  editCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    marginBottom: 16,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  changeEmailButton: {
    marginTop: 8,
    borderColor: '#7F3DFF',
  },
  channelIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  channelItem: {
    paddingVertical: 8,
  },
  emptyChannelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyChannelText: {
    fontSize: 16,
    color: '#AAAAAA',
    marginVertical: 12,
  },
  createChannelButton: {
    marginTop: 12,
    backgroundColor: '#7F3DFF',
  },
  homeButton: {
    marginHorizontal: 16,
    marginVertical: 24,
    backgroundColor: '#7F3DFF',
    borderRadius: 8,
  },
});