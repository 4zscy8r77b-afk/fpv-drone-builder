// Compatibility entry point for hosting services that still run `node server.js`.
// The canonical application entry point is `server/index.js` (used by npm start).
const { app } = require("./server/index");

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`FPV Drone Builder 2.0 running on port ${PORT}`);
});
