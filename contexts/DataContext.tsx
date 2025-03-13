import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { 
  userService, 
  channelService, 
  threadService, 
  messageService 
} from '../firebase/services';
import { getAuth } from 'firebase/auth';
import { Channel as FirebaseChannel, Thread as FirebaseThread, Message as FirebaseMessage } from '../firebase/models';
import { useFirebase } from './FirebaseContext';
import { useUser } from './UserContext';

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
  channelId?: string;
  messages: Message[];
}

export interface Message {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  content: string;
  createdAt: string;
  image?: string;
  replies?: number;
  likes?: number;
  isLiked?: boolean;
  replyToId?: string;
  replyToAuthor?: string;
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
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  getChannelsByCategory: (category: string) => Channel[];
  getChannel: (channelId: string) => Channel | undefined;
  getThread: (channelId: string, threadId: string) => Thread | undefined;
  toggleLike: (channelId: string, threadId: string) => void;
  createThread: (channelId: string, threadData: { title: string; content: string; author: { id: string; name: string; avatar: string; } }) => Promise<string>;
  createChannel: (channelData: { name: string; description: string; category: string; creatorId: string }) => Promise<string>;
  deleteChannel: (channelId: string) => Promise<boolean>;
  getUserCreatedChannels: (userId: string) => Channel[];
  subscribeToChannelUpdates: (channelId: string, callback: (channel: Channel | null) => void) => () => void;
  subscribeToThreadsInChannel: (channelId: string, callback: (threads: Thread[]) => void) => () => void;
  subscribeToHotThreads: (category: string | null, limit: number, callback: (threads: Thread[]) => void) => () => void;
}

