import { Spinner } from "@ui"
import React, { lazy, Suspense } from "react"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import { activePack, PackKey } from "./Config/activePack"
import { MarketingLinkInterceptor } from "./Config/MarketingLinkInterceptor"
import { PageviewBeacon } from "./Config/PageviewBeacon"
import { ScrollReset } from "./Config/ScrollReset"
import { marketingHomePage, projectManifest } from "./Config/projectManifest"
import { ProtectedRoutes } from "./Config/ProtectedRoutes"
import { defaultRoutePath, routes } from "./Config/Router"

// Every pack page is lazy-loaded so the shipped bundle stays constant as the
// pack catalog grows: a customer's app only downloads the views it renders,
// not every template's code.
const BlankPage = lazy(() => import("./View/Blank/BlankPage"))
const AsteroidPage = lazy(() => import("./View/Games/Asteroid/AsteroidPage"))
const AstroPage = lazy(() => import("./View/Games/Astro/AstroPage"))
const BlackjackPage = lazy(() => import("./View/Games/Blackjack/BlackjackPage"))
const CabinPage = lazy(() => import("./View/Games/Cabin/CabinPage"))
const CarromPage = lazy(() => import("./View/Games/Carrom/CarromPage"))
const ChessPage = lazy(() => import("./View/Games/Chess/ChessPage"))
const CodePage = lazy(() => import("./View/Games/Code/CodePage"))
const GomokuPage = lazy(() => import("./View/Games/Gomoku/GomokuPage"))
const HanafudaPage = lazy(() => import("./View/Games/Hanafuda/HanafudaPage"))
const LudoPage = lazy(() => import("./View/Games/Ludo/LudoPage"))
const PaintPage = lazy(() => import("./View/Games/Paint/PaintPage"))
const PongPage = lazy(() => import("./View/Games/Pong/PongPage"))
const RacePage = lazy(() => import("./View/Games/Race/RacePage"))
const ChimneyPage = lazy(() => import("./View/Games/Chimney/ChimneyPage"))
const LinkPage = lazy(() => import("./View/Link/LinkPage"))
const FolioPage = lazy(() => import("./View/Folio/FolioPage"))
const ResumePage = lazy(() => import("./View/Resume/ResumePage"))
const FundIndexPage = lazy(() => import("./View/FundIndex/FundIndexPage"))
const PhotographyPage = lazy(() => import("./View/Photography/PhotographyPage"))
const PhotographyMusicPage = lazy(() => import("./View/PhotographyMusic/PhotographyMusicPage"))
const ProofingPage = lazy(() => import("./View/Photography/ProofingPage"))
const WeddingPage = lazy(() => import("./View/Wedding/WeddingPage"))
const WeddingProofingPage = lazy(() => import("./View/Wedding/ProofingPage"))
const BandPage = lazy(() => import("./View/Band/BandPage"))
const DjPage = lazy(() => import("./View/Dj/DjPage"))
const SinglePage = lazy(() => import("./View/Single/SinglePage"))
const ServicesPage = lazy(() => import("./View/Services/ServicesPage"))
const ServicesEmergencyPage = lazy(() => import("./View/ServicesEmergency/ServicesEmergencyPage"))
const ServicesRecurringPage = lazy(() => import("./View/ServicesRecurring/ServicesRecurringPage"))
const EstatePage = lazy(() => import("./View/Estate/EstatePage"))
const VowsPage = lazy(() => import("./View/Vows/VowsPage"))
const GalaPage = lazy(() => import("./View/Gala/GalaPage"))
const ReunionPage = lazy(() => import("./View/Reunion/ReunionPage"))
const CarePage = lazy(() => import("./View/Care/CarePage"))
const FitnessPage = lazy(() => import("./View/Fitness/FitnessPage"))
const YogaPage = lazy(() => import("./View/FitnessYoga/YogaPage"))
const TrainerPage = lazy(() => import("./View/FitnessTrainer/TrainerPage"))
const ChurchPage = lazy(() => import("./View/Church/ChurchPage"))
const NonprofitPage = lazy(() => import("./View/Nonprofit/NonprofitPage"))
const CommunityPage = lazy(() => import("./View/Community/CommunityPage"))
const LaunchPage = lazy(() => import("./View/Launch/LaunchPage"))
const BlogPage = lazy(() => import("./View/Blog/BlogPage"))
const MenuPage = lazy(() => import("./View/Menu/MenuPage"))
const FlashPage = lazy(() => import("./View/Flash/FlashPage"))
const QuizPage = lazy(() => import("./View/Quiz/QuizPage"))
const SugarPage = lazy(() => import("./View/Sugar/SugarPage"))
const TradePage = lazy(() => import("./View/Trade/TradePage"))
const SalonPage = lazy(() => import("./View/Games/Salon/SalonPage"))
const SitterPage = lazy(() => import("./View/Games/Sitter/SitterPage"))
const SnakePage = lazy(() => import("./View/Games/Snake/SnakePage"))
const StylePage = lazy(() => import("./View/Games/Style/StylePage"))
const TawlaPage = lazy(() => import("./View/Games/Tawla/TawlaPage"))
const TrucoPage = lazy(() => import("./View/Games/Truco/TrucoPage"))
const AiChatPage = lazy(() => import("./View/AiChat/AiChatPage"))
const AiTalkPage = lazy(() => import("./View/AiTalk/AiTalkPage"))
const LoginPage = lazy(() => import("./View/LoginPage/LoginPage"))
const ThemeGalleryPage = lazy(() => import("./View/ThemeGallery/ThemeGalleryPage"))
const MarketingGalleryPage = lazy(() => import("./View/MarketingGallery/MarketingGalleryPage"))
const AppChromeGalleryPage = lazy(() => import("./View/AppChromeGallery/AppChromeGalleryPage"))
const OrdersExemplarPage = lazy(() => import("./View/OrdersExemplar/OrdersExemplarPage"))
const LandingKernelPage = lazy(() => import("./View/Landing/LandingPage"))
const ShopPage = lazy(() => import("./View/Shop/ShopPage"))
const InvoicePage = lazy(() => import("./View/Invoices/InvoicePage"))
const PdfGeneratorPage = lazy(() => import("./View/PdfGenerator/PdfGeneratorPage"))
const CheckoutPage = lazy(() => import("./View/Checkout/CheckoutPage"))
const InterpreterPage = lazy(() => import("./View/Interpreter/InterpreterPage"))
const EntryStandalonePage = lazy(() => import("./View/EntryRecords/EntryStandalonePage"))
const EntryEnterPage = lazy(() => import("./View/EntryRecords/EntryEnterPage"))
const QuickBooksSyncPage = lazy(() => import("./View/QuickBooksSync/QuickBooksSyncPage"))
const AgentStandalonePage = lazy(() => import("./View/AgentDesk/AgentStandalonePage"))
const FilesPage = lazy(() => import("./View/Files/FilesPage"))
const ImagesPage = lazy(() => import("./View/Images/ImagesPage"))
const TestCheckoutPage = lazy(() => import("./View/Shop/TestCheckoutPage"))
const CheckoutSuccessPage = lazy(() => import("./View/Shop/CheckoutSuccessPage"))
const CheckoutCancelledPage = lazy(() => import("./View/Shop/CheckoutCancelledPage"))
const SubscribePage = lazy(() => import("./View/Billing/SubscribePage"))
const TestBillingPage = lazy(() => import("./View/Billing/TestBillingPage"))
const AppLayout = lazy(() => import("./View/Navbar/AppLayout"))
// <ia:exemplar-imports> kernel Projects/Users exemplar — scaffold-ia removes
// this block when the manifest declares its own dashboard destinations.
const ProjectsPage = lazy(() => import("./View/QueryView/Pages/Projects/ProjectsPage"))
const UsersPage = lazy(() => import("./View/QueryView/Pages/Users/UsersPage"))
// </ia:exemplar-imports>
const SettingsPage = lazy(() => import("./View/Settings/SettingsPage"))
const SitePage = lazy(() => import("./View/Site/SitePage"))
// <ia:page-imports> managed by scripts/scaffold-ia.mjs — do not edit inside.
// </ia:page-imports>

