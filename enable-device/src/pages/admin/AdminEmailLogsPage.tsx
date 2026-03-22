import { useEffect, useRef, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  query,
} from "firebase/firestore";
import { db } from "../../firebase";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";

// ---- Types ----

interface DeliveryInfo {
  messageId?: string;
  response?: string;
}

interface Delivery {
  state?: "SUCCESS" | "ERROR" | string;
  error?: string;
  attempts?: number;
  startTime?: unknown;
  endTime?: unknown;
  info?: DeliveryInfo;
}

interface MailDoc {
  id: string;
  createdAt?: unknown;
  to?: string | string[];
  template?: string | { name?: string; data?: Record<string, unknown> };
  message?: {
    subject?: string;
    html?: string;
  };
  delivery?: Delivery;
}

// ---- Helpers ----

function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (typeof (val as Record<string, unknown>)?.toDate === "function")
    return (val as { toDate: () => Date }).toDate();
  if (
    typeof val === "object" &&
    typeof (val as Record<string, unknown>).seconds === "number"
  )
    return new Date(
      ((val as Record<string, unknown>).seconds as number) * 1000
    );
  const d = new Date(val as string | number);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(val: unknown): string {
  const d = toDate(val);
  if (!d) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function normalizeToField(to: string | string[] | undefined): string {
  if (!to) return "—";
  if (Array.isArray(to)) return to.join(", ");
  return to;
}

function getTemplateName(template: MailDoc["template"]): string | undefined {
  if (!template) return undefined;
  if (typeof template === "string") return template;
  return template.name ?? JSON.stringify(template);
}

function getMailDate(row: MailDoc): Date | null {
  return toDate(row.createdAt) ?? toDate(row.delivery?.startTime) ?? null;
}

function getSubjectOrTemplate(row: MailDoc): string {
  if (row.message?.subject) return row.message.subject;
  const name = getTemplateName(row.template);
  if (name) return name;
  return "N/A";
}

function getStateTag(row: MailDoc) {
  const state = row.delivery?.state;
  if (state === "SUCCESS")
    return <Tag value="SUCCESS" severity="success" />;
  if (state === "ERROR")
    return <Tag value="ERROR" severity="danger" />;
  return <Tag value={state ?? "—"} severity="secondary" />;
}

// ---- Component ----

export default function AdminEmailLogsPage() {
  const toast = useRef<Toast>(null);
  const [mails, setMails] = useState<MailDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MailDoc | null>(null);

  useEffect(() => {
    const fetchMails = async () => {
      try {
        const q = query(
          collection(db, "mail"),
          limit(200)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as MailDoc[];
        // Sort client-side so documents without createdAt are still included
        data.sort((a, b) => {
          const ta = getMailDate(a)?.getTime() ?? 0;
          const tb = getMailDate(b)?.getTime() ?? 0;
          return tb - ta;
        });
        setMails(data);
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Errore nel caricamento delle email.";
        toast.current?.show({
          severity: "error",
          summary: "Errore",
          detail: msg,
          life: 5000,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchMails();
  }, []);

  // Pre-process dates so DataTable can sort by them as real Date objects
  const tableData = mails.map((m) => ({
    ...m,
    _date: getMailDate(m),
  }));

  // ---- Column bodies ----

  const dateBody = (row: MailDoc) => formatDate(getMailDate(row));

  const toBody = (row: MailDoc) => (
    <span style={{ wordBreak: "break-all" }}>
      {normalizeToField(row.to)}
    </span>
  );

  const subjectBody = (row: MailDoc) => getSubjectOrTemplate(row);

  const statusBody = (row: MailDoc) => getStateTag(row);

  const attemptsBody = (row: MailDoc) => row.delivery?.attempts ?? "—";

  const actionsBody = (row: MailDoc) => (
    <Button
      icon="pi pi-eye"
      label="Dettagli"
      size="small"
      className="p-button-text"
      onClick={() => setSelected(row)}
    />
  );

  // ---- Loading state ----

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <ProgressSpinner />
      </div>
    );
  }

  // ---- Detail dialog content ----

  const renderDetail = () => {
    if (!selected) return null;
    const d = selected.delivery;
    const isTemplate = !!selected.template && !selected.message;

    const row = (label: string, value: React.ReactNode) => (
      <div style={{ marginBottom: 10 }}>
        <strong style={{ display: "inline-block", minWidth: 130 }}>{label}:</strong>
        <span style={{ marginLeft: 8 }}>{value ?? "—"}</span>
      </div>
    );

    return (
      <div>
        {/* Common fields */}
        {row("A", <span style={{ wordBreak: "break-all" }}>{normalizeToField(selected.to)}</span>)}
        {row("Data invio", formatDate(getMailDate(selected)))}
        {row("Stato", getStateTag(selected))}
        {row("Tentativi", d?.attempts ?? "—")}
        {d?.error && (
          <div style={{ marginBottom: 10 }}>
            <strong>Errore:</strong>
            <pre
              style={{
                background: "#fff1f0",
                border: "1px solid #ffccc7",
                borderRadius: 4,
                padding: 8,
                marginTop: 4,
                fontSize: "0.85em",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {d.error}
            </pre>
          </div>
        )}

        {/* Template email */}
        {isTemplate && row("Template", getTemplateName(selected.template))}
        {isTemplate && typeof selected.template === "object" && selected.template?.data && (
          <div style={{ marginBottom: 10 }}>
            <strong>Template data:</strong>
            <pre
              style={{
                background: "#f6f8fa",
                border: "1px solid #ddd",
                borderRadius: 4,
                padding: 8,
                marginTop: 4,
                fontSize: "0.82em",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                maxHeight: 200,
                overflowY: "auto",
              }}
            >
              {JSON.stringify(selected.template.data, null, 2)}
            </pre>
          </div>
        )}

        {/* Raw email */}
        {selected.message && (
          <>
            {row("Oggetto", selected.message.subject)}
            {selected.message.html && (
              <div style={{ marginBottom: 10 }}>
                <strong>Contenuto HTML:</strong>
                <div
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    padding: 12,
                    marginTop: 6,
                    maxHeight: 360,
                    overflowY: "auto",
                    background: "#fff",
                    fontSize: "0.9em",
                  }}
                  dangerouslySetInnerHTML={{ __html: selected.message.html }}
                />
              </div>
            )}
          </>
        )}

        {/* Delivery info */}
        {d?.info && (
          <>
            <hr style={{ margin: "12px 0", borderColor: "#eee" }} />
            <strong style={{ display: "block", marginBottom: 8, color: "#555" }}>
              Info consegna
            </strong>
            {d.info.messageId && row("Message ID", d.info.messageId)}
            {d.info.response && row("Response", d.info.response)}
          </>
        )}
      </div>
    );
  };

  // ---- Main render ----

  return (
    <div style={{ padding: 20 }}>
      <Toast ref={toast} />

      <h2 style={{ marginBottom: 20 }}>Log Email</h2>

      <DataTable
        value={tableData}
        emptyMessage="Nessuna email trovata."
        paginator
        rows={20}
        sortField="createdAt"
        sortOrder={-1}
        dataKey="id"
      >
        <Column
          field="_date"
          header="Data invio"
          body={dateBody}
          sortable
          style={{ minWidth: 140 }}
        />
        <Column
          header="A"
          body={toBody}
          style={{ minWidth: 160 }}
        />
        <Column
          header="Oggetto / Template"
          body={subjectBody}
          style={{ minWidth: 180 }}
        />
        <Column
          header="Stato"
          body={statusBody}
          sortable
          field="delivery.state"
          style={{ minWidth: 100 }}
        />
        <Column
          header="Tentativi"
          body={attemptsBody}
          style={{ minWidth: 90 }}
        />
        <Column
          header="Azioni"
          body={actionsBody}
          style={{ minWidth: 110 }}
        />
      </DataTable>

      <Dialog
        header="Dettagli email"
        visible={!!selected}
        style={{ width: "680px" }}
        contentStyle={{ maxHeight: "70vh", overflowY: "auto" }}
        onHide={() => setSelected(null)}
        footer={
          <Button
            label="Chiudi"
            icon="pi pi-times"
            className="p-button-text"
            onClick={() => setSelected(null)}
          />
        }
      >
        {renderDetail()}
      </Dialog>
    </div>
  );
}