// フルート用の追加サンプルスレッド
const additionalFluteThreads: Thread[] = [
  {
    id: 'thread101',
    title: 'フルートの音色を改善するには',
    content: '音色をより豊かにするための練習方法やアプローチを教えてください。特に中音域の響きに悩んでいます。',
    author: {
      id: 'user101',
      name: '河野美咲',
      avatar: 'https://randomuser.me/api/portraits/women/41.jpg',
    },
    createdAt: '2023-08-15T10:30:00Z',
    likes: 28,
    replies: 12,
    isLiked: false,
  },
  {
    id: 'thread102',
    title: 'フルートのビブラート習得法',
    content: 'ビブラートの付け方がわかりません。効果的な練習方法や上達のコツを教えていただけませんか？',
    author: {
      id: 'user102',
      name: '田村健太',
      avatar: 'https://randomuser.me/api/portraits/men/42.jpg',
    },
    createdAt: '2023-08-17T14:45:00Z',
    likes: 35,
    replies: 18,
    isLiked: true,
  },
  {
    id: 'thread103',
    title: 'フルートの指使いについて',
    content: '高音域のF#とG#の指使いで迷っています。皆さんはどのような指使いを使っていますか？',
    author: {
      id: 'user103',
      name: '佐々木優',
      avatar: 'https://randomuser.me/api/portraits/women/43.jpg',
    },
    createdAt: '2023-08-19T09:20:00Z',
    likes: 22,
    replies: 15,
    isLiked: false,
  },
  {
    id: 'thread104',
    title: 'フルートの手入れ方法',
    content: '新しくフルートを購入しました。長持ちさせるための日々のお手入れ方法を教えてください。',
    author: {
      id: 'user104',
      name: '山下拓也',
      avatar: 'https://randomuser.me/api/portraits/men/44.jpg',
    },
    createdAt: '2023-08-21T16:10:00Z',
    likes: 19,
    replies: 10,
    isLiked: true,
  },
  {
    id: 'thread105',
    title: 'フルートのオクターブ練習',
    content: 'オクターブ間の移動をスムーズにするための練習方法を探しています。おすすめのエチュードはありますか？',
    author: {
      id: 'user105',
      name: '中島真由子',
      avatar: 'https://randomuser.me/api/portraits/women/45.jpg',
    },
    createdAt: '2023-08-23T11:35:00Z',
    likes: 26,
    replies: 14,
    isLiked: false,
  },
];

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
  {
    id: 'channel13',
    name: 'フルートコンクール情報',
    description: 'フルートのコンクールや演奏会の情報を共有するチャンネルです。',
    category: 'flute',
    members: 723,
    threads: [
      {
        id: 'thread106',
        title: '全日本学生フルートコンクール',
        content: '今年の全日本学生フルートコンクールに参加予定の方いますか？課題曲の攻略法を共有しましょう。',
        author: {
          id: 'user106',
          name: '高橋美穂',
          avatar: 'https://randomuser.me/api/portraits/women/46.jpg',
        },
        createdAt: '2023-08-25T10:15:00Z',
        likes: 31,
        replies: 17,
        isLiked: false,
      },
      {
        id: 'thread107',
        title: '地方のフルートコンクール情報',
        content: '地方で開催されるフルートコンクールの情報を集めています。皆さんの地域のコンクール情報を教えてください。',
        author: {
          id: 'user107',
          name: '伊藤誠',
          avatar: 'https://randomuser.me/api/portraits/men/47.jpg',
        },
        createdAt: '2023-08-27T14:30:00Z',
        likes: 24,
        replies: 13,
        isLiked: true,
      },
      {
        id: 'thread108',
        title: 'オンラインコンクールの体験談',
        content: 'オンラインフルートコンクールに参加した方、体験談を聞かせてください。録音のコツなども知りたいです。',
        author: {
          id: 'user108',
          name: '鈴木麻衣',
          avatar: 'https://randomuser.me/api/portraits/women/48.jpg',
        },
        createdAt: '2023-08-29T09:45:00Z',
        likes: 19,
        replies: 11,
        isLiked: false,
      },
      {
        id: 'thread109',
        title: 'コンクール審査員の視点',
        content: 'フルートコンクールの審査員経験がある方、審査で重視するポイントを教えていただけませんか？',
        author: {
          id: 'user109',
          name: '佐藤雅彦',
          avatar: 'https://randomuser.me/api/portraits/men/49.jpg',
        },
        createdAt: '2023-08-31T16:20:00Z',
        likes: 27,
        replies: 15,
        isLiked: true,
      },
      {
        id: 'thread110',
        title: 'コンクール用の楽譜選び',
        content: 'フルートコンクールで印象に残る曲選びのコツを教えてください。定番曲と新曲、どちらが有利でしょうか？',
        author: {
          id: 'user110',
          name: '渡辺さくら',
          avatar: 'https://randomuser.me/api/portraits/women/50.jpg',
        },
        createdAt: '2023-09-02T11:10:00Z',
        likes: 22,
        replies: 12,
        isLiked: false,
      },
    ],
  },
  {
    id: 'channel14',
    name: 'フルート奏法研究',
    description: 'フルートの様々な奏法について研究・議論するチャンネルです。',
    category: 'flute',
    members: 654,
    threads: [
      {
        id: 'thread111',
        title: 'フラッタータンギングのコツ',
        content: 'フラッタータンギングがうまくできません。効果的な練習方法や上達のコツを教えてください。',
        author: {
          id: 'user111',
          name: '中村健太',
          avatar: 'https://randomuser.me/api/portraits/men/51.jpg',
        },
        createdAt: '2023-09-04T09:30:00Z',
        likes: 25,
        replies: 14,
        isLiked: false,
      },
      {
        id: 'thread112',
        title: 'ダブルタンギングの速度向上',
        content: 'ダブルタンギングの速度を上げるための効果的な練習方法を教えてください。',
        author: {
          id: 'user112',
          name: '小林美咲',
          avatar: 'https://randomuser.me/api/portraits/women/52.jpg',
        },
        createdAt: '2023-09-06T14:15:00Z',
        likes: 29,
        replies: 16,
        isLiked: true,
      },
      {
        id: 'thread113',
        title: 'サーキュラーブリージングの習得',
        content: 'サーキュラーブリージング（循環呼吸）の習得方法について教えてください。基本的な練習から始めたいです。',
        author: {
          id: 'user113',
          name: '田中雄一',
          avatar: 'https://randomuser.me/api/portraits/men/53.jpg',
        },
        createdAt: '2023-09-08T10:45:00Z',
        likes: 31,
        replies: 18,
        isLiked: false,
      },
      {
        id: 'thread114',
        title: 'ハーモニクスの出し方',
        content: 'フルートのハーモニクス（倍音）をきれいに出すコツを教えてください。特に高い倍音が安定しません。',
        author: {
          id: 'user114',
          name: '山本恵',
          avatar: 'https://randomuser.me/api/portraits/women/54.jpg',
        },
        createdAt: '2023-09-10T15:30:00Z',
        likes: 24,
        replies: 13,
        isLiked: true,
      },
      {
        id: 'thread115',
        title: 'マルチフォニクスの研究',
        content: '現代音楽でよく使われるマルチフォニクス（多重音）の出し方と練習方法について情報を共有しましょう。',
        author: {
          id: 'user115',
          name: '佐々木拓也',
          avatar: 'https://randomuser.me/api/portraits/men/55.jpg',
        },
        createdAt: '2023-09-12T11:20:00Z',
        likes: 27,
        replies: 15,
        isLiked: false,
      },
    ],
  },
  {
    id: 'channel15',
    name: 'フルート機材談義',
    description: 'フルートの機材（楽器、アクセサリー）について情報交換するチャンネルです。',
    category: 'flute',
    members: 589,
    threads: [
      {
        id: 'thread116',
        title: '銀製と金製フルートの違い',
        content: '銀製と金製フルートの音色の違いについて、実際に両方使っている方の意見を聞かせてください。',
        author: {
          id: 'user116',
          name: '加藤裕子',
          avatar: 'https://randomuser.me/api/portraits/women/56.jpg',
        },
        createdAt: '2023-09-14T10:10:00Z',
        likes: 33,
        replies: 19,
        isLiked: false,
      },
      {
        id: 'thread117',
        title: 'おすすめのフルートケース',
        content: '軽量で保護性能の高いフルートケースを探しています。おすすめのブランドや製品を教えてください。',
        author: {
          id: 'user117',
          name: '松田健',
          avatar: 'https://randomuser.me/api/portraits/men/57.jpg',
        },
        createdAt: '2023-09-16T13:45:00Z',
        likes: 26,
        replies: 14,
        isLiked: true,
      },
      {
        id: 'thread118',
        title: 'ヘッドジョイントの選び方',
        content: 'フルートのヘッドジョイントを新調しようと思っています。選び方のポイントを教えてください。',
        author: {
          id: 'user118',
          name: '井上真理',
          avatar: 'https://randomuser.me/api/portraits/women/58.jpg',
        },
        createdAt: '2023-09-18T09:30:00Z',
        likes: 29,
        replies: 16,
        isLiked: false,
      },
      {
        id: 'thread119',
        title: 'フルートスタンドのおすすめ',
        content: '安定性が高く、持ち運びにも便利なフルートスタンドを探しています。おすすめを教えてください。',
        author: {
          id: 'user119',
          name: '斎藤健太',
          avatar: 'https://randomuser.me/api/portraits/men/59.jpg',
        },
        createdAt: '2023-09-20T15:15:00Z',
        likes: 22,
        replies: 12,
        isLiked: true,
      },
      {
        id: 'thread120',
        title: 'フルートのパッドの交換時期',
        content: 'フルートのパッドはどのくらいの頻度で交換するべきでしょうか？交換のサインや目安を教えてください。',
        author: {
          id: 'user120',
          name: '木村美咲',
          avatar: 'https://randomuser.me/api/portraits/women/60.jpg',
        },
        createdAt: '2023-09-22T11:40:00Z',
        likes: 25,
        replies: 14,
        isLiked: false,
      },
    ],
  },
];

