import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, BellRing, Check, CircleHelp, CreditCard,
  Package, Share2, ShieldCheck, ShoppingBag, Store, Wallet,
} from "lucide-react";
import MarketingNav from "@/components/MarketingNav";
import FeeCalculator from "@/components/FeeCalculator";
import NetworkWordmark from "@/components/NetworkWordmark";
import { Awning, SignChip } from "@/components/ui/Brand";

const faqs = [
  ["Do I pay every month?", "No. The vendor setup fee is GH₵ 150 once. SeePay adds GH₵ 0.20 per successful order, plus Paystack’s processing fee."],
  ["How do customers pay?", "Customers choose a supported Mobile Money network, enter their number, and approve the payment prompt on their phone."],
  ["How do I get paid?", "Paystack settles the vendor share to the Mobile Money account connected to your shop, subject to the provider’s settlement timing."],
  ["How do agents earn?", "An agent earns GH₵ 50 when a referred shop’s setup payment is verified. No commission is due before that payment succeeds."],
  ["Can I pause orders?", "Yes. Your shop page can remain visible while ordering is paused, so customers know the shop exists even when you are not taking new orders."],
];

const categories = [
  { title: "Style & accessories", note: "Clothing, bags and everyday finds", tone: "sand", art: "bag" },
  { title: "Beauty & care", note: "Beauty products and self-care", tone: "peach", art: "beauty" },
  { title: "Home & living", note: "Useful pieces for your space", tone: "mint", art: "home" },
  { title: "Tech & gadgets", note: "Devices and everyday tech", tone: "blue", art: "tech" },
] as const;

function PreviewProduct({ kind, title, price }: { kind: "bag" | "sneaker" | "beauty"; title: string; price: string }) {
  return (
    <div className="sp-preview-product">
      <div className={`sp-preview-art sp-art-${kind}`} aria-hidden="true">
        {kind === "bag" && <><span className="sp-bag-handle"/><span className="sp-bag-body"/><span className="sp-bag-clasp"/></>}
        {kind === "sneaker" && <><span className="sp-shoe-body"/><span className="sp-shoe-sole"/><span className="sp-shoe-stripe"/></>}
        {kind === "beauty" && <><span className="sp-beauty-bottle"/><span className="sp-beauty-cap"/><span className="sp-beauty-jar"/></>}
      </div>
      <div className="sp-preview-product-copy"><span>{title}</span><b>{price}</b></div>
    </div>
  );
}

