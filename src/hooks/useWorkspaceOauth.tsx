import { useContext } from 'react'
import { ExtensionContext } from '@looker/extension-sdk-react'
import { SummaryDataContext } from '../contexts/SummaryDataContext'

const useWorkspaceOauth = () => {
    const { extensionSDK } = useContext(ExtensionContext)
    const { data, setMessage, setInfo } = useContext(SummaryDataContext)

    async function googleOauthImplicitFlow(){
        const response = await extensionSDK.oauth2Authenticate(
          'https://accounts.google.com/o/oauth2/v2/auth',
          {
            client_id: process.env.GOOGLE_CLIENT_ID!,
            scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/chat.messages https://www.googleapis.com/auth/chat.messages.create https://www.googleapis.com/auth/chat.spaces https://www.googleapis.com/auth/chat.spaces.readonly https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/userinfo.profile',
            response_type: 'token',
          }
        )
        const { access_token } = response
        postSummaryDataToGchat(access_token)
    }

    // Get information about user from Google
    const postSummaryDataToGchat = async (accessToken?: string) => {
        try {
        // Get information about user from google
        const messageExport = await extensionSDK.fetchProxy(
            `https://chat.googleapis.com/v1/spaces/${process.env.SPACE_ID}/messages`,
            {
            method:'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text:`*Business Pulse Dashboard Summary \n <https://experiment-3.dev.looker.com/embed/dashboards/33| Full Dashboard> \n` + data.join(' '),
                formattedText: `*Business Pulse Dashboard Summary \n <https://experiment-3.dev.looker.com/embed/dashboards/33| Full Dashboard> \n` + data.join(' ')
            })
            }
        )
        setInfo(true)
        if (messageExport.ok) {
            setMessage(`Summary delivered to Google Chat space: ${process.env.SPACE_ID}`)
        }
        } catch (error) {
            setMessage('Summary failed to deliver to Google Chat. See console for error.')
            console.error(error)
        }
    }

    return () => {
        googleOauthImplicitFlow()
    }
}

export default useWorkspaceOauth;