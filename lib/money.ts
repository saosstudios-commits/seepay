export const SETUP_FEE_GHS = 150;
export const PLATFORM_ORDER_FEE_GHS = 0.2;
export const PAYSTACK_GHANA_RATE = 0.0195;
export function toPesewas(ghs: number): number { if (!Number.isFinite(ghs) || ghs < 0) throw new Error("Invalid money amount"); return Math.round(ghs * 100); }
export function fromPesewas(pesewas: number): number { return Math.round(pesewas) / 100; }
export function money(ghs: number): string { return `GH₵ ${ghs.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
