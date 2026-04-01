import { useState, useEffect } from 'react'
import './App.css'

// ============ LOCAL STORAGE ============
const STORAGE_KEY = 'gpt_conversations'

const loadConversations = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

const saveConversations = (conversations) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
  } catch (e) {
    console.error('Failed to save conversations:', e)
  }
}

// ============ TOOL DEFINITIONS ============
const TOOLS = {
  get_current_time: {
    name: 'get_current_time',
    description: 'Trả về ngày giờ hiện tại của máy',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  calculate: {
    name: 'calculate',
    description: 'Tính toán biểu thức toán học đơn giản',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Biểu thức toán học (VD: 2 + 2 * 3)'
        }
      },
      required: ['expression']
    }
  },
  get_weather: {
    name: 'get_weather',
    description: 'Lấy dự báo thời tiết thật qua Open-Meteo API',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'Tên thành phố' },
        days: { type: 'number', description: 'Số ngày dự báo (mặc định 1)' }
      },
      required: ['city']
    }
  },
  remember_note: {
    name: 'remember_note',
    description: 'Lưu 1 ghi chú vào bộ nhớ trong phiên',
    parameters: {
      type: 'object',
      properties: {
        note: { type: 'string', description: 'Nội dung ghi chú' }
      },
      required: ['note']
    }
  },
  recall_notes: {
    name: 'recall_notes',
    description: 'Đọc lại toàn bộ ghi chú đã lưu trong phiên',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
}

