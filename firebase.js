import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAO52KfHdWQBUsrH6qu-SdQMPVzZAT4Jgw",
  authDomain: "void-77.firebaseapp.com",
  projectId: "void-77",
  storageBucket: "void-77.firebasestorage.app",
  messagingSenderId: "626266343839",
  appId: "1:626266343839:web:da040746cf049fde6515aa",
  measurementId: "G-VXR4HLRR2F"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

console.log("Firebase Connected");
