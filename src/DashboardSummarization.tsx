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

import React, { useCallback, useContext, useEffect, useState } from 'react'
import { ExtensionContext } from '@looker/extension-sdk-react'
import { Filters } from '@looker/extension-sdk'
import { BardLogo, LandingPage } from './components/LandingPage'
import { socket } from './socket'
import MarkdownComponent from './components/MarkdownComponent'
import useWorkspaceOauth from './hooks/useWorkspaceOauth'
import { SummaryDataContext } from './contexts/SummaryDataContext'
import useSlackOauth from './hooks/useSlackOauth'

interface DashboardMetadata {
  dashboardFilters: Filters | undefined,
  dashboardId: string | undefined,
  queries: {
    id: any;
    fields: any;
    view: any;
    model: any;
    dynamic_fields?: any;
  }[],
  indexedFilters: {
    [key: string]: {
      dimension: string,
      explore: string,
      model: string
    }
  }
}

export const DashboardSummarization: React.FC = () => {
  const { extensionSDK, tileHostData, core40SDK} = useContext(ExtensionContext)
  const { dashboardFilters, dashboardId } = tileHostData
  const [dashboardMetadata, setDashboardMetadata] = useState<DashboardMetadata>()
  const [loadingDashboardMetadata, setLoadingDashboardMetadata] = useState<boolean>(false)
  const [isConnected, setIsConnected] = useState(socket.connected);
  const { data, setData, formattedData, setFormattedData, info, setInfo, message, setMessage, setDashboardURL } = useContext(SummaryDataContext)
  const [loading, setLoading] = useState(false)
  const workspaceOauth = useWorkspaceOauth()
  const slackOauth = useSlackOauth()

  useEffect(() => {
    
    function onConnect(value) {
      console.log("Connected!!", value)
      setIsConnected(true);
    }

    function onDisconnect(value) {
      console.log("Disconnected: ", value)
      setIsConnected(false);
    }

    function onFooEvent(value) {
      // console.log(value.toString())
      // need this conditional to make sure that headers aren't included in the li elements generated
      setData(previous => value.substring(0,2).includes("#") ? [...previous, '\n', value] : [...previous, value]);
    }

    function onComplete(event:string) {
      console.log(event)
      setFormattedData(event.replace('```json','').replaceAll('```','').trim())
      // document.querySelector('blockquote')?.querySelectorAll('p')
      setLoading(false)
    }

    socket.connect()

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('my broadcast event', onFooEvent);
    socket.on('complete', onComplete)

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('my broadcast event', onFooEvent);
      socket.off('complete', onComplete);
    };
  }, [])

  useEffect(() => {
    if(tileHostData.dashboardRunState === 'RUNNING') {
      setData([])
      setLoading(false)
    }
  },[dashboardFilters])

  const applyFilterToListeners = (data,filters,dashboardFilters) => {
    if(dashboardFilters !== null) {
      const filterListeners = data.filter((item) => item.listen.length > 0)
      // loop through each filter listener
      
      filterListeners.forEach((filter) => {
        // loop through each individual listener and apply filter to query
        filter.listen.forEach((listener) => {
          filters[listener.field] = dashboardFilters[listener.dashboard_filter_name]
        })
      })
      
      return filters
    }

    return {}
  }

  const fetchQueryMetadata = useCallback(async () => {
    if(dashboardId) {
      setLoadingDashboardMetadata(true)
      setMessage("Loading Dashboard Metadata")
      const {description} = await core40SDK.ok(core40SDK.dashboard(dashboardId,'description'))
      
      const queries = await core40SDK.ok(core40SDK.dashboard_dashboard_elements(
        dashboardId, 'query,result_maker,note_text,title,query_id'))
        .then(
          (res) => {
            const queries = res
              // query checks looker query, result maker checks custom fields
              .filter((d) => d.query !== null || d.result_maker !== null)
              .map((data) => {
                const { query, note_text,title } = data
                if(data.query !== null) {
                  const { fields, dynamic_fields, view, model, filters,pivots, sorts, limit, column_limit, row_total, subtotals } = query
                  const newFilters = applyFilterToListeners(data.result_maker?.filterables,filters || {},dashboardFilters)
                  return { queryBody: {fields, dynamic_fields, view, model, filters: newFilters, pivots, sorts, limit, column_limit, row_total, subtotals}, note_text,title }
                } else if(data.result_maker!.query !== null) {
                  const { fields, dynamic_fields, view, model, filters, pivots, sorts, limit, column_limit, row_total, subtotals } = data.result_maker!.query
                  const newFilters = applyFilterToListeners(data.result_maker?.filterables,filters || {},dashboardFilters)
                  return { queryBody: {fields, dynamic_fields, view, model, filters: newFilters, pivots, sorts, limit, column_limit, row_total, subtotals}, note_text,title }
                  // return undefined if the query is a merge query (since there is no query id and the query has to be reconstructed)
                } else {
                  return undefined
                }
              })
            return queries
          }
        ).finally(() => {
          setLoadingDashboardMetadata(false)
          setMessage("Loaded Dashboard Metadata. Click 'Summarize Dashboard' to Generate report summary.")
          
        })
        if (!loadingDashboardMetadata) {
          await extensionSDK.localStorageSetItem(`${dashboardId}:${JSON.stringify(dashboardFilters)}`,JSON.stringify({ dashboardFilters, dashboardId, queries,description}))
          setDashboardMetadata({ dashboardFilters, dashboardId, queries, description})
        }
    }
  },[dashboardId,dashboardFilters])

  useEffect(() => {
    if(message && message.includes('Loaded Dashboard Metadata') || message.includes("Google Chat") || message.includes("Slack")){
      setTimeout(() => {
        setInfo(false)
      },1000)
    }
  },[message])


  useEffect(() => {
    async function fetchCachedMetadata() {
      return await extensionSDK.localStorageGetItem(`${tileHostData.dashboardId}:${JSON.stringify(tileHostData.dashboardFilters)}`)
    }
    fetchCachedMetadata().then((cachedMetadata) => {
      if (cachedMetadata !== null) {
       setDashboardURL(extensionSDK.lookerHostData?.hostUrl + "/embed/dashboards/" + tileHostData.dashboardId)
       setLoadingDashboardMetadata(false)
       setMessage("Loaded Dashboard Metadata from cache. Click 'Summarize Dashboard' to Generate report summary.")
       setDashboardMetadata(JSON.parse(cachedMetadata || '{}'))
      } else if (tileHostData.dashboardRunState !== 'UNKNOWN') {
        setDashboardURL(extensionSDK.lookerHostData?.hostUrl + "/embed/dashboards/" + tileHostData.dashboardId)
        fetchQueryMetadata()
      }
    })
  },[fetchQueryMetadata])

  return (
    <div style={{width:'100%', height:'95vh'}}>
      {message ? 
        <div style={{
          position:'absolute',
          zIndex:1,
          top:info ? document.documentElement.scrollTop || document.body.scrollTop : -100,
          left:0,
          marginBottom:'1rem',
          width:'100%',
          padding:'0.8rem',
          fontSize:'0.8rem',
          color: 'rgb(0,8,2,0.8)',
          alignContent:'center',
          backgroundColor:'rgb(255, 100, 100,0.2)'
        }}>{message}
        </div>
      :
        <></>
      }
      <div style={{height:'auto',display:'flex', flexDirection:'column', justifyContent:'space-evenly',marginBottom:'1.6rem'}}>
      <div className="layout" style={{boxShadow:'0px',paddingBottom:'1.2rem',marginBottom:'2rem',height:'50%'}}>
        <span style={{fontSize:'0.9rem',opacity:'0.8'}}>Summarize your Dashboard Queries</span>
        <button className='button' disabled={loading || !socket.connected} onClick={() => {
          setLoading(true)
          socket.emit("my event", JSON.stringify({...dashboardMetadata, instance:extensionSDK.lookerHostData?.hostOrigin?.split('https://')[1].split('.')[0]}))
        }}>Generate <img  style={{opacity: loading ? 0.2 : 1}}src="https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/summarize_auto/default/20px.svg"/></button>
      </div>
      <div className="layout" style={{boxShadow:'0px',opacity: !loading ? 1 : 0.2, height:'50%'}}>
        <span style={{fontSize:'0.9rem',opacity:'0.8', width: '60%'}}>Export your Insights</span>
        <button disabled={loading} onClick={workspaceOauth} className='button' style={{borderRadius:'50%',padding:'0.5rem'}}>
          <img height={20} width={20} src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Google_Chat_icon_%282020%29.svg/1024px-Google_Chat_icon_%282020%29.svg.png"/>
        </button>
        <button disabled={loading} onClick={slackOauth} className='button' style={{borderRadius:'50%',padding:'0.5rem'}}>
          <img height={20} width={20} src="https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg"/>
        </button>
      </div>
      </div>
      {data.length > 0 
      ? 
      <div style={{height:'90%', marginBottom:'1rem'}}>
        <div className="summary-scroll">
        <div className='progress'></div>
          <MarkdownComponent data={data}/>
        </div>
      </div>
      :
      <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height:loading ? '70vh' : '90%',
          width:'100%',
          padding:'0.8rem',
          marginTop: '1rem'
      }}>
        {loading ? <BardLogo /> : <LandingPage />}
      </div>
      }
    </div>
  )
}
