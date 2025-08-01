import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import puppeteer from "puppeteer";

dotenv.config();

async function fetchPageContent(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });
    const html = await res.text();
    return html.length > 500 ? html : null;
  } catch {
    return null;
  }
}

async function fetchPageWithPuppeteer(url) {
  // 🔁 Rewriting LinkedIn collection URLs to direct job post if needed
  if (
    url.includes("linkedin.com/jobs/collections") &&
    url.includes("currentJobId=")
  ) {
    const jobId = new URL(url).searchParams.get("currentJobId");
    if (jobId) {
      url = `https://www.linkedin.com/jobs/view/${jobId}`;
    }
  }

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle2" });

  await page
    .waitForSelector(".description__text", { timeout: 10000 })
    .catch(() => {
      console.warn("⚠️ Description text not found in time.");
    });

  const pageUrl = page.url();
  const isLinkedInLogin = pageUrl.includes("/login");

  if (isLinkedInLogin || (await page.$("input#session_password"))) {
    await page.type("#username", process.env.LINKEDIN_EMAIL);
    await page.type("#password", process.env.LINKEDIN_PASSWORD);
    await page.click("button[type='submit']");

    try {
      await page.waitForNavigation({
        waitUntil: "networkidle2",
        timeout: 10000,
      });
    } catch {
      console.warn("⚠️ No navigation after login, waiting for content...");
      await page.waitForTimeout(5000);
    }

    await page.goto(url, { waitUntil: "networkidle2" });
  }

  const html = await page.content();
  await page.screenshot({ path: "linkedin-job.png", fullPage: true });
  await browser.close();
  return html;
}

function extractCleanText(html) {
  const $ = cheerio.load(html);
  $("script, style, iframe, img, noscript").remove();
  const text =
    $("body").text().trim() ||
    $("main").text().trim() ||
    $("html").text().trim();
  return text.replace(/\s+/g, " ").slice(0, 7000);
}

async function getStructuredJobData(text) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error("Missing OpenRouter API key");

  const prompt = `
Extract the following fields from the job post. Be as accurate and detailed as possible.

Return only raw JSON — do not wrap in code blocks.

{
  "title": "Job title",
  "company": "Company name",
  "location": "City, state, remote, or hybrid",
  "description": "Full description of the role",
  "requirements": "List of key qualifications or expectations",
  "salary": "Any salary info mentioned",
  "duration": "If internship, how long?",
  "remote": "true/false if it's remote-friendly",
  "application_deadline": "If listed",
  "job_type": "Full-time, part-time, contract, etc",
  "posted_date": "When it was posted",
  "benefits": "Any listed benefits",
  "contact": "Contact name or email if available"
}

Here is the job text:
"""${text}"""
`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You extract job info into structured JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "{}";
}

export async function POST(req) {
  try {
    const { url } = await req.json();

    let html = await fetchPageContent(url);
    if (!html || html.includes("Sign in") || html.length < 100) {
      html = await fetchPageWithPuppeteer(url);
    }

    const text = extractCleanText(html);
    if (text.length < 100) {
      return NextResponse.json(
        { success: false, error: "Not enough readable job info found" },
        { status: 400 }
      );
    }

    const aiReply = await getStructuredJobData(text);
    return NextResponse.json({ success: true, data: aiReply });
  } catch (err) {
    console.error("❌ AI extraction failed:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Server Error" },
      { status: 500 }
    );
  }
}
