import { initializeApp } from "firebase/app";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";

const firebaseConfig = {
  projectId: "demo-project",
  apiKey: "demo-api-key",
  appId: "demo-app-id",
  // The databaseURL is required by the SDK for RTDB to know which instance to talk to in some cases
  databaseURL: "http://127.0.0.1:5003?ns=demo-project",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);

if (process.env.NODE_ENV === "development") {
  // Point to the local emulator
  connectDatabaseEmulator(database, "127.0.0.1", 5003);
}

export { app, database };