/** The active pack owns `/`; every other pack keeps its preview route below. */
const homePageByPack: Record<PackKey, () => React.ReactElement> = {
    blank: () => <BlankPage />,
    paint: () => <PaintPage />,
    pong: () => <PongPage />,
    snake: () => <SnakePage />,
    astro: () => <AstroPage />,
    asteroid: () => <AsteroidPage />,
    blackjack: () => <BlackjackPage />,
    chess: () => <ChessPage />,
    style: () => <StylePage />,
    cabin: () => <CabinPage />,
    salon: () => <SalonPage />,
    sitter: () => <SitterPage />,
    code: () => <CodePage />,
    ludo: () => <LudoPage />,
    gomoku: () => <GomokuPage />,
    tawla: () => <TawlaPage />,
    carrom: () => <CarromPage />,
    hanafuda: () => <HanafudaPage />,
    truco: () => <TrucoPage />,
    race: () => <RacePage />,
    chimney: () => <ChimneyPage />,
    link: () => <LinkPage />,
    folio: () => <FolioPage />,
    resume: () => <ResumePage />,
    "fund-index": () => <FundIndexPage />,
    photography: () => <PhotographyPage />,
    "photography-music": () => <PhotographyMusicPage />,
    wedding: () => <WeddingPage />,
    band: () => <BandPage />,
    dj: () => <DjPage />,
    single: () => <SinglePage />,
    services: () => <ServicesPage />,
    "services-emergency": () => <ServicesEmergencyPage />,
    "services-recurring": () => <ServicesRecurringPage />,
    estate: () => <EstatePage />,
    vows: () => <VowsPage />,
    gala: () => <GalaPage />,
    reunion: () => <ReunionPage />,
    fitness: () => <FitnessPage />,
    "fitness-yoga": () => <YogaPage />,
    "fitness-trainer": () => <TrainerPage />,
    care: () => <CarePage />,
    church: () => <ChurchPage />,
    nonprofit: () => <NonprofitPage />,
    community: () => <CommunityPage />,
    launch: () => <LaunchPage />,
    blog: () => <BlogPage />,
    menu: () => <MenuPage />,
    flash: () => <FlashPage />,
    quiz: () => <QuizPage />,
    sugar: () => <SugarPage />,
    trade: () => <TradePage />,
    chat: () => <AiChatPage />,
    talk: () => <AiTalkPage />,
    // The auth pack's product IS the kernel's account flows: land on login.
    auth: () => <NavigateToLogin />,
    // The saas pack's home is its manifest landing page (repobot.project.json,
    // stamped by compose) — the manifest check above owns `/`. This entry is
    // the fallback for a checkout without the manifest (e.g. the kernel repo).
    saas: () => <NavigateToLogin />,
    // Like saas: the accounting pack's home is its manifest landing page
    // (Ledgerly marketing site); this is the no-manifest fallback.
    accounting: () => <NavigateToLogin />,
    // Like saas: the cfo pack's home is its manifest landing page (Clearline
    // marketing site); this is the no-manifest fallback.
    cfo: () => <NavigateToLogin />,
    // Like saas: the credit pack's home is its manifest landing page (Docket
    // marketing site); this is the no-manifest fallback.
    credit: () => <NavigateToLogin />,
    // Like saas: the flow pack's home is its manifest landing page (Flowline
    // marketing site); this is the no-manifest fallback.
    flow: () => <NavigateToLogin />,
    // Like saas: the pitch pack's home is its manifest landing page (Deckline
    // marketing site); this is the no-manifest fallback.
    pitch: () => <NavigateToLogin />,
    shop: () => <ShopPage />,
    invoice: () => <InvoicePage />,
    // Feature packs (packs/README.md `intent: "feature"`): one-page tools
    // that stand alone as a project and can also be added into an existing
    // one, where they keep the preview route below instead of owning `/`.
    pdf: () => <PdfGeneratorPage />,
    checkout: () => <CheckoutPage />,
    interpret: () => <InterpreterPage />,
    // Capture Data has no landing page by design (its manifest ships zero
    // marketing pages): the home route sessions the visitor (anonymous when
    // signed out) and lands on /records with the entry form open.
    entry: () => <EntryEnterPage />,
    quickbooks: () => <QuickBooksSyncPage />,
    agent: () => <AgentStandalonePage />,
    files: () => <FilesPage />,
    images: () => <ImagesPage />,
}

