import React from 'react'
import { ExtensionProvider } from '@looker/extension-sdk-react'
import { SummaryDataContext } from './contexts/SummaryDataContext'
import { hot } from 'react-hot-loader/root'

import { DashboardSummarization } from './DashboardSummarization'

export const App = hot(() => {
  const [data, setData] = React.useState<string[]>([])
  const [formattedData, setFormattedData] = React.useState<string>('')
  const [info, setInfo] = React.useState(true)
  const [message, setMessage] = React.useState('')
  const [dashboardURL, setDashboardURL] = React.useState<string>('')
  return (
    <ExtensionProvider>
      <SummaryDataContext.Provider value={{ data, setData, formattedData, setFormattedData, info, setInfo, message, setMessage, dashboardURL, setDashboardURL}}>
        <DashboardSummarization />
      </SummaryDataContext.Provider>
    </ExtensionProvider>
  )
})
