import express from "express";
import { GeminiService } from "./services/gemini";
import { sendMail, getAuthUrl, setTokensFromCode } from "./services/mailer.ts";
import { logSentEmail, getSentEmails, prisma, addViewedTimestamp } from "./db";
import path from "path";
import fs from "fs/promises";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

export const app = express();
app.use(express.json());
app.use(cors({ origin: "https://www.linkedin.com" }));

async function detectJobTypeAndStatus(email: string, postContent = "") {
  const content = postContent.toLowerCase();
  const sentEmails = await getSentEmails();
  const alreadySent = sentEmails.find(e => e.email === email && ["SENT", "AWAITING_CONFIRMATION"].includes(e.status));
  if (alreadySent) return { jobType: "unknown", status: "ALREADY_SENT" };
  if (/(remote|work from home|wfh|anywhere)/.test(content)) return { jobType: "remote", status: "SENT" };
  if (/(onsite|on-site|in office|in-office|office only|relocation|office|work from office|workfromoffice)/.test(content)) return { jobType: "onsite", status: "AWAITING_CONFIRMATION" };
  return { jobType: "unknown", status: "SENT" };
}   

function highlightKeywords(text: string) {
  const keywords = ["remote", "work from home", "wfh", "anywhere", "onsite", "on-site", "in office", "in-office", "office only", "relocation"];
  let highlighted = text;
  keywords.forEach(kw => {
    highlighted = highlighted.replace(new RegExp(`(${kw})`, "gi"), '<mark>$1</mark>');
  });
  return highlighted;
}

// Gmail OAuth2 endpoints
// 1. GET /auth/gmail -> Redirects user to Google consent screen
app.get("/auth/gmail", (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});
// 2. GET /oauth2callback -> Handles Google's redirect, exchanges code for tokens
app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).send("Missing code");
  try {
    const tokens = await setTokensFromCode(code);
    // Show tokens to user (instruct to copy refresh_token to .env)
    res.send(
      `<pre>${JSON.stringify(
        tokens,
        null,
        2
      )}</pre><p>Copy the refresh_token to your .env as GMAIL_REFRESH_TOKEN</p>`
    );
  } catch (err) {
    res
      .status(500)
      .send(
        "OAuth2 error: " + (err instanceof Error ? err.message : String(err))
      );
  }
});

// Tracking pixel endpoint
app.get("/track/:emailId", async (req, res) => {
    const { emailId } = req.params;
    
    try {
      await addViewedTimestamp(parseInt(emailId));
      
      // Return a 1x1 transparent GIF
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(pixel);
    } catch (err) {
      console.error('Tracking error:', err);
      // Still return pixel to avoid errors in email client
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.setHeader('Content-Type', 'image/gif');
      res.send(pixel);
    }
  });
  
// POST /send-resume
app.post("/send-resume", async (req, res) => {
  const { email, postContent } = req.body;
  // Look for resume file in resumes/ folder
  const resumePath = path.join(process.cwd(), "public", "resumes", "Kuldeep_Resume.pdf");
  try {
    await fs.access(resumePath);
  } catch {
    return res
      .status(400)
      .json({ success: false, error: "Resume file not found." });
  }
  // Detect job type and status
  const { jobType, status } = await detectJobTypeAndStatus(email, postContent);
  if (status === "ALREADY_SENT") {
    return res.json({ success: false, jobType, status });
  }
  try {
    const savedEmail = await logSentEmail(email, postContent, status);
    if (status === "SENT") {
      await sendMail({
        to: email,
        attachments: resumePath ? [{ path: resumePath }] : [],
        emailId: savedEmail.id
      });
    }
    res.json({ success: true, jobType, status });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

// PATCH /sent-emails/:id to update status
app.patch("/sent-emails/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    await prisma.sentEmail.update({
      where: { id: parseInt(id) },
      data: { status }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

// GET /sent-emails
app.get("/sent-emails", async (req, res) => {
  try {
    const emails = await getSentEmails();
    const emailsWithHighlight = emails.map(e => ({ 
      ...e, 
      highlightedPostContent: highlightKeywords(e.postContent || "") 
    }));
    res.json(emailsWithHighlight);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

// POST /gemini/generate
app.post("/gemini/generate", async (req, res) => {
  const { prompt } = req.body;
  try {
    const result = await GeminiService.generateMessage(prompt);
    res.json({ result });
  } catch (err) {
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Serve the dashboard UI
app.get('/dashboard', async (req, res) => {
  const html = await fs.readFile(path.join(process.cwd(), 'index.html'), 'utf-8');
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Serve the Tinder-style UI
app.get('/tinder', async (req, res) => {
  const html = await fs.readFile(path.join(process.cwd(), 'tinder.html'), 'utf-8');
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`API server running on http://localhost:${PORT}`);
// });
