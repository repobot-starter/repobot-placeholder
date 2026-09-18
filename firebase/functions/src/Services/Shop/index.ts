// Module-level exports for the Shop domain. Cross-domain callers import
// from here, never from deep paths inside the domain.
export { shopService } from "./ShopService.js"
export { getShopProduct, shopProducts, type ShopProduct } from "./ShopCatalog.js"
