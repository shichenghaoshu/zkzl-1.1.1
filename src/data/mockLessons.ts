export type Question = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation?: string;
};

export type SceneType =
  | "story"
  | "drag-classify"
  | "match"
  | "quiz-race"
  | "boss"
  | "flashcard"
  | "ordering"
  | "memory";

export type Scene = {
  id: string;
  type: SceneType;
  title: string;
  description: string;
  questions: Question[];
  rewards: {
    stars: number;
    coins: number;
  };
};

export type Lesson = {
  id: string;
  title: string;
  grade: string;
  subject: string;
  gameMode: string;
  scenes: Scene[];
};

export const mockLesson: Lesson = {
  id: "lesson-fraction-001",
  title: "三年级数学：认识分数",
  grade: "三年级",
  subject: "数学",
  gameMode: "闯关地图",
  scenes: [
    {
      id: "scene-story",
      type: "story",
      title: "开场剧情",
      description: "分数王国的城堡门打开了，小小探险家准备出发。",
      questions: [],
      rewards: { stars: 1, coins: 10 }
    },
    {
      id: "scene-drag",
      type: "drag-classify",
      title: "第1关 拖拽分类",
      description: "把分数放进正确的分类框，巩固真分数与假分数。",
      questions: [
        {
          id: "q-drag-1",
          prompt: "把下面的分数拖到对应的分类中吧！",
          options: ["1/2", "3/4", "5/4", "7/3", "2 1/3"],
          answer: "真分数：1/2、3/4；假分数/带分数：5/4、7/3、2 1/3"
        }
      ],
      rewards: { stars: 3, coins: 20 }
    },
    {
      id: "scene-match",
      type: "match",
      title: "第2关 配对挑战",
      description: "把图形、文字和分数配成好朋友。",
      questions: [
        {
          id: "q-match-1",
          prompt: "把分数和读法配成好朋友。",
          options: ["1/2:二分之一", "3/4:四分之三", "1/4:四分之一", "2/3:三分之二"],
          answer: "全部配对正确"
        }
      ],
      rewards: { stars: 3, coins: 20 }
    },
    {
      id: "scene-race",
      type: "quiz-race",
      title: "第3关 竞速答题",
      description: "限时选择最大的分数，训练比较能力。",
      questions: [
        {
          id: "q-race-1",
          prompt: "下面哪个分数最大？",
          options: ["A. 1/2", "B. 2/3", "C. 3/4", "D. 1/3"],
          answer: "C. 3/4",
          explanation: "把它们想成同样大的蛋糕份数，3/4 比 2/3、1/2、1/3 都更接近 1。"
        }
      ],
      rewards: { stars: 3, coins: 20 }
    },
    {
      id: "scene-boss",
      type: "boss",
      title: "Boss关 综合闯关",
      description: "用分数知识帮助城堡修好彩虹桥。",
      questions: [
        {
          id: "q-boss-1",
          prompt: "一条彩带平均分成 4 份，取了 3 份，用分数表示是？",
          options: ["1/4", "3/4", "4/3", "3"],
          answer: "3/4"
        }
      ],
      rewards: { stars: 4, coins: 40 }
    },
    {
      id: "scene-flashcard",
      type: "flashcard",
      title: "知识翻卡",
      description: "翻一翻，复习分数的基本概念。",
      questions: [],
      rewards: { stars: 2, coins: 10 }
    },
    {
      id: "scene-ordering",
      type: "ordering",
      title: "排序挑战",
      description: "把分数从小到大排一排。",
      questions: [
        {
          id: "q-order-1",
          prompt: "把下面的分数从小到大排列",
          options: ["1/4", "1/2", "3/4", "1"],
          answer: "1/4,1/2,3/4,1"
        }
      ],
      rewards: { stars: 3, coins: 20 }
    },
    {
      id: "scene-memory",
      type: "memory",
      title: "记忆翻牌",
      description: "翻开两张卡片，找到分数和百分数的配对。",
      questions: [
        {
          id: "q-memory-1",
          prompt: "找到分数和百分数的配对。",
          options: ["1/2:50%", "3/4:75%", "1/4:25%", "1:100%"],
          answer: "全部配对正确"
        }
      ],
      rewards: { stars: 3, coins: 20 }
    }
  ]
};

export const recentLessons = [
  {
    id: "recent-1",
    title: "分数闯关",
    grade: "三年级数学",
    time: "今天 10:30",
    cover: "🏰"
  },
  {
    id: "recent-2",
    title: "动物分类",
    grade: "二年级科学",
    time: "昨天 15:20",
    cover: "🐼"
  },
  {
    id: "recent-3",
    title: "单词翻卡",
    grade: "四年级英语",
    time: "06-01 09:15",
    cover: "🃏"
  }
];
