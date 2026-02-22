import { Timeline } from "primereact/timeline";

interface Props {
  events: any[];
}

export default function RequestTimeline({ events }: Props) {

  console.log("Timeline events:", events);
  return (
    <Timeline
      value={events}
      content={(item) => (
        <div>
            {item.fromStatus === item.toStatus ? (
            <strong>Aggiornamento / Nota</strong>
            ) : (
            <strong>Cambio di stato: {item.fromStatus || "—"} → {item.toStatus}</strong>
            )}
          {(item.userName || item.createdBy) && item.timestamp && typeof item.timestamp.toDate === "function" && (
            <div style={{ fontSize: "0.9em", color: "#888" }}>
              {item.userName || item.createdBy} @ {item.timestamp.toDate().toLocaleString()}
            </div>
          )}
          <p>{item.note}</p>
        </div>
      )}
    />
  );
}
