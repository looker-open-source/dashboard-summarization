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
const { LookerNodeSDK, NodeSettingsIniFile } = require('@looker/sdk-node')

const io = new Server(server, {
    pingInterval: 120,
    pingTimeout: 3000,
    cors: {
        // configure this to extension url for CORS Security
        origin: '*'
    }
})

app.get('/', (req, res) => {
    res.send('<h1>Hello world</h1>');
});

// setup looker sdk
// Ignore any SDK environment variables for the node runtime
const settings = new NodeSettingsIniFile('')
const sdk = LookerNodeSDK.init40(settings)

async function runLookerQuery(id) {
    if(id !== '') {
        try {
            const { value } = await sdk.run_query({
                query_id:id,
                result_format:'csv',
                cache:true,
                limit:100
            })
            return value
        } catch(e) {
            console.log('There was an error calling Looker: ', e)
        }
    }
}
//


// Initialize Vertex with your Cloud project and location
const vertexAI = new VertexAI({project: 'looker-private-demo', location: 'us-central1'});
// Instantiate the model
const generativeModel = vertexAI.preview.getGenerativeModel({
    model: 'gemini-pro',
    generation_config: {max_output_tokens: 2500, temperature: 0.2, candidate_count: 1}
});

io.on('connection', async (socket) => {
  console.log("initial transport", socket.conn.transport.name); // prints "polling"

  socket.conn.once("upgrade", () => {
    // called when the transport is upgraded (i.e. from HTTP long-polling to WebSocket)
    console.log("upgraded transport", socket.conn.transport.name); // prints "websocket"
  });

  
  socket.on('my event', async (data) => {
    const querySummaries = []
    
    for (const query of JSON.parse(data).queries) {
        const queryData = await runLookerQuery(query.id)
        const context = `
        Dashboard Detail: ${JSON.parse(data).description || ''} \n
        Query Details: \n  "Query Title: ${query.title} ${query.note_text !== '' || query.note_text !== null ? "Query Note: " + query.note_text : ''} Query Fields: ${query.fields} \n Query Data: ${queryData}"
        `
        const prompt = {
            contents: [
                {
                    role: 'user', parts:[
                        {
                            text: `
                            You are a specialized answering assistant that can summarize a Looker dashboard and the underlying data and propose operational next steps.
                            
                            You always answer with markdown formatting. You will be penalized if you do not answer with markdown when it would be possible.
                            The markdown formatting you support: headings, bold, italic, links, tables, lists, code blocks, and blockquotes.
                            You do not support images and never include images. You will be penalized if you render images. You will always format numerical values as either percentages or in dollar amounts rounded to the nearest cent.
                            
                            Your response for each dashboard query should always start on a new line in markdown and include the following attributes starting with: 
                             - \"Query Name\": is a markdown heading and should use the "Query Title" from the "context." The query name itself should be on a newline.
                             - \"Description\": should start on a newline and the generated description should be a paragraph starting on a newline. It should be 2-4 sentences max describing the query itself, using detailed information from the "context" and should be as descriptive as possible.
                             - \"Summary\": should start with this image included <img src"https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/summarize_auto/default/24px.svg" height="10" width="10"/> and be 2-4 sentences max summarizing the results of the query being  as knowledgeable as possible with the goal to give the user as much information as needed so that they don't have to investigate the dashboard themselves and be a blockquote not including any bullet points. End with a newline,
                             - \"Next Steps\" section which should contain 2-3 bullet points drawing conclusions from the data and recommending next steps that should be clearly actionable followed by a newline 
                            Each dashboard query summary should start on a newline and end with a divider. Below are details on the dashboard and queries. The dashboard itself is an ecommerce dashboard focused on orders, users, web traffic, sales, inventory, and products. The data is updated in real time.
                            
                            '''
                            Context: ${context}
                            '''
                            
                            Additionally here is an example of a formatted response in Markdown that you should follow, please use this as an example of how to structure your response and not verbatim copy the example text into your responses:
                            ## Query Name \n
                            Web Traffic Over Time \n

                            ## Description \n
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
                            * Display seems to be dropping off and variable. Use only during select months and optimize for heavily trafficed areas with a good demographic for the site retention. \n
                            \n
                            `
                        }
                    ]
                }
            ]
        }

        
        const streamingResp = await generativeModel.generateContentStream(prompt)
        
        for await (const item of streamingResp.stream) {
            socket.emit('my broadcast event', item.candidates[0].content.parts[0].text)
        }
            
        querySummaries.push(
            JSON.stringify((await streamingResp.response).candidates[0].content.parts[0].text)
        )
    }

    const formattedResp = await generativeModel.generateContent(
        { contents: [{ role: 'user', parts: [{ text: `
            Please format the following data as the json object below

            data: ${JSON.stringify(querySummaries)}

            json object:
            [
            {
                query_name: ...,
                description: ...,
                summary: ...,
                next_steps: [
                    ...,
                ]
            },
            ]
            `
            }]
            }]
        }
    )
    socket.emit("complete",formattedResp.response.candidates[0].content.parts[0].text)
  })
  
  socket.on('connect', () => {
    console.log("Connected!")
    socket.broadcast.emit('my response', {
        data: 'Connected To Node Server'
    })
  })
  socket.on('disconnect', () => {
    socket.broadcast.emit('my response', {
        data: 'Disconnected'
    })
 });
});

const PORT = process.env.PORT ? process.env.PORT : 5000

server.listen(PORT, () => {
    console.log("Listening on: ", PORT)
})