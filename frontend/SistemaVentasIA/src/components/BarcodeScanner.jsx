import { useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function BarcodeScanner({ open, onScan, onClose, title = "Escanear código" }) {
  const reactId = useId().replace(/:/g, "");
  const elementId = `barcode-reader-${reactId}`;
  const handledRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  const [err, setErr] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    onScanRef.current = onScan;
    onCloseRef.current = onClose;
  }, [onScan, onClose]);

  useEffect(() => {
    if (!open) return;

    handledRef.current = false;
    setErr("");
    setStarting(true);

    let cancelled = false;
    const scanner = new Html5Qrcode(elementId);

    const stop = async () => {
      try {
        if (scanner.isScanning) await scanner.stop();
        await scanner.clear();
      } catch {
        /* ignore */
      }
    };

    (async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 140 } },
          async (decodedText) => {
            if (handledRef.current || cancelled) return;
            handledRef.current = true;
            const code = String(decodedText || "").trim();
            await stop();
            if (code) onScanRef.current?.(code);
            onCloseRef.current?.();
          },
          () => {}
        );
        if (!cancelled) setStarting(false);
      } catch {
        if (!cancelled) {
          setStarting(false);
          setErr("No se pudo abrir la cámara. Permite el acceso o usa un escáner USB.");
        }
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, [open, elementId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 grid place-items-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button type="button" className="text-sm text-gray-500 hover:text-gray-800" onClick={() => onCloseRef.current?.()}>
            Cerrar
          </button>
        </div>

        {starting && !err && <p className="text-sm text-gray-500">Abriendo cámara...</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}

        <div id={elementId} className="overflow-hidden rounded-lg bg-black min-h-[220px]" />

        <p className="text-xs text-gray-500">
          Apunta al código de barras del producto. Con escáner USB, usa el campo de búsqueda y Enter.
        </p>
      </div>
    </div>
  );
}
