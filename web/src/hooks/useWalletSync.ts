import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiWalletSummary, type LedgerEntry } from "../lib/api";

export const WALLET_EVENT = "buzzin-wallet";

export function dispatchWalletUpdated() {
  window.dispatchEvent(new Event(WALLET_EVENT));
}

export function useBuzzBalance() {
  const { token, user } = useAuth();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!token || !user) {
      setBalance(0);
      return;
    }
    const sync = () => {
      void (async () => {
        try {
          const s = await apiWalletSummary(token);
          setBalance(s.balance);
        } catch {
          setBalance(0);
        }
      })();
    };
    sync();
    window.addEventListener(WALLET_EVENT, sync);
    return () => window.removeEventListener(WALLET_EVENT, sync);
  }, [token, user?.id]);

  return balance;
}

export function useBuzzLedger() {
  const { token, user } = useAuth();
  const [rows, setRows] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    if (!token || !user) {
      setRows([]);
      return;
    }
    const sync = () => {
      void (async () => {
        try {
          const s = await apiWalletSummary(token);
          setRows(s.ledger);
        } catch {
          setRows([]);
        }
      })();
    };
    sync();
    window.addEventListener(WALLET_EVENT, sync);
    return () => window.removeEventListener(WALLET_EVENT, sync);
  }, [token, user?.id]);

  return rows;
}
