import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import config from "./app/config";
import router from "./app/routes";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (_req: Request, res: Response) => {
  res.send(`Server running on port ${config.port}`);
});

app.use("/api/v1", router);

app.use(globalErrorHandler);
app.use(notFound);

export default app;
