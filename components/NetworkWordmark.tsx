import type { CSSProperties } from "react";

export type MomoNetwork = "MTN" | "VODAFONE" | "AIRTELTIGO";

type Props = {
  network: MomoNetwork;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const providerNames: Record<MomoNetwork, string> = {
  MTN: "MTN MoMo",
  VODAFONE: "Telecel Cash",
  AIRTELTIGO: "AT Money",
};

const styles: Record<MomoNetwork, CSSProperties> = {
  MTN: {
    color: "#00516A",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontWeight: 800,
    letterSpacing: "-0.045em",
  },
  VODAFONE: {
    color: "#E51C2A",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontWeight: 800,
    letterSpacing: "-0.035em",
  },
  AIRTELTIGO: {
    color: "#16366E",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontWeight: 800,
    letterSpacing: "-0.035em",
  },
};

export function networkDisplayName(network: string | null | undefined): string {
  if (network === "MTN" || network === "VODAFONE" || network === "AIRTELTIGO") {
    return providerNames[network];
  }
  return network || "Mobile Money";
}

/** Text-only provider wordmark. Official logos are intentionally not included yet. */
export default function NetworkWordmark({ network, size = "md", className = "" }: Props) {
  const sizeClass = size === "lg" ? "text-base sm:text-lg" : size === "sm" ? "text-[11px]" : "text-xs sm:text-sm";
  if (network === "AIRTELTIGO") {
    return (
      <span className={`inline-flex items-baseline font-extrabold ${sizeClass} ${className}`} style={{ fontFamily: "Arial, Helvetica, sans-serif", letterSpacing: "-0.035em" }} aria-label="AT Money">
        <span style={{ color: "#E51C2A" }}>AT</span><span className="ml-1" style={{ color: "#16366E" }}>Money</span>
      </span>
    );
  }
  if (network === "VODAFONE") {
    return <span className={`inline-flex font-extrabold ${sizeClass} ${className}`} style={styles[network]} aria-label="Telecel Cash">Telecel Cash</span>;
  }
  return <span className={`inline-flex items-baseline font-extrabold ${sizeClass} ${className}`} style={{ fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 800, letterSpacing: "-0.045em" }} aria-label="MTN MoMo"><span style={{ color: "#00516A" }}>MTN</span><span className="ml-1" style={{ color: "#8E6A00" }}>MoMo</span></span>;
}
