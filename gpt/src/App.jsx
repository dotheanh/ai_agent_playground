import { useState } from 'react'
import './App.css'

function App() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [showSettings, setShowSettings] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('request')
  const [settings, setSettings] = useState({
    apiKey: 'sk-d586e1d2f63743aa9453c1113ea90066',
    baseUrl: 'https://chat.zingplay.com/api',
    model: 'gpt-4.1-mini',
    systemPrompt: 'You are a helpful assistant.'
  })

  const [lastRequest, setLastRequest] = useState(null)
  const [lastResponse, setLastResponse] = useState(null)
  const [error, setError] = useState(null)

  const handleSend = async () => {
    if (!input.trim() || !settings.apiKey) return

    const userMessage = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setError(null)
    setIsLoading(true)

    // Build messages array with system prompt if provided
    const apiMessages = []
    if (settings.systemPrompt?.trim()) {
      apiMessages.push({ role: 'system', content: settings.systemPrompt })
    }
    apiMessages.push(...newMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    })))

    const requestBody = {
      model: settings.model,
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 2048
    }

    setLastRequest(requestBody)
    setActiveTab('request')

    try {
      const response = await fetch(`${settings.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()
      setLastResponse(data)
      setActiveTab('response')

      if (response.ok) {
        const assistantMessage = {
          role: 'assistant',
          content: data.choices?.[0]?.message?.content || 'No response'
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        setError(data.error?.message || `HTTP ${response.status}`)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([])
    setLastRequest(null)
    setLastResponse(null)
    setError(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSettingsChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const highlightJson = (json) => {
    if (!json) return ''
    const str = JSON.stringify(json, null, 2)
    return str.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'number'
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'key'
          } else {
            cls = 'string'
          }
        } else if (/true|false/.test(match)) {
          cls = 'boolean'
        } else if (/null/.test(match)) {
          cls = 'null'
        }
        return `<span class="${cls}">${match}</span>`
      }
    )
  }

  const status = isLoading ? 'Loading...' : error ? 'Error' : 'Ready'

  return (
    <>
      {/* Settings Bar */}
      <div className="settings-bar">
        <label>
          API Key
          <input
            type="password"
            placeholder="sk-..."
            value={settings.apiKey}
            onChange={(e) => handleSettingsChange('apiKey', e.target.value)}
          />
        </label>
        <label>
          Base URL
          <input
            type="text"
            placeholder="https://api.openai.com/v1"
            value={settings.baseUrl}
            onChange={(e) => handleSettingsChange('baseUrl', e.target.value)}
          />
        </label>
        <label>
          Model
          <input
            type="text"
            placeholder="gpt-4"
            value={settings.model}
            onChange={(e) => handleSettingsChange('model', e.target.value)}
          />
        </label>
        <button
          className="settings-toggle"
          onClick={() => setShowSettings(!showSettings)}
        >
          {showSettings ? 'Hide' : 'Show'} Config
        </button>
      </div>

      {/* System Prompt Bar */}
      {showSettings && (
        <div className="system-prompt-bar">
          <label>
            System Prompt
            <textarea
              className="system-prompt-input"
              placeholder="You are a helpful assistant..."
              value={settings.systemPrompt}
              onChange={(e) => handleSettingsChange('systemPrompt', e.target.value)}
            />
          </label>
        </div>
      )}

      {/* Main Content */}
      <div className="app-container">
        {/* Left Panel - Chat */}
        <div className="chat-panel">
          <div className="chat-header">
            <h1>Chat</h1>
            <span className={`badge ${isLoading ? 'loading' : error ? 'error' : ''}`}>
              {status}
            </span>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="icon">&gt;_</div>
                <p>Send a message to start</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <div className="label">{msg.role}</div>
                  {msg.content}
                </div>
              ))
            )}
          </div>

          <div className="chat-input-area">
            <div className="input-wrapper">
              <textarea
                className="chat-input"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <button
                className="btn btn-primary"
                onClick={handleSend}
                disabled={isLoading || !settings.apiKey}
              >
                {isLoading ? '...' : 'Send'}
              </button>
              <button className="btn btn-secondary btn-clear" onClick={handleClear}>
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - JSON Request/Response */}
        <div className="json-panel">
          <div className="json-header">
            <div className="json-tabs">
              <button
                className={`json-tab ${activeTab === 'request' ? 'active' : ''}`}
                onClick={() => setActiveTab('request')}
              >
                Request
              </button>
              <button
                className={`json-tab ${activeTab === 'response' ? 'active' : ''}`}
                onClick={() => setActiveTab('response')}
              >
                Response
              </button>
            </div>
            {(lastRequest || lastResponse) && (
              <span className="badge">JSON</span>
            )}
          </div>

          <div className="json-content">
            {error && activeTab === 'response' && (
              <div className="error-display">
                <span className="error-label">Error:</span> {error}
              </div>
            )}

            {activeTab === 'request' ? (
              lastRequest ? (
                <pre
                  className="json-display"
                  dangerouslySetInnerHTML={{ __html: highlightJson(lastRequest) }}
                />
              ) : (
                <div className="empty-state">
                  <div className="icon">{'{}'}</div>
                  <p>Request will appear here</p>
                </div>
              )
            ) : (
              lastResponse ? (
                <pre
                  className="json-display"
                  dangerouslySetInnerHTML={{ __html: highlightJson(lastResponse) }}
                />
              ) : (
                <div className="empty-state">
                  <div className="icon">{'{}'}</div>
                  <p>Response will appear here</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default App