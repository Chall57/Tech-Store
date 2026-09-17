import { useState, type FormEvent } from 'react'

type Message = { id: number; author: 'assistant' | 'customer'; text: string }

const initialMessages: Message[] = [
  { id: 1, author: 'assistant', text: 'Olá! Posso ajudar você a escolher um componente de hardware.' },
  { id: 2, author: 'customer', text: 'Me indique uma placa de vídeo.' },
  { id: 3, author: 'assistant', text: 'Te indico a Radeon RX 7600 pelo bom custo-benefício em jogos Full HD, consumo moderado e 8 GB de memória. Antes da compra, confira a compatibilidade com a fonte e o gabinete.' },
]

export function MockAiChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const question = draft.trim()
    if (!question) return
    const normalized = question.toLocaleLowerCase('pt-BR')
    const answer = normalized.includes('placa') || normalized.includes('vídeo')
      ? 'Para custo-benefício em Full HD, recomendo a Radeon RX 7600. Se desejar mais desempenho, consulte também as placas disponíveis no catálogo.'
      : normalized.includes('processador')
        ? 'O Ryzen 7 9800X3D é uma opção forte para jogos e tarefas exigentes, desde que a placa-mãe utilize socket AM5.'
        : normalized.includes('memória') || normalized.includes('ram')
          ? 'Um kit DDR5 de 32 GB atende bem jogos e produtividade. Verifique a frequência suportada pela placa-mãe.'
          : 'Posso recomendar placas de vídeo, processadores e memórias de acordo com a sua necessidade.'
    const timestamp = Date.now()
    setMessages((current) => [...current, { id: timestamp, author: 'customer', text: question }, { id: timestamp + 1, author: 'assistant', text: answer }])
    setDraft('')
  }

  return (
    <aside className="ai-help" aria-label="Ajuda por inteligência artificial">
      {isOpen && (
        <section className="ai-help__panel" id="ai-help-panel" role="dialog" aria-label="Assistente de hardware">
          <header className="ai-help__header">
            <span className="ai-help__avatar" aria-hidden="true">IA</span>
            <div>
              <strong>Assistente Tech Store</strong>
              <small><i aria-hidden="true" /> Atendimento online</small>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Fechar chat">×</button>
          </header>

          <div className="ai-help__messages" aria-live="polite">
            <p className="ai-help__notice">Assistente virtual da Tech Store.</p>
            {messages.map((message) => <div className={`ai-message ai-message--${message.author}`} key={message.id}>{message.author === 'assistant' && <span>IA</span>}<p>{message.text}</p></div>)}
          </div>

          <form className="ai-help__composer" onSubmit={sendMessage}>
            <label className="sr-only" htmlFor="ai-help-message">Mensagem para o assistente</label>
            <input id="ai-help-message" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Pergunte sobre um componente" />
            <button type="submit" aria-label="Enviar mensagem">➤</button>
          </form>
        </section>
      )}

      <button
        className="ai-help__launcher"
        type="button"
        aria-controls="ai-help-panel"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span aria-hidden="true">✦</span>
        {isOpen ? 'Fechar chat' : 'Ajuda com IA'}
      </button>
    </aside>
  )
}
