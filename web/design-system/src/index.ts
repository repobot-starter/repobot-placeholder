// Theme
export { vars, lightTheme, darkTheme } from "./theme/tokens.css"
export {
    themeConfig,
    uiConfig,
    resolveUiConfig,
    type ResolvedUiConfig,
    navigationConfig,
    configuredDefaultMode,
    configuredRadiusPreset,
    configuredRadiusExplicit,
    packBrand,
    packFont,
    packBrandVarNames,
    packFontVarName,
    resolvePackBrand,
    resolvePackFont,
    mixHex,
    contrastText,
    isCssColor,
    isShadowValue,
    gateThemeDocument,
    gateThemeDocumentForPack,
    rawThemeContract,
    themeDocumentForeign,
    themeDocumentForeignForPack,
    resolveThemeTokens,
    resolveTreatments,
    characterConfig,
    themeCharacterPresets,
    type ThemeCharacterPreset,
    type ThemeTreatmentSet,
    type RepobotThemeConfig,
    type RepobotPaletteConfig,
    type RepobotPaletteNavConfig,
    type RepobotUiConfig,
    type ResolvedThemeTokens,
    type ThemeChartSet,
    type ThemeColorSet,
    type ThemeConfiguredMode,
    type ThemeDensityPreset,
    type ThemeMotionPreset,
    type ThemeMotionSet,
    type ThemeNavigationSet,
    type ThemeNavOverrides,
    type ThemeNavigationVariant,
    type ThemeRadiusPreset,
    type ThemeShadowSet,
    type UiTableStyle,
    type UiTablePagination,
    type UiFormPresentation,
    type UiFormWidth,
    type UiErrorPresentation,
    type UiLoaderStyle,
    type UiModalChrome,
    type UiAuthLayout,
    type UiEmptyVoice,
    type UiToastPosition,
    type UiToastStyle,
} from "./theme/themeConfig"
export {
    useThemeContract,
    buildThemeContractCss,
    buildMarketingContractCss,
    buildPackOverlayCss,
    registerVisualDocRenderer,
    recordVisualDocSeq,
    visualDocAckFallbackNeeded,
    visualDocSeq,
    type ResolvedThemeContract,
} from "./theme/themeHotUpdate"
export {
    marketingPresetDefinitions,
    resolvePresetOverlay,
    type PresetDefinition,
    type PresetModeVariant,
    type PresetOverlay,
    type PresetPalette,
} from "./marketing/theme/marketingPresets"
export {
    runtimeSiteDocument,
    hasRuntimeSiteDocument,
    RUNTIME_SITE_CONFIG_ELEMENT_ID,
} from "./theme/runtimeSiteDocuments"
export {
    getThemeContractOverride,
    setThemeContractOverride,
    subscribeThemeContract,
} from "./theme/themeContractStore"
export {
    UiThemeProvider,
    useUiTheme,
    useResolvedUiMode,
    type UiThemeMode,
    type UiThemeContextValue,
    type UiThemeProviderProps,
} from "./theme/UiThemeProvider"

// Primitives
export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from "./primitives/Button"
export { Input, type InputProps } from "./primitives/Input"
export { TextArea, type TextAreaProps } from "./primitives/TextArea"
export { Label, type LabelProps } from "./primitives/Label"
export { Select, type SelectOption, type SelectProps } from "./primitives/Select"
export { Checkbox, type CheckboxProps } from "./primitives/Checkbox"
export { RadioGroup, type RadioGroupOption, type RadioGroupProps } from "./primitives/RadioGroup"
export { Switch, type SwitchProps } from "./primitives/Switch"
export {
    Dialog,
    type DialogChrome,
    type DialogPresentation,
    type DialogProps,
    type DialogSize,
} from "./primitives/Dialog"
export { DropdownMenu, type DropdownMenuItem, type DropdownMenuProps } from "./primitives/DropdownMenu"
export { Spinner, type SpinnerProps } from "./primitives/Spinner"
export { Badge, type BadgeProps, type BadgeTone } from "./primitives/Badge"
export { Avatar, type AvatarProps, type AvatarSize } from "./primitives/Avatar"
export { Tabs, type TabsItem, type TabsProps } from "./primitives/Tabs"

