import { Channel, Thread } from '../../types';

// フルート用のサンプルスレッド
const fluteThreads: Thread[] = [
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
];

// クラリネット用のサンプルスレッド
const clarinetThreads: Thread[] = [
  {
    id: 'thread201',
    title: 'クラリネットのリード選び',
    content: 'リードの硬さや種類によって音色が変わりますが、皆さんはどのようなリードを使っていますか？初心者向けのおすすめがあれば教えてください。',
    author: {
      id: 'user201',
      name: '佐藤雅子',
      avatar: 'https://randomuser.me/api/portraits/women/22.jpg',
    },
    createdAt: '2023-08-10T09:15:00Z',
    likes: 42,
    replies: 23,
    isLiked: false,
  },
];

// サックス用のサンプルスレッド
const saxophoneThreads: Thread[] = [
  {
    id: 'thread301',
    title: 'アルトサックスの初心者におすすめの曲',
    content: '最近アルトサックスを始めました。初心者でも楽しく練習できる曲を教えてください。',
    author: {
      id: 'user301',
      name: '山田太郎',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    createdAt: '2023-08-05T16:20:00Z',
    likes: 56,
    replies: 31,
    isLiked: true,
  },
];

// サンプルチャンネルデータ
export const sampleChannels: Channel[] = [
  {
    id: 'flute-beginners',
    name: 'フルート初心者',
    description: 'フルートを始めたばかりの方のための質問・情報交換の場です。',
    category: 'flute',
    members: 1250,
    threads: fluteThreads,
  },
  {
    id: 'flute-advanced',
    name: 'フルート上級者',
    description: '上級テクニックや難曲の演奏法について議論する場です。',
    category: 'flute',
    members: 780,
    threads: [],
  },
  {
    id: 'clarinet-general',
    name: 'クラリネット全般',
    description: 'クラリネットに関する質問や情報交換の場です。',
    category: 'clarinet',
    members: 950,
    threads: clarinetThreads,
  },
  {
    id: 'saxophone-jazz',
    name: 'ジャズサックス',
    description: 'ジャズサックスの演奏法やアドリブについて議論する場です。',
    category: 'saxophone',
    members: 1120,
    threads: saxophoneThreads,
  },
]; 