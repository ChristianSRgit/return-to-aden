import { signal } from "@preact/signals";
import type { ComponentChildren } from "preact";

// ── toast ────────────────────────────────────────────────────────
export const toastMsg = signal<string>("");
let toastTimer: ReturnType<typeof setTimeout> | null = null;
export function toast(msg: string) {
  toastMsg.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMsg.value = "";
  }, 1900);
}

// ── modal ────────────────────────────────────────────────────────
interface ModalDef {
  title: string;
  body: ComponentChildren;
  actions: { label: string; kind?: "gold" | "ghost" | "danger"; onClick: () => void }[];
}
export const modal = signal<ModalDef | null>(null);
export function closeModal() {
  modal.value = null;
}
export function confirmModal(
  title: string,
  body: ComponentChildren,
  onYes: () => void,
) {
  modal.value = {
    title,
    body,
    actions: [
      { label: "Sí", kind: "gold", onClick: () => { closeModal(); onYes(); } },
      { label: "No", kind: "ghost", onClick: closeModal },
    ],
  };
}

export function Overlays() {
  const m = modal.value;
  return (
    <>
      <div id="toast" class={toastMsg.value ? "show" : ""}>
        {toastMsg.value}
      </div>
      <div
        id="modal"
        class={m ? "show" : ""}
        onClick={(e) => {
          if ((e.target as HTMLElement).id === "modal") closeModal();
        }}
      >
        {m && (
          <div class="box">
            <h3>{m.title}</h3>
            <div class="body">{m.body}</div>
            <div class="btn-row">
              {m.actions.map((a) => (
                <button
                  key={a.label}
                  class={"btn " + (a.kind ?? "")}
                  style="font-size:13px"
                  onClick={a.onClick}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
