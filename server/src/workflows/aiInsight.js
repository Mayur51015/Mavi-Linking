import { sleep } from "workflow";

export async function generateInsightWorkflow(userId) {
  "use workflow";
  
  // Step 1: Simulated AI Call
  console.log(`[Workflow] Starting AI insight generation for user: ${userId}...`);
  
  // Pause for 5 seconds without consuming memory/resources
  await sleep("5s"); 
  
  console.log(`[Workflow] Finished AI insight generation for user: ${userId}!`);
  
  return { success: true, userId, status: "completed" };
}
