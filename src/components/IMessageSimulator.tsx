import { useEffect, useRef } from "react";
import { ChatMessage } from "@/hooks/useChatPlayback";
import ChatKeyboard from "./ChatKeyboard";

interface Props {
  contactName: string;
  contactAvatar?: string | null;
  messages: ChatMessage[];
  isTyping: boolean;
  typingSender: "me" | "them";
  currentTypingText: string;
  showKeyboard?: boolean;
}

function formatTime() {
  const now = new Date();
  return now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function IMessageSimulator({
  contactName,
  contactAvatar,
  messages,
  isTyping,
  typingSender,
  currentTypingText,
  showKeyboard = false,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, currentTypingText]);

  return (
    <div className="w-[375px] h-[812px] mx-auto bg-black flex flex-col shrink-0 relative" style={{ fontFamily: '-apple-system, "SF Pro Text", "Helvetica Neue", sans-serif', overflow: 'hidden' }}>
      {/* iMessage header */}
      <div
        className="absolute top-0 left-0 w-full z-[100] flex flex-col"
        style={{
          backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 80%)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
        }}
      >
        {/* iOS Status bar */}
        <div className="flex items-center justify-between px-6 pt-[14px] pb-[6px] text-[15px] font-semibold text-white">
          <span>{formatTime()}</span>
          <div className="flex items-center gap-[5px]">
            <div className="flex gap-[3px] items-end">
              <div className="w-[3px] h-[4px] bg-white rounded-[0.5px]" />
              <div className="w-[3px] h-[6px] bg-white rounded-[0.5px]" />
              <div className="w-[3px] h-[9px] bg-white rounded-[0.5px]" />
              <div className="w-[3px] h-[12px] bg-white rounded-[0.5px]" />
            </div>
            <div className="w-[22px] h-[11px] border border-white rounded-[3px] relative ml-1">
              <div className="absolute inset-[1.5px] right-[2px] bg-white rounded-[1px]" />
              <div className="absolute -right-[3px] top-[2.5px] w-[1.5px] h-[5px] bg-white rounded-r-[1px]" />
            </div>
          </div>
        </div>

        {/* Header content */}
        <div className="flex items-center justify-between px-3 py-[8px]">
          <div className="flex items-center gap-[2px] text-[#0a84ff] min-w-[50px]">
            <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
              <path d="M9 1L1 9L9 17" stroke="#0a84ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[17px]">2</span>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="w-[40px] h-[40px] rounded-full bg-[#636366] flex items-center justify-center text-[18px] font-medium text-white overflow-hidden">
              {contactAvatar ? (
                <img src={contactAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                contactName[0]?.toUpperCase()
              )}
            </div>
            <p className="text-[13px] font-normal text-[#e5e5ea] mt-[3px]">{contactName}</p>
          </div>

          <div className="text-[#0a84ff] min-w-[50px] flex justify-end">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="6" width="13" height="12" rx="2" stroke="#0a84ff" strokeWidth="1.8"/>
              <path d="M16 10.5L21 7.5V16.5L16 13.5" stroke="#0a84ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-[16px] pb-3 hide-scrollbar"
        style={{ backgroundColor: "#000000", paddingTop: "100px" }}
      >
        {(() => {
          let lastMeIdx = -1;
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].sender === "me") { lastMeIdx = i; break; }
          }
          let secondLastMeIdx = -1;
          for (let i = lastMeIdx - 1; i >= 0; i--) {
            if (messages[i].sender === "me") { secondLastMeIdx = i; break; }
          }

          return messages.map((msg, idx) => {
            const prevMsg = messages[idx - 1];
            const nextMsg = messages[idx + 1];
            const isLastInGroup = !nextMsg || nextMsg.sender !== msg.sender;
            const sameSenderAsPrev = prevMsg && prevMsg.sender === msg.sender;
            const isMe = msg.sender === "me";
            const marginTop = idx === 0 ? "mt-[20px]" : sameSenderAsPrev ? "mt-[2px]" : "mt-[10px]";

            const tailClass = isLastInGroup
              ? isMe ? "imsg-tail-me" : "imsg-tail-them"
              : "imsg-no-tail";

            const showDelivered = idx === lastMeIdx;

            return (
              <div key={msg.id}>
                <div
                  className={`flex ${isMe ? "justify-end" : "justify-start"} ${marginTop} animate-message-in`}
                >
                  {msg.image ? (
                    <img src={msg.image} alt="" style={{ borderRadius: "1.15rem", maxWidth: "75%", width: 220, objectFit: "cover" as const }} />
                  ) : (
                    <div
                      className={`imsg-bubble ${isMe ? "imsg-me" : "imsg-them"} ${tailClass}`}
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
                {showDelivered && (
                  <div className="flex justify-end pr-[2px] mt-[2px]">
                    <span className="text-[11px] text-[#8e8e93] font-normal tracking-[-0.01em]">
                      Delivered
                    </span>
                  </div>
                )}
              </div>
            );
          });
        })()}

        {/* Typing indicator for "them" */}
        {isTyping && typingSender === "them" && (
          <div className="flex justify-start mt-[8px] animate-message-in">
            <div className="bg-[#26262a] px-[14px] py-[10px] rounded-[18px] rounded-bl-[4px] flex items-center gap-[5px]">
              <div className="w-[8px] h-[8px] rounded-full bg-[#8e8e93] typing-dot-1" />
              <div className="w-[8px] h-[8px] rounded-full bg-[#8e8e93] typing-dot-2" />
              <div className="w-[8px] h-[8px] rounded-full bg-[#8e8e93] typing-dot-3" />
            </div>
          </div>
        )}
      </div>

      {/* iOS input bar */}
      <div className="flex items-center gap-[8px] px-[10px] py-[8px]" style={{ backgroundColor: "#000000" }}>
        <div className="w-[30px] h-[30px] flex items-center justify-center shrink-0 rounded-full" style={{ backgroundColor: "#636366" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        <div
          className="flex-1 flex items-center rounded-full min-h-[36px] px-[14px] pr-[3px]"
          style={{ border: "1px solid #3a3a3c" }}
        >
          <div className="flex-1 text-[16px] text-white min-h-[20px]" style={{ fontWeight: 400 }}>
            {isTyping && typingSender === "me" ? (
              <span>
                {currentTypingText}
                <span className="inline-block w-[1.5px] h-[16px] bg-[#0a84ff] animate-pulse ml-[1px] align-text-bottom" />
              </span>
            ) : (
              <span style={{ color: "#8e8e93" }}>iMessage</span>
            )}
          </div>

          <div className="w-[28px] h-[28px] flex items-center justify-center shrink-0">
            {isTyping && typingSender === "me" ? (
              <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center" style={{ backgroundColor: "#0b84fe" }}>
                <svg width="13" height="15" viewBox="0 0 13 15" fill="none">
                  <path d="M6.5 13V2M6.5 2L1.5 7M6.5 2L11.5 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M19 10V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V10" stroke="#8e8e93" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 19V22" stroke="#8e8e93" strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="9" y="3" width="6" height="12" rx="3" stroke="#8e8e93" strokeWidth="1.5"/>
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Interactive keyboard */}
      <ChatKeyboard
        currentText={currentTypingText}
        isActive={isTyping && typingSender === "me"}
        showAlways={showKeyboard}
        theme="ios"
      />
    </div>
  );
}
