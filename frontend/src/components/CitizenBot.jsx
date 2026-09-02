import React, { useState } from 'react';
import { Bot, Send, Sparkles, ShieldAlert, CheckCircle2, Heart } from 'lucide-react';

export default function CitizenBot() {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "👋 Hi! I'm **BiteBot**, your AI Clean Food & Ingredient Advisor. Ask me anything about food additives, hidden sugars, palm oil, or whether a snack is safe for your family!"
    }
  ]);
  const [input, setInput] = useState('');

  const quickQuestions = [
    "Is Palm Oil bad for heart health?",
    "What is Maltodextrin in biscuits?",
    "How does FSSAI rate MSG (E621)?",
    "Recommend a healthy noodle without maida"
  ];

  const handleSend = (userQuery) => {
    const q = userQuery || input;
    if (!q.trim()) return;

    const newMsgs = [...messages, { sender: 'user', text: q }];
    setMessages(newMsgs);
    setInput('');

    // Smart responses based on query keywords
    setTimeout(() => {
      let reply = "I analyzed your question against FSSAI guidelines and nutrition databases.";
      const qLower = q.toLowerCase();

      if (qLower.includes("palm oil")) {
        reply = "⚠️ **Palm Oil Analysis:**\n\nPalm oil contains approx **50% saturated fatty acids** (primarily palmitic acid). Regular intake of processed palm oil in instant noodles and biscuits increases LDL cholesterol and cardiovascular risk. Under the TruthIn model, we recommend switching to cold-pressed mustard, peanut, or sunflower oil.";
      } else if (qLower.includes("maltodextrin") || qLower.includes("sugar")) {
        reply = "🍯 **Hidden Sugar Alert:**\n\nMaltodextrin has a Glycemic Index (GI) of **110 to 130**, which is higher than table sugar (GI 65)! It spikes blood sugar rapidly and is often disguised in 'healthy' muesli, baby foods, and energy bars.";
      } else if (qLower.includes("msg") || qLower.includes("e621")) {
        reply = "📜 **MSG (E621) Regulations:**\n\nFSSAI permits Monosodium Glutamate in restricted quantities with mandatory statutory labeling. It is strictly prohibited in food meant for infants below 12 months.";
      } else if (qLower.includes("noodle") || qLower.includes("alternative")) {
        reply = "🌿 **Clean Noodle Recommendations:**\n\n1. **The Whole Truth Whole Wheat Noodles** (Score: 9.2/10) — 0% Palm oil, 100% whole grain.\n2. **Slurrp Farm Millet Noodles** (Score: 8.8/10) — Air-baked millets, zero maida, no MSG.";
      } else {
        reply = "✅ **BiteScan AI Insight:**\n\nAlways check the top 3 ingredients on the back label. Under Indian Legal Metrology Rules, 2011, ingredients are listed in descending order by weight. If sugar or palmolein is in the top 3, the product is ultra-processed.";
      }

      setMessages([...newMsgs, { sender: 'bot', text: reply }]);
    }, 600);
  };

  return (
    <div className="space-y-4 pb-20 animate-fade max-w-2xl mx-auto flex flex-col h-[75vh]">
      
      {/* Bot Header */}
      <div className="bg-white rounded-3xl p-4 border border-oatmeal-dark shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-forest-soft text-forest flex items-center justify-center text-xl shadow-2xs">
          🤖
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-walnut flex items-center gap-1.5">
            <span>BiteBot AI Advisor</span>
            <span className="text-[9px] font-mono font-bold text-forest bg-forest-soft px-2 py-0.5 rounded-full">LIVE</span>
          </h3>
          <p className="text-[11px] text-slate">Powered by Gemini Vision & FSSAI Standards</p>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-white rounded-3xl border border-oatmeal-dark p-4 overflow-y-auto space-y-3 no-scrollbar">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-terracotta text-white rounded-br-xs'
                  : 'bg-oatmeal text-walnut rounded-bl-xs border border-oatmeal-dark'
              }`}
            >
              <div className="whitespace-pre-line font-medium">{m.text}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Prompts */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {quickQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(q)}
            className="shrink-0 px-3 py-1.5 bg-white border border-oatmeal-dark rounded-full text-[11px] font-medium text-slate hover:text-walnut hover:border-terracotta/40 transition-colors shadow-2xs"
          >
            💬 {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="bg-white rounded-2xl border border-oatmeal-dark p-1.5 flex items-center gap-2 shadow-xs">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask BiteBot about any ingredient or snack..."
          className="flex-1 px-3 py-2 text-xs font-medium text-walnut focus:outline-none placeholder:text-slate-light"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim()}
          className="w-9 h-9 bg-terracotta hover:bg-terracotta-hover text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
        >
          <Send size={15} />
        </button>
      </div>

    </div>
  );
}
