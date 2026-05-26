import { GameProvider } from '@/lib/gameState'

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <GameProvider>{children}</GameProvider>
}
