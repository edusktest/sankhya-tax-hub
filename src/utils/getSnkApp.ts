// Interface mínima do SnkApplication usada no projeto
export interface SnkApp {
   message: (title: string, msg: string, type: "success" | "error" | "warning" | "info") => void;
   alert: (title: string, msg: string) => void;
   getDataFetcher: () => Promise<{
      callServiceBroker: (service: string, params: unknown) => Promise<unknown>;
   }>;
}

// Mock para desenvolvimento local / Lovable
const devMockApp: SnkApp = {
   message: (title, msg, type) => console.log(`[snk:${type}] ${title}: ${msg}`),
   alert: (title, msg) => window.alert(`${title}\n${msg}`),
   getDataFetcher: async () => ({
      callServiceBroker: async (service, params) => {
         console.log(`[snk:mock] ServiceBroker → ${service}`, params);
         return {};
      },
   }),
};

let _snkApp: SnkApp | null = null;

// Chamar em onApplicationLoaded do SnkApplication ao integrar com o Sankhya:
//   <SnkApplication ref={appRef} onApplicationLoaded={() => setSnkApp(appRef.current)}>
export function setSnkApp(app: SnkApp) {
   _snkApp = app;
}

const getSnkApp = (): SnkApp => _snkApp ?? devMockApp;

export default getSnkApp;
