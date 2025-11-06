import AppRouter from "./router/AppRouter";
import Providers from "./providers";
import { useCartSync } from "./hooks/useCartSync";

function AppContent() {
  // Initialize cart synchronization
  useCartSync();
  
  return <AppRouter />;
}

export default function App() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  );
}
