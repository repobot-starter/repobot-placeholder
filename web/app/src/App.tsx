import { Spinner } from "@ui"
import React, { lazy, Suspense } from "react"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import { activePack, PackKey } from "./Config/activePack"
import { ProtectedRoutes } from "./Config/ProtectedRoutes"
import { defaultRoutePath, routes } from "./Config/Router"

// Every pack page is lazy-loaded so the shipped bundle stays constant as the
// pack catalog grows: a customer's app only downloads the views it renders,
// not every template's code.
const BlankPage = lazy(() => import("./View/Blank/BlankPage"))
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
const ShopPage = lazy(() => import("./View/Shop/ShopPage"))
const TestCheckoutPage = lazy(() => import("./View/Shop/TestCheckoutPage"))
const CheckoutSuccessPage = lazy(() => import("./View/Shop/CheckoutSuccessPage"))
const CheckoutCancelledPage = lazy(() => import("./View/Shop/CheckoutCancelledPage"))
const AppLayout = lazy(() => import("./View/Navbar/AppLayout"))
const ProjectsPage = lazy(() => import("./View/QueryView/Pages/Projects/ProjectsPage"))
const UsersPage = lazy(() => import("./View/QueryView/Pages/Users/UsersPage"))

/** The active pack owns `/`; every other pack keeps its preview route below. */
const homePageByPack: Record<PackKey, () => React.ReactElement> = {
    blank: () => <BlankPage />,
    paint: () => <PaintPage />,
    pong: () => <PongPage />,
    snake: () => <SnakePage />,
    astro: () => <AstroPage />,
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
    shop: () => <ShopPage />,
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
            <Routes>
                <Route path={routes.home.path} element={<HomePage />} />
                <Route path={routes.paint.path} element={<PaintPage />} />
                <Route path={routes.pong.path} element={<PongPage />} />
                <Route path={routes.snake.path} element={<SnakePage />} />
                <Route path={routes.astro.path} element={<AstroPage />} />
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
                <Route path={routes.checkoutTest.path} element={<TestCheckoutPage />} />
                <Route path={routes.checkoutSuccess.path} element={<CheckoutSuccessPage />} />
                <Route path={routes.checkoutCancelled.path} element={<CheckoutCancelledPage />} />
                <Route path={routes.login.path} element={<LoginPage />} />
                <Route path={routes.theme.path} element={<ThemeGalleryPage />} />
                <Route element={<ProtectedRoutes />}>
                    <Route element={<AppLayout />}>
                        <Route path={routes.users.path} element={<UsersPage />} />
                        <Route path={routes.projects.path} element={<ProjectsPage />} />
                    </Route>
                </Route>
                <Route path="*" element={<Navigate to={defaultRoutePath} replace />} />
            </Routes>
        </Suspense>
    )
}
