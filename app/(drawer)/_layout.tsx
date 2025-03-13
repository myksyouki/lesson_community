import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Text, View } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Divider } from 'react-native-paper';

// ハンバーガーメニューボタンコンポーネント
function HamburgerButton() {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      style={{
        width: 50,  // 幅を大きく
        height: 50, // 高さを大きく
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
      }}
    >
      <Ionicons name="menu" size={32} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

// 設定ボタンコンポーネント
function SettingsButton() {
  const router = useRouter();
  
  const handlePress = () => {
    // 設定画面に遷移
    router.push('/settings');
  };
  
  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
      }}
      onPress={handlePress}
    >
      <Ionicons name="settings-outline" size={24} color="#CCCCCC" style={{ marginRight: 32 }} />
      <Text style={{ color: '#CCCCCC', fontSize: 16 }}>設定</Text>
    </TouchableOpacity>
  );
}

// カスタムヘッダー右側コンポーネント
function HeaderRight() {
  const router = useRouter();
  
  return (
    <View style={{ flexDirection: 'row', marginRight: 8 }}>
      <TouchableOpacity
        style={{
          width: 50,
          height: 50,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={() => router.push('/settings')}
      >
        <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          headerShown: true,
          headerLeft: () => <HamburgerButton />,
          headerRight: () => <HeaderRight />,
          headerStyle: {
            backgroundColor: '#1E1E2E',
            height: 100, // ヘッダーの高さをさらに大きく
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 22, // タイトルのフォントサイズをさらに大きく
            marginLeft: 20, // タイトルの左マージンを追加
          },
          headerLeftContainerStyle: {
            width: 80, // 左側コンテナの幅を広げる
            paddingLeft: 10,
          },
          headerRightContainerStyle: {
            width: 80, // 右側コンテナの幅を広げる
            paddingRight: 10,
          },
          drawerStyle: {
            backgroundColor: '#1E1E2E',
            width: 280,
          },
          drawerActiveTintColor: '#7F3DFF',
          drawerInactiveTintColor: '#CCCCCC',
          swipeEdgeWidth: 200,
          swipeEnabled: true,
        }}
        drawerContent={(props) => {
          return (
            <DrawerContentScrollView {...props}>
              <DrawerItemList {...props} />
              <Divider style={{ backgroundColor: '#2A2A2A', marginVertical: 8 }} />
              <SettingsButton />
            </DrawerContentScrollView>
          );
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: 'ホーム',
            title: 'ホーム',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="category/index"
          options={{
            drawerLabel: '楽器カテゴリー',
            title: '楽器カテゴリー',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="musical-notes-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            drawerLabel: 'プロフィール',
            title: 'プロフィール',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
} 