// ============ TOOL EXECUTORS ============
const executeTool = async (toolName, args) => {
  switch (toolName) {
    case 'get_current_time':
      return new Date().toLocaleString('vi-VN')

    case 'calculate': {
      const expr = args.expression
        .replace(/[^0-9+\-*/().^√πe]/g, '')
      try {
        // Safe eval for basic math
        const result = Function(`"use strict"; return (${expr})`)()
        return `Kết quả: ${result}`
      } catch {
        return 'Lỗi: Biểu thức không hợp lệ'
      }
    }

    case 'get_weather': {
      const city = args.city
      const days = args.days || 1
      try {
        // Geocode city
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
        )
        const geoData = await geoRes.json()
        if (!geoData.results?.length) return `Không tìm thấy thành phố: ${city}`

        const { latitude, longitude, name, country } = geoData.results[0]

        // Get weather
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Asia/Ho_Chi_Minh&forecast_days=${days}`
        )
        const weatherData = await weatherRes.json()
        const daily = weatherData.daily

        let result = `${name}, ${country}:\n`
        for (let i = 0; i < Math.min(days, daily.time.length); i++) {
          const date = new Date(daily.time[i]).toLocaleDateString('vi-VN', {
            weekday: 'short', day: 'numeric', month: 'short'
          })
          result += `${date}: ${daily.temperature_2m_min[i]}°C - ${daily.temperature_2m_max[i]}°C\n`
        }
        return result.trim()
      } catch (err) {
        return `Lỗi khi lấy thời tiết: ${err.message}`
      }
    }

    case 'remember_note':
      return `Đã lưu ghi chú: "${args.note}"`

    case 'recall_notes':
      return 'Tính năng recall_notes cần xử lý riêng (xem trong notes array)'

    default:
      return `Tool không được hỗ trợ: ${toolName}`
  }
}

// ============ MAIN APP ============
function App() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [showSettings, setShowSettings] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('request')
  const [settings, setSettings] = useState({
    apiKey: 'sk-d586e1d2f63743aa9453c1113ea90066',
    baseUrl: 'https://chat.zingplay.com/api',
    model: 'local-model-mini',
    systemPrompt: 'You are a helpful assistant. Your name is Thế Anh.'
  })

  // Conversation history state (local DB)
  const [conversations, setConversations] = useState(loadConversations)
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [conversationName, setConversationName] = useState('')

  // Tool state
  const [enabledTools, setEnabledTools] = useState({
    get_current_time: true,
    calculate: true,
    get_weather: true,
    remember_note: true,
    recall_notes: true
  })
  const [toolCalls, setToolCalls] = useState([]) // [{id, name, args, result, expanded}]
  const [notes, setNotes] = useState([])

  const [lastRequest, setLastRequest] = useState(null)
  const [lastResponse, setLastResponse] = useState(null)
  const [error, setError] = useState(null)

  // Auto-save conversations to localStorage
  useEffect(() => {
    saveConversations(conversations)
  }, [conversations])

  // Create new conversation
  const createNewConversation = () => {
    const newConv = {
      id: Date.now().toString(),
      name: conversationName || `Chat ${new Date().toLocaleDateString('vi-VN')}`,
      messages: [],
      settings: { ...settings },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setConversations(prev => [newConv, ...prev])
    setCurrentConversationId(newConv.id)
    return newConv
  }

  // Save current conversation
  const saveCurrentConversation = (msgs) => {
    if (!currentConversationId) {
      createNewConversation()
    }
    setConversations(prev => prev.map(conv =>
      conv.id === currentConversationId
        ? {
            ...conv,
            messages: msgs,
            settings: { ...settings },
            updatedAt: new Date().toISOString()
          }
        : conv
    ))
  }

  // Load conversation
  const loadConversation = (convId) => {
    const conv = conversations.find(c => c.id === convId)
    if (conv) {
      setCurrentConversationId(convId)
      setMessages(conv.messages)
      setSettings(prev => ({ ...prev, ...conv.settings }))
      setConversationName(conv.name)
    }
  }

  // Delete conversation
  const deleteConversation = (convId) => {
    setConversations(prev => prev.filter(c => c.id !== convId))
    if (currentConversationId === convId) {
      handleClear()
    }
  }

  // Build tools payload for API
  const buildToolsPayload = () => {
    return Object.entries(enabledTools)
      .filter(([, enabled]) => enabled)
      .map(([name]) => ({
        type: 'function',
        function: {
          name: TOOLS[name].name,
          description: TOOLS[name].description,
          parameters: TOOLS[name].parameters
        }
      }))
  }

  // Execute tool and return result
  const handleToolExecution = async (toolCall) => {
    const args = JSON.parse(toolCall.function.arguments || '{}')
    let result = await executeTool(toolCall.function.name, args)

    // Special handling for remember_note
    if (toolCall.function.name === 'remember_note') {
      const newNote = args.note
      setNotes(prev => [...prev, newNote])
      result = `Đã lưu ghi chú #${notes.length + 1}`
    }

    // Special handling for recall_notes
    if (toolCall.function.name === 'recall_notes') {
      result = notes.length > 0
        ? `Tổng ${notes.length} ghi chú:\n${notes.map((n, i) => `${i + 1}. ${n}`).join('\n')}`
        : 'Chưa có ghi chú nào.'
    }

    return result
  }

  // Main send handler
  const handleSend = async () => {
    if (!input.trim() || !settings.apiKey) return

    setError(null)
    setToolCalls([])
    setIsLoading(true)

    const userMessage = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]

    setMessages(prev => {
      const updated = [...prev, userMessage]
      saveCurrentConversation(updated)
      return updated
    })
    setInput('')

    // Build messages for API (use newMessages to include current user message)
    const buildApiMessages = (msgHistory) => {
      const msgs = []
      if (settings.systemPrompt?.trim()) {
        msgs.push({ role: 'system', content: settings.systemPrompt })
      }
      msgs.push(...msgHistory.map(m => ({ role: m.role, content: m.content })))
      return msgs
    }

    // ============ ROUND 1: Call with tools ============
    const toolsPayload = buildToolsPayload()
    const requestBody1 = {
      model: settings.model,
      messages: buildApiMessages(newMessages), // Use newMessages instead of messages
      ...(toolsPayload.length > 0 && { tools: toolsPayload }),
      temperature: 0.7,
      max_tokens: 2048
    }

    setLastRequest(requestBody1)
    setActiveTab('request')

    try {
      const res1 = await fetch(`${settings.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify(requestBody1)
      })

      const data1 = await res1.json()
      setLastResponse(data1)
      setActiveTab('response')

      if (!res1.ok || !data1?.choices?.[0]?.message) {
        throw new Error(data1?.error?.message || data1?.error || `HTTP ${res1.status}`)
      }

      const assistantMsg = data1.choices[0].message

      // ============ CHECK FOR TOOL CALLS ============
      if (assistantMsg?.tool_calls?.length > 0) {
        // Display tool calls
        const tc = assistantMsg.tool_calls
        const displayCalls = tc.map((t, i) => ({
          id: `tc-${Date.now()}-${i}`,
          name: t.function.name,
          args: t.function.arguments,
          result: null,
          expanded: true
        }))
        setToolCalls(displayCalls)

        // Execute tools
        const executedResults = []
        for (const call of tc) {
          const result = await handleToolExecution(call)
          executedResults.push({
            tool_call_id: call.id,
            name: call.function.name,
            content: result
          })
          setToolCalls(prev => prev.map(tc =>
            tc.name === call.function.name
              ? { ...tc, result }
              : tc
          ))
        }

        // ============ ROUND 2: Send tool results back (NO tools field) ============
        // Build complete message history with system prompt
        const completeMessages = []
        if (settings.systemPrompt?.trim()) {
          completeMessages.push({ role: 'system', content: settings.systemPrompt })
        }
        // Add all user messages
        completeMessages.push(...messages.map(m => ({ role: m.role, content: m.content })))
        // Add current user message
        completeMessages.push({ role: 'user', content: input })
        // Add assistant's tool call message
        completeMessages.push(assistantMsg)
        // Add tool results
        completeMessages.push(...executedResults.map(r => ({
          role: 'tool',
          tool_call_id: r.tool_call_id,
          content: r.content
        })))

        const requestBody2 = {
          model: settings.model,
          messages: completeMessages,
          temperature: 0.7,
          max_tokens: 2048
          // NO tools field - this is intentional!
        }

        setLastRequest(requestBody2)
        setActiveTab('response')

        const res2 = await fetch(`${settings.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`
          },
          body: JSON.stringify(requestBody2)
        })

        const data2 = await res2.json()
        setLastResponse(data2)

        if (!res2.ok || !data2?.choices?.[0]?.message) {
          throw new Error(data2?.error?.message || data2?.error || `HTTP ${res2.status}`)
        }

        const finalContent = data2.choices[0].message?.content || 'No response'
        setMessages(prev => {
          const updated = [...prev, { role: 'assistant', content: finalContent }]
          saveCurrentConversation(updated)
          return updated
        })
      } else {
        // No tool calls, just text response
        setMessages(prev => {
          const updated = [...prev, { role: 'assistant', content: assistantMsg?.content || 'No response' }]
          saveCurrentConversation(updated)
          return updated
        })
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
    setToolCalls([])
    setNotes([])
    setCurrentConversationId(null)
    setConversationName('')
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

  const handleToolToggle = (toolName) => {
    setEnabledTools(prev => ({ ...prev, [toolName]: !prev[toolName] }))
  }

  const toggleToolExpanded = (id) => {
    setToolCalls(prev => prev.map(tc =>
      tc.id === id ? { ...tc, expanded: !tc.expanded } : tc
    ))
  }

  const highlightJson = (json) => {
    if (!json) return ''
    const str = typeof json === 'string' ? json : JSON.stringify(json, null, 2)
    return str.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'number'
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'key' : 'string'
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
            value={settings.apiKey}
            onChange={(e) => handleSettingsChange('apiKey', e.target.value)}
          />
        </label>
        <label>
          Base URL
          <input
            type="text"
            value={settings.baseUrl}
            onChange={(e) => handleSettingsChange('baseUrl', e.target.value)}
          />
        </label>
        <label>
          Model
          <input
            type="text"
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
          <label className="system-prompt-label">
            System Prompt
            <textarea
              className="system-prompt-input"
              value={settings.systemPrompt}
              onChange={(e) => handleSettingsChange('systemPrompt', e.target.value)}
            />
          </label>
        </div>
      )}

      {/* Tools Selection Bar */}
      {showSettings && (
        <div className="tools-bar">
          <span className="tools-label">Tools:</span>
          {Object.entries(TOOLS).map(([name, tool]) => (
            <label key={name} className="tool-checkbox">
              <input
                type="checkbox"
                checked={enabledTools[name]}
                onChange={() => handleToolToggle(name)}
              />
              <span>{tool.name}</span>
            </label>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="app-container">
        {/* Sidebar - Conversations */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h3>History</h3>
            <button className="btn-new-chat" onClick={() => { handleClear(); createNewConversation(); }}>
              + New
            </button>
          </div>
          <div className="conversation-list">
            {conversations.length === 0 ? (
              <div className="no-conversations">No conversations yet</div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`conversation-item ${conv.id === currentConversationId ? 'active' : ''}`}
                  onClick={() => loadConversation(conv.id)}
                >
                  <div className="conversation-info">
                    <div className="conversation-name">{conv.name}</div>
                    <div className="conversation-meta">
                      {conv.messages.length} msgs · {new Date(conv.updatedAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <button
                    className="btn-delete-conv"
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Left Panel - Chat */}
        <div className="chat-panel">
          <div className="chat-header">
            <h1>{conversationName || 'Chat'}</h1>
            <span className={`badge ${isLoading ? 'loading' : error ? 'error' : ''}`}>
              {status}
            </span>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && toolCalls.length === 0 ? (
              <div className="empty-state">
                <div className="icon">&gt;_</div>
                <p>Send a message to start</p>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.role}`}>
                    <div className="label">{msg.role}</div>
                    <div className="message-content">{msg.content}</div>
                  </div>
                ))}

                {/* Tool Calls Display */}
                {toolCalls.map((tc) => (
                  <div key={tc.id} className="tool-call-block">
                    <div
                      className="tool-call-header"
                      onClick={() => toggleToolExpanded(tc.id)}
                    >
                      <span className="tool-icon">⚡</span>
                      <span className="tool-name">{tc.name}</span>
                      <span className={`tool-status ${tc.result ? 'done' : 'loading'}`}>
                        {tc.result ? '✓ Done' : '⟳ Executing...'}
                      </span>
                      <span className="tool-expand">{tc.expanded ? '▼' : '▶'}</span>
                    </div>

                    {tc.expanded && (
                      <div className="tool-call-body">
                        <div className="tool-section">
                          <div className="tool-section-label">Arguments</div>
                          <pre
                            className="tool-args"
                            dangerouslySetInnerHTML={{
                              __html: highlightJson(JSON.parse(tc.args || '{}'))
                            }}
                          />
                        </div>
                        {tc.result && (
                          <div className="tool-section">
                            <div className="tool-section-label">Result</div>
                            <div className="tool-result">{tc.result}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </>
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