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