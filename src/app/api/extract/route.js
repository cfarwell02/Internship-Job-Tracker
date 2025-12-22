import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import dotenv from "dotenv";

dotenv.config();

/**
 * Attempts to fetch page content using a standard fetch request.
 * Returns HTML if successful and content length is sufficient, otherwise null.
 * @param {string} url - The URL to fetch.
 * @returns {Promise<string|null>} The HTML content or null.
 */

async function fetchPageContent(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
      // Adding a timeout for the fetch request to prevent hanging
      signal: AbortSignal.timeout(15000), // 15 seconds timeout
    });

    if (!res.ok) {
      console.warn(
        `⚠️ fetchPageContent failed with status: ${res.status} for ${url}`
      );
      return null;
    }

    const html = await res.text();

    // Check if the HTML content is substantial enough to be useful.
    // A very short HTML might indicate a redirect, an error page, or a login gate.
    return html.length > 500 ? html : null;
  } catch (err) {
    // Catch fetch errors like network issues or timeouts
    console.warn("⚠️ fetchPageContent failed:", err.message);
    return null;
  }
}

/**
 * Fetches page content using Puppeteer, handling dynamic content and logins.
 * @param {string} url - The URL to fetch.
 * @returns {Promise<string|null>} The HTML content or null.
 */