function CategoryArt({ category }: { category: typeof categories[number] }) {
  return (
    <div className={`sp-category-art sp-category-${category.tone}`} aria-hidden="true">
      {category.art === "bag" && <><span className="sp-category-bag-handle"/><span className="sp-category-bag"/><span className="sp-category-bag-clasp"/></>}
      {category.art === "beauty" && <><span className="sp-category-bottle"/><span className="sp-category-bottle-cap"/><span className="sp-category-pot"/></>}
      {category.art === "home" && <><span className="sp-category-vase-top"/><span className="sp-category-vase"/><span className="sp-category-vase-shine"/></>}
      {category.art === "tech" && <><span className="sp-category-phone"><span/></span></>}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <MarketingNav />
      <main className="sp-home">
        <section className="sp-home-hero">
          <div className="container sp-home-hero-grid">
            <div className="sp-home-copy">
              <p className="sp-eyebrow"><span/> THE SIMPLE WAY TO SELL ONLINE IN GHANA</p>
              <h1 className="display">Give your hustle <em>a bigger stage.</em></h1>
              <p className="sp-home-description">Launch a beautiful online shop, manage orders and get paid — without needing a developer or a big budget.</p>
              <div className="sp-home-actions">
                <Link className="btn gold" href="/register">Start your free shop <ArrowRight size={18}/></Link>
                <a className="btn outline" href="#discover">Explore local shops <ArrowUpRight size={17}/></a>
              </div>
              <div className="sp-home-reassurance"><span><Check size={15}/> One-time GH₵ 150 setup</span><span><Check size={15}/> No monthly fee</span></div>
              <p className="sp-home-footnote">NO WEBSITE EXPERIENCE NEEDED <span/> BUILT FOR MOBILE</p>
            </div>
            <div className="sp-home-visual-wrap">
              <div className="sp-hero-orbit sp-hero-orbit-gold"/><div className="sp-hero-orbit sp-hero-orbit-mint"/>
              <div className="sp-home-visual">
                <div className="sp-store-window">
                  <div className="sp-store-top"><div><span>EXAMPLE STOREFRONT</span><h2 className="display">Your shop name</h2></div><span className="sp-open-chip"><i/> Shop preview</span></div>
                  <div className="sp-store-divider"/>
                  <h3>Good things, picked by you.</h3>
                  <div className="sp-preview-products">
                    <PreviewProduct kind="bag" title="Everyday tote" price="GH₵ 185"/>
                    <PreviewProduct kind="sneaker" title="Street sneakers" price="GH₵ 420"/>
                    <PreviewProduct kind="beauty" title="Glow essentials" price="GH₵ 96"/>
                  </div>
                </div>
                <div className="sp-payment-toast"><span className="sp-payment-check"><Check size={17}/></span><div><small>PAYMENT CONFIRMATION</small><strong>Order paid</strong><span>Customer payment confirmed</span></div><span className="sp-paid-tag">PAID</span></div>
                <div className="sp-order-toast"><span className="sp-order-toast-icon"><ShoppingBag size={17}/></span><div><small>STORE TOOLS</small><strong>Orders, all in one place</strong></div></div>
              </div>
              <div className="sp-signature"><SignChip slug="your-shop"/></div>
              <p className="sp-preview-disclaimer">Illustrative storefront preview</p>
            </div>
          </div>
        </section>

        <section className="sp-payment-trust" aria-label="Supported payment networks">
          <div className="container sp-payment-trust-inner"><span className="sp-trust-lead">Customers pay with</span><NetworkWordmark network="MTN" size="lg"/><span className="sp-provider-divider"/><NetworkWordmark network="VODAFONE" size="lg"/><span className="sp-provider-divider"/><NetworkWordmark network="AIRTELTIGO" size="lg"/><span className="sp-trust-paystack"><ShieldCheck size={17}/> Payments processed by Paystack</span></div>
        </section>

        <section className="sp-home-section sp-how" id="how">
          <div className="container"><div className="sp-section-heading"><p className="sp-eyebrow">FROM FIRST IDEA TO FIRST ORDER</p><h2 className="display">Less setup. More selling.</h2><p>Simple tools let you focus on your customers — not the technology.</p></div>
            <div className="sp-how-grid">
              {[{num:"01",title:"Create your shop",body:"Choose a name, add your products and set up your storefront.",icon:Store,tone:"mint"},{num:"02",title:"Share your link",body:"Let customers browse your products and place their orders.",icon:Share2,tone:"peach"},{num:"03",title:"Manage & grow",body:"Keep track of orders, payments and what is selling.",icon:Wallet,tone:"gold"}].map(step=>{const Icon=step.icon;return <article className="sp-how-card" key={step.num}><span className={`sp-how-number sp-tone-${step.tone}`}>{step.num}</span><span className="sp-how-icon"><Icon size={20}/></span><h3>{step.title}</h3><p>{step.body}</p><ArrowUpRight className="sp-how-arrow" size={20}/></article>})}
            </div>
          </div>
        </section>

        <section className="sp-home-section sp-discover" id="discover">
          <div className="container"><div className="sp-discover-head"><div className="sp-section-heading"><p className="sp-eyebrow">LOCAL FINDS. REAL PEOPLE.</p><h2 className="display">A shop for the way <em>you sell.</em></h2><p>Build a storefront that puts your products first and makes it easy for customers to get in touch.</p></div><Link className="btn outline" href="/register">Build your shop <ArrowRight size={17}/></Link></div>
            <div className="sp-category-grid">{categories.map(category=><article className="sp-category-card" key={category.title}><CategoryArt category={category}/><div className="sp-category-copy"><h3>{category.title}</h3><p>{category.note}</p></div><ArrowUpRight className="sp-category-arrow" size={19}/></article>)}</div>
          </div>
        </section>

        <section className="sp-home-section sp-features" id="features">
          <div className="container sp-feature-grid"><div><p className="sp-eyebrow">TOOLS FOR A BUSY DAY</p><h2 className="display">More selling.<br/><em>Less chasing.</em></h2><p className="sp-feature-intro">Your product list, orders and storefront live together in one place — designed to work on your phone.</p><div className="sp-feature-list"><div><span><BellRing size={20}/></span><div><h3>Know when an order is paid</h3><p>Payment-confirmed order updates, without digging through messages.</p></div></div><div><span><Wallet size={20}/></span><div><h3>Understand what you receive</h3><p>A clearer breakdown of the order amount and the fees that apply.</p></div></div><div><span><CreditCard size={20}/></span><div><h3>Offer Mobile Money checkout</h3><p>Give customers familiar payment-network choices in the checkout flow.</p></div></div></div></div>
            <div className="sp-dashboard-preview"><div className="sp-dashboard-preview-head"><div><small>YOUR WORKSPACE</small><h3 className="display">A clearer day at work.</h3></div><span><Wallet size={21}/></span></div><div className="sp-dashboard-mini-card"><div><span className="sp-mini-icon"><Package size={17}/></span><div><strong>Products</strong><small>Keep your catalogue up to date</small></div></div><ArrowRight size={17}/></div><div className="sp-dashboard-mini-card"><div><span className="sp-mini-icon sp-mini-gold"><ShoppingBag size={17}/></span><div><strong>Orders</strong><small>Find new and pending orders quickly</small></div></div><ArrowRight size={17}/></div><div className="sp-dashboard-mini-card"><div><span className="sp-mini-icon sp-mini-red"><CreditCard size={17}/></span><div><strong>Payments</strong><small>See payment states and order totals</small></div></div><ArrowRight size={17}/></div><p className="sp-preview-disclaimer">Illustrative workspace preview — actual figures come from your account.</p></div>
          </div>
        </section>

        <section className="sp-home-section sp-pricing" id="pricing"><div className="container"><div className="sp-section-heading sp-section-heading-center"><p className="sp-eyebrow">STRAIGHTFORWARD PRICING</p><h2 className="display">Know what you pay.</h2><p>One setup fee. A small fee per successful order. No monthly SeePay subscription.</p></div><div className="sp-pricing-grid"><div className="sp-setup-ticket"><span className="sp-ticket-eyebrow">ONE-TIME SHOP SETUP</span><p className="sp-price display">GH₵ 150</p><div className="sp-ticket-rule"/><h3>Your business, online.</h3><p>Get your shop link, product manager and order tools in one place.</p><ul><li><Check size={16}/> Your own storefront link</li><li><Check size={16}/> Product and order management</li><li><Check size={16}/> Mobile Money checkout</li></ul><p className="sp-ticket-small">Plus GH₵ 0.20 per successful order and the Paystack payment processing fee.</p><Link className="btn gold" href="/register">Start your shop <ArrowRight size={17}/></Link></div><div className="sp-fee-calculator-wrap"><FeeCalculator/></div></div></div></section>

        <section className="sp-home-section sp-agent-section" id="agents"><div className="container sp-agent-grid"><div><p className="sp-eyebrow">KNOW A BUSINESS OWNER?</p><h2 className="display">Local connections.<br/><em>Real opportunity.</em></h2><p>Help Ghanaian businesses get online. Share your referral link and track eligible commissions in one place.</p><Link className="btn gold" href="/register?as=agent">Become an agent <ArrowRight size={18}/></Link></div><div className="sp-agent-ticket"><span>ELIGIBLE REFERRAL COMMISSION</span><p className="display">GH₵ 50</p><div className="sp-ticket-rule"/><p>Earn when a referred vendor’s setup payment is verified. There is no commission before that payment clears.</p><div className="sp-agent-steps"><span><Check size={15}/> Share your referral link</span><span><Check size={15}/> Follow your referrals</span><span><Check size={15}/> Request eligible payouts</span></div><Link href="/register?as=agent" className="sp-text-link">Learn about agent registration <ArrowRight size={16}/></Link></div></div></section>

        <section className="sp-home-section sp-faq" id="faq"><div className="container sp-faq-grid"><div><p className="sp-eyebrow">QUESTIONS, ANSWERED</p><h2 className="display">Good to know.</h2><p>Have a question about launching a shop or how payments work? Start here.</p><CircleHelp className="sp-faq-icon" size={42}/></div><div className="sp-faq-list">{faqs.map(([q,a])=><details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></div></section>

        <section className="sp-home-final"><Awning/><div className="container"><div><p className="sp-eyebrow">READY WHEN YOU ARE</p><h2 className="display">Turn your hustle into a storefront people love.</h2><p>Create your shop today. Your next customer could be one link away.</p><Link className="btn gold" href="/register">Open your shop <ArrowRight size={18}/></Link></div><div className="sp-final-url-card"><div><Store size={19}/><strong>Your brand</strong><span className="sp-open-chip"><i/> Your shop</span></div><div className="sp-final-color-tiles"><span/><span/><span/></div><p>seepay.shop/yourbrand</p></div></div></section>
      </main>
      <footer className="sp-home-footer"><div className="container"><div className="sp-footer-main"><div><strong className="display">SeePay</strong><p>Your shop. Your customers. Your next chapter.</p></div><nav aria-label="Footer"><a href="#how">How it works</a><a href="#pricing">Pricing</a><a href="#agents">Agents</a><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/login">Sign in</Link></nav></div><div className="sp-footer-bottom"><span>© SeePay</span><span>Made for local businesses in Ghana</span></div></div></footer>
    </>
  );
}
