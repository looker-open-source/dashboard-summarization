import React from 'react'
import ReactDOM from 'react-dom'
import { App } from './App'
import "./index.css"

window.addEventListener('DOMContentLoaded', (_) => {
  const root = document.createElement('div')
  document.body.appendChild(root)
  ReactDOM.render(<App />, root)
})