// Components
export {
    AppShell,
    ThemeToggle,
    appShellContentModes,
    appShellLayouts,
    type AppShellContentMode,
    type AppShellDrillUp,
    type AppShellLayout,
    type AppShellNavItem,
    type AppShellNavSection,
    type AppShellProfile,
    type AppShellProfileItem,
    type AppShellProps,
} from "./components/AppShell"
export {
    DataTable,
    type DataTableColumn,
    type DataTableColumnFilter,
    type DataTableColumnFilterOption,
    type DataTableExpandable,
    type DataTableInlineEdit,
    type DataTablePaginationProps,
    type DataTableProps,
    type DataTableSort,
    type DataTableSortDirection,
} from "./components/DataTable"
export { DataTableColumnManager, type ColumnSettings } from "./components/DataTableColumnManager"
export {
    StatCard,
    StatCardRow,
    type StatCardDelta,
    type StatCardDeltaDirection,
    type StatCardProps,
    type StatCardRowProps,
    type StatCardTone,
} from "./components/StatCard"
export {
    ChartCard,
    type ChartCardKind,
    type ChartCardProps,
    type ChartPoint,
    type ChartSeries,
} from "./components/ChartCard"
export { ActivityFeed, type ActivityFeedItem, type ActivityFeedProps } from "./components/ActivityFeed"
export {
    Timeline,
    type TimelineChange,
    type TimelineEntry,
    type TimelineProps,
    type TimelineTone,
} from "./components/Timeline"
export {
    SettingsGroup,
    SettingsGroups,
    SettingsRow,
    type SettingsGroupProps,
    type SettingsGroupsProps,
    type SettingsRowProps,
} from "./components/SettingsGroups"
export {
    FiltersToolbar,
    type FiltersToolbarFilter,
    type FiltersToolbarFilterOption,
    type FiltersToolbarProps,
    type FiltersToolbarSearch,
    type FiltersToolbarSort,
} from "./components/FiltersToolbar"
export { ListDetailLayout, type ListDetailLayoutProps } from "./components/ListDetailLayout"
export { DetailPage, type DetailPageMetaItem, type DetailPageProps } from "./components/DetailPage"
export {
    ToastProvider,
    useToast,
    type ToastContextValue,
    type ToastOptions,
    type ToastProviderProps,
    type ToastTone,
} from "./components/Toast"
export { GlobalErrors, type GlobalErrorsProps } from "./components/GlobalErrors"
export {
    publishGlobalError,
    dismissGlobalError,
    dismissAllGlobalErrors,
    getGlobalErrors,
    subscribeGlobalErrors,
    type GlobalErrorEntry,
    type GlobalErrorInput,
} from "./components/globalErrorStore"
export {
    UiQueryView,
    type UiQueryViewEmptyState,
    type UiQueryViewModel,
    type UiQueryViewPrimaryAction,
    type UiQueryViewProps,
} from "./components/UiQueryView"
export { UiQueryViewFormModal, type UiQueryViewFormModalProps } from "./components/UiQueryViewFormModal"
export {
    ErrorBoundary,
    ErrorPanel,
    type ErrorBoundaryProps,
    type ErrorPanelProps,
} from "./components/ErrorBoundary"
export { EmptyState, type EmptyStateProps } from "./components/EmptyState"
export {
    AiChatThread,
    AiChatExchange,
    type AiChatThreadAssistantMessage,
    type AiChatThreadFunctionCall,
    type AiChatThreadProps,
    type AiChatThreadReasoningSummary,
    type AiChatThreadResponse,
    type AiChatThreadResponseItem,
    type AiChatThreadSegment,
    type AiChatThreadSegmentFormat,
    type AiChatThreadStatus,
} from "./components/AiChatThread"
export {
    AuthCard,
    AuthScreen,
    type AuthCardHandlers,
    type AuthCardMethod,
    type AuthCardProps,
    type AuthCardView,
    type AuthScreenProps,
} from "./components/AuthCard"
export { AuthShell, type AuthShellProps } from "./components/AuthShell"
export { AuthNotice, type AuthNoticeProps } from "./components/AuthNotice"
export { Skeleton, type SkeletonProps } from "./components/Skeleton"
export { PageLoadingGate, type PageLoadingGateProps } from "./components/PageLoadingGate"

// Formatters (shared display formatting for tables, stat cards, detail rows)
export {
    formatCurrencyMinorUnits,
    formatPercent,
    type FormatCurrencyMinorUnitsOptions,
} from "./utils/formatters"

