import { useState, useEffect, useRef } from 'react'
import './App.css'

// ============ DATABASE LAYER (localStorage) ============
const DB_KEY = 'gpt_conversations'

const dbOperations = {
  getAll() {
    try {
      const data = localStorage.getItem(DB_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  save(conversations) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(conversations))
    } catch (e) {
      console.error('Save failed:', e)
    }
  }
}

// ============ TOOL DEFINITIONS ============
const TOOLS = {
  get_current_time: {
    name: 'get_current_time',
    description: 'Trả về ngày giờ hiện tại của máy',
    parameters: { type: 'object', properties: {}, required: [] }
  },
  calculate: {
    name: 'calculate',
    description: 'Tính toán biểu thức toán học đơn giản',
    parameters: {
      type: 'object',
      properties: { expression: { type: 'string', description: 'Biểu thức toán học' } },
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
      properties: { note: { type: 'string', description: 'Nội dung ghi chú' } },
      required: ['note']
    }
  },
  recall_notes: {
    name: 'recall_notes',
    description: 'Đọc lại toàn bộ ghi chú đã lưu trong phiên',
    parameters: { type: 'object', properties: {}, required: [] }
  }
}

// ============ TOOL EXECUTORS ============
const executeTool = async (toolName, args) => {
  switch (toolName) {
    case 'get_current_time':
      return new Date().toLocaleString('vi-VN')

    case 'calculate': {
      const expr = args.expression?.replace(/[^0-9+\-*/().]/g, '') || '0'
      try {
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
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
        )
        const geoData = await geoRes.json()
        if (!geoData.results?.length) return `Không tìm thấy: ${city}`

        const { latitude, longitude, name, country } = geoData.results[0]
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min&timezone=Asia/Ho_Chi_Minh&forecast_days=${days}`
        )
        const weatherData = await weatherRes.json()
        const daily = weatherData.daily

        let result = `${name}, ${country}:\n`
        for (let i = 0; i < Math.min(days, daily.time.length); i++) {
          result += `${daily.time[i]}: ${daily.temperature_2m_min[i]}°C - ${daily.temperature_2m_max[i]}°C\n`
        }
        return result.trim()
      } catch (err) {
        return `Lỗi: ${err.message}`
      }
    }

    case 'remember_note':
      // Don't return here - let executeToolWithResult handle it
      return `__REMEMBER_NOTE__:${args.note}`

    case 'recall_notes':
      return 'Xem trong notes array'

    default:
      return `Tool không hỗ trợ: ${toolName}`
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

  // Conversation state
  const [conversations, setConversations] = useState([])
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
  const [notes, setNotes] = useState([])

  // Timeline state
  const [timeline, setTimeline] = useState([])
  const [timelineExpanded, setTimelineExpanded] = useState(true)
  const [loopWarning, setLoopWarning] = useState(null)
  const timelineRef = useRef(null)

  const [lastRequest, setLastRequest] = useState(null)
  const [lastResponse, setLastResponse] = useState(null)
  const [error, setError] = useState(null)

  // Initialize - load conversations from localStorage
  useEffect(() => {
    const convs = dbOperations.getAll()
    setConversations(convs)
  }, [])

  // Auto-scroll timeline
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight
    }
  }, [timeline])

  // Build tools payload
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

  // Add step to timeline
  const addTimelineStep = (type, content) => {
    setTimeline(prev => [...prev, { type, content, id: Date.now() + Math.random() }])
  }

  // Execute tool with result
  const executeToolWithResult = async (toolCall) => {
    const args = JSON.parse(toolCall.function.arguments || '{}')
    let result = await executeTool(toolCall.function.name, args)

    if (toolCall.function.name === 'remember_note' && result.startsWith('__REMEMBER_NOTE__')) {
      const noteContent = result.replace('__REMEMBER_NOTE__:', '')
      const currentNotes = notes.length
      setNotes(prev => [...prev, noteContent])
      result = `Đã lưu ghi chú #${currentNotes + 1}`
    }
    if (toolCall.function.name === 'recall_notes') {
      result = notes.length > 0
        ? `Có ${notes.length} ghi chú:\n${notes.map((n, i) => `${i + 1}. ${n}`).join('\n')}`
        : 'Chưa có ghi chú nào.'
    }

    return result
  }

  // AGENTIC LOOP
  const handleSend = async () => {
    if (!input.trim() || !settings.apiKey) return

    setError(null)
    setIsLoading(true)
    setTimeline([])
    setLoopWarning(null)

    const userMessage = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]

    setMessages(newMessages)
    setInput('')

    // Ensure conversation exists
    let convId = currentConversationId
    if (!convId) {
      convId = createNewConversation()
    }

    // Save user message
    updateConversation(convId, newMessages)

    const messageHistory = [...newMessages]
    const MAX_LOOPS = 10

    const buildApiMessages = (msgs) => {
      const apiMsgs = []
      if (settings.systemPrompt?.trim()) {
        apiMsgs.push({ role: 'system', content: settings.systemPrompt })
      }
      msgs.forEach(m => apiMsgs.push({ role: m.role, content: m.content }))
      return apiMsgs
    }

    try {
      let loopCount = 0
      let finalContent = ''

      while (loopCount < MAX_LOOPS) {
        addTimelineStep('thinking', '🤔 Thinking...')

        const toolsPayload = buildToolsPayload()
        const requestBody = {
          model: settings.model,
          messages: buildApiMessages(messageHistory),
          ...(toolsPayload.length > 0 && { tools: toolsPayload }),
          temperature: 0.7,
          max_tokens: 2048
        }

        setLastRequest(requestBody)
        setActiveTab('request')

        const res = await fetch(`${settings.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`
          },
          body: JSON.stringify(requestBody)
        })

        const data = await res.json()
        setLastResponse(data)
        setActiveTab('response')

        if (!res.ok || !data?.choices?.[0]?.message) {
          throw new Error(data?.error?.message || `HTTP ${res.status}`)
        }

        const assistantMsg = data.choices[0].message

        if (assistantMsg.tool_calls?.length > 0) {
          for (const call of assistantMsg.tool_calls) {
            const args = JSON.parse(call.function.arguments || '{}')
            const argsStr = Object.entries(args).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ')
            addTimelineStep('tool_call', `🔧 ${call.function.name}(${argsStr || ''})`)
          }

          const toolResults = []
          for (const call of assistantMsg.tool_calls) {
            const result = await executeToolWithResult(call)
            addTimelineStep('tool_result', `📥 ${result}`)
            toolResults.push({
              role: 'tool',
              tool_call_id: call.id,
              content: result
            })
          }

          messageHistory.push(assistantMsg)
          messageHistory.push(...toolResults)
          loopCount++
        } else {
          finalContent = assistantMsg.content || 'No response'
          addTimelineStep('done', `✅ ${finalContent}`)
          break
        }

        if (loopCount >= MAX_LOOPS) {
          setLoopWarning(`⚠️ Đã đạt giới hạn ${MAX_LOOPS} vòng lặp!`)
          addTimelineStep('done', `⚠️ Dừng sau ${MAX_LOOPS} vòng.`)
        }
      }

      if (finalContent) {
        const finalMessages = [...messageHistory, { role: 'assistant', content: finalContent }]
        setMessages(finalMessages)
        await updateConversation(convId, finalMessages)
      }

    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Conversation operations
  const createNewConversation = () => {
    const conv = {
      id: crypto.randomUUID(),
      name: `Chat ${new Date().toLocaleDateString('vi-VN')}`,
      messages: [],
      notes: [],
      settings: { ...settings },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const allConvs = dbOperations.getAll()
    dbOperations.save([conv, ...allConvs])
    setConversations([conv, ...allConvs])
    setCurrentConversationId(conv.id)
    setConversationName(conv.name)
    return conv.id
  }

  const updateConversation = (convId, msgs) => {
    const allConvs = dbOperations.getAll()
    const conv = allConvs.find(c => c.id === convId)
    if (!conv) return

    const updated = {
      ...conv,
      messages: msgs,
      notes: notes, // Save notes with conversation
      updatedAt: new Date().toISOString()
    }
    const newConvs = allConvs.map(c => c.id === convId ? updated : c)
    dbOperations.save(newConvs)
    setConversations(newConvs)
  }

  const loadConversation = (convId) => {
    const allConvs = dbOperations.getAll()
    const conv = allConvs.find(c => c.id === convId)
    if (conv) {
      setCurrentConversationId(convId)
      setMessages(conv.messages || [])
      setConversationName(conv.name)
      setSettings(prev => ({ ...prev, ...conv.settings }))
      setNotes(conv.notes || []) // Load notes
      setConversations(allConvs)
    }
  }

  const deleteConversation = (convId) => {
    const allConvs = dbOperations.getAll().filter(c => c.id !== convId)
    dbOperations.save(allConvs)
    setConversations(allConvs)
    if (currentConversationId === convId) {
      handleClear()
    }
  }

  const handleClear = () => {
    setMessages([])
    setLastRequest(null)
    setLastResponse(null)
    setError(null)
    setTimeline([])
    setNotes([])
    setCurrentConversationId(null)
    setConversationName('')
    setLoopWarning(null)
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

  const handleNewChat = () => {
    handleClear()
    createNewConversation()
  }

  const status = isLoading ? 'Running...' : error ? 'Error' : 'Ready'

  return (
    <>
      {/* Settings Bar */}
      <div className="settings-bar">
        <label>
          API Key
          <input type="password" value={settings.apiKey} onChange={(e) => handleSettingsChange('apiKey', e.target.value)} />
        </label>
        <label>
          Base URL
          <input type="text" value={settings.baseUrl} onChange={(e) => handleSettingsChange('baseUrl', e.target.value)} />
        </label>
        <label>
          Model
          <input type="text" value={settings.model} onChange={(e) => handleSettingsChange('model', e.target.value)} />
        </label>
        <button className="settings-toggle" onClick={() => setShowSettings(!showSettings)}>
          {showSettings ? 'Hide' : 'Show'} Config
        </button>
      </div>

      {/* System Prompt Bar */}
      {showSettings && (
        <div className="system-prompt-bar">
          <label className="system-prompt-label">
            System Prompt
            <textarea className="system-prompt-input" value={settings.systemPrompt} onChange={(e) => handleSettingsChange('systemPrompt', e.target.value)} />
          </label>
        </div>
      )}

      {/* Tools Bar */}
      {showSettings && (
        <div className="tools-bar">
          <span className="tools-label">Tools:</span>
          {Object.entries(TOOLS).map(([name, tool]) => (
            <label key={name} className="tool-checkbox">
              <input type="checkbox" checked={enabledTools[name]} onChange={() => handleToolToggle(name)} />
              <span>{tool.name}</span>
            </label>
          ))}
        </div>
      )}

      {/* Example Task */}
      <div className="example-bar">
        <span className="example-label">Example:</span>
        <button
          className="example-btn"
          onClick={() => setInput('Tìm thời tiết TP.HCM 3 ngày tới, tính nhiệt độ trung bình, lưu kết quả vào note.')}
        >
          Tìm thời tiết TP.HCM 3 ngày tới, tính nhiệt độ trung bình, lưu kết quả vào note.
        </button>
      </div>

      {/* Main Content */}
      <div className="app-container">
        {/* Sidebar - Conversations */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h3>History</h3>
            <button className="btn-new-chat" onClick={handleNewChat}>+ New</button>
          </div>
          <div className="conversation-list">
            {conversations.length === 0 ? (
              <div className="no-conversations">No conversations</div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`conversation-item ${conv.id === currentConversationId ? 'active' : ''}`}
                  onClick={() => loadConversation(conv.id)}
                >
                  <div className="conversation-info">
                    <div className="conversation-name">{conv.name}</div>
                    <div className="conversation-meta">{conv.messages.length} msgs</div>
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
            <span className={`badge ${isLoading ? 'loading' : error ? 'error' : ''}`}>{status}</span>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && timeline.length === 0 ? (
              <div className="empty-state">
                <div className="icon">&gt;_</div>
                <p>Send a message to start</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <div className="label">{msg.role}</div>
                  <div className="message-content">{msg.content}</div>
                </div>
              ))
            )}
          </div>

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className={`timeline-container ${!timelineExpanded ? 'collapsed' : ''}`}>
              <div className="timeline-header" onClick={() => setTimelineExpanded(!timelineExpanded)}>
                <span className="timeline-title">📋 Execution Log</span>
                <span className="timeline-toggle">{timelineExpanded ? '▼' : '▶'}</span>
              </div>
              {timelineExpanded && (
                <div className="timeline-content" ref={timelineRef}>
                  {loopWarning && <div className="loop-warning">{loopWarning}</div>}
                  {timeline.map((step) => (
                    <div key={step.id} className={`timeline-step ${step.type}`}>
                      <span className="step-icon">
                        {step.type === 'thinking' && '🤔'}
                        {step.type === 'tool_call' && '🔧'}
                        {step.type === 'tool_result' && '📥'}
                        {step.type === 'done' && '✅'}
                      </span>
                      <span className="step-content">{step.content}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
              <button className="btn btn-primary" onClick={handleSend} disabled={isLoading || !settings.apiKey}>
                {isLoading ? '...' : 'Send'}
              </button>
              <button className="btn btn-secondary btn-clear" onClick={handleClear}>Clear</button>
            </div>
          </div>
        </div>

        {/* Right Panel - JSON */}
        <div className="json-panel">
          <div className="json-header">
            <div className="json-tabs">
              <button className={`json-tab ${activeTab === 'request' ? 'active' : ''}`} onClick={() => setActiveTab('request')}>Request</button>
              <button className={`json-tab ${activeTab === 'response' ? 'active' : ''}`} onClick={() => setActiveTab('response')}>Response</button>
            </div>
            {(lastRequest || lastResponse) && <span className="badge">JSON</span>}
          </div>

          <div className="json-content">
            {error && <div className="error-display"><span className="error-label">Error:</span> {error}</div>}
            {activeTab === 'request' ? (
              lastRequest ? (
                <pre className="json-display" dangerouslySetInnerHTML={{ __html: highlightJson(lastRequest) }} />
              ) : (
                <div className="empty-state"><div className="icon">{'{}'}</div><p>Request will appear here</p></div>
              )
            ) : (
              lastResponse ? (
                <pre className="json-display" dangerouslySetInnerHTML={{ __html: highlightJson(lastResponse) }} />
              ) : (
                <div className="empty-state"><div className="icon">{'{}'}</div><p>Response will appear here</p></div>
              )
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// JSON Syntax Highlighting
const highlightJson = (json) => {
  if (!json) return ''
  const str = typeof json === 'string' ? json : JSON.stringify(json, null, 2)
  return str.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'number'
      if (/^"/.test(match)) cls = /:$/.test(match) ? 'key' : 'string'
      else if (/true|false/.test(match)) cls = 'boolean'
      else if (/null/.test(match)) cls = 'null'
      return `<span class="${cls}">${match}</span>`
    }
  )
}

export default App