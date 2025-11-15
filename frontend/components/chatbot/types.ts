export interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: string;
  typing?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  lastActive: string;
}

export interface DefaultQuestion {
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}
