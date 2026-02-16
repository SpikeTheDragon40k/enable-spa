import {initializeApp} from "firebase-admin/app";

initializeApp();

export {createDeviceRequest} from "./device/createDeviceRequest";
export {changeStatus} from "./device/changeStatus";
export { updateVolunteerProfile } from "./volunteer/updateVolunteerProfile";
export { addPrinter } from "./volunteer/addPrinter";
