import {FormEvent, ReactNode, useEffect, useState} from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Github,
  Trophy,
  Zap,
  Clock,
  CheckCircle,
  Star,
  Lightbulb,
  PenTool,
  Image as ImageIcon,
  FlaskConical,
  ChevronRight,
  BookOpen,
  ExternalLink,
  Mail,
  Paperclip,
  Send,
  X,
} from 'lucide-react';

type Locale = 'en' | 'zh-CN';
type PageId = 'leaderboards' | 'arena' | 'blog' | 'more';
type ArenaId = 'idea' | 'experiment' | 'writing' | 'plotting';
type RoundId =
  | 'idea-round-1'
  | 'experiment-round-1'
  | 'writing-round-1'
  | 'plotting-round-1';
type RoundStatus = 'ready' | 'comingSoon';
type ScoreValue = number | null;
type ChartDatum = {
  subject: string;
  arenaId?: ArenaId;
} & Record<string, string | number | undefined>;
type SubmissionStatus = 'idle' | 'sending' | 'success' | 'error';
type SubmissionFormValues = {
  modelName: string;
  email: string;
  message: string;
  attachment: File | null;
};

const LOCALE_STORAGE_KEY = 'research-claw-arena-locale';
const LOCALE_QUERY_KEY = 'lang';
const DETAILS_REPO_URL = 'https://github.com/agentos-openlab/research-claw-arena-details';
const DETAILS_REPO_IDEA_URL = `${DETAILS_REPO_URL}/tree/main/Idea`;
const HUGGING_FACE_URL = 'https://huggingface.co/agentos-openlab';
const SUBMISSION_EMAIL = 'guanghaojin56@gmail.com';
const SUBMISSION_ENDPOINT = `https://formsubmit.co/ajax/${SUBMISSION_EMAIL}`;
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

const CLAWS = [
  {
    id: 'auto-research-claw',
    name: 'AutoResearchClaw',
    version: 'Round 1',
    color: '#2563eb',
    overall: 79,
    scores: {
      idea: 74,
      writing: null,
      plotting: null,
      experiment: null,
      tokenEff: 100,
      timeEff: 82,
      completion: 82,
      quality: 66,
    },
  },
  {
    id: 'dr-claw',
    name: 'Dr. Claw',
    version: 'Round 1',
    color: '#0f766e',
    overall: 78,
    scores: {
      idea: 73,
      writing: null,
      plotting: null,
      experiment: null,
      tokenEff: 78,
      timeEff: 100,
      completion: 63,
      quality: 82,
    },
  },
  {
    id: 'ai-scientist-v2',
    name: 'AI-SCIENTIST-V2',
    version: 'Round 1',
    color: '#dc2626',
    overall: 64,
    scores: {
      idea: 57,
      writing: null,
      plotting: null,
      experiment: null,
      tokenEff: 72,
      timeEff: 91,
      completion: 47,
      quality: 67,
    },
  },
];

function averageScores(scores: ScoreValue[]) {
  const definedScores = scores.filter((score): score is number => score !== null);
  if (definedScores.length === 0) {
    return 0;
  }
  return Math.round(definedScores.reduce((sum, score) => sum + score, 0) / definedScores.length);
}

const clawsWithOverall = CLAWS.map((claw) => {
  const capabilityAvg = averageScores([
    claw.scores.idea,
    claw.scores.writing,
    claw.scores.plotting,
    claw.scores.experiment,
  ]);
  const performanceAvg = averageScores([
    claw.scores.tokenEff,
    claw.scores.timeEff,
    claw.scores.completion,
    claw.scores.quality,
  ]);
  return {...claw, capabilityAvg, performanceAvg};
}).sort((a, b) => b.overall - a.overall);

