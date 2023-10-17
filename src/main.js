import { createApp } from "vue";
import App from "./App.vue";
import VueGtag from "vue-gtag";

import "./assets/normalize.css";
import "./assets/main.css";

// createApp(App).mount("#app");

// ---------------------------------------------->
// pokud nebude fungovat full screen, odstranit tento kód
const app = createApp(App);

// získání kořenového elementu aplikace
const appRoot = document.getElementById("app");

// po načtení aplikace spustit režim full screen
app.component("App", {
  mounted() {
    if (appRoot.requestFullscreen) {
      appRoot.requestFullscreen();
    } else if (appRoot.webkitRequestFullscreen) {
      appRoot.webkitRequestFullscreen(); // Safari
    } else if (appRoot.msRequestFullscreen) {
      appRoot.msRequestFullscreen(); // IE11
    }
  },
});
// <----------------------------------------------

createApp(App)
  .use(VueGtag, {
    config: {
      id: "G-TXW6QDDMEG",
      params: {
        anonymize_ip: true,
      },
    },
  })
  .mount("#app");
