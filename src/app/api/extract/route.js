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
  } catch (err) {
    console.warn("⚠️ fetchPageContent failed:", err);
    return null;
  }
}

async function fetchPageWithPuppeteer(url) {
  const browser = await puppeteer.launch({
    headless: "new",
    slowMo: 100,
  });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
  );

  await page.goto(url, { waitUntil: "domcontentloaded" });

  const pageUrl = page.url();

  // LinkedIn login
  if (
    pageUrl.includes("linkedin.com/login") ||
    (await page.$("input#session_password"))
  ) {
    await page.type("#username", process.env.LINKEDIN_EMAIL);
    await page.type("#password", process.env.LINKEDIN_PASSWORD);
    await Promise.all([
      page.click("button[type='submit']"),
      page
        .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 10000 })
        .catch(() => console.warn("⏳ LinkedIn: wait failed")),
    ]);
    await page.goto(url, { waitUntil: "networkidle2" });
  }

  // ✅ Handshake Login (Full Debug Flow)
  if (url.includes("joinhandshake.com")) {
    // 1. Check for 'Enter email' screen (Edge/clean browser scenario)
    const emailInput = await page.$("input[type='email']");
    if (emailInput) {
      await emailInput.type(process.env.HANDSHAKE_EMAIL);

      const nextBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll("button")).find(
          (btn) => btn.textContent?.trim() === "Next"
        );
      });

      if (nextBtn) {
        await Promise.all([
          nextBtn.asElement().click(),
          page
            .waitForNavigation({
              waitUntil: "domcontentloaded",
              timeout: 10000,
            })
            .catch(() => console.warn("⏳ No nav after Next. Continuing...")),
        ]);
      } else {
        console.warn("⚠️ Could not find 'Next' button after typing email.");
      }
    }

    // 2. Click "Continue with email" (as an <a> tag)

    const contLink = await page.$(
      "a[href*='requested_authentication_method=standard']"
    );
    if (contLink) {
      await Promise.all([
        contLink.click(),
        page
          .waitForNavigation({
            waitUntil: "domcontentloaded",
            timeout: 10000,
          })
          .catch(() =>
            console.warn("⏳ No nav after 'Continue with email'. Continuing...")
          ),
      ]);
    } else {
      console.warn("❌ Could not find 'Continue with email' link.");
      await page.screenshot({
        path: "continue-link-missing.png",
        fullPage: true,
      });
    }

    // 3. Enter password
    const pwInput = await page
      .waitForSelector("input[type='password']", { timeout: 10000 })
      .catch(() => null);
    if (pwInput) {
      await pwInput.type(process.env.HANDSHAKE_PASSWORD);

      const loginBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll("button")).find(
          (btn) => btn.textContent?.trim() === "Log in"
        );
      });

      if (loginBtn && loginBtn.asElement()) {
        await Promise.all([
          loginBtn.asElement().click(),
          page
            .waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 })
            .catch(() => console.warn("⏳ No nav after Login. Continuing...")),
        ]);
      }
    }

    // 4. Return to original job URL

    await page.goto(url, { waitUntil: "networkidle2" });
  }

  const html = await page.content();
  const preview = html.slice(0, 500).replace(/\s+/g, " ");

  await page.screenshot({ path: "handshake-debug.png", fullPage: true });
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

  const cleaned = text.replace(/\s+/g, " ").slice(0, 7000);

  return cleaned;
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

  const raw = await res.text();

  try {
    const data = JSON.parse(raw);
    return data.choices?.[0]?.message?.content || "{}";
  } catch (err) {
    console.warn("⚠️ Failed to parse AI JSON:", err);
    return "{}";
  }
}

export async function POST(req) {
  try {
    let { url } = await req.json();

    // Normalize Handshake search URLs
    if (url.includes("joinhandshake.com/job-search/")) {
      const jobIdMatch = url.match(/job-search\/(\d+)/);
      if (jobIdMatch) {
        const jobId = jobIdMatch[1];
        url = `https://app.joinhandshake.com/jobs/${jobId}`;
        console.log(`🔁 Rewritten Handshake job URL: ${url}`);
      }
    }

    let html = await fetchPageContent(url);

    const loginGateKeywords = [
      "Sign in",
      "Sign up",
      "Enter your email",
      "Get connected",
    ];
    const shouldUsePuppeteer =
      !html ||
      html.length < 5000 ||
      loginGateKeywords.some((kw) => html.includes(kw));

    if (shouldUsePuppeteer) {
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
