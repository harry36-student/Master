/**
 * i18n.js — 多語言支援模組
 * Lung Cancer Histopathology Analysis System
 *
 * 支援語言：繁體中文、English、日本語、한국어、Español、Français、Deutsch
 * 語言切換同時影響：UI 介面文字 + LLM 報告語言
 */

// ══════════════════════════════════════════════
// 語言定義
// ══════════════════════════════════════════════

const LANGUAGES = {
  'zh-TW': { label: '繁體中文', flag: '🇹🇼', reportLang: 'Traditional Chinese' },
  'en':    { label: 'English',  flag: '🇺🇸', reportLang: 'English' },
  'ja':    { label: '日本語',   flag: '🇯🇵', reportLang: 'Japanese' },
  'ko':    { label: '한국어',   flag: '🇰🇷', reportLang: 'Korean' },
  'es':    { label: 'Español',  flag: '🇪🇸', reportLang: 'Spanish' },
  'fr':    { label: 'Français', flag: '🇫🇷', reportLang: 'French' },
  'de':    { label: 'Deutsch',  flag: '🇩🇪', reportLang: 'German' },
};

// ══════════════════════════════════════════════
// 翻譯字典
// ══════════════════════════════════════════════

const TRANSLATIONS = {
  'zh-TW': {
    // 頁首
    appTitle: 'Lung Cancer Histopathology Analysis',
    appSubtitle: 'H&E · Grad-CAM · 病理報告',
    statusChecking: '連線中...',
    statusOnline: '後端已連線',
    statusOffline: '後端離線',
    statusLlmOffline: 'LLM 離線',
    // 左欄
    uploadTitle: '影像上傳',
    dropzoneText: '點擊或拖放 H&E 切片影像至此',
    dropzoneHint: '支援 JPEG、PNG、TIFF · 最大 50MB',
    dropzoneReplace: '點擊或拖放以更換影像',
    analyzeBtn: '開始分析',
    analyzeBtnHint: '上傳 H&E 切片影像後即可分析',
    analyzingBtn: '分析中...',
    reanalyzeBtn: '重新分析',
    // 語言選擇
    langLabel: '語言 / Language',
    reportLangLabel: '報告語言',
    // 中欄
    step1: '影像分類',
    step2: '產生熱力圖',
    step3: '產生報告',
    waitingUpload: '等待上傳',
    waitingAnalysis: '等待分析',
    downloadBtn: '下載',
    classificationTitle: '分類結果',
    // 右欄
    reportTitle: '醫療報告',
    reportEmpty: '上傳 H&E 切片影像並執行分析後，<br>系統將自動產生結構化病理報告',
    exportPdf: '匯出 PDF',
    exportTxt: '匯出文字',
    disclaimer: '⚠️ 本系統僅供醫療輔助參考，不構成正式診斷。所有結果應由合格醫療人員審閱。',
    findingsPlaceholder: '執行分析後顯示影像發現',
    impressionPlaceholder: '執行分析後顯示臨床印象',
    recommendationPlaceholder: '執行分析後顯示建議事項',
    // Toast
    uploadSuccess: '影像上傳成功',
    uploadFailed: '影像上傳失敗',
    analysisComplete: '分析完成',
    classifyFailed: '影像分類失敗',
    camFailed: 'Grad-CAM 熱力圖產生失敗',
    reportFailed: '報告產生失敗',
    analysisFailed: '分析過程發生錯誤',
    pdfSuccess: 'PDF 報告已開始下載',
    pdfFailed: 'PDF 匯出失敗',
    txtSuccess: '文字報告已開始下載',
    heatmapSuccess: 'Heatmap 影像已開始下載',
    heatmapFailed: 'Heatmap 下載失敗',
    noReport: '尚無報告可匯出，請先執行分析',
    uploadFirst: '請先上傳 H&E 切片影像',
    formatError: '不支援的檔案格式',
    formatErrorDetail: '請上傳 JPEG、PNG 或 TIFF 格式的影像',
    sizeError: '檔案過大',
    sizeErrorDetail: '檔案大小上限為 50MB',
    errorTitle: '錯誤',
    successTitle: '成功',
    warningTitle: '警告',
  },

  'en': {
    appTitle: 'Lung Cancer Histopathology Analysis',
    appSubtitle: 'H&E · Grad-CAM · Pathology Report',
    statusChecking: 'Connecting...',
    statusOnline: 'Backend connected',
    statusOffline: 'Backend offline',
    statusLlmOffline: 'LLM offline',
    uploadTitle: 'Image Upload',
    dropzoneText: 'Click or drag H&E slide image here',
    dropzoneHint: 'Supports JPEG, PNG, TIFF · Max 50MB',
    dropzoneReplace: 'Click or drag to replace image',
    analyzeBtn: 'Start Analysis',
    analyzeBtnHint: 'Upload an H&E slide image to begin',
    analyzingBtn: 'Analyzing...',
    reanalyzeBtn: 'Re-analyze',
    langLabel: 'Language',
    reportLangLabel: 'Report Language',
    step1: 'Classification',
    step2: 'Grad-CAM',
    step3: 'Report',
    waitingUpload: 'Waiting for upload',
    waitingAnalysis: 'Waiting for analysis',
    downloadBtn: 'Download',
    classificationTitle: 'Classification Results',
    reportTitle: 'Pathology Report',
    reportEmpty: 'Upload an H&E slide and run analysis<br>to generate a structured pathology report',
    exportPdf: 'Export PDF',
    exportTxt: 'Export Text',
    disclaimer: '⚠️ For clinical reference only. Not a formal diagnosis. All results should be reviewed by a qualified physician.',
    findingsPlaceholder: 'Run analysis to display image findings',
    impressionPlaceholder: 'Run analysis to display clinical impression',
    recommendationPlaceholder: 'Run analysis to display recommendations',
    uploadSuccess: 'Image uploaded successfully',
    uploadFailed: 'Image upload failed',
    analysisComplete: 'Analysis complete',
    classifyFailed: 'Classification failed',
    camFailed: 'Grad-CAM generation failed',
    reportFailed: 'Report generation failed',
    analysisFailed: 'Analysis error occurred',
    pdfSuccess: 'PDF report download started',
    pdfFailed: 'PDF export failed',
    txtSuccess: 'Text report download started',
    heatmapSuccess: 'Heatmap download started',
    heatmapFailed: 'Heatmap download failed',
    noReport: 'No report to export. Please run analysis first.',
    uploadFirst: 'Please upload an H&E slide image first',
    formatError: 'Unsupported file format',
    formatErrorDetail: 'Please upload JPEG, PNG, or TIFF images',
    sizeError: 'File too large',
    sizeErrorDetail: 'Maximum file size is 50MB',
    errorTitle: 'Error',
    successTitle: 'Success',
    warningTitle: 'Warning',
  },

  'ja': {
    appTitle: '肺癌組織病理学解析システム',
    appSubtitle: 'H&E · Grad-CAM · 病理レポート',
    statusChecking: '接続中...',
    statusOnline: 'バックエンド接続済み',
    statusOffline: 'バックエンドオフライン',
    statusLlmOffline: 'LLMオフライン',
    uploadTitle: '画像アップロード',
    dropzoneText: 'H&E切片画像をクリックまたはドラッグ',
    dropzoneHint: 'JPEG、PNG、TIFF対応 · 最大50MB',
    dropzoneReplace: 'クリックまたはドラッグして画像を変更',
    analyzeBtn: '解析開始',
    analyzeBtnHint: 'H&E切片画像をアップロードして解析',
    analyzingBtn: '解析中...',
    reanalyzeBtn: '再解析',
    langLabel: '言語',
    reportLangLabel: 'レポート言語',
    step1: '画像分類',
    step2: 'Grad-CAM生成',
    step3: 'レポート生成',
    waitingUpload: 'アップロード待ち',
    waitingAnalysis: '解析待ち',
    downloadBtn: 'ダウンロード',
    classificationTitle: '分類結果',
    reportTitle: '病理レポート',
    reportEmpty: 'H&E切片画像をアップロードして解析を実行すると、<br>構造化病理レポートが自動生成されます',
    exportPdf: 'PDFエクスポート',
    exportTxt: 'テキストエクスポート',
    disclaimer: '⚠️ 本システムは医療補助参考のみです。正式な診断ではありません。全ての結果は資格のある医師が確認してください。',
    findingsPlaceholder: '解析実行後に画像所見を表示します',
    impressionPlaceholder: '解析実行後に臨床印象を表示します',
    recommendationPlaceholder: '解析実行後に推奨事項を表示します',
    uploadSuccess: '画像のアップロードが完了しました',
    uploadFailed: '画像のアップロードに失敗しました',
    analysisComplete: '解析完了',
    classifyFailed: '画像分類に失敗しました',
    camFailed: 'Grad-CAM生成に失敗しました',
    reportFailed: 'レポート生成に失敗しました',
    analysisFailed: '解析中にエラーが発生しました',
    pdfSuccess: 'PDFレポートのダウンロードを開始しました',
    pdfFailed: 'PDFエクスポートに失敗しました',
    txtSuccess: 'テキストレポートのダウンロードを開始しました',
    heatmapSuccess: 'ヒートマップのダウンロードを開始しました',
    heatmapFailed: 'ヒートマップのダウンロードに失敗しました',
    noReport: 'エクスポートするレポートがありません。先に解析を実行してください。',
    uploadFirst: 'H&E切片画像をアップロードしてください',
    formatError: 'サポートされていないファイル形式',
    formatErrorDetail: 'JPEG、PNG、またはTIFF画像をアップロードしてください',
    sizeError: 'ファイルサイズが大きすぎます',
    sizeErrorDetail: '最大ファイルサイズは50MBです',
    errorTitle: 'エラー',
    successTitle: '成功',
    warningTitle: '警告',
  },

  'ko': {
    appTitle: '폐암 조직병리학 분석 시스템',
    appSubtitle: 'H&E · Grad-CAM · 병리 보고서',
    statusChecking: '연결 중...',
    statusOnline: '백엔드 연결됨',
    statusOffline: '백엔드 오프라인',
    statusLlmOffline: 'LLM 오프라인',
    uploadTitle: '이미지 업로드',
    dropzoneText: 'H&E 슬라이드 이미지를 클릭하거나 드래그하세요',
    dropzoneHint: 'JPEG, PNG, TIFF 지원 · 최대 50MB',
    dropzoneReplace: '클릭하거나 드래그하여 이미지 교체',
    analyzeBtn: '분석 시작',
    analyzeBtnHint: 'H&E 슬라이드 이미지를 업로드하여 분석',
    analyzingBtn: '분석 중...',
    reanalyzeBtn: '재분석',
    langLabel: '언어',
    reportLangLabel: '보고서 언어',
    step1: '이미지 분류',
    step2: 'Grad-CAM 생성',
    step3: '보고서 생성',
    waitingUpload: '업로드 대기 중',
    waitingAnalysis: '분석 대기 중',
    downloadBtn: '다운로드',
    classificationTitle: '분류 결과',
    reportTitle: '병리 보고서',
    reportEmpty: 'H&E 슬라이드 이미지를 업로드하고 분석을 실행하면<br>구조화된 병리 보고서가 자동으로 생성됩니다',
    exportPdf: 'PDF 내보내기',
    exportTxt: '텍스트 내보내기',
    disclaimer: '⚠️ 본 시스템은 의료 보조 참고용으로만 사용됩니다. 공식 진단이 아닙니다. 모든 결과는 자격을 갖춘 의사가 검토해야 합니다.',
    findingsPlaceholder: '분석 실행 후 이미지 소견을 표시합니다',
    impressionPlaceholder: '분석 실행 후 임상 인상을 표시합니다',
    recommendationPlaceholder: '분석 실행 후 권장 사항을 표시합니다',
    uploadSuccess: '이미지 업로드 성공',
    uploadFailed: '이미지 업로드 실패',
    analysisComplete: '분석 완료',
    classifyFailed: '이미지 분류 실패',
    camFailed: 'Grad-CAM 생성 실패',
    reportFailed: '보고서 생성 실패',
    analysisFailed: '분석 중 오류 발생',
    pdfSuccess: 'PDF 보고서 다운로드 시작',
    pdfFailed: 'PDF 내보내기 실패',
    txtSuccess: '텍스트 보고서 다운로드 시작',
    heatmapSuccess: '히트맵 다운로드 시작',
    heatmapFailed: '히트맵 다운로드 실패',
    noReport: '내보낼 보고서가 없습니다. 먼저 분석을 실행하세요.',
    uploadFirst: 'H&E 슬라이드 이미지를 먼저 업로드하세요',
    formatError: '지원되지 않는 파일 형식',
    formatErrorDetail: 'JPEG, PNG 또는 TIFF 이미지를 업로드하세요',
    sizeError: '파일 크기 초과',
    sizeErrorDetail: '최대 파일 크기는 50MB입니다',
    errorTitle: '오류',
    successTitle: '성공',
    warningTitle: '경고',
  },

  'es': {
    appTitle: 'Análisis Histopatológico de Cáncer de Pulmón',
    appSubtitle: 'H&E · Grad-CAM · Informe Patológico',
    statusChecking: 'Conectando...',
    statusOnline: 'Backend conectado',
    statusOffline: 'Backend desconectado',
    statusLlmOffline: 'LLM desconectado',
    uploadTitle: 'Subir Imagen',
    dropzoneText: 'Haga clic o arrastre la imagen H&E aquí',
    dropzoneHint: 'Compatible con JPEG, PNG, TIFF · Máx 50MB',
    dropzoneReplace: 'Haga clic o arrastre para reemplazar',
    analyzeBtn: 'Iniciar Análisis',
    analyzeBtnHint: 'Suba una imagen H&E para comenzar',
    analyzingBtn: 'Analizando...',
    reanalyzeBtn: 'Re-analizar',
    langLabel: 'Idioma',
    reportLangLabel: 'Idioma del Informe',
    step1: 'Clasificación',
    step2: 'Grad-CAM',
    step3: 'Informe',
    waitingUpload: 'Esperando carga',
    waitingAnalysis: 'Esperando análisis',
    downloadBtn: 'Descargar',
    classificationTitle: 'Resultados de Clasificación',
    reportTitle: 'Informe Patológico',
    reportEmpty: 'Suba una imagen H&E y ejecute el análisis<br>para generar un informe patológico estructurado',
    exportPdf: 'Exportar PDF',
    exportTxt: 'Exportar Texto',
    disclaimer: '⚠️ Solo para referencia clínica. No es un diagnóstico formal. Todos los resultados deben ser revisados por un médico calificado.',
    findingsPlaceholder: 'Ejecute el análisis para mostrar los hallazgos',
    impressionPlaceholder: 'Ejecute el análisis para mostrar la impresión clínica',
    recommendationPlaceholder: 'Ejecute el análisis para mostrar las recomendaciones',
    uploadSuccess: 'Imagen subida exitosamente',
    uploadFailed: 'Error al subir imagen',
    analysisComplete: 'Análisis completo',
    classifyFailed: 'Error en clasificación',
    camFailed: 'Error en generación Grad-CAM',
    reportFailed: 'Error en generación de informe',
    analysisFailed: 'Error durante el análisis',
    pdfSuccess: 'Descarga de PDF iniciada',
    pdfFailed: 'Error al exportar PDF',
    txtSuccess: 'Descarga de texto iniciada',
    heatmapSuccess: 'Descarga de mapa de calor iniciada',
    heatmapFailed: 'Error al descargar mapa de calor',
    noReport: 'No hay informe para exportar. Ejecute el análisis primero.',
    uploadFirst: 'Por favor suba una imagen H&E primero',
    formatError: 'Formato de archivo no compatible',
    formatErrorDetail: 'Por favor suba imágenes JPEG, PNG o TIFF',
    sizeError: 'Archivo demasiado grande',
    sizeErrorDetail: 'El tamaño máximo es 50MB',
    errorTitle: 'Error',
    successTitle: 'Éxito',
    warningTitle: 'Advertencia',
  },

  'fr': {
    appTitle: 'Analyse Histopathologique du Cancer du Poumon',
    appSubtitle: 'H&E · Grad-CAM · Rapport Pathologique',
    statusChecking: 'Connexion...',
    statusOnline: 'Backend connecté',
    statusOffline: 'Backend hors ligne',
    statusLlmOffline: 'LLM hors ligne',
    uploadTitle: "Télécharger l'Image",
    dropzoneText: "Cliquez ou glissez l'image H&E ici",
    dropzoneHint: 'Compatible JPEG, PNG, TIFF · Max 50MB',
    dropzoneReplace: 'Cliquez ou glissez pour remplacer',
    analyzeBtn: "Démarrer l'Analyse",
    analyzeBtnHint: "Téléchargez une image H&E pour commencer",
    analyzingBtn: 'Analyse en cours...',
    reanalyzeBtn: 'Ré-analyser',
    langLabel: 'Langue',
    reportLangLabel: 'Langue du Rapport',
    step1: 'Classification',
    step2: 'Grad-CAM',
    step3: 'Rapport',
    waitingUpload: 'En attente de téléchargement',
    waitingAnalysis: "En attente d'analyse",
    downloadBtn: 'Télécharger',
    classificationTitle: 'Résultats de Classification',
    reportTitle: 'Rapport Pathologique',
    reportEmpty: "Téléchargez une image H&E et lancez l'analyse<br>pour générer un rapport pathologique structuré",
    exportPdf: 'Exporter PDF',
    exportTxt: 'Exporter Texte',
    disclaimer: "⚠️ À titre de référence clinique uniquement. Pas un diagnostic formel. Tous les résultats doivent être examinés par un médecin qualifié.",
    findingsPlaceholder: "Lancez l'analyse pour afficher les résultats",
    impressionPlaceholder: "Lancez l'analyse pour afficher l'impression clinique",
    recommendationPlaceholder: "Lancez l'analyse pour afficher les recommandations",
    uploadSuccess: 'Image téléchargée avec succès',
    uploadFailed: "Échec du téléchargement de l'image",
    analysisComplete: 'Analyse terminée',
    classifyFailed: 'Échec de la classification',
    camFailed: 'Échec de la génération Grad-CAM',
    reportFailed: 'Échec de la génération du rapport',
    analysisFailed: "Erreur lors de l'analyse",
    pdfSuccess: 'Téléchargement du PDF démarré',
    pdfFailed: "Échec de l'export PDF",
    txtSuccess: 'Téléchargement du texte démarré',
    heatmapSuccess: 'Téléchargement de la carte thermique démarré',
    heatmapFailed: 'Échec du téléchargement de la carte thermique',
    noReport: "Aucun rapport à exporter. Veuillez d'abord lancer l'analyse.",
    uploadFirst: "Veuillez d'abord télécharger une image H&E",
    formatError: 'Format de fichier non pris en charge',
    formatErrorDetail: 'Veuillez télécharger des images JPEG, PNG ou TIFF',
    sizeError: 'Fichier trop volumineux',
    sizeErrorDetail: 'La taille maximale est de 50MB',
    errorTitle: 'Erreur',
    successTitle: 'Succès',
    warningTitle: 'Avertissement',
  },

  'de': {
    appTitle: 'Lungenkrebs Histopathologie-Analyse',
    appSubtitle: 'H&E · Grad-CAM · Pathologiebericht',
    statusChecking: 'Verbinde...',
    statusOnline: 'Backend verbunden',
    statusOffline: 'Backend offline',
    statusLlmOffline: 'LLM offline',
    uploadTitle: 'Bild hochladen',
    dropzoneText: 'H&E-Schnittbild hier klicken oder ziehen',
    dropzoneHint: 'JPEG, PNG, TIFF unterstützt · Max 50MB',
    dropzoneReplace: 'Klicken oder ziehen zum Ersetzen',
    analyzeBtn: 'Analyse starten',
    analyzeBtnHint: 'H&E-Bild hochladen um zu beginnen',
    analyzingBtn: 'Analysiere...',
    reanalyzeBtn: 'Erneut analysieren',
    langLabel: 'Sprache',
    reportLangLabel: 'Berichtssprache',
    step1: 'Klassifikation',
    step2: 'Grad-CAM',
    step3: 'Bericht',
    waitingUpload: 'Warte auf Upload',
    waitingAnalysis: 'Warte auf Analyse',
    downloadBtn: 'Herunterladen',
    classificationTitle: 'Klassifikationsergebnisse',
    reportTitle: 'Pathologiebericht',
    reportEmpty: 'H&E-Bild hochladen und Analyse starten,<br>um einen strukturierten Pathologiebericht zu erstellen',
    exportPdf: 'PDF exportieren',
    exportTxt: 'Text exportieren',
    disclaimer: '⚠️ Nur zur klinischen Referenz. Kein formales Diagnose. Alle Ergebnisse müssen von einem qualifizierten Arzt überprüft werden.',
    findingsPlaceholder: 'Analyse starten um Befunde anzuzeigen',
    impressionPlaceholder: 'Analyse starten um klinischen Eindruck anzuzeigen',
    recommendationPlaceholder: 'Analyse starten um Empfehlungen anzuzeigen',
    uploadSuccess: 'Bild erfolgreich hochgeladen',
    uploadFailed: 'Bild-Upload fehlgeschlagen',
    analysisComplete: 'Analyse abgeschlossen',
    classifyFailed: 'Klassifikation fehlgeschlagen',
    camFailed: 'Grad-CAM-Generierung fehlgeschlagen',
    reportFailed: 'Berichtsgenerierung fehlgeschlagen',
    analysisFailed: 'Fehler während der Analyse',
    pdfSuccess: 'PDF-Download gestartet',
    pdfFailed: 'PDF-Export fehlgeschlagen',
    txtSuccess: 'Text-Download gestartet',
    heatmapSuccess: 'Heatmap-Download gestartet',
    heatmapFailed: 'Heatmap-Download fehlgeschlagen',
    noReport: 'Kein Bericht zum Exportieren. Bitte zuerst Analyse starten.',
    uploadFirst: 'Bitte zuerst ein H&E-Bild hochladen',
    formatError: 'Nicht unterstütztes Dateiformat',
    formatErrorDetail: 'Bitte JPEG, PNG oder TIFF hochladen',
    sizeError: 'Datei zu groß',
    sizeErrorDetail: 'Maximale Dateigröße ist 50MB',
    errorTitle: 'Fehler',
    successTitle: 'Erfolg',
    warningTitle: 'Warnung',
  },
};

