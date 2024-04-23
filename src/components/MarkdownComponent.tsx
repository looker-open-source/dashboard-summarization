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

import Markdown from "react-markdown";
import React, { memo } from 'react';
import rehypeRaw from "rehype-raw";

const MarkdownComponent = ({data}) => {
    return (
        <>
        <Markdown 
            className="markdown"
            components={{
                blockquote(props) {
                    const {children, className, node, ...rest} = props
                    return (
                        <div className="summaryCard">
                            <svg height="24" viewBox="0 -960 960 960" width="100" fill="rgba(91,140,255,0.2)">
                                <path d="M320-280q17 0 28.5-11.5T360-320q0-17-11.5-28.5T320-360q-17 0-28.5 11.5T280-320q0 17 11.5 28.5T320-280Zm0-160q17 0 28.5-11.5T360-480q0-17-11.5-28.5T320-520q-17 0-28.5 11.5T280-480q0 17 11.5 28.5T320-440Zm0-160q17 0 28.5-11.5T360-640q0-17-11.5-28.5T320-680q-17 0-28.5 11.5T280-640q0 17 11.5 28.5T320-600Zm120 320h240v-80H440v80Zm0-160h160v-80H440v80ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h320v80H200v560h560v-320h80v320q0 33-23.5 56.5T760-120H200Zm500-360q0-92-64-156t-156-64q92 0 156-64t64-156q0 92 64 156t156 64q-92 0-156 64t-64 156Zm-220 0Z"/>
                            </svg>
                            <span {...rest} style={{fontSize:'1em'}}>
                                {children}
                            </span>
                        </div>
                )
            },
            li(props) {
                const {children, className, node, ...rest} = props
                return (
                    <>
                    <li className="customList" {...rest}>
                        {children}
                    </li>
                    </>
                    )
                },
                hr(props) {
                    const {children, className, node, ...rest} = props
                    return (
                        <hr className='separator' {...rest}/>
                        )
                    }
                }}
                rehypePlugins={[rehypeRaw]}
                >
            {data.join(' ')}
        </Markdown>
        </>
    )
}

export default memo(MarkdownComponent);