const translations = {
  en: {
    htmlLang: 'en',
    siteTitle: 'Research Claw Arena',
    pageSuffix: 'Page',
    navTitle: 'Navigate',
    githubLabel: 'View on GitHub',
    languageToggle: {
      english: 'EN',
      chinese: '中文',
    },
    pages: {
      leaderboards: {
        label: 'Leaderboards',
        description: 'Ranking view and score breakdowns',
      },
      arena: {
        label: 'Arena',
        description: 'Arena tracks and round selection',
      },
      blog: {
        label: 'Blog',
        description: 'Notes from ongoing product work',
      },
      more: {
        label: 'More',
        description: 'External links and future open details',
      },
    },
    blog: {
      badge: 'Blog',
      title: 'Product Notes',
      intro:
        'This section is reserved for future blog posts about what we learn while building the product, running evaluations, and refining the benchmark.',
      status: 'Preparing',
      featuredLabel: 'Planned Column',
      featuredTitle: 'In-progress product notes',
      featuredBody:
        'We plan to publish short technical posts here: what changed, why it changed, what failed, and what we learned from the process.',
      topicsTitle: 'What will appear here',
      topics: [
        'Benchmark design updates and evaluation rule changes',
        'Lessons from product iteration, tooling, and agent workflow design',
        'Round-by-round notes on data quality, failure cases, and release decisions',
      ],
    },
    more: {
      badge: 'More',
      title: 'More Resources',
      intro:
        'This section points to the future public repository for benchmark task details, experiment details, and related release materials.',
      status: 'Coming Soon',
      cardTitle: 'Task & Experiment Details',
      cardBody: '',
      linkLabel: 'Open GitHub repository',
      linkHint: '',
      submissionTitle: 'Submit your model or framework',
      submissionBody:
        'Share your model or framework with the Research Claw Arena team through a built-in email form, with optional supporting file upload.',
      submissionButton: 'Open submission form',
      submissionRecipientLabel: 'Recipient',
      submissionRecipientValue: 'Research Claw Arena team inbox',
      submissionRecipientHint: 'Submissions are sent to the team inbox by email.',
      formTitle: 'Submit your model or framework',
      formIntro: 'Fill in your email, describe your work, and optionally attach one supporting file.',
      formModelNameLabel: 'Model / Framework name',
      formModelNamePlaceholder: 'AutoResearchClaw Next',
      formEmailLabel: 'Your email',
      formEmailPlaceholder: 'name@example.com',
      formMessageLabel: 'Submission details',
      formMessagePlaceholder:
        'Describe your model or framework, its core idea, and any links or context you want us to review.',
      formAttachmentLabel: 'Attachment (optional)',
      formAttachmentHint: 'Upload one file up to 10 MB.',
      formSelectedFileLabel: 'Selected file',
      formCancel: 'Cancel',
      formClose: 'Close',
      formSend: 'Send submission',
      formSending: 'Sending...',
      formSuccess: 'Thanks — your submission has been sent.',
      formError: 'We could not send the submission right now. Please try again or use direct email.',
      formValidationModelName: 'Please enter the model or framework name.',
      formValidationEmail: 'Please enter a valid email address.',
      formValidationMessage: 'Please provide the submission details.',
      formValidationFileSize: 'Please upload a file smaller than 10 MB.',
      formDirectEmail: 'Direct email',
      dataTitle: 'Future Data Release',
      dataBody:
        'Future benchmark data, result files, and related public artifacts will be released through our Hugging Face organization page.',
      dataLinkLabel: 'Open Hugging Face page',
      dataLinkHint: 'We will publish upcoming public datasets and release files there.',
    },
      leaderboards: {
        badge: 'Leaderboards',
        title: 'Evaluating Research Agents',
        intro: '',
      capabilityDimension: 'Capability Dimension',
      performanceDimension: 'Performance Dimension',
      leaderboardTitle: 'Arena Leaderboard',
      scoresOutOfHundred: 'Scores out of 100',
        table: {
          rank: 'Rank',
          model: 'Model',
          overall: 'Overall',
          capabilities: 'Capabilities',
          performance: 'Performance',
          idea: 'Idea',
          writing: 'Write',
          plotting: 'Plot',
          experiment: 'Exp',
          tokens: 'Tokens',
          time: 'Time',
          completion: 'Oper',
          quality: 'Value',
        },
      comparisonTitle: 'Visual Comparison',
        charts: {
          capabilityTitle: 'Capability Scope',
          performanceTitle: 'Performance Metrics',
          pendingMetrics: 'Metrics for this track are not published yet.',
          capabilitySubjects: {
            idea: 'Idea Gen',
            writing: 'Writing',
            plotting: 'Plotting',
            experiment: 'Experiment',
        },
        performanceSubjects: {
          tokens: 'Token Eff',
          time: 'Time Eff',
          completion: 'Operability',
          quality: 'Research Value',
        },
      },
      profilesTitle: 'Detailed Profiles',
      profileSections: {
        capabilities: 'Capabilities',
        performance: 'Performance',
        overallScore: 'Overall Score',
      },
      scoreLabels: {
        idea: 'Idea Gen',
        writing: 'Writing',
        plotting: 'Plotting',
        experiment: 'Experiment',
        tokens: 'Tokens',
        time: 'Time',
        completion: 'Operability',
        quality: 'Research Value',
      },
    },
    arena: {
      badge: 'Arena',
      title: 'Arena Tracks',
      intro:
        'Browse the benchmark by track and review the active rounds, task framing, and participating systems for each evaluation area.',
      tracksTitle: 'Competition Tracks',
      enterTrack: 'Enter track',
      statuses: {
        available: 'Available',
        ready: 'Ready',
        comingSoon: 'Coming Soon',
        selected: 'Selected',
      },
      roundPickerTitle: 'Select a comparison round',
      roundDetailsTitle: 'Round Details',
      participants: 'Participants',
      participantCount: '3 claws',
    },
    arenaCards: {
      idea: {
        title: 'Idea Generation',
        blurb: 'Explore the idea generation track and compare how the current systems perform on open-ended research ideation tasks.',
      },
      experiment: {
        title: 'Experiment',
        blurb: 'Review experiment design rounds focused on methodology, evaluation setup, and ablation planning across research workflows.',
      },
      writing: {
        title: 'Writing',
        blurb: 'Review writing rounds centered on drafting quality, revision strategy, and structured research communication.',
      },
      plotting: {
        title: 'Plotting',
        blurb: 'Review plotting rounds centered on figure design, visual reasoning, and research-facing data presentation.',
      },
    },
    rounds: {
      idea: [
        {
          id: 'idea-round-1' as const,
          label: 'Round 1',
          subtitle: 'Published',
          prompt: 'topic: A better test-time computation method for open-domain scientific discovery tasks.',
          status: 'ready' as const,
          details: '',
        },
      ],
      experiment: [
        {
          id: 'experiment-round-1' as const,
          label: 'Coming Soon',
          subtitle: 'Not yet published',
          prompt: 'Round details for the experiment track will be announced in a future release.',
          status: 'comingSoon' as const,
          details:
            'This track is not open yet. Prompt, evaluation setup, and release materials will be published when the track opens.',
        },
      ],
      writing: [
        {
          id: 'writing-round-1' as const,
          label: 'Coming Soon',
          subtitle: 'Not yet published',
          prompt: 'Round details for the writing track will be announced in a future release.',
          status: 'comingSoon' as const,
          details:
            'This track is not open yet. Prompt, evaluation setup, and release materials will be published when the track opens.',
        },
      ],
      plotting: [
        {
          id: 'plotting-round-1' as const,
          label: 'Coming Soon',
          subtitle: 'Not yet published',
          prompt: 'Round details for the plotting track will be announced in a future release.',
          status: 'comingSoon' as const,
          details:
            'This track is not open yet. Prompt, evaluation setup, and release materials will be published when the track opens.',
        },
      ],
    },
    footer: {
      builtForPages: 'Built for GitHub Pages.',
      note: 'This site reflects the current Research Claw benchmark release.',
    },
  },
  'zh-CN': {
    htmlLang: 'zh-CN',
    siteTitle: 'Research Claw Arena 中文版',
    pageSuffix: '页面',
    navTitle: '导航',
    githubLabel: '查看 GitHub',
    languageToggle: {
      english: 'EN',
      chinese: '中文',
    },
    pages: {
      leaderboards: {
        label: '排行榜',
        description: '排名视图与分数拆解',
      },
      arena: {
        label: '竞技场',
        description: '竞技场赛道与回合选择',
      },
      blog: {
        label: '博客',
        description: '产品进行中的记录与心得',
      },
      more: {
        label: '更多',
        description: '外部链接与后续开源内容',
      },
    },
    blog: {
      badge: '博客',
      title: '产品博客',
      intro: '这里会陆续发布我们在做产品、跑评测、调整 benchmark 过程中的一些记录和心得。',
      status: '准备中',
      featuredLabel: '计划中的栏目',
      featuredTitle: '产品进行中的技术笔记',
      featuredBody: '后续会在这里发布简短的技术文章，说明改了什么、为什么改、踩过哪些坑，以及最后得到的判断。',
      topicsTitle: '后续会写的内容',
      topics: [
        'benchmark 设计更新，以及评测规则为什么这样定',
        '产品迭代、工具链和 agent 工作流里的具体经验',
        '每一轮发布里数据质量、失败案例和取舍过程的记录',
      ],
    },
    more: {
      badge: '更多',
      title: '更多内容',
      intro: '这里汇总未来公开 benchmark 任务细节、实验细节和相关发布材料的外部入口。',
      status: 'Coming Soon',
      cardTitle: '任务与实验细节仓库',
      cardBody: '',
      linkLabel: '打开 GitHub 仓库',
      linkHint: '',
      submissionTitle: '提交你的模型或框架',
      submissionBody: '通过内置邮件表单提交你的模型或 framework，并可附带一份补充文件。',
      submissionButton: '打开提交表单',
      submissionRecipientLabel: '收件人',
      submissionRecipientValue: 'Research Claw Arena 团队收件箱',
      submissionRecipientHint: '提交内容会通过邮件发送到团队收件箱。',
      formTitle: '提交你的模型或框架',
      formIntro: '填写你的邮箱、介绍内容，并可选上传一份附件。',
      formModelNameLabel: '模型 / Framework 名称',
      formModelNamePlaceholder: 'AutoResearchClaw Next',
      formEmailLabel: '你的邮箱',
      formEmailPlaceholder: 'name@example.com',
      formMessageLabel: '提交内容',
      formMessagePlaceholder: '介绍你的模型或 framework、核心思路，以及希望我们查看的链接或补充说明。',
      formAttachmentLabel: '附件（可选）',
      formAttachmentHint: '支持上传 1 个不超过 10 MB 的文件。',
      formSelectedFileLabel: '已选择文件',
      formCancel: '取消',
      formClose: '关闭',
      formSend: '发送提交',
      formSending: '发送中...',
      formSuccess: '已成功发送，感谢你的提交。',
      formError: '暂时发送失败，请重试或直接发邮件。',
      formValidationModelName: '请填写模型或框架名称。',
      formValidationEmail: '请填写有效的邮箱地址。',
      formValidationMessage: '请填写提交内容。',
      formValidationFileSize: '请上传小于 10 MB 的文件。',
      formDirectEmail: '直接发邮件',
      dataTitle: '未来数据发布',
      dataBody: '未来的 benchmark 数据、结果文件和相关公开材料会发布到我们的 Hugging Face 组织页。',
      dataLinkLabel: '打开 Hugging Face 页面',
      dataLinkHint: '后续公开数据集和发布文件会先放在这里。',
    },
      leaderboards: {
        badge: '排行榜',
        title: '研究智能体评测',
        intro: '',
      capabilityDimension: '能力维度',
      performanceDimension: '性能维度',
      leaderboardTitle: '竞技场排行榜',
      scoresOutOfHundred: '评分满分 100',
        table: {
          rank: '排名',
          model: '模型',
          overall: '总分',
          capabilities: '能力',
          performance: '性能',
          idea: '创意',
          writing: '写作',
          plotting: '绘图',
          experiment: '实验',
          tokens: 'Token',
          time: '时间',
          completion: '可操作',
          quality: '研究价值',
        },
      comparisonTitle: '可视化对比',
        charts: {
          capabilityTitle: '能力范围',
          performanceTitle: '性能指标',
          pendingMetrics: '该赛道的性能指标暂未发布。',
          capabilitySubjects: {
            idea: '创意生成',
            writing: '写作',
            plotting: '绘图',
            experiment: '实验',
        },
        performanceSubjects: {
          tokens: 'Token 效率',
          time: '时间效率',
          completion: '可操作性',
          quality: '研究价值',
        },
      },
      profilesTitle: '详细画像',
      profileSections: {
        capabilities: '能力',
        performance: '性能',
        overallScore: '综合得分',
      },
      scoreLabels: {
        idea: '创意',
        writing: '写作',
        plotting: '绘图',
        experiment: '实验',
        tokens: 'Token',
        time: '时间',
        completion: '可操作性',
        quality: '研究价值',
      },
    },
    arena: {
      badge: '竞技场',
      title: '竞技场赛道',
      intro:
        '你可以按赛道浏览 benchmark 内容，并查看各赛道当前 round 的任务定义、对比重点和参赛系统。',
      tracksTitle: '赛道列表',
      enterTrack: '进入赛道',
      statuses: {
        available: '可用',
        ready: '就绪',
        comingSoon: '即将上线',
        selected: '已选择',
      },
      roundPickerTitle: '选择对比回合',
      roundDetailsTitle: '回合详情',
      participants: '参赛 Claws',
      participantCount: '3 个 Claws',
    },
    arenaCards: {
      idea: {
        title: '创意生成',
        blurb: '浏览创意生成赛道，查看当前系统在开放式研究想法生成任务中的表现与对比结果。',
      },
      experiment: {
        title: '实验设计',
        blurb: '浏览实验设计赛道，查看围绕方法设计、评测方案和消融规划展开的对比内容。',
      },
      writing: {
        title: '写作',
        blurb: '浏览写作赛道，查看围绕草稿生成、修订判断和科研表达展开的对比内容。',
      },
      plotting: {
        title: '绘图',
        blurb: '浏览绘图赛道，查看围绕图表设计、视觉推理和科研可视化表达展开的对比内容。',
      },
    },
    rounds: {
      idea: [
        {
          id: 'idea-round-1' as const,
          label: 'Round 1',
          subtitle: '已发布',
          prompt: 'topic: A better test-time computation method for open-domain scientific discovery tasks.',
          status: 'ready' as const,
          details: '',
        },
      ],
      experiment: [
        {
          id: 'experiment-round-1' as const,
          label: '即将上线',
          subtitle: '尚未发布',
          prompt: '实验赛道的回合细节将在后续版本中公布。',
          status: 'comingSoon' as const,
          details: '该赛道目前尚未开启。任务 prompt、评测设置和发布材料会在赛道开放时统一发布。',
        },
      ],
      writing: [
        {
          id: 'writing-round-1' as const,
          label: '即将上线',
          subtitle: '尚未发布',
          prompt: '写作赛道的回合细节将在后续版本中公布。',
          status: 'comingSoon' as const,
          details: '该赛道目前尚未开启。任务 prompt、评测设置和发布材料会在赛道开放时统一发布。',
        },
      ],
      plotting: [
        {
          id: 'plotting-round-1' as const,
          label: '即将上线',
          subtitle: '尚未发布',
          prompt: '绘图赛道的回合细节将在后续版本中公布。',
          status: 'comingSoon' as const,
          details: '该赛道目前尚未开启。任务 prompt、评测设置和发布材料会在赛道开放时统一发布。',
        },
      ],
    },
    footer: {
      builtForPages: '已部署到 GitHub Pages。',
      note: '本页面展示当前版本的 Research Claw benchmark 发布内容。',
    },
  },
} as const;

