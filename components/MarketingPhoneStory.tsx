"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Lock, Plus } from "lucide-react";

const STEPS = [
  {
    title: "Pick a name. Get a shop.",
    body: "Your business gets its own address, like mamajollof.seepay.shop. Add your products or services and share the link.",
  },
  {
    title: "Customers choose and check out.",
    body: "They add what they want, pick their network and enter their MoMo number. No account needed.",
  },
  {
    title: "They approve on their phone.",
    body: "A MoMo prompt appears. They approve on their phone and the payment goes through Paystack.",
  },
  {
    title: "You see the order and get paid.",
    body: "The order shows up in your dashboard. SeePay’s GH₵ 0.20 and the payment processing fee are deducted before settlement.",
  },
];

function PhoneIllustration({ activeStep }: { activeStep: number }) {
  return (
    <div className="sp-phone-scale">
      <div className="sp-story-phone" role="img" aria-label="Animated phone preview showing a storefront, Mobile Money checkout, payment approval, and the shop owner's order dashboard">
        <div className="sp-phone-notch" />
        <div className="sp-phone-status"><span>9:41</span><span>5G ▮▮▮</span></div>
        <div className="sp-phone-address"><Lock size={12} aria-hidden="true" /><span>{activeStep === 0 ? "mamajollof.seepay.shop" : activeStep === 1 ? "Secure checkout" : activeStep === 2 ? "MTN MoMo" : "Shop dashboard"}</span></div>
        <div className="sp-phone-screen">
          <div className={"sp-phone-pane " + (activeStep === 0 ? "is-active" : "")}>
            <div className="sp-phone-shop-head">
              <div className="sp-phone-avatar">MJ</div>
              <div><b>Mama Jollof</b><small><span>Open</span> · Accra</small></div>
            </div>
            <div className="sp-phone-chips"><i>Rice</i><i>Sides</i><i>Drinks</i></div>
            {[
              ["🍛", "Jollof + chicken", "With shito and salad", "GH₵ 35"],
              ["🍌", "Fried plantain", "Kelewele, spicy", "GH₵ 10"],
              ["🥤", "Sobolo", "Chilled, 500ml", "GH₵ 8"],
            ].map(([emoji, name, description, price]) => (
              <div className="sp-phone-product" key={name}>
                <span className="sp-phone-product-icon">{emoji}</span>
                <div><b>{name}</b><small>{description}</small></div>
                <strong>{price}</strong><span className="sp-phone-add"><Plus size={14} aria-hidden="true" /></span>
              </div>
            ))}
            <div className="sp-phone-cart"><span>2 items</span><b>View cart · GH₵ 45</b></div>
          </div>
          <div className={"sp-phone-pane " + (activeStep === 1 ? "is-active" : "")}>
            <b className="sp-phone-title">Checkout</b>
            <div className="sp-phone-line"><span>1 × Jollof + chicken</span><span>35.00</span></div>
            <div className="sp-phone-line"><span>1 × Fried plantain</span><span>10.00</span></div>
            <div className="sp-phone-line sp-phone-total"><span>Total</span><b>GH₵ 45.00</b></div>
            <small className="sp-phone-label">Pay with</small>
            <div className="sp-phone-networks"><i className="selected">MTN MoMo</i><i>Telecel Cash</i><i>AT Money</i></div>
            <small className="sp-phone-label">MoMo number</small>
            <div className="sp-phone-field">024 123 4567</div>
            <div className="sp-phone-pay">Pay GH₵ 45.00</div>
          </div>
          <div className={"sp-phone-pane sp-phone-approval " + (activeStep === 2 ? "is-active" : "")}>
            <div className="sp-phone-dialog">
              <span className="sp-phone-mtn">MTN MoMo</span>
              <p>Pay Mama Jollof</p>
              <strong>GHS 45.00</strong>
              <div className="sp-phone-pins"><i /><i /><i /><i /></div>
              <small>Approve the payment on your phone</small>
            </div>
            <div className="sp-phone-success"><Check size={16} aria-hidden="true" /> Payment approved</div>
          </div>
          <div className={"sp-phone-pane " + (activeStep === 3 ? "is-active" : "")}>
            <div className="sp-phone-shop-head">
              <div className="sp-phone-avatar">MJ</div>
              <div><b>Orders</b><small>Mama Jollof dashboard</small></div>
            </div>
            <div className="sp-phone-wallet"><small>You receive</small><strong>GH₵ 43.92</strong></div>
            <div className="sp-phone-order"><i /><div><b>Ama K.</b><small>Jollof + chicken, Plantain</small></div><strong>GH₵ 45.00</strong></div>
            <div className="sp-phone-fee"><span>Paystack fee (1.95%)</span><b>− GH₵ 0.88</b></div>
            <div className="sp-phone-fee"><span>SeePay fee</span><b>− GH₵ 0.20</b></div>
            <div className="sp-phone-order faded"><i /><div><b>Kofi A.</b><small>Sobolo × 2</small></div><strong>GH₵ 16.00</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketingPhoneStory() {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const updateActiveStep = () => {
      const focusLine = window.innerHeight * 0.8;
      let closestStep = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      stepRefs.current.forEach((node, index) => {
        if (!node) return;
        const distance = Math.abs(node.getBoundingClientRect().top + 90 - focusLine);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestStep = index;
        }
      });

      setActiveStep((current) => current === closestStep ? current : closestStep);
    };

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateActiveStep();
      });
    };

    updateActiveStep();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section className="sp-story" id="how">
      <div className="container sp-story-wrap">
        <div className="sp-story-stage">
          <PhoneIllustration activeStep={activeStep} />
        </div>
        <div className="sp-story-steps">
          {STEPS.map((item, index) => (
            <div
              className={"sp-story-step " + (activeStep === index ? "is-active" : "")}
              key={item.title}
              data-step={index}
              ref={(node) => { stepRefs.current[index] = node; }}
            >
              <span className="sp-story-number">Step {index + 1} of 4</span>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
