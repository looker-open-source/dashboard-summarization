const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");
const server = http.createServer(app);
const fetch = require("node-fetch"); // Import node-fetch
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
dotenv.config();

const storedClientSecret = process.env.GENAI_CLIENT_SECRET;
const PROJECT_ID = process.env.PROJECT;
const REGION = process.env.REGION || "us-central1"; // Default region
const MODEL_ID = process.env.MODEL_ID || "gemini-2.0-flash"; // Default model, now from env
const API_ENDPOINT = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/${MODEL_ID}:generateContent`;

app.use(express.json());
app.use(cors());

const writeStructuredLog = (message) => {
  return {
    severity: "INFO",
    message: message,
    component: "dashboard-summarization-logs",
  };
};

// Middleware to verify client secret
const verifyClientSecret = (req, res, next) => {
  const clientSecret = req.body.client_secret;
  if (clientSecret === storedClientSecret) {
    next();
  } else {
    res.status(403).send("Forbidden: Invalid client secret");
  }
};

// Helper function to get Google Cloud access token
async function getAccessToken() {
  try {
    const { GoogleAuth } = require("google-auth-library");
    const auth = new GoogleAuth({
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token;
  } catch (error) {
    console.error("Error getting access token:", error);
    throw error; // Re-throw to be caught by caller
  }
}

// --- API Endpoint Handlers (using REST API) ---

app.post("/generateQuerySummary", verifyClientSecret, async (req, res) => {
  const { query, description, nextStepsInstructions } = req.body;
  try {
    const summary = await generateQuerySummary(
      query,
      description,
      nextStepsInstructions
    );
    res.json({ summary });
  } catch (e) {
    console.error("Error in /generateQuerySummary:", e);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/generateSummary", verifyClientSecret, async (req, res) => {
  const { querySummaries, nextStepsInstructions, linkedDashboardSummaries } =
    req.body;
  try {
    const summary = await generateSummary(
      querySummaries,
      nextStepsInstructions,
      linkedDashboardSummaries
    );
    res.json({ summary });
  } catch (e) {
    console.error("Error in /generateSummary:", e);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/generateQuerySuggestions", verifyClientSecret, async (req, res) => {
  const { queryResults, querySummaries, nextStepsInstructions } = req.body;
  try {
    const suggestions = await generateQuerySuggestions(
      queryResults,
      querySummaries,
      nextStepsInstructions
    );
    res.json({ suggestions });
  } catch (e) {
    console.error("Error in /generateQuerySuggestions:", e);
    res.status(500).send("Internal Server Error");
  }
});

// --- Helper Functions (using REST API) ---

async function generateQuerySummary(query, description, nextStepsInstructions) {
  const accessToken = await getAccessToken();
  const prompt = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: getQuerySummaryPrompt(
              query,
              description,
              nextStepsInstructions
            ),
          },
        ],
      },
    ],
  };

  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(prompt),
  });

  if (!response.ok) {
    const errorText = await response.text(); // Get error message
    throw new Error(
      `API request failed with status ${response.status}: ${errorText}`
    );
  }
  const data = await response.json();

  if (data.error) {
    throw new Error(`Vertex AI API error: ${data.error.message}`);
  }

  return data.candidates[0]?.content?.parts[0]?.text || "";
}

function getQuerySummaryPrompt(query, description, nextStepsInstructions) {
  return `
    Summary style/specialized instructions: ${nextStepsInstructions || ""}
    Dashboard Detail: ${description || ""} \n
    Query Details:  "Query Title: ${query.title} \n ${
    query.note_text ? "Query Note: " + query.note_text : ""
  } \n Query Fields: ${query.queryBody.fields} \n Query Data: ${JSON.stringify(
    query.queryData
  )} \n"
    `;
}

async function generateSummary(
  querySummaries,
  nextStepsInstructions,
  linkedDashboardSummaries = []
) {
  const accessToken = await getAccessToken();
  const finalPromptData = `
    You are a specialized answering assistant that can summarize a Looker dashboard and the underlying data and propose operational next steps drawing conclusions from the Query Details listed above. Follow the instructions below:

    Please highlight the findings of all of the query data here. All responses MUST be based on the actual information returned by these queries: \n                                     
    data: ${querySummaries.join("\n")}
    
    ${
      linkedDashboardSummaries.length > 0
        ? `
    Additionally, the following linked dashboards were analyzed and their summaries are included:
    ${linkedDashboardSummaries
      .map(
        (dashboard) => `
    ## ${dashboard.dashboardTitle}
    ${dashboard.summaries.join("\n")}
    `
      )
      .join("\n")}
    `
        : ""
    }

    For example, use the names of the locations in the data series (like Seattle, Indianapolis, Chicago, etc) in recommendations regarding locations. Use the name of a process if discussing processes. Don't use row numbers to refer to any facility, process or location. This information should be sourced from the above data.
    Surface the most important or notable details and combine next steps recommendations into one bulleted list of 2-6 suggestions. \n
    --------------
    Here is an output format Example:
    ----------------
    
    ## Web Traffic Over Time \n
    This query details the amount of web traffic received to the website over the past 6 months. It includes a web traffic source field of organic, search and display
    as well as an amount field detailing the amount of people coming from those sources to the website. \n
    
    > It looks like search historically has been driving the most user traffic with 9875 users over the past month with peak traffic happening in december at 1000 unique users.
    Organic comes in second and display a distant 3rd. It seems that display got off to a decent start in the year, but has decreased in volume consistently into the end of the year.
    There appears to be a large spike in organic traffic during the month of March a 23% increase from the rest of the year.\n
    \n
    
    ## Next Steps
    * Look into the data for the month of March to determine if there was an issue in reporting and/or what sort of local events could have caused the spike
    * Continue investing into search advertisement with common digital marketing strategies. IT would also be good to identify/breakdown this number by campaign source and see what strategies have been working well for Search.
    * Display seems to be dropping off and variable. Use only during select months and optimize for heavily trafficed areas with a good demographic for the site retention.\n
    \n
    -----------

    Please add actionable next steps, both for immediate intervention, improved data gathering and further analysis of existing data.
    Here are some tips for creating actionable next steps: \n
    -----------
    ${nextStepsInstructions}
    -----------
    
    `;
  const prompt = {
    contents: [{ role: "user", parts: [{ text: finalPromptData }] }],
  };
  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(prompt),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed with status ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Vertex AI API error: ${data.error.message}`);
  }
  return data.candidates[0]?.content?.parts[0]?.text || "";
}