/**
 * The auth pack's home redirect. Auth emails and OAuth land on the site root
 * carrying credentials in the URL (`#access_token=...`), and the auth client
 * parses them from the URL asynchronously — so the redirect must carry
 * search + hash along to /login, or signing in via an email link silently
 * drops the session.
 */
function NavigateToLogin(): React.ReactElement {
    const location = useLocation()
    return (
        <Navigate
            to={{ pathname: routes.login.path, search: location.search, hash: location.hash }}
            replace
        />
    )
}

function HomePage(): React.ReactElement {
    // A manifest marketing page at "/" (repobot.project.json) outranks the
    // pack map: projects provisioned with an IA get their marketing home even
    // on the blank pack, while pack-owned homes keep working without one.
    const manifestHome = marketingHomePage()
    if (manifestHome !== undefined) {
        return <SitePage pageId={manifestHome.id} />
    }
    return (homePageByPack[activePack.key] ?? homePageByPack.blank)()
}

function RouteFallback(): React.ReactElement {
    return (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "40vh" }}>
            <Spinner size="lg" />
        </div>
    )
}

export default function App(): React.ReactElement {
    return (
        <Suspense fallback={<RouteFallback />}>
            {/* First-party analytics: one cookieless ping per route change. */}
            <PageviewBeacon />
            {/* Marketing anchors ride the SPA router — no full reloads. */}
            <MarketingLinkInterceptor />
            {/* New pages start at the top; back/forward keep their place. */}
            <ScrollReset />
            <Routes>
                <Route path={routes.home.path} element={<HomePage />} />
                <Route path={routes.paint.path} element={<PaintPage />} />
                <Route path={routes.pong.path} element={<PongPage />} />
                <Route path={routes.snake.path} element={<SnakePage />} />
                <Route path={routes.astro.path} element={<AstroPage />} />
                <Route path={routes.asteroid.path} element={<AsteroidPage />} />
                <Route path={routes.blackjack.path} element={<BlackjackPage />} />
                <Route path={routes.chess.path} element={<ChessPage />} />
                <Route path={routes.style.path} element={<StylePage />} />
                <Route path={routes.cabin.path} element={<CabinPage />} />
                <Route path={routes.salon.path} element={<SalonPage />} />
                <Route path={routes.sitter.path} element={<SitterPage />} />
                <Route path={routes.code.path} element={<CodePage />} />
                <Route path={routes.ludo.path} element={<LudoPage />} />
                <Route path={routes.gomoku.path} element={<GomokuPage />} />
                <Route path={routes.tawla.path} element={<TawlaPage />} />
                <Route path={routes.carrom.path} element={<CarromPage />} />
                <Route path={routes.hanafuda.path} element={<HanafudaPage />} />
                <Route path={routes.truco.path} element={<TrucoPage />} />
                <Route path={routes.race.path} element={<RacePage />} />
                <Route path={routes.chimney.path} element={<ChimneyPage />} />
                <Route path={routes.link.path} element={<LinkPage />} />
                <Route path={routes.folio.path} element={<FolioPage />} />
                <Route path={routes.resume.path} element={<ResumePage />} />
                {/* The fund-index pack: the venture-funds category's dark
                    numbered-index starter — six public pages from one
                    content file. */}
                <Route path={routes.fundIndex.path} element={<FundIndexPage />} />
                <Route
                    path={`${routes.fundIndex.path}/portfolio`}
                    element={<FundIndexPage page="portfolio" />}
                />
                <Route path={`${routes.fundIndex.path}/team`} element={<FundIndexPage page="team" />} />
                <Route path={`${routes.fundIndex.path}/log`} element={<FundIndexPage page="log" />} />
                <Route path={`${routes.fundIndex.path}/contact`} element={<FundIndexPage page="contact" />} />
                <Route
                    path={`${routes.fundIndex.path}/disclosures`}
                    element={<FundIndexPage page="disclosures" />}
                />
                {activePack.key === "fund-index" ? (
                    <>
                        <Route path="/portfolio" element={<FundIndexPage page="portfolio" />} />
                        <Route path="/team" element={<FundIndexPage page="team" />} />
                        <Route path="/log" element={<FundIndexPage page="log" />} />
                        <Route path="/contact" element={<FundIndexPage page="contact" />} />
                        <Route path="/disclosures" element={<FundIndexPage page="disclosures" />} />
                    </>
                ) : null}
                {/* Photography pack pages: the preview route nests them;
                    when the pack is active they own the real paths (album
                    detail rides ?album= on the work page — see PACK.md).
                    /proof is the unlisted client proofing room: linked only
                    by the photographer, gated by an access code. */}
                <Route path={routes.photography.path} element={<PhotographyPage />} />
                <Route path={`${routes.photography.path}/work`} element={<PhotographyPage page="work" />} />
                <Route path={`${routes.photography.path}/about`} element={<PhotographyPage page="about" />} />
                <Route
                    path={`${routes.photography.path}/inquire`}
                    element={<PhotographyPage page="inquire" />}
                />
                <Route path={`${routes.photography.path}/proof`} element={<ProofingPage />} />
                {activePack.key === "photography" ? (
                    <>
                        <Route path="/work" element={<PhotographyPage page="work" />} />
                        <Route path="/about" element={<PhotographyPage page="about" />} />
                        <Route path="/inquire" element={<PhotographyPage page="inquire" />} />
                        <Route path="/proof" element={<ProofingPage />} />
                    </>
                ) : null}
                {/* The music-photography starter: same shape as photography —
                    four public pages, album detail rides ?album= on /work. */}
                <Route path={routes.photographyMusic.path} element={<PhotographyMusicPage />} />
                <Route
                    path={`${routes.photographyMusic.path}/work`}
                    element={<PhotographyMusicPage page="work" />}
                />
                <Route
                    path={`${routes.photographyMusic.path}/about`}
                    element={<PhotographyMusicPage page="about" />}
                />
                <Route
                    path={`${routes.photographyMusic.path}/book`}
                    element={<PhotographyMusicPage page="book" />}
                />
                {activePack.key === "photography-music" ? (
                    <>
                        <Route path="/work" element={<PhotographyMusicPage page="work" />} />
                        <Route path="/about" element={<PhotographyMusicPage page="about" />} />
                        <Route path="/book" element={<PhotographyMusicPage page="book" />} />
                    </>
                ) : null}
                {/* The wedding pack: same shape as photography — five public
                    pages (wedding detail rides ?wedding= on /weddings) plus
                    the unlisted, code-gated /proof client proofing room. */}
                <Route path={routes.wedding.path} element={<WeddingPage />} />
                <Route path={`${routes.wedding.path}/weddings`} element={<WeddingPage page="weddings" />} />
                <Route path={`${routes.wedding.path}/packages`} element={<WeddingPage page="packages" />} />
                <Route path={`${routes.wedding.path}/about`} element={<WeddingPage page="about" />} />
                <Route path={`${routes.wedding.path}/inquire`} element={<WeddingPage page="inquire" />} />
                <Route path={`${routes.wedding.path}/proof`} element={<WeddingProofingPage />} />
                {activePack.key === "wedding" ? (
                    <>
                        <Route path="/weddings" element={<WeddingPage page="weddings" />} />
                        <Route path="/packages" element={<WeddingPage page="packages" />} />
                        <Route path="/about" element={<WeddingPage page="about" />} />
                        <Route path="/inquire" element={<WeddingPage page="inquire" />} />
                        <Route path="/proof" element={<WeddingProofingPage />} />
                    </>
                ) : null}
                {/* The band pack (music category): four public pages — the
                    doc-aware home plus the bespoke tour / music / press
                    surfaces (computed tour split, hybrid audio players,
                    downloadable EPK — see packs/band/PACK.md). */}
                <Route path={routes.band.path} element={<BandPage />} />
                <Route path={`${routes.band.path}/tour`} element={<BandPage page="tour" />} />
                <Route path={`${routes.band.path}/music`} element={<BandPage page="music" />} />
                <Route path={`${routes.band.path}/press`} element={<BandPage page="press" />} />
                {activePack.key === "band" ? (
                    <>
                        <Route path="/tour" element={<BandPage page="tour" />} />
                        <Route path="/music" element={<BandPage page="music" />} />
                        <Route path="/press" element={<BandPage page="press" />} />
                    </>
                ) : null}
                {/* The dj pack: home, the mixes shelf, computed dates, and
                    the booking form with the tech-rider ask. */}
                <Route path={routes.dj.path} element={<DjPage />} />
                <Route path={`${routes.dj.path}/mixes`} element={<DjPage page="mixes" />} />
                <Route path={`${routes.dj.path}/dates`} element={<DjPage page="dates" />} />
                <Route path={`${routes.dj.path}/book`} element={<DjPage page="book" />} />
                {activePack.key === "dj" ? (
                    <>
                        <Route path="/mixes" element={<DjPage page="mixes" />} />
                        <Route path="/dates" element={<DjPage page="dates" />} />
                        <Route path="/book" element={<DjPage page="book" />} />
                    </>
                ) : null}
                {/* The single pack: a release one-pager — the countdown owns
                    the top and flips to "Out now" after the date. */}
                <Route path={routes.single.path} element={<SinglePage />} />
                {/* The services pack: five public pages. The pack key and
                    its services-list page share a name, so the preview root
                    doubles as the list when the pack is active — nav links
                    point at /services expecting the list, not a second
                    home. */}
                <Route
                    path={routes.services.path}
                    element={
                        activePack.key === "services" ? (
                            <ServicesPage page="services" />
                        ) : activePack.key === "services-emergency" ? (
                            // The emergency pack also owns a /services page
                            // (its price list) when it runs the site.
                            <ServicesEmergencyPage page="services" />
                        ) : (
                            <ServicesPage />
                        )
                    }
                />
                <Route path={`${routes.services.path}/projects`} element={<ServicesPage page="projects" />} />
                <Route path={`${routes.services.path}/services`} element={<ServicesPage page="services" />} />
                <Route path={`${routes.services.path}/about`} element={<ServicesPage page="about" />} />
                <Route path={`${routes.services.path}/quote`} element={<ServicesPage page="quote" />} />
                {activePack.key === "services" ? (
                    <>
                        <Route path="/projects" element={<ServicesPage page="projects" />} />
                        <Route path="/about" element={<ServicesPage page="about" />} />
                        <Route path="/quote" element={<ServicesPage page="quote" />} />
                    </>
                ) : null}
                {/* The emergency-services pack: four public pages (the
                    services category's dispatch shape). Its /services page
                    when active is handled above, on the shared route. */}
                <Route path={routes.emergency.path} element={<ServicesEmergencyPage />} />
                <Route
                    path={`${routes.emergency.path}/services`}
                    element={<ServicesEmergencyPage page="services" />}
                />
                <Route
                    path={`${routes.emergency.path}/about`}
                    element={<ServicesEmergencyPage page="about" />}
                />
                <Route
                    path={`${routes.emergency.path}/request`}
                    element={<ServicesEmergencyPage page="request" />}
                />
                {activePack.key === "services-emergency" ? (
                    <>
                        <Route path="/about" element={<ServicesEmergencyPage page="about" />} />
                        <Route path="/request" element={<ServicesEmergencyPage page="request" />} />
                    </>
                ) : null}
                {/* The recurring-services pack: four public pages (the
                    services category's recurring/booking shape). */}
                <Route path={routes.cleaning.path} element={<ServicesRecurringPage />} />
                <Route
                    path={`${routes.cleaning.path}/plans`}
                    element={<ServicesRecurringPage page="plans" />}
                />
                <Route
                    path={`${routes.cleaning.path}/about`}
                    element={<ServicesRecurringPage page="about" />}
                />
                <Route
                    path={`${routes.cleaning.path}/book`}
                    element={<ServicesRecurringPage page="book" />}
                />
                {activePack.key === "services-recurring" ? (
                    <>
                        <Route path="/plans" element={<ServicesRecurringPage page="plans" />} />
                        <Route path="/about" element={<ServicesRecurringPage page="about" />} />
                        <Route path="/book" element={<ServicesRecurringPage page="book" />} />
                    </>
                ) : null}
                {/* The estate pack: five public pages (the real-estate
                    category's agent starter). */}
                <Route path={routes.estate.path} element={<EstatePage />} />
                <Route path={`${routes.estate.path}/listings`} element={<EstatePage page="listings" />} />
                <Route
                    path={`${routes.estate.path}/neighborhoods`}
                    element={<EstatePage page="neighborhoods" />}
                />
                <Route path={`${routes.estate.path}/about`} element={<EstatePage page="about" />} />
                <Route path={`${routes.estate.path}/contact`} element={<EstatePage page="contact" />} />
                {activePack.key === "estate" ? (
                    <>
                        <Route path="/listings" element={<EstatePage page="listings" />} />
                        <Route path="/neighborhoods" element={<EstatePage page="neighborhoods" />} />
                        <Route path="/about" element={<EstatePage page="about" />} />
                        <Route path="/contact" element={<EstatePage page="contact" />} />
                    </>
                ) : null}
                {/* The vows pack: six public pages (the weddings-and-events
                    category's classic wedding starter). */}
                <Route path={routes.vows.path} element={<VowsPage />} />
                <Route path={`${routes.vows.path}/story`} element={<VowsPage page="story" />} />
                <Route path={`${routes.vows.path}/schedule`} element={<VowsPage page="schedule" />} />
                <Route path={`${routes.vows.path}/travel`} element={<VowsPage page="travel" />} />
                <Route path={`${routes.vows.path}/party`} element={<VowsPage page="party" />} />
                <Route path={`${routes.vows.path}/rsvp`} element={<VowsPage page="rsvp" />} />
                {activePack.key === "vows" ? (
                    <>
                        <Route path="/story" element={<VowsPage page="story" />} />
                        <Route path="/schedule" element={<VowsPage page="schedule" />} />
                        <Route path="/travel" element={<VowsPage page="travel" />} />
                        <Route path="/party" element={<VowsPage page="party" />} />
                        <Route path="/rsvp" element={<VowsPage page="rsvp" />} />
                    </>
                ) : null}
                {/* The gala pack: one evening scroll plus the reply card
                    (the weddings-and-events category's black-tie starter). */}
                <Route path={routes.gala.path} element={<GalaPage />} />
                <Route path={`${routes.gala.path}/rsvp`} element={<GalaPage page="rsvp" />} />
                {activePack.key === "gala" ? <Route path="/rsvp" element={<GalaPage page="rsvp" />} /> : null}
                {/* The reunion pack: the weekend page, the memory wall, and
                    the head count (the weddings-and-events category's
                    family-gathering starter). */}
                <Route path={routes.reunion.path} element={<ReunionPage />} />
                <Route path={`${routes.reunion.path}/memories`} element={<ReunionPage page="memories" />} />
                <Route path={`${routes.reunion.path}/rsvp`} element={<ReunionPage page="rsvp" />} />
                {activePack.key === "reunion" ? (
                    <>
                        <Route path="/memories" element={<ReunionPage page="memories" />} />
                        <Route path="/rsvp" element={<ReunionPage page="rsvp" />} />
                    </>
                ) : null}
                {/* The care pack: five public pages (the healthcare
                    category's primary-care starter). */}
                <Route path={routes.care.path} element={<CarePage />} />
                <Route path={`${routes.care.path}/providers`} element={<CarePage page="providers" />} />
                <Route path={`${routes.care.path}/what-we-treat`} element={<CarePage page="services" />} />
                <Route path={`${routes.care.path}/new-patients`} element={<CarePage page="new-patients" />} />
                <Route path={`${routes.care.path}/book`} element={<CarePage page="book" />} />
                {activePack.key === "care" ? (
                    <>
                        <Route path="/providers" element={<CarePage page="providers" />} />
                        {/* NOT /services: that path is the services pack's
                            preview route, which every checkout keeps. */}
                        <Route path="/what-we-treat" element={<CarePage page="services" />} />
                        <Route path="/new-patients" element={<CarePage page="new-patients" />} />
                        <Route path="/book" element={<CarePage page="book" />} />
                    </>
                ) : null}
                {/* The fitness pack: five public pages (the fitness
                    category's strength-club starter). */}
                <Route path={routes.fitness.path} element={<FitnessPage />} />
                <Route path={`${routes.fitness.path}/schedule`} element={<FitnessPage page="schedule" />} />
                <Route path={`${routes.fitness.path}/coaches`} element={<FitnessPage page="coaches" />} />
                <Route path={`${routes.fitness.path}/pricing`} element={<FitnessPage page="pricing" />} />
                <Route path={`${routes.fitness.path}/trial`} element={<FitnessPage page="trial" />} />
                {activePack.key === "fitness" ? (
                    <>
                        <Route path="/schedule" element={<FitnessPage page="schedule" />} />
                        <Route path="/coaches" element={<FitnessPage page="coaches" />} />
                        <Route path="/pricing" element={<FitnessPage page="pricing" />} />
                        <Route path="/trial" element={<FitnessPage page="trial" />} />
                    </>
                ) : null}
                {/* The fitness-yoga pack: five public pages (the fitness
                    category's yoga & pilates starter). */}
                <Route path={routes.yoga.path} element={<YogaPage />} />
                <Route path={`${routes.yoga.path}/schedule`} element={<YogaPage page="schedule" />} />
                <Route path={`${routes.yoga.path}/teachers`} element={<YogaPage page="teachers" />} />
                <Route path={`${routes.yoga.path}/pricing`} element={<YogaPage page="pricing" />} />
                <Route path={`${routes.yoga.path}/begin`} element={<YogaPage page="begin" />} />
                {activePack.key === "fitness-yoga" ? (
                    <>
                        <Route path="/schedule" element={<YogaPage page="schedule" />} />
                        <Route path="/teachers" element={<YogaPage page="teachers" />} />
                        <Route path="/pricing" element={<YogaPage page="pricing" />} />
                        <Route path="/begin" element={<YogaPage page="begin" />} />
                    </>
                ) : null}
                {/* The fitness-trainer pack: four public pages (the fitness
                    category's personal-trainer starter). */}
                <Route path={routes.trainer.path} element={<TrainerPage />} />
                <Route path={`${routes.trainer.path}/programs`} element={<TrainerPage page="programs" />} />
                <Route path={`${routes.trainer.path}/results`} element={<TrainerPage page="results" />} />
                <Route path={`${routes.trainer.path}/apply`} element={<TrainerPage page="apply" />} />
                {activePack.key === "fitness-trainer" ? (
                    <>
                        <Route path="/programs" element={<TrainerPage page="programs" />} />
                        <Route path="/results" element={<TrainerPage page="results" />} />
                        <Route path="/apply" element={<TrainerPage page="apply" />} />
                    </>
                ) : null}
                {/* The church pack: five public pages (the community
                    category's church starter). The Give CTA is an external
                    link, so it needs no route. */}
                <Route path={routes.church.path} element={<ChurchPage />} />
                <Route path={`${routes.church.path}/visit`} element={<ChurchPage page="visit" />} />
                <Route path={`${routes.church.path}/ministries`} element={<ChurchPage page="ministries" />} />
                <Route path={`${routes.church.path}/sermons`} element={<ChurchPage page="sermons" />} />
                <Route path={`${routes.church.path}/events`} element={<ChurchPage page="events" />} />
                {activePack.key === "church" ? (
                    <>
                        <Route path="/visit" element={<ChurchPage page="visit" />} />
                        <Route path="/ministries" element={<ChurchPage page="ministries" />} />
                        <Route path="/sermons" element={<ChurchPage page="sermons" />} />
                        <Route path="/events" element={<ChurchPage page="events" />} />
                    </>
                ) : null}
                {/* The nonprofit pack: four public pages (the community
                    category's charity starter). Donate is an external link,
                    so it needs no route. */}
                <Route path={routes.nonprofit.path} element={<NonprofitPage />} />
                <Route
                    path={`${routes.nonprofit.path}/programs`}
                    element={<NonprofitPage page="programs" />}
                />
                <Route path={`${routes.nonprofit.path}/impact`} element={<NonprofitPage page="impact" />} />
                <Route
                    path={`${routes.nonprofit.path}/volunteer`}
                    element={<NonprofitPage page="volunteer" />}
                />
                {activePack.key === "nonprofit" ? (
                    <>
                        <Route path="/programs" element={<NonprofitPage page="programs" />} />
                        <Route path="/impact" element={<NonprofitPage page="impact" />} />
                        <Route path="/volunteer" element={<NonprofitPage page="volunteer" />} />
                    </>
                ) : null}
                {/* The community pack: four public pages (the community
                    category's neighborhood-association starter). */}
                <Route path={routes.community.path} element={<CommunityPage />} />
                <Route path={`${routes.community.path}/events`} element={<CommunityPage page="events" />} />
                <Route path={`${routes.community.path}/join`} element={<CommunityPage page="join" />} />
                <Route path={`${routes.community.path}/about`} element={<CommunityPage page="about" />} />
                {activePack.key === "community" ? (
                    <>
                        <Route path="/events" element={<CommunityPage page="events" />} />
                        <Route path="/join" element={<CommunityPage page="join" />} />
                        <Route path="/about" element={<CommunityPage page="about" />} />
                    </>
                ) : null}
                <Route path={routes.launch.path} element={<LaunchPage />} />
                <Route path={routes.blog.path} element={<BlogPage />} />
                <Route path={routes.menu.path} element={<MenuPage />} />
                <Route path={routes.flash.path} element={<FlashPage />} />
                <Route path={routes.quiz.path} element={<QuizPage />} />
                <Route path={routes.sugar.path} element={<SugarPage />} />
                <Route path={routes.trade.path} element={<TradePage />} />
                <Route path={routes.chat.path} element={<AiChatPage />} />
                <Route path={routes.talk.path} element={<AiTalkPage />} />
                <Route path={routes.shop.path} element={<ShopPage />} />
                <Route path={routes.invoice.path} element={<InvoicePage />} />
                {/* Feature pack preview routes: always mounted, so adding a
                    feature to an existing project is exposure, not code
                    movement (packs/README.md `intent: "feature"`). */}
                <Route path={routes.pdf.path} element={<PdfGeneratorPage />} />
                <Route path={routes.checkout.path} element={<CheckoutPage />} />
                <Route path={routes.interpret.path} element={<InterpreterPage />} />
                <Route path={routes.entry.path} element={<EntryStandalonePage />} />
                <Route path={routes.quickbooks.path} element={<QuickBooksSyncPage />} />
                <Route path={routes.agent.path} element={<AgentStandalonePage />} />
                <Route path={routes.files.path} element={<FilesPage />} />
                <Route path={routes.images.path} element={<ImagesPage />} />
                <Route path={routes.checkoutTest.path} element={<TestCheckoutPage />} />
                <Route path={routes.checkoutSuccess.path} element={<CheckoutSuccessPage />} />
                <Route path={routes.checkoutCancelled.path} element={<CheckoutCancelledPage />} />
                {/* Subscription journey: these gate on auth in-page (signed-out
                    visitors go to sign-up / sign-in) rather than ProtectedRoutes,
                    because a pricing-page CTA must welcome new visitors. */}
                <Route path={routes.subscribe.path} element={<SubscribePage />} />
                <Route path={routes.billingTest.path} element={<TestBillingPage />} />
                {/* All auth entry points render the same surface; LoginPage
                    reads the pathname to pick the starting view. */}
                <Route path={routes.login.path} element={<LoginPage />} />
                <Route path={routes.signup.path} element={<LoginPage />} />
                <Route path={routes.forgotPassword.path} element={<LoginPage />} />
                <Route path={routes.resetPassword.path} element={<LoginPage />} />
                <Route path={routes.magicLink.path} element={<LoginPage />} />
                <Route path={routes.theme.path} element={<ThemeGalleryPage />} />
                <Route path={routes.marketingGallery.path} element={<MarketingGalleryPage />} />
                <Route path={routes.appChromeGallery.path} element={<AppChromeGalleryPage />} />
                <Route path={routes.ordersExemplar.path} element={<OrdersExemplarPage />} />
                <Route path={routes.landing.path} element={<LandingKernelPage />} />
                {/* Public marketing pages from repobot.project.json (docs/project-ia.md). */}
                {projectManifest.marketing.pages
                    .filter((page) => page.path !== "/")
                    .map((page) => (
                        <Route key={page.id} path={page.path} element={<SitePage pageId={page.id} />} />
                    ))}
                <Route element={<ProtectedRoutes />}>
                    <Route element={<AppLayout />}>
                        {/* <ia:exemplar-routes> kernel Projects/Users exemplar —
                            scaffold-ia removes this block when the manifest
                            declares its own dashboard destinations. */}
                        <Route path={routes.users.path} element={<UsersPage />} />
                        <Route path={routes.projects.path} element={<ProjectsPage />} />
                        {/* </ia:exemplar-routes> */}
                        <Route path={routes.settings.path} element={<SettingsPage />} />
                        {/* <ia:protected-routes> managed by scripts/scaffold-ia.mjs — do not edit inside. */}
                        {/* </ia:protected-routes> */}
                    </Route>
                </Route>
                <Route path="*" element={<Navigate to={defaultRoutePath} replace />} />
            </Routes>
        </Suspense>
    )
}
