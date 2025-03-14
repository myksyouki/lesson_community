import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Platform, KeyboardAvoidingView } from 'react-native';
import { IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface CommentInputProps {
  onSend: (text: string) => void;
  onAttachImage?: () => void;
  onCancel?: () => void;
  replyingTo?: { id: string; authorName: string } | null;
  accentColor: string;
  placeholder?: string;
}

const CommentInput = ({ 
  onSend, 
  onAttachImage, 
  onCancel, 
  replyingTo, 
  accentColor, 
  placeholder = 'メッセージを入力...' 
}: CommentInputProps) => {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    if (text.trim() === '') return;
    
    onSend(text);
    setText('');
    
    // キーボードを閉じる
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* 返信中の表示 */}
      {replyingTo && (
        <View style={styles.replyingContainer}>
          <View style={styles.replyingContent}>
            <Ionicons name="return-up-back" size={16} color={accentColor} />
            <Text style={styles.replyingText}>
              <Text style={{ color: accentColor }}>{replyingTo.authorName}</Text>さんに返信
            </Text>
          </View>
          {onCancel && (
            <TouchableOpacity onPress={onCancel}>
              <Ionicons name="close-circle" size={20} color="#AAAAAA" />
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* 入力フォーム */}
      <View style={styles.container}>
        {onAttachImage && (
          <IconButton
            icon="image-outline"
            size={24}
            iconColor="#AAAAAA"
            onPress={onAttachImage}
            style={styles.attachButton}
          />
        )}
        
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#AAAAAA"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
        />
        
        <TouchableOpacity 
          style={[
            styles.sendButton,
            { backgroundColor: text.trim() ? accentColor : '#333333' }
          ]}
          onPress={handleSend}
          disabled={text.trim() === ''}
        >
          <Ionicons name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    backgroundColor: '#1A1A1A',
  },
  input: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FFFFFF',
    maxHeight: 100,
  },
  attachButton: {
    margin: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  replyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#2A2A2A',
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  replyingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyingText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default CommentInput; 