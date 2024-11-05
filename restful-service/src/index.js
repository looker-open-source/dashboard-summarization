/*

MIT License

Copyright (c) 2023 Looker Data Sciences, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io')
const {VertexAI} = require('@google-cloud/vertexai');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
dotenv.config();

const storedClientSecret = process.env.GENAI_CLIENT_SECRET

app.use(express.json()); // To parse JSON bodies

const writeStructuredLog = (message) => {
    // Complete a structured log entry.
   return {
        severity: 'INFO',
        message: message,
        // Log viewer accesses 'component' as 'jsonPayload.component'.
        component: 'dashboard-summarization-logs',
    }
}


// Middleware to verify client secret
const verifyClientSecret = (req, res, next) => {
    const clientSecret = req.body.client_secret;
    console.log('checking client secret', clientSecret, storedClientSecret);
    if (clientSecret === storedClientSecret) {
        next();
    } else {
        res.status(403).send('Forbidden: Invalid client secret');
    }
};


// Initialize Vertex with your Cloud project and location
const vertexAI = new VertexAI({project: process.env.PROJECT, location: process.env.REGION});
// Instantiate the model
const generativeModel = vertexAI.getGenerativeModel({
    model: 'gemini-1.0-pro-001',
    generationConfig: {maxOutputTokens: 2500, temperature: 0.4, candidateCount: 1}
});
app.post('/generateQuerySummary', verifyClientSecret, async (req, res) => {
    const { query, description } = req.body; // Update to receive query and description
    try {
        // Replace this with your Vertex AI summarization logic
        const summary = await generateQuerySummary(generativeModel, query, description);
        res.json({ summary });
    } catch (e) {
        console.log('There was an error processing the individual query summary: ', e);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/generateSummary', verifyClientSecret, async (req, res) => {
    const { querySummaries, nextStepsInstructions } = req.body; // Update to receive rawQuerySummaries and nextStepsInstructions
    try {
        // Generate dashboard summary
        const summary = await generateSummary(generativeModel, querySummaries, nextStepsInstructions);
        res.json({ summary });
    } catch (e) {
        console.log('There was an error processing the dashboard summary: ', e);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/generateQuerySuggestions', verifyClientSecret, async (req, res) => {
    const { queryResults, querySummaries, nextStepsInstructions } = req.body; // Update to receive queryResults, querySummaries, and nextStepsInstructions
    try {
        // Generate query suggestions
        const suggestions = await generateQuerySuggestions(generativeModel, queryResults, querySummaries, nextStepsInstructions);
        res.json({ suggestions }); // Correct the response key to suggestions
    } catch (e) {
        console.log('There was an error processing the query suggestions: ', e);
        res.status(500).send('Internal Server Error');
    }
});

// for the individual query summary:
async function generateQuerySummary(generativeModel, query, description) {
    const context = `
    Dashboard Detail: ${description || ''} \n
    Query Details:  "Query Title: ${query.title} \n ${query.note_text !== '' || query.note_text !== null ? "Query Note: " + query.note_text : ''} \n Query Fields: ${query.queryBody.fields} \n Query Data: ${query.queryData} \n"
    `;
    const queryPrompt = `
    You are a specialized answering assistant that can summarize a Looker dashboard and the underlying data and propose operational next steps drawing conclusions from the Query Details listed above.
    
    You always answer with markdown formatting. You will be penalized if you do not answer with markdown when it would be possible.
    The markdown formatting you support: headings, bold, italic, links, tables, lists, code blocks, and blockquotes.
    You do not support images and never include images. You will be penalized if you render images. You will always format numerical values as either percentages or in dollar amounts rounded to the nearest cent. You should not indent any response.
    
    Your response for each dashboard query should always start on a new line in markdown, should not be indented and should include the following attributes starting with: 
    - \"Query Name\": is a markdown heading and should use the Query Title data from the "context." The query name itself should be on a newline and should not be indented.
    - \"Description\": should start on a newline, should not be indented and the generated description should be a paragraph starting on a newline. It should be 2-4 sentences max describing the query itself and should be as descriptive as possible.
    - \"Summary\": should be a blockquote, should not be indented and should be 3-5 sentences max summarizing the results of the query being as knowledgeable as possible with the goal to give the user as much information as needed so that they don't have to investigate the dashboard themselves. End with a newline,
    - \"Next Steps\" section which should contain 2-3 bullet points, that are not indented, drawing conclusions from the data and recommending next steps that should be clearly actionable followed by a newline 
    Each dashboard query summary should start on a newline, should not be indented, and should end with a divider. Below are details on the dashboard and queries. \n
    
    '''
    Context: ${context}
    '''

    Additionally here is an example of a formatted response in Markdown that you should follow, please use this as an example of how to structure your response and not verbatim copy the example text into your responses. \n
    
    ## Web Traffic Over Time \n
    This query details the amount of web traffic received to the website over the past 6 months. It includes a web traffic source field of organic, search and display
    as well as an amount field detailing the amount of people coming from those sources to the website. \n
    
    ## Summary \n
    > It looks like search historically has been driving the most user traffic with 9875 users over the past month with peak traffic happening in december at 1000 unique users.
    Organic comes in second and display a distant 3rd. It seems that display got off to a decent start in the year, but has decreased in volume consistently into the end of the year.
    There appears to be a large spike in organic traffic during the month of March a 23% increase from the rest of the year.
    \n
    
    ## Next Steps
    * Look into the data for the month of March to determine if there was an issue in reporting and/or what sort of local events could have caused the spike
    * Continue investing into search advertisement with common digital marketing strategies. IT would also be good to identify/breakdown this number by campaign source and see what strategies have been working well for Search.
    * Display seems to be dropping off and variable. Use only during select months and optimize for heavily trafficed areas with a good demographic for the site retention.\n
    \n
    `;
    const prompt = {
        contents: [
            {
                role: 'user', parts:[
                    {
                        text: queryPrompt
                    }
                ]
            }
        ]
    };

    const formattedResp = await generativeModel.generateContent(prompt);
    return formattedResp.response.candidates[0].content.parts[0].text;
}


// for the dashboard summary:
async function generateSummary(generativeModel, rawQuerySummaries, nextStepsInstructions) {
    const querySummaries = rawQuerySummaries.map(result => {
        return `
        ## ${result.title} \n
        ${result.note_text ? "Query Note: " + result.note_text : ''} \n
        Query Data: ${result.data} \n
        `;
    }).join('\n');

    const finalPromptData = `
    You are a specialized answering assistant that can summarize a Looker dashboard and the underlying data and propose operational next steps drawing conclusions from the Query Details listed above. Follow the instructions below:

    Please highlight the findings of all of the query data here. All responses MUST be based on the actual information returned by these queries: \n                            
    data: ${querySummaries}

    For example, use the names of the locations in the data series (like Seattle, Indianapolis, Chicago, etc) in recommendations regarding locations. Use the name of a process if discussing processes. Don't use row numbers to refer to any facility, process or location. This information should be sourced from the above data.
    Surface the most important or notable details and combine next steps recommendations into one bulleted list of 2-6 suggestions. \n 
    --------------
    Here is an output format Example:
        ---------------
        
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

    const finalPrompt = {
        contents: [{ role: 'user', parts: [{ text: finalPromptData }] }]
    };

    const formattedResp = await generativeModel.generateContent(finalPrompt);
    return formattedResp.response.candidates[0].content.parts[0].text;
}

async function generateQuerySuggestions(generativeModel, queryResults, querySummaries, nextStepsInstructions) {

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

    const querySuggestionsPrompt = {
        contents: [{ role: 'user', parts: [{ text: querySuggestionsPromptData }] }]
    };

    const querySuggestionsResp = await generativeModel.generateContent(querySuggestionsPrompt);
    return querySuggestionsResp.response.candidates[0].content.parts[0].text;
}


const PORT = process.env.PORT ? process.env.PORT : 5000

server.listen(PORT, () => {
    console.log("Listening on: ", PORT)
})