async function fetchPageWithPuppeteer(url) {
  let browser;
  try {
    let puppeteer;
    let launchOptions = { headless: true };
    const isVercel = !!process.env.VERCEL;

    if (isVercel) {
      const chromium = (await import("@sparticuz/chromium")).default;
      puppeteer = await import("puppeteer-core");
      launchOptions = {
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        defaultViewport: chromium.defaultViewport,
      };
    } else {
      puppeteer = await import("puppeteer");
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "stylesheet", "font", "media"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    // Navigate to the URL, waiting for the DOM to be loaded. This is faster than networkidle2.
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 }); // Increased timeout for initial load

    const pageUrl = page.url();

    // LinkedIn login handling
    if (
      pageUrl.includes("linkedin.com/login") ||
      (await page.$("input#session_password"))
    ) {
      await page.type("#username", process.env.LINKEDIN_EMAIL);
      await page.type("#password", process.env.LINKEDIN_PASSWORD);
      await Promise.allSettled([
        page.click("button[type='submit']"),
        // Wait for the page to fully load after login, 'load' is generally faster than 'networkidle2'
        page
          .waitForNavigation({ waitUntil: "load", timeout: 20000 })
          .catch(() =>
            console.warn("⏳ LinkedIn: post-login navigation wait failed")
          ),
      ]);
      // After successful login, navigate back to the original job URL if not already there
      if (page.url() !== url) {
        await page.goto(url, { waitUntil: "load", timeout: 20000 });
      }
    }

    // Handshake Login handling
    if (url.includes("joinhandshake.com")) {
      // 1. Check for 'Enter email' screen and type email
      const emailInputSelector = "input[type='email']";
      const emailInput = await page
        .waitForSelector(emailInputSelector, { timeout: 10000 })
        .catch(() => null);

      if (emailInput) {
        await emailInput.type(process.env.HANDSHAKE_EMAIL);

        // Wait for and click the 'Next' button
        const nextBtn = await page
          .waitForFunction(
            (text) => {
              const buttons = Array.from(document.querySelectorAll("button"));
              return buttons.find((btn) => btn.textContent?.trim() === text);
            },
            { timeout: 10000 }, // Wait up to 10 seconds for the button
            "Next"
          )
          .catch(() => null);

        if (nextBtn) {
          await Promise.allSettled([
            nextBtn.click(),
            page
              .waitForNavigation({
                waitUntil: "domcontentloaded",
                timeout: 15000,
              })
              .catch(() =>
                console.warn(
                  "⏳ Handshake: No nav after email Next. Continuing..."
                )
              ),
          ]);
        } else {
          console.warn(
            "⚠️ Handshake: Could not find 'Next' button after typing email."
          );
        }
      } else {
        console.warn(
          "⚠️ Handshake: Email input field not found. Assuming already past email step or different flow."
        );
      }

      // 2. Click "Continue with email" (as an <a> tag) - this might appear after the email step
      const contLinkSelector =
        "a[href*='requested_authentication_method=standard']";
      const contLink = await page
        .waitForSelector(contLinkSelector, { visible: true, timeout: 10000 })
        .catch(() => null);

      if (contLink) {
        await Promise.allSettled([
          contLink.click(),
          page
            .waitForNavigation({
              waitUntil: "domcontentloaded",
              timeout: 15000,
            })
            .catch(() =>
              console.warn(
                "⏳ Handshake: No nav after 'Continue with email'. Continuing..."
              )
            ),
        ]);
      } else {
        console.warn(
          "❌ Handshake: Could not find 'Continue with email' link or it was not visible."
        );
      }

      // 3. Enter password
      const pwInputSelector = "input[type='password']";
      const pwInput = await page
        .waitForSelector(pwInputSelector, { timeout: 10000 })
        .catch(() => null);

      if (pwInput) {
        await pwInput.type(process.env.HANDSHAKE_PASSWORD);

        // Wait for and click the 'Log in' button
        const loginBtn = await page
          .waitForFunction(
            (text) => {
              const buttons = Array.from(document.querySelectorAll("button"));
              return buttons.find((btn) => btn.textContent?.trim() === text);
            },
            { timeout: 10000 }, // Wait up to 10 seconds for the button
            "Log in"
          )
          .catch(() => null);

        if (loginBtn) {
          await Promise.allSettled([
            loginBtn.click(),
            page
              .waitForNavigation({ waitUntil: "load", timeout: 25000 })
              .catch(() =>
                console.warn("⏳ Handshake: No nav after Login. Continuing...")
              ),
          ]);
        } else {
          console.warn("⚠️ Handshake: Could not find 'Log in' button.");
        }
      } else {
        console.warn(
          "⚠️ Handshake: Password input field not found. Assuming login not required or different flow."
        );
      }

      // 4. Return to original job URL if not already there after login
      if (page.url() !== url) {
        await Promise.race([
          page.goto(url, { waitUntil: "domcontentloaded" }),
          new Promise((res) => setTimeout(res, 5000)), // fallback race
        ]);
      }
    }

    const html = await page.content();
    return html;
  } catch (err) {
    console.error("❌ Puppeteer fetch failed:", err);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Extracts clean text from HTML using cheerio.
 * @param {string} html - The HTML content.
 * @returns {string} The cleaned text.
 */
function extractCleanText(html) {
  const $ = cheerio.load(html);
  // Remove scripts, styles, iframes, images, and noscript tags to clean up the text
  $(
    "script, style, iframe, img, noscript, header, footer, nav, form, .hidden, [aria-hidden='true']"
  ).remove();

  // Prioritize main content areas for text extraction
  const text =
    $("article").text().trim() ||
    $("main").text().trim() ||
    $("body").text().trim() ||
    $("html").text().trim();

  // Replace multiple spaces with a single space and limit length
  const cleaned = text.replace(/\s+/g, " ").slice(0, 7000);

  return cleaned;
}

/**
 * Attempts to pull structured JobPosting data from JSON-LD blocks before using AI.
 * @param {string} html - The HTML content.
 * @returns {object|null} Mapped job fields or null if none found.
 */
function extractJsonLdJob(html) {
  const $ = cheerio.load(html);
  let jobData = null;

  $("script[type='application/ld+json']").each((_, el) => {
    try {
      const raw = $(el).contents().text();
      const parsed = JSON.parse(raw);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];

      for (const candidate of candidates) {
        if (
          candidate["@type"] === "JobPosting" ||
          (Array.isArray(candidate["@type"]) &&
            candidate["@type"].includes("JobPosting"))
        ) {
          jobData = candidate;
          return false; // break out of cheerio loop
        }
      }
    } catch {
      // Ignore malformed JSON-LD blocks
    }
    return undefined;
  });

  if (!jobData) return null;

  const cleanDescription = jobData.description
    ? cheerio.load(jobData.description).text().trim()
    : "";

  const salaryInfo =
    jobData.baseSalary?.value?.unitText && jobData.baseSalary?.value?.value
      ? `${jobData.baseSalary.value.value} ${jobData.baseSalary.value.unitText}`
      : jobData.baseSalary?.value?.currency
        ? `${jobData.baseSalary.value.currency}`
        : jobData.baseSalary?.value?.toString?.() || "";

  const jobLocation =
    jobData.jobLocation?.address?.addressLocality ||
    jobData.jobLocation?.address?.addressRegion ||
    jobData.jobLocation?.address?.addressCountry ||
    jobData.jobLocation?.address?.streetAddress ||
    jobData.jobLocation?.address?.postalCode ||
    jobData.jobLocation?.address?.addressLocality;

  return {
    title: jobData.title || "",
    company: jobData.hiringOrganization?.name || "",
    location: jobLocation || jobData.jobLocationType || "",
    description: cleanDescription,
    requirements:
      Array.isArray(jobData.skills)
        ? jobData.skills.join(", ")
        : jobData.qualifications || "",
    salary: salaryInfo,
    duration: jobData.employmentType || "",
    remote:
      jobData.jobLocationType === "TELECOMMUTE" ||
      jobData.jobLocationType === "REMOTE" ||
      jobData.jobLocationType === "Hybrid",
    application_deadline: jobData.validThrough || "",
    job_type: jobData.employmentType || "",
    posted_date: jobData.datePosted || "",
    benefits: Array.isArray(jobData.jobBenefits)
      ? jobData.jobBenefits.join(", ")
      : jobData.jobBenefits || "",
    contact: jobData.hiringOrganization?.sameAs || "",
  };
}