function isLocale(value: string | null): value is Locale {
  return value === 'en' || value === 'zh-CN';
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const urlLocale = new URLSearchParams(window.location.search).get(LOCALE_QUERY_KEY);
  if (isLocale(urlLocale)) {
    return urlLocale;
  }

  const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isLocale(savedLocale)) {
    return savedLocale;
  }

  return window.navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

function syncLocale(locale: Locale, title: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  if (locale === 'zh-CN') {
    url.searchParams.set(LOCALE_QUERY_KEY, locale);
  } else {
    url.searchParams.delete(LOCALE_QUERY_KEY);
  }

  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = translations[locale].htmlLang;
  document.title = title;
}

function buildCapabilityData(text: (typeof translations)[Locale]) {
  return [
    {
      subject: text.leaderboards.charts.capabilitySubjects.idea,
      arenaId: 'idea' as const,
      ...Object.fromEntries(clawsWithOverall.map((claw) => [claw.name, claw.scores.idea ?? 0])),
    },
    {
      subject: text.leaderboards.charts.capabilitySubjects.writing,
      arenaId: 'writing' as const,
      ...Object.fromEntries(clawsWithOverall.map((claw) => [claw.name, claw.scores.writing ?? 0])),
    },
    {
      subject: text.leaderboards.charts.capabilitySubjects.plotting,
      arenaId: 'plotting' as const,
      ...Object.fromEntries(clawsWithOverall.map((claw) => [claw.name, claw.scores.plotting ?? 0])),
    },
    {
      subject: text.leaderboards.charts.capabilitySubjects.experiment,
      arenaId: 'experiment' as const,
      ...Object.fromEntries(clawsWithOverall.map((claw) => [claw.name, claw.scores.experiment ?? 0])),
    },
  ] satisfies ChartDatum[];
}

function buildPerformanceData(text: (typeof translations)[Locale], activeCapability: ArenaId) {
  if (activeCapability !== 'idea') {
    return [] satisfies ChartDatum[];
  }

  return [
    {
      subject: text.leaderboards.charts.performanceSubjects.tokens,
      ...Object.fromEntries(clawsWithOverall.map((claw) => [claw.name, claw.scores.tokenEff])),
    },
    {
      subject: text.leaderboards.charts.performanceSubjects.time,
      ...Object.fromEntries(clawsWithOverall.map((claw) => [claw.name, claw.scores.timeEff])),
    },
    {
      subject: text.leaderboards.charts.performanceSubjects.completion,
      ...Object.fromEntries(clawsWithOverall.map((claw) => [claw.name, claw.scores.completion])),
    },
    {
      subject: text.leaderboards.charts.performanceSubjects.quality,
      ...Object.fromEntries(clawsWithOverall.map((claw) => [claw.name, claw.scores.quality])),
    },
  ] satisfies ChartDatum[];
}

