export type Locale = "en" | "fr" | "es";

export const LOCALES: Locale[] = ["en", "fr", "es"];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_STORAGE_KEY = "chaptercraft-locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
};

export const LOCALE_DATE_FORMAT: Record<Locale, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
};

export type Messages = {
  common: {
    loading: string;
    saving: string;
    save: string;
    cancel: string;
    delete: string;
    error: string;
    optional: string;
  };
  header: { tagline: string; settings: string };
  auth: {
    login: string;
    signup: string;
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    passwordHint: string;
    loginButton: string;
    signupButton: string;
    logout: string;
    welcome: string;
    loginRequired: string;
    greeting: string;
  };
  language: { label: string };
  settings: {
    title: string;
    description: string;
    backHome: string;
    aiSection: string;
    aiSectionHint: string;
    saved: string;
  };
  home: {
    title: string;
    subtitle: string;
    newProject: string;
    newBook: string;
    noProjects: string;
    getStarted: string;
    chapter: string;
    chapters: string;
    done: string;
    modifiedOn: string;
    howItWorks: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
  };
  project: {
    backToProjects: string;
    tabs: {
      chapters: string;
      pitch: string;
      overview: string;
      coherence: string;
      settings: string;
    };
    newChapterPlaceholder: string;
    addFirstChapter: string;
    selectChapter: string;
    deleteChapterConfirm: string;
    deleteProject: string;
    deleteProjectTitle: string;
    deleteProjectDescription: string;
    deleteProjectInstruction: string;
    deleteProjectInputLabel: string;
    deleteProjectInputPlaceholder: string;
    deleteProjectError: string;
    aiSettingsTitle: string;
    aiSettingsDescription: string;
    fields: {
      title: string;
      pitch: string;
      synopsis: string;
      genre: string;
      targetAudience: string;
    };
  };
  newProject: {
    bookTitle: string;
    bookTitlePlaceholder: string;
    pitchPlaceholder: string;
    synopsisOptional: string;
    synopsisPlaceholder: string;
    genrePlaceholder: string;
    audiencePlaceholder: string;
    create: string;
  };
  chapter: {
    title: string;
    status: string;
    outline: string;
    content: string;
    contentPlaceholder: string;
    formatContent: string;
    notes: string;
    notesPlaceholder: string;
    aiAssist: string;
    optionalInstructions: string;
    instructionsPlaceholder: string;
    sendAiPrompt: string;
    applyAiResult: string;
    errorPrefix: string;
  };
  chapterStatus: {
    outline: string;
    draft: string;
    revision: string;
    done: string;
  };
  aiActions: {
    generateOutline: string;
    expandOutline: string;
    writeDraft: string;
    revise: string;
    suggestImprovements: string;
  };
  overview: {
    title: string;
    description: string;
    totalWords: string;
    estimatedPages: string;
    pagesHint: string;
    chapters: string;
    readingTime: string;
    readingMinutes: string;
    characters: string;
    outlineWords: string;
    byChapter: string;
    words: string;
    pages: string;
    total: string;
    noChapters: string;
  };
  coherence: {
    title: string;
    analyze: string;
    analyzing: string;
    emptyDescription: string;
    score: string;
    issues: string;
    suggestions: string;
    lastAnalysis: string;
  };
  ai: {
    activeProvider: string;
    activeProviderHint: string;
    activeBadge: string;
    provider: string;
    ollamaUrl: string;
    ollamaUrlPlaceholder: string;
    ollamaUrlHint: string;
    model: string;
    listModels: string;
    openaiKey: string;
    anthropicKey: string;
    geminiKey: string;
    groqKey: string;
    openrouterKey: string;
    testConnection: string;
    connectionSuccess: string;
    activeModel: string;
    noModelsFound: string;
    modelsLoadFailed: string;
    modelsAvailable: string;
    sections: {
      ollama: string;
      ollamaHint: string;
      openai: string;
      openaiHint: string;
      anthropic: string;
      anthropicHint: string;
      gemini: string;
      geminiHint: string;
      groq: string;
      groqHint: string;
      openrouter: string;
      openrouterHint: string;
    };
    providers: {
      ollama: string;
      openai: string;
      anthropic: string;
      gemini: string;
      groq: string;
      openrouter: string;
    };
  };
  errors: {
    titleAndPitchRequired: string;
    chapterTitleRequired: string;
    projectNotFound: string;
    chapterNotFound: string;
    chapterIdRequired: string;
    actionAndProjectRequired: string;
    createFailed: string;
    unknownProvider: string;
    openaiKeyMissing: string;
    anthropicKeyMissing: string;
    aiError: string;
    invalidAiConfig: string;
    aiRequestTooLarge: string;
    aiRateLimited: string;
    aiProviderUnavailable: string;
    unknown: string;
    emailPasswordRequired: string;
    passwordTooShort: string;
    invalidEmail: string;
    emailTaken: string;
    signupFailed: string;
    invalidCredentials: string;
    unauthorized: string;
    chapterTooLarge: string;
  };
};

export type ErrorKey = keyof Messages["errors"];
