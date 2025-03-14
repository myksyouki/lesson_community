import React from 'react';
import { View, Modal, Dimensions, Pressable, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import CircleWheel from './CircleWheel';
import InnerWheel from './InnerWheel';
import { useCircleOfFifths, COLORS } from '../../../hooks/useCircleOfFifths';

const { width, height } = Dimensions.get('window');
const OUTER_RADIUS = width * 0.4;
const INNER_RADIUS = width * 0.25;
const CENTER_X = width / 2;
const CENTER_Y = height / 2;

interface CircleOfFifthsMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function CircleOfFifthsMenu({ visible, onClose }: CircleOfFifthsMenuProps) {
  const {
    channelItems,
    threadItems,
    selectedChannelId,
    selectedThreadId,
    containerStyle,
    handleClose,
    handleChannelSelected,
    handleThreadSelected,
    handleChannelPress,
    handleThreadPress,
    handleMoreChannelsPress,
  } = useCircleOfFifths({ visible, onClose });
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.modalBackground} onPress={handleClose}>
        <Animated.View style={[styles.container, containerStyle]}>
          {/* 外側のホイール（チャンネル選択） */}
          <CircleWheel
            radius={OUTER_RADIUS}
            items={channelItems}
            centerX={CENTER_X}
            centerY={CENTER_Y}
            onItemSelected={handleChannelSelected}
            selectedItemId={selectedChannelId}
          />
          
          {/* 内側のホイール（スレッド選択） */}
          {selectedChannelId && threadItems.length > 0 && (
            <InnerWheel
              radius={INNER_RADIUS}
              items={threadItems}
              centerX={CENTER_X}
              centerY={CENTER_Y}
              onItemSelected={handleThreadSelected}
              selectedItemId={selectedThreadId}
            />
          )}
          
          {/* 中央のボタン */}
          <View style={styles.centerButton}>
            {selectedChannelId && selectedThreadId ? (
              // スレッドが選択されている場合は「View Thread」ボタン
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleThreadPress(selectedChannelId, selectedThreadId)}
              >
                <Ionicons name="chatbubble-outline" size={24} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>スレッドを見る</Text>
              </TouchableOpacity>
            ) : selectedChannelId ? (
              // チャンネルだけが選択されている場合は「View Channel」ボタン
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleChannelPress(selectedChannelId)}
              >
                <Ionicons name="people-outline" size={24} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>チャンネルを見る</Text>
              </TouchableOpacity>
            ) : (
              // 何も選択されていない場合は「More Channels」ボタン
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleMoreChannelsPress}
              >
                <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>もっと見る</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* 閉じるボタン */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButton: {
    position: 'absolute',
    width: INNER_RADIUS * 0.8,
    height: INNER_RADIUS * 0.8,
    borderRadius: INNER_RADIUS * 0.4,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 