// ══════════════════════════════════════════════
// I18n 管理器
// ══════════════════════════════════════════════

const I18n = {
  /** 目前 UI 語言 */
  currentLang: 'zh-TW',

  /** 目前報告語言（可與 UI 語言不同） */
  reportLang: 'zh-TW',

  /**
   * 初始化：從 localStorage 讀取上次設定
   */
  init() {
    const savedLang = localStorage.getItem('ui_lang') || 'zh-TW';
    const savedReportLang = localStorage.getItem('report_lang') || savedLang;
    this.currentLang = LANGUAGES[savedLang] ? savedLang : 'zh-TW';
    this.reportLang = LANGUAGES[savedReportLang] ? savedReportLang : this.currentLang;
    this.applyLanguage();
  },

  /**
   * 取得翻譯字串
   * @param {string} key - 翻譯鍵值
   * @returns {string}
   */
  t(key) {
    const dict = TRANSLATIONS[this.currentLang] || TRANSLATIONS['zh-TW'];
    return dict[key] || TRANSLATIONS['zh-TW'][key] || key;
  },

  /**
   * 取得報告語言的英文名稱（傳給後端）
   * @returns {string}
   */
  getReportLanguageName() {
    return LANGUAGES[this.reportLang]?.reportLang || 'Traditional Chinese';
  },

  /**
   * 切換 UI 語言
   * @param {string} lang - 語言代碼
   */
  setLanguage(lang) {
    if (!LANGUAGES[lang]) return;
    this.currentLang = lang;
    localStorage.setItem('ui_lang', lang);
    this.applyLanguage();
  },

  /**
   * 切換報告語言
   * @param {string} lang - 語言代碼
   */
  setReportLanguage(lang) {
    if (!LANGUAGES[lang]) return;
    this.reportLang = lang;
    localStorage.setItem('report_lang', lang);
    // 更新報告語言選擇器顯示
    const selector = document.getElementById('report-lang-selector');
    if (selector) selector.value = lang;
  },

  /**
   * 套用語言到 DOM（更新所有 data-i18n 元素）
   * 切換語言時立即更新頁面上所有文字，實現無縫切換
   */
  applyLanguage() {
    // 1. 更新 html lang 屬性
    document.documentElement.lang = this.currentLang;

    // 2. 更新所有帶 data-i18n 屬性的元素（核心機制）
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      if (!translation) return;

      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        // 輸入框更新 placeholder
        el.placeholder = translation;
      } else if (el.hasAttribute('data-i18n-html')) {
        // 允許 HTML 內容（如 <br>）
        el.innerHTML = translation;
      } else {
        // 純文字更新
        el.textContent = translation;
      }
    });

    // 3. 更新 aria-label
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      const translation = this.t(key);
      if (translation) el.setAttribute('aria-label', translation);
    });

    // 4. 更新語言選擇器的選中值
    const uiSelector = document.getElementById('ui-lang-selector');
    if (uiSelector) uiSelector.value = this.currentLang;

    const reportSelector = document.getElementById('report-lang-selector');
    if (reportSelector) reportSelector.value = this.reportLang;

    // 5. 更新健康狀態文字（動態元素，不用 data-i18n）
    const healthText = document.getElementById('health-status-text');
    if (healthText) {
      const dot = document.getElementById('health-status-dot');
      if (dot) {
        if (dot.classList.contains('status-dot--online')) {
          healthText.textContent = this.t('statusOnline');
        } else if (dot.classList.contains('status-dot--offline')) {
          healthText.textContent = this.t('statusOffline');
        } else {
          healthText.textContent = this.t('statusChecking');
        }
      }
    }

    // 6. 通知 app.js 語言已更新（讓動態產生的 UI 也能更新）
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { lang: this.currentLang }
    }));
  },
};

// 掛載到全域
window.I18n = I18n;
window.LANGUAGES = LANGUAGES;

// 自動初始化（DOMContentLoaded 保證 DOM 已準備好）
document.addEventListener('DOMContentLoaded', () => I18n.init());
