import { useContext } from 'react'
import { ExtensionContext } from '@looker/extension-sdk-react'
import { SummaryDataContext } from '../contexts/SummaryDataContext'

const useSlackOauth = () => {
    const { extensionSDK } = useContext(ExtensionContext)
    const { formattedData, setInfo, setMessage } = useContext(SummaryDataContext)

    async function slackOauthImplicitFlow(){
        try {

            const response = await extensionSDK.oauth2Authenticate(
                `https://slack.com/oauth/v2/authorize`,
                {
                    client_id: process.env.SLACK_CLIENT_ID!,
                    scope: 'chat:write,channels:read',
                    // user_scope:'chat:write,channels:read',
                    response_type: 'code',
                    state:'some random state'
                },
                'GET'
                )
         
            const codeExchangeResponse = await extensionSDK.oauth2ExchangeCodeForToken(
                'https://slack.com/api/oauth.v2.access',
                {
                    client_id: process.env.SLACK_CLIENT_ID!,
                    code: response.code,
                    client_secret: process.env.SLACK_CLIENT_SECRET!
                }
            )
            
            publishMessage(codeExchangeResponse.access_token)
        } catch (e) {
            console.log("Error: ",e)
        }
    }

    function slackRichTextFormatter(querySummaries: any) {
        const blocks: any[] = [];
        (typeof(querySummaries) === 'string' ? JSON.parse(querySummaries) : querySummaries).forEach((query) => {
            Object.entries(query).forEach((value) => {
                console.log(value)
                switch(value[0]){
                    case 'query_name':
                        blocks.push({
                            type: 'header',
                            text: {
                                type: 'plain_text',
                                text: value[1],
                                emoji: true
                            }
                        })
                        break;
                    case 'description':
                        blocks.push({
                            type: 'section',
                            text: {
                                type: 'plain_text',
                                text: value[1],
                                emoji: true
                            }
                        })
                        break;
                    case 'summary':
                        blocks.push({
                            type: 'section',
                            text: {
                                type: 'mrkdwn',
                                text: `>${value[1]}`
                            }
                        })
                        break;
                    case 'next_steps':
                        blocks.push({
                            type: 'rich_text',
                            elements: [{
                                type:'rich_text_list',
                                style: "bullet",
                                elements: value[1].map((step) => {
                                    return {
                                        type: "rich_text_section",
                                        elements: [
                                            {
                                                type: 'text',
                                                text: step
                                            }
                                        ]
                                    }
                                })
                            }]
                        })
                        break;
                }
            })
        })

        return blocks
    }

    // Post a message to a channel your app is in using ID and message text
    async function publishMessage(accessToken: string) {
        console.log(slackRichTextFormatter(formattedData))
        try {
            // Call the chat.postMessage method using the built-in WebClient
            const details = {
                'channel': process.env.CHANNEL_ID!,
                'token': accessToken,
                'blocks': JSON.stringify(slackRichTextFormatter(formattedData))
            }
            var formBody = [];
            for (var property in details) {
                var encodedKey = encodeURIComponent(property);
                var encodedValue = encodeURIComponent(details[property]);
                formBody.push(encodedKey + "=" + encodedValue);
            }
            formBody = formBody.join("&");
            const result = await fetch('https://slack.com/api/chat.postMessage',
                {
                    method:'POST',
                    headers: {
                        // using this content type for a CORS workaround with the Slack Web API
                        // Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body:formBody
                }
            )
            setInfo(true)
            setMessage(`Summary Delivered to Slack channel: ${process.env.CHANNEL_ID} `)
        }
        catch (error) {
            setInfo(true)
            setMessage('Summary failed to deliver to Slack. See console for error.')
            console.error(error);
        }
    }

    

    return () => {
        slackOauthImplicitFlow()
    }
}

export default useSlackOauth;