function buildPages(text: (typeof translations)[Locale]) {
  return [
    {
      id: 'leaderboards' as const,
      label: text.pages.leaderboards.label,
      description: text.pages.leaderboards.description,
      icon: Trophy,
    },
    {
      id: 'arena' as const,
      label: text.pages.arena.label,
      description: text.pages.arena.description,
      icon: FlaskConical,
    },
    {
      id: 'blog' as const,
      label: text.pages.blog.label,
      description: text.pages.blog.description,
      icon: BookOpen,
    },
    {
      id: 'more' as const,
      label: text.pages.more.label,
      description: text.pages.more.description,
      icon: Paperclip,
    },
  ];
}

function buildArenaCards(text: (typeof translations)[Locale]) {
  return [
    {
      id: 'idea' as const,
      title: text.arenaCards.idea.title,
      blurb: text.arenaCards.idea.blurb,
      accent: 'bg-blue-50 text-blue-700 border-blue-100',
      icon: Lightbulb,
      status: 'available' as const,
    },
    {
      id: 'experiment' as const,
      title: text.arenaCards.experiment.title,
      blurb: text.arenaCards.experiment.blurb,
      accent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      icon: FlaskConical,
      status: 'comingSoon' as const,
    },
    {
      id: 'writing' as const,
      title: text.arenaCards.writing.title,
      blurb: text.arenaCards.writing.blurb,
      accent: 'bg-amber-50 text-amber-700 border-amber-100',
      icon: PenTool,
      status: 'comingSoon' as const,
    },
    {
      id: 'plotting' as const,
      title: text.arenaCards.plotting.title,
      blurb: text.arenaCards.plotting.blurb,
      accent: 'bg-violet-50 text-violet-700 border-violet-100',
      icon: ImageIcon,
      status: 'comingSoon' as const,
    },
  ];
}

function buildArenaRounds(text: (typeof translations)[Locale]) {
  return text.rounds;
}