// Marketing (the landing kernel surface — see docs/landing-kernel-spec.md)
export {
    marketing,
    marketingPresetClasses,
    marketingPresetModeClasses,
    marketingPresetNames,
    type MarketingMode,
    type MarketingPresetName,
} from "./marketing/theme/marketingTheme.css"
export {
    marketingHomeHref,
    marketingHref,
    marketingSrc,
    splitAccentWord,
    type MarketingAccentPlacement,
    type MarketingCta,
    type MarketingImageSource,
    type MarketingMedia,
} from "./marketing/marketingContent"
export { marketingItemStamp, marketingLinkKey } from "./marketing/marketingItemStamp"
export { MarketingImage, marketingImageProps, type MarketingImageProps } from "./marketing/MarketingImage"
export {
    SectionBackdrop,
    type MarketingBackdrop,
    type MarketingBackdropArt,
} from "./marketing/MarketingBackdrop"
export { MarketingBrowserFrame, type MarketingBrowserFrameProps } from "./marketing/MarketingBrowserFrame"
export {
    MarketingArtPanel,
    MarketingGlyph,
    type MarketingArtPanelProps,
    type MarketingGlyphProps,
} from "./marketing/MarketingGlyph"
export { MarketingPage, type MarketingPageProps } from "./marketing/MarketingPage"
export {
    marketingRadiusScale,
    marketingRadiusFloor,
    marketingRadiusControlFloor,
    marketingSpaceScale,
} from "./marketing/theme/feelBridge"
export {
    MarketingShell,
    marketingShellNavVariants,
    type MarketingNavLink,
    type MarketingNavMenuColumn,
    type MarketingNavMenuLink,
    type MarketingShellConfig,
    type MarketingShellFooterColumn,
    type MarketingShellFooterContent,
    type MarketingShellFooterVariant,
    type MarketingShellNavContent,
    type MarketingShellNavVariant,
    type MarketingShellProps,
} from "./marketing/MarketingShell"
export {
    MarketingNav,
    type MarketingNavContent,
    type MarketingNavProps,
    type MarketingNavVariant,
} from "./marketing/MarketingNav"
export {
    MarketingHero,
    type MarketingHeroContent,
    type MarketingHeroProps,
    type MarketingHeroVariant,
} from "./marketing/MarketingHero"
export {
    MarketingSocialProof,
    type MarketingMetric,
    type MarketingSocialProofContent,
    type MarketingSocialProofProps,
    type MarketingSocialProofVariant,
} from "./marketing/MarketingSocialProof"
export {
    MarketingFeatureGrid,
    type MarketingFeature,
    type MarketingFeatureGridContent,
    type MarketingFeatureGridProps,
    type MarketingFeatureGridVariant,
} from "./marketing/MarketingFeatureGrid"
export {
    MarketingIcon,
    isMarketingIconName,
    type MarketingIconName,
    type MarketingIconProps,
} from "./marketing/marketingIcons"
export {
    MarketingSteps,
    type MarketingStep,
    type MarketingStepsContent,
    type MarketingStepsProps,
    type MarketingStepsVariant,
} from "./marketing/MarketingSteps"
export {
    MarketingTestimonials,
    type MarketingQuote,
    type MarketingTestimonialsContent,
    type MarketingTestimonialsProps,
    type MarketingTestimonialsVariant,
} from "./marketing/MarketingTestimonials"
export {
    MarketingShowcase,
    type MarketingShowcaseContent,
    type MarketingShowcaseItem,
    type MarketingShowcaseProps,
    type MarketingShowcaseVariant,
} from "./marketing/MarketingShowcase"
export {
    MarketingPricing,
    type MarketingPricingContent,
    type MarketingPricingProps,
    type MarketingPricingTier,
    type MarketingPricingVariant,
} from "./marketing/MarketingPricing"
export {
    MarketingFaq,
    type MarketingFaqContent,
    type MarketingFaqItem,
    type MarketingFaqProps,
    type MarketingFaqVariant,
} from "./marketing/MarketingFaq"
export {
    MarketingCtaBanner,
    type MarketingCtaBannerContent,
    type MarketingCtaBannerProps,
    type MarketingCtaBannerVariant,
} from "./marketing/MarketingCtaBanner"
export {
    MarketingLeadForm,
    type MarketingContactChannel,
    type MarketingLeadCaptureContent,
    type MarketingLeadFormContent,
    type MarketingLeadFormField,
    type MarketingLeadFormProps,
    type MarketingLeadFormVariant,
} from "./marketing/MarketingLeadForm"
export {
    MarketingFooter,
    type MarketingFooterContent,
    type MarketingFooterProps,
    type MarketingFooterVariant,
} from "./marketing/MarketingFooter"
export {
    MarketingHighlights,
    type MarketingHighlight,
    type MarketingHighlightsContent,
    type MarketingHighlightsProps,
    type MarketingHighlightsVariant,
} from "./marketing/MarketingHighlights"
export {
    MarketingContentSplit,
    type MarketingContentSplitContent,
    type MarketingContentSplitProps,
    type MarketingContentSplitVariant,
} from "./marketing/MarketingContentSplit"
export {
    MarketingRichProse,
    type MarketingRichProseContent,
    type MarketingRichProseProps,
    type MarketingRichProseVariant,
} from "./marketing/MarketingRichProse"
export {
    MarketingSchedule,
    type MarketingScheduleContent,
    type MarketingScheduleDay,
    type MarketingScheduleProps,
    type MarketingScheduleSession,
    type MarketingScheduleVariant,
} from "./marketing/MarketingSchedule"
export {
    MarketingCardGrid,
    type MarketingCardGridContent,
    type MarketingCardGridItem,
    type MarketingCardGridProps,
    type MarketingCardGridVariant,
} from "./marketing/MarketingCardGrid"
export {
    MarketingCarousel,
    type MarketingCarouselContent,
    type MarketingCarouselProps,
    type MarketingCarouselSlide,
    type MarketingCarouselVariant,
} from "./marketing/MarketingCarousel"
export {
    MarketingGallery,
    type MarketingGalleryContent,
    type MarketingGalleryItem,
    type MarketingGalleryProps,
    type MarketingGalleryVariant,
} from "./marketing/MarketingGallery"
export {
    MarketingLightbox,
    type MarketingLightboxItem,
    type MarketingLightboxProps,
} from "./marketing/MarketingLightbox"
export {
    MarketingLogos,
    type MarketingLogo,
    type MarketingLogosContent,
    type MarketingLogosProps,
    type MarketingLogosVariant,
} from "./marketing/MarketingLogos"
export {
    MarketingStats,
    type MarketingStat,
    type MarketingStatsContent,
    type MarketingStatsProps,
    type MarketingStatsVariant,
} from "./marketing/MarketingStats"
export {
    MarketingComparison,
    type MarketingComparisonContent,
    type MarketingComparisonProps,
    type MarketingComparisonRow,
    type MarketingComparisonVariant,
} from "./marketing/MarketingComparison"
export {
    MarketingTeam,
    type MarketingTeamContent,
    type MarketingTeamMember,
    type MarketingTeamProps,
    type MarketingTeamVariant,
} from "./marketing/MarketingTeam"
export {
    MarketingBlogList,
    type MarketingBlogListContent,
    type MarketingBlogListProps,
    type MarketingBlogListVariant,
    type MarketingBlogPost,
} from "./marketing/MarketingBlogList"
export {
    type LandingConfig,
    type LandingSection,
    type LandingSectionType,
    type LandingStyle,
} from "./marketing/LandingConfig"
export {
    LANDING_MEDIA_DEPENDENT_VARIANTS,
    LANDING_MEDIA_EVIDENCE_VARIANTS,
    LANDING_MULTI_MEDIA_VARIANTS,
    LANDING_PAIRED_MEDIA_VARIANTS,
    LANDING_SECTION_ORDER_ROLES,
    LANDING_SECTION_VARIANTS,
    MARKETING_SHELL_FOOTER_VARIANTS,
} from "./marketing/landingVocabulary"

