import { Tag } from "primereact/tag";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

export default function AdminVolunteers({ volunteers }: { volunteers: any[] }) {
  const tableData = volunteers.map((u) => ({
    ...u,
    createdAt: u.createdAt?.toDate ? u.createdAt.toDate() : null,
    profileUpdatedAt: u.profileUpdatedAt,
  }));

  const boolTemplate = (row: any, field: string) => (
    <Tag value={row[field] ? "true" : "false"} severity={row[field] ? "success" : "danger"} />
  );

  const roleTemplate = (row: any) => (
    <Tag value={row.role} severity={row.role === "admin" ? "warning" : "info"} />
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>Utenti</h2>
      <DataTable value={tableData} paginator rows={10} filterDisplay="row">
        <Column field="firstName" header="Nome" filter />
        <Column field="lastName" header="Cognome" filter />
        <Column field="email" header="Email" filter />
        <Column field="city" header="Città" filter />
        <Column field="phone" header="Telefono"/>
        <Column field="role" header="Ruolo" body={roleTemplate} filter />
        <Column field="active" header="Attivo" body={(row) => boolTemplate(row, "active")} filter />
        {/* <Column field="mustSetPassword" header="Da impostare password" body={(row) => boolTemplate(row, "mustSetPassword")} filter /> */}
        {/* <Column field="authProvider" header="Provider" body={providerTemplate} filter /> */}
        {/* <Column header="Creato" body={(row) => dateTemplate(row, "createdAt")} filter field="createdAt" dataType="date" filterElement={dateFilterTemplate} /> */}
        {/* Campi profilo */}
        <Column field="telegramUsername" header="Telegram" filter />
        {/* <Column field="availability" header="Disponibilità" filter /> */}
        {/* <Column field="consentPrivacy" header="Privacy" body={(row) => boolTemplate(row, "consentPrivacy")} filter /> */}
        {/* <Column field="continuityType" header="Continuità" filter />
        <Column field="desiredInvolvementLevel" header="Livello coinvolgimento" filter />
        <Column field="mainInterest" header="Interessi" filter /> */}
        {/* <Column header="Profilo aggiornato" body={(row) => dateTemplate(row, "profileUpdatedAt")} filter field="profileUpdatedAt" dataType="date" filterElement={dateFilterTemplate} /> */}
      </DataTable>
    </div>
  );
}
