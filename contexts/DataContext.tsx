import React, { createContext, useState, useContext, ReactNode } from 'react';

// データモデルの型定義
export interface Thread {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  likes: number;
  replies: number;
  isLiked: boolean;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  category: string;
  members: number;
  threads: Thread[];
}

// コンテキストの型定義
interface DataContextType {
  channels: Channel[];
  getChannelsByCategory: (category: string) => Channel[];
  getChannel: (channelId: string) => Channel | undefined;
  getThread: (channelId: string, threadId: string) => Thread | undefined;
  toggleLike: (channelId: string, threadId: string) => void;
  createThread: (channelId: string, threadData: { title: string; content: string; author: { id: string; name: string; avatar: string; } }) => Promise<void>;
}

// サンプルデータ
const sampleThreads: Thread[] = [
  {
    id: 'thread1',
    title: '初心者向けフルートの選び方',
    content: 'フルートを始めたいと思っていますが、初心者にはどのようなフルートがおすすめですか？予算は10万円程度です。',
    author: {
      id: 'user1',
      name: '山田太郎',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    createdAt: '2023-05-15T09:30:00Z',
    likes: 24,
    replies: 8,
    isLiked: false,
  },
  {
    id: 'thread2',
    title: 'フルートの練習方法について',
    content: '毎日の練習ルーティンを共有しませんか？私は基本的にロングトーンから始めて、スケール練習、そして曲の練習という流れです。',
    author: {
      id: 'user2',
      name: '佐藤花子',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    },
    createdAt: '2023-05-16T14:20:00Z',
    likes: 36,
    replies: 15,
    isLiked: true,
  },
  {
    id: 'thread3',
    title: 'おすすめのフルート曲',
    content: '最近練習している曲はドビュッシーの「シリンクス」です。皆さんのおすすめのソロ曲を教えてください！',
    author: {
      id: 'user3',
      name: '鈴木一郎',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    },
    createdAt: '2023-05-17T11:45:00Z',
    likes: 42,
    replies: 21,
    isLiked: false,
  },
];

const sampleThreads2: Thread[] = [
  {
    id: 'thread4',
    title: 'クラリネットのリード選び',
    content: 'バンドレンのリードを使っていますが、他のブランドも試してみたいです。おすすめはありますか？',
    author: {
      id: 'user4',
      name: '高橋雅子',
      avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
    },
    createdAt: '2023-05-18T10:15:00Z',
    likes: 18,
    replies: 7,
    isLiked: false,
  },
  {
    id: 'thread5',
    title: 'クラリネットのメンテナンス方法',
    content: '正しいお手入れ方法について教えてください。特に湿気の多い季節はどのように保管すべきでしょうか？',
    author: {
      id: 'user5',
      name: '伊藤健太',
      avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
    },
    createdAt: '2023-05-19T16:30:00Z',
    likes: 29,
    replies: 12,
    isLiked: true,
  },
];

const sampleThreads3: Thread[] = [
  {
    id: 'thread6',
    title: 'トランペットの初心者です',
    content: '先月からトランペットを始めました。上達するためのコツはありますか？特に高音が出ません...',
    author: {
      id: 'user6',
      name: '中村翔太',
      avatar: 'https://randomuser.me/api/portraits/men/6.jpg',
    },
    createdAt: '2023-05-20T08:45:00Z',
    likes: 15,
    replies: 9,
    isLiked: false,
  },
  {
    id: 'thread7',
    title: 'おすすめのマウスピース',
    content: 'ジャズ向けのマウスピースを探しています。何かおすすめはありますか？',
    author: {
      id: 'user7',
      name: '小林美咲',
      avatar: 'https://randomuser.me/api/portraits/women/7.jpg',
    },
    createdAt: '2023-05-21T13:20:00Z',
    likes: 22,
    replies: 11,
    isLiked: true,
  },
];

// 新しいサンプルスレッド - オーボエ
const oboeThreads: Thread[] = [
  {
    id: 'thread8',
    title: 'オーボエのリード作り初心者',
    content: 'リード作りを始めたいのですが、必要な道具や材料について教えてください。',
    author: {
      id: 'user8',
      name: '田中めぐみ',
      avatar: 'https://randomuser.me/api/portraits/women/8.jpg',
    },
    createdAt: '2023-05-22T09:15:00Z',
    likes: 19,
    replies: 14,
    isLiked: false,
  },
  {
    id: 'thread9',
    title: 'オーボエの音色改善について',
    content: '音色が安定しません。特に高音域でのコントロールが難しいです。アドバイスをお願いします。',
    author: {
      id: 'user9',
      name: '加藤裕太',
      avatar: 'https://randomuser.me/api/portraits/men/9.jpg',
    },
    createdAt: '2023-05-23T11:30:00Z',
    likes: 27,
    replies: 16,
    isLiked: true,
  },
];

// 新しいサンプルスレッド - サクソフォン
const saxophoneThreads: Thread[] = [
  {
    id: 'thread10',
    title: 'ジャズサックスの即興演奏',
    content: 'ジャズの即興演奏を始めたいのですが、どのように練習すればいいでしょうか？',
    author: {
      id: 'user10',
      name: '渡辺健',
      avatar: 'https://randomuser.me/api/portraits/men/10.jpg',
    },
    createdAt: '2023-05-24T14:45:00Z',
    likes: 31,
    replies: 18,
    isLiked: false,
  },
  {
    id: 'thread11',
    title: 'アルトサックスとテナーサックスの違い',
    content: '次のサックスを購入予定です。アルトとテナー、初心者にはどちらがおすすめですか？',
    author: {
      id: 'user11',
      name: '松本さやか',
      avatar: 'https://randomuser.me/api/portraits/women/11.jpg',
    },
    createdAt: '2023-05-25T16:20:00Z',
    likes: 25,
    replies: 13,
    isLiked: true,
  },
];

// 新しいサンプルスレッド - ホルン
const hornThreads: Thread[] = [
  {
    id: 'thread12',
    title: 'ホルンの基本奏法',
    content: 'ホルンを始めたばかりです。基本的な奏法や練習方法を教えてください。',
    author: {
      id: 'user12',
      name: '井上拓也',
      avatar: 'https://randomuser.me/api/portraits/men/12.jpg',
    },
    createdAt: '2023-05-26T10:10:00Z',
    likes: 17,
    replies: 9,
    isLiked: false,
  },
  {
    id: 'thread13',
    title: 'ホルンのマウスピース選び',
    content: '新しいマウスピースを探しています。おすすめのブランドや型番はありますか？',
    author: {
      id: 'user13',
      name: '佐々木美穂',
      avatar: 'https://randomuser.me/api/portraits/women/13.jpg',
    },
    createdAt: '2023-05-27T13:40:00Z',
    likes: 21,
    replies: 11,
    isLiked: true,
  },
];

// 新しいサンプルスレッド - トロンボーン
const tromboneThreads: Thread[] = [
  {
    id: 'thread14',
    title: 'トロンボーンのスライド技術',
    content: 'スライドの動きをスムーズにするコツはありますか？特に速いパッセージで苦労しています。',
    author: {
      id: 'user14',
      name: '山本大輔',
      avatar: 'https://randomuser.me/api/portraits/men/14.jpg',
    },
    createdAt: '2023-05-28T09:25:00Z',
    likes: 23,
    replies: 12,
    isLiked: false,
  },
  {
    id: 'thread15',
    title: 'トロンボーンのジャズ演奏',
    content: 'ジャズでのトロンボーン演奏に興味があります。おすすめの曲や練習方法はありますか？',
    author: {
      id: 'user15',
      name: '中島恵',
      avatar: 'https://randomuser.me/api/portraits/women/15.jpg',
    },
    createdAt: '2023-05-29T15:50:00Z',
    likes: 29,
    replies: 15,
    isLiked: true,
  },
];

// 新しいサンプルスレッド - パーカッション
const percussionThreads: Thread[] = [
  {
    id: 'thread16',
    title: 'ドラムセットの基本セッティング',
    content: '初めてドラムセットを購入しました。基本的なセッティング方法を教えてください。',
    author: {
      id: 'user16',
      name: '木村隆',
      avatar: 'https://randomuser.me/api/portraits/men/16.jpg',
    },
    createdAt: '2023-05-30T11:35:00Z',
    likes: 26,
    replies: 14,
    isLiked: false,
  },
  {
    id: 'thread17',
    title: 'マリンバの練習方法',
    content: 'マリンバの4本マレットの持ち方と練習方法について教えてください。',
    author: {
      id: 'user17',
      name: '斎藤明子',
      avatar: 'https://randomuser.me/api/portraits/women/17.jpg',
    },
    createdAt: '2023-05-31T14:15:00Z',
    likes: 24,
    replies: 13,
    isLiked: true,
  },
];

// サンプルチャンネルデータ
const sampleChannels: Channel[] = [
  {
    id: 'channel1',
    name: 'フルート初心者の部屋',
    description: 'フルートを始めたばかりの方のための交流スペースです。質問や悩みを共有しましょう。',
    category: 'flute',
    members: 1245,
    threads: sampleThreads,
  },
  {
    id: 'channel2',
    name: 'フルートアンサンブル',
    description: 'フルートアンサンブルについての情報交換や楽譜の共有などを行うチャンネルです。',
    category: 'flute',
    members: 876,
    threads: [
      {
        id: 'thread18',
        title: 'フルート四重奏のおすすめ曲',
        content: 'フルート四重奏で演奏できるおすすめの曲を教えてください。初級〜中級レベルで探しています。',
        author: {
          id: 'user18',
          name: '岡田真理',
          avatar: 'https://randomuser.me/api/portraits/women/18.jpg',
        },
        createdAt: '2023-06-01T10:20:00Z',
        likes: 28,
        replies: 16,
        isLiked: false,
      },
      {
        id: 'thread19',
        title: 'アンサンブルでの音程合わせ',
        content: 'フルートアンサンブルでの音程の合わせ方について、コツやアドバイスをお願いします。',
        author: {
          id: 'user19',
          name: '藤田健太郎',
          avatar: 'https://randomuser.me/api/portraits/men/19.jpg',
        },
        createdAt: '2023-06-02T13:45:00Z',
        likes: 32,
        replies: 19,
        isLiked: true,
      },
    ],
  },
  {
    id: 'channel3',
    name: 'クラリネット奏者の集い',
    description: 'クラリネット奏者のための情報交換の場です。初心者から上級者まで歓迎します。',
    category: 'clarinet',
    members: 932,
    threads: sampleThreads2,
  },
  {
    id: 'channel4',
    name: 'クラリネット演奏テクニック',
    description: 'クラリネットの演奏テクニックについて情報交換するチャンネルです。',
    category: 'clarinet',
    members: 745,
    threads: [
      {
        id: 'thread20',
        title: 'クラリネットのスタッカート',
        content: 'スタッカートをクリアに演奏するコツを教えてください。特に速いパッセージで苦労しています。',
        author: {
          id: 'user20',
          name: '村田直子',
          avatar: 'https://randomuser.me/api/portraits/women/20.jpg',
        },
        createdAt: '2023-06-03T09:30:00Z',
        likes: 27,
        replies: 15,
        isLiked: false,
      },
      {
        id: 'thread21',
        title: 'クラリネットの音色改善',
        content: '音色をより豊かにするための練習方法やアプローチを教えてください。',
        author: {
          id: 'user21',
          name: '小川雄太',
          avatar: 'https://randomuser.me/api/portraits/men/21.jpg',
        },
        createdAt: '2023-06-04T14:50:00Z',
        likes: 31,
        replies: 18,
        isLiked: true,
      },
    ],
  },
  {
    id: 'channel5',
    name: 'オーボエ奏者の広場',
    description: 'オーボエに関する情報交換や質問ができるチャンネルです。',
    category: 'oboe',
    members: 678,
    threads: oboeThreads,
  },
  {
    id: 'channel6',
    name: 'オーボエリード作り',
    description: 'オーボエのリード作りについて情報交換するチャンネルです。',
    category: 'oboe',
    members: 543,
    threads: [
      {
        id: 'thread22',
        title: 'リード作りの基本ツール',
        content: 'リード作りを始めるために必要な基本的なツールを教えてください。',
        author: {
          id: 'user22',
          name: '西田裕子',
          avatar: 'https://randomuser.me/api/portraits/women/22.jpg',
        },
        createdAt: '2023-06-05T10:15:00Z',
        likes: 24,
        replies: 13,
        isLiked: false,
      },
      {
        id: 'thread23',
        title: 'リードの調整方法',
        content: 'リードが硬すぎる場合の調整方法を教えてください。',
        author: {
          id: 'user23',
          name: '吉田拓也',
          avatar: 'https://randomuser.me/api/portraits/men/23.jpg',
        },
        createdAt: '2023-06-06T15:40:00Z',
        likes: 29,
        replies: 17,
        isLiked: true,
      },
    ],
  },
  {
    id: 'channel7',
    name: 'サックス愛好家',
    description: 'サックスに関する話題ならなんでもOK！機材の話から演奏テクニックまで。',
    category: 'saxophone',
    members: 1089,
    threads: saxophoneThreads,
  },
  {
    id: 'channel8',
    name: 'サックスジャズ研究会',
    description: 'ジャズサックスについて研究するチャンネルです。',
    category: 'saxophone',
    members: 876,
    threads: [
      {
        id: 'thread24',
        title: 'ジャズの即興演奏入門',
        content: 'ジャズの即興演奏を始めたいのですが、どのように練習すればいいでしょうか？',
        author: {
          id: 'user24',
          name: '中川雄介',
          avatar: 'https://randomuser.me/api/portraits/men/24.jpg',
        },
        createdAt: '2023-06-07T11:25:00Z',
        likes: 33,
        replies: 21,
        isLiked: false,
      },
      {
        id: 'thread25',
        title: 'ジャズスタンダードのおすすめ',
        content: '初心者が練習すべきジャズスタンダード曲を教えてください。',
        author: {
          id: 'user25',
          name: '林美香',
          avatar: 'https://randomuser.me/api/portraits/women/25.jpg',
        },
        createdAt: '2023-06-08T16:30:00Z',
        likes: 37,
        replies: 24,
        isLiked: true,
      },
    ],
  },
  {
    id: 'channel9',
    name: 'トランペット練習法',
    description: 'トランペットの練習方法や上達のコツを共有するチャンネルです。',
    category: 'trumpet',
    members: 754,
    threads: sampleThreads3,
  },
  {
    id: 'channel10',
    name: 'ホルン奏者の集い',
    description: 'ホルン奏者のための情報交換の場です。',
    category: 'horn',
    members: 621,
    threads: hornThreads,
  },
  {
    id: 'channel11',
    name: 'トロンボーン技術研究',
    description: 'トロンボーンの演奏技術について深く掘り下げるチャンネルです。',
    category: 'trombone',
    members: 543,
    threads: tromboneThreads,
  },
  {
    id: 'channel12',
    name: 'パーカッション部',
    description: '打楽器全般について語り合うチャンネルです。',
    category: 'percussion',
    members: 876,
    threads: percussionThreads,
  },
];

// コンテキストの作成
const DataContext = createContext<DataContextType | undefined>(undefined);

// コンテキストプロバイダーコンポーネント
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [channels, setChannels] = useState<Channel[]>(sampleChannels);

  // カテゴリー別のチャンネル取得
  const getChannelsByCategory = (category: string): Channel[] => {
    return channels.filter(channel => channel.category === category);
  };

  // チャンネル取得
  const getChannel = (channelId: string): Channel | undefined => {
    return channels.find(channel => channel.id === channelId);
  };

  // スレッド取得
  const getThread = (channelId: string, threadId: string): Thread | undefined => {
    const channel = getChannel(channelId);
    if (!channel) return undefined;
    return channel.threads.find(thread => thread.id === threadId);
  };

  // いいねの切り替え
  const toggleLike = (channelId: string, threadId: string) => {
    setChannels(prevChannels => {
      return prevChannels.map(channel => {
        if (channel.id !== channelId) return channel;
        
        const updatedThreads = channel.threads.map(thread => {
          if (thread.id !== threadId) return thread;
          
          return {
            ...thread,
            likes: thread.isLiked ? thread.likes - 1 : thread.likes + 1,
            isLiked: !thread.isLiked,
          };
        });
        
        return {
          ...channel,
          threads: updatedThreads,
        };
      });
    });
  };
  
  // スレッド作成
  const createThread = async (
    channelId: string, 
    threadData: { 
      title: string; 
      content: string; 
      author: { 
        id: string; 
        name: string; 
        avatar: string; 
      } 
    }
  ): Promise<void> => {
    // 新しいスレッドのIDを生成
    const newThreadId = `thread${Date.now()}`;
    
    // 新しいスレッドを作成
    const newThread: Thread = {
      id: newThreadId,
      title: threadData.title,
      content: threadData.content,
      author: threadData.author,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: 0,
      isLiked: false,
    };
    
    // チャンネルにスレッドを追加
    setChannels(prevChannels => {
      return prevChannels.map(channel => {
        if (channel.id !== channelId) return channel;
        
        return {
          ...channel,
          threads: [newThread, ...channel.threads],
        };
      });
    });
    
    // 実際のアプリではここでデータベースにスレッドを保存する処理を行う
    // 今回はモックとして、Promiseを返す
    return Promise.resolve();
  };

  return (
    <DataContext.Provider
      value={{
        channels,
        getChannelsByCategory,
        getChannel,
        getThread,
        toggleLike,
        createThread,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

// カスタムフック
export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}; 