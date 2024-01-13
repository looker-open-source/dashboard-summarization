import React from 'react'

interface SummaryText {
    [key: string]: {
        description: string,
        suggested_actions?: string[]
    }
}

function SummaryText(
    {data}:{
        data: SummaryText
    }
) {
    
    return (
        <div style={{
            display:'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            
        }}>
            {Object.entries(JSON.parse(data)).map(([key,value],index) => (
                <div key={index} style={{
                    display:'flex',
                    flexDirection:'column',
                    justifyContent:'space-between'
                }}>
                 <span>
                    {key}
                </span>
                <p style={{opacity:0.6}} className='animate-text'>
                    {value.description}
                </p>
                <ol style={{
                    opacity:0.6
                }}>
                {'suggested_actions' in value && value['suggested_actions'].map((val, index) => (
                    <li key={index} className='animate-text'>
                      {val}
                    </li>
                ))}
                </ol>
                </div>
            ))}
        </div>
    )
}

interface ChatText {
    conclusion: string,
    next_steps: string | undefined[]
}

function ChatText(
    {data}: {
        data: ChatText
    }
    ) {
    return (
        <div style={{
            display:'flex',
            flexDirection:'column',
            justifyContent:'space-between'
        }}>
            <p>{JSON.parse(data).conclusion}</p>
            <ol>
                {JSON.parse(data).next_steps.map((step: string,index: number) => (
                    <li key={index}><span>{step}</span></li>
                ))}
            </ol>
        </div>
    )
}

export { ChatText, SummaryText}