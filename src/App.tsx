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

import React from 'react'
import { ExtensionProvider } from '@looker/extension-sdk-react'
import { SummaryDataContext } from './contexts/SummaryDataContext'
import { hot } from 'react-hot-loader/root'

import { DashboardSummarization } from './components/DashboardSummarization'
import { DashboardEmbed } from './components/DashboardEmbed'
import { SummaryDataContextType } from './types'
import './App.css' // Import the CSS file

export const App = hot(() => {
  const [data, setData] = React.useState<string[]>([])
  const [formattedData, setFormattedData] = React.useState<string>('')
  const [querySuggestions, setQuerySuggestions] = React.useState<string[]>([])
  const [info, setInfo] = React.useState(true)
  const [message, setMessage] = React.useState('')
  const [dashboardURL, setDashboardURL] = React.useState<string>('')

  const contextValue: SummaryDataContextType = {
    data,
    setData,
    formattedData,
    setFormattedData,
    querySuggestions,
    setQuerySuggestions,
    info,
    setInfo,
    message,
    setMessage,
    dashboardURL,
    setDashboardURL,
  };

  return (
    <ExtensionProvider>
      <SummaryDataContext.Provider value={contextValue}>
        <div className="container">
          <DashboardSummarization />
          <DashboardEmbed />
        </div>
      </SummaryDataContext.Provider>
    </ExtensionProvider>
  )
})
