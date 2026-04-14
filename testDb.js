import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAu-_8iz-3iSPdnimLq-PRbSsj323KZYwc",
  authDomain: "smartcart-a5e29.firebaseapp.com",
  databaseURL: "https://smartcart-a5e29-default-rtdb.firebaseio.com",
  projectId: "smartcart-a5e29",
  storageBucket: "smartcart-a5e29.appspot.com",
  messagingSenderId: "521016468149",
  appId: "1:521016468149:web:f4d7395f2f6baa741dd4fc",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

async function test() {
  try {
    await signInWithEmailAndPassword(auth, "smartcart@test.com", "12345678");
    const snapshot = await get(ref(db, "/"));
    console.log("DB Data:", JSON.stringify(snapshot.val(), null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
test();
