import express from "express";
import { start } from "workflow/api";
import { generateInsightWorkflow } from "./workflows/aiInsight.js";

const app = express();
app.use(express.json());

// This is a test endpoint to trigger the workflow
app.post("/api/workflows/test", async (req, res) => {
    try {
        const { id } = await start(generateInsightWorkflow, "test-user-id");
        res.json({ message: "Workflow started successfully!", workflowId: id });
    } catch (err) {
        console.error("Workflow Start Error:", err);
        res.status(500).json({ error: err.message });
    }
});

export default app;