// Forms
export { parseSchemaForm, type ParsedSchemaForm, type SchemaFormPayload } from "./forms/parseSchemaForm"
export {
    SchemaFormRuntime,
    schemaFormTemplates,
    schemaFormWidgets,
    type SchemaFormData,
    type SchemaFormRuntimeProps,
    type SchemaFormWizardState,
    type SchemaFormWizardStep,
} from "./forms/SchemaFormRuntime"
export {
    EntityRefWidget,
    type SchemaFormQuickCreate,
    type SchemaFormReferenceOption,
    type SchemaFormReferenceResolver,
    type SchemaFormReferenceResolvers,
} from "./forms/EntityRefWidget"
export {
    applyDerivations,
    derivedUiSchemaOverlay,
    evaluateExpression,
    evaluateSummary,
    evaluateTemplate,
    mergeUiSchema,
    parseDerivedRules,
    parseSummaryConfig,
    type ApplyDerivationsResult,
    type SchemaFormDerivedRule,
    type SchemaFormSummaryColumn,
    type SchemaFormSummaryConfig,
    type SchemaFormSummaryRow,
    type SchemaFormSummaryRowConfig,
    type ScopeFrame,
} from "./forms/schemaFormDerivations"
export { SchemaFormSummaryTable, type SchemaFormSummaryTableProps } from "./forms/SchemaFormSummary"