// コンテキストの作成
const DataContext = createContext<DataContextType | undefined>(undefined);

// コンテキストプロバイダーコンポーネント
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { isInitialized } = useFirebase();
  const { userState } = useUser();

  // Firebaseから初期データを読み込む
  useEffect(() => {
    if (isInitialized) {
      // チャンネル一覧のリアルタイム監視を設定
      const unsubscribe = channelService.subscribeToChannels((fbChannels) => {
        // チャンネルデータを変換し、状態を更新
        processChannels(fbChannels);
      });
      
      // クリーンアップ関数
      return () => {
        unsubscribe();
      };
    }
  }, [isInitialized]);

  // チャンネルデータを処理する関数
  const processChannels = async (firebaseChannels: FirebaseChannel[]) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // チャンネルデータを変換
      const channelsWithThreads = await Promise.all(
        firebaseChannels.map(async (fbChannel) => {
          // チャンネルのスレッドを取得
          const fbThreads = await threadService.getThreadsByChannel(fbChannel.id);
          
          // ユーザーID（ログイン中の場合）
          const auth = getAuth();
          const currentUserId = auth.currentUser?.uid;
          
          // スレッドデータを変換
          const threads = await Promise.all(fbThreads.map(async (fbThread) => {
            // いいねの状態を取得
            let isLiked = false;
            if (currentUserId) {
              isLiked = await threadService.isThreadLikedByUser(fbThread.id, currentUserId);
            }
            
            // いいね数を取得（likeCountがなければクエリで取得）
            const likeCount = fbThread.likeCount !== undefined 
              ? fbThread.likeCount 
              : await threadService.getThreadLikeCount(fbThread.id);
              
            // スレッドの内容を取得（contentがあればそれを使用、なければ最初のメッセージから）
            let content = fbThread.content || '';
            if (!content) {
              try {
                const messages = await messageService.getMessagesByThread(fbThread.id, 1);
                if (messages.length > 0) {
                  content = messages[0].content;
                }
              } catch (error) {
                console.error(`スレッド ${fbThread.id} の内容取得エラー:`, error);
              }
            }
            
            return {
              id: fbThread.id,
              title: fbThread.title,
              content: content,
              author: {
                id: fbThread.authorId,
                name: fbThread.authorName,
                avatar: fbThread.authorAvatar || '',
              },
              createdAt: fbThread.createdAt.toISOString(),
              likes: likeCount,
              replies: fbThread.messageCount,
              isLiked: isLiked,
              channelId: fbChannel.id,
              messages: [], // 初期状態では空の配列
            } as Thread;
          }));
          
          return {
            id: fbChannel.id,
            name: fbChannel.name,
            description: fbChannel.description,
            category: fbChannel.instrument, // Firestoreモデルではinstrumentフィールド
            members: fbChannel.memberCount,
            threads,
          } as Channel;
        })
      );
      
      setChannels(channelsWithThreads);
    } catch (err) {
      console.error('チャンネルデータの処理に失敗しました:', err);
      setError('データの処理に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // データを更新
  const refreshData = async () => {
    try {
      setIsLoading(true);
      const firebaseChannels = await channelService.getAllChannels();
      await processChannels(firebaseChannels);
    } catch (error) {
      console.error('データ更新エラー:', error);
      setError('データの更新に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // カテゴリー別にチャンネルを取得
  const getChannelsByCategory = (category: string): Channel[] => {
    return channels.filter(channel => channel.category === category);
  };

  // チャンネルIDでチャンネルを取得
  const getChannel = (channelId: string): Channel | undefined => {
    return channels.find(channel => channel.id === channelId);
  };

  // スレッドを取得
  const getThread = (channelId: string, threadId: string): Thread | undefined => {
    const channel = getChannel(channelId);
    if (!channel) return undefined;
    
    const thread = channel.threads.find(thread => thread.id === threadId);
    if (!thread) return undefined;
    
    // スレッドにメッセージがない場合は空の配列を設定
    if (!thread.messages) {
      thread.messages = [];
    }
    
    return thread;
  };

  // いいねをトグル
  const toggleLike = async (channelId: string, threadId: string): Promise<void> => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        console.error('ログインが必要です');
        return;
      }
      
      const userId = auth.currentUser.uid;
      
      // Firebaseでいいねをトグル
      const result = await threadService.toggleLikeThread(threadId, userId);
      
      // UIをすぐに更新（楽観的UIアップデート）
      setChannels(prevChannels => {
        return prevChannels.map(channel => {
          if (channel.id !== channelId) return channel;
          
          const updatedThreads = channel.threads.map(thread => {
            if (thread.id !== threadId) return thread;
            
            return {
              ...thread,
              isLiked: result.isLiked,
              likes: result.likeCount,
            };
          });
          
          return {
            ...channel,
            threads: updatedThreads,
          };
        });
      });
    } catch (error) {
      console.error('いいねトグルエラー:', error);
    }
  };

  // スレッド作成メソッド
  const createThread = async (channelId: string, threadData: { 
    title: string; 
    content: string; 
    author: { 
      id: string; 
      name: string; 
      avatar: string; 
    } 
  }): Promise<string> => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        throw new Error('ログインが必要です');
      }
      
      // Firebaseにスレッドを作成
      const channel = await channelService.getChannelById(channelId);
      if (!channel) throw new Error('チャンネルが見つかりません');
      
      // スレッド内容をログに記録（デバッグ用）
      console.log('作成するスレッドの内容:', threadData.content);
      
      // Firebaseのスレッドモデルに合わせてデータを準備
      const firebaseThreadData = {
        title: threadData.title,
        channelId: channelId,
        instrument: channel.instrument,
        authorId: auth.currentUser.uid,
        authorName: threadData.author.name || auth.currentUser.displayName || '匿名ユーザー',
        authorAvatar: threadData.author.avatar || auth.currentUser.photoURL || '',
        content: threadData.content // スレッドに内容を含める
      };
      
      // 初期メッセージを作成しない（null を渡す）
      const newThread = await threadService.createThread(
        firebaseThreadData, 
        null // 初期メッセージを作成しない
      );
      
      console.log('スレッドが作成されました:', newThread);
      
      // チャンネルリストを更新
      await refreshData();
      
      return newThread.id;
    } catch (error) {
      console.error('スレッド作成エラー:', error);
      throw error;
    }
  };

  // チャンネル作成メソッド
  const createChannel = async (channelData: { name: string; description: string; category: string; creatorId: string }): Promise<string> => {
    try {
      // Firebaseにチャンネルを作成
      const newChannel = await channelService.createChannel({
        name: channelData.name,
        description: channelData.description,
        instrument: channelData.category,
        icon: 'chatbubbles', // デフォルトアイコン
        color: '#7F3DFF', // デフォルトカラー
      });
      
      // チャンネルリストを更新
      await refreshData();
      
      return newChannel.id;
    } catch (error) {
      console.error('チャンネル作成エラー:', error);
      throw error;
    }
  };

  // チャンネル削除メソッド
  const deleteChannel = async (channelId: string): Promise<boolean> => {
    try {
      // Firebaseからチャンネルを削除
      await channelService.deleteChannel(channelId);
      
      // チャンネルリストを更新
      await refreshData();
      
      return true;
    } catch (error) {
      console.error('チャンネル削除エラー:', error);
      return false;
    }
  };

  // ユーザーが作成したチャンネルを取得
  const getUserCreatedChannels = (userId: string): Channel[] => {
    // 実際のアプリケーションでは、Firebaseからユーザーが作成したチャンネルを取得
    // この実装はダミーです
    return channels.filter(channel => {
      const thread = channel.threads[0];
      return thread && thread.author.id === userId;
    });
  };

  // 特定のチャンネルのリアルタイム監視を設定
  const subscribeToChannelUpdates = (channelId: string, callback: (channel: Channel | null) => void): () => void => {
    return channelService.subscribeToChannel(channelId, async (fbChannel) => {
      if (!fbChannel) {
        callback(null);
        return;
      }
      
      try {
        // スレッドデータを取得
        const fbThreads = await threadService.getThreadsByChannel(fbChannel.id);
        
        // スレッドデータを変換
        const threads = fbThreads.map((fbThread) => ({
          id: fbThread.id,
          title: fbThread.title,
          content: '', // 初期値は空
          author: {
            id: fbThread.authorId,
            name: fbThread.authorName,
            avatar: fbThread.authorAvatar || '',
          },
          createdAt: fbThread.createdAt.toISOString(),
          likes: 0,
          replies: fbThread.messageCount,
          isLiked: false,
          channelId: fbChannel.id,
        }));
        
        // チャンネルデータを作成
        const channel: Channel = {
          id: fbChannel.id,
          name: fbChannel.name,
          description: fbChannel.description,
          category: fbChannel.instrument,
          members: fbChannel.memberCount,
          threads,
        };
        
        callback(channel);
      } catch (error) {
        console.error(`チャンネル(${channelId})の監視処理エラー:`, error);
        callback(null);
      }
    });
  };

  // チャンネル内のスレッドのリアルタイム監視を設定
  const subscribeToThreadsInChannel = (channelId: string, callback: (threads: Thread[]) => void): () => void => {
    return threadService.subscribeToThreadsByChannel(channelId, 'lastActivity', async (fbThreads) => {
      try {
        // ユーザーID（ログイン中の場合）
        const auth = getAuth();
        const currentUserId = auth.currentUser?.uid;
        
        // スレッドデータを変換
        const threadsPromises = fbThreads.map(async (fbThread) => {
          // いいねの状態を取得
          let isLiked = false;
          if (currentUserId) {
            isLiked = await threadService.isThreadLikedByUser(fbThread.id, currentUserId);
          }
          
          // いいね数を取得
          const likeCount = fbThread.likeCount !== undefined 
            ? fbThread.likeCount 
            : await threadService.getThreadLikeCount(fbThread.id);
          
          // 各スレッドの内容を取得
          let content = fbThread.content || '';
          if (!content) {
            try {
              const messages = await messageService.getMessagesByThread(fbThread.id, 1);
              if (messages.length > 0) {
                content = messages[0].content;
              }
            } catch (error) {
              console.error(`スレッド ${fbThread.id} の内容取得エラー:`, error);
            }
          }
          
          return {
            id: fbThread.id,
            title: fbThread.title,
            content: content,
            author: {
              id: fbThread.authorId,
              name: fbThread.authorName,
              avatar: fbThread.authorAvatar || '',
            },
            createdAt: fbThread.createdAt.toISOString(),
            likes: likeCount,
            replies: fbThread.messageCount,
            isLiked: isLiked,
            channelId: fbThread.channelId,
            messages: [], // 初期状態では空配列
          };
        });
        
        // すべてのスレッドデータを待機して返す
        const threads = await Promise.all(threadsPromises);
        callback(threads);
      } catch (error) {
        console.error(`チャンネル ${channelId} のスレッド監視処理エラー:`, error);
        callback([]);
      }
    });
  };

  // HOTスレッドのリアルタイム監視を設定
  const subscribeToHotThreads = (category: string | null, limit: number, callback: (threads: Thread[]) => void): () => void => {
    return threadService.subscribeToHotThreads(category, limit, async (fbThreads) => {
      try {
        // ユーザーID（ログイン中の場合）
        const auth = getAuth();
        const currentUserId = auth.currentUser?.uid;
        
        // スレッドデータを変換
        const threadsPromises = fbThreads.map(async (fbThread) => {
          // いいねの状態を取得
          let isLiked = false;
          if (currentUserId) {
            isLiked = await threadService.isThreadLikedByUser(fbThread.id, currentUserId);
          }
          
          // いいね数を取得
          const likeCount = fbThread.likeCount !== undefined 
            ? fbThread.likeCount 
            : await threadService.getThreadLikeCount(fbThread.id);
          
          // 各スレッドの内容を取得
          let content = fbThread.content || '';
          if (!content) {
            try {
              const messages = await messageService.getMessagesByThread(fbThread.id, 1);
              if (messages.length > 0) {
                content = messages[0].content;
              }
            } catch (error) {
              console.error(`HOTスレッド ${fbThread.id} の内容取得エラー:`, error);
            }
          }
          
          return {
            id: fbThread.id,
            title: fbThread.title,
            content: content,
            author: {
              id: fbThread.authorId,
              name: fbThread.authorName,
              avatar: fbThread.authorAvatar || '',
            },
            createdAt: fbThread.createdAt.toISOString(),
            likes: likeCount,
            replies: fbThread.messageCount,
            isLiked: isLiked,
            channelId: fbThread.channelId,
            messages: [], // 初期状態では空配列
          };
        });
        
        // すべてのスレッドデータを待機して返す
        const threads = await Promise.all(threadsPromises);
        callback(threads);
      } catch (error) {
        console.error(`HOTスレッド監視処理エラー:`, error);
        callback([]);
      }
    });
  };

  return (
    <DataContext.Provider
      value={{
        channels,
        isLoading,
        error,
        refreshData,
        getChannelsByCategory,
        getChannel,
        getThread,
        toggleLike,
        createThread,
        createChannel,
        deleteChannel,
        getUserCreatedChannels,
        subscribeToChannelUpdates,
        subscribeToThreadsInChannel,
        subscribeToHotThreads,
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