import { env } from "./shared/config/env";
import { createApp } from "./shared/app";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT}`);
});