async function generateQuerySuggestions(
  queryResults,
  querySummaries,
  nextStepsInstructions
) {
  const accessToken = await getAccessToken();
  const querySuggestionsPromptData = `
    You are an analyst that will generate potential next-step investigation queries in json format.
    Please provide suggestions of queries or data exploration that could be done to further investigate the data. \n
    The output should be a JSON array of strings, each string representing a query or data exploration suggestion. \n
    These should address the potential next steps in analysis, with this criteria: ${nextStepsInstructions} \n
    They should be actionable and should be able to be executed in Looker. \n
    Here is data related to what is currently known and shown. These kind of queries do not need to be repeated: \n                                     
    
    data: ${queryResults} \n

    Here are the previous analysis and next steps. Queries should be related to these next steps or issues:
    ${querySummaries} \n

    Please include a date filter in EVERY query request, by adding the last 30 days if there is no other relevant date filter.
    Here is the desired output format for the response, with exactly three querySuggestion elements: \n
    ---------
    '''json
    [
        {"querySuggestion": "Show me the top XXX entries for YYY on October 13th, 2024"},
        {"querySuggestion": "What are the lowest values for ZZZ, grouped by AAA, in the last 30 days?"},
        {"querySuggestion": "What is the producitivity and standard deviation for the XXX facility for the past 3 months?"}
    ]
    '''
    ----------
    
    `;

  const prompt = {
    contents: [{ role: "user", parts: [{ text: querySuggestionsPromptData }] }],
  };
  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(prompt),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed with status ${response.status}: ${errorText}`
    );
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(`Vertex AI API error: ${data.error.message}`);
  }
  return data.candidates[0]?.content?.parts[0]?.text || "";
}

const PORT = process.env.PORT ? process.env.PORT : 5000;

server.listen(PORT, () => {
  console.log("Listening on: ", PORT);
});
