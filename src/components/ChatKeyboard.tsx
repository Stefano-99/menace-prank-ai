import { useEffect, useState } from "react";

const ROWS_LOWER = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["⇧", "z", "x", "c", "v", "b", "n", "m", "⌫"],
];

const ROWS_UPPER = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["⇧", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

const themes = {
  whatsapp: {
    bg: "bg-[#1b2b36]",
    key: "bg-[#2a3942] text-[#d1d7db]",
    pressed: "bg-[#00a884] text-[#0b141a]",
    space: "bg-[#2a3942] text-[#d1d7db]",
    spacePressed: "bg-[#3a4f5a] text-[#d1d7db]",
    special: "bg-[#1f2e37] text-[#d1d7db]",
    suggestions: false,
    uppercase: false,
  },
  ios: {
    bg: "",
    key: "text-white",
    pressed: "text-white",
    space: "text-white",
    spacePressed: "text-white",
    special: "text-white",
    suggestions: false,
    uppercase: false,
  },
};

interface Props {
  currentText: string;
  isActive: boolean;
  showAlways?: boolean;
  theme?: "whatsapp" | "ios";
}

export default function ChatKeyboard({ currentText, isActive, showAlways = false, theme = "whatsapp" }: Props) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const t = themes[theme];
  const isIOS = theme === "ios";
  const ROWS = t.uppercase ? ROWS_UPPER : ROWS_LOWER;

  useEffect(() => {
    if (!isActive || !currentText) {
      setActiveKey(null);
      return;
    }
    const lastChar = currentText[currentText.length - 1] || null;
    setActiveKey(lastChar);

    const timer = setTimeout(() => setActiveKey(null), 150);
    return () => clearTimeout(timer);
  }, [currentText, isActive]);

  if (!isActive && !showAlways) return null;

  const isKeyPressed = (key: string) => {
    if (!activeKey) return false;
    return key.toLowerCase() === activeKey.toLowerCase();
  };

  if (isIOS) {
    const keyBg = "#545456";
    const keyBgPressed = "#8e8e93";
    const specialBg = "#3a3a3c";
    const kbBg = "#1c1c1e";

    return (
      <div
        className="w-full px-[3px] pt-[6px] pb-[3px]"
        style={{ backgroundColor: kbBg }}
      >
        <div className="space-y-[11px]">
          {ROWS.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-[6px] px-[3px]">
              {ri === 1 && <div className="w-[14px] shrink-0" />}
              {row.map((key) => {
                const isSpecial = key === "⇧" || key === "⌫";
                const pressed = isKeyPressed(key);

                if (isSpecial) {
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-center shrink-0 transition-colors duration-75"
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 5,
                        backgroundColor: pressed ? keyBgPressed : specialBg,
                      }}
                    >
                      {key === "⌫" ? (
                        <svg width="22" height="17" viewBox="0 0 22 17" fill="none">
                          <path d="M7.5 0.5H21.5V16.5H7.5L0.5 8.5L7.5 0.5Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
                          <line x1="10.5" y1="5" x2="16" y2="12" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                          <line x1="16" y1="5" x2="10.5" y2="12" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <svg width="15" height="16" viewBox="0 0 15 16" fill="none">
                          <path d="M7.5 1L1 8.5H4.5V15H10.5V8.5H14L7.5 1Z" fill="white"/>
                        </svg>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={key}
                    className="relative flex items-center justify-center flex-1 transition-colors duration-75"
                    style={{
                      height: 42,
                      maxWidth: 33,
                      borderRadius: 5,
                      backgroundColor: pressed ? keyBgPressed : keyBg,
                      boxShadow: pressed
                        ? "none"
                        : "0 1px 0 0 rgba(0,0,0,0.35)",
                    }}
                  >
                    {pressed && (
                      <div
                        className="absolute flex items-center justify-center pointer-events-none"
                        style={{
                          bottom: "100%",
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: 48,
                          height: 52,
                          borderRadius: 9,
                          backgroundColor: "#636366",
                          marginBottom: 2,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                          zIndex: 50,
                          fontSize: 30,
                          fontWeight: 300,
                          color: "white",
                        }}
                      >
                        {key}
                      </div>
                    )}
                    <span
                      style={{
                        fontSize: 23,
                        fontWeight: 300,
                        color: "white",
                        lineHeight: 1,
                      }}
                    >
                      {key}
                    </span>
                  </div>
                );
              })}
              {ri === 1 && <div className="w-[14px] shrink-0" />}
            </div>
          ))}

          <div className="flex w-full gap-[6px] px-[3px]">
            <div
              className="flex items-center justify-center"
              style={{
                flex: 1,
                height: 42,
                borderRadius: 5,
                backgroundColor: specialBg,
                boxShadow: "0 1px 0 0 rgba(0,0,0,0.35)",
                fontSize: 15,
                color: "white",
              }}
            >
              123
            </div>
            <div
              className="flex items-center justify-center transition-colors duration-75"
              style={{
                flex: 3,
                height: 42,
                borderRadius: 5,
                backgroundColor: activeKey === " " ? keyBgPressed : keyBg,
                boxShadow: activeKey === " " ? "none" : "0 1px 0 0 rgba(0,0,0,0.35)",
                fontSize: 15,
                color: "white",
              }}
            >
              space
            </div>
            <div
              className="flex items-center justify-center"
              style={{
                flex: 1,
                height: 42,
                borderRadius: 5,
                backgroundColor: specialBg,
                boxShadow: "0 1px 0 0 rgba(0,0,0,0.35)",
                fontSize: 15,
                color: "white",
              }}
            >
              return
            </div>
          </div>
        </div>
      </div>
    );
  }

  // WhatsApp theme
  return (
    <div className={`w-full ${t.bg} pt-0 pb-[2px] px-[3px]`}>
      <div className="pt-[6px] space-y-[6px]">
        {ROWS.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-[5px] px-[2px]">
            {row.map((key) => {
              const isSpecial = key === "⇧" || key === "⌫";
              const pressed = isKeyPressed(key);
              return (
                <div
                  key={key}
                  className={`flex items-center justify-center rounded-[5px] text-[17px] font-normal transition-all duration-75
                    ${isSpecial ? "w-[38px]" : "flex-1 max-w-[35px]"} h-[42px]
                    ${pressed ? `${t.pressed} scale-110 -translate-y-[4px] shadow-lg` : isSpecial ? t.special : t.key}`}
                >
                  {key === "⌫" ? (
                    <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                      <path d="M7 1L1 8L7 15H19V1H7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M10.5 5.5L14.5 10.5M14.5 5.5L10.5 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  ) : key === "⇧" ? (
                    <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
                      <path d="M8 1L1 10H5V17H11V10H15L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    key
                  )}
                </div>
              );
            })}
          </div>
        ))}
        <div className="flex justify-center gap-[5px] px-[2px]">
          <div className={`w-[38px] h-[42px] flex items-center justify-center rounded-[5px] ${t.special} text-[16px]`}>
            123
          </div>
          <div className={`w-[34px] h-[42px] flex items-center justify-center rounded-[5px] ${t.special} text-[20px]`}>
            😊
          </div>
          <div className={`flex-1 h-[42px] flex items-center justify-center rounded-[5px] text-[15px] transition-all duration-75 ${activeKey === " " ? t.spacePressed : t.space}`}>
            English
          </div>
          <div className={`w-[70px] h-[42px] flex items-center justify-center rounded-[5px] ${t.special} text-[15px]`}>
            return
          </div>
        </div>
      </div>
    </div>
  );
}