/**
 * Calls an external AI API to get structured job data from text.
 * @param {string} text - The cleaned job description text.
 * @returns {Promise<string>} The JSON string of structured job data.
 */
async function getStructuredJobData(text) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      "Missing OpenRouter API key. Please set OPENROUTER_API_KEY in your .env file."
    );
    throw new Error("Missing OpenRouter API key");
  }

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

  // Implement exponential backoff for AI API calls
  const maxRetries = 3;
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo", // Using GPT-3.5-turbo for speed
          messages: [
            {
              role: "system",
              content: "You extract job info into structured JSON.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.3, // Lower temperature for more consistent extraction
        }),
        signal: AbortSignal.timeout(30000), // 30 seconds timeout for AI API call
      });

      const raw = await res.text();

      if (!res.ok) {
        console.error(
          `❌ AI API call failed with status: ${res.status}, response: ${raw}`
        );
        throw new Error(`AI API error: ${res.statusText}`);
      }

      const data = JSON.parse(raw);
      // Ensure the response structure is as expected
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try {
          // Attempt to parse the content to ensure it's valid JSON
          JSON.parse(content);
          return content;
        } catch (jsonErr) {
          console.warn("⚠️ AI returned invalid JSON. Retrying...", jsonErr);
          // If AI returns invalid JSON, treat as a retryable error
          throw new Error("Invalid JSON from AI");
        }
      } else {
        console.warn("⚠️ AI response missing expected content. Retrying...");
        throw new Error("AI response content missing");
      }
    } catch (err) {
      attempt++;
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        // console.warn(`Retrying AI extraction in ${delay / 1000} seconds... (Attempt ${attempt}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error("❌ AI extraction failed after multiple retries:", err);
        return "{}"; // Return empty JSON on final failure
      }
    }
  }
  return "{}"; // Should not be reached, but as a fallback
}

export async function POST(req) {
  try {
    let { url } = await req.json();

    // Input validation for URL
    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing URL" },
        { status: 400 }
      );
    }

    // Normalize Handshake URLs
    if (url.includes("joinhandshake.com/job-search/")) {
      const jobIdMatch = url.match(/job-search\/(\d+)/);
      if (jobIdMatch) {
        const jobId = jobIdMatch[1];
        url = `https://app.joinhandshake.com/jobs/${jobId}`;
      }
    }

    // Normalize LinkedIn recommended/collections URLs
    if (
      url.includes("linkedin.com/jobs/collections") &&
      url.includes("currentJobId=")
    ) {
      const jobIdMatch = url.match(/currentJobId=(\d+)/);
      if (jobIdMatch) {
        const jobId = jobIdMatch[1];
        url = `https://www.linkedin.com/jobs/view/${jobId}`;
      }
    }

    // Attempt initial fetch with standard fetch
    let html = await fetchPageContent(url);

    // Determine if Puppeteer is needed
    const loginGateKeywords = [
      "Sign in",
      "Sign up",
      "Enter your email",
      "Get connected",
      "Log in", // Added "Log in" as a common keyword
      "Join now", // Added "Join now"
      "Create account", // Added "Create account"
    ];

    // Use Puppeteer if initial fetch failed, content is too short, or login keywords are present.
    // Increased the threshold for HTML length to be more aggressive about using Puppeteer
    const shouldUsePuppeteer =
      !html ||
      html.length < 10000 || // Adjusted threshold: if less than 10KB, try Puppeteer
      loginGateKeywords.some((kw) => html.includes(kw));

    if (shouldUsePuppeteer) {
      html = await fetchPageWithPuppeteer(url);
    }

    if (!html) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to retrieve page content after all attempts.",
        },
        { status: 500 }
      );
    }

    const text = extractCleanText(html);

    if (text.length < 100) {
      const structured = extractJsonLdJob(html);
      if (structured) {
        return NextResponse.json({ success: true, data: structured });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Not enough readable job info found on the page.",
          },
          { status: 400 }
        );
      }
    }

    const structured = extractJsonLdJob(html);
    if (structured) {
      return NextResponse.json({ success: true, data: structured });
    }

    const aiReply = await getStructuredJobData(text);

    return NextResponse.json({ success: true, data: JSON.parse(aiReply) }); // Parse AI reply before sending
  } catch (err) {
    console.error("❌ Job extraction process failed:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Server Error during job extraction",
      },
      { status: 500 }
    );
  }
}
