import { createContext, useContext, useState } from 'react';

interface PanelState {
  notificationsOpen: boolean;
  mentionsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  setMentionsOpen: (open: boolean) => void;
  closeAllPanels: () => void;
}

const PanelStateContext = createContext<PanelState | undefined>(undefined);

export function PanelStateProvider({ children }: { children: React.ReactNode }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mentionsOpen, setMentionsOpen] = useState(false);

  const closeAllPanels = () => {
    setNotificationsOpen(false);
    setMentionsOpen(false);
  };

  const handleSetNotificationsOpen = (open: boolean) => {
    setNotificationsOpen(open);
    if (open) {
      setMentionsOpen(false); // Close mentions panel when opening notifications
    }
  };

  const handleSetMentionsOpen = (open: boolean) => {
    setMentionsOpen(open);
    if (open) {
      setNotificationsOpen(false); // Close notifications panel when opening mentions
    }
  };

  return (
    <PanelStateContext.Provider
      value={{
        notificationsOpen,
        mentionsOpen,
        setNotificationsOpen: handleSetNotificationsOpen,
        setMentionsOpen: handleSetMentionsOpen,
        closeAllPanels,
      }}
    >
      {children}
    </PanelStateContext.Provider>
  );
}

export function usePanelState() {
  const context = useContext(PanelStateContext);
  if (context === undefined) {
    throw new Error('usePanelState must be used within a PanelStateProvider');
  }
  return context;
} 