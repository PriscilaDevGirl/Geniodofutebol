import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ChatScreen } from "@/components/ChatScreen";
import { BrasileiraoDashboard } from "@/components/BrasileiraoDashboard";
import { SportsbookIntro } from "@/components/SportsbookIntro";

type Screen = "intro" | "welcome" | "chat" | "dashboard";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("intro");
  const [initialMessage, setInitialMessage] = useState<string | undefined>();

  const handlePickMatch = (match: string) => {
    setInitialMessage(match);
    setScreen("chat");
  };

  const handleStart = () => {
    setInitialMessage(undefined);
    setScreen("chat");
  };

  const handleVoiceStart = () => {
    setInitialMessage(undefined);
    setScreen("chat");
  };

  const handleOpenDashboard = () => {
    setScreen("dashboard");
  };

  const handleOpenChatFromDashboard = (message: string) => {
    setInitialMessage(message);
    setScreen("chat");
  };

  return (
    <AnimatePresence mode="wait">
      {screen === "intro" ? (
        <motion.div
          key="intro"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.3 }}
        >
          <SportsbookIntro onContinue={() => setScreen("welcome")} onVoiceStart={handleVoiceStart} />
        </motion.div>
      ) : screen === "welcome" ? (
        <motion.div
          key="welcome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <WelcomeScreen
            onStart={handleStart}
            onPickMatch={handlePickMatch}
            onOpenDashboard={handleOpenDashboard}
          />
        </motion.div>
      ) : screen === "dashboard" ? (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <BrasileiraoDashboard
            onBack={() => setScreen("welcome")}
            onOpenChat={handleOpenChatFromDashboard}
          />
        </motion.div>
      ) : (
        <motion.div
          key="chat"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.3 }}
          className="h-screen"
        >
          <ChatScreen
            initialMessage={initialMessage}
            onBack={() => setScreen("welcome")}
            onOpenDashboard={handleOpenDashboard}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Index;
