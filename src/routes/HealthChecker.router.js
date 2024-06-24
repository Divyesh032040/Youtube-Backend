import { Router } from "express";
import { healthChecker } from "../controllers/HealthCheck.controller.js";

const healthCheckerRouter = Router();

healthCheckerRouter.route("/").get(healthChecker);

export default healthCheckerRouter;