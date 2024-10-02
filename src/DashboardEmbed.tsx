import { LookerEmbedDashboard, LookerEmbedSDK } from '@looker/embed-sdk';
import { LookerDashboardOptions } from '@looker/embed-sdk/lib/types';
import { ExtensionContext } from '@looker/extension-sdk-react'
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from "styled-components"
import { SummaryDataContext } from './contexts/SummaryDataContext';

export const EmbedContainer = styled.div`
  width: 50%;
  height: 95vh;
  & > iframe {
    width: 100%;
    height: 100%;
  }
`

export const DashboardEmbed: React.FC<any> = () => {
  const { extensionSDK, lookerHostData } = useContext(ExtensionContext)
  const { dashboardURL, setDashboardURL } = useContext(SummaryDataContext)

  const [embedUrl, setEmbedUrl] = useState<string>('')

  useEffect(() => {
    if (lookerHostData?.route && lookerHostData?.hostUrl) {
      const hostContext = lookerHostData.route || ''
      const urlPath = hostContext.split('?')[0].split('/') || []
      const urlDashboardId = urlPath[urlPath.length - 1]
      const filterPart = hostContext.split('?')[1] || ''
      const urlParams = new URLSearchParams(filterPart)
      const urlDashboardFilters = Object.fromEntries(urlParams.entries())

      const dashboardId = urlDashboardId === 'extension.loader' ? 'defaultDashboardId' : urlDashboardId
      const newEmbedUrl = `${lookerHostData.hostUrl}/embed/dashboards/${dashboardId}?${urlParams.toString()}`

      console.log('Constructed Embed URL:', newEmbedUrl)
      setEmbedUrl(newEmbedUrl)
    }
  }, [lookerHostData])

  return (
    <>
      <EmbedContainer>
        {embedUrl && <iframe src={embedUrl} frameBorder="0" />}
      </EmbedContainer>
    </>
  )
}