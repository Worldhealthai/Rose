"use client";

import { useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { Icon } from "./icons";

/** Resize/crop an image file to a square JPEG data URL (kept small for the DB). */
function resizeToDataUrl(file: File, size = 256, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function AvatarUpload({
  name = "avatar",
  displayName,
  current = null,
  autoSubmit = false,
  size = 88,
}: {
  name?: string;
  displayName: string;
  current?: string | null;
  autoSubmit?: boolean;
  size?: number;
}) {
  const [value, setValue] = useState<string>(current ?? "");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  function apply(v: string) {
    setValue(v);
    if (hiddenRef.current) {
      hiddenRef.current.value = v;
      if (autoSubmit) hiddenRef.current.form?.requestSubmit();
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      apply(await resizeToDataUrl(file));
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar name={displayName} src={value || null} size={size} />
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={value} />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          className="btn-secondary !py-2"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          <Icon name="user" className="h-4 w-4" />
          {busy ? "Processing…" : value ? "Change photo" : "Add photo"}
        </button>
        {value && (
          <button
            type="button"
            className="text-xs font-medium text-danger hover:underline"
            onClick={() => apply("")}
          >
            Remove photo
          </button>
        )}
      </div>
    </div>
  );
}
