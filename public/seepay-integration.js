/* SeePay UI integration layer — does not replace or restyle the supplied UI. */
(function () {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  let routeVersion = 0;
  let storeData = null;
  let vendorData = null;
  let agentData = null;
  let adminData = null;
  let lastRouteError = "";
  let uploadImagePath = null;
  let checkoutBusy = false;

  function hashRoute() {
    return (location.hash || "#/").split("#")[1] || "/";
  }
  function normalizeRoute(route) { return (route || "/").split("?")[0]; }
  function getTenantSlug() {
    const queryShop = new URLSearchParams(location.search).get("shop");
    if (queryShop && /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(queryShop.toLowerCase())) return queryShop.toLowerCase();
    const path = location.pathname.match(/^\/store\/([a-z0-9-]+)\/?$/i);
    if (path) return path[1].toLowerCase();
    const host = location.hostname.toLowerCase().split(":")[0];
    const rootDomain = "seepay.shop";
    if (host.endsWith("." + rootDomain)) {
      const first = host.slice(0, -(rootDomain.length + 1));
      if (first && !["www", "admin", "app", "api", "agent", "register", "login", "dashboard", "store", "support", "help", "mail", "seepay", "terms", "privacy"].includes(first) && !first.includes(".")) return first;
    }
    return "";
  }
  function routeFromPathname() {
    const path = location.pathname.replace(/\/$/, "") || "/";
    const table = {
      "/login": "/login", "/register": "/register", "/forgot": "/forgot", "/forgot-password": "/forgot",
      "/reset": "/reset", "/shop": "/store", "/manage": "/vendor", "/dashboard/vendor": "/vendor",
      "/dashboard/vendor/orders": "/vendor/orders", "/dashboard/vendor/products": "/vendor/products",
      "/dashboard/vendor/products/new": "/vendor/products/new", "/dashboard/vendor/storefront": "/vendor/storefront",
      "/dashboard/vendor/payments": "/vendor/payments", "/dashboard/vendor/settings": "/vendor/settings",
      "/dashboard/agent": "/agent", "/dashboard/agent/earnings": "/agent/earnings",
      "/dashboard/agent/payouts": "/agent/earnings", "/dashboard/agent/profile": "/agent/profile",
      "/dashboard/agent/referrals": "/agent/referrals", "/admin": "/admin", "/admin/payouts": "/admin/payouts",
      "/admin/vendors": "/admin/vendors", "/admin/agents": "/admin/agents", "/admin/orders": "/admin/orders",
      "/admin/activity": "/admin/activity", "/store": "/store"
    };
    if (table[path]) return table[path];
    if (/^\/store\/[a-z0-9-]+$/i.test(path)) return "/store";
    return null;
  }
  async function api(path, options = {}) {
    const response = await fetch(path, {
      method: options.method || "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: { ...(options.body === undefined ? {} : { "Content-Type": "application/json" }), ...(options.headers || {}) },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
    let data;
    try { data = await response.json(); } catch { data = {}; }
    if (!response.ok) {
      const error = new Error(data.error || `Request failed (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return data;
  }
  function friendlyDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" });
  }
  function categoryKey(value) { return String(value || "Other").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "other"; }
  function mapProducts(rows) {
    const tints = ["tint-gold", "tint-green", "tint-sand", "tint-terra", "tint-sage"];
    const list = (rows || []).map((p, index) => {
      const category = p.category || p.cat || "Other";
      const available = p.isAvailable !== undefined ? !!p.isAvailable : p.is_available !== undefined ? !!p.is_available : true;
      return {
        id: String(p.id), name: p.name, price: Number(p.price || 0), cat: categoryKey(category), category,
        icon: "box", tint: tints[index % tints.length], stock: available ? 8 : 0,
        tag: available ? "" : "Unavailable", desc: p.description || p.desc || "",
        specs: [], imageUrl: p.imageUrl || p.image_url || null, imagePath: p.imagePath || p.image_path || null,
        isAvailable: available, sortOrder: p.sortOrder ?? p.sort_order ?? index,
      };
    });
    return list;
  }
  function setProducts(rows, { preserveDemoCats = false } = {}) {
    const list = mapProducts(rows);
    PRODUCTS.splice(0, PRODUCTS.length, ...list);
    if (!preserveDemoCats) {
      const seen = new Map();
      for (const p of list) if (!seen.has(p.cat)) seen.set(p.cat, p.category || "Other");
      CATS.splice(0, CATS.length, ["all", "All"], ...[...seen.entries()].map(([key, label]) => [key, label]));
    }
    if (list.length && !list.some((p) => p.id in S.cart)) S.cart = {};
  }
  function mapOrder(o) {
    const st = o.paymentStatus === "SUCCESS" || o.payment_status === "SUCCESS" ?
      ({ NEW: "paid", PREPARING: "preparing", READY: "ready", COMPLETED: "fulfilled", CANCELLED: "cancelled" }[(o.fulfilmentStatus || o.fulfilment_status)] || "paid") :
      ((o.paymentStatus || o.payment_status) === "PENDING" ? "pending" : "cancelled");
    const itemsRaw = o.items || o.order_items || [];
    const items = itemsRaw.map((i) => [i.name || i.name_snapshot || "Item", Number(i.qty || i.quantity || 1), Number(i.price || i.unit_price || 0)]);
    const fulfilNext = st === "paid" ? "PREPARING" : st === "preparing" ? "READY" : st === "ready" ? "COMPLETED" : "";
    return {
      id: o.reference || o.id, dbId: o.dbId || o.id, reference: o.reference || o.id, cust: o.customerName || o.customer_name || o.cust || "Customer",
      phone: o.customerPhone || o.customer_phone || o.phone || "", area: o.deliveryAddress || o.delivery_address || o.fulfilment || o.area || "Pickup",
      net: o.payNetwork || o.pay_network || o.net || "—", st, date: friendlyDate(o.createdAt || o.created_at || o.date),
      items, total: Number(o.total || o.total_amount || 0), paymentStatus: o.paymentStatus || o.payment_status,
      fulfilmentStatus: o.fulfilmentStatus || o.fulfilment_status, vendorName: o.vendorName || "—", vendorId: o.vendorId || o.vendor_id,
      platformFee: Number(o.platformFee ?? o.platform_fee ?? 0.2), vendorAmount: o.vendorAmount ?? o.vendor_amount,
      raw: o, fulfilNext,
    };
  }
  function resetLiveCollections() {
    storeData = null; vendorData = null; agentData = null; adminData = null;
    ORDERS.splice(0, ORDERS.length);
    REFERRALS.splice(0, REFERRALS.length);
    PAYOUTS.splice(0, PAYOUTS.length);
    ADMIN_VENDORS.splice(0, ADMIN_VENDORS.length);
    AGENTS.splice(0, AGENTS.length);
    ACTIVITY.splice(0, ACTIVITY.length);
  }
  function mapAdminPayout(p) {
    return { id: p.id, reference: p.reference || p.momo_reference || String(p.id).slice(0, 8).toUpperCase(), amt: Number(p.amt ?? p.amount ?? 0), amount: Number(p.amt ?? p.amount ?? 0), date: friendlyDate(p.date || p.requested_at), st: p.st || (p.status === "PENDING" ? "processing" : p.status === "PAID" ? "paid" : "rejected"), status: p.status || (p.st === "processing" ? "PENDING" : p.st === "paid" ? "PAID" : "REJECTED"), net: p.net || `${p.momoNetwork || p.momo_network || "MoMo"} ···· ${(p.phone || p.momo_number || "").slice(-4)}`, phone: p.phone || p.momo_number, momoNetwork: p.momoNetwork || p.momo_network, agentName: p.agentName || "—" };
  }
  function setAgentData(data) {
    agentData = data;
    REFERRALS.splice(0, REFERRALS.length, ...(data.referrals || []).map((r) => ({ id: r.id, v: r.name, slug: r.slug, date: friendlyDate(r.createdAt), st: r.status === "activated" ? "activated" : "pending", com: Number(r.commission || 0) })));
    PAYOUTS.splice(0, PAYOUTS.length, ...(data.payouts || []).map(mapAdminPayout));
  }
  function setAdminData(data) {
    adminData = data;
    ADMIN_VENDORS.splice(0, ADMIN_VENDORS.length, ...(data.vendors || []).map((v) => ({ ...v, joined: friendlyDate(v.joined), st: v.st || v.status || (v.active ? "active" : "registered") })));
    AGENTS.splice(0, AGENTS.length, ...(data.agents || []).map((a) => ({ ...a, st: a.st || "active" })));
    ORDERS.splice(0, ORDERS.length, ...(data.orders || []).map(mapOrder));
    PAYOUTS.splice(0, PAYOUTS.length, ...(data.payouts || []).map(mapAdminPayout));
    ACTIVITY.splice(0, ACTIVITY.length, ...(data.activity || []).map((a) => [friendlyDate(a.time), a.text, a.tag || "payment"]));
  }
  async function loadRouteData() {
    const path = normalizeRoute(hashRoute());
    const slug = getTenantSlug();
    lastRouteError = "";
    if (path === "/store" || path.startsWith("/store/")) {
      if (slug) {
        try {
          const data = await api(`/api/store?sub=${encodeURIComponent(slug)}`);
          storeData = data;
          setProducts(data.products || []);
          if (window.__previousStoreSlug !== slug) S.cart = {};
          window.__previousStoreSlug = slug;
        } catch (e) {
          storeData = null;
          setProducts([]);
          lastRouteError = e.message;
        }
      } else {
        storeData = null;
        setProducts([]);
        S.cart = {};
        if (normalizeRoute(hashRoute()) !== "/404") location.hash = "#/404";
        return;
      }
      if (path === "/store/confirmed" && window.__spOrderRef) {
        try { window.__spOrderStatus = await api(`/api/orders/${encodeURIComponent(window.__spOrderRef)}/status`); }
        catch (e) { window.__spOrderStatus = { error: e.message }; }
      }
      return;
    }
    if (path.startsWith("/vendor")) {
      try {
        const data = await api("/api/manage/overview");
        vendorData = data;
        setProducts(data.products || []);
        ORDERS.splice(0, ORDERS.length, ...(data.orders || []).map(mapOrder));
      } catch (e) {
        setProducts([]); ORDERS.splice(0, ORDERS.length);
        lastRouteError = e.message;
      }
      return;
    }
    if (path.startsWith("/agent")) {
      try { setAgentData(await api("/api/agent/overview")); }
      catch (e) { REFERRALS.splice(0,REFERRALS.length); PAYOUTS.splice(0,PAYOUTS.length); agentData=null; lastRouteError=e.message; }
      return;
    }
    if (path.startsWith("/admin")) {
      try { setAdminData(await api("/api/admin/overview")); }
      catch (e) { ADMIN_VENDORS.splice(0,ADMIN_VENDORS.length); AGENTS.splice(0,AGENTS.length); ORDERS.splice(0,ORDERS.length); PAYOUTS.splice(0,PAYOUTS.length); ACTIVITY.splice(0,ACTIVITY.length); adminData=null; lastRouteError=e.message; }
      return;
    }
    if (path === "/status/pending" && (window.__spActivationRef || sessionStorage.getItem("sp_activation_ref"))) {
      const ref = window.__spActivationRef || sessionStorage.getItem("sp_activation_ref");
      try { window.__spActivationStatus = await api(`/api/orders/${encodeURIComponent(ref)}/status`); }
      catch (e) { window.__spActivationStatus = { error: e.message }; }
    }
  }
  function selectedNetwork(name) {
    const input = document.querySelector(`input[name="${name}"]:checked`);
    const value = input?.value || input?.parentElement?.querySelector(".sb")?.textContent || "MTN";
    const v = String(value).toLowerCase();
    if (v.includes("vodafone") || v.includes("telecel") || v === "vod") return "VODAFONE";
    if (v.includes("airtel") || v.includes("at money") || v === "at") return "AIRTELTIGO";
    return "MTN";
  }
  function categoryEnum(value) {
    const v = String(value || "").toLowerCase();
    if (v.includes("food")) return "food";
    if (v.includes("fashion")) return "fashion";
    if (v.includes("repair")) return "repairs";
    if (v.includes("bakery") || v.includes("cake")) return "bakery";
    if (v.includes("beauty") || v.includes("salon")) return "salon";
    return "other";
  }
  function safeStoreLink() {
    const slug = getTenantSlug() || vendorData?.subdomain || storeData?.slug;
    if (slug) return `https://${slug}.seepay.shop`;
    return `${location.origin}/store`;
  }
  function applyStoreDom() {
    if (!storeData) return;
    const name = storeData.businessName || storeData.name || "Shop";
    const slug = storeData.slug || storeData.subdomain || "";
    $$(".store-id h2, .store-banner h1").forEach((el) => el.textContent = name);
    $$(".store-id .addr").forEach((el) => el.textContent = `${slug}.seepay.shop`);
    const initials = name.split(/\s+/).map(x => x[0]).join("").slice(0,2).toUpperCase();
    $(".store-avatar, .big-avatar, .ph-avatar").forEach((el) => {
      if (storeData.logoUrl) { const img=document.createElement("img"); img.src=storeData.logoUrl; img.alt=name+" logo"; img.style.width="100%"; img.style.height="100%"; img.style.objectFit="cover"; img.style.borderRadius="inherit"; el.replaceChildren(img); }
      else el.textContent=initials;
    });
    const about = $("#about > div:first-child p"); if (about) about.textContent = storeData.about || `${name} on SeePay.`;
    const aboutTitle = $("#about > div:first-child h3"); if (aboutTitle) aboutTitle.textContent = `About ${name}`;
    const h = $$(".store-banner .meta span");
    if (h[0]) h[0].textContent = storeData.acceptingOrders ? "Open for orders" : "Temporarily not accepting orders";
    if (h[1]) h[1].textContent = storeData.address || storeData.category || "Ghana";
    if (h[2]) h[2].textContent = "Pickup & local delivery";
    if (h[3]) h[3].textContent = "MTN MoMo · Telecel Cash · AT Money";
    // Replace example-store content with real shop/product data without touching styles.
    const firstProduct = PRODUCTS.find((product) => product.isAvailable) || PRODUCTS[0];
    const hero = $(".sf-hero > a");
    if (hero && !firstProduct) { hero.style.display="none"; }
    if (hero && firstProduct) {
      hero.style.display="";
      hero.href = `#/store/product/${firstProduct.id}`;
      const title = hero.querySelector("h2"); if (title) title.textContent = firstProduct.name;
      const summary = hero.querySelector("p"); if (summary) summary.textContent = `${firstProduct.desc || "Available now"} · ${money(firstProduct.price)}`;
      const art = hero.querySelector('div[style*="position:absolute"]');
      if (art && firstProduct.imageUrl) art.innerHTML = `<img src="${String(firstProduct.imageUrl).replace(/&/g,"&amp;").replace(/"/g,"&quot;")}" alt="${String(firstProduct.name).replace(/&/g,"&amp;").replace(/"/g,"&quot;")}" style="width:150px;height:150px;object-fit:cover;border-radius:12px">`;
    }
    const menuTitle = $(".sf-hero")?.parentElement?.querySelector("section:nth-of-type(2) h2");
    if (menuTitle) menuTitle.textContent = "Available products";
    const sidePanels = $$(".sf-hero > div .card");
    if (sidePanels[0]) { const title = sidePanels[0].querySelector("h3"); const para = sidePanels[0].querySelector("p"); if (title) title.textContent = storeData.acceptingOrders ? "Open for orders" : "Orders paused"; if (para) para.textContent = storeData.acceptingOrders ? "Choose a product and place your order using Mobile Money." : "This shop is visible, but new orders are paused for now."; }
    if (sidePanels[1]) { const para = sidePanels[1].querySelector("p"); if (para) para.textContent = "Checkout supports MTN MoMo, Telecel Cash and AT Money through Paystack."; }
    const aboutSpans = $$("#about > div:nth-child(2) span");
    const contact = aboutSpans[0];
    if (contact) contact.textContent = storeData.whatsapp ? `Orders & WhatsApp: ${storeData.whatsapp}` : "Contact the shop for order questions";
    if (aboutSpans[1]) aboutSpans[1].textContent = storeData.acceptingOrders ? "Accepting orders now" : "Orders temporarily paused";
    if (aboutSpans[2]) aboutSpans[2].textContent = storeData.address ? `Pickup / fulfilment: ${storeData.address}` : "Ask the shop about pickup and delivery";
    if (aboutSpans[3]) aboutSpans[3].textContent = "Order confirmation follows payment approval";
    const footer = $(".site-ft .wrap-w > div > span");
    if (footer) footer.textContent = `© ${new Date().getFullYear()} ${name} · ${storeData.address || "Ghana"} · ${storeData.whatsapp || "Contact the shop"}`;
    const shareButtons = $$('[data-action="share-store"]'); shareButtons.forEach((b) => b.dataset.copy = safeStoreLink());
  }
  function applyVendorDom() {
    if (!vendorData) return;
    const d = vendorData;
    $$("#set-shop-name").forEach((el) => el.value = d.name || "");
    $$("#set-shop-slug").forEach((el) => el.value = d.subdomain || "");
    $$("#set-about").forEach((el) => el.value = d.about || "");
    $$("#set-address").forEach((el) => el.value = d.address || "");
    if ($("#pw-num")) $("#pw-num").value = d.momoNumber || "";
    if ($("#pw-network")) $("#pw-network").value = d.momoNetwork || "MTN";
    if ($("#pw-name")) $("#pw-name").value = d.fullName || "";
    if ($("#set-owner-name")) $("#set-owner-name").value = d.fullName || "";
    if ($("#set-whatsapp")) $("#set-whatsapp").value = d.whatsapp || d.phone || "";
    if ($("#set-contact-email")) $("#set-contact-email").value = d.contactEmail || "";
    if ($("#account-contact-email")) $("#account-contact-email").value = d.contactEmail || "";
    $$(".store-link-live").forEach((el) => el.textContent = `https://${d.subdomain}.seepay.shop`);
    const side = $(".side-shop");
    if (side) { const b = side.querySelector("b"); const small = side.querySelector("small"); if (b) b.textContent = d.name || "Your shop"; if (small) small.textContent = `${d.subdomain || ""}.seepay.shop`; const avatar=side.querySelector(".store-avatar"); if(avatar&&d.logoUrl){const img=document.createElement("img");img.src=d.logoUrl;img.alt=(d.name||"Shop")+" logo";img.style.width="100%";img.style.height="100%";img.style.objectFit="cover";img.style.borderRadius="inherit";avatar.replaceChildren(img);} }
    const viewShop=[...document.querySelectorAll(".side-foot a")].find(a=>a.textContent.includes("View my shop"));
    if(viewShop&&d.subdomain){viewShop.href=`https://${d.subdomain}.seepay.shop`;viewShop.target="_blank";viewShop.rel="noopener noreferrer";}
    for(const [id,url,label] of [["logoUpload",d.logoUrl,"Shop logo"],["bannerUpload",d.bannerUrl,"Shop banner"]]){const box=$("#"+id);if(box&&url){box.classList.add("done");const img=document.createElement("img");img.src=url;img.alt=label;img.style.maxWidth="100%";img.style.maxHeight="120px";img.style.objectFit="cover";img.style.borderRadius="8px";box.replaceChildren(img);const note=document.createElement("div");note.className="xs";note.textContent="Uploaded · click to replace (max 3 MB)";box.append(note);}}
    // Dashboard headline and live metric cards replace illustrative demo values while preserving the design.
    const vendorHeadline = $(".page-head h1");
    if (normalizeRoute(hashRoute()) === "/vendor" && vendorHeadline) vendorHeadline.textContent = `Ayi kwan, ${d.fullName || "welcome"} 👋`;
    if (normalizeRoute(hashRoute()) === "/vendor/storefront") {
      const analytics = $("#storefrontAnalyticsCard");
      if (analytics) { const vals = analytics.querySelectorAll(".sum-row b"); if (vals[0]) vals[0].textContent = "—"; if (vals[1]) vals[1].textContent = "—"; if (vals[2]) vals[2].textContent = String((d.orders || []).filter(o => Date.now() - new Date(o.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000).length); }
    }
    const paidOrders = (d.orders || []).filter(o => (o.paymentStatus || o.payment_status) === "SUCCESS");
    const vendorAmountTotal = paidOrders.reduce((sum, o) => sum + Number(o.vendorAmount ?? o.vendor_amount ?? 0), 0);
    const feeTotal = paidOrders.reduce((sum, o) => sum + Number(o.platformFee ?? o.platform_fee ?? 0) + Number(o.raw?.paystack_fee ?? o.paystackFee ?? 0), 0);
    const paidAmountNode = $("#live-paid-amount"); if (paidAmountNode) paidAmountNode.textContent = money(vendorAmountTotal);
    const paidFeesNode = $("#live-paid-fees"); if (paidFeesNode) paidFeesNode.textContent = money(feeTotal);
    if (normalizeRoute(hashRoute()) === "/vendor") {
      const vals = $(".stat-grid .stat .val");
      const now = new Date();
      const monthly = (d.orders || []).filter(o => o.paymentStatus === "SUCCESS" && new Date(o.createdAt).getMonth() === now.getMonth() && new Date(o.createdAt).getFullYear() === now.getFullYear()).reduce((sum,o) => sum + Number(o.total || 0), 0);
      const preparing = (d.orders || []).filter(o => ["PREPARING","READY"].includes(o.fulfilmentStatus)).length;
      if (vals[0]) vals[0].textContent = money(monthly);
      if (vals[1]) vals[1].textContent = String((d.orders || []).length);
      if (vals[2]) vals[2].textContent = String(preparing);
      if (vals[3]) vals[3].textContent = "—"; // page-view analytics are not exposed by the current backend.
    }
  }
  function applyAgentDom() {
    if (!agentData) return;
    const d = agentData;
    const code = d.agent?.referralCode || "";
    const referralLabels = $(".ref-code b");
    if (referralLabels[0]) referralLabels[0].textContent = code || "No referral code assigned";
    if (referralLabels[1]) referralLabels[1].textContent = code ? `seepay.shop/register?ref=${code}` : "Referral link unavailable";
    $("[data-action='copy']").forEach((el) => {
      const label = (el.dataset.label || "").toLowerCase();
      if (label.includes("code")) el.dataset.copy = code;
      if (label.includes("referral") || label.includes("link")) el.dataset.copy = code ? `https://seepay.shop/register?ref=${code}` : "";
    });
    const side = $(".side-shop");
    if (side) { const title = side.querySelector("b"); const subtitle = side.querySelector("small"); if (title) title.textContent = d.profile?.fullName || "Agent workspace"; if (subtitle) subtitle.textContent = `Referral agent · ${code}`; }
    if ($("#ap-name")) $("#ap-name").value = d.profile?.fullName || "";
    if ($("#ap-phone")) $("#ap-phone").value = d.profile?.phone || "";
    if ($("#ap-email")) $("#ap-email").value = d.profile?.contactEmail || "";
    if ($("#ap-wallet")) $("#ap-wallet").value = d.agent?.momoNumber || "";
    if ($("#ap-network")) $("#ap-network").value = d.agent?.momoNetwork || "MTN";
    if (normalizeRoute(hashRoute()) === "/agent" || normalizeRoute(hashRoute()) === "/agent/earnings") {
      const vals = $$(".stat-grid .stat .val");
      if (normalizeRoute(hashRoute()) === "/agent") {
        if (vals[0]) vals[0].textContent = money(d.metrics?.available || 0);
        if (vals[1]) vals[1].textContent = String(d.metrics?.activatedCount || 0);
        if (vals[2]) vals[2].textContent = String(d.metrics?.waitingCount || 0);
        if (vals[3]) vals[3].textContent = money(d.metrics?.earned || 0);
      } else {
        if (vals[0]) vals[0].textContent = money(d.metrics?.earned || 0);
        if (vals[1]) vals[1].textContent = money(d.metrics?.paid || 0);
        if (vals[2]) vals[2].textContent = money(d.metrics?.available || 0);
      }
    }
  }
  function applyAdminDom() {
    if (!adminData) return;
    const side = $(".side-shop");
    if (side) { const title = side.querySelector("b"); const subtitle = side.querySelector("small"); if (title) title.textContent = "SeePay Admin"; if (subtitle) subtitle.textContent = "Platform operations"; }
    if (normalizeRoute(hashRoute()) === "/admin") {
      const vals = $$(".stat-grid .stat .val"); const m = adminData.metrics || {};
      if (vals[0]) vals[0].textContent = money(m.gmv30d || 0);
      if (vals[1]) vals[1].textContent = String(m.activeVendors || 0);
      if (vals[2]) vals[2].textContent = String(m.orders30d || 0);
      if (vals[3]) vals[3].textContent = money(m.fees30d || 0);
      const rows = Array.isArray(adminData.monthlyGmv) ? adminData.monthlyGmv : [];
      const svg = $('.chart[aria-label="Monthly GMV"]');
      if (svg && rows.length) {
        const rects = [...svg.querySelectorAll("rect")];
        const max = Math.max(1, ...rows.map(row => Number(row.value || 0)));
        rects.forEach((rect, index) => {
          const val = Number(rows[index]?.value || 0);
          const height = val ? Math.max(2, (val / max) * 144) : 2;
          rect.setAttribute("height", String(height));
          rect.setAttribute("y", String(171 - height));
          rect.setAttribute("fill", index === rows.length - 1 ? "#FFC83D" : index > 8 ? "#1F7A57" : "#DDEBE1");
          rect.setAttribute("aria-label", `${rows[index]?.month || "Month"}: ${money(val)}`);
        });
        const labels = svg.parentElement?.querySelectorAll("div span");
        if (labels?.length >= 3) { labels[0].textContent = rows[0]?.month || "Earlier"; labels[1].textContent = rows[Math.floor((rows.length - 1) / 2)]?.month || "Midpoint"; labels[2].textContent = rows.at(-1)?.month || "Latest"; }
      }
    }
  }
  function applyCheckoutDom() {
    if (!window.__spOrderRef) return;
    const status = window.__spOrderStatus?.status || "PENDING";
    const title = $(".status-card h1");
    const para = $(".status-card > p");
    const rows = $$(".status-card .sum-row");
    const success = status === "SUCCESS";
    if (title) title.textContent = success ? "Payment approved — order placed" : status === "FAILED" || status === "ABANDONED" ? "Payment did not complete" : "Waiting for payment approval";
    if (para) para.textContent = success ? `${window.__spOrderStatus.shopName || storeData?.name || "The shop"} has your order.` : status === "FAILED" || status === "ABANDONED" ? "The payment was not confirmed. Check the order status before retrying." : "Approve the Mobile Money prompt on your phone. This page checks the order status with SeePay.";
    if (rows[0]) { const b = rows[0].querySelector("b"); if (b) b.textContent = window.__spOrderRef; }
    if (rows[1]) { const b = rows[1].querySelector("b"); if (b) b.textContent = `${window.__spNetwork || "Mobile Money"} · ${window.__spWallet || "—"}`; }
    if (rows[2]) { const b = rows[2].querySelector("b"); if (b) b.textContent = money(Number(window.__spOrderStatus.total ?? window.__spOrderAmount ?? 0)); }
    const copy = $('[data-action="copy"][data-label="Order number"]'); if (copy) copy.dataset.copy = window.__spOrderRef;
    if (!success && (status === "PENDING" || !window.__spOrderStatus)) scheduleOrderPoll();
  }
  let orderPollTimer = null;
  function scheduleOrderPoll() {
    if (orderPollTimer || !window.__spOrderRef) return;
    orderPollTimer = setTimeout(async () => {
      orderPollTimer = null;
      try { window.__spOrderStatus = await api(`/api/orders/${encodeURIComponent(window.__spOrderRef)}/status`); render(); applyPostRender(); }
      catch (_) {}
      if (window.__spOrderStatus?.status === "PENDING") scheduleOrderPoll();
    }, 5000);
  }
  function applyActivationDom() {
    const data = window.__spActivationStatus;
    if (!data) return;
    const title = $(".status-card h1"); const p = $(".status-card > p");
    if (data.status === "SUCCESS") {
      if (title) title.textContent = "Your shop is live. Ayekoo! 🎉";
      if (p) p.textContent = `${data.shopName || "Your shop"} is activated and ready for orders.`;
      const link = $$('.status-card a').find(a => a.textContent.includes("See your storefront")); if (link) link.href = `https://${data.slug}.seepay.shop`;
    } else if (title && data.status && data.status !== "PENDING") {
      title.textContent = "Setup payment needs attention";
      if (p) p.textContent = "The activation payment has not been confirmed. Check the Paystack result before trying again.";
    }
  }
  function applyEditProductDom() {
    const path = normalizeRoute(hashRoute());
    if (path !== "/vendor/products/new") return;
    const p = window.__spEditingProduct;
    const title = $(".page-head h1");
    const sub = $(".page-head .sub");
    const save = $('[data-action="save-product"]');
    if (!p) {
      if (title) title.textContent = "Add a product";
      if (sub) sub.textContent = "Names, prices and photos — live in minutes.";
      if (save) save.innerHTML = `${ic("check",16)} Save product`;
      uploadImagePath = null;
      return;
    }
    if (title) title.textContent = "Edit product";
    if (sub) sub.textContent = "Update the product details shown on your storefront.";
    if (save) save.innerHTML = `${ic("check",16)} Save changes`;
    if ($("#np-name")) $("#np-name").value = p.name || "";
    if ($("#np-desc")) $("#np-desc").value = p.desc || "";
    if ($("#np-cat")) {
      const category = String(p.category || "Other");
      const select = $("#np-cat");
      if (![...select.options].some((option) => option.value === category)) select.add(new Option(category, category), 1);
      select.value = category;
    }
    if ($("#np-price")) $("#np-price").value = String(p.price ?? "");
    if ($("#np-stock")) $("#np-stock").value = p.isAvailable ? "1" : "0";
    if (p.imagePath) uploadImagePath = p.imagePath;
    const box = $("#npUpload");
    if (box && p.imageUrl) box.innerHTML = `<img src="${String(p.imageUrl).replace(/&/g,"&amp;").replace(/"/g,"&quot;")}" alt="Current product photo" style="width:100%;height:120px;object-fit:cover;border-radius:8px"><div style="margin-top:8px"><b>Current photo</b><br><span class="xs">Click to replace</span></div>`;
  }
  function applyAdminFinanceDom() {
    if (!adminData) return;
    const m = adminData.metrics || {};
    const fee = $("#admin-fees-30d"); if (fee) fee.textContent = money(Number(m.fees30d || 0));
    const setup = $("#admin-setup-fees"); if (setup) setup.textContent = "Not reported";
    const count = $("#admin-payout-count"); if (count) count.textContent = `${Number(m.pendingPayoutCount || 0)} processing`;
    const liability = $("#admin-payout-liability"); if (liability) liability.textContent = `${money(Number(m.pendingPayoutTotal || 0))} in pending agent payout requests.`;
  }
  function applyPostRender() {
    applyStoreDom(); applyVendorDom(); applyAgentDom(); applyAdminDom(); applyAdminFinanceDom(); applyEditProductDom(); applyCheckoutDom(); applyActivationDom();
    if (lastRouteError) {
      const msg = lastRouteError;
      lastRouteError = "";
      toast(msg, "err");
      if (/log in|access is required|account could not be loaded/i.test(msg) && ["/vendor","/agent","/admin"].some(prefix => normalizeRoute(hashRoute()).startsWith(prefix))) {
        setTimeout(() => { location.hash = "#/login"; }, 700);
      }
    }
  }
  async function navigateRoute() {
    const version = ++routeVersion;
    await loadRouteData();
    if (version !== routeVersion) return;
    render();
    applyPostRender();
  }
  async function boot() {
    const slug = getTenantSlug();
    const pathHash = routeFromPathname();
    // Capture referral links before resolving the pathname to a hash route.
    // This keeps /register?ref=CODE working on the first direct page load.
    const incomingReferral = new URLSearchParams(location.search).get("ref");
    if (incomingReferral) S.reg.ref = incomingReferral.trim().toUpperCase();
    if (!location.hash) {
      if (slug) history.replaceState(null, "", `${location.pathname}${location.search}#/store`);
      else if (pathHash && pathHash !== "/") history.replaceState(null, "", `${location.pathname}${location.search}#${pathHash}`);
      else if (incomingReferral) history.replaceState(null, "", `${location.pathname}${location.search}#/register`);
    }
    const activationRef = sessionStorage.getItem("sp_activation_ref");
    if (activationRef) window.__spActivationRef = activationRef;
    window.removeEventListener("hashchange", render);
    window.addEventListener("hashchange", navigateRoute);
    await navigateRoute();
    if (normalizeRoute(hashRoute()) === "/status/pending" && window.__spActivationRef) scheduleActivationPoll();
  }
  let activationPollTimer = null;
  function scheduleActivationPoll() {
    if (activationPollTimer || !window.__spActivationRef) return;
    activationPollTimer = setTimeout(async () => {
      activationPollTimer = null;
      try { window.__spActivationStatus = await api(`/api/orders/${encodeURIComponent(window.__spActivationRef)}/status`); }
      catch (_) {}
      render(); applyPostRender();
      if (window.__spActivationStatus?.status === "PENDING") scheduleActivationPoll();
    }, 5000);
  }
  function showApiError(error) { toast(error?.message || "That action could not be completed.", "err"); }
  function fulfilStatusForOrder(o) { return o?.fulfilNext || "COMPLETED"; }

  async function doLogin() {
    const phone = $("#l-email")?.value.trim(); const password = $("#l-pass")?.value || "";
    let bad = false;
    for (const [id, invalid] of [["l-email", !phone], ["l-pass", !password]]) { const f = $("#"+id); if (f) { f.closest(".field")?.classList.toggle("error", invalid); bad ||= invalid; } }
    if (bad) return toast("Enter your phone number and password", "err");
    const btn = $('[data-action="login"]'); if (btn) { btn.disabled = true; btn.dataset.oldHtml = btn.innerHTML; btn.innerHTML = '<span class="spin dark"></span> Signing in…'; }
    try {
      const data = await api("/api/auth/login", { method: "POST", body: { phone, password } });
      const route = data.redirect?.startsWith("/admin") ? "/admin" : data.redirect?.includes("agent") ? "/agent" : "/vendor";
      location.hash = `#${route}`;
      if (normalizeRoute(hashRoute()) === route) await navigateRoute();
    } catch (e) { showApiError(e); }
    finally { if (btn) { btn.disabled = false; if (btn.dataset.oldHtml) btn.innerHTML = btn.dataset.oldHtml; } }
  }
  async function doRegisterPayment() {
    const r = S.reg || {};
    const network = selectedNetwork("rnet");
    const body = {
      role: "vendor", fullName: r.name, businessName: r.shop, slug: r.sub,
      category: categoryEnum(r.cat), whatsappNumber: r.phone, momoNumber: r.phone, momoNetwork: network,
      referralCode: (r.ref || "").trim().toUpperCase(), password: $("#r-pass")?.value || r.password || "",
      contactEmail: r.email || "", website: "",
    };
    if (!body.referralCode) delete body.referralCode;
    const btn = $('[data-action="reg-pay"]'); if (btn) { btn.disabled = true; btn.dataset.oldHtml=btn.innerHTML; btn.innerHTML='<span class="spin dark"></span> Starting secure payment…'; }
    try {
      const data = await api("/api/auth/register", { method: "POST", body });
      if (data.reference) { window.__spActivationRef = data.reference; sessionStorage.setItem("sp_activation_ref", data.reference); }
      if (data.redirectUrl) { location.assign(data.redirectUrl); return; }
      if (data.redirect) { location.hash = data.redirect.includes("agent") ? "#/agent" : "#/vendor"; return; }
      throw new Error(data.message || "Registration could not be completed.");
    } catch (e) { showApiError(e); }
    finally { if (btn) { btn.disabled=false; if (btn.dataset.oldHtml) btn.innerHTML=btn.dataset.oldHtml; } }
  }
  async function doCheckout(button) {
    if (checkoutBusy) return;
    if (!getTenantSlug() || !storeData) return toast("This is a storefront preview. Open the vendor’s real shop link to place an order.", "err");
    if (!storeData.active) return toast("This shop is not active yet and cannot accept orders.", "err");
    if (!storeData.acceptingOrders) return toast("This shop has paused orders for now. Please check back later.", "err");
    const name = $("#c-name")?.value.trim() || "";
    const phone = $("#c-phone")?.value.trim() || "";
    const momo = $("#c-wallet")?.value.trim() || "";
    const fulfilment = document.querySelector('input[name="ful"]:checked')?.value || "PICKUP";
    const address = $("#c-address")?.value.trim() || "";
    let bad = false;
    [["c-name", !name], ["c-phone", !/^0\d{9}$/.test(phone.replace(/\s/g,""))], ["c-wallet", !/^0\d{9}$/.test(momo.replace(/\s/g,""))], ["c-address", fulfilment === "DELIVERY" && !address]].forEach(([id, invalid]) => { const f=$("#"+id); if (f) { f.closest(".field")?.classList.toggle("error", !!invalid); bad ||= !!invalid; } });
    if (bad) return toast("Please fix the highlighted checkout details.", "err");
    const network = selectedNetwork("paynet");
    const items = Object.entries(S.cart).map(([productId, quantity]) => ({ productId, quantity: Number(quantity) })).filter(x => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(x.productId));
    if (!items.length) return toast("Your cart has no live shop products. Refresh the storefront and try again.", "err");
    checkoutBusy = true;
    if (button) { button.disabled = true; button.dataset.oldHtml=button.innerHTML; button.innerHTML='<span class="spin dark"></span> Sending payment request…'; }
    try {
      const data = await api("/api/checkout", { method: "POST", body: { slug: storeData.slug, customerName: name, customerPhone: phone, fulfilment, deliveryAddress: address, note: $("#c-note")?.value.trim() || "", items, momoNetwork: network, momoNumber: momo, website: "" } });
      window.__spOrderRef = data.reference;
      window.__spOrderAmount = data.total ?? cartSubtotal();
      window.__spNetwork = network === "VODAFONE" ? "Telecel Cash" : network === "AIRTELTIGO" ? "AT Money" : "MTN MoMo";
      window.__spWallet = momo;
      window.__spOrderStatus = { status: "PENDING", total: window.__spOrderAmount, shopName: storeData.name };
      sessionStorage.setItem("sp_last_order_ref", data.reference);
      S.cart = {};
      location.hash = "#/store/confirmed";
    } catch (e) { showApiError(e); }
    finally { checkoutBusy = false; if (button) { button.disabled=false; if (button.dataset.oldHtml) button.innerHTML=button.dataset.oldHtml; } }
  }
  async function saveProduct() {
    const name=$("#np-name")?.value.trim()||"", desc=$("#np-desc")?.value.trim()||"", category=$("#np-cat")?.value||"";
    const price=Number($("#np-price")?.value), stock=Number($("#np-stock")?.value);
    let bad=false;
    [["np-name",!name],["np-desc",desc.length>200||!desc],["np-cat",!category],["np-price",!(price>=0.5&&price<=50000)],["np-stock",!Number.isFinite(stock)||stock<0]].forEach(([id,invalid])=>{const f=$("#"+id);if(f){f.closest(".field")?.classList.toggle("error",!!invalid);bad ||= !!invalid;}});
    if(bad) return toast("Please complete the highlighted fields.","err");
    const btn=$('[data-action="save-product"]'); if(btn){btn.disabled=true;btn.dataset.oldHtml=btn.innerHTML;btn.innerHTML='<span class="spin dark"></span> Saving…';}
    try {
      const editing = window.__spEditingProduct || null;
      await api("/api/manage/product",{method:"POST",body:{...(editing ? {id:editing.id} : {}),name,description:desc,category,price,imagePath:uploadImagePath,isAvailable:stock>0}});
      uploadImagePath=null; window.__spEditingProduct=null; await navigateRouteFor("/vendor/products"); toast(editing ? "Product updated." : "Product saved.");
    } catch(e){showApiError(e);}
    finally{if(btn){btn.disabled=false;if(btn.dataset.oldHtml)btn.innerHTML=btn.dataset.oldHtml;}}
  }
  async function navigateRouteFor(path) { history.replaceState(null,"",`${location.pathname}${location.search}#${path}`); await navigateRoute(); }
  async function uploadProductImage(file, kind = "product") {
    if (!file || !file.type.startsWith("image/")) return toast("Choose a valid image file.","err");
    if (file.size > 3_000_000) return toast("Each image must be no larger than 3 MB.","err");
    if (kind !== "product" && !vendorData) return toast("Shop profile has not loaded yet. Refresh and try again.","err");
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas"); canvas.width=Math.max(1,Math.round(bitmap.width*scale)); canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      const ctx=canvas.getContext("2d"); if(!ctx) throw new Error("Photo conversion is unavailable."); ctx.drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close?.();
      let blob = await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",0.84));
      if(!blob) throw new Error("The photo could not be processed.");
      if(blob.size>2_900_000) blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",0.65));
      if(!blob || blob.size>3_000_000) throw new Error("Photo is too large after processing. Choose a smaller image.");
      const base64 = await new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(new Error("Photo could not be read."));r.onload=()=>resolve(String(r.result).split(",")[1]);r.readAsDataURL(blob);});
      const data=await api("/api/manage/upload",{method:"POST",body:{contentType:"image/webp",data:base64,kind}});
      uploadImagePath=data.path;
      if (kind === "product") {
        const box=$("#npUpload"); if(box){box.classList.add("done");box.innerHTML=`${ic("checkC",26)}<div style="margin-top:8px"><b>Photo ready</b><br><span class="xs">Ready to save with this product</span></div>`;box.dataset.imagePath=data.path;}
        toast("Product photo uploaded.");
        return;
      }
      const body={businessName:vendorData.name,about:vendorData.about||"",address:vendorData.address||"",category:vendorData.category||null,whatsappNumber:vendorData.whatsapp||vendorData.phone||"",acceptingOrders:!!vendorData.acceptingOrders,bannerPath:kind==="banner"?data.path:(vendorData.bannerPath||null),logoPath:kind==="logo"?data.path:(vendorData.logoPath||null)};
      await api("/api/vendor/storefront",{method:"PATCH",body});
      vendorData[kind==="logo"?"logoPath":"bannerPath"]=data.path;
      vendorData[kind==="logo"?"logoUrl":"bannerUrl"]=data.url;
      const preview=$("#"+(kind==="logo"?"logoUpload":"bannerUpload"));
      if(preview){preview.classList.add("done");const img=document.createElement("img");img.src=data.url;img.alt=kind==="logo"?"Shop logo":"Shop banner";img.style.maxWidth="100%";img.style.maxHeight="120px";img.style.objectFit="cover";img.style.borderRadius="8px";preview.replaceChildren(img);const label=document.createElement("div");label.className="xs";label.textContent="Uploaded · click to replace (max 3 MB)";preview.append(label);}
      await navigateRoute();
      toast(kind==="logo"?"Shop logo uploaded.":"Shop banner uploaded.");
    } catch(e){showApiError(e);}
  }
  async function saveVendorSettings() {
    if (!vendorData) return toast("Shop details have not loaded yet. Refresh and try again.","err");
    const tab = S.settingsTab;
    try {
      if (tab === "profile") {
        const body = { businessName: $("#set-shop-name")?.value.trim() || vendorData.name, about: $("#set-about")?.value.trim() || "", address: $("#set-address")?.value.trim() || "", category: vendorData.category || null, whatsappNumber: vendorData.whatsapp || vendorData.phone, acceptingOrders: !!vendorData.acceptingOrders, bannerPath: vendorData.bannerPath || null, logoPath: vendorData.logoPath || null };
        await api("/api/vendor/storefront", { method:"PATCH", body });
      } else if (tab === "business") {
        const fields = $$(".card.pad-l .field input");
        const fullName = fields.find(f=>f.closest(".field")?.querySelector("label")?.textContent.includes("full name"))?.value || vendorData.fullName;
        const contactEmail = fields.find(f=>f.closest(".field")?.querySelector("label")?.textContent.includes("Email"))?.value || vendorData.contactEmail || "";
        await api("/api/vendor/profile", { method:"PATCH", body:{fullName,contactEmail} });
        const phoneInput = fields.find(f=>f.closest(".field")?.querySelector("label")?.textContent.includes("Phone / WhatsApp"));
        if (phoneInput) await api("/api/vendor/storefront",{method:"PATCH",body:{businessName:vendorData.name,about:vendorData.about||"",address:vendorData.address||"",category:vendorData.category||null,whatsappNumber:phoneInput.value,acceptingOrders:!!vendorData.acceptingOrders,bannerPath:vendorData.bannerPath||null,logoPath:vendorData.logoPath||null}});
      } else {
        return toast("Account password changes are handled through SeePay support.","err");
      }
      await navigateRoute(); toast("Changes saved.");
    } catch(e){showApiError(e);}
  }
  async function saveVendorPayout() {
    const number=$("#pw-num")?.value.trim()||"", network=$("#pw-network")?.value||"MTN", password=$("#pw-current")?.value||"";
    let bad=false;
    [["pw-num",!/^0\d{9}$/.test(number.replace(/\s/g,""))],["pw-current",!password]].forEach(([id,invalid])=>{const f=$("#"+id);if(f){f.closest(".field")?.classList.toggle("error",!!invalid);bad ||= !!invalid;}});
    if(bad)return toast("Enter a valid MoMo number and your current password.","err");
    try { await api("/api/vendor/payout-details",{method:"POST",body:{momoNumber:number,momoNetwork:network,password}}); if($("#pw-current"))$("#pw-current").value=""; await navigateRoute(); toast("Payout details saved."); }
    catch(e){showApiError(e);}
  }
  async function saveAgentProfile() {
    const body={fullName:$("#ap-name")?.value.trim()||"",contactEmail:$("#ap-email")?.value.trim()||"",momoNumber:$("#ap-wallet")?.value.trim()||"",momoNetwork:$("#ap-network")?.value||"MTN"};
    try { await api("/api/agent/profile",{method:"PATCH",body}); await navigateRoute(); toast("Agent profile saved."); }
    catch(e){showApiError(e);}
  }
  function openPayoutRequest() {
    const available = Number(agentData?.metrics?.available || 0);
    const wallet = agentData?.agent?.momoNumber || "your saved MoMo wallet";
    openModal(`<h3>Request a payout</h3><p class="m-body" style="margin-bottom:16px">Available balance: <b>${money(available)}</b> · minimum GH₵ 50.00</p><p class="m-body" style="margin-bottom:16px">Payouts use your saved wallet: <b>${wallet}</b>. The current payout system requests the full available balance.</p><div class="field"><label>Confirm payout amount (GH₵)</label><input class="input" id="po-amt" type="number" min="50" max="${available}" value="${available}" placeholder="50.00"><div class="fhelp">Enter the full available balance to proceed.</div><div class="ferr">Enter exactly the available balance, at least GH₵50.</div></div><div class="m-actions"><button class="btn btn-outline btn-sm" data-action="modal-close">Cancel</button><button class="btn btn-gold btn-sm" id="po-submit" ${available<50?"disabled":""}>${ic("wallet",15)} Request payout</button></div>`);
    const submit=$("#po-submit"); if(submit) submit.onclick=async()=>{
      const input=$("#po-amt"), value=Number(input?.value||0), invalid=available<50||Math.abs(value-available)>0.001||value<50;
      input?.closest(".field")?.classList.toggle("error",invalid); if(invalid)return;
      submit.disabled=true; submit.innerHTML='<span class="spin dark"></span> Requesting…';
      try { await api("/api/agent/payout",{method:"POST",body:{}}); closeModal(); await navigateRoute(); toast("Payout request submitted."); }
      catch(e){showApiError(e);submit.disabled=false;submit.innerHTML=`${ic("wallet",15)} Request payout`;}
    };
  }
  function openAdminPaidModal(id) {
    const payout=PAYOUTS.find(p=>String(p.id)===String(id)); if(!payout)return toast("This payout could not be found. Refresh the list.","err");
    openModal(`<h3>Confirm payout payment</h3><p class="m-body" style="margin-bottom:16px">Only mark this payout paid after the transfer has actually been sent to <b>${payout.net}</b> for <b>${money(payout.amt)}</b>.</p><div class="field"><label>Mobile Money transfer reference</label><input class="input" id="admin-ref" placeholder="Enter the actual transfer reference"><div class="ferr">Enter the transfer reference.</div></div><div class="m-actions"><button class="btn btn-outline btn-sm" data-action="modal-close">Cancel</button><button class="btn btn-gold btn-sm" id="admin-paid-submit">Confirm paid</button></div>`);
    const submit=$("#admin-paid-submit"); if(submit) submit.onclick=async()=>{
      const reference=$("#admin-ref")?.value.trim()||"", input=$("#admin-ref"); input?.closest(".field")?.classList.toggle("error",reference.length<3); if(reference.length<3)return;
      submit.disabled=true;
      try { await api(`/api/admin/payouts/${encodeURIComponent(id)}`,{method:"POST",body:{action:"paid",reference}}); closeModal(); await navigateRoute(); toast("Payout marked paid and audited."); }
      catch(e){showApiError(e);submit.disabled=false;}
    };
  }
  function syncDeliveryField() {
    const pickup = document.querySelector('input[name="ful"][value="PICKUP"]');
    const delivery = document.querySelector('input[name="ful"][value="DELIVERY"]');
    const wrapper=$("#deliveryAddressWrap"); if(!wrapper)return;
    const update=()=>{wrapper.style.display=delivery?.checked?"block":"none";syncRadios();};
    pickup?.addEventListener("change",update); delivery?.addEventListener("change",update); update();
  }
  async function interceptAction(event) {
    const element=event.target.closest("[data-action]"); if(!element)return;
    const action=element.dataset.action;
    const wired = new Set(["login","reg-pay","pay","fake-check","forgot-send","reset-save","fulfil","toggle-prod","del-prod","edit-product","upload","upload-logo","upload-banner","save-product","save-payout","save-settings","confirm-close-shop","payout-modal","approve-payout","approve-vendor","suspend-vendor","reinstate-vendor","share-store"]);
    if (!wired.has(action)) return;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
    try {
      if(action==="login") return await doLogin();
      if(action==="reg-pay") return await doRegisterPayment();
      if(action==="pay") return await doCheckout(element);
      if(action==="fake-check") {
        const ref=window.__spActivationRef||sessionStorage.getItem("sp_activation_ref");
        if(!ref)return toast("No activation reference is available. Return to the setup payment link to check status.","err");
        try { window.__spActivationRef=ref; window.__spActivationStatus=await api(`/api/orders/${encodeURIComponent(ref)}/status`); if(window.__spActivationStatus.status==="SUCCESS")location.hash="#/status/success";else if(["FAILED","ABANDONED"].includes(window.__spActivationStatus.status))location.hash="#/status/error";else toast("Payment is still waiting for confirmation."); await navigateRoute(); } catch(e){showApiError(e);} return;
      }
      if(action==="forgot-send") { location.assign("/reset-password"); return; }
      if(action==="reset-save") { location.assign("/reset-password"); return; }
      if(action==="fulfil") {
        const row=ORDERS.find(o=>String(o.dbId||o.id)===String(element.dataset.id)); if(!row)return toast("Order not found. Refresh orders and try again.","err");
        const status=element.dataset.status||fulfilStatusForOrder(row); const labels={PREPARING:"Start preparing",READY:"Mark ready",COMPLETED:"Mark fulfilled"};
        return confirmDlg({title:`${labels[status]||"Update order"}?`,body:`Update order ${row.reference||row.id} to ${status.toLowerCase()}? Only valid paid-order transitions can be saved.`,cta:labels[status]||"Update order",ok:async()=>{try{await api(`/api/vendor/orders/${encodeURIComponent(row.dbId||row.id)}`,{method:"PATCH",body:{status}});await navigateRoute();toast("Order status updated.");}catch(e){showApiError(e);}}});
      }
      if(action==="toggle-prod") {
        const p=PRODUCTS.find(x=>String(x.id)===String(element.dataset.id)); if(!p)return toast("Product not found.","err");
        try { await api(`/api/vendor/products/${encodeURIComponent(p.id)}`,{method:"PATCH",body:{isAvailable:!p.isAvailable}}); await navigateRoute(); toast(`${p.name} availability updated.`); } catch(e){showApiError(e);} return;
      }
      if(action==="del-prod") {
        const p=PRODUCTS.find(x=>String(x.id)===String(element.dataset.id)); if(!p)return toast("Product not found.","err");
        return confirmDlg({title:`Delete ${p.name}?`,body:"This removes the product from your shop. Past order line items keep their stored snapshots.",cta:"Delete product",danger:true,ok:async()=>{try{await api("/api/manage/product/delete",{method:"POST",body:{id:p.id}});await navigateRoute();toast("Product deleted.");}catch(e){showApiError(e);}}});
      }
      if(action==="edit-product") {
        const p=PRODUCTS.find(x=>String(x.id)===String(element.dataset.id));
        if(!p)return toast("Product not found. Refresh the list and try again.","err");
        window.__spEditingProduct=p;
        uploadImagePath=p.imagePath || null;
        location.hash="#/vendor/products/new";
        if(normalizeRoute(hashRoute())==="/vendor/products/new") await navigateRoute();
        return;
      }
      if(action==="upload") {
        let input=$("#productFilePicker"); if(!input){input=document.createElement("input");input.id="productFilePicker";input.type="file";input.accept="image/*";input.hidden=true;document.body.appendChild(input);input.addEventListener("change",()=>uploadProductImage(input.files?.[0],"product"));}
        input.value=""; input.click(); return;
      }
      if(action==="upload-logo"||action==="upload-banner") {
        let input=$("#brandFilePicker"); if(!input){input=document.createElement("input");input.id="brandFilePicker";input.type="file";input.accept="image/*";input.hidden=true;document.body.appendChild(input);input.addEventListener("change",()=>uploadProductImage(input.files?.[0],input.dataset.kind||"logo"));}
        input.dataset.kind=action==="upload-logo"?"logo":"banner";input.value="";input.click();return;
      }
      if(action==="save-product") return await saveProduct();
      if(action==="save-payout") return await saveVendorPayout();
      if(action==="save-settings") {
        if(normalizeRoute(hashRoute())==="/agent/profile") return await saveAgentProfile();
        if(normalizeRoute(hashRoute()).startsWith("/vendor")) return await saveVendorSettings();
        return toast("This setting is not supported by the current backend yet.","err");
      }
      if(action==="confirm-close-shop") {
        if(!vendorData)return toast("Shop details have not loaded yet.","err");
        const next=!vendorData.acceptingOrders;
        return confirmDlg({title:next?"Reopen your shop?":"Pause orders for your shop?",body:next?"Customers will be able to place orders again.":"Your storefront stays visible, but checkout will be paused until you reopen it.",cta:next?"Reopen shop":"Pause orders",danger:!next,ok:async()=>{try{await api("/api/vendor/storefront",{method:"PATCH",body:{businessName:vendorData.name,about:vendorData.about||"",address:vendorData.address||"",category:vendorData.category||null,whatsappNumber:vendorData.whatsapp||vendorData.phone,acceptingOrders:next,bannerPath:vendorData.bannerPath||null,logoPath:vendorData.logoPath||null}});await navigateRoute();toast(next?"Shop reopened.":"Ordering is paused.");}catch(e){showApiError(e);}}});
      }
      if(action==="payout-modal") return openPayoutRequest();
      if(action==="approve-payout") return openAdminPaidModal(element.dataset.id);
      if(action==="approve-vendor"||action==="suspend-vendor"||action==="reinstate-vendor") return toast("This administrator vendor action is not available in the existing backend. Activation is payment-verified; no status change was made.","err");
      if(action==="share-store") { copyText(safeStoreLink(),"Shop link"); return; }
    } catch(e) { showApiError(e); }
  }
  document.addEventListener("click", interceptAction, true);
  document.addEventListener("click", (event) => {
    const link=event.target.closest('a[href="#/vendor/products/new"]');
    if (link && !window.__spSuppressEditReset) window.__spEditingProduct=null;
  }, true);
  document.addEventListener("change", (event) => { if(event.target?.name==="ful") syncDeliveryField(); }, true);
  document.addEventListener("click", (event) => {
    const anchor=event.target.closest('a[href="#/login"]');
    if(!anchor || !anchor.closest(".side-foot,.pop")) return;
    if(!/sign out/i.test(anchor.textContent||"")) return;
    event.preventDefault(); event.stopImmediatePropagation();
    api("/api/auth/logout",{method:"POST",body:{}}).catch(()=>{}).finally(()=>{location.hash="#/login";});
  }, true);
  // Preview-only labels that looked like transactions must not claim that a fake payment occurred.
  document.addEventListener("click", (event) => {
    const el=event.target.closest('[data-action="confirm-cancel"]');
    if(!el)return;
    event.preventDefault();event.stopImmediatePropagation();
    confirmDlg({title:"Leave registration?",body:"No payment has been made by this preview screen. Only the server-managed setup payment flow can create or cancel a live registration.",cta:"Return to SeePay",ok:()=>{location.hash="#/";}});
  }, true);
  // Real order/activation IDs are retained during same-tab navigation only.
  window.addEventListener("pageshow", () => {
    const ref=sessionStorage.getItem("sp_last_order_ref");
    if(ref && normalizeRoute(hashRoute())==="/store/confirmed") window.__spOrderRef=ref;
  });
  // Store routes must resolve to a real vendor tenant.
  window.addEventListener("DOMContentLoaded", syncDeliveryField);
  boot().catch((e)=>{console.error("SeePay UI integration failed",e);render();applyPostRender();toast("SeePay could not load live data. Refresh the page and try again.","err");});
})();
