import axios from "axios";

// Simple in-memory cache to avoid repeated calls
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes
const cache = new Map();

// Resolve environment-configurable HNI API base URL with sensible fallback
let importMetaEnv = {};
try {
  importMetaEnv = import.meta && import.meta.env ? import.meta.env : {};
} catch (e) {
  importMetaEnv = {};
}

const envHniUrl =
  (importMetaEnv && importMetaEnv.VITE_HNI_API_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_HNI_API_URL) ||
  null;

const BASE_URL =
  envHniUrl ||
  "https://cpasapi.access-armpensions.com/api/Transactions/RsaBalance";

const normalizeBalance = (value) => {
  if (value === null || value === undefined) return null;
  const s = String(value).replace(/[^0-9.-]/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

const normalizeRsaPin = (rsaPin) => {
  if (!rsaPin) return null;
  const value = String(rsaPin).trim().toUpperCase();
  return /^PEN[A-Z0-9]{12}$/.test(value) ? value : null;
};

export const getBalanceByRsaPin = async (rsaPin) => {
  const normalizedRsaPin = normalizeRsaPin(rsaPin);
  if (!normalizedRsaPin) return null;

  const key = normalizedRsaPin;
  const cached = cache.get(key);
  const now = Date.now();
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return cached.balance;
  }

  try {
    const url = `${BASE_URL}/${encodeURIComponent(key)}`;
    const resp = await axios.get(url, {
      headers: { Accept: "application/json, text/plain" },
      timeout: 15000,
    });

    // Endpoint returns an object with `currentBalance` (string).
    // Be tolerant and fall back to other common fields if present.
    const raw =
      resp?.data?.currentBalance ??
      resp?.data?.balance ??
      resp?.data?.amount ??
      resp?.data ??
      null;
    const balance = normalizeBalance(raw);

    cache.set(key, { ts: now, balance });
    return balance;
  } catch (err) {
    // Don't throw — caller can handle null/undefined as unknown balance
    console.warn(`Failed to fetch balance for ${rsaPin}:`, err?.message || err);
    cache.set(key, { ts: now, balance: null });
    return null;
  }
};

export default { getBalanceByRsaPin };