function getArenaLabel(text: (typeof translations)[Locale], arena: ArenaId) {
  return text.arenaCards[arena].title;
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

function buildSubmissionMailtoHref(values: Pick<SubmissionFormValues, 'modelName' | 'email' | 'message'>) {
  const params = new URLSearchParams({
    subject: `Research Claw Arena submission: ${values.modelName || 'New model/framework'}`,
    body: [`Model / Framework: ${values.modelName}`, `Email: ${values.email}`, '', values.message].join('\n'),
  });
  return `mailto:${SUBMISSION_EMAIL}?${params.toString()}`;
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => getInitialLocale());
  const [activePage, setActivePage] = useState<PageId>('leaderboards');
  const [selectedClaws, setSelectedClaws] = useState<string[]>(clawsWithOverall.slice(0, 3).map((claw) => claw.id));
  const [activeCapability, setActiveCapability] = useState<ArenaId>('idea');
  const [activeArena, setActiveArena] = useState<ArenaId>('idea');
  const [activeRound, setActiveRound] = useState<RoundId>('idea-round-1');
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);

  const text = translations[locale];
  const pages = buildPages(text);
  const arenaCards = buildArenaCards(text);
  const arenaRounds = buildArenaRounds(text);
  const capabilityData = buildCapabilityData(text);
  const performanceData = buildPerformanceData(text, activeCapability);
  const pageMeta = pages.find((page) => page.id === activePage)!;

  useEffect(() => {
    syncLocale(locale, text.siteTitle);
  }, [locale, text.siteTitle]);

  useEffect(() => {
    if (!isSubmissionModalOpen) {
      return;
    }

    const {overflow} = document.body.style;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSubmissionModalOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSubmissionModalOpen]);

  const toggleClaw = (id: string) => {
    if (selectedClaws.includes(id)) {
      if (selectedClaws.length > 1) {
        setSelectedClaws(selectedClaws.filter((clawId) => clawId !== id));
      }
      return;
    }

    if (selectedClaws.length < CLAWS.length) {
      setSelectedClaws([...selectedClaws, id]);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 selection:bg-blue-200">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2 text-white">
              <FlaskConical size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">Research Claw Arena</h1>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                {pageMeta.label} {text.pageSuffix}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <div className="flex rounded-md border border-neutral-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`rounded px-2.5 py-1 text-sm font-medium transition-colors ${
                  locale === 'en' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {text.languageToggle.english}
              </button>
              <button
                type="button"
                onClick={() => setLocale('zh-CN')}
                className={`rounded px-2.5 py-1 text-sm font-medium transition-colors ${
                  locale === 'zh-CN' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {text.languageToggle.chinese}
              </button>
            </div>

            <a
              href="https://github.com/agentos-openlab/research-claw-arena"
              target="_blank"
              rel="noreferrer"
              className="flex shrink-0 items-center gap-2 rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-900"
            >
              <Github size={16} />
              <span className="hidden sm:inline">{text.githubLabel}</span>
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <nav className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 lg:hidden">
          {pages.map((page) => {
            const Icon = page.icon;
            const active = page.id === activePage;

            return (
              <button
                key={page.id}
                type="button"
                onClick={() => setActivePage(page.id)}
                className={`flex min-w-0 items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-left transition-all sm:justify-start sm:gap-3 sm:px-4 ${
                  active
                    ? 'border-blue-200 bg-blue-50 text-blue-900 shadow-sm'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <div className={`rounded-xl p-2 ${active ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{page.label}</div>
                  <div className="hidden truncate text-xs text-neutral-500 sm:block">{page.description}</div>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:h-fit">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">{text.navTitle}</p>
            <nav className="flex gap-3 overflow-x-auto lg:flex-col">
              {pages.map((page) => {
                const Icon = page.icon;
                const active = page.id === activePage;

                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => setActivePage(page.id)}
                    className={`min-w-[190px] rounded-2xl border px-4 py-3 text-left transition-all lg:min-w-0 ${
                      active
                        ? 'border-blue-200 bg-blue-50 text-blue-900 shadow-sm'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-xl p-2 ${
                          active ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold">{page.label}</div>
                        <div className="text-xs text-neutral-500">{page.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="space-y-6 sm:space-y-8">
          {activePage === 'leaderboards' ? (
            <LeaderboardsPage
              text={text}
              capabilityData={capabilityData}
              performanceData={performanceData}
              selectedClaws={selectedClaws}
              onToggleClaw={toggleClaw}
              activeCapability={activeCapability}
              onSelectCapability={setActiveCapability}
              activeCapabilityLabel={getArenaLabel(text, activeCapability)}
            />
          ) : activePage === 'arena' ? (
            <ArenaPage
              text={text}
              arenaCards={arenaCards}
              arenaRounds={arenaRounds}
              activeArena={activeArena}
              activeRound={activeRound}
              onSelectArena={(arena) => {
                setActiveArena(arena);
                setActiveRound(arenaRounds[arena][0].id);
              }}
              onSelectRound={setActiveRound}
            />
          ) : activePage === 'blog' ? (
            <BlogPage text={text} />
          ) : (
            <MorePage text={text} onOpenSubmissionModal={() => setIsSubmissionModalOpen(true)} />
          )}
        </main>
        </div>
      </div>

      <footer className="mt-12 border-t border-neutral-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-neutral-500 sm:px-6 lg:px-8">
          <p>
            Research Claw Arena &copy; {new Date().getFullYear()}. {text.footer.builtForPages}
          </p>
          <p className="mt-2">{text.footer.note}</p>
        </div>
      </footer>

      {isSubmissionModalOpen ? (
        <SubmissionModal text={text} onClose={() => setIsSubmissionModalOpen(false)} />
      ) : null}
    </div>
  );
}

function renderScore(score: ScoreValue) {
  return score === null ? '/' : score;
}

function LeaderboardsPage({
  text,
  capabilityData,
  performanceData,
  selectedClaws,
  onToggleClaw,
  activeCapability,
  onSelectCapability,
  activeCapabilityLabel,
}: {
  text: (typeof translations)[Locale];
  capabilityData: ChartDatum[];
  performanceData: ChartDatum[];
  selectedClaws: string[];
  onToggleClaw: (id: string) => void;
  activeCapability: ArenaId;
  onSelectCapability: (arena: ArenaId) => void;
  activeCapabilityLabel: string;
}) {
  return (
    <>
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
            <Trophy size={16} />
            {text.leaderboards.badge}
          </div>
          <h2 className="mb-4 text-xl font-bold sm:text-2xl">{text.leaderboards.title}</h2>
          {text.leaderboards.intro ? <p className="mb-6 leading-relaxed text-neutral-600">{text.leaderboards.intro}</p> : null}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
              <Lightbulb size={16} />
              {text.leaderboards.capabilityDimension}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
              <Zap size={16} />
              {text.leaderboards.performanceDimension}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Trophy className="text-amber-500" size={20} />
            {text.leaderboards.leaderboardTitle}
          </h3>
          <span className="text-sm text-neutral-500">{text.leaderboards.scoresOutOfHundred}</span>
        </div>
        <div className="space-y-4 md:hidden">
          {clawsWithOverall.map((claw, idx) => (
            <MobileLeaderboardCard key={claw.id} claw={claw} idx={idx} text={text} />
          ))}
        </div>
        <div className="hidden overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">{text.leaderboards.table.rank}</th>
                  <th className="px-6 py-4 font-semibold">{text.leaderboards.table.model}</th>
                  <th className="bg-blue-50/50 px-6 py-4 text-center font-semibold">{text.leaderboards.table.overall}</th>
                  <th className="px-6 py-4 text-center font-semibold" colSpan={4}>
                    {text.leaderboards.table.capabilities}
                  </th>
                  <th className="px-6 py-4 text-center font-semibold" colSpan={4}>
                    {text.leaderboards.table.performance}
                  </th>
                </tr>
                <tr className="border-t border-neutral-100 text-[10px] text-neutral-400">
                  <th className="px-6 py-2"></th>
                  <th className="px-6 py-2"></th>
                  <th className="bg-blue-50/50 px-6 py-2"></th>
                  <th className="px-2 py-2 text-center" title={text.arenaCards.idea.title}>
                    {text.leaderboards.table.idea}
                  </th>
                  <th className="px-2 py-2 text-center" title={text.arenaCards.writing.title}>
                    {text.leaderboards.table.writing}
                  </th>
                  <th className="px-2 py-2 text-center" title={text.arenaCards.plotting.title}>
                    {text.leaderboards.table.plotting}
                  </th>
                  <th className="px-2 py-2 text-center" title={text.arenaCards.experiment.title}>
                    {text.leaderboards.table.experiment}
                  </th>
                  <th className="px-2 py-2 text-center" title={text.leaderboards.charts.performanceSubjects.tokens}>
                    {text.leaderboards.table.tokens}
                  </th>
                  <th className="px-2 py-2 text-center" title={text.leaderboards.charts.performanceSubjects.time}>
                    {text.leaderboards.table.time}
                  </th>
                  <th className="px-2 py-2 text-center" title={text.leaderboards.charts.performanceSubjects.completion}>
                    {text.leaderboards.table.completion}
                  </th>
                  <th className="px-2 py-2 text-center" title={text.leaderboards.charts.performanceSubjects.quality}>
                    {text.leaderboards.table.quality}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {clawsWithOverall.map((claw, idx) => (
                  <tr key={claw.id} className="transition-colors hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-700'
                            : idx === 1
                              ? 'bg-neutral-200 text-neutral-700'
                              : idx === 2
                                ? 'bg-orange-100 text-orange-800'
                                : 'text-neutral-500'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{backgroundColor: claw.color}}></div>
                        <span className="font-semibold text-neutral-900">{claw.name}</span>
                        <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                          {claw.version}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap bg-blue-50/30 px-6 py-4 text-center">
                      <span className="text-base font-bold text-blue-700">{claw.overall}</span>
                    </td>
                    <td className="px-2 py-4 text-center font-mono text-neutral-600">{renderScore(claw.scores.idea)}</td>
                    <td className="px-2 py-4 text-center font-mono text-neutral-600">{renderScore(claw.scores.writing)}</td>
                    <td className="px-2 py-4 text-center font-mono text-neutral-600">{renderScore(claw.scores.plotting)}</td>
                    <td className="border-r border-neutral-100 px-2 py-4 text-center font-mono text-neutral-600">
                      {renderScore(claw.scores.experiment)}
                    </td>
                    <td className="px-2 py-4 text-center font-mono text-neutral-600">{claw.scores.tokenEff}</td>
                    <td className="px-2 py-4 text-center font-mono text-neutral-600">{claw.scores.timeEff}</td>
                    <td className="px-2 py-4 text-center font-mono text-neutral-600">{claw.scores.completion}</td>
                    <td className="px-2 py-4 text-center font-mono text-neutral-600">{claw.scores.quality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h3 className="text-lg font-bold">{text.leaderboards.comparisonTitle}</h3>
          <div className="flex flex-wrap gap-2">
            {clawsWithOverall.map((claw) => (
              <button
                key={claw.id}
                type="button"
                onClick={() => onToggleClaw(claw.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedClaws.includes(claw.id)
                    ? 'border-neutral-300 bg-white text-neutral-900 shadow-sm'
                    : 'border-transparent bg-transparent text-neutral-400 hover:text-neutral-600'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className={`h-2 w-2 rounded-full ${selectedClaws.includes(claw.id) ? '' : 'opacity-50'}`}
                    style={{backgroundColor: claw.color}}
                  ></div>
                  {claw.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <ChartCard
            title={text.leaderboards.charts.capabilityTitle}
            icon={<Lightbulb size={18} className="text-blue-500" />}
            data={capabilityData}
            selectedClaws={selectedClaws}
            activeCapability={activeCapability}
            onSubjectClick={onSelectCapability}
          />
          <ChartCard
            title={text.leaderboards.charts.performanceTitle}
            icon={<Zap size={18} className="text-emerald-500" />}
            data={performanceData}
            selectedClaws={selectedClaws}
            activeCapability={activeCapability}
            activeCapabilityLabel={activeCapabilityLabel}
            emptyMessage={text.leaderboards.charts.pendingMetrics}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-lg font-bold">{text.leaderboards.profilesTitle}</h3>
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {clawsWithOverall.map((claw) => (
            <div
              key={claw.id}
              className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm"
            >
              <div className="border-b border-neutral-100 p-5 sm:p-6" style={{borderTop: `4px solid ${claw.color}`}}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3">
                    <span className="self-start rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      {claw.version}
                    </span>
                    <div className="min-w-0">
                      <h4 className="break-words text-xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-2xl">
                        {claw.name}
                      </h4>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-4">
                    <div className="flex items-end gap-3">
                      <span className="text-5xl font-bold leading-none" style={{color: claw.color}}>
                        {claw.overall}
                      </span>
                      <span className="pb-1 text-sm font-semibold text-neutral-500">
                        {text.leaderboards.profileSections.overallScore}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-neutral-50/60 p-5 sm:p-6">
                <div className="space-y-5">
                  <div className="rounded-2xl border border-neutral-100 bg-white p-4">
                    <h5 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
                      {text.leaderboards.profileSections.capabilities}
                    </h5>
                    <div className="space-y-3">
                      <ScoreBar
                        label={text.leaderboards.scoreLabels.idea}
                        score={claw.scores.idea}
                        icon={<Lightbulb size={14} />}
                        color={claw.color}
                      />
                      <ScoreBar
                        label={text.leaderboards.scoreLabels.writing}
                        score={claw.scores.writing}
                        icon={<PenTool size={14} />}
                        color={claw.color}
                      />
                      <ScoreBar
                        label={text.leaderboards.scoreLabels.plotting}
                        score={claw.scores.plotting}
                        icon={<ImageIcon size={14} />}
                        color={claw.color}
                      />
                      <ScoreBar
                        label={text.leaderboards.scoreLabels.experiment}
                        score={claw.scores.experiment}
                        icon={<FlaskConical size={14} />}
                        color={claw.color}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-100 bg-white p-4">
                    <h5 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
                      {text.leaderboards.profileSections.performance}
                    </h5>
                    <div className="space-y-3">
                      <ScoreBar
                        label={text.leaderboards.scoreLabels.tokens}
                        score={claw.scores.tokenEff}
                        icon={<Zap size={14} />}
                        color={claw.color}
                      />
                      <ScoreBar
                        label={text.leaderboards.scoreLabels.time}
                        score={claw.scores.timeEff}
                        icon={<Clock size={14} />}
                        color={claw.color}
                      />
                      <ScoreBar
                        label={text.leaderboards.scoreLabels.completion}
                        score={claw.scores.completion}
                        icon={<CheckCircle size={14} />}
                        color={claw.color}
                      />
                      <ScoreBar
                        label={text.leaderboards.scoreLabels.quality}
                        score={claw.scores.quality}
                        icon={<Star size={14} />}
                        color={claw.color}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function getRankBadgeClasses(idx: number) {
  if (idx === 0) {
    return 'bg-amber-100 text-amber-700';
  }
  if (idx === 1) {
    return 'bg-neutral-200 text-neutral-700';
  }
  if (idx === 2) {
    return 'bg-orange-100 text-orange-800';
  }
  return 'bg-neutral-100 text-neutral-500';
}

type MobileLeaderboardCardProps = {
  key?: string;
  claw: (typeof clawsWithOverall)[number];
  idx: number;
  text: (typeof translations)[Locale];
};

function MobileLeaderboardCard({
  claw,
  idx,
  text,
}: MobileLeaderboardCardProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-100 p-4" style={{borderTop: `4px solid ${claw.color}`}}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${getRankBadgeClasses(idx)}`}
              >
                {idx + 1}
              </span>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                {claw.version}
              </span>
            </div>
            <h4 className="break-words text-lg font-bold leading-tight text-neutral-900">{claw.name}</h4>
          </div>

          <div className="rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-right">
            <div className="text-3xl font-bold leading-none" style={{color: claw.color}}>
              {claw.overall}
            </div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              {text.leaderboards.table.overall}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="rounded-2xl border border-neutral-100 bg-neutral-50/80 p-4">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">
            {text.leaderboards.table.capabilities}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MobileMetricPill label={text.leaderboards.table.idea} value={claw.scores.idea} color={claw.color} />
            <MobileMetricPill label={text.leaderboards.table.writing} value={claw.scores.writing} color={claw.color} />
            <MobileMetricPill label={text.leaderboards.table.plotting} value={claw.scores.plotting} color={claw.color} />
            <MobileMetricPill
              label={text.leaderboards.table.experiment}
              value={claw.scores.experiment}
              color={claw.color}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-neutral-50/80 p-4">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">
            {text.leaderboards.table.performance}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MobileMetricPill label={text.leaderboards.table.tokens} value={claw.scores.tokenEff} color={claw.color} />
            <MobileMetricPill label={text.leaderboards.table.time} value={claw.scores.timeEff} color={claw.color} />
            <MobileMetricPill
              label={text.leaderboards.table.completion}
              value={claw.scores.completion}
              color={claw.color}
            />
            <MobileMetricPill label={text.leaderboards.table.quality} value={claw.scores.quality} color={claw.color} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileMetricPill({
  label,
  value,
  color,
}: {
  label: string;
  value: ScoreValue;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-neutral-100">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">{label}</div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="h-2.5 w-12 rounded-full bg-neutral-200">
          <span className="block h-full rounded-full" style={{width: `${value ?? 0}%`, backgroundColor: color}}></span>
        </span>
        <span className="font-mono text-sm font-semibold text-neutral-700">{renderScore(value)}</span>
      </div>
    </div>
  );
}

function MorePage({
  text,
  onOpenSubmissionModal,
}: {
  text: (typeof translations)[Locale];
  onOpenSubmissionModal: () => void;
}) {
  return (
    <>
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700">
            <BookOpen size={16} />
            {text.more.badge}
          </div>
          <h2 className="mb-4 text-xl font-bold sm:text-2xl">{text.more.title}</h2>
          <p className="leading-relaxed text-neutral-600">{text.more.intro}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                  {text.more.status}
                </div>
                <h3 className="text-xl font-bold text-neutral-900">{text.more.cardTitle}</h3>
              </div>
              <a
                href={DETAILS_REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
              >
                {text.more.linkLabel}
                <ExternalLink size={16} />
              </a>
            </div>

            {text.more.cardBody ? <p className="max-w-3xl leading-relaxed text-neutral-600">{text.more.cardBody}</p> : null}

            {text.more.linkHint ? (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm leading-relaxed text-neutral-500">
                {text.more.linkHint}
              </div>
            ) : null}
          </div>
        </div>
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex h-full flex-col gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                  {text.more.badge}
                </div>
                <h3 className="text-xl font-bold text-neutral-900">{text.more.dataTitle}</h3>
              </div>
              <a
                href={HUGGING_FACE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                {text.more.dataLinkLabel}
                <ExternalLink size={16} />
              </a>
            </div>

            <p className="max-w-3xl leading-relaxed text-neutral-600">{text.more.dataBody}</p>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm leading-relaxed text-neutral-500">
              {text.more.dataLinkHint}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            <Mail size={14} />
            {text.more.badge}
          </div>
          <h3 className="text-xl font-bold text-neutral-900">{text.more.submissionTitle}</h3>
          <p className="mt-3 leading-relaxed text-neutral-600">{text.more.submissionBody}</p>

          <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
              {text.more.submissionRecipientLabel}
            </div>
            <div className="mt-2 text-sm font-semibold text-neutral-900">{text.more.submissionRecipientValue}</div>
            <div className="mt-1 text-sm text-neutral-500">{text.more.submissionRecipientHint}</div>
          </div>

          <button
            type="button"
            onClick={onOpenSubmissionModal}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {text.more.submissionButton}
            <ChevronRight size={16} />
          </button>
        </div>
      </section>
    </>
  );
}

function BlogPage({
  text,
}: {
  text: (typeof translations)[Locale];
}) {
  return (
    <>
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700">
            <BookOpen size={16} />
            {text.blog.badge}
          </div>
          <h2 className="mb-4 text-xl font-bold sm:text-2xl">{text.blog.title}</h2>
          <p className="leading-relaxed text-neutral-600">{text.blog.intro}</p>
        </div>
      </section>

      <section className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">{text.blog.featuredLabel}</p>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              {text.blog.status}
            </span>
          </div>
          <h3 className="text-lg font-bold">{text.blog.featuredTitle}</h3>
          <p className="mt-3 leading-relaxed text-neutral-600">{text.blog.featuredBody}</p>
        </article>

        <aside className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-bold">{text.blog.topicsTitle}</h3>
          <div className="mt-4 space-y-3">
            {text.blog.topics.map((topic) => (
              <div key={topic} className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-700">
                {topic}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </>
  );
}

function SubmissionModal({
  text,
  onClose,
}: {
  text: (typeof translations)[Locale];
  onClose: () => void;
}) {
  const [values, setValues] = useState<SubmissionFormValues>({
    modelName: '',
    email: '',
    message: '',
    attachment: null,
  });
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [fileInputKey, setFileInputKey] = useState(0);

  const mailtoHref = buildSubmissionMailtoHref(values);

  const updateValues = (patch: Partial<SubmissionFormValues>) => {
    setValues((current) => ({...current, ...patch}));
    if (status !== 'sending') {
      setStatus('idle');
      setErrorMessage('');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const modelName = values.modelName.trim();
    const email = values.email.trim();
    const message = values.message.trim();

    if (!modelName) {
      setStatus('error');
      setErrorMessage(text.more.formValidationModelName);
      return;
    }

    if (!isValidEmail(email)) {
      setStatus('error');
      setErrorMessage(text.more.formValidationEmail);
      return;
    }

    if (!message) {
      setStatus('error');
      setErrorMessage(text.more.formValidationMessage);
      return;
    }

    if (values.attachment && values.attachment.size > MAX_ATTACHMENT_SIZE_BYTES) {
      setStatus('error');
      setErrorMessage(text.more.formValidationFileSize);
      return;
    }

    setStatus('sending');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('_subject', `Research Claw Arena submission: ${modelName}`);
      formData.append('_replyto', email);
      formData.append('_template', 'table');
      formData.append('model_name', modelName);
      formData.append('email', email);
      formData.append('message', message);
      formData.append('submission_recipient', SUBMISSION_EMAIL);
      if (values.attachment) {
        formData.append('attachment', values.attachment);
      }

      const response = await fetch(SUBMISSION_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || result?.success === 'false') {
        throw new Error(result?.message || 'Submission failed');
      }

      setStatus('success');
      setValues({
        modelName: '',
        email: '',
        message: '',
        attachment: null,
      });
      setFileInputKey((current) => current + 1);
    } catch {
      setStatus('error');
      setErrorMessage(text.more.formError);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/55 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="submission-modal-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-neutral-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-5 py-5 sm:px-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              <Mail size={14} />
              {text.more.badge}
            </div>
            <h3 id="submission-modal-title" className="mt-3 text-xl font-bold text-neutral-900 sm:text-2xl">
              {text.more.formTitle}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{text.more.formIntro}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-200 p-2 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
            aria-label={text.more.formClose}
          >
            <X size={18} />
          </button>
        </div>

        <form className="space-y-5 px-5 py-5 sm:px-6 sm:py-6" onSubmit={handleSubmit} noValidate>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
              {text.more.submissionRecipientLabel}
            </div>
            <div className="mt-2 text-sm font-semibold text-neutral-900">{text.more.submissionRecipientValue}</div>
          </div>

          {status === 'success' ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {text.more.formSuccess}
            </div>
          ) : null}

          {status === 'error' && errorMessage ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block">
              <div className="mb-2 text-sm font-semibold text-neutral-700">{text.more.formModelNameLabel}</div>
              <input
                type="text"
                value={values.modelName}
                onChange={(event) => updateValues({modelName: event.target.value})}
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                placeholder={text.more.formModelNamePlaceholder}
              />
            </label>

            <label className="block">
              <div className="mb-2 text-sm font-semibold text-neutral-700">{text.more.formEmailLabel}</div>
              <input
                type="email"
                value={values.email}
                onChange={(event) => updateValues({email: event.target.value})}
                autoComplete="email"
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                placeholder={text.more.formEmailPlaceholder}
              />
            </label>
          </div>

          <label className="block">
            <div className="mb-2 text-sm font-semibold text-neutral-700">{text.more.formMessageLabel}</div>
            <textarea
              value={values.message}
              onChange={(event) => updateValues({message: event.target.value})}
              rows={7}
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              placeholder={text.more.formMessagePlaceholder}
            />
          </label>

          <div>
            <div className="mb-2 text-sm font-semibold text-neutral-700">{text.more.formAttachmentLabel}</div>
            <label className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-4 transition-colors hover:border-blue-300 hover:bg-blue-50/40">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <Paperclip size={16} className="text-blue-600" />
                {text.more.formAttachmentHint}
              </div>
              <div className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm ring-1 ring-neutral-200 transition-colors hover:bg-neutral-100">
                <Paperclip size={16} />
                {text.more.formAttachmentLabel}
              </div>
              <input
                key={fileInputKey}
                type="file"
                className="hidden"
                onChange={(event) => updateValues({attachment: event.target.files?.[0] ?? null})}
              />
            </label>
            {values.attachment ? (
              <div className="mt-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
                  {text.more.formSelectedFileLabel}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-medium text-neutral-900">{values.attachment.name}</span>
                  <span>·</span>
                  <span>{formatFileSize(values.attachment.size)}</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <a
              href={mailtoHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
            >
              {text.more.formDirectEmail}
              <ExternalLink size={16} />
            </a>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
              >
                {text.more.formCancel}
              </button>
              <button
                type="submit"
                disabled={status === 'sending'}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                <Send size={16} />
                {status === 'sending' ? text.more.formSending : text.more.formSend}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function ArenaPage({
  text,
  arenaCards,
  arenaRounds,
  activeArena,
  activeRound,
  onSelectArena,
  onSelectRound,
}: {
  text: (typeof translations)[Locale];
  arenaCards: ReturnType<typeof buildArenaCards>;
  arenaRounds: ReturnType<typeof buildArenaRounds>;
  activeArena: ArenaId;
  activeRound: RoundId;
  onSelectArena: (arena: ArenaId) => void;
  onSelectRound: (round: RoundId) => void;
}) {
  const selectedArena = arenaCards.find((card) => card.id === activeArena)!;
  const selectedRounds = arenaRounds[activeArena];
  const selectedRound = selectedRounds.find((round) => round.id === activeRound) ?? selectedRounds[0];

  return (
    <>
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700">
            <FlaskConical size={16} />
            {text.arena.badge}
          </div>
          <h2 className="mb-4 text-xl font-bold sm:text-2xl">{text.arena.title}</h2>
          <p className="leading-relaxed text-neutral-600">{text.arena.intro}</p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{text.arena.tracksTitle}</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
          {arenaCards.map((card) => {
            const Icon = card.icon;
            const active = activeArena === card.id;
            const statusLabel =
              card.status === 'available' ? text.arena.statuses.available : text.arena.statuses.comingSoon;
            const cardClassName = `rounded-2xl border bg-white p-5 text-left shadow-sm transition-all sm:p-6 ${
              active
                ? 'border-blue-200 ring-2 ring-blue-100'
                : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
            }`;
            const cardBody = (
              <>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className={`rounded-2xl border px-3 py-2 ${card.accent}`}>
                    <Icon size={18} />
                  </div>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    {statusLabel}
                  </span>
                </div>

                <h4 className="mb-2 text-xl font-bold">{card.title}</h4>
                <p className="mb-5 text-sm leading-relaxed text-neutral-600">{card.blurb}</p>

                <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                  {card.status === 'available' ? text.arena.enterTrack : text.arena.statuses.comingSoon}
                  <ChevronRight size={16} />
                </div>
              </>
            );

            if (card.id === 'idea') {
              return (
                <a
                  key={card.id}
                  href={DETAILS_REPO_IDEA_URL}
                  target="_blank"
                  rel="noreferrer"
                  className={cardClassName}
                >
                  {cardBody}
                </a>
              );
            }

            return (
              <button key={card.id} type="button" onClick={() => onSelectArena(card.id)} className={cardClassName}>
                {cardBody}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">{selectedArena.title}</p>
              <h3 className="mt-2 text-lg font-bold">{text.arena.roundPickerTitle}</h3>
            </div>
            <div
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                selectedRound.status === 'ready'
                  ? 'border border-blue-100 bg-blue-50 text-blue-700'
                  : 'border border-neutral-200 bg-neutral-100 text-neutral-600'
              }`}
            >
              {selectedRound.status === 'ready' ? text.arena.statuses.ready : text.arena.statuses.comingSoon}
            </div>
          </div>

          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 xl:mx-0 xl:grid xl:gap-4 xl:overflow-visible xl:px-0 xl:pb-0">
            {selectedRounds.map((round) => {
              const active = round.id === activeRound;
              const badgeLabel = active
                ? text.arena.statuses.selected
                : round.status === 'ready'
                  ? text.arena.statuses.ready
                  : text.arena.statuses.comingSoon;

              return (
                <button
                  key={round.id}
                  type="button"
                  onClick={() => onSelectRound(round.id)}
                  className={`min-w-[280px] rounded-2xl border px-4 py-4 text-left transition-all sm:min-w-[320px] xl:min-w-0 xl:px-5 ${
                    active
                      ? 'border-blue-200 bg-blue-50 text-blue-900 shadow-sm'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">{round.label}</div>
                      <div className={`text-sm ${active ? 'text-blue-700' : 'text-neutral-500'}`}>{round.subtitle}</div>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                        active ? 'bg-white text-blue-700' : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {badgeLabel}
                    </div>
                  </div>
                  <p className={`mt-3 text-sm leading-relaxed ${active ? 'text-blue-800' : 'text-neutral-600'}`}>
                    {round.prompt}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">{text.arena.roundDetailsTitle}</p>
          <h3 className="mt-2 text-lg font-bold">
            {selectedRound.label} <span className="text-neutral-400">/ {selectedRound.subtitle}</span>
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-neutral-600">{selectedRound.prompt}</p>
          <p className="mt-3 text-sm leading-relaxed text-neutral-500">{selectedRound.details}</p>

          <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-800">{text.arena.participants}</span>
              <span className="text-xs uppercase tracking-[0.18em] text-neutral-400">{text.arena.participantCount}</span>
            </div>
            <div className="space-y-3">
              {clawsWithOverall.map((claw) => (
                <div key={claw.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: claw.color}}></div>
                    <span className="truncate font-medium text-neutral-800">{claw.name}</span>
                  </div>
                  <span className="text-sm text-neutral-500">{claw.version}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ChartCard({
  title,
  icon,
  data,
  selectedClaws,
  activeCapability,
  activeCapabilityLabel,
  onSubjectClick,
  emptyMessage,
}: {
  title: string;
  icon: ReactNode;
  data: ChartDatum[];
  selectedClaws: string[];
  activeCapability: ArenaId;
  activeCapabilityLabel?: string;
  onSubjectClick?: (arena: ArenaId) => void;
  emptyMessage?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-700 sm:mb-6 sm:text-base">
        {icon}
        {title}
      </h4>
      <div className="h-[260px] w-full sm:h-[300px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/70 text-center text-sm leading-relaxed text-neutral-400">
            <div>
              <div className="font-medium text-neutral-500">{activeCapabilityLabel}</div>
              <div className="mt-2">{emptyMessage}</div>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="#e5e5e5" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fill: '#a3a3a3', fontSize: 10}} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e5e5',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} />
              {clawsWithOverall
                .filter((claw) => selectedClaws.includes(claw.id))
                .map((claw) => (
                  <Radar
                    key={claw.id}
                    name={claw.name}
                    dataKey={claw.name}
                    stroke={claw.color}
                    fill={claw.color}
                    fillOpacity={0.2}
                  />
                ))}
              <PolarAngleAxis
                dataKey="subject"
                tick={(tickProps) => (
                  <CapabilityAxisTick
                    {...tickProps}
                    activeCapability={activeCapability}
                    subjectArenaMap={Object.fromEntries(
                      data
                        .filter((item) => item.arenaId)
                        .map((item) => [item.subject, item.arenaId])
                    )}
                    onSubjectClick={onSubjectClick}
                  />
                )}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function CapabilityAxisTick({
  x,
  y,
  payload,
  activeCapability,
  subjectArenaMap,
  onSubjectClick,
}: {
  x?: number;
  y?: number;
  payload?: {
    value?: string;
  };
  activeCapability?: ArenaId;
  subjectArenaMap: Record<string, ArenaId>;
  onSubjectClick?: (arena: ArenaId) => void;
}) {
  const arenaId = payload?.value ? subjectArenaMap[payload.value] : undefined;
  const isActive = !!arenaId && arenaId === activeCapability;

  return (
    <text
      x={x}
      y={y}
      dy={4}
      fill={isActive ? '#2563eb' : '#525252'}
      fontSize={12}
      fontWeight={isActive ? 700 : 400}
      textAnchor="middle"
      data-testid={arenaId ? `capability-axis-${arenaId}` : undefined}
      pointerEvents="all"
      style={{cursor: arenaId && onSubjectClick ? 'pointer' : 'default'}}
      onClick={() => {
        if (arenaId && onSubjectClick) {
          onSubjectClick(arenaId);
        }
      }}
    >
      {payload?.value}
    </text>
  );
}

function ScoreBar({
  label,
  score,
  icon,
  color,
}: {
  label: string;
  score: ScoreValue;
  icon: ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-neutral-50/80 px-3 py-3 text-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-neutral-700">
          <span className="text-neutral-400">{icon}</span>
          <span className="truncate text-sm font-medium">{label}</span>
        </div>
        <div className="text-right font-mono text-xs font-semibold text-neutral-700">{renderScore(score)}</div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{width: `${score ?? 0}%`, backgroundColor: color}}
        />
      </div>
    </div>
  );
}
